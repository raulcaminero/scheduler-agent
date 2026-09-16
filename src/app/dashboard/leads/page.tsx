"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  ChevronRight,
  X,
  Loader2,
  Bot,
  User,
  Headphones,
  Send,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  notes?: string;
  lastActive: string;
  messagesCount: number;
}

interface ChatMessage {
  id: string;
  sender: "LEAD" | "AI_AGENT" | "HUMAN";
  content: string;
  createdAt: string;
}

// Mock data — will be replaced with API call in a follow-up
const MOCK_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Carlos Martinez",
    phone: "+1 (809) 555-0192",
    email: "carlos.m@example.com",
    status: "BOOKED",
    notes: "Cita agendada para mañana 10:30 AM. Dental Consultation.",
    lastActive: "10 min",
    messagesCount: 8,
  },
  {
    id: "lead-2",
    name: "Maria Fernandez",
    phone: "+1 (809) 555-0834",
    email: "maria.f@example.com",
    status: "QUALIFIED",
    notes: "Consultó precios. Recibió horarios disponibles para el viernes.",
    lastActive: "25 min",
    messagesCount: 5,
  },
  {
    id: "lead-3",
    name: "Jose Rodriguez",
    phone: "+1 (829) 555-9120",
    status: "HANDOVER",
    notes: "Solicita agente humano para consulta de facturación.",
    lastActive: "1 hora",
    messagesCount: 12,
  },
  {
    id: "lead-4",
    name: "Laura Sanchez",
    phone: "+1 (809) 555-4311",
    status: "BOOKED",
    notes: "Cita Legal Advisory Session — Jue 18 3:00 PM.",
    lastActive: "2 horas",
    messagesCount: 6,
  },
  {
    id: "lead-5",
    name: "Roberto Diaz",
    phone: "+1 (809) 555-7788",
    status: "NEW",
    notes: "Primer contacto — saludo inicial recibido.",
    lastActive: "3 horas",
    messagesCount: 2,
  },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "lead-1": [
    { id: "m1", sender: "LEAD", content: "Hola buenas tardes", createdAt: new Date(Date.now() - 40 * 60_000).toISOString() },
    { id: "m2", sender: "AI_AGENT", content: "¡Hola Carlos! Bienvenido. ¿Qué servicio deseas agendar?", createdAt: new Date(Date.now() - 39 * 60_000).toISOString() },
    { id: "m3", sender: "LEAD", content: "Consulta Dental", createdAt: new Date(Date.now() - 38 * 60_000).toISOString() },
    { id: "m4", sender: "AI_AGENT", content: "¿Qué día prefieres? Tenemos disponible: Lun 16, Mar 17, Mié 18", createdAt: new Date(Date.now() - 37 * 60_000).toISOString() },
    { id: "m5", sender: "LEAD", content: "Mañana por favor", createdAt: new Date(Date.now() - 36 * 60_000).toISOString() },
    { id: "m6", sender: "AI_AGENT", content: "Horarios disponibles para el Lun 16: 10:30 AM, 2:00 PM, 4:30 PM", createdAt: new Date(Date.now() - 35 * 60_000).toISOString() },
    { id: "m7", sender: "LEAD", content: "10:30 AM", createdAt: new Date(Date.now() - 34 * 60_000).toISOString() },
    { id: "m8", sender: "AI_AGENT", content: "✅ ¡Cita confirmada! Consulta Dental — Lun 16 a las 10:30 AM. Te recordaremos 24h antes.", createdAt: new Date(Date.now() - 33 * 60_000).toISOString() },
  ],
  "lead-2": [
    { id: "m1", sender: "LEAD", content: "Cuanto cuesta la consulta?", createdAt: new Date(Date.now() - 30 * 60_000).toISOString() },
    { id: "m2", sender: "AI_AGENT", content: "Nuestros servicios: Consulta General $50 (30 min) · Sesión de Seguimiento $75 (45 min). ¿Deseas agendar?", createdAt: new Date(Date.now() - 29 * 60_000).toISOString() },
    { id: "m3", sender: "LEAD", content: "Sí quiero agendar", createdAt: new Date(Date.now() - 28 * 60_000).toISOString() },
    { id: "m4", sender: "AI_AGENT", content: "¿Qué servicio prefieres?", createdAt: new Date(Date.now() - 27 * 60_000).toISOString() },
    { id: "m5", sender: "LEAD", content: "Consulta General", createdAt: new Date(Date.now() - 25 * 60_000).toISOString() },
  ],
};

const STATUS_BADGE: Record<string, string> = {
  BOOKED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  QUALIFIED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  HANDOVER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  NEW: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  UNQUALIFIED: "bg-gray-800 text-gray-400 border-gray-700",
};

const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Reservado",
  QUALIFIED: "Calificado",
  HANDOVER: "Handover",
  NEW: "Nuevo",
  UNQUALIFIED: "No Calificado",
};

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}

function SenderIcon({ sender }: { sender: ChatMessage["sender"] }) {
  if (sender === "AI_AGENT") return <Bot className="w-4 h-4 text-emerald-400" />;
  if (sender === "HUMAN") return <Headphones className="w-4 h-4 text-blue-400" />;
  return <User className="w-4 h-4 text-gray-400" />;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  React.useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetch('/api/leads');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLeads(data);
          }
        }
      } catch (e) {
        console.warn("Using mock leads fallback");
      }
    }
    loadLeads();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await fetch("/api/leads/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          message: replyText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newMsg: ChatMessage = data.message || {
          id: `local-${Date.now()}`,
          sender: "HUMAN",
          content: replyText.trim(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setReplyText("");
        setSelectedLead((prev) => prev ? { ...prev, status: "HANDOVER" } : null);
      }
    } catch (err) {
      console.error("Error sending reply", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = filterStatus === "ALL" || l.status === filterStatus;
    const matchesSearch =
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  async function openChat(lead: Lead) {
    setSelectedLead(lead);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/leads?leadId=${lead.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
          setChatLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Using mock chat messages fallback");
    }
    setMessages(MOCK_MESSAGES[lead.id] || []);
    setChatLoading(false);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            Leads & Clientes
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Todos los contactos que han interactuado con el bot de WhatsApp.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d1322] border border-gray-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "NEW", "QUALIFIED", "BOOKED", "HANDOVER"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterStatus === status
                  ? "bg-emerald-500 text-gray-950 font-bold shadow-md shadow-emerald-950"
                  : "bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800"
              }`}
            >
              {status === "ALL" ? "Todos" : STATUS_LABEL[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0d1322] border border-gray-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-900/50">
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Notas</th>
                <th className="px-6 py-4">Mensajes</th>
                <th className="px-6 py-4">Último contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs text-gray-300">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-100">{lead.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {lead.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold ${STATUS_BADGE[lead.status] || STATUS_BADGE["UNQUALIFIED"]}`}>
                      {STATUS_LABEL[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs text-gray-400 truncate">
                    {lead.notes || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-300">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800">
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      {lead.messagesCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400 text-[11px]">
                    hace {lead.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openChat(lead)}
                      className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-400 border border-gray-800 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                    >
                      Ver Chat <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat Slide-Out Panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-[#0a0d14] border-l border-gray-800 flex flex-col h-full shadow-2xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div>
                <div className="font-bold text-white text-sm">{selectedLead.name}</div>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  {selectedLead.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_BADGE[selectedLead.status]}`}>
                  {STATUS_LABEL[selectedLead.status]}
                </span>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-10">
                  No hay mensajes registrados para este contacto.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.sender === "LEAD" ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      msg.sender === "LEAD"
                        ? "bg-gray-900 border-gray-700"
                        : msg.sender === "AI_AGENT"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-blue-500/10 border-blue-500/30"
                    }`}>
                      <SenderIcon sender={msg.sender} />
                    </div>
                    <div className={`max-w-[78%] ${msg.sender === "LEAD" ? "items-start" : "items-end"} flex flex-col gap-1`}>
                      <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "LEAD"
                          ? "bg-gray-800 text-gray-200 rounded-tl-sm"
                          : "bg-emerald-500/15 border border-emerald-500/20 text-emerald-100 rounded-tr-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer: Live Reply Form */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-gray-800 bg-gray-900/80 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe una respuesta por WhatsApp..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold transition-all disabled:opacity-40"
                >
                  {isSendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 text-center">
                Envía una respuesta manual directamente al WhatsApp del cliente.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
