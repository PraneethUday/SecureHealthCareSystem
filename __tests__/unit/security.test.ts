import { validatePasswordComplexity, isPasswordExpired } from "../../lib/security";

describe("Password Security Unit Tests", () => {
    describe("validatePasswordComplexity", () => {
        it("should reject passwords shorter than 12 characters", () => {
            const result = validatePasswordComplexity("Short1@");
            expect(result.valid).toBe(false);
            expect(result.message).toContain("12 characters");
        });

        it("should reject passwords without uppercase letters", () => {
            const result = validatePasswordComplexity("lowercase1@longenough");
            expect(result.valid).toBe(false);
            expect(result.message).toContain("uppercase");
        });

        it("should reject passwords without lowercase letters", () => {
            const result = validatePasswordComplexity("UPPERCASE1@LONGENOUGH");
            expect(result.valid).toBe(false);
            expect(result.message).toContain("lowercase");
        });

        it("should reject passwords without numbers", () => {
            const result = validatePasswordComplexity("NoNumberSpec@lPassword");
            expect(result.valid).toBe(false);
            expect(result.message).toContain("number");
        });

        it("should reject passwords without special characters", () => {
            const result = validatePasswordComplexity("NoSpecialChar123456");
            expect(result.valid).toBe(false);
            expect(result.message).toContain("special character");
        });

        it("should accept valid complex passwords", () => {
            const result = validatePasswordComplexity("StrongP@ssw0rd2026!");
            expect(result.valid).toBe(true);
        });
    });

    describe("isPasswordExpired", () => {
        it("should return true if password was never changed", () => {
            expect(isPasswordExpired(null)).toBe(true);
        });

        it("should return true if password is older than 90 days", () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 91);
            expect(isPasswordExpired(oldDate.toISOString())).toBe(true);
        });

        it("should return false if password is less than 90 days old", () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 30);
            expect(isPasswordExpired(recentDate.toISOString())).toBe(false);
        });
    });
});
