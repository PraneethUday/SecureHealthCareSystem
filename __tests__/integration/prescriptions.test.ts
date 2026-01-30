import { createPrescription, getPatientPrescriptions } from "@/lib/prescriptions";
import { supabase } from "@/lib/supabase";

describe("Prescriptions Integration Test", () => {
    jest.setTimeout(15000);

    let patientId: string = "";
    let doctorId: string = "";
    let appointmentId: string = "";
    let createdPrescriptionId: string = "";

    beforeAll(async () => {
        // Find necessary data
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

    it("should create a prescription", async () => {
        if (!appointmentId) {
            console.warn("Skipping prescription creation test: No existing appointment found.");
            return;
        }

        const result = await createPrescription({
            appointment_id: appointmentId,
            patient_id: patientId,
            doctor_id: doctorId,
            medication_name: "Test Aspirin",
            dosage: "100mg",
            frequency: "Once daily",
            duration: "7 days",
            start_date: new Date().toISOString(),
            prescribed_date: new Date().toISOString(),
            status: "active"
        }, doctorId);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        if (result.data) {
            createdPrescriptionId = result.data.id;
        }
    });

    it("should fetch patient prescriptions", async () => {
        if (!patientId) return;

        const results = await getPatientPrescriptions(patientId);
        expect(Array.isArray(results)).toBe(true);

        if (createdPrescriptionId) {
            const found = results.find(p => p.id === createdPrescriptionId);
            expect(found).toBeDefined();
            expect(found?.medication_name).toBe("Test Aspirin");
        }
    });

    afterAll(async () => {
        if (createdPrescriptionId) {
            await supabase.from("prescriptions").delete().eq("id", createdPrescriptionId);
        }
    });
});
