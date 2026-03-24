import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../../_proxy";

function normalizeApiBaseUrl() {
  const raw =
    process.env.PRINT_BACKEND_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_PRINT_API_BASE_URL ||
    process.env.PRINT_BACKEND_BASE_URL ||
    "https://www.mrsmart.com.br";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const totemId = String(body?.totem_id || body?.totemId || "").trim();
  const storeId = String(body?.store_id || body?.storeId || "").trim();
  if (!totemId || !storeId) {
    return NextResponse.json(
      { error: "totem_id e store_id sao obrigatorios." },
      { status: 400 },
    );
  }

  const result = await callPrintingBackend({
    method: "POST",
    path: "/api/print/agent/enrollment/create",
    body: {
      totemId,
      storeId,
      agentId: body?.agent_id || body?.agentId || undefined,
      ttlMinutes: body?.ttl_minutes || body?.ttlMinutes || undefined,
      apiBaseUrl: body?.api_base_url || body?.apiBaseUrl || normalizeApiBaseUrl(),
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    success: Boolean(result.data?.success),
    code: result.data?.code ?? "PRINT_AGENT_ENROLLMENT_CREATED",
    enrollment_id: result.data?.enrollmentId ?? null,
    context: {
      store_id: result.data?.context?.storeId ?? null,
      totem_id: result.data?.context?.totemId ?? null,
      device_id: result.data?.context?.deviceId ?? null,
    },
    qr_payload: result.data?.qrPayload ?? null,
  });
}
