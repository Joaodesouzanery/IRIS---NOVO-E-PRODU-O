"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  Agencia,
  PreviewResult,
  PreviewResultFields,
  BatchPreviewResponse,
  BatchConfirmResponse,
  ConfirmDelib,
} from "@/types";
import {
  Upload, FileText, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronRight, Trash2, RefreshCw, Copy, AlertTriangle,
} from "lucide-react";
import { appendLocalDelibs } from "@/lib/local-store";

// ─── Constantes ─────────────────────────────────────────────────────────────

const BATCH_SIZE = 5; // PDFs por request — evita timeout e limite de payload Vercel

const RESULTADOS = [
  "Deferido", "Indeferido", "Parcialmente Deferido", "Retirado de Pauta",
  "Ratificado", "Aprovado", "Aprovado com Ressalvas", "Aprovado por Unanimidade",
  "Recomendado", "Determinado", "Autorizado",
] as const;

const MICROTEMAS = [
  "tarifa", "obras", "multa", "contrato", "reequilibrio",
  "fiscalizacao", "seguranca", "ambiental", "desapropriacao",
  "adimplencia", "pessoal", "usuario", "outros",
] as const;

// ─── Tipos locais ────────────────────────────────────────────────────────────

type Stage = "queue" | "analyzing" | "review" | "confirming" | "done";

interface QueuedFile {
  id: string;
  file: File;
  status: "pending" | "analyzing" | "done" | "error";
}

interface ReviewItem extends PreviewResult {
  id: string;
  rejected: boolean;
  edited: Partial<PreviewResultFields>;
}

interface AnalyzeProgress {
  done: number;
  total: number;
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

function confidenceColor(c: number) {
  if (c >= 0.8) return "text-success bg-success/10";
  if (c >= 0.5) return "text-warning bg-warning/10";
  return "text-error bg-error/10";
}

function confidenceLabel(c: number) {
  if (c >= 0.8) return "Alta";
  if (c >= 0.5) return "Média";
  return "Baixa";
}

function fmt(n: number) { return Math.round(n * 100) + "%"; }

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function mostCommon<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  const freq = new Map<T, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Componente: linha de arquivo na fila ──────────────────────────────────

function QueueRow({
  qf,
  onRemove,
}: {
  qf: QueuedFile;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover transition-colors group">
      {qf.status === "analyzing" ? (
        <Loader2 className="w-4 h-4 shrink-0 text-brand animate-spin" />
      ) : qf.status === "done" ? (
        <CheckCircle className="w-4 h-4 shrink-0 text-success" />
      ) : qf.status === "error" ? (
        <XCircle className="w-4 h-4 shrink-0 text-error" />
      ) : (
        <FileText className="w-4 h-4 shrink-0 text-text-label" />
      )}
      <span className="flex-1 text-sm text-text-secondary truncate">{qf.file.name}</span>
      <span className="text-xs text-text-label font-mono shrink-0">{fmtSize(qf.file.size)}</span>
      {qf.status === "pending" && (
        <button
          onClick={() => onRemove(qf.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-text-label
                     hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
          aria-label={`Remover ${qf.file.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Componente: card de revisão por arquivo ──────────────────────────────

function ReviewCard({
  item,
  onUpdate,
  onReject,
}: {
  item: ReviewItem;
  onUpdate: (id: string, patch: Partial<PreviewResultFields>) => void;
  onReject: (id: string) => void;
}) {
  const [open, setOpen] = useState(item.status !== "ok" && !item.rejected);
  const fields: PreviewResultFields = { ...item.fields, ...item.edited };

  function set<K extends keyof PreviewResultFields>(k: K, v: PreviewResultFields[K]) {
    onUpdate(item.id, { [k]: v } as Partial<PreviewResultFields>);
  }

  const conf = item.confidence;

  return (
    <div
      className={cn(
        "border rounded-card transition-all",
        item.rejected
          ? "border-border opacity-50"
          : item.is_duplicate
          ? "border-warning/40"
          : "border-border hover:border-brand/30"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none flex-wrap"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <ChevronDown className="w-4 h-4 shrink-0 text-text-label" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0 text-text-label" />
        )}

        <FileText className="w-4 h-4 shrink-0 text-text-label" />
        <span className="flex-1 text-sm text-text-primary font-medium truncate min-w-0">
          {item.filename}
        </span>

        {/* Badge duplicado */}
        {item.is_duplicate && (
          <span className="badge bg-warning/15 text-warning text-xs flex items-center gap-1">
            <Copy className="w-3 h-3" /> Já Processado
          </span>
        )}

        {/* Agência detectada */}
        {item.agencia_sigla_detected && (
          <span className="badge badge-green text-xs">{item.agencia_sigla_detected}</span>
        )}

        {/* Badge de confiança */}
        <span className={cn("badge text-xs font-mono px-2 py-0.5", confidenceColor(conf))}>
          {fmt(conf)} · {confidenceLabel(conf)}
        </span>

        {/* Resultado */}
        {fields.resultado && (
          <span className="badge badge-gray text-xs hidden sm:inline-flex">{fields.resultado}</span>
        )}

        {/* Botão rejeitar/restaurar */}
        <button
          onClick={(e) => { e.stopPropagation(); onReject(item.id); }}
          className={cn(
            "ml-1 px-2 py-1 rounded text-xs font-medium transition-colors shrink-0",
            item.rejected
              ? "bg-bg-hover text-text-secondary hover:text-text-primary"
              : "text-error hover:bg-error/10"
          )}
        >
          {item.rejected ? "Restaurar" : "Rejeitar"}
        </button>
      </div>

      {/* Formulário expandido */}
      {open && !item.rejected && (
        <div className="px-4 pb-4 border-t border-border space-y-4 pt-4">
          {item.status === "error" && item.error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-error/10 border border-error/20 text-sm text-error">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {item.error}
            </div>
          )}

          {item.is_duplicate && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20 text-sm text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              Este PDF já foi processado anteriormente. Confirme mesmo assim ou clique em "Rejeitar".
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Nº Deliberação</label>
              <input
                className="input"
                value={fields.numero_deliberacao ?? ""}
                onChange={(e) => set("numero_deliberacao", e.target.value || null)}
                placeholder="ex: 02"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Reunião</label>
              <input
                className="input"
                value={fields.reuniao_ordinaria ?? ""}
                onChange={(e) => set("reuniao_ordinaria", e.target.value || null)}
                placeholder="ex: 230ª Reunião Extraordinária"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Data da Reunião</label>
              <input
                type="date"
                className="input"
                value={fields.data_reuniao ?? ""}
                onChange={(e) => set("data_reuniao", e.target.value || null)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Processo</label>
              <input
                className="input"
                value={fields.processo ?? ""}
                onChange={(e) => set("processo", e.target.value || null)}
                placeholder="ex: SEI! nº 001.0036/2024-51"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Interessado</label>
              <input
                className="input"
                value={fields.interessado ?? ""}
                onChange={(e) => set("interessado", e.target.value || null)}
                placeholder="ex: Empresa XYZ Ltda."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Assunto</label>
              <input
                className="input"
                value={fields.assunto ?? ""}
                onChange={(e) => set("assunto", e.target.value || null)}
                placeholder="ex: Ratificação de Termo Aditivo..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Resultado</label>
              <select
                className="input"
                value={fields.resultado ?? ""}
                onChange={(e) =>
                  set("resultado", (e.target.value as PreviewResultFields["resultado"]) || null)
                }
              >
                <option value="">— não classificado —</option>
                {RESULTADOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-label font-mono uppercase tracking-wider">Microtema</label>
              <select
                className="input"
                value={fields.microtema}
                onChange={(e) => set("microtema", e.target.value)}
              >
                {MICROTEMAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={fields.pauta_interna}
                  onChange={(e) => set("pauta_interna", e.target.checked)}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-text-secondary">Pauta interna / administrativa</span>
              </label>
            </div>
          </div>

          {/* Métricas somente-leitura */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-text-label font-mono uppercase tracking-wider mb-1">Páginas</p>
              <p className="text-sm text-text-secondary font-mono">
                {item.page_count > 0 ? item.page_count : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-label font-mono uppercase tracking-wider mb-1">Chars/pág</p>
              <p className="text-sm text-text-secondary font-mono">
                {item.chars_per_page > 0 ? item.chars_per_page.toLocaleString("pt-BR") : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-label font-mono uppercase tracking-wider mb-1">Confiança IA</p>
              <p className={cn("text-sm font-mono font-medium", confidenceColor(conf))}>{fmt(conf)}</p>
            </div>
          </div>

          {/* Diretores detectados */}
          {fields.nomes_votacao.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-text-label font-mono uppercase tracking-wider mb-2">
                Diretores detectados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {fields.nomes_votacao.map((nome, i) => (
                  <span key={i} className="badge badge-gray text-xs">{nome}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>("queue");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [agenciaId, setAgenciaId] = useState<string>("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState<AnalyzeProgress>({ done: 0, total: 0 });
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [confirmResults, setConfirmResults] = useState<BatchConfirmResponse | null>(null);

  const { data: agencias } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => api.get<Agencia[]>("/agencias"),
  });

  // ── Etapa 1: Dropzone → fila ─────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setQueue((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending" as const,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1000,
    maxSize: 52_428_800,
    disabled: stage !== "queue",
  });

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  }

  function resetAll() {
    setStage("queue");
    setQueue([]);
    setAgenciaId("");
    setReviewItems([]);
    setAnalyzeError(null);
    setConfirmResults(null);
    setAnalyzeProgress({ done: 0, total: 0 });
  }

  // ── Etapa 2: Análise em lotes de BATCH_SIZE ──────────────────────────
  async function handleAnalyze() {
    if (!queue.length) return;
    setStage("analyzing");
    setAnalyzeError(null);

    const allFiles = [...queue];
    const allResults: PreviewResult[] = [];
    setAnalyzeProgress({ done: 0, total: allFiles.length });
    setQueue((prev) => prev.map((f) => ({ ...f, status: "analyzing" })));

    try {
      for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
        const batch = allFiles.slice(i, i + BATCH_SIZE);
        setAnalyzeProgress({ done: i, total: allFiles.length });

        const formData = new FormData();
        batch.forEach((qf) => formData.append("files", qf.file));

        const res = await api.upload<BatchPreviewResponse>("/upload/preview", formData);
        allResults.push(...res.results);

        // Atualiza status dos arquivos deste lote na fila
        setQueue((prev) =>
          prev.map((f) => {
            const batchIdx = batch.findIndex((b) => b.id === f.id);
            if (batchIdx === -1) return f;
            const r = res.results[batchIdx];
            return { ...f, status: !r || r.status === "error" ? "error" : "done" };
          })
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao analisar PDFs";
      setAnalyzeError(msg);
      setQueue((prev) =>
        prev.map((f) => ({ ...f, status: f.status === "analyzing" ? "error" : f.status }))
      );
      setStage("queue");
      return;
    }

    // Persiste hashes na sessionStorage (dedup para sessão demo)
    try {
      const seen: string[] = JSON.parse(
        sessionStorage.getItem("iris_seen_hashes") ?? "[]"
      );
      allResults.forEach((r) => {
        if (r.file_hash && !seen.includes(r.file_hash)) seen.push(r.file_hash);
      });
      sessionStorage.setItem("iris_seen_hashes", JSON.stringify(seen.slice(-500)));
    } catch {
      // sessionStorage pode estar indisponível — não é crítico
    }

    // Auto-seleciona agência majoritária detectada (só se usuário não selecionou)
    const detectedSiglas = allResults
      .map((r) => r.agencia_sigla_detected)
      .filter(Boolean) as string[];
    const majority = mostCommon(detectedSiglas);
    if (majority && !agenciaId) {
      const matched = (agencias ?? []).find((a) => a.sigla === majority);
      if (matched) setAgenciaId(matched.id);
    }

    // Monta review: duplicados auto-rejeitados mas restauráveis
    setReviewItems(
      allResults.map((r, i) => ({
        ...r,
        id: allFiles[i]?.id ?? crypto.randomUUID(),
        rejected: r.is_duplicate,
        edited: {},
      }))
    );
    setAnalyzeProgress({ done: allFiles.length, total: allFiles.length });
    setStage("review");
  }

  // ── Etapa 3: Revisão ─────────────────────────────────────────────────
  function updateReviewItem(id: string, patch: Partial<PreviewResultFields>) {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, edited: { ...item.edited, ...patch } } : item
      )
    );
  }

  function toggleReject(id: string) {
    setReviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rejected: !item.rejected } : item))
    );
  }

  const activeItems = reviewItems.filter((r) => !r.rejected && r.status !== "error");

  // ── Etapa 4: Confirmar ───────────────────────────────────────────────
  async function handleConfirm() {
    if (!activeItems.length) return;
    setStage("confirming");

    const deliberacoes: ConfirmDelib[] = activeItems.map((item) => {
      const fields: PreviewResultFields = { ...item.fields, ...item.edited };
      return {
        filename: item.filename,
        numero_deliberacao: fields.numero_deliberacao,
        reuniao_ordinaria: fields.reuniao_ordinaria,
        data_reuniao: fields.data_reuniao,
        interessado: fields.interessado,
        assunto: fields.assunto,
        processo: fields.processo,
        resultado: fields.resultado,
        microtema: fields.microtema,
        pauta_interna: fields.pauta_interna,
        resumo_pleito: fields.resumo_pleito,
        fundamento_decisao: fields.fundamento_decisao,
        nomes_votacao: fields.nomes_votacao,
        nomes_votacao_contra: fields.nomes_votacao_contra ?? [],
        extraction_confidence: item.confidence,
      };
    });

    try {
      const res = await api.post<BatchConfirmResponse>("/upload/confirm", {
        agencia_id: agenciaId,
        deliberacoes,
      });
      // Demo mode: persist returned deliberações in localStorage
      if (res.deliberacoes && res.deliberacoes.length > 0) {
        appendLocalDelibs(res.deliberacoes);
      }
      setConfirmResults(res);
      setStage("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao confirmar deliberações";
      setAnalyzeError(msg);
      setStage("review");
    }
  }

  // ── Progresso de análise em % ─────────────────────────────────────────
  const progressPct =
    analyzeProgress.total > 0
      ? (analyzeProgress.done / analyzeProgress.total) * 100
      : 0;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Upload de PDFs</h1>
          <p className="text-sm text-text-muted mt-1">
            Arraste os PDFs → analise com IA → revise os campos → confirme no sistema.
          </p>
        </div>

        {/* Indicador de etapa */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-label">
          {(["queue", "review", "done"] as Stage[]).map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span>›</span>}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full",
                  stage === s ||
                    (stage === "analyzing" && s === "queue") ||
                    (stage === "confirming" && s === "review")
                    ? "bg-brand/15 text-brand"
                    : "text-text-label"
                )}
              >
                {s === "queue" ? "1 Fila" : s === "review" ? "2 Revisão" : "3 Concluído"}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ETAPA 1 + 2: Fila e Análise ──────────────────────────────────── */}
      {(stage === "queue" || stage === "analyzing") && (
        <>
          {/* Seletor de agência */}
          <div className="card space-y-2">
            <label className="text-xs text-text-muted font-mono uppercase tracking-wider">
              Agência Reguladora
              {agenciaId && (
                <span className="ml-2 text-success normal-case tracking-normal font-sans">
                  ✓ auto-detectada
                </span>
              )}
            </label>
            <select
              className="input w-full"
              value={agenciaId}
              onChange={(e) => setAgenciaId(e.target.value)}
              disabled={stage === "analyzing"}
            >
              <option value="">Selecione a agência... (detectada automaticamente do PDF)</option>
              {(agencias ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.sigla} — {a.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-card p-12 text-center transition-all duration-200 cursor-pointer",
              isDragActive
                ? "border-brand bg-brand/5"
                : "border-border hover:border-brand/40 hover:bg-bg-card",
              stage === "analyzing" && "opacity-60 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <Upload
              className={cn("w-10 h-10 mx-auto mb-4", isDragActive ? "text-brand" : "text-text-label")}
            />
            {isDragActive ? (
              <p className="text-brand font-medium">Solte os PDFs aqui</p>
            ) : stage === "analyzing" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span>
                    Analisando lote {Math.floor(analyzeProgress.done / BATCH_SIZE) + 1} de{" "}
                    {Math.ceil(analyzeProgress.total / BATCH_SIZE)}...
                  </span>
                </div>
                <div className="w-full max-w-xs mx-auto bg-bg-hover rounded-full h-1.5">
                  <div
                    className="bg-brand h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-text-label font-mono">
                  {Math.min(analyzeProgress.done + BATCH_SIZE, analyzeProgress.total)}{" "}
                  de {analyzeProgress.total} arquivos
                </p>
              </div>
            ) : (
              <>
                <p className="text-text-primary font-medium">
                  Arraste PDFs aqui ou{" "}
                  <span className="text-brand underline">clique para selecionar</span>
                </p>
                <p className="text-xs text-text-muted mt-2">
                  Apenas .pdf · Máx. 50 MB por arquivo · Até 1.000 arquivos por lote
                </p>
              </>
            )}
          </div>

          {/* Erro de análise */}
          {analyzeError && (
            <div className="flex items-start gap-3 p-4 rounded-md bg-error/10 border border-error/20">
              <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{analyzeError}</p>
            </div>
          )}

          {/* Lista da fila */}
          {queue.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="section-label">
                  Na fila — {queue.length} arquivo{queue.length !== 1 ? "s" : ""}
                  {stage === "analyzing" && (
                    <span className="ml-2 text-brand normal-case tracking-normal font-sans">
                      processando em lotes de {BATCH_SIZE}...
                    </span>
                  )}
                </p>
                {stage === "queue" && (
                  <button
                    onClick={() => setQueue([])}
                    className="text-xs text-text-label hover:text-text-secondary transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {queue.map((qf) => (
                  <QueueRow key={qf.id} qf={qf} onRemove={removeFromQueue} />
                ))}
              </div>
            </div>
          )}

          {/* Botão Analisar */}
          {queue.length > 0 && stage === "queue" && (
            <div className="flex justify-end">
              <button onClick={handleAnalyze} className="btn-primary">
                <Upload className="w-4 h-4" />
                Analisar {queue.length} PDF{queue.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── ETAPA 3: Revisão ──────────────────────────────────────────────── */}
      {(stage === "review" || stage === "confirming") && (
        <>
          {/* Banner de resumo */}
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-text-primary font-medium">
                  {reviewItems.length} arquivo{reviewItems.length !== 1 ? "s" : ""} analisado{reviewItems.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {reviewItems.filter((r) => r.confidence >= 0.8).length} alta confiança ·{" "}
                  {reviewItems.filter((r) => r.confidence >= 0.5 && r.confidence < 0.8).length} média ·{" "}
                  {reviewItems.filter((r) => r.confidence < 0.5 && r.status !== "error").length} baixa ·{" "}
                  {reviewItems.filter((r) => r.is_duplicate).length} duplicados ·{" "}
                  {reviewItems.filter((r) => r.status === "error").length} com erro
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetAll}
                  disabled={stage === "confirming"}
                  className="btn-secondary text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Novo Upload
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={activeItems.length === 0 || stage === "confirming"}
                  className="btn-primary"
                >
                  {stage === "confirming" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Confirmar {activeItems.length} deliberaç{activeItems.length !== 1 ? "ões" : "ão"}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {analyzeError && (
            <div className="flex items-start gap-3 p-4 rounded-md bg-error/10 border border-error/20">
              <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{analyzeError}</p>
            </div>
          )}

          {/* Cards de revisão */}
          <div className="space-y-3">
            {reviewItems.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                onUpdate={updateReviewItem}
                onReject={toggleReject}
              />
            ))}
          </div>

          {/* Rodapé sticky */}
          {activeItems.length > 0 && (
            <div className="sticky bottom-4 flex justify-end pt-2">
              <button
                onClick={handleConfirm}
                disabled={stage === "confirming"}
                className="btn-primary shadow-lg"
              >
                {stage === "confirming" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Confirmar {activeItems.length} deliberaç{activeItems.length !== 1 ? "ões" : "ão"} →</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── ETAPA 4: Concluído ─────────────────────────────────────────────── */}
      {stage === "done" && confirmResults && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <p className="text-text-primary font-semibold">
                {confirmResults.created} deliberaç{confirmResults.created !== 1 ? "ões criadas" : "ão criada"}
              </p>
              {confirmResults.errors > 0 && (
                <p className="text-xs text-error mt-0.5">
                  {confirmResults.errors} falha{confirmResults.errors !== 1 ? "s" : ""} — veja abaixo
                </p>
              )}
              {confirmResults.deliberacoes && confirmResults.deliberacoes.length > 0 && (
                <p className="text-xs text-text-muted mt-0.5">
                  Salvo localmente — configure o Supabase para persistência permanente.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {confirmResults.results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover transition-colors"
              >
                {r.status === "created" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-error" />
                )}
                <span className="flex-1 text-sm text-text-secondary truncate">{r.filename}</span>
                {r.status === "created" && r.deliberacao_id ? (
                  <a
                    href={`/dashboard/deliberacoes/${r.deliberacao_id}`}
                    className="text-xs text-brand hover:underline font-mono shrink-0"
                  >
                    Ver deliberação →
                  </a>
                ) : r.error ? (
                  <span className="text-xs text-error truncate max-w-[200px]" title={r.error}>
                    {r.error}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <button onClick={resetAll} className="btn-primary">
              <RefreshCw className="w-4 h-4" />
              Novo Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
