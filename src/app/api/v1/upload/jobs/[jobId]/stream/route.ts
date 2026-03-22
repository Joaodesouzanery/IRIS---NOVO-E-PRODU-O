/**
 * GET /api/v1/upload/jobs/[jobId]/stream
 * Server-Sent Events — status em tempo real do job de processamento.
 */

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function isDemo(req: NextRequest): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || req.nextUrl.searchParams.get("demo") === "1";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  // Em modo demo, não há jobs reais
  if (isDemo(req)) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Job não encontrado", jobId })}\n\n`)
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const db = createSupabaseServerClient();
      const TERMINAL_STATUSES = ["done", "failed", "done_with_warnings"];
      const POLL_INTERVAL = 2000;
      let attempts = 0;
      const MAX_ATTEMPTS = 150; // 5 minutos máximo

      while (attempts < MAX_ATTEMPTS) {
        const { data: job } = await db
          .from("upload_jobs")
          .select("id, filename, status, error_message, updated_at")
          .eq("id", jobId)
          .single();

        if (!job) {
          send({ error: "Job não encontrado", jobId });
          break;
        }

        send({
          job_id: job.id,
          filename: job.filename,
          status: job.status,
          error_message: job.error_message,
          updated_at: job.updated_at,
        });

        if (TERMINAL_STATUSES.includes(job.status)) break;

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
      }

      if (attempts >= MAX_ATTEMPTS) {
        send({ error: "Timeout: processamento excedeu 5 minutos", jobId });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
