'use server';

import prisma from '@/lib/prisma';
import { requireAuth, requireBranchManagerAccess } from '@/lib/authorization';

// ============================================================
// Get all products for the current branch
// ADMIN / MANAGER only
// ============================================================

export async function getAllProducts(branchId?: string) {
  try {
    const access = await requireBranchManagerAccess(branchId);

    const products = await prisma.product.findMany({
      where: { branchId: access.branchId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error('getAllProducts error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch products',
    };
  }
}

// ============================================================
// Create product
// ADMIN: creates immediately.
// MANAGER: submits a PendingAction for admin approval.
// ============================================================

export async function createProduct(formData: FormData) {
  try {
    const sku = String(formData.get('sku') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const category = String(formData.get('category') || '').trim();

    const stock = Number(formData.get('stock'));
    const lowStockAlert = Number(formData.get('lowStockAlert'));
    const costPrice = Number(formData.get('costPrice'));
    const sellingPrice = Number(formData.get('sellingPrice'));

    const requestedBranchId = String(formData.get('branchId') || '').trim();

    if (
      !sku ||
      !name ||
      !category ||
      Number.isNaN(stock) ||
      Number.isNaN(lowStockAlert) ||
      Number.isNaN(costPrice) ||
      Number.isNaN(sellingPrice)
    ) {
      return {
        success: false,
        error: 'Please provide all required product information.',
      };
    }

    const access = await requireBranchManagerAccess(
      requestedBranchId || undefined,
    );

    const payload = {
      sku,
      name,
      category,
      stock,
      lowStockAlert,
      costPrice,
      sellingPrice,
    };

    // MANAGER: queue for approval instead of writing directly
    if (access.user.role === 'MANAGER') {
      // --------------------------------------------------  <-- NEW
      const existingPending = await prisma.pendingAction.findFirst({
        where: {
          actionType: 'CREATE_PRODUCT',
          branchId: access.branchId,
          status: 'PENDING',
          payload: { path: ['sku'], equals: sku },
        },
      });

      if (existingPending) {
        return {
          success: false,
          error: `SKU "${sku}" already has a pending request awaiting approval.`,
        };
      }
      // --------------------------------------------------  <-- NEW

      const pending = await prisma.pendingAction.create({
        data: {
          actionType: 'CREATE_PRODUCT',
          requestedById: access.user.id,
          branchId: access.branchId,
          payload,
        },
      });

      return { success: true, pending: true, data: pending };
    }

    // ADMIN: write immediately
    const newProduct = await prisma.product.create({
      data: { branchId: access.branchId, ...payload },
    });

    return { success: true, pending: false, data: newProduct };
  } catch (error) {
    console.error('createProduct error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create product. Check if SKU is unique.',
    };
  }
}

// ============================================================
// Update product
// ADMIN: updates immediately.
// MANAGER: submits a PendingAction for admin approval.
// ============================================================

export async function updateProduct(id: string, formData: FormData) {
  try {
    // Auth check FIRST — no DB read before we know the caller is
    // authenticated (fixes the ordering issue from the earlier review).
    const user = await requireAuth();

    const sku = String(formData.get('sku') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const category = String(formData.get('category') || '').trim();

    const stock = Number(formData.get('stock'));
    const lowStockAlert = Number(formData.get('lowStockAlert'));
    const costPrice = Number(formData.get('costPrice'));
    const sellingPrice = Number(formData.get('sellingPrice'));

    if (
      !sku ||
      !name ||
      !category ||
      Number.isNaN(stock) ||
      Number.isNaN(lowStockAlert) ||
      Number.isNaN(costPrice) ||
      Number.isNaN(sellingPrice)
    ) {
      return {
        success: false,
        error: 'Please provide all required product information.',
      };
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, branchId: true },
    });

    if (!existingProduct) {
      return { success: false, error: 'Product not found.' };
    }

    // Re-derive branch access from the product's real branch —
    // never trust a branchId from the client here.
    const access = await requireBranchManagerAccess(existingProduct.branchId);

    const payload = {
      sku,
      name,
      category,
      stock,
      lowStockAlert,
      costPrice,
      sellingPrice,
    };

    if (access.user.role === 'MANAGER') {
      // --------------------------------------------------  <-- NEW
      const existingPending = await prisma.pendingAction.findFirst({
        where: { targetId: id, status: 'PENDING' },
      });

      if (existingPending) {
        return {
          success: false,
          error: 'This record already has a request awaiting admin approval.',
        };
      }
      // --------------------------------------------------  <-- NEW

      const pending = await prisma.pendingAction.create({
        data: {
          actionType: 'UPDATE_PRODUCT',
          requestedById: access.user.id,
          branchId: access.branchId,
          targetId: id,
          payload,
        },
      });

      return { success: true, pending: true, data: pending };
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { branchId: access.branchId, ...payload },
    });

    return { success: true, pending: false, data: updatedProduct };
  } catch (error) {
    console.error('updateProduct error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update product',
    };
  }
}

// ============================================================
// Delete product
// ADMIN: deletes immediately.
// MANAGER: submits a PendingAction for admin approval.
// ============================================================

export async function deleteProduct(id: string) {
  try {
    // Auth check first, same reasoning as updateProduct above.
    await requireAuth();

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, branchId: true },
    });

    if (!existingProduct) {
      return { success: false, error: 'Product not found.' };
    }

    const access = await requireBranchManagerAccess(existingProduct.branchId);

    if (access.user.role === 'MANAGER') {
      // --------------------------------------------------  <-- NEW
      const existingPending = await prisma.pendingAction.findFirst({
        where: { targetId: id, status: 'PENDING' },
      });

      if (existingPending) {
        return {
          success: false,
          error: 'This record already has a request awaiting admin approval.',
        };
      }
      // --------------------------------------------------  <-- NEW

      const pending = await prisma.pendingAction.create({
        data: {
          actionType: 'DELETE_PRODUCT',
          requestedById: access.user.id,
          branchId: access.branchId,
          targetId: id,
          payload: {},
        },
      });

      return { success: true, pending: true, data: pending };
    }

    await prisma.product.delete({ where: { id } });

    return { success: true, pending: false };
  } catch (error) {
    console.error('deleteProduct error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete product',
    };
  }
}
