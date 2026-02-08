-- ================================================================
-- SCRIPT DE CARGA DE DATOS REALES (Barbería Andy)
-- ================================================================
-- 
-- ⚠️ EJECUTAR DESPUÉS DE production_db.sql
-- Este script carga los datos reales de la barbería
-- ================================================================

-- 1. AJUSTE DE ESQUEMA: Agregar columna mapa_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sucursales' AND column_name = 'mapa_url'
    ) THEN
        ALTER TABLE public.sucursales ADD COLUMN mapa_url TEXT;
    END IF;
END $$;

-- 2. LIMPIEZA PREVIA (Borra datos de prueba anteriores)
TRUNCATE TABLE public.reservas CASCADE;
DELETE FROM public.barberos;
DELETE FROM public.servicios;
DELETE FROM public.sucursales;

-- 3. INSERTAR SUCURSALES REALES
INSERT INTO public.sucursales (nombre, direccion, mapa_url, telefono, horario_apertura, horario_cierre)
VALUES 
    ('4to Anillo', 'Doble Vía La Guardia, 4to Anillo', 'https://maps.app.goo.gl/8ZKBwRkcTMpETbhj8', '+591 70000001', '09:00', '20:00'),
    ('6to Anillo', 'Doble Vía La Guardia, 6to Anillo', 'https://maps.app.goo.gl/fabTd3WcxFJtjbMB7', '+591 70000002', '09:00', '20:00');

-- 4. INSERTAR BARBEROS REALES
DO $$
DECLARE
    v_sucursal_id UUID;
BEGIN
    -- Obtener ID de la sucursal 4to Anillo
    SELECT id INTO v_sucursal_id FROM public.sucursales WHERE nombre = '4to Anillo' LIMIT 1;

    INSERT INTO public.barberos (sucursal_id, nombre, descripcion, especialidad, activo, orden)
    VALUES 
        (v_sucursal_id, 'Andy', 'Master Barber & Fundador. Especialista en cortes clásicos.', 'Cortes Clásicos', TRUE, 1),
        (v_sucursal_id, 'Mateo', 'Experto en Fade y diseños modernos.', 'Fade & Diseños', TRUE, 2),
        (v_sucursal_id, 'Leo', 'Especialista en barbas y rituales de toalla caliente.', 'Barbas & Spa', TRUE, 3);
END $$;

-- 5. INSERTAR SERVICIOS REALES
INSERT INTO public.servicios (nombre, precio, duracion_min, descripcion, categoria, orden) VALUES
    ('Corte Clásico', 60.00, 60, 'Corte tradicional con técnica de tijera y acabado pulido.', 'cortes', 1),
    ('Corte + Lavado', 80.00, 60, 'Corte de cabello con lavado refrescante incluido.', 'combos', 2),
    ('Arreglo Completo de Barba', 35.00, 60, 'Perfilado, rebajado y tratamiento para la piel.', 'barba', 3),
    ('Solo Perfilado de Barba', 20.00, 60, 'Definición de líneas y contornos de la barba.', 'barba', 4),
    ('Diseño y Limpieza de Cejas', 20.00, 60, 'Diseño acorde a la morfología de tu rostro.', 'facial', 5),
    ('Limpieza Facial Fresh', 90.00, 60, 'Exfoliación profunda, vapor y mascarilla hidratante.', 'facial', 6),
    ('Plan BÁSICO', 90.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Perfilado de Cejas.', 'paquetes', 7),
    ('Plan Premium', 110.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa.', 'paquetes', 8),
    ('Plan VIP', 130.00, 60, 'Asesoramiento + Corte + Lavado (antes y después) + Arreglo de barba completa + Perfilado de Cejas.', 'paquetes', 9);

-- Confirmación
SELECT 'Datos reales cargados correctamente' as status;
