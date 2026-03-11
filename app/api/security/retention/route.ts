import { NextResponse } from "next/server";
import {
  getRetentionPolicies,
  updateRetentionPolicy,
  executeRetentionPolicies,
} from "@/lib/security-monitoring";

export async function GET() {
  try {
    const policies = await getRetentionPolicies();
    return NextResponse.json({ policies });
  } catch (err) {
    console.error("Retention policies GET error:", err);
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { policyId, retention_days, archive_before_delete, is_active } = body;

    if (!policyId) {
      return NextResponse.json({ error: "Missing policyId" }, { status: 400 });
    }

    const success = await updateRetentionPolicy(policyId, {
      retention_days,
      archive_before_delete,
      is_active,
    });

    return NextResponse.json({ success });
  } catch (err) {
    console.error("Retention policies PUT error:", err);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const results = await executeRetentionPolicies();
    const totalDeleted = results.reduce((sum, r) => sum + (r.records_deleted || 0), 0);

    return NextResponse.json({
      success: true,
      totalDeleted,
      results,
    });
  } catch (err) {
    console.error("Retention execution error:", err);
    return NextResponse.json({ error: "Retention execution failed" }, { status: 500 });
  }
}
