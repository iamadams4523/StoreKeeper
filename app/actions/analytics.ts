'use server';

import prisma from '@/lib/prisma';

// 1. Admin KPI Dashboard Metrics
export async function getStoreKPIs() {
  try {
    // Get total revenue from all orders
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
    });

    // Count total products in catalog
    const totalProducts = await prisma.product.count();

    // Get today's total revenue specifically
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
      },
      _sum: { totalAmount: true },
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
    return { success: false, error: 'Failed to fetch KPIs' };
  }
}

// 2. Order History (For the Admin to see all past receipts)
export async function getRecentOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Fetch the latest 50 orders
      include: {
        staff: {
          select: { firstName: true, lastName: true }, // See who made the sale
        },
        items: {
          include: {
            product: { select: { name: true } }, // See what was sold
          },
        },
      },
    });
    return { success: true, data: orders };
  } catch (error) {
    return { success: false, error: 'Failed to fetch orders' };
  }
}

// 3. Sales Assistant Daily Target (For the POS Screen Header)
export async function getDailySalesTotal(staffId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotal = await prisma.order.aggregate({
      where: {
        staffId: staffId,
        createdAt: { gte: today },
      },
      _sum: { totalAmount: true },
    });

    return { success: true, data: dailyTotal._sum.totalAmount || 0 };
  } catch (error) {
    return { success: false, error: 'Failed to fetch daily total' };
  }
}
