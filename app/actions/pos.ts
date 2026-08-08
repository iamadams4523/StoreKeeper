'use server';

import prisma from '@/lib/prisma';

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

interface SaleItem {
  productId: string;
  quantity: number;
}

interface ProcessSaleData {
  staffId: string;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
}

export async function getPosCatalog() {
  try {
    const catalog = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        stock: true,
        sellingPrice: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: catalog,
    };
  } catch (error) {
    console.error('getPosCatalog error:', error);

    return {
      success: false,
      error: 'Failed to load POS catalog',
    };
  }
}

export async function processSale(data: ProcessSaleData) {
  try {
    if (!data.staffId) {
      return {
        success: false,
        error: 'Staff account is required',
      };
    }

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: 'Cart is empty',
      };
    }

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER'];

    if (!validPaymentMethods.includes(data.paymentMethod)) {
      return {
        success: false,
        error: 'Invalid payment method',
      };
    }

    // Validate staff
    const staff = await prisma.user.findUnique({
      where: {
        id: data.staffId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!staff) {
      return {
        success: false,
        error: 'Staff account not found',
      };
    }

    if (staff.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'This staff account is suspended',
      };
    }

    // Only sales assistants and admins can process sales
    if (staff.role !== 'SALES_ASSISTANT' && staff.role !== 'ADMIN') {
      return {
        success: false,
        error: 'You are not authorized to process sales',
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      const orderItems = [];

      // ============================================
      // VALIDATE PRODUCTS AND STOCK
      // ============================================

      for (const item of data.items) {
        if (!item.productId) {
          throw new Error('Invalid product');
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error('Product quantity must be greater than zero');
        }

        const product = await tx.product.findUnique({
          where: {
            id: item.productId,
          },
        });

        if (!product) {
          throw new Error(`Product "${item.productId}" was not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock}`,
          );
        }

        // IMPORTANT:
        // Use sellingPrice from DATABASE.
        // Never trust a price sent from the browser.
        const itemTotal = product.sellingPrice * item.quantity;

        totalAmount += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.sellingPrice,
        });
      }

      // ============================================
      // CREATE ORDER
      // ============================================

      const order = await tx.order.create({
        data: {
          totalAmount,
          paymentMethod: data.paymentMethod,
          staffId: data.staffId,

          items: {
            create: orderItems,
          },
        },

        include: {
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

          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // ============================================
      // REDUCE STOCK
      // ============================================

      for (const item of data.items) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,

            // This protects against stock becoming
            // negative if another sale happens
            // simultaneously.
            stock: {
              gte: item.quantity,
            },
          },

          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.count === 0) {
          throw new Error(
            'Stock changed while processing the sale. Please try again.',
          );
        }
      }

      return order;
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('processSale error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process sale',
    };
  }
}
