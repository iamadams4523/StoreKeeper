'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authorization';

type BranchStatus = 'ACTIVE' | 'INACTIVE';

interface CreateBranchData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface UpdateBranchData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

const branchSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      users: true,
      products: true,
      orders: true,
    },
  },
};

// ============================================================
// GET ALL BRANCHES
// ============================================================

export async function getAllBranches() {
  try {
    await requireAdmin();

    const branches = await prisma.branch.findMany({
      select: branchSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: branches,
    };
  } catch (error) {
    console.error('getAllBranches error:', error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch branches',
    };
  }
}

// ============================================================
// GET ONE BRANCH
// ============================================================

export async function getBranch(id: string) {
  try {
    await requireAdmin();

    const branch = await prisma.branch.findUnique({
      where: {
        id,
      },
      select: branchSelect,
    });

    if (!branch) {
      return {
        success: false,
        error: 'Branch not found.',
      };
    }

    return {
      success: true,
      data: branch,
    };
  } catch (error) {
    console.error('getBranch error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch branch',
    };
  }
}

// ============================================================
// CREATE BRANCH
// ============================================================

export async function createBranch(data: CreateBranchData) {
  try {
    await requireAdmin();

    const name = data.name.trim();
    const address = data.address?.trim() || null;
    const phone = data.phone?.trim() || null;
    const email = data.email?.trim().toLowerCase() || null;

    if (!name) {
      return {
        success: false,
        error: 'Branch name is required.',
      };
    }

    const existingBranch = await prisma.branch.findUnique({
      where: {
        name,
      },
    });

    if (existingBranch) {
      return {
        success: false,
        error: 'A branch with this name already exists.',
      };
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        email,
        status: 'ACTIVE',
      },
      select: branchSelect,
    });

    return {
      success: true,
      data: branch,
    };
  } catch (error) {
    console.error('createBranch error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create branch',
    };
  }
}

// ============================================================
// UPDATE BRANCH
// ============================================================

export async function updateBranch(id: string, data: UpdateBranchData) {
  try {
    await requireAdmin();

    const name = data.name.trim();
    const address = data.address?.trim() || null;
    const phone = data.phone?.trim() || null;
    const email = data.email?.trim().toLowerCase() || null;

    if (!name) {
      return {
        success: false,
        error: 'Branch name is required.',
      };
    }

    const existingBranch = await prisma.branch.findUnique({
      where: {
        id,
      },
    });

    if (!existingBranch) {
      return {
        success: false,
        error: 'Branch not found.',
      };
    }

    const duplicateName = await prisma.branch.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateName) {
      return {
        success: false,
        error: 'Another branch already uses this name.',
      };
    }

    const branch = await prisma.branch.update({
      where: {
        id,
      },
      data: {
        name,
        address,
        phone,
        email,
      },
      select: branchSelect,
    });

    return {
      success: true,
      data: branch,
    };
  } catch (error) {
    console.error('updateBranch error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update branch',
    };
  }
}

// ============================================================
// TOGGLE BRANCH STATUS
// ============================================================

export async function toggleBranchStatus(
  id: string,
  currentStatus: BranchStatus,
) {
  try {
    await requireAdmin();

    const branch = await prisma.branch.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!branch) {
      return {
        success: false,
        error: 'Branch not found.',
      };
    }

    if (branch.status !== currentStatus) {
      return {
        success: false,
        error: 'Branch status has changed. Please refresh the page.',
      };
    }

    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updatedBranch = await prisma.branch.update({
      where: {
        id,
      },
      data: {
        status: newStatus,
      },
      select: branchSelect,
    });

    return {
      success: true,
      data: updatedBranch,
    };
  } catch (error) {
    console.error('toggleBranchStatus error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update branch status',
    };
  }
}
