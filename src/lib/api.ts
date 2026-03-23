// URL relativa — funciona identicamente em dev (localhost:3000) e produção (Vercel)
// Sem CORS, sem NEXT_PUBLIC_API_URL necessário
const BASE_URL = "/api";

// Quando Supabase não está configurado, usa dados demo automaticamente
const IS_DEMO =
  typeof window !== "undefined" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string): string {
  if (!IS_DEMO) return `${BASE_URL}/v1${path}`;
  const sep = path.includes("?") ? "&" : "?";
  return `${BASE_URL}/v1${path}${sep}demo=1`;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
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
    const url = buildUrl(path);
    const res = await fetch(url, {
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
