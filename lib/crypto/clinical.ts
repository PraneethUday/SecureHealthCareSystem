import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DecryptionError,
  fromBytea,
  openFields,
  sealFields,
  toBytea,
  type Envelope,
} from "./envelope";

// Columns encrypted at rest, per table. Everything else in the row stays
// queryable (dates, status, foreign keys, vitals numbers).
export const ENCRYPTED_FIELDS = {
  medical_records: [
    "chief_complaint",
    "diagnosis",
    "symptoms",
    "examination_findings",
    "treatment_plan",
    "recommendations",
    "notes",
  ],
  prescriptions: ["medication_name", "dosage", "instructions", "notes"],
} as const;

export type EncryptedTable = keyof typeof ENCRYPTED_FIELDS;

export const ENVELOPE_COLUMNS = [
  "phi_ciphertext",
  "phi_iv",
  "phi_auth_tag",
  "encrypted_dek",
  "key_version",
] as const;

/**
 * Loads KEKs from Supabase Vault through service-role-only functions.
 * KEKs are cached in server memory for a few minutes and never leave the
 * server process.
 */
export class Keystore {
  private keks = new Map<number, { key: Buffer; at: number }>();
  private current: { version: number; at: number } | null = null;
  private static TTL_MS = 5 * 60 * 1000;

  constructor(private admin: SupabaseClient) {}

  async currentVersion(): Promise<number> {
    if (this.current && Date.now() - this.current.at < Keystore.TTL_MS) {
      return this.current.version;
    }
    const { data, error } = await this.admin.rpc("current_kek_version");
    if (error || !data) throw new Error("No active key-encryption key");
    this.current = { version: data as number, at: Date.now() };
    return data as number;
  }

  async kek(version: number): Promise<Buffer> {
    const hit = this.keks.get(version);
    if (hit && Date.now() - hit.at < Keystore.TTL_MS) return hit.key;
    const { data, error } = await this.admin.rpc("kek_material", { p_version: version });
    if (error || !data) throw new Error(`Key-encryption key v${version} unavailable`);
    const key = Buffer.from(data as string, "base64");
    this.keks.set(version, { key, at: Date.now() });
    return key;
  }

  forget() {
    this.keks.forEach(({ key }) => key.fill(0));
    this.keks.clear();
    this.current = null;
  }
}

/**
 * Encrypt the protected fields of a row about to be written. Protected
 * columns are set to null in the returned row (the DB constraint requires
 * that); the envelope columns carry the ciphertext.
 */
export async function encryptRow<T extends Record<string, unknown>>(
  keystore: Keystore,
  table: EncryptedTable,
  rowId: string,
  row: T,
): Promise<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};
  const out: Record<string, unknown> = { ...row, id: rowId };
  for (const f of ENCRYPTED_FIELDS[table]) {
    fields[f] = row[f] ?? null;
    out[f] = null;
  }
  const version = await keystore.currentVersion();
  const env = sealFields(fields, await keystore.kek(version), version, table, rowId);
  out.phi_ciphertext = toBytea(env.phi_ciphertext);
  out.phi_iv = toBytea(env.phi_iv);
  out.phi_auth_tag = toBytea(env.phi_auth_tag);
  out.encrypted_dek = toBytea(env.encrypted_dek);
  out.key_version = env.key_version;
  return out;
}

/**
 * Decrypt a row read from the database. Rows written before encryption was
 * introduced are returned unchanged. A row that fails authentication is
 * returned with its protected fields null and `decryption_failed: true`,
 * never with ciphertext in their place.
 */
export async function decryptRow<T extends Record<string, any>>(
  keystore: Keystore,
  table: EncryptedTable,
  row: T,
): Promise<T & { decryption_failed?: boolean }> {
  const clean: Record<string, any> = { ...row };
  for (const c of ENVELOPE_COLUMNS) delete clean[c];
  if (!row.phi_ciphertext) return clean as T;

  const env: Envelope = {
    phi_ciphertext: fromBytea(row.phi_ciphertext),
    phi_iv: fromBytea(row.phi_iv),
    phi_auth_tag: fromBytea(row.phi_auth_tag),
    encrypted_dek: fromBytea(row.encrypted_dek),
    key_version: row.key_version,
  };
  try {
    const fields = openFields(env, await keystore.kek(env.key_version), table, row.id);
    return { ...clean, ...fields } as T;
  } catch (e) {
    if (!(e instanceof DecryptionError)) throw e;
    console.error(e.message);
    for (const f of ENCRYPTED_FIELDS[table]) clean[f] = null;
    return { ...clean, decryption_failed: true } as unknown as T;
  }
}
