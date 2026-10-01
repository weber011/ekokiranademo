import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentService } from "@/lib/services/payment-service";
import { prisma } from "@/lib/db/prisma";

// In-Memory processed webhooks set for zero-setup environment
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-eko-signature") || req.headers.get("x-signature");
    const webhookSecret = process.env.EKO_SECRET || "default_sandbox_secret";

    // 1. Webhook Signature Verification (when in production or signed)
    if (process.env.PAYMENT_PROVIDER === "eko" && process.env.EKO_SECRET) {
      if (!signature) {
        return NextResponse.json({ success: false, error: "Missing signature header" }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventId = payload.eventId || payload.transactionReference || payload.id;
    if (!eventId) {
      return NextResponse.json({ success: false, error: "Missing event identifier" }, { status: 400 });
    }

    // 2. Idempotency Check
    if (processedEvents.has(eventId)) {
      return NextResponse.json({
        success: true,
        message: "Webhook event already processed (idempotent duplicate skipped)",
        eventId,
      });
    }

    // Record in DB if available
    try {
      if (process.env.DATABASE_URL) {
        const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
        if (existing && existing.status === "PROCESSED") {
          return NextResponse.json({
            success: true,
            message: "Webhook event already processed in DB",
            eventId,
          });
        }

        await prisma.webhookEvent.upsert({
          where: { eventId },
          update: { status: "PROCESSING" as any },
          create: {
            eventId,
            provider: "Eko",
            eventType: payload.eventType || "PAYMENT_SETTLEMENT",
            payload,
            status: "PROCESSING" as any,
          },
        });
      }
    } catch (e) {
      console.warn("Prisma webhook event logging fallback:", e);
    }

    // 3. Process Payment Event
    const txRef = payload.transactionReference || payload.internalTransactionId;
    const paymentStatus = payload.status || (payload.success ? "SUCCESS" : "FAILED");

    if (txRef) {
      await PaymentService.confirmPaymentSettlement(txRef);
    }

    processedEvents.add(eventId);

    return NextResponse.json({
      success: true,
      message: "Webhook processed and payment ledger reconciled successfully",
      eventId,
      status: paymentStatus,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
