-- =============================================================
-- IRIS Regulação — Migration 002
-- Expande resultado CHECK, adiciona colunas assunto/procedencia/tipo_reuniao,
-- corrige microtema CHECK (faltavam adimplencia e pessoal).
-- =============================================================

-- 1. Expandir resultado CHECK (de 4 para 11 valores) + aumentar VARCHAR
ALTER TABLE deliberacoes DROP CONSTRAINT IF EXISTS deliberacoes_resultado_check;
ALTER TABLE deliberacoes ALTER COLUMN resultado TYPE VARCHAR(30);
ALTER TABLE deliberacoes ADD CONSTRAINT deliberacoes_resultado_check
  CHECK (resultado IN (
    'Deferido','Indeferido','Parcialmente Deferido','Retirado de Pauta',
    'Ratificado','Aprovado','Aprovado com Ressalvas','Aprovado por Unanimidade',
    'Recomendado','Determinado','Autorizado'
  ));

-- 2. Corrigir microtema CHECK (adicionar adimplencia e pessoal)
ALTER TABLE deliberacoes DROP CONSTRAINT IF EXISTS deliberacoes_microtema_check;
ALTER TABLE deliberacoes ADD CONSTRAINT deliberacoes_microtema_check
  CHECK (microtema IN (
    'tarifa','obras','multa','contrato','reequilibrio','fiscalizacao',
    'seguranca','ambiental','desapropriacao','adimplencia','pessoal',
    'usuario','outros'
  ));

-- 3. Adicionar novas colunas extraidas do PDF
ALTER TABLE deliberacoes ADD COLUMN IF NOT EXISTS assunto TEXT;
ALTER TABLE deliberacoes ADD COLUMN IF NOT EXISTS procedencia VARCHAR(200);
ALTER TABLE deliberacoes ADD COLUMN IF NOT EXISTS tipo_reuniao VARCHAR(20)
  CHECK (tipo_reuniao IN ('Ordinaria','Extraordinaria'));
ALTER TABLE deliberacoes ADD COLUMN IF NOT EXISTS decisoes_todas TEXT[];
ALTER TABLE deliberacoes ADD COLUMN IF NOT EXISTS numero_reuniao VARCHAR(10);
