const { login } = require("./app/actions/auth-actions");
const { supabaseAdmin } = require("./lib/supabase-admin");

async function run() {
    try {
        console.log("Running login...");
        const result = await login("admin", "admin", "admin");
        console.log("Result:", result);
    } catch (e) {
        console.error("Caught error:");
        console.error(e.stack || e);
    }
}

run();
