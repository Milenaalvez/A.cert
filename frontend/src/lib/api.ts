const BASE = '/api/auth';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function register(name: string, email: string, password: string, captchaToken?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, captchaToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
  return data;
}

export async function reenviarConfirmacao(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/reenviar-confirmacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao reenviar');
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
  return data;
}

export async function me(token: string): Promise<User> {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuário');
  return data.user;
}

export function salvarToken(token: string) {
  localStorage.setItem('acert_token', token);
}

export function obterToken(): string | null {
  return localStorage.getItem('acert_token');
}

export function limparSessao() {
  localStorage.removeItem('acert_token');
}

export async function esqueciSenha(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/esqueci-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao solicitar redefinição');
  return data;
}

export async function verificarTokenRedefinir(token: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/verificar-token-redefinir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Token inválido');
  return data;
}

export async function redefinirSenha(token: string, password: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/redefinir-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha');
  return data;
}
