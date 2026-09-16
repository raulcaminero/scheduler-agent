"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Clock,
  Calendar,
  Globe,
  Save,
  CheckCircle2,
  Loader2,
  Sliders,
  Building,
} from "lucide-react";

const DAYS_MAP = [
  { key: "Mon", label: "Lunes" },
  { key: "Tue", label: "Martes" },
  { key: "Wed", label: "Miércoles" },
  { key: "Thu", label: "Jueves" },
  { key: "Fri", label: "Viernes" },
  { key: "Sat", label: "Sábado" },
  { key: "Sun", label: "Domingo" },
];

const TIMEZONES = [
  { value: "America/Santo_Domingo", label: "Santo Domingo (GMT-4)" },
  { value: "America/New_York", label: "Nueva York / Este (GMT-5)" },
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Bogota", label: "Bogotá / Colombia (GMT-5)" },
  { value: "America/Santiago", label: "Santiago de Chile (GMT-3)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "Europe/Madrid", label: "Madrid / España (GMT+1)" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("Negocio Demo SmartSchedule");
  const [timezone, setTimezone] = useState("America/Santo_Domingo");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("18:00");
  const [slotBufferMin, setSlotBufferMin] = useState("15");

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/organization");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setName(data.name);
          if (data.timezone) setTimezone(data.timezone);
          if (data.startHour) setStartHour(data.startHour);
          if (data.endHour) setEndHour(data.endHour);
          if (data.slotBufferMin) setSlotBufferMin(data.slotBufferMin.toString());
          if (data.workDays) setSelectedDays(data.workDays.split(","));
        }
      } catch (e) {
        console.warn("Using default organization settings");
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, []);

  const toggleDay = (key: string) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          timezone,
          workDays: selectedDays.join(","),
          startHour,
          endHour,
          slotBufferMin,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to update settings", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-7 h-7 text-emerald-400" />
            Configuración del Negocio y Horarios
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Personaliza tus días laborales, horas de atención y buffer entre citas para el bot de WhatsApp.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" /> Guardado correctamente
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Informacion del Negocio */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-800/80 pb-4">
            <Building className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-gray-100">Información del Negocio</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Nombre del Negocio
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Zona Horaria
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Horario de Atención */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800/80 pb-4">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-gray-100">Días Laborales y Horarios</h2>
          </div>

          {/* Days selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300">
              Días de atención en WhatsApp
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_MAP.map((day) => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? "bg-emerald-500 text-gray-950 border-emerald-400 shadow-md shadow-emerald-950 font-bold"
                        : "bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operating hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Hora Apertura
              </label>
              <input
                type="time"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-400" /> Hora Cierre
              </label>
              <input
                type="time"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-400" /> Buffer entre citas
              </label>
              <select
                value={slotBufferMin}
                onChange={(e) => setSlotBufferMin(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="0">0 minutos (Sin margen)</option>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos (Recomendado)</option>
                <option value="30">30 minutos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
