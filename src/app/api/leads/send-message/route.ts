import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendTextMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { leadId, message } = body;

    if (!leadId || !message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El ID del lead y el mensaje son obligatorios' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: session.organizationId,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Send WhatsApp text message to client
    try {
      await sendTextMessage(lead.phone, message);
    } catch (err) {
      console.warn('WhatsApp API delivery warning:', err);
    }

    // Record human reply in database chat history
    const savedMessage = await prisma.chatMessage.create({
      data: {
        leadId: lead.id,
        sender: 'HUMAN',
        content: message,
      },
    });

    // Optionally update lead status to HANDOVER
    if (lead.status !== 'HANDOVER') {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'HANDOVER' },
      });
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
    });
  } catch (error: any) {
    console.error('Error sending human WhatsApp reply:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
