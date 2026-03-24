import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../_proxy";

function normalizeLimit(value: string | null): number {
  if (!value) return 30;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return Math.min(parsed, 200);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");
  const limit = normalizeLimit(searchParams.get("limit"));
  const status = searchParams.get("status");
  const totemId = searchParams.get("totem_id");

  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 });
  }

  const result = await callPrintingBackend({
    path: "/api/print/admin/jobs",
    query: {
      storeId,
      limit,
      status: status ?? undefined,
      totemId: totemId ?? undefined,
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    jobs: Array.isArray(result.data?.jobs) ? result.data.jobs : [],
  });
}
