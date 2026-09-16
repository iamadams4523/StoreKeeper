// actions/staff.ts — FULL FILE

'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

import { requireAuth } from '@/lib/authorization';

// ============================================================
// Types
// ============================================================

type StaffRole = 'MANAGER' | 'SALES_ASSISTANT';

type StaffStatus = 'ACTIVE' | 'SUSPENDED';

interface CreateStaffData {
  firstName: string;
  lastName: string;
  email: string;
  passwordRaw: string;
  role: StaffRole;
  branchId?: string;
}

interface UpdateStaffData {
  firstName: string;
  lastName: string;
  email: string;
  role?: StaffRole;
  branchId?: string | null;
}

// ============================================================
// Common staff select
// ============================================================

const staffSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  status: true,
  branchId: true,
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
};

// ============================================================
// 1. Get Staff
// ============================================================

export async function getAllStaff() {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return {
        success: false,
        error: 'Manager or admin access required.',
      };
    }

    if (user.role === 'ADMIN') {
      const staff = await prisma.user.findMany({
        where: {
          role: {
            in: ['MANAGER', 'SALES_ASSISTANT'],
          },
        },
        select: staffSelect,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: staff,
      };
    }

    if (!user.branchId) {
      return {
        success: false,
        error: 'You are not assigned to a branch.',
      };
    }

    const staff = await prisma.user.findMany({
      where: {
        branchId: user.branchId,
        role: 'SALES_ASSISTANT',
      },
      select: staffSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: staff,
    };
  } catch (error) {
    console.error('getAllStaff error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch staff',
    };
  }
}

// ============================================================
// 2. Create Staff Account
//    ADMIN: creates immediately.
//    MANAGER: submits a PendingAction for admin approval.
// ============================================================

export async function createStaffAccount(data: CreateStaffData) {
  try {
    const user = await requireAuth();

    // ----------------------------------------------------------
    // Validate basic input
    // ----------------------------------------------------------

    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.toLowerCase().trim();
    const password = data.passwordRaw;

    if (!firstName || !lastName || !email) {
      return {
        success: false,
        error: 'First name, last name and email are required.',
      };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    // ----------------------------------------------------------
    // Validate role
    // ----------------------------------------------------------

    if (data.role !== 'MANAGER' && data.role !== 'SALES_ASSISTANT') {
      return {
        success: false,
        error: 'Invalid staff role.',
      };
    }

    // ----------------------------------------------------------
    // Check duplicate email
    // ----------------------------------------------------------

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists.',
      };
    }

    // ----------------------------------------------------------
    // Determine branch
    // ----------------------------------------------------------

    let branchId: string | null = null;

    // ADMIN

    if (user.role === 'ADMIN') {
      if (!data.branchId) {
        return {
          success: false,
          error: 'Please select a branch for this staff member.',
        };
      }

      const branch = await prisma.branch.findUnique({
        where: {
          id: data.branchId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!branch) {
        return {
          success: false,
          error: 'Selected branch does not exist.',
        };
      }

      if (branch.status !== 'ACTIVE') {
        return {
          success: false,
          error: 'Staff cannot be assigned to an inactive branch.',
        };
      }

      branchId = branch.id;

      // ----------------------------------------------------
      // Enforce one manager per branch
      // ----------------------------------------------------

      if (data.role === 'MANAGER') {
        const existingManager = await prisma.user.findFirst({
          where: { branchId, role: 'MANAGER' },
          select: { id: true },
        });

        if (existingManager) {
          return {
            success: false,
            error: 'This branch already has a manager assigned.',
          };
        }
      }
    }

    // MANAGER
    else if (user.role === 'MANAGER') {
      if (!user.branchId) {
        return {
          success: false,
          error: 'You are not assigned to a branch.',
        };
      }

      if (data.role !== 'SALES_ASSISTANT') {
        return {
          success: false,
          error: 'Managers can only create sales assistant accounts.',
        };
      }

      branchId = user.branchId;
    }

    // SALES ASSISTANT
    else {
      return {
        success: false,
        error: 'You are not authorized to create staff accounts.',
      };
    }

    // ----------------------------------------------------------
    // Hash password
    // ----------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // ----------------------------------------------------------
    // MANAGER: queue for approval
    // ----------------------------------------------------------

    if (user.role === 'MANAGER') {
      // ----------------------------------------------------
      // Block duplicate pending requests for the same email
      // ----------------------------------------------------

      const existingPending = await prisma.pendingAction.findFirst({
        where: {
          actionType: 'CREATE_STAFF',
          status: 'PENDING',
          payload: { path: ['email'], equals: email },
        },
      });

      if (existingPending) {
        return {
          success: false,
          error: `A request for "${email}" is already awaiting approval.`,
        };
      }

      const pending = await prisma.pendingAction.create({
        data: {
          actionType: 'CREATE_STAFF',
          requestedById: user.id,
          branchId: branchId as string,
          payload: {
            firstName,
            lastName,
            email,
            hashedPassword,
          },
        },
      });

      return {
        success: true,
        pending: true,
        data: pending,
      };
    }

    // ----------------------------------------------------------
    // ADMIN: create immediately
    // ----------------------------------------------------------

    const newStaff = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: data.role,
        status: 'ACTIVE',
        branchId,
      },
      select: staffSelect,
    });

    return {
      success: true,
      pending: false,
      data: newStaff,
    };
  } catch (error) {
    console.error('createStaffAccount error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create staff account.',
    };
  }
}

// ============================================================
// 3. Update Staff
//    ADMIN: updates immediately.
//    MANAGER: submits a PendingAction for admin approval.
// ============================================================

export async function updateStaff(id: string, data: UpdateStaffData) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return {
        success: false,
        error: 'Manager or admin access required.',
      };
    }

    const existingStaff = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        branchId: true,
      },
    });

    if (!existingStaff) {
      return {
        success: false,
        error: 'Staff member not found.',
      };
    }

    if (existingStaff.role === 'ADMIN') {
      return {
        success: false,
        error: 'Admin accounts cannot be managed here.',
      };
    }

    // MANAGER authorization

    if (user.role === 'MANAGER') {
      if (!user.branchId) {
        return {
          success: false,
          error: 'You are not assigned to a branch.',
        };
      }

      if (existingStaff.branchId !== user.branchId) {
        return {
          success: false,
          error: 'You cannot manage staff from another branch.',
        };
      }

      if (existingStaff.role !== 'SALES_ASSISTANT') {
        return {
          success: false,
          error: 'Managers can only manage sales assistants.',
        };
      }

      if (data.role && data.role !== 'SALES_ASSISTANT') {
        return {
          success: false,
          error: 'Managers cannot change a sales assistant to another role.',
        };
      }

      if (data.branchId !== undefined && data.branchId !== user.branchId) {
        return {
          success: false,
          error: 'Managers cannot move staff to another branch.',
        };
      }
    }

    // Validate email

    const email = data.email.toLowerCase().trim();

    if (!data.firstName.trim() || !data.lastName.trim() || !email) {
      return {
        success: false,
        error: 'First name, last name and email are required.',
      };
    }

    // Check duplicate email

    const emailOwner = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (emailOwner) {
      return {
        success: false,
        error: 'Another user already uses this email.',
      };
    }

    // ----------------------------------------------------------
    // MANAGER: queue for approval
    // ----------------------------------------------------------
    // Branch/role are already locked to the manager's own branch
    // and SALES_ASSISTANT by the checks above.
    // ----------------------------------------------------------

    if (user.role === 'MANAGER') {
      // ----------------------------------------------------
      // Block a second pending request against the same staff
      // member while one is already awaiting review
      // ----------------------------------------------------

      const existingPending = await prisma.pendingAction.findFirst({
        where: { targetId: id, status: 'PENDING' },
      });

      if (existingPending) {
        return {
          success: false,
          error: 'This record already has a request awaiting admin approval.',
        };
      }

      const pending = await prisma.pendingAction.create({
        data: {
          actionType: 'UPDATE_STAFF',
          requestedById: user.id,
          branchId: user.branchId as string,
          targetId: id,
          payload: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email,
          },
        },
      });

      return {
        success: true,
        pending: true,
        data: pending,
      };
    }

    // ----------------------------------------------------------
    // Determine updated role and branch (ADMIN only from here)
    // ----------------------------------------------------------

    let updatedRole = existingStaff.role;
    let updatedBranchId = existingStaff.branchId;

    if (data.role) {
      if (data.role !== 'MANAGER' && data.role !== 'SALES_ASSISTANT') {
        return {
          success: false,
          error: 'Invalid staff role.',
        };
      }

      updatedRole = data.role;
    }

    if (data.branchId !== undefined) {
      if (!data.branchId) {
        return {
          success: false,
          error: 'Staff members must be assigned to a branch.',
        };
      }

      const branch = await prisma.branch.findUnique({
        where: {
          id: data.branchId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!branch) {
        return {
          success: false,
          error: 'Selected branch does not exist.',
        };
      }

      if (branch.status !== 'ACTIVE') {
        return {
          success: false,
          error: 'Staff cannot be assigned to an inactive branch.',
        };
      }

      updatedBranchId = branch.id;
    }

    // ----------------------------------------------------------
    // Enforce one manager per branch
    // ----------------------------------------------------------

    if (updatedRole === 'MANAGER') {
      const existingManager = await prisma.user.findFirst({
        where: {
          branchId: updatedBranchId,
          role: 'MANAGER',
          NOT: { id },
        },
        select: { id: true },
      });

      if (existingManager) {
        return {
          success: false,
          error: 'This branch already has a manager assigned.',
        };
      }
    }

    // Update staff

    const updatedStaff = await prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        role: updatedRole,
        branchId: updatedBranchId,
      },
      select: staffSelect,
    });

    return {
      success: true,
      pending: false,
      data: updatedStaff,
    };
  } catch (error) {
    console.error('updateStaff error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update staff.',
    };
  }
}

// ============================================================
// 4. Toggle Staff Status
//    ADMIN: toggles immediately.
//    MANAGER: submits a PendingAction for admin approval.
// ============================================================

export async function toggleStaffStatus(
  id: string,
  currentStatus: StaffStatus,
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return {
        success: false,
        error: 'Manager or admin access required.',
      };
    }

    const existingStaff = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        branchId: true,
        status: true,
      },
    });

    if (!existingStaff) {
      return {
        success: false,
        error: 'Staff member not found.',
      };
    }

    if (existingStaff.role === 'ADMIN') {
      return {
        success: false,
        error: 'Admin accounts cannot be managed here.',
      };
    }

    if (user.role === 'MANAGER') {
      if (!user.branchId) {
        return {
          success: false,
          error: 'You are not assigned to a branch.',
        };
      }

      if (existingStaff.branchId !== user.branchId) {
        return {
          success: false,
          error: 'You cannot manage staff from another branch.',
        };
      }

      if (existingStaff.role !== 'SALES_ASSISTANT') {
        return {
          success: false,
          error: 'Managers can only manage sales assistants.',
        };
      }
    }

    if (existingStaff.status !== currentStatus) {
      return {
        success: false,
        error:
          'Staff status has changed. Please refresh the page and try again.',
      };
    }

    // ----------------------------------------------------------
    // MANAGER: queue for approval
    // ----------------------------------------------------------

    if (user.role === 'MANAGER') {
      // ----------------------------------------------------
      // Block a second pending request against the same staff
      // member while one is already awaiting review
      // ----------------------------------------------------

      const existingPending = await prisma.pendingAction.findFirst({
        where: { targetId: id, status: 'PENDING' },
      });

      if (existingPending) {
        return {
          success: false,
          error: 'This record already has a request awaiting admin approval.',
        };
      }

      const pending = await prisma.pendingAction.create({
        data: {
          actionType: 'TOGGLE_STAFF_STATUS',
          requestedById: user.id,
          branchId: user.branchId as string,
          targetId: id,
          payload: {
            currentStatus,
          },
        },
      });

      return {
        success: true,
        pending: true,
        data: pending,
      };
    }

    // ----------------------------------------------------------
    // ADMIN: toggle immediately
    // ----------------------------------------------------------

    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    const updatedStaff = await prisma.user.update({
      where: {
        id,
      },
      data: {
        status: newStatus,
      },
      select: staffSelect,
    });

    return {
      success: true,
      pending: false,
      data: updatedStaff,
    };
  } catch (error) {
    console.error('toggleStaffStatus error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update staff status',
    };
  }
}
