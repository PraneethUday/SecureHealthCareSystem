import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 },
      );
    }

    const searchTerm = query.trim().toLowerCase();

    // Search patients by name, phone, email, or patient_id
    const { data: patients, error } = await supabase
      .from("patients")
      .select(
        "id, patient_id, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, created_at",
      )
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`,
      )
      .order("first_name")
      .limit(20);

    if (error) {
      console.error("Error searching patients:", error);
      return NextResponse.json(
        { error: "Failed to search patients" },
        { status: 500 },
      );
    }

    return NextResponse.json({ patients: patients || [] });
  } catch (error) {
    console.error("Error in patient search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
