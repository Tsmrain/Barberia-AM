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

## 3. Limitaciones del Plan Gratuito (FinOps) - ESTRATEGIA CERO COSTO

He analizado la documentación oficial de Vercel (Functions & Middleware Pricing) y hemos blindado tu aplicación para que no genere costos:

### **A. Serverless Functions (El mayor riesgo de costo)**
-   **Tu Ventaja:** Tu aplicación usa **Client-Side Rendering (CSR)**.
-   **¿Qué significa?** Cuando un usuario carga la página, su navegador se conecta DIRECTAMENTE a Supabase para pedir los datos.
-   **Resultado:** Vercel **NO EJECUTA NINGUNA FUNCIÓN** de backend para servir tus datos.
-   **Costo:** $0.00 (Porque no usas CPU de Vercel para la lógica).
-   **Acción:** Hemos eliminado la carpeta `app/api` por completo para evitar tentaciones.

### **B. Edge Middleware (Se cobra por invocación)**
-   **Tu Ventaja:** **NO TIENES** archivo `middleware.ts` en tu proyecto.
-   **¿Qué significa?** Vercel sirve tus archivos (HTML, CSS, JS) directamente desde la CDN (red global de servidores) sin procesar nada.
-   **Resultado:** 0 Invocaciones de Middleware.
-   **Costo:** $0.00.

### **C. Image Optimization (1,000 / mes)**
-   **Tu Ventaja:** Hemos configurado `next.config.mjs` para limitar los tamaños generados.
-   **Estrategia:** Solo se optimizan imágenes críticas (logos, UI). Las fotos de barberos se sirven, pero con tamaños controlados.
-   **Monitoreo:** Si pasas las 1,000 imágenes optimizadas, Vercel pausará la optimización (no te cobrará extra automáticamente en Hobby, pero las imágenes se verán sin optimizar o darán error 402).

---

## 4. Estrategia de Región y Latencia (Docs Analysis)

Según la documentación de Vercel (`configuring-functions/region`):

1.  **Vercel Functions (Server Side):**
    -   Por defecto están en `iad1` (Washington, D.C.).
    -   **En Plan Hobby:** NO PUEDES cambiar la región de las Serverless Functions a Sudamérica (`gru1`). Estás limitado a regiones específicas (generalmente US, EU).
    -   **¡PERO NO IMPORTA!** Como usamos Client-Side Rendering, tu usuario (en Sudamérica) se conecta a Supabase (en Sao Paulo) directamente. La "Function Region" de Vercel solo afectaría si tuviéramos API Routes, que **ya borramos**.

2.  **Vercel Edge Network (CDN):**
    -   Es global y automática.
    -   Un usuario en Santiago/Bolivia descargará tu Web (HTML/JS) desde el nodo de borde más cercano (ej. Santiago, Sao Paulo o Lima), **independientemente** de la región de la función.
    -   **Conclusión:** Tu latencia para cargar la app será mínima (<100ms) y tus datos cargarán rápido porque van directo a Sao Paulo.

---

## 5. Resumen de Arquitectura "Zero Cost"

| Componente Vercel | Uso en tu App | Costo Estimado | Razón |
| :--- | :--- | :--- | :--- |
| **Functions** | 0 GB-Hrs | **$0** | Todo es Client-Side + Supabase directo. |
| **Middleware** | 0 Invocations | **$0** | No archivo middleware.ts implicado. |
| **Bandwidth** | < 100 GB | **$0** | Plan Hobby incluye 100GB. CSR ahorra mucho ancho de banda. |
| **Images** | < 1000 Source | **$0** | Configuración restrictiva en next.config.mjs. |


---

## 6. Build Command

```bash
npm run build
```

Si el despliegue falla por chequeos de tipos (TypeScript), puedes desactivarlos temporalmente en `next.config.mjs` (solo si es emergencia), pero lo ideal es corregirlos.

## 6. Monitoreo Post-Despliegue

1.  Entra a `Analytics` en Vercel (Pestaña).
2.  Activa "Web Vitals" para medir la velocidad real en los celulares de tus clientes.
3.  Si el "LCP" (Largest Contentful Paint) es mayor a 2.5s, revisa si las imágenes de los barberos son muy pesadas.
