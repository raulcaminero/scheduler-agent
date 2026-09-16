# 📅 SmartSchedule / Scheduler Agent — Agendador de Citas por WhatsApp

**SmartSchedule** es una plataforma SaaS de agendamiento inteligente de citas y servicios diseñada específicamente para interacción directa a través de **WhatsApp**. 

A diferencia de los bots tradicionales de ventas, SmartSchedule está **100% enfocado en agendamiento, gestión de disponibilidad y recordatorios automáticos de citas** para clínicas, consultorios, despachos legales, salones de belleza y empresas de servicios.

---

## 🚀 Características Principales

- 📱 **Sin descargas para el cliente**: El cliente agenda, consulta y reagenda directamente por WhatsApp en lenguaje natural.
- 💻 **Panel Web para Administradores**: Interfaz en modo oscuro con métricas en tiempo real, gestión de disponibilidad, leads y calendario.
- ⚡ **Integración Dual WhatsApp Engine**:
  - **Baileys Engine (QR Code)**: Conexión inmediata mediante código QR para Pymes.
  - **Meta Cloud API Oficial**: Conexión empresarial directa vía Webhook.
- 🧠 **Agente IA Conversacional**: Entiende fechas, horarios y servicios con parseo inteligente.
- ⏰ **Sistema de Recordatorios Automáticos**: Envío de confirmaciones y alertas 24 horas antes de cada cita para reducir ausencias (no-shows).
- 🔒 **Autenticación y RBAC**: Sistema de autenticación JWT con roles (ADMIN / STAFF) y aislamiento multi-organización.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + Lucide Icons + Glassmorphism UX
- **Base de Datos & ORM**: PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **Autenticación**: Jose JWT + Bcryptjs + Cookies HTTP-only seguras
- **Motor WhatsApp**: Baileys / Meta WhatsApp Cloud API

---

## 🗄️ Estructura del Proyecto

```
smart-schedule/
├── prisma/
│   └── schema.prisma        # Modelo de BD (Organization, User, Lead, Appointment, Reminder, AgentConfig, ChatMessage)
├── src/
│   ├── app/
│   │   ├── (auth)/login/    # Página de Iniciar Sesión / Registro
│   │   ├── api/
│   │   │   ├── appointments/# Endpoints de lectura y agendamiento de citas
│   │   │   ├── ai/chat/     # Endpoint del Agente IA conversacional
│   │   │   ├── auth/        # Login, Register, Logout y Me
│   │   │   └── webhooks/    # Webhook de entrada de mensajes de WhatsApp
│   │   └── dashboard/       # Panel de control (Overview, WhatsApp, Calendar, AI Agent, Leads)
│   ├── lib/
│   │   ├── auth.ts          # Gestión de JWT, bcrypt y sesiones de usuario
│   │   └── prisma.ts        # Cliente Singleton de Prisma
│   ├── middleware.ts        # Protección de rutas privadas y API
│   └── types/               # Definiciones globales de TypeScript
└── package.json
```

---

## 🔧 Configuración Inicial

### 1. Clonar e Instalar Dependencias

```bash
cd smart-schedule
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartschedule?schema=public"
JWT_SECRET="tu_clave_secreta_super_segura_2026"
OPENAI_API_KEY="sk-..."
WHATSAPP_VERIFY_TOKEN="smartschedule_secret_verify_token"
WHATSAPP_API_TOKEN="EAAG..."
WHATSAPP_PHONE_NUMBER_ID="123456789"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Migración de Base de Datos

```bash
npx prisma db push
npx prisma generate
```

### 4. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 📝 Licencia

Desarrollado para la automatización eficiente de agendamiento de citas empresariales.
