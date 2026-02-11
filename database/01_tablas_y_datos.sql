-- ==========================================
-- SUPABASE SCHEMA V2.0 - BASED ON MOCK DATA
-- ==========================================

-- 1. CLEANUP (Destructive drop to ensure clean slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.servicios CASCADE;
DROP TABLE IF EXISTS public.barberos CASCADE;
DROP TABLE IF EXISTS public.sucursales CASCADE;

-- Drop Types
DROP TYPE IF EXISTS public.ranking_cliente CASCADE;
DROP TYPE IF EXISTS public.estado_reserva CASCADE;
DROP TYPE IF EXISTS public.estado_sucursal CASCADE;
DROP TYPE IF EXISTS public.origen_reserva CASCADE;

-- 2. ENUMS
CREATE TYPE public.ranking_cliente AS ENUM ('nuevo', 'frecuente', 'vip');
CREATE TYPE public.estado_reserva AS ENUM ('pendiente', 'confirmado', 'cancelado', 'no_show', 'completado');
CREATE TYPE public.estado_sucursal AS ENUM ('abierto', 'cerrado', 'auto');
CREATE TYPE public.origen_reserva AS ENUM ('guest', 'admin', 'walkin', 'google');

-- 3. TABLES (Matching Mock Data Structure)

-- SUCURSALES (Branches)
CREATE TABLE public.sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL,
    mapa_url TEXT,
    horario_apertura INTEGER NOT NULL DEFAULT 9, 
    horario_cierre INTEGER NOT NULL DEFAULT 21,
    estado_actual estado_sucursal NOT NULL DEFAULT 'auto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BARBEROS (Barbers)
CREATE TABLE public.barberos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    bio_corta TEXT,
    foto_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SERVICIOS (Services)
CREATE TABLE public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    duracion_min INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CLIENTES (Clients)
CREATE TABLE public.clientes (
    celular TEXT PRIMARY KEY, 
    nombre_completo TEXT NOT NULL,
    ranking ranking_cliente NOT NULL DEFAULT 'nuevo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RESERVAS (Bookings)
CREATE TABLE public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_reserva NOT NULL DEFAULT 'pendiente',
    origen origen_reserva NOT NULL DEFAULT 'guest',
    
    -- Relationships
    cliente_celular TEXT NOT NULL REFERENCES public.clientes(celular) ON DELETE RESTRICT,
    barbero_id UUID NOT NULL REFERENCES public.barberos(id) ON DELETE RESTRICT,
    servicio_id UUID NOT NULL REFERENCES public.servicios(id) ON DELETE RESTRICT,
    sucursal_id UUID NOT NULL REFERENCES public.sucursales(id) ON DELETE RESTRICT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS POLICIES (Open for now, lock down later)
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barberos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write" ON public.sucursales USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write" ON public.barberos USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write" ON public.servicios USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write" ON public.clientes USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write" ON public.reservas USING (true) WITH CHECK (true);

-- 5. SEED DATA (Exact Mock Data Replication)

-- Branches
INSERT INTO public.sucursales (id, nombre, direccion, mapa_url, horario_apertura, horario_cierre, estado_actual)
VALUES 
    ('b1f8eb48-4384-469b-9801-444444444441', '4to Anillo', 'Doble Vía La Guardia, 4to Anillo', 'https://maps.app.goo.gl/8ZKBwRkcTMpETbhj8', 9, 21, 'auto'),
    ('b2f8eb48-4384-469b-9801-444444444442', '6to Anillo', 'Doble Vía La Guardia, 6to Anillo', 'https://maps.app.goo.gl/fabTd3WcxFJtjbMB7', 9, 21, 'auto');

-- Barbers
INSERT INTO public.barberos (nombre, bio_corta, activo, foto_url, sucursal_id)
VALUES
    ('Andy', 'Master Barber', TRUE, 'https://picsum.photos/200/200?random=1', 'b1f8eb48-4384-469b-9801-444444444441'),
    ('Mateo', 'Fade Specialist', TRUE, 'https://picsum.photos/200/200?random=2', 'b1f8eb48-4384-469b-9801-444444444441'),
    ('Leo', 'Beard Expert', TRUE, 'https://picsum.photos/200/200?random=3', 'b2f8eb48-4384-469b-9801-444444444442');

-- Services
INSERT INTO public.servicios (nombre, precio, duracion_min, descripcion)
VALUES
    ('Corte Clásico', 60.00, 60, 'Corte tradicional con técnica de tijera y acabado pulido.'),
    ('Corte + Lavado', 80.00, 60, 'Corte de cabello con lavado refrescante incluido.'),
    ('Arreglo Completo de Barba', 35.00, 60, 'Perfilado, rebajado y tratamiento para la piel.'),
    ('Solo Perfilado de Barba', 20.00, 60, 'Definición de líneas y contornos de la barba.'),
    ('Diseño y Limpieza de Cejas', 20.00, 60, 'Diseño acorde a la morfología de tu rostro.'),
    ('Limpieza Facial Fresh', 90.00, 60, 'Exfoliación profunda, vapor y mascarilla hidratante.'),
    ('Plan BÁSICO', 90.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Perfilado de Cejas.'),
    ('Plan Premium', 110.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa.'),
    ('Plan VIP', 130.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa + Perfilado de Cejas.');

alter table reservas add column comision_pagada boolean default false;


