// Runs once when the Next.js server boots. Security-critical configuration
// is checked here so a misconfigured deployment refuses to start instead of
// quietly running without encryption.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const problems: string[] = [];
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.CHAT_ENCRYPTION_KEY ?? "")) {
    problems.push("CHAT_ENCRYPTION_KEY must be 64 hex characters (openssl rand -hex 32)");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  if (problems.length) {
    const message = `Refusing to start:\n  - ${problems.join("\n  - ")}`;
    // `next build` also loads this file; only a running server must fail.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(message);
      return;
    }
    throw new Error(message);
  }
}
