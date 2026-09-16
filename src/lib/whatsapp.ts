import crypto from 'crypto';

const WA_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${WA_API_VERSION}`;

/**
 * Verifies the incoming x-hub-signature-256 header sent by Meta Webhooks.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // If no secret configured in environment, skip signature check for ease of development
  if (!appSecret) {
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const signature = signatureHeader.replace('sha256=', '');
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf-8')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (e) {
    return false;
  }
}

function getConfig() {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error(
      "WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set in environment variables."
    );
  }

  return { token, phoneNumberId };
}

async function sendRequest(payload: object): Promise<Response> {
  const { token, phoneNumberId } = getConfig();

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[WhatsApp API Error]", res.status, errorBody);
    throw new Error(`WhatsApp API request failed: ${res.status} — ${errorBody}`);
  }

  return res;
}

/** Send a plain text message */
export async function sendTextMessage(to: string, text: string): Promise<void> {
  await sendRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  });
}

export interface ListSection {
  title: string;
  rows: {
    id: string;
    title: string;
    description?: string;
  }[];
}

/**
 * Send an interactive list message (used for service selection & time slot selection).
 * Supports up to 10 items per section.
 */
export async function sendListMessage(
  to: string,
  headerText: string,
  bodyText: string,
  footerText: string,
  buttonLabel: string,
  sections: ListSection[]
): Promise<void> {
  await sendRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: headerText },
      body: { text: bodyText },
      footer: { text: footerText },
      action: {
        button: buttonLabel,
        sections,
      },
    },
  });
}

export interface ReplyButton {
  id: string;
  title: string;
}

/**
 * Send an interactive button message (used for date/day selection).
 * Supports up to 3 buttons.
 */
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  footerText: string,
  buttons: ReplyButton[]
): Promise<void> {
  await sendRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      footer: { text: footerText },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  });
}
