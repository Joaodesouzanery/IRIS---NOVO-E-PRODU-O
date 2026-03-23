"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Deliberacao } from "@/types";
import { formatDate, getMicrotemaLabel, cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, Pencil, Save, X } from "lucide-react";
import Link from "next/link";
import { getLocalDelibs, updateLocalDelib } from "@/lib/local-store";

const RESULTADOS = ["Deferido", "Indeferido", "Parcialmente Deferido", "Retirado de Pauta", "Ratificado", "Aprovado", "Aprovado com Ressalvas", "Aprovado por Unanimidade", "Recomendado", "Determinado", "Autorizado"];
const MICROTEMAS = ["tarifa", "obras", "multa", "contrato", "reequilibrio", "fiscalizacao", "seguranca", "ambiental", "desapropriacao", "adimplencia", "pessoal", "usuario", "outros"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-text-muted font-mono uppercase tracking-wider mb-0.5">{label}</p>
      {children}
    </div>
  );
}

export default function DeliberacaoDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState<Partial<Deliberacao>>({});
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isLocal = params.id.startsWith("local-");

  const { data: deliberacao, isLoading } = useQuery({
    queryKey: ["deliberacao", params.id],
    queryFn: () => {
      if (isLocal) {
        const found = getLocalDelibs().find((d) => d.id === params.id) ?? null;
        return Promise.resolve(found as Deliberacao | null);
      }
      return api.get<Deliberacao>(`/deliberacoes/${params.id}`);
    },
  });

  const startEdit = () => {
    if (!deliberacao) return;
    setForm({ ...deliberacao });
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!deliberacao) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (isLocal) {
        updateLocalDelib(params.id, form);
        await queryClient.invalidateQueries({ queryKey: ["deliberacao", params.id] });
      } else {
        const allowed = {
          numero_deliberacao:  form.numero_deliberacao,
          reuniao_ordinaria:   form.reuniao_ordinaria,
          data_reuniao:        form.data_reuniao,
          interessado:         form.interessado,
          processo:            form.processo,
          microtema:           form.microtema,
          resultado:           form.resultado,
          pauta_interna:       form.pauta_interna,
          resumo_pleito:       form.resumo_pleito,
          fundamento_decisao:  form.fundamento_decisao,
        };
        await api.patch(`/deliberacoes/${params.id}`, allowed);
        await queryClient.invalidateQueries({ queryKey: ["deliberacao", params.id] });
      }
      setEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(msg.includes("403") ? "Edição disponível apenas com Supabase configurado." : msg);
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof Deliberacao, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        Carregando...
      </div>
    );
  }

  if (!deliberacao) {
    return (
      <div className="text-center py-24">
        <p className="text-text-muted">Deliberação não encontrada</p>
        <Link href="/dashboard/deliberacoes" className="text-brand text-sm hover:underline mt-2 block">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/deliberacoes" className="btn-secondary py-1 px-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-text-muted font-mono">Deliberação</p>
          {editing ? (
            <input
              className="input text-xl font-semibold w-56"
              value={form.numero_deliberacao ?? ""}
              onChange={(e) => set("numero_deliberacao", e.target.value || null)}
              placeholder="Número da deliberação"
            />
          ) : (
            <h1 className="text-xl font-semibold text-text-primary">
              {deliberacao.numero_deliberacao ?? deliberacao.id.slice(0, 8)}
            </h1>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!editing && deliberacao.resultado && (
            <>
              {deliberacao.resultado === "Deferido" ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-error" />
              )}
              <span className={cn(
                "text-lg font-semibold",
                deliberacao.resultado === "Deferido" ? "text-success" : "text-error"
              )}>
                {deliberacao.resultado}
              </span>
            </>
          )}

          {editing ? (
            <>
              <button
                className="btn-secondary text-xs flex items-center gap-1.5"
                onClick={cancelEdit}
                disabled={saving}
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                className="btn-primary text-xs flex items-center gap-1.5"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          ) : (
            <button
              className="btn-secondary text-xs flex items-center gap-1.5"
              onClick={startEdit}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="card border-error/30 py-2 px-3 text-sm text-error">
          {saveError}
        </div>
      )}

      {/* Informações principais */}
      <div className="card">
        <p className="section-label mb-4">Informações da Reunião</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data da Reunião">
            {editing ? (
              <input
                type="date"
                className="input text-sm w-full font-mono"
                value={form.data_reuniao ?? ""}
                onChange={(e) => set("data_reuniao", e.target.value || null)}
              />
            ) : (
              <p className="text-sm text-text-primary">{formatDate(deliberacao.data_reuniao)}</p>
            )}
          </Field>

          <Field label="Processo">
            {editing ? (
              <input
                className="input text-sm w-full"
                value={form.processo ?? ""}
                onChange={(e) => set("processo", e.target.value || null)}
                placeholder="Número do processo"
              />
            ) : (
              <p className="text-sm text-text-primary">{deliberacao.processo ?? "—"}</p>
            )}
          </Field>

          <Field label="Reunião Ordinária">
            {editing ? (
              <input
                className="input text-sm w-full"
                value={form.reuniao_ordinaria ?? ""}
                onChange={(e) => set("reuniao_ordinaria", e.target.value || null)}
                placeholder="Ex: 321ª Reunião Ordinária"
              />
            ) : (
              <p className="text-sm text-text-primary">{deliberacao.reuniao_ordinaria ?? "—"}</p>
            )}
          </Field>

          <Field label="Interessado">
            {editing ? (
              <input
                className="input text-sm w-full"
                value={form.interessado ?? ""}
                onChange={(e) => set("interessado", e.target.value || null)}
                placeholder="Nome do interessado"
              />
            ) : (
              <p className="text-sm text-text-primary">{deliberacao.interessado ?? "—"}</p>
            )}
          </Field>

          <Field label="Microtema">
            {editing ? (
              <select
                className="select w-full text-sm"
                value={form.microtema ?? ""}
                onChange={(e) => set("microtema", e.target.value || null)}
              >
                <option value="">— Selecione —</option>
                {MICROTEMAS.map((m) => (
                  <option key={m} value={m}>{getMicrotemaLabel(m)}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-text-primary">
                {deliberacao.microtema ? getMicrotemaLabel(deliberacao.microtema) : "—"}
              </p>
            )}
          </Field>

          <Field label="Resultado">
            {editing ? (
              <select
                className="select w-full text-sm"
                value={form.resultado ?? ""}
                onChange={(e) => set("resultado", (e.target.value || null) as Deliberacao["resultado"])}
              >
                <option value="">— Selecione —</option>
                {RESULTADOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-text-primary">{deliberacao.resultado ?? "—"}</p>
            )}
          </Field>

          <Field label="Tipo de Pauta">
            {editing ? (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand"
                  checked={form.pauta_interna ?? false}
                  onChange={(e) => set("pauta_interna", e.target.checked)}
                />
                <span className="text-sm text-text-primary">Pauta Interna</span>
              </label>
            ) : (
              <p className="text-sm text-text-primary">
                {deliberacao.pauta_interna ? "Pauta Interna" : "Pauta Externa"}
              </p>
            )}
          </Field>

          <Field label="Confiança IA">
            <p className="text-sm text-text-primary">
              {deliberacao.extraction_confidence != null
                ? `${(deliberacao.extraction_confidence * 100).toFixed(0)}%`
                : "—"}
            </p>
          </Field>
        </div>
      </div>

      {/* Votos */}
      {deliberacao.votos && deliberacao.votos.length > 0 && (
        <div className="card">
          <p className="section-label mb-3">Votos</p>
          <div className="space-y-2">
            {deliberacao.votos.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-text-primary">{v.diretor_nome ?? v.diretor_id}</span>
                <div className="flex items-center gap-2">
                  {v.is_divergente && (
                    <span className="badge-red text-xs">Divergente</span>
                  )}
                  <span className={cn(
                    "badge text-xs",
                    v.tipo_voto === "Favoravel" ? "badge-green" :
                    v.tipo_voto === "Desfavoravel" ? "badge-red" :
                    "badge-gray"
                  )}>
                    {v.tipo_voto}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo do pleito */}
      <div className="card">
        <p className="section-label mb-3">Resumo do Pleito</p>
        {editing ? (
          <textarea
            className="input text-sm w-full leading-relaxed"
            rows={4}
            value={form.resumo_pleito ?? ""}
            onChange={(e) => set("resumo_pleito", e.target.value || null)}
            placeholder="Descreva o resumo do pleito..."
          />
        ) : (
          <p className="text-sm text-text-secondary leading-relaxed">
            {deliberacao.resumo_pleito ?? "—"}
          </p>
        )}
      </div>

      {/* Fundamento da decisão */}
      <div className="card">
        <p className="section-label mb-3">Fundamento da Decisão</p>
        {editing ? (
          <textarea
            className="input text-sm w-full leading-relaxed"
            rows={5}
            value={form.fundamento_decisao ?? ""}
            onChange={(e) => set("fundamento_decisao", e.target.value || null)}
            placeholder="Descreva o fundamento da decisão..."
          />
        ) : (
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {deliberacao.fundamento_decisao ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}
