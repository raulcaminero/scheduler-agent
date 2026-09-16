export type LeadStatus = "NEW" | "QUALIFIED" | "BOOKED" | "UNQUALIFIED" | "HANDOVER";

export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";

export type MessageSender = "LEAD" | "AI_AGENT" | "HUMAN";

export type ReminderStatus = "PENDING" | "SENT" | "FAILED";

export interface Organization {
  id: string;
  name: string;
  timezone: string;
  workDays: string;
  startHour: string;
  endHour: string;
  slotBufferMin: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppAccount {
  id: string;
  organizationId: string;
  phoneNumber: string;
  displayName?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "PAIRING";
  qrCode?: string | null;
  lastConnected?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceType {
  id: string;
  organizationId: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  organizationId: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  status: LeadStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  appointments?: Appointment[];
  chatMessages?: ChatMessage[];
}

export interface Appointment {
  id: string;
  organizationId: string;
  leadId: string;
  serviceTypeId: string;
  startTime: Date | string;
  endTime: Date | string;
  status: AppointmentStatus;
  notes?: string | null;
  googleCalendarEventId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lead?: Lead;
  serviceType?: ServiceType;
  reminders?: Reminder[];
}

export interface AgentConfig {
  id: string;
  organizationId: string;
  botName: string;
  greetingMessage: string;
  systemPrompt: string;
  autoBookingEnabled: boolean;
  escalationKeyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: MessageSender;
  content: string;
  createdAt: Date | string;
}

export interface Reminder {
  id: string;
  appointmentId: string;
  scheduledFor: Date | string;
  status: ReminderStatus;
  channel: string;
  sentAt?: Date | string | null;
  createdAt: Date | string;
  appointment?: Appointment;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF";
  organizationId: string;
}
