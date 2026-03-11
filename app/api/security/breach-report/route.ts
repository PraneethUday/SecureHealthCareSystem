import { NextResponse } from "next/server";
import { generateBreachReport } from "@/lib/security-monitoring";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { incidentId, startDate, endDate, generatedBy } = body;

    if (!startDate || !endDate || !generatedBy) {
      return NextResponse.json(
        { error: "Missing required fields: startDate, endDate, generatedBy" },
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
