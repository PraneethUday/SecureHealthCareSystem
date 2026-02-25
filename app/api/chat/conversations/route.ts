import { NextRequest, NextResponse } from "next/server";
import {
    getOrCreateConversation,
    getConversationByAppointment,
} from "@/lib/chat";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/chat/conversations
 * Get conversation by appointment ID
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const appointmentId = searchParams.get("appointmentId");

        if (!appointmentId) {
            return NextResponse.json(
                { error: "Appointment ID is required" },
                { status: 400 }
            );
        }

        const result = await getConversationByAppointment(appointmentId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ conversation: result.conversation });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversation" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/chat/conversations
 * Create a new conversation for an appointment
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appointmentId } = body;

        if (!appointmentId) {
            return NextResponse.json(
                { error: "Appointment ID is required" },
                { status: 400 }
            );
        }

        // Get appointment details
        const { data: appointment, error: appointmentError } = await supabase
            .from("appointments")
            .select("id, patient_id, doctor_id, status")
            .eq("id", appointmentId)
            .single();

        if (appointmentError || !appointment) {
            console.error("Appointment fetch error:", appointmentError);
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        // Allow chat for any status for now (development mode)
        console.log(`Creating conversation for appointment ${appointmentId} with status: ${appointment.status}`);

        const result = await getOrCreateConversation(
            appointmentId,
            appointment.patient_id,
            appointment.doctor_id
        );

        if (!result.success) {
            console.error("Conversation creation error:", result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ conversation: result.conversation });
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}
