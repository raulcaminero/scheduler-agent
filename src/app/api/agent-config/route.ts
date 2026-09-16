import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const config = await prisma.agentConfig.findUnique({
      where: { organizationId: session.organizationId },
    });

    const whatsapp = await prisma.whatsAppAccount.findFirst({
      where: { organizationId: session.organizationId },
    });

    return NextResponse.json({
      config,
      whatsapp: whatsapp ? {
        phoneNumber: whatsapp.phoneNumber,
        status: whatsapp.status,
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching agent config:', error);
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
    const { botName, greetingMessage, systemPrompt, autoBookingEnabled, escalationKeyword, phoneNumber } = body;

    const updatedConfig = await prisma.agentConfig.upsert({
      where: { organizationId: session.organizationId },
      update: {
        ...(botName !== undefined && { botName }),
        ...(greetingMessage !== undefined && { greetingMessage }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(autoBookingEnabled !== undefined && { autoBookingEnabled }),
        ...(escalationKeyword !== undefined && { escalationKeyword }),
      },
      create: {
        organizationId: session.organizationId,
        botName: botName || 'Schedule Bot',
        greetingMessage: greetingMessage || '¡Hola! Soy tu asistente de agendamiento. ¿En qué te puedo ayudar hoy?',
        systemPrompt: systemPrompt || 'Hola, bienvenido al sistema de citas. Selecciona el servicio que deseas agendar.',
        autoBookingEnabled: autoBookingEnabled ?? true,
        escalationKeyword: escalationKeyword || 'humano,asesor,representante',
      },
    });

    if (phoneNumber) {
      const existingAccount = await prisma.whatsAppAccount.findFirst({
        where: { organizationId: session.organizationId },
      });

      if (existingAccount) {
        await prisma.whatsAppAccount.update({
          where: { id: existingAccount.id },
          data: { phoneNumber },
        });
      } else {
        await prisma.whatsAppAccount.create({
          data: {
            organizationId: session.organizationId,
            phoneNumber: phoneNumber,
            status: 'DISCONNECTED',
          },
        });
      }
    }

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('Error updating agent config:', error);
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 });
  }
}
