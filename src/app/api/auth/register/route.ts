import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, orgName } = await request.json();

    if (!name || !email || !password || !orgName) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Este correo electrónico ya está registrado." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create organization and user together in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName.trim(),
        },
      });

      // Default Agent Config
      await tx.agentConfig.create({
        data: {
          organizationId: org.id,
          botName: `${orgName} Bot`,
          greetingMessage: `¡Hola! Bienvenido a ${orgName}. ¿En qué te puedo ayudar a agendar hoy?`,
        },
      });

      // Default Service Types
      await tx.serviceType.createMany({
        data: [
          {
            organizationId: org.id,
            name: "Consulta General",
            durationMinutes: 30,
            price: 50.0,
            description: "Sesión inicial de evaluación y consulta",
          },
          {
            organizationId: org.id,
            name: "Sesión de Seguimiento",
            durationMinutes: 45,
            price: 75.0,
            description: "Revisión de avance y ajustes",
          },
        ],
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          passwordHash,
          role: "ADMIN",
        },
      });

      return { user, org };
    });

    await createSession({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      organizationId: result.org.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organization: result.org,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al crear la cuenta." },
      { status: 500 }
    );
  }
}
