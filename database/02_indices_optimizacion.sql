-- PERFORMANCE OPTIMIZATION INDEXES
-- Run this in your Supabase SQL Editor to improve query speed and reduce resource usage.

-- 1. Availability Checks (CRITICAL)
-- Used heavily when users click a date to see taken slots.
-- Without this, the database scans all reservations for the barber every time.
CREATE INDEX IF NOT EXISTS idx_reservas_barbero_fecha 
ON public.reservas (barbero_id, fecha_hora);

-- 2. Client History & Lookups
-- Used when looking up a client's past bookings.
CREATE INDEX IF NOT EXISTS idx_reservas_cliente 
ON public.reservas (cliente_celular);

-- 3. Fuzzy Search Optimization (CRITICAL for Scalability)
-- The app uses ILIKE '%name%' which causes full table scans (slow & expensive).
-- We enable pg_trgm and add a GIN index to make text search instant.

-- Enable the extension (required for trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the index on Client Name
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm 
ON public.clientes 
USING GIN (nombre_completo gin_trgm_ops);

-- Create the index on Client Phone for fuzzy search if needed (though usually strict match)
-- But the code uses .ilike('celular', '%suffix') for the last 7 digits.
-- G-Tree/GIN is also needed here for suffix matching efficiency.
CREATE INDEX IF NOT EXISTS idx_clientes_celular_trgm
ON public.clientes
USING GIN (celular gin_trgm_ops);

-- 4. Foreign Key Junctions
-- Optimizes "getBarbers" filtering by branch
CREATE INDEX IF NOT EXISTS idx_barberos_sucursal 
ON public.barberos (sucursal_id);
