import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartSchedule — WhatsApp AI Seller & Appointment Scheduler",
  description: "Automated WhatsApp AI sales agent that qualifies leads and books appointments 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0b0f19] text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
