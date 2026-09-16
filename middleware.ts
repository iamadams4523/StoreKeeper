import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    const role = token?.role;
    const branchId = token?.branchId;

    const path = req.nextUrl.pathname;

    // ============================================================
    // ADMIN ROUTES
    // ============================================================
    //
    // Only ADMIN can access /admin.
    //
    if (path.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/pos', req.url));
      }
    }

    // ============================================================
    // MANAGER ROUTES
    // ============================================================
    //
    // ADMIN can access manager pages because the admin should
    // be able to operate a branch even before a manager is hired.
    //
    // MANAGER can also access these pages.
    //
    if (path.startsWith('/manager')) {
      if (role !== 'ADMIN' && role !== 'MANAGER') {
        return NextResponse.redirect(new URL('/pos', req.url));
      }

      // A MANAGER should have a branch assigned.
      //
      // ADMIN is allowed without a branch because the admin
      // can operate across all branches.
      if (role === 'MANAGER' && !branchId) {
        return NextResponse.redirect(new URL('/pos', req.url));
      }
    }

    // ============================================================
    // POS ROUTES
    // ============================================================
    //
    // ADMIN, MANAGER and SALES_ASSISTANT can access the POS.
    //
    if (path.startsWith('/pos')) {
      if (
        role !== 'ADMIN' &&
        role !== 'MANAGER' &&
        role !== 'SALES_ASSISTANT'
      ) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Branch users must belong to a branch.
      //
      // ADMIN does not need a branch because the admin can
      // choose which branch they are operating.
      if ((role === 'MANAGER' || role === 'SALES_ASSISTANT') && !branchId) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Block completely unauthenticated users.
      authorized: ({ token }) => !!token,
    },
  },
);

// ============================================================
// ROUTES PROTECTED BY THIS MIDDLEWARE
// ============================================================

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/pos/:path*'],
};
