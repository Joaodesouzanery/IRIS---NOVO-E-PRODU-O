// Tipos principais da plataforma IRIS Regulação

export type Microtema =
  | "tarifa" | "obras" | "multa" | "contrato" | "reequilibrio"
  | "fiscalizacao" | "seguranca" | "ambiental" | "desapropriacao"
  | "adimplencia" | "pessoal" | "usuario" | "outros";

export type Resultado =
  | "Deferido"
  | "Indeferido"
  | "Parcialmente Deferido"
  | "Retirado de Pauta"
  | "Ratificado"
  | "Aprovado"
  | "Aprovado com Ressalvas"
  | "Aprovado por Unanimidade"
  | "Recomendado"
  | "Determinado"
  | "Autorizado";

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
  assunto?: string | null;
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
  status: "queued" | "done" | "duplicate" | "rejected" | "error";
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
  auto_classified_pct: number;
  pauta_externa: number;
  pauta_interna_count: number;
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

export interface MandatosStats {
  diretores_ativos: number;
  participacoes_colegiadas: number;
  taxa_consenso: string;
  total_deliberacoes: number;
}

export interface VotoSector {
  microtema: string;
  count: number;
}

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

// ─── Perfil de Diretor ────────────────────────────────────────────────────

export interface DiretorProfile {
  id: string;
  nome: string;
  cargo: string | null;
  agencia_id: string | null;
  agencia_sigla: string | null;
  mandato: {
    data_inicio: string;
    data_fim: string | null;
    status: "Ativo" | "Inativo";
    dias_restantes: number | null;
  };
  stats: {
    total_votos: number;
    favoravel: number;
    desfavoravel: number;
    abstencao: number;
    divergente: number;
    pct_favoravel: number;
    pct_divergente: number;
  };
  por_microtema: Array<{ microtema: string; total: number }>;
  historico: Array<{
    deliberacao_id: string;
    numero_deliberacao: string | null;
    data_reuniao: string | null;
    interessado: string | null;
    microtema: string | null;
    resultado: string | null;
    tipo_voto: string;
    is_divergente: boolean;
  }>;
  tendencias: {
    perfil: "Consensual" | "Moderadamente divergente" | "Divergente";
    microtema_dominante: string | null;
    taxa_aprovacao: string;
    descricao: string;
  };
}

export interface DecisaoTipo {
  resultado: string;
  count: number;
  pct: number;
}

export interface MandatosAnalytics {
  total_deliberacoes: number;
  taxa_litigio: string;
  taxa_consenso: string;
  taxa_sancao: string;
  distribuicao_decisao: DecisaoTipo[];
  evolucao_mensal: Array<{
    period: string;
    total: number;
    deferido: number;
    indeferido: number;
  }>;
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

// ─── Upload Preview / Confirm ─────────────────────────────────────────────

export interface PreviewResultFields {
  numero_deliberacao: string | null;
  reuniao_ordinaria: string | null;
  data_reuniao: string | null;
  interessado: string | null;
  assunto: string | null;
  processo: string | null;
  resultado: string | null;
  microtema: string;
  pauta_interna: boolean;
  resumo_pleito: string | null;
  fundamento_decisao: string | null;
  nomes_votacao: string[];
  nomes_votacao_contra: string[];
}

export interface PreviewResult {
  filename: string;
  status: "ok" | "low_confidence" | "error";
  error?: string;
  fields: PreviewResultFields;
  confidence: number;
  page_count: number;
  chars_per_page: number;
  file_hash: string;
  is_duplicate: boolean;
  duplicate_job_id: string | null;
  agencia_id_detected: string | null;
  agencia_sigla_detected: string | null;
}

export interface BatchPreviewResponse {
  results: PreviewResult[];
}

export interface ConfirmDelib {
  filename: string;
  numero_deliberacao: string | null;
  reuniao_ordinaria: string | null;
  data_reuniao: string | null;
  interessado: string | null;
  assunto: string | null;
  processo: string | null;
  resultado: string | null;
  microtema: string | null;
  pauta_interna: boolean;
  resumo_pleito: string | null;
  fundamento_decisao: string | null;
  nomes_votacao: string[];
  nomes_votacao_contra: string[];
  extraction_confidence: number;
}

export interface ConfirmResult {
  filename: string;
  status: "created" | "error";
  deliberacao_id?: string;
  error?: string;
}

export interface BatchConfirmResponse {
  created: number;
  errors: number;
  results: ConfirmResult[];
  deliberacoes?: Deliberacao[];
}
