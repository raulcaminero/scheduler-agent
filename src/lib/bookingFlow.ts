/**
 * Booking Flow State Machine.
 *
 * Drives the interactive WhatsApp appointment booking conversation.
 * Each incoming message advances the BookingSession to the next step.
 *
 * Steps:
 *  IDLE → (any booking intent) → send service list → AWAITING_SERVICE
 *  AWAITING_SERVICE → (list_reply: service id) → send date buttons → AWAITING_DATE
 *  AWAITING_DATE → (button_reply: date string) → send time slots list → AWAITING_TIME
 *  AWAITING_TIME → (list_reply: ISO datetime) → create appointment → IDLE (cleared)
 */

import { prisma } from "@/lib/prisma";
import { sendTextMessage, sendListMessage, sendButtonMessage } from "@/lib/whatsapp";
import {
  getAvailableDays,
  getAvailableSlots,
  formatTime,
  formatDateLabel,
} from "@/lib/availability";
import type { Organization, Lead, BookingSession } from "@prisma/client";

// ─── Intent Detection ────────────────────────────────────────────────────────

const BOOKING_INTENT_KEYWORDS = [
  "hola", "buenas", "buen día", "buenos días",
  "cita", "agendar", "reservar", "turno", "quiero", "necesito",
  "disponibilidad", "horario", "cuando", "puedo",
];

const CANCEL_KEYWORDS = ["cancelar", "cancel", "eliminar", "anular", "no quiero la cita"];
const RESCHEDULE_KEYWORDS = ["reagendar", "cambiar cita", "cambiar fecha", "posponer", "mover cita", "cambiar hora"];
const MY_APPTS_KEYWORDS = ["mis citas", "mis reservas", "ver cita", "tengo cita"];
const HANDOVER_KEYWORDS = ["humano", "asesor", "representante", "persona", "agente", "hablar con alguien"];

function hasBookingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return BOOKING_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasCancelIntent(text: string, replyId?: string): boolean {
  if (replyId === "btn_cancel") return true;
  const lower = text.toLowerCase();
  return CANCEL_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasRescheduleIntent(text: string, replyId?: string): boolean {
  if (replyId === "btn_reschedule") return true;
  const lower = text.toLowerCase();
  return RESCHEDULE_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasMyAppointmentsIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return MY_APPTS_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasHandoverIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return HANDOVER_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Session Helpers ─────────────────────────────────────────────────────────

const SESSION_TTL_MINUTES = 30;

function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
}

async function getOrCreateSession(
  leadId: string,
  organizationId: string
): Promise<BookingSession> {
  const existing = await prisma.bookingSession.findUnique({ where: { leadId } });

  if (existing) {
    // Reset if expired
    if (existing.expiresAt < new Date()) {
      return prisma.bookingSession.update({
        where: { leadId },
        data: {
          step: "IDLE",
          serviceTypeId: null,
          selectedDate: null,
          expiresAt: sessionExpiresAt(),
        },
      });
    }
    return existing;
  }

  return prisma.bookingSession.create({
    data: {
      leadId,
      organizationId,
      step: "IDLE",
      expiresAt: sessionExpiresAt(),
    },
  });
}

async function updateSession(
  leadId: string,
  data: Partial<{
    step: BookingSession["step"];
    serviceTypeId: string | null;
    selectedDate: string | null;
    expiresAt: Date;
  }>
): Promise<void> {
  await prisma.bookingSession.update({
    where: { leadId },
    data: { ...data, expiresAt: sessionExpiresAt() },
  });
}

async function clearSession(leadId: string): Promise<void> {
  await prisma.bookingSession.update({
    where: { leadId },
    data: { step: "IDLE", serviceTypeId: null, selectedDate: null },
  });
}

// ─── Step Handlers ────────────────────────────────────────────────────────────

async function sendServiceMenu(
  org: Organization & { serviceTypes?: { id: string; name: string; durationMinutes: number; price: number; description: string | null; isActive: boolean }[] },
  lead: Lead,
  agentConfig: { botName: string; greetingMessage: string } | null
): Promise<void> {
  const services = await prisma.serviceType.findMany({
    where: { organizationId: org.id, isActive: true },
    orderBy: { name: "asc" },
  });

  if (services.length === 0) {
    await sendTextMessage(
      lead.phone,
      "Lo siento, no tenemos servicios disponibles en este momento. Por favor contáctanos directamente."
    );
    return;
  }

  const rows = services.map((s) => ({
    id: `service::${s.id}`,
    title: s.name.substring(0, 24),
    description: `${s.durationMinutes} min${s.price > 0 ? ` · $${s.price}` : ""}`,
  }));

  const greeting = agentConfig?.greetingMessage ||
    `¡Hola${lead.name ? `, ${lead.name.split(" ")[0]}` : ""}! Bienvenido a ${org.name}.`;

  await sendListMessage(
    lead.phone,
    org.name,
    `${greeting}\n\n¿Qué servicio deseas agendar?`,
    "Selecciona una opción para continuar",
    "Ver servicios",
    [{ title: "Servicios disponibles", rows }]
  );
}

async function sendDatePicker(org: Organization, lead: Lead, serviceName: string): Promise<void> {
  const days = getAvailableDays(org);

  if (days.length === 0) {
    await sendTextMessage(
      lead.phone,
      "No tenemos días disponibles próximamente. Por favor llámanos para coordinar una fecha."
    );
    return;
  }

  const buttons = days.slice(0, 3).map((d) => ({
    id: `date::${d}`,
    title: formatDateLabel(d),
  }));

  await sendButtonMessage(
    lead.phone,
    `Has seleccionado: *${serviceName}*\n\n¿Qué día prefieres para tu cita?`,
    "Selecciona uno de los próximos días disponibles",
    buttons
  );
}

async function sendTimeSlots(
  org: Organization,
  lead: Lead,
  dateStr: string,
  durationMin: number
): Promise<void> {
  // Load existing appointments for conflict filtering
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0);
  const dayEnd = new Date(y, mo - 1, d, 23, 59, 59);

  const existing = await prisma.appointment.findMany({
    where: {
      organizationId: org.id,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    select: { startTime: true, endTime: true },
  });

  const slots = getAvailableSlots(org, existing, dateStr, durationMin);

  if (slots.length === 0) {
    await sendTextMessage(
      lead.phone,
      `Lo siento, no hay horarios disponibles para el *${formatDateLabel(dateStr)}*. ¿Deseas elegir otro día? Escríbenos "agendar" para volver al menú.`
    );
    // Reset step back to AWAITING_DATE
    await updateSession(lead.id, { step: "AWAITING_DATE", selectedDate: null });
    return;
  }

  // Only show up to 10 slots (list message limit)
  const rows = slots.slice(0, 10).map((slot) => ({
    id: `time::${slot.toISOString()}`,
    title: formatTime(slot),
    description: `${formatDateLabel(dateStr)}`,
  }));

  await sendListMessage(
    lead.phone,
    formatDateLabel(dateStr),
    "¿A qué hora prefieres tu cita?",
    "Los horarios mostrados son los disponibles",
    "Ver horarios",
    [{ title: `Horarios disponibles — ${formatDateLabel(dateStr)}`, rows }]
  );
}

async function confirmAppointment(
  org: Organization,
  lead: Lead,
  session: BookingSession,
  isoDateTime: string
): Promise<void> {
  if (!session.serviceTypeId) {
    await sendTextMessage(lead.phone, "Ocurrió un error. Escribe 'agendar' para volver a intentarlo.");
    await clearSession(lead.id);
    return;
  }

  const service = await prisma.serviceType.findUnique({ where: { id: session.serviceTypeId } });
  if (!service) {
    await sendTextMessage(lead.phone, "El servicio seleccionado ya no está disponible. Escribe 'agendar' para elegir otro.");
    await clearSession(lead.id);
    return;
  }

  const startTime = new Date(isoDateTime);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60_000);

  // Create appointment + reminder in a transaction
  const appointment = await prisma.$transaction(async (tx) => {
    // Update lead status to BOOKED
    await tx.lead.update({ where: { id: lead.id }, data: { status: "BOOKED" } });

    const app = await tx.appointment.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        serviceTypeId: service.id,
        startTime,
        endTime,
        status: "CONFIRMED",
      },
    });

    // Schedule 24h reminder
    const reminderTime = new Date(startTime.getTime() - 24 * 60 * 60_000);
    if (reminderTime > new Date()) {
      await tx.reminder.create({
        data: {
          appointmentId: app.id,
          scheduledFor: reminderTime,
          status: "PENDING",
          channel: "WHATSAPP",
        },
      });
    }

    // Log bot confirmation message
    await tx.chatMessage.create({
      data: {
        leadId: lead.id,
        sender: "AI_AGENT",
        content: `Cita confirmada: ${service.name} el ${formatDateLabel(session.selectedDate!)} a las ${formatTime(startTime)}`,
      },
    });

    return app;
  });

  // Clear session
  await clearSession(lead.id);

  // Send confirmation with interactive tap buttons
  const dateLabel = session.selectedDate ? formatDateLabel(session.selectedDate) : "";
  await sendButtonMessage(
    lead.phone,
    `✅ *¡Cita confirmada!*\n\n` +
    `📋 *Servicio:* ${service.name}\n` +
    `📅 *Fecha:* ${dateLabel}\n` +
    `🕐 *Hora:* ${formatTime(startTime)}\n` +
    `⏱ *Duración:* ${service.durationMinutes} min\n\n` +
    `Te enviaremos un recordatorio 24 horas antes de tu cita.`,
    "¿Deseas gestionar tu cita?",
    [
      { id: "btn_reschedule", title: "📅 Reagendar" },
      { id: "btn_cancel", title: "❌ Cancelar" },
    ]
  );
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export interface IncomingMessage {
  type: "text" | "interactive";
  text?: string;
  interactiveType?: "list_reply" | "button_reply";
  replyId?: string;    // the `id` from the button/list reply
  replyTitle?: string; // the displayed title
}

export async function handleIncomingMessage(
  org: Organization,
  lead: Lead,
  message: IncomingMessage
): Promise<void> {
  const session = await getOrCreateSession(lead.id, org.id);
  const agentConfig = await prisma.agentConfig.findUnique({ where: { organizationId: org.id } });

  const text = message.text || message.replyTitle || "";

  // Save incoming lead message
  await prisma.chatMessage.create({
    data: { leadId: lead.id, sender: "LEAD", content: text },
  });

  // ── IDLE: look for booking intent ──────────────────────────────────────────
  if (session.step === "IDLE") {
    if (hasMyAppointmentsIntent(text)) {
      const upcoming = await prisma.appointment.findMany({
        where: {
          leadId: lead.id,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          startTime: { gte: new Date() },
        },
        include: { serviceType: true },
        orderBy: { startTime: "asc" },
        take: 3,
      });

      if (upcoming.length === 0) {
        await sendTextMessage(lead.phone, "No tienes citas próximas agendadas. Escribe 'agendar' para reservar una cita.");
      } else {
        const list = upcoming
          .map((a, i) =>
            `${i + 1}. ${a.serviceType.name} — ${formatDateLabel(a.startTime.toISOString().split("T")[0])} a las ${formatTime(a.startTime)}`
          )
          .join("\n");
        await sendTextMessage(lead.phone, `📅 *Tus próximas citas:*\n\n${list}`);
      }
      return;
    }

    if (hasCancelIntent(text, message.replyId)) {
      const upcoming = await prisma.appointment.findFirst({
        where: {
          leadId: lead.id,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          startTime: { gte: new Date() },
        },
        include: { serviceType: true },
        orderBy: { startTime: "asc" },
      });

      if (!upcoming) {
        await sendTextMessage(
          lead.phone,
          "No encontramos ninguna cita activa próxima para cancelar. Escribe *agendar* si deseas reservar una nueva cita."
        );
        return;
      }

      // Mark appointment as CANCELLED and update reminders
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: upcoming.id },
          data: { status: "CANCELLED" },
        }),
        prisma.reminder.updateMany({
          where: { appointmentId: upcoming.id },
          data: { status: "FAILED" },
        }),
      ]);

      const dateLabel = formatDateLabel(upcoming.startTime.toISOString().split("T")[0]);
      const timeLabel = formatTime(upcoming.startTime);

      await sendTextMessage(
        lead.phone,
        `❌ *Cita Cancelada*\n\nHola ${lead.name || 'Cliente'}, tu cita para *${upcoming.serviceType.name}* el *${dateLabel}* a las *${timeLabel}* ha sido cancelada correctamente.\n\nSi deseas agendar en otra oportunidad, solo escríbenos *"agendar"* en cualquier momento.`
      );
      return;
    }

    if (hasRescheduleIntent(text, message.replyId)) {
      const upcoming = await prisma.appointment.findFirst({
        where: {
          leadId: lead.id,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          startTime: { gte: new Date() },
        },
        include: { serviceType: true },
        orderBy: { startTime: "asc" },
      });

      if (!upcoming) {
        await sendTextMessage(
          lead.phone,
          "No encontramos citas activas para reagendar. Escribe *agendar* para reservar una nueva cita."
        );
        return;
      }

      // Mark existing appointment as RESCHEDULED
      await prisma.appointment.update({
        where: { id: upcoming.id },
        data: { status: "RESCHEDULED" },
      });

      // Move session directly to AWAITING_DATE with the same service
      await updateSession(lead.id, {
        step: "AWAITING_DATE",
        serviceTypeId: upcoming.serviceTypeId,
      });

      await sendDatePicker(org, lead, upcoming.serviceType.name);
      return;
    }

    if (hasHandoverIntent(text)) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "HANDOVER" },
      });

      await sendTextMessage(
        lead.phone,
        `🙋‍♂️ Te hemos conectado con nuestro equipo. Un representante te responderá por aquí a la brevedad.\n\nSi deseas volver al agendamiento automático en cualquier momento, solo escribe *"agendar"*`
      );
      return;
    }

    if (hasBookingIntent(text)) {
      await updateSession(lead.id, { step: "AWAITING_SERVICE" });
      await sendServiceMenu(org, lead, agentConfig);
      return;
    }

    // Default fallback — nudge towards booking
    await sendTextMessage(
      lead.phone,
      agentConfig?.greetingMessage ||
        `¡Hola! Soy el asistente de ${org.name}. Escribe *"agendar"* para reservar una cita o *"mis citas"* para ver tus reservas. 😊`
    );
    return;
  }

  // ── AWAITING_SERVICE: customer chose a service from the list ───────────────
  if (session.step === "AWAITING_SERVICE") {
    const replyId = message.replyId || "";

    if (!replyId.startsWith("service::")) {
      // They typed instead of tapping — re-send menu
      await sendTextMessage(lead.phone, "Por favor selecciona un servicio del menú para continuar.");
      await sendServiceMenu(org, lead, agentConfig);
      return;
    }

    const serviceTypeId = replyId.replace("service::", "");
    const service = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });

    if (!service) {
      await sendTextMessage(lead.phone, "Ese servicio ya no está disponible. Escribe 'agendar' para volver al menú.");
      await clearSession(lead.id);
      return;
    }

    await updateSession(lead.id, { step: "AWAITING_DATE", serviceTypeId });
    await sendDatePicker(org, lead, service.name);
    return;
  }

  // ── AWAITING_DATE: customer tapped a date button ───────────────────────────
  if (session.step === "AWAITING_DATE") {
    const replyId = message.replyId || "";

    if (!replyId.startsWith("date::")) {
      await sendTextMessage(lead.phone, "Por favor selecciona una fecha del menú para continuar.");
      const service = session.serviceTypeId
        ? await prisma.serviceType.findUnique({ where: { id: session.serviceTypeId } })
        : null;
      await sendDatePicker(org, lead, service?.name || "el servicio seleccionado");
      return;
    }

    const selectedDate = replyId.replace("date::", "");
    const service = session.serviceTypeId
      ? await prisma.serviceType.findUnique({ where: { id: session.serviceTypeId } })
      : null;

    if (!service) {
      await sendTextMessage(lead.phone, "Tu sesión ha expirado. Escribe 'agendar' para empezar de nuevo.");
      await clearSession(lead.id);
      return;
    }

    await updateSession(lead.id, { step: "AWAITING_TIME", selectedDate });
    await sendTimeSlots(org, lead, selectedDate, service.durationMinutes);
    return;
  }

  // ── AWAITING_TIME: customer chose a time slot ──────────────────────────────
  if (session.step === "AWAITING_TIME") {
    const replyId = message.replyId || "";

    if (!replyId.startsWith("time::")) {
      await sendTextMessage(lead.phone, "Por favor selecciona un horario del menú para confirmar tu cita.");
      const service = session.serviceTypeId
        ? await prisma.serviceType.findUnique({ where: { id: session.serviceTypeId } })
        : null;
      if (service && session.selectedDate) {
        await sendTimeSlots(org, lead, session.selectedDate, service.durationMinutes);
      }
      return;
    }

    const isoDateTime = replyId.replace("time::", "");
    await confirmAppointment(org, lead, session, isoDateTime);
    return;
  }
}
