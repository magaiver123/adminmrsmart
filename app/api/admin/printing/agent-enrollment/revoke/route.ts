import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../../_proxy";

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const deviceId = String(body?.device_id || body?.deviceId || "").trim();
  if (!deviceId) {
    return NextResponse.json(
      { error: "device_id e obrigatorio." },
      { status: 400 },
    );
  }

  const result = await callPrintingBackend({
    method: "POST",
    path: "/api/print/agent/enrollment/revoke",
    body: {
      deviceId,
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    success: Boolean(result.data?.success),
    code: result.data?.code ?? "PRINT_AGENT_DEVICE_REVOKED",
    device: {
      device_id: result.data?.device?.deviceId ?? null,
      status: result.data?.device?.status ?? null,
      revoked_at: result.data?.device?.revokedAt ?? null,
    },
  });
}
