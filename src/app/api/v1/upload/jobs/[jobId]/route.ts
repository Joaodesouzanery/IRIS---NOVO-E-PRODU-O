/**
 * GET /api/v1/upload/jobs/[jobId]
 * Retorna status de um job de upload.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
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
