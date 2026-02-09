/**
 * Unit Tests for lib/auth.ts
 * Tests session management functions: saveSession, getSession, clearSession
 */

// Mock supabase before importing auth
jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } })
                }))
            }))
        }))
    }
}));

// Mock logging to avoid side effects
jest.mock("@/lib/logging", () => ({
    logAction: jest.fn().mockResolvedValue(undefined)
}));

// Mock sessionStorage for browser environment
const mockSessionStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: jest.fn((key: string) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();

Object.defineProperty(global, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
});

// Import after mocks
import { saveSession, getSession, clearSession } from "@/lib/auth";

describe("Auth Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSessionStorage.clear();
    });

    describe("saveSession()", () => {
        it("should save user and role to sessionStorage", () => {
            const mockUser = { id: "123", email: "test@test.com", first_name: "Test" };
            saveSession(mockUser, "patient");

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(mockUser));
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith("role", "patient");
        });

        it("should save doctor role correctly", () => {
            const mockUser = { id: "456", doctor_id: "D001" };
            saveSession(mockUser, "doctor");

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith("role", "doctor");
        });

        it("should save admin role correctly", () => {
            const mockUser = { id: "789", admin_id: "admin1" };
            saveSession(mockUser, "admin");

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith("role", "admin");
        });

        it("should save nurse role correctly", () => {
            const mockUser = { id: "101", nurse_id: "N001" };
            saveSession(mockUser, "nurse");

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith("role", "nurse");
        });

        it("should save staff role correctly", () => {
            const mockUser = { id: "102", staff_id: "S001" };
            saveSession(mockUser, "staff");

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith("role", "staff");
        });
    });

    describe("getSession()", () => {
        it("should return null when no session exists", () => {
            mockSessionStorage.getItem.mockReturnValueOnce(null).mockReturnValueOnce(null);
            const session = getSession();
            expect(session).toBeNull();
        });

        it("should return user and role when session exists", () => {
            const mockUser = { id: "123", email: "test@test.com" };
            mockSessionStorage.getItem
                .mockReturnValueOnce(JSON.stringify(mockUser))
                .mockReturnValueOnce("patient");

            const session = getSession();
            expect(session).toEqual({ user: mockUser, role: "patient" });
        });

        it("should return null if only user exists without role", () => {
            mockSessionStorage.getItem
                .mockReturnValueOnce(JSON.stringify({ id: "123" }))
                .mockReturnValueOnce(null);

            const session = getSession();
            expect(session).toBeNull();
        });

        it("should return null if only role exists without user", () => {
            mockSessionStorage.getItem
                .mockReturnValueOnce(null)
                .mockReturnValueOnce("patient");

            const session = getSession();
            expect(session).toBeNull();
        });

        it("should correctly parse stored user JSON", () => {
            const mockUser = {
                id: "123",
                email: "test@test.com",
                first_name: "John",
                last_name: "Doe"
            };
            mockSessionStorage.getItem
                .mockReturnValueOnce(JSON.stringify(mockUser))
                .mockReturnValueOnce("patient");

            const session = getSession();
            expect(session?.user.first_name).toBe("John");
            expect(session?.user.last_name).toBe("Doe");
        });
    });

    describe("clearSession()", () => {
        it("should remove user and role from sessionStorage", () => {
            clearSession();

            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("user");
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("role");
        });

        it("should be callable multiple times without error", () => {
            clearSession();
            clearSession();
            clearSession();

            expect(mockSessionStorage.removeItem).toHaveBeenCalledTimes(6); // 2 calls per clearSession
        });
    });
});
