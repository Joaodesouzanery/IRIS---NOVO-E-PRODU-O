-- Migration 004: expande constraints de resultado e microtema
--
-- O schema inicial aceitava apenas 4 valores para resultado e 11 para microtema.
-- O NLP e a UI já suportam 11 e 13 valores respectivamente desde a Session 2.
-- Sem esta migração, INSERTs com 'Aprovado', 'Ratificado', 'adimplencia', etc.
-- falham com violação de constraint no Supabase/PostgreSQL.

-- ─── resultado ────────────────────────────────────────────────────────────────
ALTER TABLE deliberacoes
  DROP CONSTRAINT IF EXISTS deliberacoes_resultado_check;

ALTER TABLE deliberacoes
  ADD CONSTRAINT deliberacoes_resultado_check
  CHECK (resultado IN (
    'Deferido',
    'Indeferido',
    'Parcialmente Deferido',
    'Retirado de Pauta',
    'Ratificado',
    'Aprovado',
    'Aprovado com Ressalvas',
    'Aprovado por Unanimidade',
    'Recomendado',
    'Determinado',
    'Autorizado'
  ));

-- ─── microtema ────────────────────────────────────────────────────────────────
ALTER TABLE deliberacoes
  DROP CONSTRAINT IF EXISTS deliberacoes_microtema_check;

ALTER TABLE deliberacoes
  ADD CONSTRAINT deliberacoes_microtema_check
  CHECK (microtema IN (
    'tarifa',
    'obras',
    'multa',
    'contrato',
    'reequilibrio',
    'fiscalizacao',
    'seguranca',
    'ambiental',
    'desapropriacao',
    'adimplencia',
    'pessoal',
    'usuario',
    'outros'
  ));
