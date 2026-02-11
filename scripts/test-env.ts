/**
 * Test if .env file is being loaded
 */

console.log('🔍 Testing Environment Variables...\n');

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Not loaded');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ Not loaded');
console.log('ZOOM_ACCOUNT_ID:', process.env.ZOOM_ACCOUNT_ID ? '✅ Loaded' : '❌ Not loaded');
console.log('ZOOM_CLIENT_ID:', process.env.ZOOM_CLIENT_ID ? '✅ Loaded' : '❌ Not loaded');
console.log('ZOOM_CLIENT_SECRET:', process.env.ZOOM_CLIENT_SECRET ? '✅ Loaded' : '❌ Not loaded');

if (process.env.ZOOM_ACCOUNT_ID) {
    console.log('\n✅ Zoom credentials are loaded!');
    console.log('ZOOM_ACCOUNT_ID starts with:', process.env.ZOOM_ACCOUNT_ID.substring(0, 5) + '...');
} else {
    console.log('\n❌ Zoom credentials are NOT loaded!');
    console.log('\n📝 Troubleshooting:');
    console.log('1. Check if .env file exists in project root');
    console.log('2. Check if variable names are exactly: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET');
    console.log('3. Check if there are no quotes around values');
    console.log('4. Restart dev server after editing .env');
}
