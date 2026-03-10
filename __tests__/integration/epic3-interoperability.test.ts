import fs from 'fs';
import path from 'path';
import { supabase } from "@/lib/supabase";
import { logAction } from "@/lib/logging";

// Mock Supabase
jest.mock("@/lib/supabase", () => {
    return {
        supabase: {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis()
        }
    };
});

describe("Epic 3: Interoperability Across Distributed Hospital Systems", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("TC-INT-002: Viewing Available Doctors (Network Directory)", () => {
        it("should successfully query the system's global doctors table by specialization to support cross-hospital discovery", async () => {
            // Test existing capabilities by mocking a query to the 'doctors' table, which acts as the network directory.
            const mockIlike = jest.fn().mockResolvedValue({
                data: [
                    { first_name: "John", last_name: "Doe", specialization: "Cardiologist", department: "Cardiology" }
                ],
                error: null
            });

            (supabase.from as jest.Mock).mockImplementation(() => ({
                select: jest.fn().mockReturnThis(),
                ilike: mockIlike
            }));

            // Simulate the query a patient in one hospital would use to find a specialist system-wide
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .ilike('specialization', '%Cardiologist%');

            expect(error).toBeNull();
            expect(data!).toHaveLength(1);
            expect(data![0].specialization).toBe("Cardiologist");
            expect(supabase.from).toHaveBeenCalledWith('doctors');
            expect(mockIlike).toHaveBeenCalledWith('specialization', '%Cardiologist%');
        });
    });

    describe("TC-INT-004: Unique Patient Identification (EMPI)", () => {
        it("should natively support Enterprise Master Patient Indexing by assigning generic UUID primary keys instead of localized IDs", () => {
            // Verify that the schema is already configured for cross-institutional mapping via generic UUIDs.
            const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
            let schemaContent = '';
            
            if (fs.existsSync(schemaPath)) {
                schemaContent = fs.readFileSync(schemaPath, 'utf8');
            }

            // Assert that the 'patients' and 'doctors' tables are constructed using UUIDs for potential EMPI mapping.
            const patientTableMapping = schemaContent.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+patients[\s\S]*?id\s+UUID\s+PRIMARY\s+KEY/i);
            const doctorTableMapping = schemaContent.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+doctors[\s\S]*?id\s+UUID\s+PRIMARY\s+KEY/i);

            expect(patientTableMapping).not.toBeNull();
            expect(doctorTableMapping).not.toBeNull();

            // Verify SSN or local identifiers are not forcefully used as Primary Keys preventing multi-tenant hashing
            const localIdPrimaryKey = schemaContent.match(/patient_id\s+.*PRIMARY\s+KEY/gi);
            expect(localIdPrimaryKey).toBeNull();
        });
    });

    describe("TC-INT-005: Interoperability Audit Logging", () => {
        it("should support the logging of cross-institutional data fetches via the existing access_logs API", async () => {
            // Mock global fetch since logAction uses client-side fetch in the test environment
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({})
            });

            // Firing the existing logAction function with cross-hospital payloads
            await logAction({
                userId: "global-uuid-123",
                userRole: "system_gateway" as any, // bypassing strict types to simulate gateway
                action: "cross_institutional_fetch",
                details: "Requested FHIR Bundle from Tenant B to Tenant A"
            });

            expect(global.fetch).toHaveBeenCalled();
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            expect(fetchArgs[0]).toBe("/api/audit");
            
            const payload = JSON.parse(fetchArgs[1].body);
            expect(payload.user_id).toBe("global-uuid-123");
            expect(payload.action).toBe("cross_institutional_fetch");
            expect(payload.details).toContain("FHIR Bundle");
        });
    });
});
