import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Add DB_PASSWORD to environment variables for secure database access
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-db-password", process.env.DB_PASSWORD || "")

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/api/:path*"],
}

