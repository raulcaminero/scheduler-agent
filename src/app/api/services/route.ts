import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const services = await prisma.serviceType.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Error al obtener los servicios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, durationMinutes, price } = body;

    if (!name || !durationMinutes) {
      return NextResponse.json(
        { error: 'El nombre y la duración son obligatorios' },
        { status: 400 }
      );
    }

    const service = await prisma.serviceType.create({
      data: {
        organizationId: session.organizationId,
        name,
        description: description || '',
        durationMinutes: parseInt(durationMinutes, 10),
        price: parseFloat(price) || 0,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Error al crear el servicio' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del servicio es requerido' }, { status: 400 });
    }

    await prisma.serviceType.delete({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    return NextResponse.json({ success: true, message: 'Servicio eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Error al eliminar el servicio' }, { status: 500 });
  }
}
