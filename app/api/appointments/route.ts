import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Appointment ID is required" },
                { status: 400 }
            );
        }

        // Fetch appointment with patient and doctor details
        const { data: appointment, error } = await supabase
            .from("appointments")
            .select(`
        id,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        status,
        hospital_id
      `)
            .eq("id", id)
            .single();

        if (error || !appointment) {
            console.error("Appointment fetch error:", error);
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        // Get patient name - try multiple lookup strategies
        console.log(`Looking up patient with ID: ${appointment.patient_id}`);

        let patient = null;

        // Strategy 1: Match by patient_id column
        const { data: pat1 } = await supabase
            .from("patients")
            .select("first_name, last_name, patient_id")
            .eq("patient_id", appointment.patient_id)
            .single();

        if (pat1) {
            patient = pat1;
        } else {
            // Strategy 2: Match by id column (if patient_id is UUID)
            const { data: pat2 } = await supabase
                .from("patients")
                .select("first_name, last_name, patient_id")
                .eq("id", appointment.patient_id)
                .single();

            if (pat2) {
                patient = pat2;
            }
        }

        console.log(`Patient lookup result:`, patient);

        // Get doctor name - try multiple lookup strategies
        console.log(`Looking up doctor with ID: ${appointment.doctor_id}`);

        let doctor = null;

        // Strategy 1: Match by doctor_id column
        const { data: doc1 } = await supabase
            .from("doctors")
            .select("first_name, last_name, doctor_id")
            .eq("doctor_id", appointment.doctor_id)
            .single();

        if (doc1) {
            doctor = doc1;
        } else {
            // Strategy 2: Match by id column (if doctor_id is UUID)
            const { data: doc2 } = await supabase
                .from("doctors")
                .select("first_name, last_name, doctor_id")
                .eq("id", appointment.doctor_id)
                .single();

            if (doc2) {
                doctor = doc2;
            }
        }

        console.log(`Doctor lookup result:`, doctor);

        return NextResponse.json({
            appointment: {
                ...appointment,
                patient_name: patient
                    ? `${patient.first_name} ${patient.last_name}`
                    : "Unknown Patient",
                doctor_name: doctor
                    ? `${doctor.first_name} ${doctor.last_name}`
                    : "Unknown Doctor",
            },
        });
    } catch (error) {
        console.error("[API] Error fetching appointment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
