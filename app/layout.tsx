import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetLab Studio — Packet Tracer++ Edition",
  description: "Mô phỏng hạ tầng mạng 100% Client-side: State Machine + Multi-Layer Packet Engine, 14 thiết bị mạng/server, xưởng bấm cáp RJ45 8 đèn LED, CLI Cisco IOS & Ubuntu Bash đồng bộ 2 chiều, Wireshark-lite OSI Inspector",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
