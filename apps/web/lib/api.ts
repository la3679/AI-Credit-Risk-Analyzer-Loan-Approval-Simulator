"use client";

function csrfToken() {
  return document.cookie.split("; ").find((value) => value.startsWith("credora_csrf="))?.split("=")[1];
}
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  const csrf = csrfToken();
  if (csrf && !["GET", "HEAD"].includes(init.method ?? "GET")) headers.set("x-csrf-token", csrf);
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? "The request could not be completed.");
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}
