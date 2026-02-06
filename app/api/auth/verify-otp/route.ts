import { NextRequest, NextResponse } from "next/server";
import { verifyMFAOTP } from "@/app/actions/auth-actions";
import { UserRole } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mfaToken, otp, role } = body;

    if (!mfaToken || !otp || !role) {
      return NextResponse.json(
        { error: "Missing required fields: mfaToken, otp, role" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyMFAOTP(mfaToken, otp, role as UserRole);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          user: result.user,
          role: result.role,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
