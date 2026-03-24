import { NextResponse } from "next/server";
import { backendErrorResponse, callPrintingBackend } from "../_proxy";

function mapTotemToSnake(totem: any) {
  return {
    id: totem?.id,
    name: totem?.name ?? null,
    status: totem?.status ?? "inactive",
    device_id: totem?.deviceId ?? null,
    maintenance_mode: Boolean(totem?.maintenanceMode),
    health_status: totem?.healthStatus ?? "unknown",
    pending_jobs: Number(totem?.pendingJobs ?? 0),
    failed_jobs: Number(totem?.failedJobs ?? 0),
    printer: totem?.printer ?? null,
  };
}

function mapDefaultsToSnake(defaults: any) {
  return {
    default_port: defaults?.defaultPort ?? 9100,
    default_escpos_profile: defaults?.defaultEscposProfile ?? "generic",
    default_paper_width_mm: defaults?.defaultPaperWidthMm ?? 80,
    heartbeat_interval_ms: defaults?.heartbeatIntervalMs ?? 10000,
    queue_claim_interval_ms: defaults?.queueClaimIntervalMs ?? 2500,
    max_retry_attempts: defaults?.maxRetryAttempts ?? 5,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");

  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 });
  }

  const result = await callPrintingBackend({
    path: "/api/print/admin/totem-printers",
    query: { storeId },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    defaults: mapDefaultsToSnake(result.data?.defaults),
    totems: Array.isArray(result.data?.totems)
      ? result.data.totems.map(mapTotemToSnake)
      : [],
  });
}

export async function PUT(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const storeId = String(body?.store_id || "").trim();
  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 });
  }

  const result = await callPrintingBackend({
    method: "PUT",
    path: "/api/print/admin/totem-printers",
    body: {
      storeId,
      totemId: body?.totem_id,
      connectionType: "tcp",
      ip: body?.ip,
      port: body?.port,
      model: body?.model,
      escposProfile: body?.escpos_profile,
      paperWidthMm: body?.paper_width_mm,
      isActive: body?.is_active,
    },
  });

  if (!result.ok) {
    return backendErrorResponse(result);
  }

  return NextResponse.json({
    success: true,
    printer: result.data?.printer ?? null,
  });
}
