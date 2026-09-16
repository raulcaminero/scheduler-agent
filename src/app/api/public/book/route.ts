import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAvailableDays, getAvailableSlots } from '@/lib/availability';
import { sendTextMessage, sendButtonMessage } from '@/lib/whatsapp';
import { formatDateLabel, formatTime } from '@/lib/availability';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || 'demo-business';
    const dateStr = searchParams.get('date');
    const serviceTypeId = searchParams.get('serviceTypeId');

    const org = await prisma.organization.findFirst({
      where: {
        OR: [{ id: slug }, { name: { contains: slug, mode: 'insensitive' } }],
      },
      include: {
        serviceTypes: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const availableDays = getAvailableDays(org);

    let slots: Date[] = [];
    if (dateStr && serviceTypeId) {
      const service = org.serviceTypes.find((s) => s.id === serviceTypeId);
      if (service) {
        const [y, mo, d] = dateStr.split('-').map(Number);
        const dayStart = new Date(y, mo - 1, d, 0, 0, 0);
        const dayEnd = new Date(y, mo - 1, d, 23, 59, 59);

        const existing = await prisma.appointment.findMany({
          where: {
            organizationId: org.id,
            startTime: { gte: dayStart, lte: dayEnd },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
          select: { startTime: true, endTime: true },
        });

        slots = getAvailableSlots(org, existing, dateStr, service.durationMinutes);
      }
    }

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        timezone: org.timezone,
        workDays: org.workDays,
        startHour: org.startHour,
        endHour: org.endHour,
      },
      services: org.serviceTypes,
      availableDays,
      slots: slots.map((s) => ({
        iso: s.toISOString(),
        timeLabel: formatTime(s),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching public booking data:', error);
    return NextResponse.json({ error: 'Error al obtener datos de reserva' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId, serviceTypeId, isoDateTime, clientName, clientPhone } = body;

    if (!organizationId || !serviceTypeId || !isoDateTime || !clientPhone) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const service = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });

    if (!org || !service) {
      return NextResponse.json({ error: 'Organización o servicio no encontrado' }, { status: 400 });
    }

    // Upsert Lead
    let lead = await prisma.lead.findUnique({
      where: {
        organizationId_phone: { organizationId: org.id, phone: clientPhone },
      },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          phone: clientPhone,
          name: clientName || null,
          status: 'BOOKED',
          notes: 'Reservó a través de la página web de reservas',
        },
      });
    } else {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'BOOKED',
          ...(clientName && { name: clientName }),
        },
      });
    }

    const startTime = new Date(isoDateTime);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60_000);

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        serviceTypeId: service.id,
        startTime,
        endTime,
        status: 'CONFIRMED',
        notes: 'Reserva vía Web',
      },
    });

    // Schedule 24h reminder
    const reminderTime = new Date(startTime.getTime() - 24 * 60 * 60_000);
    if (reminderTime > new Date()) {
      await prisma.reminder.create({
        data: {
          appointmentId: appointment.id,
          scheduledFor: reminderTime,
          status: 'PENDING',
          channel: 'WHATSAPP',
        },
      });
    }

    // Send WhatsApp notification to client
    const dateLabel = formatDateLabel(startTime.toISOString().split('T')[0]);
    const timeLabel = formatTime(startTime);

    try {
      await sendButtonMessage(
        clientPhone,
        `✅ *¡Cita confirmada (Reserva Web)!*\n\n` +
          `📋 *Servicio:* ${service.name}\n` +
          `📅 *Fecha:* ${dateLabel}\n` +
          `🕐 *Hora:* ${timeLabel}\n` +
          `⏱ *Duración:* ${service.durationMinutes} min\n\n` +
          `Te enviaremos un recordatorio 24 horas antes de tu cita.`,
        "¿Deseas gestionar tu cita?",
        [
          { id: "btn_reschedule", title: "📅 Reagendar" },
          { id: "btn_cancel", title: "❌ Cancelar" },
        ]
      );
    } catch (e) {
      console.warn("Could not send WhatsApp web booking notification", e);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        serviceName: service.name,
        dateLabel,
        timeLabel,
      },
    });
  } catch (error: any) {
    console.error('Error creating public web booking:', error);
    return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 });
  }
}
