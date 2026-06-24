export function validarSenhaForte(password: string): { valida: boolean; erros: string[] } {
  const erros: string[] = [];
  if (password.length < 8) erros.push('Pelo menos 8 caracteres');
  if (!/[A-Z]/.test(password)) erros.push('Uma letra maiúscula');
  if (!/[a-z]/.test(password)) erros.push('Uma letra minúscula');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) erros.push('Um símbolo especial');
  return { valida: erros.length === 0, erros };
}

export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let resto = (sum * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  resto = (sum * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(digits[10]);
}

export function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  let sum = 0;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * w1[i];
  let resto = sum % 11;
  if (resto < 2) resto = 0; else resto = 11 - resto;
  if (resto !== parseInt(digits[12])) return false;
  sum = 0;
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * w2[i];
  resto = sum % 11;
  if (resto < 2) resto = 0; else resto = 11 - resto;
  return resto === parseInt(digits[13]);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefone(phone: string): boolean {
  const d = phone.replace(/\D/g, '');
  return d.length >= 10 && d.length <= 11;
}

export function validarCEP(cep: string): boolean {
  const d = cep.replace(/\D/g, '');
  return d.length === 8;
}
