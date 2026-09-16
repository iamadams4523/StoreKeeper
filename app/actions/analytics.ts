'use server';

import prisma from '@/lib/prisma';
import { requireBranchAccess, requireAuth } from '@/lib/authorization';

// ============================================================
// 1. Branch KPI Dashboard Metrics
// ============================================================

export async function getStoreKPIs(branchId?: string) {
  try {
    const access = await requireBranchAccess(branchId);

    const totalRevenue = await prisma.order.aggregate({
      where: {
        branchId: access.branchId,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalProducts = await prisma.product.count({
      where: {
        branchId: access.branchId,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysRevenue = await prisma.order.aggregate({
      where: {
        branchId: access.branchId,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return {
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        todaysRevenue: todaysRevenue._sum.totalAmount || 0,
        totalProducts,
      },
    };
  } catch (error) {
    console.error('getStoreKPIs error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KPIs',
    };
  }
}

// ============================================================
// 2. Recent Orders for the Current Branch
// ============================================================

export async function getRecentOrders(branchId?: string) {
  try {
    const access = await requireBranchAccess(branchId);

    const orders = await prisma.order.findMany({
      where: {
        branchId: access.branchId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 50,

      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error('getRecentOrders error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    };
  }
}

// ============================================================
// 3. Sales Assistant Daily Total
// ============================================================

export async function getDailySalesTotal() {
  try {
    const user = await requireAuth();

    if (
      user.role !== 'SALES_ASSISTANT' &&
      user.role !== 'MANAGER' &&
      user.role !== 'ADMIN'
    ) {
      return {
        success: false,
        error: 'You are not authorized to view sales totals',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotal = await prisma.order.aggregate({
      where: {
        staffId: user.id,
        createdAt: {
          gte: today,
        },
      },

      _sum: {
        totalAmount: true,
      },
    });

    return {
      success: true,
      data: dailyTotal._sum.totalAmount || 0,
    };
  } catch (error) {
    console.error('getDailySalesTotal error:', error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch daily total',
    };
  }
}
