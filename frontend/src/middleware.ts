import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (host === "dwaraka-academy-frontend.onrender.com") {
    return NextResponse.redirect(
      "https://dwarakaacademy.in" + request.nextUrl.pathname + request.nextUrl.search,
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};