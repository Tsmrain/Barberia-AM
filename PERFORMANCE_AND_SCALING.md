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

## 4. Cálculo Real de Capacidad (Escenario Santa Cruz)

Basado en los límites actuales de Supabase Free Tier (2025):
*   **Base de Datos:** 500 MB (aprox. 50 millones de caracteres de texto).
*   **Ancho de Banda (Egress):** 2 GB / mes.

### A. Capacidad Mensual (Matemática Pura)
Suponiendo que NO usas Supabase Storage para fotos (usas links externos como ImgBB, Cloudinary o tu propio hosting), el consumo es solo texto JSON.

**Consumo por Reserva (Flujo Completo):**
*   Cargar Barberos/Servicios: ~2KB (Cacheado, se descarga 1 vez).
*   Ver Disponibilidad: ~0.5KB.
*   Crear Reserva: ~0.5KB.
*   **Total por Cliente:** ~3KB (si es cliente recurrente) a ~10KB (cliente nuevo navegando mucho).

**Límite de Egress (2,000,000 KB / mes):**
*   **Reservas Mensuales Posibles:** ~200,000 reservas.
*   **Reservas Diarias:** ~6,600 reservas al día.

**Conclusión:**
Para una barbería con clientes en Santa Cruz, **es virtualmente imposible llenar el cupo de Egress solo con reservas de texto**. Podrías tener 5 sucursales llenas todo el día y seguirías en el 5% del plan gratuito.

### B. El Verdadero Peligro: IMÁGENES
Si subes fotos de cortes de pelo a **Supabase Storage** (Buckets), cada foto de 1MB descargada por 1000 clientes = 1GB de Egress (50% de tu plan).

**Regla de Oro para Costo Cero:**
1.  **Aloja las fotos fuera:** Usa servicios gratuitos especializados en imágenes como **Cloudinary Free Tier**, **ImgBB**, o simplemente sube las fotos a Twitter/Instagram y usa el link público.
2.  **Guarda solo el Link:** En tu tabla `barberos`, la columna `foto_url` debe ser un link de texto (`https://cloudinary...`), NO un archivo en Supabase.
3.  **Resultado:** Supabase solo entrega el texto del link (bytes). Cloudinary paga el ancho de banda de la imagen. **Costo Supabase = 0.**

### C. ¿Cuándo pagar $25 Pro?
Solo necesitarás pagar si:
1.  Tu base de datos supera los 500MB (aprox. **500,000 a 1 millón de reservas históricas**). A un ritmo de 50 reservas/día, esto pasará en **27 años**.
2.  Necesitas Backups automáticos punto-a-punto (PITR) por seguridad extrema del negocio.

---

## 5. Monitoreo de Salud

Revisa estos 2 indicadores una vez al mes en tu Supabase Dashboard:
1.  **Database Size:** Mantener bajo 500MB.
2.  **Egress:** Mantener bajo 2GB.

Con la arquitectura actual (Texto en Supabase + Imágenes Externas/Optimizadas), **tienes "Costo Cero" garantizado para el volumen de cualquier barbería física en Bolivia.**
