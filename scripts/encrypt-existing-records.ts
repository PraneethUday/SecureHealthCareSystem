/**
 * One-off backfill: encrypt medical_records / prescriptions rows written
 * before field-level encryption existed. Safe to re-run (skips rows that
 * already have ciphertext). Afterwards, validate the constraints:
 *
 *   alter table public.medical_records validate constraint medical_records_phi_encrypted;
 *   alter table public.prescriptions  validate constraint prescriptions_phi_encrypted;
 *
 *   npm run encrypt:backfill
 */
import { adminClient } from "./lib/admin-client";
import { encryptRow, Keystore, ENCRYPTED_FIELDS, type EncryptedTable } from "../lib/crypto/clinical";

const admin = adminClient();
const keystore = new Keystore(admin);

async function backfill(table: EncryptedTable) {
  const { data, error } = await admin
    .from(table)
    .select(["id", ...ENCRYPTED_FIELDS[table]].join(","))
    .is("phi_ciphertext", null);
  if (error) throw error;

  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const id = row.id as string;
    const enc = await encryptRow(keystore, table, id, row);
    delete enc.id;
    const { error: upErr } = await admin.from(table).update(enc).eq("id", id);
    if (upErr) throw upErr;
  }
  console.log(`${table}: encrypted ${data?.length ?? 0} legacy rows`);
}

(async () => {
  await backfill("medical_records");
  await backfill("prescriptions");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
