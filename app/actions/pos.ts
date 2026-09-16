'use server';

import prisma from '@/lib/prisma';
import { requireBranchAccess } from '@/lib/authorization';

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

interface SaleItem {
  productId: string;
  quantity: number;
}

interface ProcessSaleData {
  // Kept for compatibility with your current POS UI.
  // The server will NOT trust this value.
  staffId?: string;

  // Admin needs to specify which branch they are operating.
  // Manager/Sales Assistant do not need to provide this.
  branchId?: string;

  paymentMethod: PaymentMethod;
  items: SaleItem[];
}

// ============================================================
// GET POS CATALOG
// ============================================================

export async function getPosCatalog(branchId?: string) {
  try {
    const access = await requireBranchAccess(branchId);

    const catalog = await prisma.product.findMany({
      where: {
        branchId: access.branchId,
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
        costPrice: true,
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
      error:
        error instanceof Error ? error.message : 'Failed to load POS catalog',
    };
  }
}

// ============================================================
// PROCESS SALE
// ============================================================

export async function processSale(data: ProcessSaleData) {
  try {
    // ----------------------------------------------------------
    // AUTHENTICATION + BRANCH AUTHORIZATION
    // ----------------------------------------------------------

    const access = await requireBranchAccess(data.branchId);

    const user = access.user;
    const branchId = access.branchId;

    // ----------------------------------------------------------
    // VALIDATE CART
    // ----------------------------------------------------------

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: 'Cart is empty',
      };
    }

    // ----------------------------------------------------------
    // VALIDATE PAYMENT METHOD
    // ----------------------------------------------------------

    const validPaymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER'];

    if (!validPaymentMethods.includes(data.paymentMethod)) {
      return {
        success: false,
        error: 'Invalid payment method',
      };
    }

    // ----------------------------------------------------------
    // VALIDATE USER
    // ----------------------------------------------------------
    //
    // The authenticated user is the person making the sale.
    //
    // We deliberately DO NOT trust data.staffId from the browser.
    //
    // This prevents someone from making a sale appear as though
    // another staff member made it.
    // ----------------------------------------------------------

    if (
      user.role !== 'ADMIN' &&
      user.role !== 'MANAGER' &&
      user.role !== 'SALES_ASSISTANT'
    ) {
      return {
        success: false,
        error: 'You are not authorized to process sales',
      };
    }

    // ----------------------------------------------------------
    // AGGREGATE DUPLICATE PRODUCTS
    // ----------------------------------------------------------
    //
    // If the same product somehow appears twice in the cart,
    // combine the quantities first.
    //
    // Example:
    //
    // Product A x 2
    // Product A x 3
    //
    // becomes:
    //
    // Product A x 5
    // ----------------------------------------------------------

    const itemMap = new Map<string, number>();

    for (const item of data.items) {
      if (!item.productId) {
        return {
          success: false,
          error: 'Invalid product',
        };
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return {
          success: false,
          error: 'Product quantity must be greater than zero',
        };
      }

      const currentQuantity = itemMap.get(item.productId) ?? 0;

      itemMap.set(item.productId, currentQuantity + item.quantity);
    }

    // Convert map back to array.
    const validatedItems = Array.from(itemMap.entries()).map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      }),
    );

    // ==========================================================
    // DATABASE TRANSACTION
    // ==========================================================

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      const orderItems: {
        productId: string;
        quantity: number;
        price: number;
        costPrice: number;
      }[] = [];

      // --------------------------------------------------------
      // VALIDATE PRODUCTS AND STOCK
      // --------------------------------------------------------

      for (const item of validatedItems) {
        const product = await tx.product.findUnique({
          where: {
            id: item.productId,
          },
        });

        if (!product) {
          throw new Error(`Product "${item.productId}" was not found`);
        }

        // ------------------------------------------------------
        // IMPORTANT:
        // Make sure this product belongs to the branch being
        // operated.
        // ------------------------------------------------------

        if (product.branchId !== branchId) {
          throw new Error(`You cannot sell a product from another branch.`);
        }

        // ------------------------------------------------------
        // CHECK STOCK
        // ------------------------------------------------------

        if (product.stock < item.quantity) {
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock}`,
          );
        }

        // ------------------------------------------------------
        // USE DATABASE PRICES
        // ------------------------------------------------------
        //
        // Never trust prices coming from the browser.
        //
        // sellingPrice = price customer pays
        // costPrice = what the business paid
        // ------------------------------------------------------

        const itemTotal = product.sellingPrice * item.quantity;

        totalAmount += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.sellingPrice,
          costPrice: product.costPrice,
        });
      }

      // --------------------------------------------------------
      // CREATE ORDER
      // --------------------------------------------------------

      const order = await tx.order.create({
        data: {
          totalAmount,
          paymentMethod: data.paymentMethod,

          // Authenticated user, NOT data.staffId.
          staffId: user.id,

          // Branch authorized above.
          branchId,

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

          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // --------------------------------------------------------
      // REDUCE STOCK
      // --------------------------------------------------------

      for (const item of validatedItems) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,

            // Extra protection against negative stock.
            branchId,

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

    // ==========================================================
    // SUCCESS
    // ==========================================================

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
