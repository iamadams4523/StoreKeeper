import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // If a Sales Assistant tries to access an admin route, kick them back to the POS
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/pos', req.url));
    }
  },
  {
    callbacks: {
      // This ensures the middleware blocks all completely unauthenticated users
      authorized: ({ token }) => !!token,
    },
  },
);

// Apply this strict protection to both the Admin and POS sections
export const config = { matcher: ['/admin/:path*', '/pos/:path*'] };
