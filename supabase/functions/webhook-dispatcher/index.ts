import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { generateWebhookSignature } from "../_shared/webhookSignature.ts";

Deno.serve(async () => {
  console.log("Webhook dispatcher running...");

  // Get pending webhook deliveries
  const { data: queueItems } = await supabaseAdmin
    .from("webhook_queue")
    .select("*, webhooks(*)")
    .eq("status", "pending")
    .lte("next_retry_at", new Date().toISOString())
    .limit(50);

  if (!queueItems || queueItems.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Processing ${queueItems.length} webhook deliveries`);

  const results = await Promise.allSettled(
    queueItems.map((item) => deliverWebhook(item)),
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return new Response(
    JSON.stringify({ processed: queueItems.length, successful, failed }),
    { headers: { "Content-Type": "application/json" } },
  );
});

async function deliverWebhook(queueItem: any) {
  const webhook = queueItem.webhooks;

  // Mark as processing
  await supabaseAdmin
    .from("webhook_queue")
    .update({ status: "processing" })
    .eq("id", queueItem.id);

  try {
    const payloadString = JSON.stringify(queueItem.payload);
    const signature = await generateWebhookSignature(
      webhook.secret,
      payloadString,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-Event": queueItem.event_type,
      "User-Agent": "AtomicCRM-Webhooks/1.0",
    };

    // Add custom headers from webhook config
    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (response.ok) {
      // Success
      await supabaseAdmin
        .from("webhook_queue")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", queueItem.id);

      await supabaseAdmin
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: 0,
        })
        .eq("id", webhook.id);

      console.log(`Webhook ${queueItem.id} delivered successfully`);
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`Webhook ${queueItem.id} delivery failed:`, error);

    const newAttempts = queueItem.attempts + 1;
    const shouldRetry = newAttempts < queueItem.max_attempts;

    if (shouldRetry) {
      // Exponential backoff: 1min, 5min, 15min
      const retryDelays = [60, 300, 900];
      const delaySeconds = retryDelays[newAttempts - 1] || 900;
      const nextRetry = new Date(
        Date.now() + delaySeconds * 1000,
      ).toISOString();

      await supabaseAdmin
        .from("webhook_queue")
        .update({
          status: "pending",
          attempts: newAttempts,
          next_retry_at: nextRetry,
          error_message: error.message,
        })
        .eq("id", queueItem.id);
    } else {
      // Max attempts reached
      await supabaseAdmin
        .from("webhook_queue")
        .update({
          status: "failed",
          attempts: newAttempts,
          error_message: error.message,
        })
        .eq("id", queueItem.id);

      await supabaseAdmin
        .from("webhooks")
        .update({ failure_count: webhook.failure_count + 1 })
        .eq("id", webhook.id);
    }
  }
}
