# Guía de Gestión de Imágenes (Estrategia Costo Cero)

Esta guía explica cómo manejar las imágenes en tu aplicación para garantizar que el costo de Supabase y Vercel se mantenga en **$0 para siempre**, incluso si Andy agrega cientos de barberos.

---

## 1. Los Dos Tipos de Imágenes

Es vital entender la diferencia entre "Imágenes de la App" e "Imágenes de Contenido".

### A. Imágenes Estáticas (Ej: `public/logo.png`)
Son imágenes que **NO cambian** frecuentemente (el logo, iconos, fondos).
*   **¿Dónde viven?** En la carpeta `public/` del código.
*   **¿Costo?** **$0**. Vercel las sirve gratis.
*   **¿Cómo se cambian?** Requiere llamar al programador para que actualice el código y haga un nuevo despliegue.
*   **Ejemplo:** `public/barber-logo-optimized.webp`.

### B. Imágenes Dinámicas (Ej: Fotos de Barberos Nuevos)
Son imágenes que **Andy (el dueño)** quiere subir, cambiar o borrar cuando contrata a alguien nuevo.
*   **El Problema:** Si Andy sube la foto directo a tu base de datos (Supabase Storage), te cobran por cada vez que alguien la ve.
*   **La Solución Costo Cero:** "Alojamiento Externo".

---

## 2. Flujo de Trabajo para Andy (Agregar Barberos)

Como tu aplicación busca el "Costo Cero" absoluto, no usamos el almacenamiento de pago de Supabase. El flujo para agregar un barbero es:

### Paso 1: Subir la Foto a la Nube (Gratis)
Andy no debe subir el archivo `Andyfoto.png` a tu app. Debe subirlo a un host de imágenes gratuito. Opción recomendada: **ImgBB** o **Cloudinary**.

1.  Entrar a [imgbb.com](https://imgbb.com/) (No requiere cuenta, es gratis).
2.  Arrastrar la foto `Andyfoto.png`.
3.  En "Elegir tiempo de expiración", seleccionar **"No eliminar nunca"**.
4.  Darle a "Subir".
5.  Copiar el **"Enlace directo"** (debe terminar en `.png` o `.jpg`).
    *   *Ejemplo:* `https://i.ibb.co/wB7X/andy-foto.png`

### Paso 2: Usar el Link en Supabase
1.  Ir al Panel de Administración (o Supabase Dashboard > Table Editor > `barberos`).
2.  Crear el nuevo barbero.
3.  En el campo `foto_url`, pegar el link de ImgBB.
    *   `https://i.ibb.co/wB7X/andy-foto.png`

### ¿Por qué esto es Costo Cero?
*   Tu aplicación solo guarda **texto** (el link).
*   Cuando un cliente abre la app, su navegador descarga la imagen desde los servidores de ImgBB.
*   **Supabase no gasta ancho de banda.**
*   **Vercel no gasta ancho de banda.**
*   **Costo Total:** $0.

---

## 3. Resumen para el Dueño

| Acción | ¿Cómo se hace? | Costo |
| :--- | :--- | :--- |
| **Cambiar Logo** | Llamar al desarrollador. Se cambia en el código (`public/`). | $0 |
| **Nuevo Barbero** | 1. Subir foto a ImgBB. <br> 2. Pegar link en el sistema. | $0 |
| **Editar Servicio** | Cambiar texto/precio en el sistema. | $0 |
