import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    // If leadId specified, return chat messages for that lead
    if (leadId) {
      const messages = await prisma.chatMessage.findMany({
        where: { leadId },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(messages);
    }

    // Otherwise, return all leads with message counts and latest appointments
    const leads = await prisma.lead.findMany({
      where: { organizationId: session.organizationId },
      include: {
        _count: {
          select: { chatMessages: true, appointments: true },
        },
        appointments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { serviceType: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      name: lead.name || 'Sin Nombre',
      phone: lead.phone,
      email: lead.email || undefined,
      status: lead.status,
      notes: lead.notes || undefined,
      lastActive: lead.updatedAt.toISOString(),
      messagesCount: lead._count.chatMessages,
      lastAppointment: lead.appointments[0]
        ? {
            id: lead.appointments[0].id,
            service: lead.appointments[0].serviceType.name,
            startTime: lead.appointments[0].startTime,
            status: lead.appointments[0].status,
          }
        : null,
    }));

    return NextResponse.json(formattedLeads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 });
  }
}
