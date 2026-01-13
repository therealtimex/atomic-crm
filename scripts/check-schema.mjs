import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('🔍 Checking sales table schema...');

    // Fetch all records
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Error listing auth users:', authError);
    } else {
        console.log('✅ Auth users summary:');
        users.forEach(u => {
            console.log(`- Email: ${u.email}, ID: ${u.id}`);
        });
    }

    const { data: allSales } = await supabase.from('sales').select('*');
    console.log('✅ Sales table records:');
    allSales.forEach(s => {
        console.log(`- Sale ID: ${s.id}, Name: ${s.first_name} ${s.last_name}, Email: ${s.email}, user_id: ${s.user_id}`);
    });
}

checkSchema();
