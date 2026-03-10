import { getAllLogs, getPatientAccessLogs, logAction } from "@/lib/logging";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn()
    }
}));

describe("Epic 5: Audit, Monitoring & Breach Handling", () => {
    let mockEq: jest.Mock;
    let mockOrder: jest.Mock;
    let mockLimit: jest.Mock;
    let mockInsert: jest.Mock;
    let mockSelect: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockEq = jest.fn();
        mockOrder = jest.fn();
        mockLimit = jest.fn();
        mockInsert = jest.fn();
        mockSelect = jest.fn(() => ({
            order: mockOrder,
            eq: mockEq
        }));
        
        (supabase.from as jest.Mock).mockImplementation(() => ({
            select: mockSelect,
            insert: mockInsert
        }));
        
        mockEq.mockReturnValue({
            order: mockOrder
        });
        
        mockOrder.mockReturnValue({
            limit: mockLimit
        });
        
        mockLimit.mockResolvedValue({
            data: [
                { id: "log1", user_id: "P001", action: "login", timestamp: "2026-03-10T10:00:00Z" }
            ],
            error: null
        });
        
        mockInsert.mockResolvedValue({ error: null });
        
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ logs: [{ id: "log1", action: "login" }] })
        });
    });

    describe("TC-AUD-002: Audit Log Viewing and Reporting", () => {
        it("should allow a compliance officer/admin to view all logs chronologically", async () => {
            const logs = await getAllLogs(50);
            expect(logs).toBeDefined();
            expect(logs.length).toBe(1);
            expect(logs[0].action).toBe("login");
            expect(global.fetch).toHaveBeenCalledWith("/api/audit/logs?limit=50");
        });

        it("should fetch patient specific access logs reliably", async () => {
            const logs = await getPatientAccessLogs("P001");
            expect(logs).toBeDefined();
            expect(global.fetch).toHaveBeenCalledWith("/api/audit/logs?patientId=P001&limit=100");
        });
    });
    
    describe("TC-AUD-001: Audit Log Generation", () => {
        it("should generate logAction entries with provided metadata", async () => {
            await logAction({
                userId: "testId",
                userRole: "patient",
                action: "view_record",
                ipAddress: "127.0.0.1"
            });
            
            expect(global.fetch).toHaveBeenCalled();
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            expect(fetchArgs[0]).toBe("/api/audit");
            expect(fetchArgs[1].method).toBe("POST");
            
            const payload = JSON.parse(fetchArgs[1].body);
            expect(payload.user_id).toBe("testId");
            expect(payload.user_role).toBe("patient");
            expect(payload.action).toBe("view_record");
            expect(payload.ip_address).toBe("127.0.0.1");
        });
    });
});
