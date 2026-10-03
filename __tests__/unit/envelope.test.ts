/**
 * @jest-environment node
 */
import crypto from "crypto";
import { openFields, rewrapDek, sealFields, DecryptionError } from "@/lib/crypto/envelope";

const kek1 = crypto.randomBytes(32);
const kek2 = crypto.randomBytes(32);
const fields = { diagnosis: "Stable angina", notes: "Family history of CAD" };

describe("envelope encryption", () => {
  it("round-trips fields", () => {
    const env = sealFields(fields, kek1, 1, "medical_records", "row-1");
    expect(openFields(env, kek1, "medical_records", "row-1")).toEqual(fields);
  });

  it("does not contain plaintext in any stored component", () => {
    const env = sealFields(fields, kek1, 1, "medical_records", "row-1");
    for (const part of [env.phi_ciphertext, env.encrypted_dek]) {
      expect(part.toString("utf8")).not.toContain("angina");
    }
  });

  it("uses a fresh DEK and IV for every seal", () => {
    const a = sealFields(fields, kek1, 1, "medical_records", "row-1");
    const b = sealFields(fields, kek1, 1, "medical_records", "row-1");
    expect(a.phi_iv.equals(b.phi_iv)).toBe(false);
    expect(a.encrypted_dek.equals(b.encrypted_dek)).toBe(false);
    expect(a.phi_iv).toHaveLength(12);
  });

  it("rejects ciphertext moved to another row (AAD binding)", () => {
    const env = sealFields(fields, kek1, 1, "medical_records", "row-1");
    expect(() => openFields(env, kek1, "medical_records", "row-2")).toThrow(DecryptionError);
    expect(() => openFields(env, kek1, "prescriptions", "row-1")).toThrow(DecryptionError);
  });

  it("detects tampering via the auth tag", () => {
    const env = sealFields(fields, kek1, 1, "medical_records", "row-1");
    env.phi_ciphertext[0] ^= 0xff;
    expect(() => openFields(env, kek1, "medical_records", "row-1")).toThrow(DecryptionError);
  });

  it("rotation re-wraps the DEK without touching record ciphertext", () => {
    const env = sealFields(fields, kek1, 1, "medical_records", "row-1");
    const before = Buffer.from(env.phi_ciphertext);
    const rotated = {
      ...env,
      encrypted_dek: rewrapDek(env.encrypted_dek, kek1, 1, kek2, 2, "medical_records", "row-1"),
      key_version: 2,
    };
    expect(rotated.phi_ciphertext.equals(before)).toBe(true);
    expect(openFields(rotated, kek2, "medical_records", "row-1")).toEqual(fields);
    expect(() => openFields(rotated, kek1, "medical_records", "row-1")).toThrow(DecryptionError);
  });
});
