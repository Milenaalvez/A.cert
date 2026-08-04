import { supabaseAdmin } from '../../database/supabase.js'
import { prisma } from '../../database/prisma.js'

const BUCKET = 'avatars'

async function ensureBucket() {
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (listError) {
      console.warn('[Avatar] Erro ao listar buckets, tentando criar direto:', listError.message)
    } else if (buckets?.find((b) => b.name === BUCKET)) {
      return
    }

    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
    })
    if (createError) {
      if (createError.message?.includes('already exists') || createError.message?.includes('already been created') || createError.message?.includes('duplicate')) {
        console.log('[Avatar] Bucket já existe')
      } else {
        console.warn('[Avatar] Erro ao criar bucket:', createError.message)
      }
    } else {
      console.log('[Avatar] Bucket criado com sucesso')
    }

    const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
    })
    if (updateError) {
      console.warn('[Avatar] Erro ao atualizar bucket (pode já estar público):', updateError.message)
    }
  } catch (err: any) {
    console.warn('[Avatar] Erro ao verificar/criar bucket:', err?.message || err)
    // Não quebra o upload - tenta fazer upload direto
  }
}

export async function uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string) {
  await ensureBucket()

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedMimes.includes(mimeType)) {
    throw Object.assign(new Error('Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.'), { statusCode: 400 })
  }

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/gif' ? 'gif' : 'jpg'
  const filePath = `${userId}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('[Avatar] Erro no upload:', uploadError.message)
    throw Object.assign(new Error('Erro ao fazer upload da imagem: ' + uploadError.message), { statusCode: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  const avatarUrl = urlData.publicUrl

  await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  })

  console.log(`[Avatar] Avatar atualizado para usuário ${userId}: ${avatarUrl}`)
  return { avatarUrl }
}
