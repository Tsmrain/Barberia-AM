/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimización de imágenes agresiva para Vercel Free Tier
  images: {
    // Solo 3 tamaños de dispositivo para ahorrar ancho de banda
    deviceSizes: [640, 750, 1080],
    // Tamaños pequeños para iconos
    imageSizes: [16, 32, 48],
    // Permitir cualquier hostname para imágenes de Supabase Storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Formato optimizado
    formats: ['image/webp'],
  },

  // Headers de cache agresivo para CDN de Vercel
  async headers() {
    return [
      {
        // Cache agresivo para imágenes optimizadas por Next.js
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
      {
        // Cache agresivo para imágenes estáticas
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|gif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
      {
        // Cache agresivo para fuentes
        source: '/:all*(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
      {
        // Cache para assets estáticos de Next.js
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Transpilación de paquetes problemáticos
  transpilePackages: ['framer-motion', 'lucide-react'],
};

export default nextConfig;
