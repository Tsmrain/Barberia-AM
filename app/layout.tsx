import React from 'react';
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClientToaster } from "@/components/ui/ClientToaster";

// Optimize fonts: Hosted by Vercel, zero CLS
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ['normal', 'italic']
});

export const metadata: Metadata = {
  title: "Barbería Andy | Premium Cuts",
  description: "Reserva tu experiencia de corte de alta gama.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#0a0a0a] text-white antialiased selection:bg-amber-500/30">
        {/* Anti-cache Script for Service Workers Migration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                });
              }
            `,
          }}
        />
        <main className="min-h-screen w-full overflow-x-hidden relative">
          {/* Global Background Gradient Mesh */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 w-full min-h-screen flex flex-col">
            {children}
          </div>
        </main>

        <ClientToaster />
      </body>
    </html>
  );
}