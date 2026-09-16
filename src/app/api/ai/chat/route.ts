import { NextResponse } from "next/server";

/**
 * AI chat endpoint — superseded by interactive WhatsApp booking flow (Option B).
 * Text-based NLP booking is no longer part of the appointment flow.
 * This endpoint is retained as a stub for potential future use (e.g. internal support chat).
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "The AI chat endpoint is not active. Appointment booking is handled via interactive WhatsApp messages.",
    },
    { status: 501 }
  );
}
