/**
 * Rotate the key-encryption key.
 *
 *   1. create a new KEK inside Postgres (Vault) - it never passes through here
 *      on creation
 *   2. re-wrap every row's data key under the new KEK
 *   3. retire the old KEK version(s) once nothing references them
 *
 * Record ciphertext is never re-encrypted: only encrypted_dek and
 * key_version change. Safe to re-run; it resumes where it stopped.
 *
 *   npm run kek:rotate
 */
import { adminClient } from "./lib/admin-client";
import { Keystore } from "../lib/crypto/clinical";
import { fromBytea, rewrapDek, toBytea } from "../lib/crypto/envelope";

const admin = adminClient();
const keystore = new Keystore(admin);
// Every table whose rows carry an envelope (record_chunks holds encrypted
// RAG chunk text under the same KEK).
const TABLES = ["medical_records", "prescriptions", "record_chunks"];

async function main() {
  const resume = process.argv.includes("--resume");
  let newVersion: number;
  if (resume) {
    newVersion = await keystore.currentVersion();
  } else {
    const { data, error } = await admin.rpc("create_kek_version");
    if (error) throw error;
    newVersion = data as number;
  }
  keystore.forget();
  const newKek = await keystore.kek(newVersion);
  console.log(`Re-wrapping data keys under KEK v${newVersion}`);

  for (const table of TABLES) {
    let rewrapped = 0;
    for (;;) {
      const { data, error } = await admin
        .from(table)
        .select("id, encrypted_dek, key_version")
        .not("encrypted_dek", "is", null)
        .neq("key_version", newVersion)
        .limit(500);
      if (error) throw error;
      if (!data?.length) break;

      for (const row of data) {
        const oldKek = await keystore.kek(row.key_version);
        const wrapped = rewrapDek(
          fromBytea(row.encrypted_dek), oldKek, row.key_version,
          newKek, newVersion, table, row.id,
        );
        // Guard on the old version so a concurrent writer is never clobbered.
        const { error: upErr } = await admin
          .from(table)
          .update({ encrypted_dek: toBytea(wrapped), key_version: newVersion })
          .eq("id", row.id)
          .eq("key_version", row.key_version);
        if (upErr) throw upErr;
        rewrapped++;
      }
    }
    console.log(`  ${table}: ${rewrapped} data keys re-wrapped`);
  }

  // Retire versions nothing references any more.
  const { data: versions } = await admin.from("encryption_keys").select("version");
  for (const { version } of versions ?? []) {
    if (version === newVersion) continue;
    const counts = await Promise.all(
      TABLES.map((t) =>
        admin.from(t).select("id", { count: "exact", head: true }).eq("key_version", version),
      ),
    );
    if (counts.every((c) => (c.count ?? 0) === 0)) {
      await admin.rpc("retire_kek_version", { p_version: version });
      console.log(`  retired KEK v${version}`);
    }
  }
  keystore.forget();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
