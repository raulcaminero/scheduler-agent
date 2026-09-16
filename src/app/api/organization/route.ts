import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, timezone, workDays, startHour, endHour, slotBufferMin } = body;

    const updated = await prisma.organization.update({
      where: { id: session.organizationId },
      data: {
        ...(name !== undefined && { name }),
        ...(timezone !== undefined && { timezone }),
        ...(workDays !== undefined && { workDays }),
        ...(startHour !== undefined && { startHour }),
        ...(endHour !== undefined && { endHour }),
        ...(slotBufferMin !== undefined && { slotBufferMin: parseInt(slotBufferMin, 10) }),
      },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Error al actualizar la configuración' }, { status: 500 });
  }
}
