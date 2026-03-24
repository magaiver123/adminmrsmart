import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../_proxy";

function mapSettingsToSnake(settings: any) {
  return {
    default_connection_type: settings?.defaultConnectionType ?? "tcp",
    default_port: settings?.defaultPort ?? 9100,
    default_escpos_profile: settings?.defaultEscposProfile ?? "generic",
    default_paper_width_mm: settings?.defaultPaperWidthMm ?? 80,
    queue_claim_interval_ms: settings?.queueClaimIntervalMs ?? 2500,
    heartbeat_interval_ms: settings?.heartbeatIntervalMs ?? 10000,
    max_retry_attempts: settings?.maxRetryAttempts ?? 5,
    updated_at: settings?.updatedAt ?? null,
  };
}

export async function GET() {
  const result = await callPrintingBackend({
    path: "/api/print/admin/global-settings",
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    settings: mapSettingsToSnake(result.data?.settings),
  });
}

export async function PUT(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const result = await callPrintingBackend({
    method: "PUT",
    path: "/api/print/admin/global-settings",
    body: {
      defaultConnectionType: body?.default_connection_type,
      defaultPort: body?.default_port,
      defaultEscposProfile: body?.default_escpos_profile,
      defaultPaperWidthMm: body?.default_paper_width_mm,
      queueClaimIntervalMs: body?.queue_claim_interval_ms,
      heartbeatIntervalMs: body?.heartbeat_interval_ms,
      maxRetryAttempts: body?.max_retry_attempts,
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    success: true,
    settings: mapSettingsToSnake(result.data?.settings),
  });
}
