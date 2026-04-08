import { NextResponse } from "next/server"
import { callFridgeBackend } from "../../fridges/_proxy"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")
  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let active = true

      const send = (event: string, payload: unknown) => {
        if (!active) return
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      const sendSnapshot = async () => {
        const [diagnosticsResult, liveResult] = await Promise.all([
          callFridgeBackend({
            path: "/api/admin/locks/diagnostics",
            query: { storeId, limit: 25 },
          }),
          callFridgeBackend({
            path: "/api/admin/locks/live-status",
            query: { storeId },
          }),
        ])

        if (!diagnosticsResult.ok || !liveResult.ok) {
          send("error", {
            message: diagnosticsResult.data?.error || liveResult.data?.error || "Falha ao consultar status em tempo real.",
            code: diagnosticsResult.data?.code || liveResult.data?.code || null,
          })
          return
        }

        send("snapshot", {
          diagnostics: Array.isArray(diagnosticsResult.data?.diagnostics) ? diagnosticsResult.data.diagnostics : [],
          liveStatus: Array.isArray(liveResult.data?.items) ? liveResult.data.items : [],
          updatedAt: liveResult.data?.updatedAt ?? new Date().toISOString(),
        })
      }

      await sendSnapshot()
      const interval = setInterval(() => {
        void sendSnapshot()
      }, 4000)

      req.signal.addEventListener("abort", () => {
        active = false
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
