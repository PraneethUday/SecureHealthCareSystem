import { NextRequest, NextResponse } from "next/server";
import { sendAppointmentConfirmationEmail, sendDoctorAppointmentNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "patient-confirmation") {
      const result = await sendAppointmentConfirmationEmail(data);
      return NextResponse.json({ success: result });
    } else if (type === "doctor-notification") {
      const result = await sendDoctorAppointmentNotification(data);
      return NextResponse.json({ success: result });
    } else {
      return NextResponse.json({ success: false, error: "Invalid notification type" }, { status: 400 });
    }
  } catch (error) {
    console.error("[API] Notification error:", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}
