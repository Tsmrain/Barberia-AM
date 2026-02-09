# 🚀 Despliegue en Vercel (Coste Cero + Performance)

Sigue estos pasos EXACTOS para asegurar que tu despliegue sea gratuito y ultrarrápido.

## 1. Configuración del Proyecto (Project Settings)

### **Framework Preset**
- Selecciona **Next.js**.
- Vercel detectará automáticamente tu configuración.

### **Environment Variables (Variables de Entorno)**
Agrega las mismas que tienes en tu `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: (Tu URL de Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Tu llave pública anónima de Supabase)

---

## 2. Configuración de Región (CRÍTICO para Latencia)

Por defecto, Vercel despliega en `Washington, D.C. (iad1)`. Esto obliga a tus datos a viajar miles de kilómetros si tu Supabase está en Sao Paulo o en otra región.

1.  Ve a **Project Settings** -> **Functions**.
2.  Busca **Function Region**.
3.  Selecciona la región **MÁS CERCANA** a donde creaste tu proyecto de Supabase.
    *   Si tu Supabase está en **Sao Paulo (sa-east-1)** -> Selecciona **sfo1** (San Francisco) o **iad1** si no hay opción SA, pero verifica las opciones disponibles en el plan gratuito. Generalmente el plan gratuito te limita, pero si puedes elegir `gru1` (Sao Paulo) sería ideal, aunque a menudo es Pro.
    *   **Si estás en Free Tier y no puedes cambiar a Sao Paulo:** Deja `iad1` (Washington) y asegúrate de que tu Supabase esté en `us-east-1` (N. Virginia) para latencia cero.
    *   **Regla de Oro:** Servidor Vercel y Servidor Supabase deben estar en la misma ciudad o continente.

---

## 3. Limitaciones del Plan Gratuito (FinOps)

### **Image Optimization (1,000 / mes)**
Hemos configurado `next.config.mjs` para reducir drásticamente el consumo de este límite.
-   **Solución:** Se generan menos tamaños de imagen innecesarios.
-   **Monitoreo:** Revisa la pestaña "Usage" en Vercel. Si te acercas a 1,000, considera alojar las imágenes ya optimizadas (WebP) en Supabase Storage directamente y servirlas sin el componente `<Image>` optimizado, o usar un servicio externo como Cloudinary.

### **Serverless Function Execution (100 GB-hours)**
Esto equivale a millones de invocaciones rápidas.
-   Tu aplicación usa **Client-Side Rendering (CSR)** con Supabase para casi todo.
-   **Ventaja:** Tu backend es Supabase, no Vercel. Vercel solo sirve el HTML/JS estático.
-   **Resultado:** Consumo de Vercel Functions cercano a **CERO**.

---

## 4. Cache & CDN (Edge Network)

Tu aplicación ya está configurada para aprovechar la red Edge de Vercel:
-   **Assets Estáticos (JS/CSS/Imágenes):** Se cachean automáticamente en todo el mundo.
-   **API Responses:** Como consultamos Supabase directamente desde el cliente (`useEffect`), evitamos que Vercel tenga que procesar y cobrarte por funciones API intermedias (API Routes), salvo casos muy específicos.

---

## 5. Build Command

```bash
npm run build
```

Si el despliegue falla por chequeos de tipos (TypeScript), puedes desactivarlos temporalmente en `next.config.mjs` (solo si es emergencia), pero lo ideal es corregirlos.

## 6. Monitoreo Post-Despliegue

1.  Entra a `Analytics` en Vercel (Pestaña).
2.  Activa "Web Vitals" para medir la velocidad real en los celulares de tus clientes.
3.  Si el "LCP" (Largest Contentful Paint) es mayor a 2.5s, revisa si las imágenes de los barberos son muy pesadas.
