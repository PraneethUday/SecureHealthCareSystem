import crypto from "crypto";

// AES-256-GCM envelope encryption.
//
//   record fields --(DEK, iv, AAD)--> phi_ciphertext + phi_auth_tag
//   DEK           --(KEK, iv', AAD')--> encrypted_dek = iv' | tag' | wrapped
//
// The AAD binds each ciphertext to the row it belongs to, so a ciphertext
// copied onto another row (or another table) fails authentication.

const ALG = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

export interface Envelope {
  phi_ciphertext: Buffer;
  phi_iv: Buffer;
  phi_auth_tag: Buffer;
  encrypted_dek: Buffer;
  key_version: number;
}

export class DecryptionError extends Error {}

function assertKey(key: Buffer, what: string) {
  if (key.length !== KEY_BYTES) throw new Error(`${what} must be ${KEY_BYTES} bytes`);
}

function aad(table: string, rowId: string): Buffer {
  return Buffer.from(`${table}:${rowId}`, "utf8");
}

export function wrapDek(dek: Buffer, kek: Buffer, table: string, rowId: string, version: number): Buffer {
  assertKey(kek, "KEK");
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALG, kek, iv);
  cipher.setAAD(aad(`dek:${table}:v${version}`, rowId));
  const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), wrapped]);
}

export function unwrapDek(blob: Buffer, kek: Buffer, table: string, rowId: string, version: number): Buffer {
  assertKey(kek, "KEK");
  try {
    const decipher = crypto.createDecipheriv(ALG, kek, blob.subarray(0, IV_BYTES));
    decipher.setAAD(aad(`dek:${table}:v${version}`, rowId));
    decipher.setAuthTag(blob.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    return Buffer.concat([decipher.update(blob.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
  } catch {
    throw new DecryptionError(`could not unwrap data key for ${table}:${rowId}`);
  }
}

export function sealFields(
  fields: Record<string, unknown>,
  kek: Buffer,
  keyVersion: number,
  table: string,
  rowId: string,
): Envelope {
  const dek = crypto.randomBytes(KEY_BYTES);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALG, dek, iv);
  cipher.setAAD(aad(table, rowId));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(fields), "utf8"),
    cipher.final(),
  ]);
  const envelope: Envelope = {
    phi_ciphertext: ciphertext,
    phi_iv: iv,
    phi_auth_tag: cipher.getAuthTag(),
    encrypted_dek: wrapDek(dek, kek, table, rowId, keyVersion),
    key_version: keyVersion,
  };
  dek.fill(0);
  return envelope;
}

export function openFields<T = Record<string, unknown>>(
  env: Envelope,
  kek: Buffer,
  table: string,
  rowId: string,
): T {
  const dek = unwrapDek(env.encrypted_dek, kek, table, rowId, env.key_version);
  try {
    const decipher = crypto.createDecipheriv(ALG, dek, env.phi_iv);
    decipher.setAAD(aad(table, rowId));
    decipher.setAuthTag(env.phi_auth_tag);
    const plain = Buffer.concat([decipher.update(env.phi_ciphertext), decipher.final()]);
    return JSON.parse(plain.toString("utf8")) as T;
  } catch {
    throw new DecryptionError(`could not decrypt ${table}:${rowId}`);
  } finally {
    dek.fill(0);
  }
}

/** Re-wrap a DEK under a new KEK. The record ciphertext does not change. */
export function rewrapDek(
  encryptedDek: Buffer,
  oldKek: Buffer,
  oldVersion: number,
  newKek: Buffer,
  newVersion: number,
  table: string,
  rowId: string,
): Buffer {
  const dek = unwrapDek(encryptedDek, oldKek, table, rowId, oldVersion);
  try {
    return wrapDek(dek, newKek, table, rowId, newVersion);
  } finally {
    dek.fill(0);
  }
}

// PostgREST represents bytea as "\x<hex>" strings in both directions.
export const toBytea = (b: Buffer) => `\\x${b.toString("hex")}`;
export const fromBytea = (s: string) => Buffer.from(s.replace(/^\\x/, ""), "hex");
