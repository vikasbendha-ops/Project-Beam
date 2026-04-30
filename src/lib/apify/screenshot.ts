import "server-only";
import { ApifyClient } from "apify-client";
import { createServiceClient } from "@/lib/supabase/service";

const ACTOR_ID =
  process.env.APIFY_SCREENSHOT_ACTOR_ID ?? "apify/screenshot-url";

interface KickArgs {
  markupId: string;
  sourceUrl: string;
  uploadedBy: string;
}

/**
 * Fire-and-forget: starts an Apify actor run that produces a full-page PNG
 * of `sourceUrl`. Apify hits our webhook when the run finishes; the webhook
 * downloads the PNG and persists it back to Supabase.
 */
export async function kickWebsiteScreenshot(args: KickArgs) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.warn(
      "[apify] APIFY_API_TOKEN not set — skipping screenshot for markup",
      args.markupId,
    );
    return;
  }

  try {
    const client = new ApifyClient({ token });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/apify/webhook?markup_id=${args.markupId}&uploaded_by=${args.uploadedBy}`;

    // Input shape is the schema for `apify/screenshot-url`. If you swap
    // actors, update this object — schema lookup at:
    // https://api.apify.com/v2/acts/<owner>~<actor>/builds/default
    await client.actor(ACTOR_ID).start(
      {
        urls: [{ url: args.sourceUrl }],
        format: "png",
        waitUntil: "networkidle2",
        viewportWidth: 1440,
        scrollToBottom: true,
        delayAfterScrolling: 2500,
      },
      {
        webhooks: [
          {
            eventTypes: [
              "ACTOR.RUN.SUCCEEDED",
              "ACTOR.RUN.FAILED",
              "ACTOR.RUN.TIMED_OUT",
              "ACTOR.RUN.ABORTED",
            ],
            requestUrl: webhookUrl,
          },
        ],
      },
    );
  } catch (err) {
    console.error("[apify] failed to start screenshot run", err);
  }
}

/**
 * Called by the webhook receiver — given a finished run, downloads the
 * screenshot PNG from Apify's key-value store and uploads it to the
 * `screenshots` bucket. Updates `markups.thumbnail_url` and writes a
 * markup_versions row.
 */
export async function persistRunScreenshot(args: {
  markupId: string;
  uploadedBy: string;
  runId: string;
  defaultKeyValueStoreId: string;
}) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN missing");
  }

  const client = new ApifyClient({ token });
  const store = client.keyValueStore(args.defaultKeyValueStoreId);

  // The screenshot-url actor stores screenshots under keys that start with
  // `screenshot_<urlhash>`. List keys and grab the first match.
  const list = await store.listKeys({ limit: 100 });
  const screenshotKey = list.items.find((k) =>
    k.key.startsWith("screenshot_"),
  )?.key;

  if (!screenshotKey) {
    throw new Error("No screenshot output found in Apify run");
  }

  const record = await store.getRecord(screenshotKey);
  if (!record?.value) {
    throw new Error("Screenshot record empty");
  }

  // record.value is typed as JsonValue by apify-client but for binary keys
  // it's actually Buffer | ArrayBuffer | Uint8Array. Cast through unknown.
  const value = record.value as unknown as
    | Buffer
    | ArrayBuffer
    | Uint8Array;
  const bytes =
    value instanceof Uint8Array
      ? value
      : value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : Buffer.isBuffer(value)
          ? new Uint8Array(value)
          : new Uint8Array();

  if (bytes.byteLength === 0) {
    throw new Error("Screenshot bytes empty");
  }

  const supabase = createServiceClient();

  const { data: markup } = await supabase
    .from("markups")
    .select("workspace_id")
    .eq("id", args.markupId)
    .single();
  if (!markup) throw new Error("Markup not found");

  const path = `${markup.workspace_id}/${args.markupId}/v1.png`;
  const { error: uploadError } = await supabase.storage
    .from("screenshots")
    .upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  // 1-year signed URL — refreshed by view-time logic when expired.
  const { data: signed } = await supabase.storage
    .from("screenshots")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  await supabase
    .from("markups")
    .update({ thumbnail_url: signed?.signedUrl ?? null })
    .eq("id", args.markupId);

  // Idempotent: a re-fired webhook should refresh, not duplicate, the row.
  await supabase
    .from("markup_versions")
    .upsert(
      {
        markup_id: args.markupId,
        version_number: 1,
        file_url: path,
        file_name: "screenshot.png",
        mime_type: "image/png",
        file_size: bytes.byteLength,
        uploaded_by: args.uploadedBy,
        is_current: true,
      },
      { onConflict: "markup_id,version_number" },
    );
}
