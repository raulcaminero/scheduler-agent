"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Check,
  MessageSquare,
  User,
  Zap,
} from "lucide-react";

export default function AiAgentPage() {
  const [botName, setBotName] = useState("Schedule Bot");
  const [greetingMessage, setGreetingMessage] = useState(
    "¡Hola! 👋 Soy el asistente virtual de SmartSchedule. ¿Te gustaría agendar una cita o consultar nuestros servicios disponibles?"
  );
  const [systemPrompt, setSystemPrompt] = useState(
    "Eres un ejecutivo de ventas y agendamiento profesional y carismático en WhatsApp. Saluda cordial, identifica qué servicio le interesa al cliente, presenta opciones de horarios disponibles y confirma su cita pidiendo nombre y correo."
  );
  const [escalationKeyword, setEscalationKeyword] = useState("humano,asesor,representante,hablar con persona");
  const [autoBookingEnabled, setAutoBookingEnabled] = useState(true);

  // Chat Sandbox State
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "AI_AGENT",
      text: greetingMessage,
      time: "10:00 AM",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const userMsg = {
      id: Date.now().toString(),
      sender: "LEAD",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI Seller Response
    setTimeout(() => {
      let botResponse = "¡Excelente! Con gusto te puedo ayudar. ";
      const lower = userText.toLowerCase();

      if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuanto")) {
        botResponse += "Nuestra Consulta Dental tiene un costo de $50 USD y la Llamada Introductoria es totalmente GRATIS. ¿Cuál prefieres agendar?";
      } else if (lower.includes("cita") || lower.includes("agendar") || lower.includes("mañana") || lower.includes("horario")) {
        botResponse += "Tengo los siguientes horarios disponibles para mañana:\n1) 10:30 AM\n2) 02:00 PM\n3) 04:30 PM\n\n¿Cuál horario te conviene mejor?";
      } else if (lower.includes("1") || lower.includes("10:30") || lower.includes("mañana")) {
        botResponse += "¡Perfecto! Te reservé el horario de mañana a las 10:30 AM. ¿Por favor me me confirmas tu nombre completo y correo electrónico para enviarte el recordatorio?";
      } else if (lower.includes("humano") || lower.includes("asesor")) {
        botResponse += "🔔 Entendido. Te estoy transfiriendo con uno de nuestros representantes humanos en este momento.";
      } else {
        botResponse += "¿Te gustaría ver los horarios disponibles para esta semana?";
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "AI_AGENT",
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "1",
        sender: "AI_AGENT",
        text: greetingMessage,
        time: "10:00 AM",
      },
    ]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Bot className="w-7 h-7 text-emerald-400" />
          AI Agent Studio & Prompt Sandbox
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Customize your WhatsApp AI sales agent's personality, system prompt, and test conversation flows in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Config Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Agent Identity & Prompts */}
          <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-5">
            <h2 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Agent Persona & Instructions
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Bot Name / Persona
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Greeting Message (First Contact)
                </label>
                <textarea
                  rows={2}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  System Prompt & Sales Guidelines
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Human Escalation Keywords (Comma Separated)
                </label>
                <input
                  type="text"
                  value={escalationKeyword}
                  onChange={(e) => setEscalationKeyword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Settings & Automation Controls */}
          <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-4">
            <h2 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Automated Booking Rules
            </h2>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950 border border-gray-800">
              <div>
                <div className="text-xs font-semibold text-gray-200">
                  Auto-Booking Confirmation
                </div>
                <div className="text-[11px] text-gray-400">
                  Allow AI agent to automatically write booked slot into DB calendar.
                </div>
              </div>
              <button
                onClick={() => setAutoBookingEnabled(!autoBookingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                  autoBookingEnabled ? "bg-emerald-500 justify-end" : "bg-gray-800 justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: WhatsApp Interactive Sandbox (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[640px] rounded-2xl bg-[#0d1322] border border-gray-800/80 overflow-hidden">
          {/* Simulator Header */}
          <div className="p-4 bg-gray-900 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                WA
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-200">{botName}</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  WhatsApp Live Simulator
                </span>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080c14]/90">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "LEAD" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                    msg.sender === "LEAD"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                      : "bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-500 font-mono mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-gray-500 ml-1">Bot typing reply...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-gray-900 border-t border-gray-800/80 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Test a message (e.g. ¿Cuáles son los precios?)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
