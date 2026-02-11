import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function listAllUsers() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log('--- Registered Users ---');
    users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email} (ID: ${u.id})`);
    });
    console.log('------------------------');
}

listAllUsers();
