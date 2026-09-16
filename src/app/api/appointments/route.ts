import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    // If session exists, filter by organization, else fallback or get first org for demo/test
    let organizationId = session?.organizationId;
    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id;
    }

    if (!organizationId) {
      return NextResponse.json({ appointments: [], availableSlotsTomorrow: [] });
    }

    const appointments = await prisma.appointment.findMany({
      where: { organizationId },
      include: {
        lead: true,
        serviceType: true,
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: appointments.map((app) => ({
        id: app.id,
        clientName: app.lead.name || "Cliente Sin Nombre",
        phone: app.lead.phone,
        service: app.serviceType.name,
        serviceTypeId: app.serviceTypeId,
        startTime: app.startTime.toISOString(),
        endTime: app.endTime.toISOString(),
        status: app.status,
        notes: app.notes,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/appointments Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { clientName, phone, serviceTypeId, startTime, notes } = await req.json();

    if (!phone || !startTime) {
      return NextResponse.json(
        { success: false, error: "Teléfono y fecha de inicio son requeridos" },
        { status: 400 }
      );
    }

    let organizationId = session?.organizationId;
    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id;
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "No se encontró ninguna organización activa." },
        { status: 400 }
      );
    }

    // Find or create lead by phone
    let lead = await prisma.lead.findUnique({
      where: {
        organizationId_phone: {
          organizationId,
          phone,
        },
      },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          organizationId,
          phone,
          name: clientName || "Lead de WhatsApp",
          status: "BOOKED",
        },
      });
    } else if (clientName && !lead.name) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { name: clientName, status: "BOOKED" },
      });
    }

    // Get or fallback service type
    let service = serviceTypeId
      ? await prisma.serviceType.findUnique({ where: { id: serviceTypeId } })
      : await prisma.serviceType.findFirst({ where: { organizationId } });

    if (!service) {
      service = await prisma.serviceType.create({
        data: {
          organizationId,
          name: "Consulta General",
          durationMinutes: 30,
          price: 0,
        },
      });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    // Create appointment & 24h reminder in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const app = await tx.appointment.create({
        data: {
          organizationId,
          leadId: lead.id,
          serviceTypeId: service.id,
          startTime: start,
          endTime: end,
          status: "CONFIRMED",
          notes: notes || null,
        },
        include: {
          lead: true,
          serviceType: true,
        },
      });

      // Schedule reminder 24h before appointment if in future
      const reminderTime = new Date(start.getTime() - 24 * 60 * 60 * 1000);
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

      return app;
    });

    return NextResponse.json({
      success: true,
      data: appointment,
      message: "Cita agendada correctamente",
    });
  } catch (err: any) {
    console.error("POST /api/appointments Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
