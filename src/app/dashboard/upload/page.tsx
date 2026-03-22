"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Agencia, BatchUploadResponse, JobStatus, UploadJobResult } from "@/types";
import {
  Upload, FileText, CheckCircle, XCircle, Clock,
  AlertTriangle, RefreshCw, Loader2, Copy,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; spin?: boolean }> = {
  pending: { label: "Na fila", color: "text-text-muted" },
  processing: { label: "Processando", color: "text-brand", spin: true },
  done: { label: "Concluído", color: "text-success" },
  failed: { label: "Falhou", color: "text-error" },
  retry: { label: "Tentando novamente", color: "text-warning", spin: true },
  done_with_warnings: { label: "Concluído c/ avisos", color: "text-warning" },
  queued: { label: "Na fila", color: "text-text-muted" },
  duplicate: { label: "Duplicado", color: "text-text-label" },
  rejected: { label: "Rejeitado", color: "text-error" },
  error: { label: "Erro", color: "text-error" },
};

function JobRow({ result }: { result: UploadJobResult }) {
  const { data: jobStatus } = useQuery({
    queryKey: ["job", result.job_id],
    queryFn: () => api.get<JobStatus>(`/upload/jobs/${result.job_id}`),
    enabled: !!result.job_id && result.status === "queued",
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (!s) return 3000;
      return ["done", "failed", "done_with_warnings"].includes(s) ? false : 3000;
    },
  });

  const liveStatus = jobStatus?.status ?? result.status;
  const cfg = STATUS_CONFIG[liveStatus] ?? STATUS_CONFIG.pending;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover transition-colors">
      {cfg.spin ? (
        <Loader2 className={cn("w-4 h-4 shrink-0 animate-spin", cfg.color)} />
      ) : liveStatus === "done" ? (
        <CheckCircle className="w-4 h-4 shrink-0 text-success" />
      ) : liveStatus === "failed" || liveStatus === "rejected" || liveStatus === "error" ? (
        <XCircle className="w-4 h-4 shrink-0 text-error" />
      ) : liveStatus === "done_with_warnings" ? (
        <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
      ) : liveStatus === "duplicate" ? (
        <Copy className="w-4 h-4 shrink-0 text-text-muted" />
      ) : (
        <Clock className="w-4 h-4 shrink-0 text-text-muted" />
      )}
      <span className="flex-1 text-sm text-text-secondary truncate">{result.filename}</span>
      <span className={cn("text-xs font-mono shrink-0", cfg.color)}>{cfg.label}</span>
      {(result.message ?? jobStatus?.error_message) && (
        <span
          className="text-xs text-error truncate max-w-[200px]"
          title={result.message ?? jobStatus?.error_message ?? ""}
        >
          {result.message ?? jobStatus?.error_message}
        </span>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [results, setResults] = useState<UploadJobResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; queued: number; rejected: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [agenciaId, setAgenciaId] = useState<string>("");

  const { data: agencias } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => api.get<Agencia[]>("/agencias"),
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      if (!agenciaId) {
        setUploadError("Selecione uma agência antes de enviar os PDFs.");
        return;
      }

      setUploading(true);
      setUploadError(null);
      setResults([]);
      setSummary(null);

      try {
        const formData = new FormData();
        formData.append("agencia_id", agenciaId);
        acceptedFiles.forEach((file) => formData.append("files", file));

        const response = await api.upload<BatchUploadResponse>("/upload/batch", formData);
        setResults(response.results);
        setSummary({ total: response.total, queued: response.queued, rejected: response.rejected });
      } catch (err: any) {
        setUploadError(err.message ?? "Erro ao enviar arquivos");
      } finally {
        setUploading(false);
      }
    },
    [agenciaId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1000,
    maxSize: 52_428_800,
    disabled: uploading,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Upload de PDFs</h1>
        <p className="text-sm text-text-muted mt-1">
          Envie até 1.000 PDFs por lote. Os arquivos são processados em fila automaticamente.
        </p>
      </div>

      {/* Seletor de agência */}
      <div className="card space-y-2">
        <label className="text-xs text-text-muted font-mono uppercase tracking-wider">
          Agência Reguladora *
        </label>
        <select
          className="input w-full"
          value={agenciaId}
          onChange={(e) => setAgenciaId(e.target.value)}
        >
          <option value="">Selecione a agência...</option>
          {(agencias ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.sigla} — {a.nome}
            </option>
          ))}
        </select>
        {(agencias ?? []).length === 0 && (
          <p className="text-xs text-text-label">
            Nenhuma agência cadastrada.{" "}
            <a href="/dashboard/agencias" className="text-brand underline">
              Cadastre uma primeiro.
            </a>
          </p>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-card p-12 text-center transition-all duration-200 cursor-pointer",
          isDragActive ? "border-brand bg-brand/5" : "border-border hover:border-brand/40 hover:bg-bg-card",
          uploading && "opacity-60 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn("w-10 h-10 mx-auto mb-4", isDragActive ? "text-brand" : "text-text-label")} />
        {isDragActive ? (
          <p className="text-brand font-medium">Solte os PDFs aqui</p>
        ) : uploading ? (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span>Enviando arquivos...</span>
          </div>
        ) : (
          <>
            <p className="text-text-primary font-medium">
              Arraste PDFs aqui ou{" "}
              <span className="text-brand underline">clique para selecionar</span>
            </p>
            <p className="text-xs text-text-muted mt-2">
              Apenas .pdf • Máx. 50 MB por arquivo • Até 1.000 arquivos por lote
            </p>
          </>
        )}
      </div>

      {/* Erro */}
      {uploadError && (
        <div className="flex items-start gap-3 p-4 rounded-md bg-error/10 border border-error/20">
          <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{uploadError}</p>
        </div>
      )}

      {/* Resultado do lote */}
      {summary && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-label">Resultado do Envio</p>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-text-secondary">
                Total: <strong className="text-text-primary">{summary.total}</strong>
              </span>
              <span className="text-success">
                Na fila: <strong>{summary.queued}</strong>
              </span>
              {summary.rejected > 0 && (
                <span className="text-error">
                  Rejeitados: <strong>{summary.rejected}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((r, i) => (
              <JobRow key={r.job_id ?? i} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
