const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("🚀 Starting Performance Tests...");

    // 1. Fetch Barbers (to get an ID)
    let start = performance.now();
    const { data: barbers, error: bError } = await supabase.from('barberos').select('id, nombre').limit(1);
    let end = performance.now();
    console.log(`[Barbers] Fetch 1 barber: ${(end - start).toFixed(2)}ms`);

    if (bError || !barbers.length) {
        console.error("❌ Failed to get barbers or empty table");
        return;
    }
    const barberId = barbers[0].id;
    console.log(`   Running tests for barber: ${barbers[0].nombre} (${barberId})`);

    // 2. Check Availability (Critical Query)
    // Query: WHERE barbero_id = X AND fecha_hora BETWEEN Y AND Z
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    start = performance.now();
    const { data: slots, error: sError } = await supabase
        .from('reservas')
        .select('fecha_hora')
        .eq('barbero_id', barberId)
        .gte('fecha_hora', `${today}T00:00:00`)
        .lt('fecha_hora', `${tomorrow}T00:00:00`);
    end = performance.now();

    if (sError) console.error("❌ Availability Error:", sError);
    else console.log(`✅ [Availability] Check slots for today: ${(end - start).toFixed(2)}ms (Rows: ${slots.length})`);

    // 3. Search Client by Name (Fuzzy Search)
    // Query: ILIKE '%Juan%'
    // This uses pg_trgm index if available
    const searchName = 'Juan';
    start = performance.now();
    const { data: clients, error: cError } = await supabase
        .from('clientes')
        .select('celular, nombre_completo')
        .ilike('nombre_completo', `%${searchName}%`)
        .limit(5);
    end = performance.now();

    if (cError) console.error("❌ Search Error:", cError);
    else console.log(`✅ [Search] Find '${searchName}': ${(end - start).toFixed(2)}ms (Rows: ${clients.length})`);

    // 4. Client Lookup by Phone (Exact Match)
    const testPhone = '70012345';
    start = performance.now();
    const { data: phoneClient, error: pError } = await supabase
        .from('clientes')
        .select('celular')
        .eq('celular', testPhone)
        .maybeSingle(); // optimized for single row
    end = performance.now();

    if (pError) console.error("❌ Phone Lookop Error:", pError);
    else console.log(`✅ [Phone] Lookup '${testPhone}': ${(end - start).toFixed(2)}ms`);

    console.log("\n--- Conclusion ---");
    console.log("If these times are < 200ms, your database is effectively optimized for the user.");
    console.log("Note: Creating the indexes (migrations/001_performance_indexes.sql) is REQUIRED for this to scale.");
}

runTests();
