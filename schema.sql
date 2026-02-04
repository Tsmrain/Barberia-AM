-- FASE 1: ARQUITECTURA DE BASE DE DATOS
-- Limpiar esquema anterior si existe
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS barberos;
DROP TABLE IF EXISTS sucursales;
DROP TYPE IF EXISTS ranking_cliente;
DROP TYPE IF EXISTS estado_reserva;

-- Enums para consistencia
CREATE TYPE ranking_cliente AS ENUM ('nuevo', 'frecuente', 'vip');
-- Estados actualizados para ciclo de vida completo
CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmado', 'cancelado', 'completado', 'no_show');

-- Tabla: Sucursales
CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL,
    mapa_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla: Barberos
CREATE TABLE barberos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    foto_url TEXT,
    bio_corta TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla: Servicios
CREATE TABLE servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_min INTEGER NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla: Clientes (La clave es el celular)
CREATE TABLE clientes (
    celular TEXT PRIMARY KEY, -- LLAVE ÚNICA: NÚMERO DE CELULAR
    nombre_completo TEXT NOT NULL,
    ranking ranking_cliente DEFAULT 'nuevo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla: Reservas
CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_reserva DEFAULT 'pendiente',
    cliente_celular TEXT REFERENCES clientes(celular) ON DELETE CASCADE,
    barbero_id UUID REFERENCES barberos(id),
    servicio_id UUID REFERENCES servicios(id),
    sucursal_id UUID REFERENCES sucursales(id),
    origen TEXT DEFAULT 'guest', -- 'google', 'guest', 'walkin', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para búsqueda rápida
CREATE INDEX idx_reservas_cliente ON reservas(cliente_celular);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_hora);

-- Seed Data (Sucursales)
INSERT INTO sucursales (nombre, direccion, mapa_url) VALUES
('4to Anillo', 'Doble Vía La Guardia, 4to Anillo', 'https://maps.app.goo.gl/8ZKBwRkcTMpETbhj8'),
('6to Anillo', 'Doble Vía La Guardia, 6to Anillo', 'https://maps.app.goo.gl/fabTd3WcxFJtjbMB7');

-- Seed Data (Barberos)
INSERT INTO barberos (nombre, bio_corta, activo) VALUES 
('Andy', 'Master Barber & Fundador. Especialista en cortes clásicos.', TRUE),
('Mateo', 'Experto en Fade y diseños modernos.', TRUE),
('Leo', 'Especialista en barbas y rituales de toalla caliente.', TRUE);

-- Seed Data (Servicios)
INSERT INTO servicios (nombre, precio, duracion_min, descripcion) VALUES
('Corte Clásico', 60.00, 60, 'Corte tradicional con técnica de tijera y acabado pulido.'),
('Corte + Lavado', 80.00, 60, 'Corte de cabello con lavado refrescante incluido.'),
('Arreglo Completo de Barba', 35.00, 60, 'Perfilado, rebajado y tratamiento para la piel.'),
('Solo Perfilado de Barba', 20.00, 60, 'Definición de líneas y contornos de la barba.'),
('Diseño y Limpieza de Cejas', 20.00, 60, 'Diseño acorde a la morfología de tu rostro.'),
('Limpieza Facial Fresh', 90.00, 60, 'Exfoliación profunda, vapor y mascarilla hidratante.'),
('Plan BÁSICO', 90.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Perfilado de Cejas.'),
('Plan Premium', 110.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa.'),
('Plan VIP', 130.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa + Perfilado de Cejas.');