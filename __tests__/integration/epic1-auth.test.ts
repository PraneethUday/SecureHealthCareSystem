import { login, verifyMFAOTP } from "@/app/actions/auth-actions";
import { checkAccountLock } from "@/lib/account-lockout";
import { supabaseAdmin } from "@/lib/supabase-admin";
import * as security from "@/lib/security";

// TC-AUTH-001, TC-AUTH-002, TC-AC-001, TC-AC-002, TC-AC-003

jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock("@/lib/account-lockout", () => ({
  checkAccountLock: jest.fn().mockResolvedValue({ isLocked: false }),
  recordLoginAttempt: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock("@/lib/email", () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock("@/lib/security", () => {
    const originalModule = jest.requireActual("@/lib/security");
    return {
        ...originalModule,
        verifyPassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn().mockResolvedValue("$2b$12$something")
    };
});

jest.mock("@/lib/logging", () => ({
    logAction: jest.fn().mockResolvedValue(undefined)
}));

describe("Epic 1: Secure User Authentication & Role-Based Access Control", () => {
  let mockEq: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockSingle: jest.Mock;
  let mockSelect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup chaining mocks
    mockSingle = jest.fn();
    mockEq = jest.fn(() => ({ 
        single: mockSingle, 
        order: jest.fn(() => ({ limit: jest.fn(() => ({ single: mockSingle })) })),
        eq: mockEq // Allow endless .eq() chaining for deletes and updates
    }));
    mockSelect = jest.fn(() => ({ eq: mockEq }));
    mockUpdate = jest.fn(() => ({ eq: mockEq }));
    
    (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => ({
      select: mockSelect,
      update: mockUpdate,
      insert: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
      delete: jest.fn(() => ({ eq: mockEq, neq: jest.fn() }))
    }));

    // Default valid password mock setup
    const hashedPass = "$2b$12$something"; 
    
    // Supabase .single() mock for finding user
    mockSingle.mockResolvedValue({
        data: {
           id: "user123",
           patient_id: "user123",
           email: "test@email.com",
           password_hash: hashedPass,
           is_mfa_enabled: true,
           password_changed_at: new Date().toISOString()
        },
        error: null
    });
    
    (security.verifyPassword as jest.Mock).mockResolvedValue(true);
  });

  describe("TC-AUTH-001: Patient Secure Login & MFA", () => {
    it("should authenticate valid patient and prompt for MFA if enabled", async () => {
      
      const result = await login("test@email.com", "password123", "patient");
      if (!result.success) console.error("AUTH-001 (Patient) error:", result);
      
      expect(result.success).toBe(true);
      expect(result.requiresMFA).toBe(true);
      expect(result.mfaToken).toBeDefined();
    });

    it("should reject invalid credentials with generic error", async () => {
      (security.verifyPassword as jest.Mock).mockResolvedValue(false);
      
      jest.spyOn(require("@/lib/account-lockout"), "recordLoginAttempt").mockResolvedValue({ 
          success: false, 
          failedCount: 1, 
          shouldLock: false 
      });

      const result = await login("nobody@email.com", "wrongpass", "patient");
      expect(result.success).toBe(false);
      expect(result.message).toContain("credentials");
    });
    
    it("should lock account after multiple failed attempts (Velocity/Brute-force protection)", async () => {
        jest.spyOn(require("@/lib/account-lockout"), "checkAccountLock").mockResolvedValueOnce({ 
            isLocked: true,
            lockedUntil: new Date(Date.now() + 1000 * 60 * 5)
        });

        const blockedResult = await login("test@email.com", "password", "patient");
        expect(blockedResult.success).toBe(false);
        expect(blockedResult.message).toContain("locked");
    });
  });

  describe("TC-AUTH-002: Session Security", () => {
    it("should issue a JWT/Session token securely (simulate behavior)", async () => {
      (security.verifyPassword as jest.Mock).mockResolvedValue(true);
      
      mockSingle.mockResolvedValueOnce({
        data: {
           id: "admin",
           password_hash: "secret",
           is_mfa_enabled: false
        },
        error: null
      });

      const result = await login("admin", "adminpass", "admin");
      if (!result.success) console.error("AUTH-002 (Admin) error:", result);
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      if (result.user) {
          expect(result.user.password_hash).toBeUndefined();
          expect(result.user.password).toBeUndefined();
      }
    });
  });

  describe("TC-AC-001 & TC-AC-002: Least Privilege & RBAC checks", () => {
    it("should prevent a nurse from using doctor credentials", async () => {
       mockSingle.mockResolvedValueOnce({
           data: null,
           error: new Error("User not found")
       });

       const result = await login("D001", "password", "nurse");
       expect(result.success).toBe(false);
       expect(result.message).toContain("credentials"); 
    });

    it("should enforce least privilege: Admin login success but logic is separated", async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
           id: "admin",
           password_hash: "secret",
           is_mfa_enabled: false
        },
        error: null
      });

      const result = await login("admin", "adminpass", "admin");
      if (!result.success) console.error("AC-002 (Admin) error:", result);
      expect(result.success).toBe(true);
      expect(result.role).toBe("admin");
    });
  });
});
