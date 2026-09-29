import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Roles that must complete TOTP before reaching any dashboard. The database
// enforces the same rule on clinical tables (aal2 restrictive policies);
// this redirect is only for a sensible UX.
const MFA_REQUIRED_ROLES = ["doctor", "nurse", "staff", "admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Validates the JWT (signature + expiry) and refreshes it if needed.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    if (!claims) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = (claims.app_metadata as { app_role?: string } | undefined)?.app_role;
    if (role && MFA_REQUIRED_ROLES.includes(role) && claims.aal !== "aal2") {
      return NextResponse.redirect(new URL("/mfa", request.url));
    }
    // Each role only gets its own dashboard.
    const section = path.split("/")[2];
    const roleSections = ["patient", "doctor", "nurse", "staff", "admin"];
    if (role && roleSections.includes(section) && section !== role) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/mfa", "/api/:path*"],
};
