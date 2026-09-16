"use client";

import React, { useState, useEffect, use } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Building,
  Tag,
} from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string | null;
}

interface TimeSlot {
  iso: string;
  timeLabel: string;
}

export default function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [step, setStep] = useState<"SERVICE" | "SLOT" | "FORM" | "SUCCESS">("SERVICE");
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form Selections
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<any>(null);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const res = await fetch(`/api/public/book?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setOrg(data.organization);
          setServices(data.services || []);
          setAvailableDays(data.availableDays || []);
          if (data.availableDays?.length > 0) {
            setSelectedDate(data.availableDays[0]);
          }
        }
      } catch (e) {
        console.error("Failed to load public booking info", e);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadSlotsForDate(selectedDate, selectedService.id);
    }
  }, [selectedDate, selectedService]);

  async function loadSlotsForDate(dateStr: string, serviceId: string) {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/public/book?slug=${slug}&date=${dateStr}&serviceTypeId=${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (e) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !selectedService || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          serviceTypeId: selectedService.id,
          isoDateTime: selectedSlot.iso,
          clientName,
          clientPhone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmedAppt(data.appointment);
        setStep("SUCCESS");
      }
    } catch (e) {
      console.error("Booking failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Reserva Online
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {org?.name || "Agendamiento de Citas"}
          </h1>
          <p className="text-xs text-gray-400">
            Selecciona tu servicio y horario preferido en pocos segundos.
          </p>
        </div>

        {/* Step 1: Select Service */}
        {step === "SERVICE" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider text-center">
              1. Selecciona el Servicio
            </h2>

            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    setStep("SLOT");
                  }}
                  className="p-5 rounded-2xl bg-[#0d1322] border border-gray-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                        {s.name}
                      </h3>
                      {s.description && (
                        <p className="text-xs text-gray-400 mt-1">{s.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {s.price > 0 ? `$${s.price}` : "Gratis"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {s.durationMinutes} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time Slot */}
        {step === "SLOT" && selectedService && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("SERVICE")}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar servicio
              </button>
              <span className="text-xs font-semibold text-emerald-400">{selectedService.name}</span>
            </div>

            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider text-center">
              2. Elige la Fecha y Hora
            </h2>

            {/* Date buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">Día disponible:</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDays.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                      selectedDate === d
                        ? "bg-emerald-500 text-gray-950 font-bold border-emerald-400 shadow-md shadow-emerald-950"
                        : "bg-[#0d1322] text-gray-300 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Slots */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">Horario preferido:</label>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-amber-400 py-4 text-center">
                  No hay horarios disponibles para la fecha seleccionada.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {slots.map((slot) => (
                    <button
                      key={slot.iso}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("FORM");
                      }}
                      className="py-3 px-2 rounded-xl bg-[#0d1322] border border-gray-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-mono text-gray-200 font-semibold transition-all hover:scale-[1.02]"
                    >
                      {slot.timeLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Enter Details Form */}
        {step === "FORM" && selectedService && selectedSlot && (
          <form onSubmit={handleBookingSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("SLOT")}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar horario
              </button>
              <span className="text-xs font-mono text-emerald-400">
                {selectedDate} · {selectedSlot.timeLabel}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-gray-300">
              <div className="font-bold text-white mb-0.5">{selectedService.name}</div>
              <div className="text-gray-400">
                {selectedDate} a las {selectedSlot.timeLabel} ({selectedService.durationMinutes} min)
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre y apellido"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#0d1322] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (809) 555-0199"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-[#0d1322] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Te enviaremos la confirmación y recordatorios directamente a tu WhatsApp.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-950 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isSubmitting ? "Confirmando Cita..." : "Confirmar Cita"}
            </button>
          </form>
        )}

        {/* Step 4: Success Screen */}
        {step === "SUCCESS" && confirmedAppt && (
          <div className="p-8 rounded-3xl bg-[#0d1322] border border-emerald-500/30 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">¡Cita Confirmada Exitosamente!</h2>
              <p className="text-xs text-gray-400 mt-1">
                Hemos registrado tu reserva y enviado la información a tu WhatsApp.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800/80 text-left text-xs space-y-2 font-mono">
              <div className="text-emerald-400 font-bold">{confirmedAppt.serviceName}</div>
              <div className="text-gray-300">📅 Fecha: {confirmedAppt.dateLabel}</div>
              <div className="text-gray-300">⏰ Hora: {confirmedAppt.timeLabel}</div>
            </div>

            <button
              onClick={() => {
                setStep("SERVICE");
                setConfirmedAppt(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-gray-900 text-gray-300 border border-gray-800 text-xs font-semibold hover:bg-gray-800 transition-all"
            >
              Reservar otra cita
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-600 mt-10">
        Powered by <span className="text-emerald-400 font-semibold">SmartSchedule WhatsApp Assistant</span>
      </div>
    </div>
  );
}
