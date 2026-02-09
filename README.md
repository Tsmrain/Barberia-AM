# Barber Club App (Next.js + Supabase)

Aplicación de reservas para barbería, optimizada para rendimiento y costos (Supabase Free Tier).

## 🗂 Estructura del Proyecto

El código sigue una arquitectura modular y limpia:

-   **/database**: Scripts SQL críticos para inicializar y optimizar la base de datos.
-   **/lib/services**: Lógica de negocio separada por dominios (`booking`, `catalog`, `client`).
-   **/components**: Componentes de UI reutilizables.
-   **/app**: Rutas y páginas de Next.js (App Router).

## 🚀 Configuración Inicial (Base de Datos)

Si acabas de crear un proyecto nuevo en Supabase (ej. en `sa-east-1`):

1.  Ve a la carpeta `database/`.
2.  Sigue las instrucciones en `database/README.md`.
    -   Ejecuta primero `01_tablas_y_datos.sql`.
    -   Ejecuta después `02_indices_optimizacion.sql`.

## 🛠 Ejecutar Localmente

1.  Instalar dependencias:
    ```bash
    npm install
    ```
2.  Configurar variables de entorno en `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
    ```
3.  Correr la aplicación:
    ```bash
    npm run dev
    ```

## ☁️ Despliegue en Vercel

Lee la guía detallada en `VERCEL_DEPLOYMENT_GUIDE.md` para desplegar con coste cero y máxima velocidad.
