import { prisma } from './prisma';
import { sendTextMessage, sendButtonMessage } from './whatsapp';
import { formatDateLabel, formatTime } from './availability';
import { ReminderStatus } from '@prisma/client';

export async function processPendingReminders(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const now = new Date();

    // Find pending reminders scheduled for now or in the past
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        appointment: {
          include: {
            lead: true,
            serviceType: true,
            organization: {
              include: {
                whatsappAccounts: true,
              },
            },
          },
        },
      },
      take: 50,
    });

    for (const reminder of pendingReminders) {
      const { appointment } = reminder;

      // Skip if appointment was cancelled or deleted
      if (!appointment || appointment.status === 'CANCELLED') {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.FAILED },
        });
        continue;
      }

      const whatsappAccount = appointment.organization.whatsappAccounts[0];
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || whatsappAccount?.phoneNumber;

      if (!phoneNumberId) {
        console.warn(`No WhatsApp Phone ID found for org ${appointment.organizationId}`);
        errors++;
        continue;
      }

      const dateStr = formatDateLabel(appointment.startTime.toISOString().split('T')[0]);
      const timeStr = formatTime(appointment.startTime);

      const diffHours = (appointment.startTime.getTime() - reminder.scheduledFor.getTime()) / (1000 * 60 * 60);
      const is24h = diffHours > 3;

      const textMessage = is24h
        ? `⏰ *Recordatorio de Cita (Mañana)*\n\nHola ${appointment.lead.name || 'Cliente'}, te recordamos que tienes una cita programada para mañana:\n\n📌 *Servicio:* ${appointment.serviceType.name}\n📅 *Fecha:* ${dateStr}\n⏰ *Hora:* ${timeStr}`
        : `⏰ *Recordatorio Próximo (En 1 Hora)*\n\nHola ${appointment.lead.name || 'Cliente'}, tu cita es en 1 hora:\n\n📌 *Servicio:* ${appointment.serviceType.name}\n⏰ *Hora:* ${timeStr}\n\n¡Te esperamos!`;

      try {
        if (is24h) {
          await sendButtonMessage(
            appointment.lead.phone,
            textMessage,
            "¿Necesitas hacer algún cambio?",
            [
              { id: "btn_reschedule", title: "📅 Reagendar" },
              { id: "btn_cancel", title: "❌ Cancelar" },
            ]
          );
        } else {
          await sendTextMessage(appointment.lead.phone, textMessage);
        }

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.SENT,
            sentAt: new Date(),
          },
        });

        // Record reminder in chat messages
        await prisma.chatMessage.create({
          data: {
            leadId: appointment.leadId,
            sender: 'AI_AGENT',
            content: textMessage,
          },
        });

        processed++;
      } catch (sendErr) {
        console.error('Failed to send reminder WhatsApp message:', sendErr);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.FAILED },
        });
        errors++;
      }
    }
  } catch (error) {
    console.error('Error processing reminders:', error);
  }

  return { processed, errors };
}
