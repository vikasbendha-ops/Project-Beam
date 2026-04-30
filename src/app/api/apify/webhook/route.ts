import { NextResponse, type NextRequest } from "next/server";
import { persistRunScreenshot } from "@/lib/apify/screenshot";

interface ApifyWebhookPayload {
  eventType?: string;
  eventData?: { actorId?: string; actorRunId?: string };
  resource?: {
    id?: string;
    status?: string;
    defaultKeyValueStoreId?: string;
  };
}

/**
 * Apify webhook endpoint.
 *
 * Apify POSTs here when a screenshot actor run reaches a terminal state.
 * The webhook URL embeds `markup_id` + `uploaded_by` in the query string
 * (set when we kicked the run). On SUCCESS we download the PNG from the
 * run's default key-value store, upload it to the `screenshots` bucket,
 * and update the markup row.
 *
 * Failures log + leave thumbnail_url null; the UI can prompt a retry.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const markupId = url.searchParams.get("markup_id");
  const uploadedBy = url.searchParams.get("uploaded_by");

  if (!markupId || !uploadedBy) {
    return NextResponse.json(
      { error: "markup_id and uploaded_by required" },
      { status: 400 },
    );
  }

  let payload: ApifyWebhookPayload;
  try {
    payload = (await request.json()) as ApifyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = payload.resource?.status ?? payload.eventType ?? "UNKNOWN";

  // Apify hits us for SUCCEEDED + the failure variants. Only persist on
  // SUCCEEDED — failures log so the operator can investigate.
  if (status !== "SUCCEEDED" && payload.eventType !== "ACTOR.RUN.SUCCEEDED") {
    console.warn(
      `[apify-webhook] non-success status for markup ${markupId}:`,
      status,
    );
    return NextResponse.json({ ok: true, ignored: true });
  }

  const runId = payload.resource?.id ?? payload.eventData?.actorRunId;
  const defaultKeyValueStoreId = payload.resource?.defaultKeyValueStoreId;
  if (!runId || !defaultKeyValueStoreId) {
    return NextResponse.json(
      { error: "Run id or default key-value store missing in payload" },
      { status: 400 },
    );
  }

  try {
    await persistRunScreenshot({
      markupId,
      uploadedBy,
      runId,
      defaultKeyValueStoreId,
    });
  } catch (err) {
    console.error(`[apify-webhook] persist failed for ${markupId}:`, err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Persist failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
