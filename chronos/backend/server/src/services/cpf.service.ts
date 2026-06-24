const BRASIL_API_URL = 'https://brasilapi.com.br/api/cpf/v1'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function validateCPFWithGov(cpf: string): Promise<{
  valid: boolean
  name?: string
  situation?: string
  message?: string
}> {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) {
    return { valid: false, message: 'CPF deve ter 11 dígitos' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${BRASIL_API_URL}/${digits}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      if (body.message === 'CPF não encontrado na base de dados da Receita Federal') {
        return { valid: false, message: 'CPF não encontrado na Receita Federal' }
      }
      if (response.status === 429) {
        return { valid: false, message: 'Muitas consultas. Tente novamente em instantes.' }
      }
      return { valid: false, message: body.message || 'Erro ao consultar CPF na Receita Federal' }
    }

    const data = await response.json() as {
      nome?: string
      cpf?: string
      message?: string
      status?: string
    }

    if (data.status === 'ERROR') {
      return { valid: false, message: data.message || 'CPF não encontrado' }
    }

    return {
      valid: true,
      name: data.nome,
      message: 'CPF verificado com sucesso',
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { valid: false, message: 'A consulta do CPF excedeu o tempo limite. Tente novamente.' }
    }
    return { valid: false, message: 'Erro de conexão ao consultar CPF' }
  }
}

let lastRequestTime = 0
export async function validateCPFWithGovRateLimited(cpf: string): ReturnType<typeof validateCPFWithGov> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < 1000) {
    await delay(1000 - elapsed)
  }
  lastRequestTime = Date.now()
  return validateCPFWithGov(cpf)
}
