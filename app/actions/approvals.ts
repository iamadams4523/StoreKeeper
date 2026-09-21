// actions/approvals.ts — NEW FILE, ADMIN only

'use server';

import prisma from '@/lib/prisma';
// actions/approvals.ts — top of file

import { requireAdmin, requireAuth } from '@/lib/authorization';

// ============================================================
// Payload shapes — must match what each *-actions.ts file
// writes into PendingAction.payload
// ============================================================

interface CreateProductPayload {
  sku: string;
  name: string;
  category: string;
  stock: number;
  lowStockAlert: number;
  costPrice: number;
  sellingPrice: number;
}

type UpdateProductPayload = CreateProductPayload;

interface CreateStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  // Already hashed at request time — never store raw passwords
  // while a request sits pending.
  hashedPassword: string;
}

interface UpdateStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
}

interface ToggleStaffStatusPayload {
  // Status at the moment the manager submitted the request,
  // used to detect drift before we apply the flip.
  currentStatus: 'ACTIVE' | 'SUSPENDED';
}

// ============================================================
// GET PENDING ACTIONS (admin review queue)
// ============================================================

export async function getPendingActions(branchId?: string) {
  try {
    await requireAdmin();

    const actions = await prisma.pendingAction.findMany({
      where: {
        status: 'PENDING',
        ...(branchId ? { branchId } : {}),
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, data: actions };
  } catch (error) {
    console.error('getPendingActions error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch pending actions',
    };
  }
}

// ============================================================
// GET ACTION HISTORY (approved + rejected — audit trail)
// ============================================================

export async function getActionHistory(branchId?: string) {
  try {
    await requireAdmin();

    const actions = await prisma.pendingAction.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 100,
    });

    return { success: true, data: actions };
  } catch (error) {
    console.error('getActionHistory error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch action history',
    };
  }
}

// ============================================================
// GET MY REQUESTS (manager-scoped — no admin requirement)
// ============================================================
//
// A manager can only ever see their own submissions, never
// anyone else's — requestedById is always pinned to the caller,
// never taken from a parameter.
// ============================================================

export async function getMyRequests() {
  try {
    const user = await requireAuth();

    const actions = await prisma.pendingAction.findMany({
      where: {
        requestedById: user.id,
      },

      include: {
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 50,
    });

    return {
      success: true,
      data: actions,
    };
  } catch (error) {
    console.error('getMyRequests error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch your requests',
    };
  }
}

// ============================================================
// REJECT ACTION
// ============================================================

export async function rejectPendingAction(id: string, reason: string) {
  try {
    const admin = await requireAdmin();
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      return { success: false, error: 'A rejection reason is required.' };
    }

    const action = await prisma.pendingAction.findUnique({ where: { id } });
    if (!action) return { success: false, error: 'Request not found.' };
    if (action.status !== 'PENDING') {
      return {
        success: false,
        error: 'This request has already been reviewed.',
      };
    }

    const updated = await prisma.pendingAction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectionReason: trimmedReason,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('rejectPendingAction error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reject request',
    };
  }
}

// ============================================================
// APPROVE ACTION
// ============================================================
//
// Re-validates against current DB state before applying — the
// world may have moved since the manager submitted the request
// (branch deactivated, SKU taken by someone else, staff status
// changed, etc). If re-validation fails, the request is left
// PENDING (not auto-rejected) so the admin sees why, instead of
// it silently vanishing.
// ============================================================

export async function approvePendingAction(id: string) {
  try {
    const admin = await requireAdmin();

    const action = await prisma.pendingAction.findUnique({ where: { id } });
    if (!action) return { success: false, error: 'Request not found.' };
    if (action.status !== 'PENDING') {
      return {
        success: false,
        error: 'This request has already been reviewed.',
      };
    }

    const branch = await prisma.branch.findUnique({
      where: { id: action.branchId },
      select: { id: true, status: true },
    });

    if (!branch || branch.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'This branch is no longer active. Reject this request instead.',
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      switch (action.actionType) {
        case 'CREATE_PRODUCT': {
          const payload = action.payload as unknown as CreateProductPayload;

          const duplicate = await tx.product.findUnique({
            where: {
              branchId_sku: { branchId: action.branchId, sku: payload.sku },
            },
          });
          if (duplicate) {
            throw new Error(
              `SKU "${payload.sku}" is now in use in this branch — ask the manager to resubmit.`,
            );
          }

          return tx.product.create({
            data: { branchId: action.branchId, ...payload },
          });
        }

        case 'UPDATE_PRODUCT': {
          if (!action.targetId) throw new Error('Missing target product.');
          const payload = action.payload as unknown as UpdateProductPayload;

          const existing = await tx.product.findUnique({
            where: { id: action.targetId },
          });
          if (!existing || existing.branchId !== action.branchId) {
            throw new Error('This product no longer exists in this branch.');
          }

          const duplicate = await tx.product.findFirst({
            where: {
              branchId: action.branchId,
              sku: payload.sku,
              NOT: { id: action.targetId },
            },
          });
          if (duplicate) {
            throw new Error(
              `SKU "${payload.sku}" is now in use by another product — ask the manager to resubmit.`,
            );
          }

          return tx.product.update({
            where: { id: action.targetId },
            data: payload,
          });
        }

        case 'DELETE_PRODUCT': {
          if (!action.targetId) throw new Error('Missing target product.');

          const existing = await tx.product.findUnique({
            where: { id: action.targetId },
          });
          if (!existing || existing.branchId !== action.branchId) {
            return null; // already gone — treat as no-op success
          }

          return tx.product.delete({ where: { id: action.targetId } });
        }

        case 'CREATE_STAFF': {
          const payload = action.payload as unknown as CreateStaffPayload;

          const duplicate = await tx.user.findUnique({
            where: { email: payload.email },
          });
          if (duplicate) {
            throw new Error(
              `A user with email "${payload.email}" now exists — ask the manager to resubmit.`,
            );
          }

          return tx.user.create({
            data: {
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              password: payload.hashedPassword,
              role: 'SALES_ASSISTANT',
              status: 'ACTIVE',
              branchId: action.branchId,
            },
          });
        }

        case 'UPDATE_STAFF': {
          if (!action.targetId) throw new Error('Missing target staff.');
          const payload = action.payload as unknown as UpdateStaffPayload;

          const existing = await tx.user.findUnique({
            where: { id: action.targetId },
          });
          if (
            !existing ||
            existing.branchId !== action.branchId ||
            existing.role !== 'SALES_ASSISTANT'
          ) {
            throw new Error(
              'This staff member is no longer eligible for this change.',
            );
          }

          const duplicate = await tx.user.findFirst({
            where: { email: payload.email, NOT: { id: action.targetId } },
          });
          if (duplicate) {
            throw new Error(
              `Email "${payload.email}" is now in use — ask the manager to resubmit.`,
            );
          }

          return tx.user.update({
            where: { id: action.targetId },
            data: {
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
            },
          });
        }

        case 'TOGGLE_STAFF_STATUS': {
          if (!action.targetId) throw new Error('Missing target staff.');
          const payload = action.payload as unknown as ToggleStaffStatusPayload;

          const existing = await tx.user.findUnique({
            where: { id: action.targetId },
          });
          if (
            !existing ||
            existing.branchId !== action.branchId ||
            existing.role !== 'SALES_ASSISTANT'
          ) {
            throw new Error(
              'This staff member is no longer eligible for this change.',
            );
          }

          if (existing.status !== payload.currentStatus) {
            throw new Error(
              'This staff member\u2019s status has changed since the request was submitted.',
            );
          }

          const newStatus =
            payload.currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return tx.user.update({
            where: { id: action.targetId },
            data: { status: newStatus },
          });
        }

        default:
          throw new Error('Unknown action type.');
      }
    });

    await prisma.pendingAction.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('approvePendingAction error:', error);
    // Left PENDING on purpose — see comment above.
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to approve request',
    };
  }
}
