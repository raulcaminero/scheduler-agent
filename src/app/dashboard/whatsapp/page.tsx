"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function WhatsappHubPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+15550199283");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const webhookUrl = "https://smartschedule.app/api/webhooks/whatsapp";
  const verifyToken = "smartschedule_secret_verify_token";

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/agent-config');
        if (res.ok) {
          const data = await res.json();
          if (data.whatsapp?.phoneNumber) {
            setPhoneNumber(data.whatsapp.phoneNumber);
            setIsConnected(data.whatsapp.status === 'CONNECTED');
          }
        }
      } catch (e) {
        console.warn("Using default whatsapp config");
      }
    }
    loadConfig();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshQr = () => {
    setIsRefreshingQr(true);
    setTimeout(() => setIsRefreshingQr(false), 1500);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/agent-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-emerald-400" />
          WhatsApp Connection Hub
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Pair your WhatsApp Business account or Cloud API credentials to enable 24/7 AI lead qualification & booking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Card: QR Code & Device Pair */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-base text-gray-100">
                Device Pair (Web QR Code)
              </h2>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${
                isConnected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              {isConnected ? "Connected & Online" : "Awaiting Pairing"}
            </span>
          </div>

          {/* QR Code Graphic Box */}
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-950 border border-gray-800 relative">
            {isConnected ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    WhatsApp Active (+1 809-555-0100)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Connected as <span className="text-emerald-400 font-semibold">SmartSchedule AI Seller</span>
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsConnected(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    Disconnect Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                {/* Mock QR Code Image SVG */}
                <div className="p-4 bg-white rounded-2xl shadow-xl inline-block">
                  <svg
                    className="w-48 h-48 text-gray-900"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                  >
                    {/* Simulated QR Pattern */}
                    <rect x="0" y="0" width="30" height="30" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" />
                    <rect x="70" y="0" width="30" height="30" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" />
                    <rect x="0" y="70" width="30" height="30" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" />
                    <rect x="40" y="10" width="10" height="30" />
                    <rect x="40" y="50" width="20" height="10" />
                    <rect x="70" y="40" width="20" height="20" />
                    <rect x="50" y="70" width="30" height="20" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 max-w-xs">
                  Open WhatsApp on your phone → Linked Devices → Link a Device and scan this QR code.
                </p>
                <button
                  onClick={handleRefreshQr}
                  disabled={isRefreshingQr}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800 transition-all"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRefreshingQr ? "animate-spin text-emerald-400" : ""
                    }`}
                  />
                  Refresh QR Code
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-300">
              Connection Instructions:
            </h4>
            <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4">
              <li>Keep your WhatsApp phone connected to internet.</li>
              <li>AI agent auto-detects incoming lead greetings and price inquiries.</li>
              <li>Appointments are booked directly into your Google/Internal Calendar.</li>
            </ul>
          </div>
        </div>

        {/* Right Card: Meta Cloud API & Webhook Configuration */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-gray-800/80 space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-gray-100">
              Meta Cloud API & Webhook Integration
            </h2>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Webhook Callback URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
                />
                <button
                  onClick={handleCopyWebhook}
                  className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-800 flex items-center gap-1.5 transition-all"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Verify Token
              </label>
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                placeholder="100654321987654"
                defaultValue="100654321987654"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-gray-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Meta Official Cloud API Supported
            </div>
            <p className="text-[11px] text-gray-400">
              SmartSchedule seamlessly handles incoming WhatsApp webhooks, processes conversation history, and sends replies in under 2 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
