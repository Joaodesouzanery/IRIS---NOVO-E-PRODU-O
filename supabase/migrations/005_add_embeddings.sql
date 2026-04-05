-- =============================================================
-- IRIS Regulação — Migration 005: Busca semântica com pgvector
-- Requer: Supabase com extensão vector habilitada
-- (disponível em todos os projetos Supabase desde 2023)
-- =============================================================

-- Habilita a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Adiciona coluna de embedding (1536 dims = OpenAI text-embedding-3-small)
-- NULL para deliberações antigas que ainda não foram processadas
ALTER TABLE deliberacoes
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Índice IVFFlat para busca por similaridade coseno
-- lists = 100 é adequado para coleções de até ~1M de registros
-- Para coleções menores (< 10K), um índice HNSW é mais rápido:
-- CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)
CREATE INDEX IF NOT EXISTS idx_deliberacoes_embedding
  ON deliberacoes
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Função auxiliar para busca de deliberações similares
-- Retorna as N deliberações mais próximas por similaridade coseno
-- Uso: SELECT * FROM buscar_similares('[0.1, 0.2, ...]'::vector, 'uuid-agencia', 5)
CREATE OR REPLACE FUNCTION buscar_similares(
  query_embedding vector(1536),
  agencia_id_filter UUID DEFAULT NULL,
  limit_n INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  numero_deliberacao VARCHAR,
  data_reuniao DATE,
  interessado VARCHAR,
  assunto VARCHAR,
  resultado VARCHAR,
  microtema VARCHAR,
  similarity FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    d.id,
    d.numero_deliberacao,
    d.data_reuniao,
    d.interessado,
    d.assunto,
    d.resultado,
    d.microtema,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM deliberacoes d
  WHERE
    d.embedding IS NOT NULL
    AND (agencia_id_filter IS NULL OR d.agencia_id = agencia_id_filter)
  ORDER BY d.embedding <=> query_embedding
  LIMIT limit_n;
$$;
