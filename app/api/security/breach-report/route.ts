import { guard } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateBreachReport } from "@/lib/security-monitoring";

export async function POST(request: Request) {
  const auth = await guard("admin");
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json();
    const { incidentId, startDate, endDate } = body;
    const generatedBy = auth.businessId;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: startDate, endDate" },
        { status: 400 },
      );
    }

    const report = await generateBreachReport({
      incidentId,
      startDate,
      endDate,
      generatedBy,
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Breach report generation error:", err);
    return NextResponse.json({ error: "Failed to generate breach report" }, { status: 500 });
  }
}
