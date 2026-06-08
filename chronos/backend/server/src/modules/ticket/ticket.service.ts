import { prisma } from '../../database/prisma.js'
import { supabaseAdmin } from '../../database/supabase.js'
import * as notificationService from '../notification/notification.service.js'
import type { TicketStatus, TicketCategory } from '../../generated/prisma/enums.js'
import { getEffectivePermissions } from '../../utils/permissions.js'
import { sendTicketCreatedEmail, sendTicketNewMessageEmail, sendTicketAssignedEmail, sendTicketUpdateEmail } from '../../services/email.js'

const BUCKET = 'tickets'

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    })
  }
}

async function findAssignee(companyId: string): Promise<string | null> {
  const users = await prisma.user.findMany({
    where: { companyId, isActive: true },
    select: { id: true, role: true, permissions: true, department: true },
  })
  const candidates = users.filter(u => {
    const perms = getEffectivePermissions(u.role, (u.permissions as string[] | null), u.department)
    return perms.includes('manage_tickets')
  })
  if (candidates.length === 0) return null
  const counts = await Promise.all(
    candidates.map(u =>
      prisma.ticket.count({
        where: { assignedTo: u.id, status: { in: ['ABERTO', 'EM_ANALISE', 'AGUARDANDO_RESPOSTA'] } },
      })
    )
  )
  let minIdx = 0
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] < counts[minIdx]) minIdx = i
  }
  return candidates[minIdx].id
}

async function generateProtocol(companyId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `SOL-${year}-`
  const all = await prisma.ticket.findMany({
    where: {
      companyId,
      protocol: { startsWith: prefix },
    },
    select: { protocol: true },
  })
  let maxSeq = 0
  for (const t of all) {
    const n = parseInt(t.protocol.split('-')[2] || '0', 10)
    if (n > maxSeq) maxSeq = n
  }
  const seq = String(maxSeq + 1).padStart(5, '0')
  return `${prefix}${seq}`
}

async function uploadFile(file: Express.Multer.File, ticketId: string): Promise<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number }> {
  await ensureBucket()
  const ext = file.originalname.split('.').pop() || 'bin'
  const filePath = `tickets/${ticketId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(filePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  })
  if (error) throw Object.assign(new Error('Erro ao fazer upload do arquivo'), { statusCode: 500 })
  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath)
  return {
    fileUrl: urlData.publicUrl,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.buffer.length,
  }
}

async function canManage(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: true, department: true },
  })
  if (!u) return false
  const perms = getEffectivePermissions(u.role, u.permissions as string[] | null, u.department)
  return perms.includes('manage_tickets')
}

export async function listTickets(userId: string, role: string, companyId: string, assignedToMe?: boolean) {
  const isManager = await canManage(userId)
  const where: any = { companyId }
  if (assignedToMe && isManager) {
    where.assignedTo = userId
  } else if (!isManager) {
    where.userId = userId
  }
  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      _count: { select: { messages: true, attachments: true } },
    },
  })
}

export async function getTicketById(id: string, userId: string, role: string, companyId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatar: true, email: true } },
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
      },
      attachments: true,
    },
  })
  if (!ticket) return null
  if (ticket.companyId !== companyId) return null
  const isManager = await canManage(userId)
  if (!isManager && ticket.userId !== userId) return null
  return ticket
}

export async function createTicket(
  userId: string,
  companyId: string,
  data: { title: string; description: string; category: string; subcategory?: string },
  file?: Express.Multer.File,
) {
  const assignedTo = await findAssignee(companyId)

  let ticket: any
  let protocol
  for (let attempt = 0; attempt < 5; attempt++) {
    protocol = await generateProtocol(companyId)
    try {
      ticket = await prisma.ticket.create({
        data: {
          protocol,
          title: data.title,
          description: data.description,
          category: data.category as TicketCategory,
          subcategory: data.subcategory || '',
          userId,
          companyId,
          assignedTo,
        },
      })
      break
    } catch (err: any) {
      if (err.code === 'P2002' && attempt < 4) {
        await new Promise(r => setTimeout(r, 50))
        continue
      }
      throw err
    }
  }

  if (file) {
    const fileData = await uploadFile(file, ticket!.id)
    await prisma.ticketAttachment.create({
      data: { ...fileData, ticketId: ticket!.id },
    })
  }

  prisma.activityLog.create({
    data: {
      userId,
      action: 'TICKET_CREATE',
      description: `Solicitação ${protocol} criada`,
      entityType: 'Ticket',
      entityId: ticket!.id,
      metadata: { category: data.category },
    },
  }).catch(() => {})

  if (assignedTo) {
    notificationService.createNotification(assignedTo, {
      title: 'Nova solicitação',
      message: `${ticket!.protocol} - ${ticket!.title}`,
      type: 'INFO',
      link: `/solicitacoes/${ticket!.id}`,
    }).catch(() => {})

    const assigneeUser = await prisma.user.findUnique({
      where: { id: assignedTo },
      select: { email: true, name: true },
    })
    if (assigneeUser?.email) {
      const requester = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      })
      sendTicketCreatedEmail(
        assigneeUser.email,
        requester?.name || 'Colaborador',
        ticket!.protocol,
        ticket!.title,
        ticket!.id,
        data.category,
      ).catch((err) => console.error('[Email] Erro ao notificar responsável:', err))
    }
  }

  return prisma.ticket.findUnique({
    where: { id: ticket!.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, email: true } },
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      attachments: true,
    },
  })
}

export async function addTicketMessage(
  ticketId: string,
  userId: string,
  role: string,
  companyId: string,
  message: string,
  file?: Express.Multer.File,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return null
  if (ticket.companyId !== companyId) return null
  const isManager = await canManage(userId)
  if (!isManager && ticket.userId !== userId) return null

  const msg = await prisma.ticketMessage.create({
    data: { ticketId, userId, message },
    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
  })

  if (file) {
    const fileData = await uploadFile(file, ticketId)
    await prisma.ticketAttachment.create({
      data: { ...fileData, ticketId },
    })
  }

  const updateData: any = {}
  if (isManager && !ticket.assignedTo) {
    updateData.assignedTo = userId
  }
  if (ticket.status === 'AGUARDANDO_RESPOSTA' && isManager) {
    updateData.status = 'EM_ANALISE'
  }
  if (ticket.status === 'EM_ANALISE' && !isManager) {
    updateData.status = 'AGUARDANDO_RESPOSTA'
  }
  if (Object.keys(updateData).length > 0) {
    await prisma.ticket.update({ where: { id: ticketId }, data: updateData })
  }

  const notifyUserId = isManager ? ticket.userId : (ticket.assignedTo || ticket.userId)
  if (notifyUserId !== userId) {
    notificationService.createNotification(notifyUserId, {
      title: 'Nova mensagem',
      message: `${ticket.protocol} - ${message.slice(0, 100)}`,
      type: 'INFO',
      link: `/solicitacoes/${ticketId}`,
    }).catch(() => {})

    const notifyUser = await prisma.user.findUnique({
      where: { id: notifyUserId },
      select: { email: true, name: true },
    })
    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })
    if (notifyUser?.email) {
      sendTicketNewMessageEmail(
        notifyUser.email,
        notifyUser.name,
        ticket.protocol,
        ticket.title,
        message,
        ticketId,
        author?.name || 'Usuário',
      ).catch((err) => console.error('[Email] Erro ao notificar mensagem:', err))
    }
  }

  prisma.activityLog.create({
    data: {
      userId,
      action: 'TICKET_MESSAGE',
      description: `Mensagem enviada em ${ticket.protocol}`,
      entityType: 'Ticket',
      entityId: ticketId,
    },
  }).catch(() => {})

  return {
    message: msg,
    assignee: isManager && !ticket.assignedTo
      ? { id: userId, name: msg.user.name, avatar: msg.user.avatar, role: msg.user.role }
      : null,
    status: updateData.status || null,
  }
}

export async function assignTicket(ticketId: string, userId: string, companyId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return null
  if (ticket.companyId !== companyId) return null
  if (!(await canManage(userId))) return null

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedTo: userId,
      status: ticket.status === 'ABERTO' ? 'EM_ANALISE' : ticket.status,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, email: true } },
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      },
      attachments: true,
    },
  })

  if (ticket.userId !== userId) {
    notificationService.createNotification(ticket.userId, {
      title: 'Solicitação acolhida',
      message: `${ticket.protocol} - ${updated.assignee?.name || 'Alguém'} está analisando sua solicitação`,
      type: 'INFO',
      link: `/solicitacoes/${ticketId}`,
    }).catch(() => {})

    const requester = await prisma.user.findUnique({
      where: { id: ticket.userId },
      select: { email: true, name: true },
    })
    if (requester?.email && updated.assignee?.name) {
      sendTicketAssignedEmail(
        requester.email,
        requester.name,
        ticket.protocol,
        ticket.title,
        updated.assignee.name,
        ticketId,
      ).catch((err) => console.error('[Email] Erro ao notificar atribuição:', err))
    }
  }

  prisma.activityLog.create({
    data: {
      userId,
      action: 'TICKET_ASSIGN',
      description: `${ticket.protocol} atribuído a ${updated.assignee?.name || 'responsável'}`,
      entityType: 'Ticket',
      entityId: ticketId,
      newValue: userId,
    },
  }).catch(() => {})

  return updated
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  message: string | undefined,
  userId: string,
  role: string,
  companyId: string,
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  if (!ticket) return null
  if (ticket.companyId !== companyId) return null
  if (!(await canManage(userId))) return null

  const resolver = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  const resolverName = resolver?.name || 'Responsável'

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: status as TicketStatus },
    include: {
      user: { select: { id: true, name: true, avatar: true, email: true } },
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      },
      attachments: true,
    },
  })

  if (message) {
    await prisma.ticketMessage.create({
      data: { ticketId, userId, message },
    })
  }

  const statusLabel: Record<string, string> = { ABERTO: 'Aberto', EM_ANALISE: 'Em Análise', AGUARDANDO_RESPOSTA: 'Aguardando Resposta', RESOLVIDO: 'Resolvido', ENCERRADO: 'Encerrado' }
  const notifMsg = message
    ? `${ticket.protocol} - ${statusLabel[status] || status} por ${resolverName}: "${message.slice(0, 80)}"`
    : `${ticket.protocol} - ${statusLabel[status] || status} por ${resolverName}`
  notificationService.createNotification(ticket.userId, {
    title: 'Solicitação atualizada',
    message: notifMsg,
    type: 'INFO',
    link: `/solicitacoes/${ticketId}`,
  }).catch(() => {})

  sendTicketUpdateEmail(
    ticket.user.email,
    ticket.user.name,
    ticket.protocol,
    ticket.title,
    status,
    message,
    ticketId,
  ).catch((err) => console.error('[Email] Erro ao notificar atualização de status:', err))

  prisma.activityLog.create({
    data: {
      userId,
      action: 'TICKET_STATUS',
      description: `Status de ${ticket.protocol} alterado para ${status}`,
      entityType: 'Ticket',
      entityId: ticketId,
      oldValue: ticket.status,
      newValue: status,
    },
  }).catch(() => {})

  return updated
}
