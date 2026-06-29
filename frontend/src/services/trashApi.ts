"use client";

import { obterToken } from "@/lib/api";

const BASE = "/api";

async function authHeaders(): Promise<Record<string, string>> {
  const token = obterToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleRes(r: Response) {
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(body.error || `HTTP ${r.status}`);
  }
  return r.json();
}

export async function listTrash(type?: string) {
  const params = type ? `?type=${type}` : "";
  const r = await fetch(`${BASE}/trash${params}`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function getTrashItem(entity: string, id: string) {
  const r = await fetch(`${BASE}/trash/${entity}/${id}`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function restoreTrashItem(entity: string, id: string) {
  const r = await fetch(`${BASE}/trash/${entity}/${id}/restore`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleRes(r);
}

export async function permanentDelete(entity: string, id: string) {
  const r = await fetch(`${BASE}/trash/${entity}/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return handleRes(r);
}
