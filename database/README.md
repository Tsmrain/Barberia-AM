# Base de Datos (SQL)

En esta carpeta encontrarás los archivos SQL necesarios para reconstruir tu base de datos en Supabase desde cero.

### Orden de Ejecución (Obligatorio):

1. **`01_tablas_y_datos_mock.sql`**
   - Crea todas las tablas (sucursales, barberos, servicios, clientes, reservas).
   - Inserta los datos base de prueba ('mock data').
   - **IMPORTANTE:** Borra todo lo anterior (DROP TABLE) para empezar limpio.

2. **`02_optimizacion_indices.sql`**
   - Crea los índices de rendimiento para búsquedas instantáneas.
   - Habilita la extensión  para búsqueda difusa.
