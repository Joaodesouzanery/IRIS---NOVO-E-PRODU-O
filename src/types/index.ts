// Tipos principais da plataforma IRIS Regulação

export type Microtema =
  | "tarifa" | "obras" | "multa" | "contrato" | "reequilibrio"
  | "fiscalizacao" | "seguranca" | "ambiental" | "desapropriacao"
  | "usuario" | "outros";

export type Resultado =
  | "Deferido"
  | "Indeferido"
  | "Parcialmente Deferido"
  | "Retirado de Pauta";

export interface Agencia {
  id: string;
  sigla: string;
  nome: string;
  nome_completo: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Diretor {
  id: string;
  nome: string;
  agencia_id: string | null;
  cargo: string | null;
  needs_review: boolean;
  created_at: string;
  mandatos?: Mandato[];
}

export interface Mandato {
  id: string;
  diretor_id: string;
  diretor_nome: string;
  agencia_id?: string;
  data_inicio: string;
  data_fim: string | null;
  cargo: string | null;
  status: "Ativo" | "Inativo";
  created_at?: string;
}

export interface VotoEmbutido {
  id: string;
  diretor_id: string;
  diretor_nome: string | null;
  tipo_voto: string;
  is_divergente: boolean;
  is_nominal: boolean;
}

export interface Deliberacao {
  id: string;
  numero_deliberacao: string | null;
  reuniao_ordinaria: string | null;
  processo: string | null;
  interessado: string | null;
  microtema: string | null;
  resultado: Resultado | null;
  pauta_interna: boolean;
  data_reuniao: string | null;
  agencia_id: string | null;
  auto_classified: boolean;
  extraction_confidence: number | null;
  created_at: string;
  resumo_pleito?: string | null;
  fundamento_decisao?: string | null;
  votos?: VotoEmbutido[];
}

export interface DeliberacaoPaginada {
  data: Deliberacao[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ─── Upload ──────────────────────────────────────────────────────────────

export interface UploadJobResult {
  filename: string;
  job_id: string | null;
  status: "queued" | "duplicate" | "rejected" | "error";
  message?: string;
}

export interface BatchUploadResponse {
  total: number;
  queued: number;
  rejected: number;
  results: UploadJobResult[];
}

export type JobStatusType =
  | "pending"
  | "processing"
  | "done"
  | "failed"
  | "retry"
  | "done_with_warnings";

export interface JobStatus {
  id: string;
  filename: string;
  status: JobStatusType;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────

export interface DashboardOverview {
  total_deliberacoes: number;
  deferidos: number;
  indeferidos: number;
  sem_resultado: number;
  taxa_deferimento: string;
  reunioes_unicas: number;
  avg_confidence: number;
  top_microtema: string | null;
}

export interface MicrotemaStats {
  microtema: string;
  total: number;
  deferido: number;
  indeferido: number;
  pct_deferido: number;
  pct_indeferido: number;
}

// ─── Votação ─────────────────────────────────────────────────────────────

export interface VotoMatrixRow {
  diretor_id: string;
  diretor_nome: string;
  favoravel: number;
  desfavoravel: number;
  abstencao: number;
  divergente: number;
  total: number;
}

export interface VotoDistribution {
  tipo_voto: string;
  count: number;
  pct: string;
}

export interface DiretorOverviewItem {
  diretor_id: string;
  diretor_nome: string;
  total: number;
  favoravel: number;
  desfavoravel: number;
  divergente: number;
  pct_favor: number;
}
