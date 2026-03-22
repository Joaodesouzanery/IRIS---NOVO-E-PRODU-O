// URL relativa — funciona identicamente em dev (localhost:3000) e produção (Vercel)
// Sem CORS, sem NEXT_PUBLIC_API_URL necessário
const BASE_URL = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  // Upload especial: multipart/form-data (sem Content-Type)
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${BASE_URL}/v1${path}`, {
      method: "POST",
      body: formData,
      // Sem Content-Type — o browser define o boundary do multipart automaticamente
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Erro no upload" }));
      throw new ApiError(res.status, body.detail ?? res.statusText);
    }
    return res.json() as Promise<T>;
  },
};

export { ApiError };
