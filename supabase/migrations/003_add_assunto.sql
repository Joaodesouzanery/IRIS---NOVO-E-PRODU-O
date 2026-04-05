-- Migration 003: adiciona coluna assunto à tabela deliberacoes
-- O campo 'assunto' é extraído pelo NLP mas não tinha coluna própria no banco.
-- Ele representa a "manchete" da deliberação (ex: "Ratificação de reajuste tarifário").

ALTER TABLE deliberacoes
  ADD COLUMN IF NOT EXISTS assunto VARCHAR(500);

-- Índice para buscas por assunto
CREATE INDEX IF NOT EXISTS idx_deliberacoes_assunto
  ON deliberacoes (assunto)
  WHERE assunto IS NOT NULL;
