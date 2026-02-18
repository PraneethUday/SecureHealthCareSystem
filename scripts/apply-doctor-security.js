const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySecurityFixes() {
    console.log("🛠️ Applying Security Parity Fixes for Doctors (JS)...\n");

    // 1. Enable MFA for all doctors
    console.log("➡️ Enabling MFA for all doctors...");
    const { error: mfaError } = await supabase
        .from("doctors")
        .update({
            is_mfa_enabled: true,
            mfa_method: 'email'
        })
        .or('is_mfa_enabled.is.null,is_mfa_enabled.eq.false');

    if (mfaError) console.error("❌ Error enabling MFA:", mfaError.message);
    else console.log("✅ MFA enabled for all doctors.");

    // 2. Force password update for legacy accounts
    console.log("➡️ Identifying legacy accounts for forced password update...");

    const { error: pwdError } = await supabase
        .from("doctors")
        .update({ password_changed_at: null })
        .or('password_hash.is.null,password_changed_at.is.null');

    if (pwdError) console.error("❌ Error forcing password updates:", pwdError.message);
    else console.log("✅ Legacy accounts flagged for forced password update.");

    // 3. Reset login attempts
    console.log("➡️ Resetting login attempts...");
    const { error: resetError } = await supabase
        .from("doctors")
        .update({
            login_attempts: 0,
            is_locked: false,
            locked_until: null
        })
        .eq('is_locked', true);

    if (resetError) console.error("❌ Error resetting attempts:", resetError.message);
    else console.log("✅ Login attempts reset.");

    console.log("\n🚀 Security parity restored for Doctors!");
}

applySecurityFixes()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
