import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  // Redirect the Render domain to the custom domain
  if (host === "dwaraka-academy-frontend.onrender.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = "dwarakaacademy.in";

    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};