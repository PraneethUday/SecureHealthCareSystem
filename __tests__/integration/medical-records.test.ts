import { createMedicalRecord, getPatientMedicalRecords } from "@/lib/medicalRecords";
import { supabase } from "@/lib/supabase";

describe("Medical Records Integration Test", () => {
    jest.setTimeout(15000);

    let patientId: string = "";
    let doctorId: string = "";
    let appointmentId: string = "";
    let createdRecordId: string = "";

    beforeAll(async () => {
        const { data: appts } = await supabase
            .from("appointments")
            .select("id, patient_id, doctor_id")
            .limit(1);

        if (appts && appts.length > 0) {
            appointmentId = appts[0].id;
            patientId = appts[0].patient_id;
            doctorId = appts[0].doctor_id!;
        }
    });

    it("should create a medical record", async () => {
        if (!appointmentId) {
            console.warn("Skipping medical record test: No appointment found.");
            return;
        }

        const result = await createMedicalRecord({
            appointment_id: appointmentId,
            patient_id: patientId,
            doctor_id: doctorId,
            record_date: new Date().toISOString(),
            chief_complaint: "Headache",
            diagnosis: "Test Diagnosis",
            treatment_plan: "Test Plan",
            notes: "Integration test notes"
        }, doctorId);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        if (result.data) {
            createdRecordId = result.data.id;
        }
    });

    it("should fetch patient medical records", async () => {
        if (!patientId) return;

        const records = await getPatientMedicalRecords(patientId);
        expect(Array.isArray(records)).toBe(true);

        if (createdRecordId) {
            const found = records.find(r => r.id === createdRecordId);
            expect(found).toBeDefined();
            expect(found?.diagnosis).toBe("Test Diagnosis");
        }
    });

    afterAll(async () => {
        if (createdRecordId) {
            await supabase.from("medical_records").delete().eq("id", createdRecordId);
        }
    });
});
