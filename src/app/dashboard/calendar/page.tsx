"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Tag,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
  CheckCircle2,
} from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  isActive: boolean;
}

interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  service: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface AvailableSlot {
  datetime: string;
  label: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

// Default mock services until DB is connected
const DEFAULT_SERVICES: ServiceType[] = [
  { id: "s1", name: "Consulta General", durationMinutes: 30, price: 50, description: "Sesión inicial de evaluación", isActive: true },
  { id: "s2", name: "Sesión de Seguimiento", durationMinutes: 45, price: 75, description: "Revisión de avance y ajustes", isActive: true },
];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [services, setServices] = useState<ServiceType[]>(DEFAULT_SERVICES);
  const [isLoadingAppts, setIsLoadingAppts] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Add Service Modal State
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: "", durationMinutes: "30", price: "0", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAppointmentsForDate(selectedDate);
    loadAvailableSlotsForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setServices(data);
        }
      }
    } catch (e) {
      console.warn("Using default services fallback");
    }
  }

  async function loadAppointmentsForDate(date: Date) {
    setIsLoadingAppts(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      const all: Appointment[] = data.data || [];
      const dateStr = date.toDateString();
      setAppointments(all.filter((a) => new Date(a.startTime).toDateString() === dateStr));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAppts(false);
    }
  }

  async function loadAvailableSlotsForDate(date: Date) {
    setIsLoadingSlots(true);
    try {
      const dateStr = toDateStr(date);
      const res = await fetch(`/api/availability?date=${dateStr}`);
      const data = await res.json();
      setAvailableSlots(data.data || []);
    } catch (e) {
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }

  function prevDay() {
    setSelectedDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 1);
      return nd;
    });
  }

  function nextDay() {
    setSelectedDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      return nd;
    });
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
      });

      if (res.ok) {
        const created = await res.json();
        setServices((prev) => [...prev, created]);
        setNewService({ name: "", durationMinutes: "30", price: "0", description: "" });
        setShowAddService(false);
      } else {
        // Fallback optimistic save if offline/no DB
        const created: ServiceType = {
          id: `local-${Date.now()}`,
          name: newService.name,
          durationMinutes: parseInt(newService.durationMinutes),
          price: parseFloat(newService.price),
          description: newService.description,
          isActive: true,
        };
        setServices((prev) => [...prev, created]);
        setNewService({ name: "", durationMinutes: "30", price: "0", description: "" });
        setShowAddService(false);
      }
    } catch (e) {
      console.error("Error adding service:", e);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteService(id: string) {
    try {
      await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  }

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    SCHEDULED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-emerald-400" />
            Calendario & Disponibilidad
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configura servicios y consulta el calendario diario de citas.
          </p>
        </div>

        <button
          onClick={() => setShowAddService(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          Agregar Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Services & Schedule Config */}
        <div className="space-y-6">
          {/* Business Hours */}
          <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-4">
            <h2 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Horario de Trabajo
            </h2>
            <div className="space-y-3 text-xs">
              {[
                { label: "Días laborables", value: "Lun - Vie" },
                { label: "Horario", value: "9:00 AM - 6:00 PM" },
                { label: "Buffer entre citas", value: "15 min" },
                { label: "Zona horaria", value: "America/Santo_Domingo" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800/60 last:border-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Types */}
          <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-4">
            <h2 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-400" />
              Tipos de Servicio ({services.length})
            </h2>
            <div className="space-y-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-emerald-500/30 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-200">{srv.name}</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {srv.price === 0 ? "Gratis" : `$${srv.price}`}
                    </span>
                  </div>
                  {srv.description && <p className="text-[11px] text-gray-400">{srv.description}</p>}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/60">
                    <span className="font-mono">{srv.durationMinutes} min</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Activo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Daily Calendar View */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-6">
          {/* Day Navigator */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800/60">
            <div>
              <h2 className="font-bold text-lg text-gray-100 capitalize">
                {formatDate(selectedDate)}
              </h2>
              <p className="text-xs text-gray-400">
                {isLoadingAppts ? "Cargando..." : `${appointments.length} cita${appointments.length !== 1 ? "s" : ""} para este día`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevDay}
                className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {!isToday(selectedDate) && (
                <button
                  onClick={goToday}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                >
                  Hoy
                </button>
              )}
              <button
                onClick={nextDay}
                className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Appointment Timeline */}
          <div className="space-y-3">
            {isLoadingAppts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No hay citas agendadas para este día.
              </div>
            ) : (
              appointments.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/20 border border-gray-800/80 hover:border-emerald-500/30 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold text-center shrink-0">
                      {formatTime(app.startTime)}<br />
                      <span className="text-[10px] text-gray-500">–{formatTime(app.endTime)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-200">{app.clientName}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-400" />
                          {app.service}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-gray-500" />
                          {app.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold shrink-0 ${statusColor[app.status] || "bg-gray-800 text-gray-400 border-gray-700"}`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Available Slots Preview */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Horarios Libres — Disponibles para WhatsApp
            </h4>
            {isLoadingSlots ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-gray-500">Sin horarios disponibles para este día.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]"
                  >
                    ✓ {slot.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddService(false)} />
          <div className="relative w-full max-w-md bg-[#0a0d14] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Agregar Tipo de Servicio</h3>
              <button onClick={() => setShowAddService(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Consulta Inicial"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Duración (min)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={newService.durationMinutes}
                      onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Precio (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Breve descripción del servicio"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Guardar Servicio</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
