import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

// Fuentes optimizadas con next/font (auto-hosting)
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-playfair',
    style: ['normal', 'italic'],
    weight: ['400', '700'],
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
    title: 'Barbería Andy Martinez | Reservas Online',
    description:
        'Reserva tu cita en la Barbería Andy Martinez. Cortes de cabello premium, barbería profesional.',
    keywords: ['barbería', 'reservas', 'cortes de cabello', 'Andy Martinez', 'barbería premium'],
    authors: [{ name: 'Andy Martinez Barber Club' }],
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
    openGraph: {
        title: 'Barbería Andy Martinez | Reservas Online',
        description: 'Reserva tu cita en la Barbería Andy Martinez. Cortes premium.',
        type: 'website',
        locale: 'es_ES',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
            <head>
                <link rel="dns-prefetch" href="https://supabase.co" />
            </head>
            <body className="bg-[#0a0a0a] text-white antialiased">
                {children}
            </body>
        </html>
    );
}
