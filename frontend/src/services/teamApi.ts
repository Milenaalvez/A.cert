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

// ─── Team ───
export async function enriched() {
  const r = await fetch(`${BASE}/team/enriched`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function metrics() {
  const r = await fetch(`${BASE}/team/metrics`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function activityLogs() {
  const r = await fetch(`${BASE}/team/activities`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function create(data: Record<string, any>) {
  const r = await fetch(`${BASE}/team`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function update(id: string, data: Record<string, any>) {
  const r = await fetch(`${BASE}/team/${id}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function updateRole(id: string, role: string) {
  const r = await fetch(`${BASE}/team/${id}/role`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleRes(r);
}

export async function resendVerification(id: string) {
  const r = await fetch(`${BASE}/team/${id}/resend-verification`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleRes(r);
}

export async function updateStatus(id: string, active: boolean) {
  const r = await fetch(`${BASE}/team/${id}/status`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify({ active }),
  });
  return handleRes(r);
}

export async function resetPassword(id: string) {
  const r = await fetch(`${BASE}/team/${id}/reset-password`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleRes(r);
}

export async function remove(id: string) {
  const r = await fetch(`${BASE}/team/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return handleRes(r);
}

export async function getPermissions(id: string) {
  const r = await fetch(`${BASE}/team/${id}/permissions`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function updatePermissions(id: string, permissions: string[]) {
  const r = await fetch(`${BASE}/team/${id}/permissions`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({ permissions }),
  });
  return handleRes(r);
}

// ─── Justifications ───
export async function listJustifications() {
  const r = await fetch(`${BASE}/justifications`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function approveJustification(id: string) {
  const r = await fetch(`${BASE}/justifications/${id}/approve`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleRes(r);
}

export async function rejectJustification(id: string, reason?: string) {
  const r = await fetch(`${BASE}/justifications/${id}/reject`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleRes(r);
}

// ─── Time Records ───
export async function pendingReviews() {
  const r = await fetch(`${BASE}/time-records/pending-reviews`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function approveRecord(id: string, note?: string) {
  const r = await fetch(`${BASE}/time-records/${id}/approve`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ note }),
  });
  return handleRes(r);
}

export async function rejectRecord(id: string, note?: string) {
  const r = await fetch(`${BASE}/time-records/${id}/reject`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ note }),
  });
  return handleRes(r);
}

// ─── Reference ───
export async function departments() {
  const r = await fetch(`${BASE}/reference/departments`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function positions(departmentId: string) {
  const r = await fetch(`${BASE}/reference/positions?departmentId=${departmentId}`, {
    headers: await authHeaders(),
  });
  return handleRes(r);
}

// ─── Avatar ───
export async function userAuditLogs(userId: string) {
  const r = await fetch(`${BASE}/team/user-activities/${userId}`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function userDossiers(userId: string) {
  const r = await fetch(`${BASE}/team/user-dossiers/${userId}`, { headers: await authHeaders() });
  return handleRes(r);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('userId', userId);
  const token = obterToken();
  const r = await fetch(`${BASE}/upload/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await handleRes(r);
  return data.avatarUrl;
}

// ─── User info ───
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}
