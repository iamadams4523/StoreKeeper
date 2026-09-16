import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ============================================================
// Require any authenticated active user
// ============================================================

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (session.user.status !== 'ACTIVE') {
    throw new Error('Your account is not active');
  }

  return session.user;
}

// ============================================================
// Require ADMIN
// ============================================================

export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return user;
}

// ============================================================
// Require ADMIN or MANAGER with branch access
// ============================================================

export async function requireBranchManagerAccess(branchId?: string) {
  const user = await requireAuth();

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------
  // Admin is not permanently assigned to a branch.
  // Therefore, admin must provide/select a branch.
  // ----------------------------------------------------------

  if (user.role === 'ADMIN') {
    if (!branchId) {
      throw new Error('Branch ID is required');
    }

    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch.status !== 'ACTIVE') {
      throw new Error('This branch is inactive');
    }

    return {
      user,
      branchId: branch.id,
    };
  }

  // ----------------------------------------------------------
  // MANAGER
  // ----------------------------------------------------------

  if (user.role === 'MANAGER') {
    if (!user.branchId) {
      throw new Error('You are not assigned to a branch');
    }

    if (branchId && user.branchId !== branchId) {
      throw new Error('Unauthorized branch access');
    }

    return {
      user,
      branchId: user.branchId,
    };
  }

  // ----------------------------------------------------------
  // SALES ASSISTANT
  // ----------------------------------------------------------

  throw new Error('Manager or admin access required');
}

// ============================================================
// Require access to a branch for operational activities
// ADMIN, MANAGER and SALES ASSISTANT are allowed.
// ============================================================

export async function requireBranchAccess(branchId?: string) {
  const user = await requireAuth();

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  if (user.role === 'ADMIN') {
    if (!branchId) {
      throw new Error('Branch ID is required');
    }

    return {
      user,
      branchId,
    };
  }

  // ----------------------------------------------------------
  // MANAGER / SALES ASSISTANT
  // ----------------------------------------------------------

  if (user.role === 'MANAGER' || user.role === 'SALES_ASSISTANT') {
    if (!user.branchId) {
      throw new Error('You are not assigned to a branch');
    }

    if (branchId && user.branchId !== branchId) {
      throw new Error('Unauthorized branch access');
    }

    return {
      user,
      branchId: user.branchId,
    };
  }

  throw new Error('Unauthorized');
}
