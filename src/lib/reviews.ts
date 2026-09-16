import { prisma } from './prisma';
import { sendButtonMessage } from './whatsapp';

export async function processPostAppointmentReviews(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const now = new Date();
    // Appointments that ended between 1 hour ago and 4 hours ago
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60_000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60_000);

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        endTime: {
          gte: fourHoursAgo,
          lte: oneHourAgo,
        },
      },
      include: {
        lead: true,
        serviceType: true,
        organization: {
          include: {
            whatsappAccounts: true,
          },
        },
      },
      take: 50,
    });

    for (const appt of completedAppointments) {
      // Check if a review message was already logged
      const existingMessage = await prisma.chatMessage.findFirst({
        where: {
          leadId: appt.leadId,
          content: { contains: '¿Cómo fue tu experiencia hoy?' },
        },
      });

      if (existingMessage) {
        continue;
      }

      const whatsappAccount = appt.organization.whatsappAccounts[0];
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || whatsappAccount?.phoneNumber;

      if (!phoneNumberId) {
        errors++;
        continue;
      }

      const textMessage =
        `🌟 *¡Gracias por visitarnos en ${appt.organization.name}!*\n\n` +
        `Hola ${appt.lead.name || 'Cliente'}, esperamos que hayas disfrutado tu servicio de *${appt.serviceType.name}*.\n\n` +
        `¿Cómo fue tu experiencia el día de hoy? Tu opinión nos ayuda a seguir mejorando.`;

      try {
        await sendButtonMessage(
          appt.lead.phone,
          textMessage,
          "Selecciona tu valoración",
          [
            { id: "review_excellent", title: "⭐ Excelente" },
            { id: "review_good", title: "👍 Buena" },
            { id: "review_regular", title: "👎 Regular" },
          ]
        );

        // Record in chat messages
        await prisma.chatMessage.create({
          data: {
            leadId: appt.leadId,
            sender: 'AI_AGENT',
            content: textMessage,
          },
        });

        processed++;
      } catch (err) {
        console.error('Failed to send post-appointment review:', err);
        errors++;
      }
    }
  } catch (error) {
    console.error('Error processing post-appointment reviews:', error);
  }

  return { processed, errors };
}
