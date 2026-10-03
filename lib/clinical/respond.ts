import "server-only";
import { NextResponse } from "next/server";
import { ClinicalError } from "./records";

export function clinicalError(err: unknown) {
  if (err instanceof ClinicalError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Clinical API error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
