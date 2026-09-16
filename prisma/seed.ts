import { PrismaClient, Role, LeadStatus, AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create or find default Organization
  let org = await prisma.organization.findFirst({
    where: { name: 'Negocio Demo SmartSchedule' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Negocio Demo SmartSchedule',
        timezone: 'America/Santo_Domingo',
      },
    });
  }

  console.log(`✅ Organization created/found: ${org.name} (${org.id})`);

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@smartschedule.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'admin@smartschedule.com',
      passwordHash: hashedPassword,
      name: 'Administrador SmartSchedule',
      role: Role.ADMIN,
      organizationId: org.id,
    },
  });

  console.log(`✅ Admin user created: ${user.email} (password: admin123)`);

  // 3. Create default Agent Config
  const agentConfig = await prisma.agentConfig.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      botName: 'Schedule Bot',
      greetingMessage: '¡Hola! Soy tu asistente de agendamiento. ¿En qué te puedo ayudar hoy?',
      systemPrompt: 'Hola, bienvenido al sistema de citas. Selecciona el servicio que deseas agendar.',
      autoBookingEnabled: true,
      escalationKeyword: 'humano,asesor,representante',
    },
  });

  console.log('✅ Agent config created');

  // 4. Create default Services
  const servicesData = [
    {
      name: 'Consulta General',
      description: 'Valoración inicial y atención personalizada (45 min)',
      durationMinutes: 45,
      price: 50.00,
    },
    {
      name: 'Corte de Cabello y Estilo',
      description: 'Servicio completo de estilismo profesional (60 min)',
      durationMinutes: 60,
      price: 35.00,
    },
    {
      name: 'Limpieza y Revisión Dental',
      description: 'Profilaxis dental e inspección preventiva (30 min)',
      durationMinutes: 30,
      price: 60.00,
    },
  ];

  for (const s of servicesData) {
    const existing = await prisma.serviceType.findFirst({
      where: { organizationId: org.id, name: s.name },
    });

    if (!existing) {
      await prisma.serviceType.create({
        data: {
          ...s,
          organizationId: org.id,
        },
      });
    }
  }

  console.log('✅ Default services created');

  // 5. Create WhatsApp Account stub
  const existingWa = await prisma.whatsAppAccount.findUnique({
    where: { phoneNumber: '+15550199283' },
  });

  if (!existingWa) {
    await prisma.whatsAppAccount.create({
      data: {
        organizationId: org.id,
        phoneNumber: '+15550199283',
        status: 'DISCONNECTED',
      },
    });
  }

  console.log('✅ WhatsApp Account configured');

  // 6. Create sample Lead & Appointment
  const service = await prisma.serviceType.findFirst({ where: { organizationId: org.id } });

  if (service) {
    const lead = await prisma.lead.upsert({
      where: {
        organizationId_phone: {
          organizationId: org.id,
          phone: '+15559998877',
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: 'Carlos Mendoza',
        phone: '+15559998877',
        status: LeadStatus.BOOKED,
        notes: 'Reservó a través del bot interactivo de WhatsApp',
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + service.durationMinutes);

    const existingAppt = await prisma.appointment.findFirst({
      where: { leadId: lead.id, serviceTypeId: service.id },
    });

    if (!existingAppt) {
      await prisma.appointment.create({
        data: {
          organizationId: org.id,
          leadId: lead.id,
          serviceTypeId: service.id,
          startTime: tomorrow,
          endTime: endTime,
          status: AppointmentStatus.CONFIRMED,
          notes: 'Cita de demostración inicial',
        },
      });
    }

    console.log('✅ Sample lead and appointment created');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
