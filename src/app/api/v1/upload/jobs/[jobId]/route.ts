/**
 * GET /api/v1/upload/jobs/[jobId]
 * Retorna status de um job de upload.
 */

import { NextRequest, NextResponse } from "next/server";

function isDemo(req: NextRequest): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || req.nextUrl.searchParams.get("demo") === "1";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  if (isDemo(req)) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const db = createSupabaseServerClient();
  const { data, error } = await db
    .from("upload_jobs")
    .select("id, filename, status, error_message, created_at, updated_at")
    .eq("id", params.jobId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}
