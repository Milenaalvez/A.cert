import type { Response, NextFunction, Request } from 'express'
import type { AuthRequest } from '../../middleware/auth.js'
import { listPointRecords, createPointRecord } from './pointRecord.service.js'
import { generateToken, validateAndConsume } from './qr-token.service.js'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const includePhoto = req.query.includePhoto === 'true'
    const userId = req.query.userId as string | undefined
    // Managers can query by userId; employees only see their own
    const targetUserId = (userId && (req.user!.role === 'RH' || req.user!.role === 'ADMIN'))
      ? userId
      : req.user!.userId
    const events = await listPointRecords(targetUserId, req.user!.companyId, req.query.date as string | undefined, includePhoto)
    res.json(events)
  } catch (err) { next(err) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { pointType, timeValue, date, latitude, longitude, locationAccuracy, locationAddress, locationCity, locationState, deviceInfo, photoData, hasPhoto, password, faceVerified } = req.body
    if (!pointType || !timeValue) {
      res.status(400).json({ error: 'pointType e timeValue são obrigatórios' })
      return
    }
    if (!['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT'].includes(pointType)) {
      res.status(400).json({ error: 'Tipo de ponto inválido' })
      return
    }
    const event = await createPointRecord(req.user!.userId, {
      pointType,
      timeValue,
      date,
      latitude,
      longitude,
      locationAccuracy,
      locationAddress,
      locationCity,
      locationState,
      deviceInfo: { ...(deviceInfo || {}), ip: req.ip || req.socket.remoteAddress || 'unknown' },
      photoData,
      hasPhoto,
      password,
      faceVerified,
    })
    res.status(201).json(event)
  } catch (err) { next(err) }
}

export async function generateQrToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { pointType } = req.body
    if (!pointType || !['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT'].includes(pointType)) {
      res.status(400).json({ error: 'Tipo de ponto inválido' })
      return
    }
    const qrToken = generateToken(req.user!.userId, pointType)
    res.json({
      token: qrToken.token,
      pointType: qrToken.pointType,
      expiresIn: 60,
    })
  } catch (err) { next(err) }
}

export async function qrCheckin(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body
    if (!token) {
      res.status(400).json({ error: 'Token obrigatório' })
      return
    }

    const qrToken = validateAndConsume(token)
    if (!qrToken) {
      res.status(400).json({ error: 'QR Code inválido ou expirado' })
      return
    }

    const now = new Date()
    const timeValue = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const dateStr = now.toISOString().split('T')[0]

    const event = await createPointRecord(qrToken.userId, {
      pointType: qrToken.pointType,
      timeValue,
      date: dateStr,
      deviceInfo: { browser: 'QR Code', os: 'Mobile', ip: req.ip || req.socket.remoteAddress || 'unknown' },
      qrVerified: true,
    })
    res.status(201).json({ success: true, event })
  } catch (err) { next(err) }
}

const LABEL_MAP: Record<string, string> = {
  ENTRY: 'Entrada',
  BREAK_START: 'Saída para intervalo',
  BREAK_END: 'Retorno do intervalo',
  EXIT: 'Saída',
}

export async function qrCheckinPage(req: Request, res: Response) {
  const token = req.query.t as string
  if (!token) {
    res.status(400).send(htmlPage('error', 'QR Code inválido', 'Nenhum token encontrado.'))
    return
  }

  try {
    const qrToken = validateAndConsume(token)
    if (!qrToken) {
      res.status(400).send(htmlPage('error', 'QR Code inválido ou expirado', 'O código expirou ou já foi usado.'))
      return
    }

    const now = new Date()
    const timeValue = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const dateStr = now.toISOString().split('T')[0]

    await createPointRecord(qrToken.userId, {
      pointType: qrToken.pointType,
      timeValue,
      date: dateStr,
      deviceInfo: { browser: 'QR Code', os: 'Mobile', ip: req.ip || req.socket.remoteAddress || 'unknown' },
      qrVerified: true,
    })

    res.send(htmlPage('success', 'Ponto Registrado!', LABEL_MAP[qrToken.pointType] || qrToken.pointType, timeValue))
  } catch (err: any) {
    console.error('[QR Checkin] Erro:', err?.message || err)
    res.status(500).send(htmlPage('error', 'Erro', err?.message || 'Erro ao registrar ponto.'))
  }
}

function htmlPage(type: 'success' | 'error', title: string, subtitle: string, timeValue?: string): string {
  const color = type === 'success' ? '#10B981' : '#EF4444'
  const bg = type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
  const icon = type === 'success'
    ? '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12l3 3 5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M15 9l-6 6M9 9l6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'

  const timeBox = timeValue
    ? `<div style="background:${bg};border:1px solid ${color}20;border-radius:14px;padding:16px 20px;margin-top:24px">
        <p style="color:${color};font-size:14px;font-weight:600;margin:0">${subtitle}</p>
        <p style="color:#F9FAFB;font-size:32px;font-weight:800;margin:4px 0 0;font-family:monospace">${timeValue}</p>
      </div>`
    : `<p style="color:#9CA3AF;font-size:14px;margin:16px 0 0">${subtitle}</p>`

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chronos — ${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0A0E17;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,-apple-system,sans-serif;padding:16px}.card{background:#111827;border:1px solid #1F2937;border-radius:20px;padding:40px 32px;text-align:center;max-width:360px;width:100%}svg{width:56px;height:56px;color:${color};margin-bottom:20px}h2{color:#F9FAFB;font-size:20px;font-weight:700}p.sub{color:#9CA3AF;font-size:13px;margin-top:8px}</style></head><body><div class="card"><svg viewBox="0 0 24 24" fill="none">${icon}</svg><h2>${title}</h2>${timeBox}</div></body></html>`
}
