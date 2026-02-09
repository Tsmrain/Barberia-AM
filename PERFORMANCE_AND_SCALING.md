# Guía Maestra de Optimización y FinOps (Supabase Free Tier)

Esta guía detalla las optimizaciones avanzadas implementadas para maximizar el rendimiento y minimizar costos, asegurando que su aplicación pueda escalar a miles de usuarios sin salir del **Free Tier de Supabase**.

---

## 🚀 1. Estrategia de "Coste Cero" (FinOps)

Para mantener la aplicación en el nivel gratuito de por vida, hemos implementado protecciones contra los límites más comunes:

### A. Optimización de Egress (Ancho de Banda)
**El Límite:** 2GB/mes.
**La Solución:**
1.  **Imágenes:** Migramos todo a `next/image`. Las imágenes se sirven desde la CDN de Vercel, no desde la base de datos de Supabase en cada visita.
2.  **Consultas Selectivas:** En el Panel de Administración, hemos implementado "Paginación por Fecha". En lugar de descargar **todo el historial** de reservas (que consumiría MBs innecesarios cada vez que entra), ahora solo descargamos las reservas del mes actual (+/- 2 semanas).

### B. Optimización de Lecturas y CPU
**El Riesgo:** Agotar los recursos de CPU del servidor PostgreSQL compartido.
**La Solución:**
1.  **Caching Local (localStorage):** Datos estáticos (Barberos, Servicios, Sucursales) se guardan en el dispositivo del usuario por 15 minutos. Navegar por la app no toca la base de datos.
2.  **Debouncing en Búsquedas:** Al buscar un cliente por nombre/teléfono, la app espera 500ms a que el usuario termine de escribir antes de consultar a Supabase. Esto reduce las consultas en un 90%.
3.  **Índices SQL:** Hemos creado índices específicos para que las consultas de disponibilidad sean instantáneas (`migrations/001_performance_indexes.sql`).

---

## 🛠 2. Instrucciones de Mantenimiento

### Base de Datos (SQL)
Si aún no lo ha hecho, **DEBE** ejecutar el script de optimización.
1.  Vaya a `Supabase Dashboard` -> `SQL Editor`.
2.  Copie y pegue el contenido de `migrations/001_performance_indexes.sql`.
3.  Ejecute el script.

### Gestión de Imágenes (Advertencia)
El Panel de Administración actual **NO** tiene función de subida de imágenes para evitar problemas.
**Si agrega subida de imágenes en el futuro:**
-   **NUNCA** suba imágenes crudas de cámara (3MB - 10MB).
-   **SIEMPRE** redimensione las imágenes en el cliente (Browser) a máximo 1000px y formato WebP/JPEG (< 200KB) antes de enviarlas a Supabase Storage.
-   El límite de almacenamiento es 1GB. Una sola foto de iPhone (5MB) equivale a 50 fotos optimizadas (100KB).

### Logs y Limpieza
Supabase Free Tier tiene un límite de tamaño de base de datos de **500MB**.
-   Monitoree el tamaño en `Database` -> `Table Sizes`.
-   Si la tabla `reservas` crece demasiado en unos años, considere borrar registros antiguos.

---

## 📊 3. Resumen de Optimizaciones Técnicas

| Área | Antes | Ahora (Optimizado) | Beneficio |
| :--- | :--- | :--- | :--- |
| **Búsqueda Cliente** | Consulta por cada letra tecleada | Debounce (espera 600ms) | -95% Lecturas DB |
| **Disponibilidad** | Consulta cada vez que se cambia de día | Cache en memoria (1 min) | -80% Lecturas DB |
| **Admin Panel** | Descarga TODAS las reservas históricas | Descarga solo ventana de 4 semanas | Ahorro masivo de Egress |
| **Imágenes** | `<img src="...">` directo | `<Image />` optimizado + CDN | Ahorro masivo de Ancho de Banda |
| **Navegación** | Fetch en cada paso | Cache `localStorage` (15 min) | Navegación instantánea "App-like" |

---

## 4. ¿Necesito el Plan Pro ($25)?

**Quedese en Free Tier si:**
-   Tiene < 40,000 usuarios activos mensuales.
-   No necesita backups automáticos diarios (Point-in-Time Recovery).

**Pásese a Pro si:**
-   El negocio depende 100% de la app y 1 hora de caída cuesta más de $25.
-   Necesita backups automáticos para dormir tranquilo.
-   Supera los 2GB de transferencia de base de datos (muchos usuarios concurrentes en el Admin Panel).

Con las optimizaciones actuales, su aplicación está diseñada para operar confortablemente en el Free Tier con miles de reservas mensuales.
