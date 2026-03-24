import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../_proxy";

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const storeId = String(body?.store_id || "").trim();
  const totemId = String(body?.totem_id || "").trim();

  if (!storeId || !totemId) {
    return NextResponse.json(
      { error: "store_id e totem_id sao obrigatorios." },
      { status: 400 }
    );
  }

  const result = await callPrintingBackend({
    method: "POST",
    path: "/api/print/admin/test-print",
    body: {
      storeId,
      totemId,
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    success: true,
    job: {
      id: result.data?.jobId ?? null,
      status: result.data?.jobStatus ?? null,
      created_at: new Date().toISOString(),
    },
    printer: result.data?.printer ?? null,
  });
}
