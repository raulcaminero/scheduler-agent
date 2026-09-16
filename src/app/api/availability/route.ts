import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAvailableSlots, getAvailableDays, formatTime, formatDateLabel } from "@/lib/availability";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const serviceTypeId = searchParams.get("serviceTypeId");
    const dateStr = searchParams.get("date"); // "YYYY-MM-DD"

    let organizationId = session?.organizationId;
    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst();
      organizationId = firstOrg?.id;
    }

    if (!organizationId) {
      return NextResponse.json({ success: false, error: "No se encontró ninguna organización" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ success: false, error: "Organización no encontrada" }, { status: 404 });
    }

    const orgSchedule = {
      timezone: org.timezone,
      workDays: org.workDays,
      startHour: org.startHour,
      endHour: org.endHour,
      slotBufferMin: org.slotBufferMin,
    };

    // If no date provided, return the next available workdays
    if (!dateStr) {
      const days = getAvailableDays(orgSchedule);
      return NextResponse.json({
        success: true,
        data: days.map((d) => ({ date: d, label: formatDateLabel(d) })),
      });
    }

    // Determine service duration
    let durationMin = 30;
    if (serviceTypeId) {
      const service = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });
      if (service) durationMin = service.durationMinutes;
    }

    // Load booked appointments for that day
    const [y, mo, d] = dateStr.split("-").map(Number);
    const dayStart = new Date(y, mo - 1, d, 0, 0, 0);
    const dayEnd = new Date(y, mo - 1, d, 23, 59, 59);

    const existing = await prisma.appointment.findMany({
      where: {
        organizationId,
        startTime: { gte: dayStart, lte: dayEnd },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    });

    const slots = getAvailableSlots(orgSchedule, existing, dateStr, durationMin);

    return NextResponse.json({
      success: true,
      data: slots.map((slot) => ({
        datetime: slot.toISOString(),
        label: formatTime(slot),
        dateLabel: formatDateLabel(dateStr),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/availability Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
