-- ================================================================
-- PRODUCTION_DB.SQL - BARBERÍA ANDY MARTINEZ
-- Market Standard: RLS + GDPR Compliance + TIMESTAMPTZ
-- ================================================================
-- 
-- ⚠️ INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar y pegar TODO este script
-- 3. Ejecutar (F5 o botón "Run")
-- 
-- NOTA: Este script BORRA todo lo anterior y crea una estructura segura.
-- ================================================================

-- =============================================
-- 0. LIMPIEZA TOTAL (DROP EVERYTHING)
-- =============================================
DROP VIEW IF EXISTS public.disponibilidad_publica CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.servicios CASCADE;
DROP TABLE IF EXISTS public.barberos CASCADE;
DROP TABLE IF EXISTS public.sucursales CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Limpiar políticas huérfanas si existen
DO $$
BEGIN
    -- Suprimir errores si no existen
    EXECUTE 'DROP POLICY IF EXISTS "anon_select_sucursales" ON sucursales';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================
-- 1. TIPOS ENUM (Estado de reservas)
-- =============================================
DROP TYPE IF EXISTS estado_reserva CASCADE;
CREATE TYPE estado_reserva AS ENUM (
    'pendiente',
    'confirmada',
    'completada',
    'cancelada',
    'no_show'
);

-- =============================================
-- 2. TABLA: SUCURSALES (Catálogo)
-- =============================================
CREATE TABLE public.sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    foto_url TEXT,
    horario_apertura TIME NOT NULL DEFAULT '09:00',
    horario_cierre TIME NOT NULL DEFAULT '20:00',
    dias_laborales INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6], -- 0=Dom, 1=Lun...6=Sab
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Público puede leer, solo service_role puede modificar
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_sucursales" ON public.sucursales
    FOR SELECT TO anon USING (activo = true);

CREATE POLICY "authenticated_select_sucursales" ON public.sucursales
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_sucursales" ON public.sucursales
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- 3. TABLA: BARBEROS (Catálogo)
-- =============================================
CREATE TABLE public.barberos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    foto_url TEXT,
    especialidad TEXT,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0, -- Para ordenar en UI
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.barberos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_barberos" ON public.barberos
    FOR SELECT TO anon USING (activo = true);

CREATE POLICY "authenticated_select_barberos" ON public.barberos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_barberos" ON public.barberos
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Índice para búsqueda por sucursal
CREATE INDEX idx_barberos_sucursal ON public.barberos(sucursal_id) WHERE activo = true;

-- =============================================
-- 4. TABLA: SERVICIOS (Catálogo)
-- =============================================
CREATE TABLE public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    duracion_min INTEGER NOT NULL DEFAULT 30,
    precio DECIMAL(10, 2) NOT NULL,
    categoria TEXT DEFAULT 'general',
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Data Integrity: No duraciones negativas
    CONSTRAINT chk_duracion_positiva CHECK (duracion_min > 0),
    CONSTRAINT chk_precio_positivo CHECK (precio >= 0)
);

ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_servicios" ON public.servicios
    FOR SELECT TO anon USING (activo = true);

CREATE POLICY "authenticated_select_servicios" ON public.servicios
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_servicios" ON public.servicios
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- 5. TABLA: CLIENTES (Privada - Solo Backend)
-- =============================================
-- Los datos de clientes NUNCA se exponen al frontend anónimo
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    celular TEXT UNIQUE NOT NULL, -- Identificador único
    nombre TEXT,
    email TEXT,
    notas TEXT, -- Preferencias, alergias, etc.
    total_visitas INTEGER DEFAULT 0,
    ultima_visita TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- ⚠️ BLOQUEADO para anon: No pueden ver teléfonos de otros clientes
-- Solo authenticated (admin/barber) y service_role tienen acceso
CREATE POLICY "authenticated_select_clientes" ON public.clientes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_clientes" ON public.clientes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permitir que anon pueda INSERTAR un cliente nuevo (al reservar)
CREATE POLICY "anon_insert_clientes" ON public.clientes
    FOR INSERT TO anon WITH CHECK (true);

-- Índice para búsqueda rápida por celular
CREATE UNIQUE INDEX idx_clientes_celular ON public.clientes(celular);

-- =============================================
-- 6. TABLA: RESERVAS (Protegida - EL RETO GDPR)
-- =============================================
CREATE TABLE public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencias
    sucursal_id UUID NOT NULL REFERENCES public.sucursales(id),
    barbero_id UUID NOT NULL REFERENCES public.barberos(id),
    servicio_id UUID NOT NULL REFERENCES public.servicios(id),
    cliente_id UUID REFERENCES public.clientes(id),
    
    -- Datos de la cita (TIMESTAMPTZ = UTC aware)
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_min INTEGER NOT NULL DEFAULT 30,
    
    -- Estado
    estado estado_reserva DEFAULT 'pendiente',
    
    -- Datos redundantes para consultas rápidas (desnormalización controlada)
    cliente_nombre TEXT, -- Cache del nombre para mostrar sin JOIN
    cliente_celular TEXT NOT NULL, -- Para búsqueda rápida
    
    -- Metadata
    origen TEXT DEFAULT 'web', -- 'web', 'admin', 'whatsapp'
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_duracion_reserva_positiva CHECK (duracion_min > 0)
);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- ⚠️ POLÍTICA CRÍTICA DE PRIVACIDAD:
-- anon NO puede hacer SELECT directo en reservas (vería celulares)
-- Solo puede INSERTAR (crear su propia cita)
CREATE POLICY "anon_insert_reservas" ON public.reservas
    FOR INSERT TO anon WITH CHECK (true);

-- authenticated (admins/barbers) pueden ver y modificar
CREATE POLICY "authenticated_all_reservas" ON public.reservas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- service_role tiene acceso total
CREATE POLICY "service_role_all_reservas" ON public.reservas
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =============================================
-- Índice compuesto para consultas de disponibilidad (CRÍTICO)
CREATE INDEX idx_agenda ON public.reservas(barbero_id, fecha_hora);

-- Índice para filtrar por estado
CREATE INDEX idx_reservas_estado ON public.reservas(estado) WHERE estado IN ('pendiente', 'confirmada');

-- Índice para búsqueda por fecha
CREATE INDEX idx_reservas_fecha ON public.reservas(fecha_hora);

-- Índice para búsqueda por cliente
CREATE INDEX idx_reservas_cliente ON public.reservas(cliente_celular);

-- =============================================
-- 8. VISTA SEGURA: disponibilidad_publica
-- =============================================
-- Esta vista expone SOLO los datos necesarios para mostrar
-- los slots ocupados, SIN revelar información de clientes.
-- 
-- Market Standard: security_invoker = true (Postgres 15+)
-- hace que la vista respete RLS de las tablas subyacentes.

CREATE VIEW public.disponibilidad_publica
WITH (security_invoker = true)
AS SELECT
    r.id,
    r.barbero_id,
    r.sucursal_id,
    r.fecha_hora,
    r.duracion_min,
    r.estado
FROM public.reservas r
WHERE r.estado IN ('pendiente', 'confirmada');

-- Dar acceso de lectura a la vista para anon
GRANT SELECT ON public.disponibilidad_publica TO anon;
GRANT SELECT ON public.disponibilidad_publica TO authenticated;

-- =============================================
-- 9. TABLA: ADMINS (Para autenticación futura)
-- =============================================
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- Referencia a auth.users si usas Supabase Auth
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT, -- Hash del PIN, no plaintext
    rol TEXT DEFAULT 'admin', -- 'admin', 'manager', 'viewer'
    activo BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede acceder a admins
CREATE POLICY "service_role_all_admins" ON public.admins
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- 10. FUNCIONES HELPER
-- =============================================

-- Función para obtener o crear cliente por celular
CREATE OR REPLACE FUNCTION public.get_or_create_cliente(
    p_celular TEXT,
    p_nombre TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del owner (postgres)
AS $$
DECLARE
    v_cliente_id UUID;
BEGIN
    -- Buscar cliente existente
    SELECT id INTO v_cliente_id
    FROM public.clientes
    WHERE celular = p_celular;
    
    -- Si no existe, crear
    IF v_cliente_id IS NULL THEN
        INSERT INTO public.clientes (celular, nombre)
        VALUES (p_celular, p_nombre)
        RETURNING id INTO v_cliente_id;
    ELSE
        -- Actualizar nombre si se proporciona y no tiene
        IF p_nombre IS NOT NULL THEN
            UPDATE public.clientes
            SET nombre = COALESCE(nombre, p_nombre),
                updated_at = now()
            WHERE id = v_cliente_id AND nombre IS NULL;
        END IF;
    END IF;
    
    RETURN v_cliente_id;
END;
$$;

-- Dar permiso a anon para ejecutar esta función
GRANT EXECUTE ON FUNCTION public.get_or_create_cliente TO anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_cliente TO authenticated;

-- Función para verificar disponibilidad de slot
CREATE OR REPLACE FUNCTION public.check_slot_disponible(
    p_barbero_id UUID,
    p_fecha_hora TIMESTAMPTZ,
    p_duracion_min INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflicto INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_conflicto
    FROM public.reservas
    WHERE barbero_id = p_barbero_id
      AND estado IN ('pendiente', 'confirmada')
      AND (
          -- El nuevo slot empieza durante una cita existente
          (p_fecha_hora >= fecha_hora AND p_fecha_hora < fecha_hora + (duracion_min || ' minutes')::INTERVAL)
          OR
          -- El nuevo slot termina durante una cita existente
          (p_fecha_hora + (p_duracion_min || ' minutes')::INTERVAL > fecha_hora 
           AND p_fecha_hora + (p_duracion_min || ' minutes')::INTERVAL <= fecha_hora + (duracion_min || ' minutes')::INTERVAL)
          OR
          -- El nuevo slot envuelve completamente una cita existente
          (p_fecha_hora <= fecha_hora AND p_fecha_hora + (p_duracion_min || ' minutes')::INTERVAL >= fecha_hora + (duracion_min || ' minutes')::INTERVAL)
      );
    
    RETURN v_conflicto = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_slot_disponible TO anon;
GRANT EXECUTE ON FUNCTION public.check_slot_disponible TO authenticated;

-- =============================================
-- 11. TRIGGER: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Aplicar a todas las tablas
CREATE TRIGGER set_updated_at_sucursales
    BEFORE UPDATE ON public.sucursales
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_barberos
    BEFORE UPDATE ON public.barberos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_servicios
    BEFORE UPDATE ON public.servicios
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_clientes
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_reservas
    BEFORE UPDATE ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 12. DATOS INICIALES (Seeds)
-- =============================================

-- Sucursal principal
INSERT INTO public.sucursales (nombre, direccion, telefono, horario_apertura, horario_cierre)
VALUES ('Andy Martinez Barber Club', 'Av. Principal #123, Santa Cruz', '+591 78912345', '09:00', '20:00');

-- Servicios básicos
INSERT INTO public.servicios (nombre, descripcion, duracion_min, precio, categoria, orden) VALUES
('Corte Clásico', 'Corte tradicional con máquina y tijera', 30, 50.00, 'cortes', 1),
('Corte Fade', 'Degradado moderno con acabado pulido', 45, 70.00, 'cortes', 2),
('Barba Completa', 'Recorte y perfilado de barba con navaja', 30, 40.00, 'barba', 3),
('Corte + Barba', 'Combo completo de corte y barba', 60, 100.00, 'combos', 4),
('Diseño Premium', 'Corte artístico con diseños personalizados', 60, 120.00, 'premium', 5);

-- =============================================
-- 13. STORAGE BUCKET: barberos-content
-- =============================================
-- NOTA: Esto se debe ejecutar separadamente en la sección
-- "Storage" de Supabase o usando la API.
-- 
-- El SQL para crear políticas de storage es:

-- Crear bucket (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('barberos-content', 'barberos-content', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Cualquiera puede descargar (SELECT/read)
CREATE POLICY "public_read_barberos_content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barberos-content');

-- Política: Solo authenticated puede subir (INSERT)
CREATE POLICY "authenticated_upload_barberos_content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'barberos-content');

-- Política: Solo authenticated puede actualizar
CREATE POLICY "authenticated_update_barberos_content"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'barberos-content');

-- =============================================
-- ✅ SCRIPT COMPLETADO
-- =============================================
-- 
-- Resumen de seguridad:
-- ✅ RLS habilitado en TODAS las tablas
-- ✅ Catálogos (sucursales, barberos, servicios): Lectura pública
-- ✅ Clientes: Lectura SOLO para authenticated/service_role
-- ✅ Reservas: anon solo puede INSERT, no SELECT
-- ✅ Vista disponibilidad_publica: Expone solo slots sin datos de clientes
-- ✅ TIMESTAMPTZ usado en todos los campos de fecha (UTC aware)
-- ✅ Índices optimizados para consultas de disponibilidad
-- ✅ Storage bucket con políticas adecuadas
--
-- Próximos pasos:
-- 1. Configurar variables de entorno en Vercel
-- 2. Crear al menos un barbero desde el Dashboard de Supabase
-- 3. Probar el flujo de reserva desde el frontend
-- =============================================
