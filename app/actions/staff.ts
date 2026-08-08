'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function getAllStaff() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: 'SALES_ASSISTANT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
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
      error: 'Failed to fetch staff',
    };
  }
}

export async function createStaffAccount(data: {
  firstName: string;
  lastName: string;
  email: string;
  passwordRaw: string;
}) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists.',
      };
    }

    if (!data.passwordRaw || data.passwordRaw.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    const hashedPassword = await bcrypt.hash(data.passwordRaw, 10);

    const newStaff = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: 'SALES_ASSISTANT',
        status: 'ACTIVE',
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: newStaff,
    };
  } catch (error) {
    console.error('createStaffAccount error:', error);

    return {
      success: false,
      error: 'Failed to create staff account.',
    };
  }
}

export async function updateStaff(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
  },
) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: {
          id,
        },
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Another user already uses this email.',
      };
    }

    const updatedStaff = await prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: updatedStaff,
    };
  } catch (error) {
    console.error('updateStaff error:', error);

    return {
      success: false,
      error: 'Failed to update staff.',
    };
  }
}

export async function toggleStaffStatus(
  id: string,
  currentStatus: 'ACTIVE' | 'SUSPENDED',
) {
  try {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    const updatedStaff = await prisma.user.update({
      where: {
        id,
      },
      data: {
        status: newStatus,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: updatedStaff,
    };
  } catch (error) {
    console.error('toggleStaffStatus error:', error);

    return {
      success: false,
      error: 'Failed to update staff status',
    };
  }
}
