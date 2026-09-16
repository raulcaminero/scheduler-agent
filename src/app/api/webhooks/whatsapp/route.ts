import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage, type IncomingMessage } from "@/lib/bookingFlow";
import { verifyWebhookSignature } from "@/lib/whatsapp";

// Webhook Verification (GET) — Meta Cloud API challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "smartschedule_secret_verify_token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Ingest Incoming WhatsApp Messages (POST)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[Webhook] Invalid signature received");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const fromPhone = message.from as string;
    const profileName: string | null = contact?.profile?.name || null;

    // ── Parse message type ───────────────────────────────────────────────────
    let incoming: IncomingMessage;

    if (message.type === "text") {
      incoming = {
        type: "text",
        text: message.text?.body || "",
      };
    } else if (message.type === "interactive") {
      const interactiveType = message.interactive?.type as "list_reply" | "button_reply";
      const reply =
        message.interactive?.list_reply || message.interactive?.button_reply;

      incoming = {
        type: "interactive",
        interactiveType,
        replyId: reply?.id || "",
        replyTitle: reply?.title || "",
        text: reply?.title || "",
      };
    } else {
      // Unsupported message type (image, audio, etc.)
      console.log(`[Webhook] Unsupported message type: ${message.type} from ${fromPhone}`);
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    // ── Resolve organization via Meta Cloud API metadata ─────────────────────
    const metadataPhoneId = value?.metadata?.phone_number_id;
    const metadataDisplayPhone = value?.metadata?.display_phone_number;

    let org = null;

    if (metadataPhoneId || metadataDisplayPhone) {
      const waAccount = await prisma.whatsAppAccount.findFirst({
        where: {
          OR: [
            ...(metadataDisplayPhone ? [{ phoneNumber: metadataDisplayPhone }] : []),
            ...(metadataPhoneId ? [{ phoneNumber: metadataPhoneId }] : []),
          ],
        },
        include: { organization: true },
      });
      org = waAccount?.organization || null;
    }

    // Fallback to first organization for single-tenant / local dev
    if (!org) {
      org = await prisma.organization.findFirst();
    }

    if (!org) {
      console.error("[Webhook] No organization found — cannot process message.");
      return NextResponse.json({ status: "no_org" }, { status: 200 });
    }

    // ── Upsert Lead ──────────────────────────────────────────────────────────
    let lead = await prisma.lead.findUnique({
      where: { organizationId_phone: { organizationId: org.id, phone: fromPhone } },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          phone: fromPhone,
          name: profileName,
          status: "NEW",
        },
      });
    } else if (profileName && !lead.name) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { name: profileName },
      });
    }

    // ── Run booking flow (non-blocking from WhatsApp's perspective) ──────────
    // We respond 200 to Meta immediately; the booking flow sends its own reply.
    handleIncomingMessage(org, lead, incoming).catch((err) => {
      console.error("[Booking Flow Error]", err);
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
