import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testSupabaseAdmin() {
    console.log('Testing Supabase Admin API...');
    console.log('URL:', supabaseUrl);
    console.log('Key exists:', !!supabaseKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Listing users...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError);
            return;
        }

        console.log(`Successfully listed ${users.length} users.`);

        if (users.length > 0) {
            const testEmail = users[0].email;
            console.log(`Generating reset link for: ${testEmail}`);

            const { data, error: linkError } = await supabase.auth.admin.generateLink({
                type: 'recovery',
                email: testEmail!,
                options: {
                    redirectTo: 'http://localhost:3000/reset-password',
                },
            });

            if (linkError) {
                console.error('Error generating link:', linkError);
            } else {
                console.log('Link generated successfully!');
                console.log('Action Link:', data.properties?.action_link);
            }
        } else {
            console.log('No users found in Supabase Auth.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testSupabaseAdmin();
