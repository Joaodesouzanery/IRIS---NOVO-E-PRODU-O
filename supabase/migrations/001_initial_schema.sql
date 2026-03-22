-- =============================================================
-- IRIS Regulação — Schema inicial
-- Porta exata do backend/alembic/versions/001_initial_schema.py
-- =============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Agências ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agencias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sigla       VARCHAR(20)  NOT NULL UNIQUE,
  nome        VARCHAR(200) NOT NULL,
  nome_completo VARCHAR(500),
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Diretores ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diretores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(200) NOT NULL,
  nome_variantes TEXT[] NOT NULL DEFAULT '{}',
  agencia_id    UUID NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
  cargo         VARCHAR(100),
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  needs_review  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diretores_agencia ON diretores(agencia_id);

-- ─── Mandatos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mandatos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diretor_id   UUID NOT NULL REFERENCES diretores(id) ON DELETE CASCADE,
  data_inicio  DATE NOT NULL,
  data_fim     DATE,
  cargo        VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mandatos_diretor ON mandatos(diretor_id);

-- ─── Upload Jobs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upload_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename       VARCHAR(500) NOT NULL,
  file_hash      CHAR(64) UNIQUE,          -- SHA-256, deduplicação
  status         VARCHAR(30) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','done','failed','retry','done_with_warnings')),
  agencia_id     UUID REFERENCES agencias(id) ON DELETE SET NULL,
  storage_path   TEXT,                      -- caminho no Supabase Storage
  error_message  TEXT,
  retry_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_status    ON upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_agencia   ON upload_jobs(agencia_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_file_hash ON upload_jobs(file_hash);

-- ─── Deliberações ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliberacoes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agencia_id            UUID NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
  upload_job_id         UUID REFERENCES upload_jobs(id) ON DELETE SET NULL,

  -- Campos extraídos do PDF
  numero_deliberacao    VARCHAR(50),
  reuniao_ordinaria     VARCHAR(50),
  data_reuniao          DATE,
  interessado           VARCHAR(500),
  processo              VARCHAR(100),
  microtema             VARCHAR(30)
                          CHECK (microtema IN (
                            'tarifa','obras','multa','contrato',
                            'reequilibrio','fiscalizacao','seguranca',
                            'ambiental','desapropriacao','usuario','outros'
                          )),
  resultado             VARCHAR(20)
                          CHECK (resultado IN ('Deferido','Indeferido','Parcialmente Deferido','Retirado de Pauta')),
  pauta_interna         BOOLEAN NOT NULL DEFAULT FALSE,
  resumo_pleito         TEXT,
  fundamento_decisao    TEXT,

  -- Metadados de qualidade
  extraction_confidence FLOAT CHECK (extraction_confidence BETWEEN 0 AND 1),
  auto_classified       BOOLEAN NOT NULL DEFAULT FALSE,
  raw_text              TEXT,
  raw_extracted         JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliberacoes_agencia      ON deliberacoes(agencia_id);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_data         ON deliberacoes(data_reuniao);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_microtema    ON deliberacoes(microtema);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_resultado    ON deliberacoes(resultado);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_upload       ON deliberacoes(upload_job_id);
-- Full-text search com pg_trgm
CREATE INDEX IF NOT EXISTS idx_deliberacoes_raw_text_trgm
  ON deliberacoes USING GIN (raw_text gin_trgm_ops);

-- ─── Votos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliberacao_id  UUID NOT NULL REFERENCES deliberacoes(id) ON DELETE CASCADE,
  diretor_id      UUID NOT NULL REFERENCES diretores(id) ON DELETE CASCADE,
  tipo_voto       VARCHAR(20) NOT NULL
                    CHECK (tipo_voto IN ('Favoravel','Desfavoravel','Abstencao','Ausente')),
  is_divergente   BOOLEAN NOT NULL DEFAULT FALSE,
  is_nominal      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deliberacao_id, diretor_id)
);

CREATE INDEX IF NOT EXISTS idx_votos_deliberacao ON votos(deliberacao_id);
CREATE INDEX IF NOT EXISTS idx_votos_diretor     ON votos(diretor_id);

-- ─── Função updated_at automático ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_agencias_updated_at
  BEFORE UPDATE ON agencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_diretores_updated_at
  BEFORE UPDATE ON diretores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_upload_jobs_updated_at
  BEFORE UPDATE ON upload_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_deliberacoes_updated_at
  BEFORE UPDATE ON deliberacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────
-- Por enquanto sem auth, mas habilitamos RLS e criamos política aberta
-- Quando adicionar auth, basta trocar a política por uma restrita
ALTER TABLE agencias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE diretores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandatos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliberacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos          ENABLE ROW LEVEL SECURITY;

-- Política aberta (sem auth ainda) — acesso via service_role key no servidor
CREATE POLICY "allow_all_service_role" ON agencias     USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role" ON diretores    USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role" ON mandatos     USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role" ON upload_jobs  USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role" ON deliberacoes USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_role" ON votos        USING (true) WITH CHECK (true);
