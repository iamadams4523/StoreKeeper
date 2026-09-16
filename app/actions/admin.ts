'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authorization';

// ============================================================
// ADMIN DASHBOARD
// ============================================================

export async function getAdminDashboard() {
  try {
    await requireAdmin();

    const [
      totalBranches,
      activeBranches,
      totalStaff,
      activeStaff,
      totalProducts,
      revenueResult,
      inventoryResult,
      branchOverview,
    ] = await Promise.all([
      prisma.branch.count(),

      prisma.branch.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      prisma.user.count({
        where: {
          role: {
            in: ['MANAGER', 'SALES_ASSISTANT'],
          },
        },
      }),

      prisma.user.count({
        where: {
          role: {
            in: ['MANAGER', 'SALES_ASSISTANT'],
          },
          status: 'ACTIVE',
        },
      }),

      prisma.product.count(),

      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.product.aggregate({
        _sum: {
          costPrice: true,
        },
      }),

      prisma.branch.findMany({
        select: {
          id: true,
          name: true,
          status: true,

          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
            },
          },

          orders: {
            select: {
              totalAmount: true,
            },
          },
        },

        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    const inventoryValue = await prisma.product.findMany({
      select: {
        stock: true,
        costPrice: true,
      },
    });

    const totalInventoryValue = inventoryValue.reduce(
      (total, product) => total + product.stock * product.costPrice,
      0,
    );

    const branches = branchOverview.map((branch) => {
      const sales = branch.orders.reduce(
        (total, order) => total + order.totalAmount,
        0,
      );

      return {
        id: branch.id,
        name: branch.name,
        status: branch.status,
        staffCount: branch._count.users,
        productCount: branch._count.products,
        orderCount: branch._count.orders,
        sales,
      };
    });

    return {
      success: true,
      data: {
        totalBranches,
        activeBranches,
        totalStaff,
        activeStaff,
        totalProducts,
        totalRevenue: revenueResult._sum.totalAmount || 0,
        totalInventoryValue,
        branches,
      },
    };
  } catch (error) {
    console.error('getAdminDashboard error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load admin dashboard',
    };
  }
}
