import { randomBytes } from 'node:crypto'

interface QRToken {
  token: string
  userId: string
  pointType: 'ENTRY' | 'BREAK_START' | 'BREAK_END' | 'EXIT'
  createdAt: number
  expiresAt: number
  used: boolean
}

const tokens = new Map<string, QRToken>()
const TOKEN_TTL_MS = 60_000 // 60 segundos

function cleanup() {
  const now = Date.now()
  for (const [key, t] of tokens) {
    if (now > t.expiresAt) tokens.delete(key)
  }
}

export function generateToken(userId: string, pointType: string): QRToken {
  cleanup()

  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  const qrToken: QRToken = {
    token,
    userId,
    pointType: pointType as QRToken['pointType'],
    createdAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    used: false,
  }
  tokens.set(token, qrToken)
  console.log(`[QRToken] Gerado para user=${userId} type=${pointType} token=${token.slice(0, 8)}...`)
  return qrToken
}

export function validateAndConsume(token: string): QRToken | null {
  cleanup()

  const t = tokens.get(token)
  if (!t) return null
  if (Date.now() > t.expiresAt) {
    tokens.delete(token)
    return null
  }
  if (t.used) return null

  t.used = true
  tokens.delete(token)
  console.log(`[QRToken] Consumido user=${t.userId} type=${t.pointType}`)
  return t
}

// Cleanup a cada 5 minutos
setInterval(cleanup, 5 * 60 * 1000)
