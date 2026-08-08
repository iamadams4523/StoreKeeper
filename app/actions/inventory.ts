'use server';

import prisma from '@/lib/prisma';

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error('getAllProducts error:', error);

    return {
      success: false,
      error: 'Failed to fetch products',
    };
  }
}

export async function createProduct(formData: FormData) {
  try {
    const sku = String(formData.get('sku') || '');
    const name = String(formData.get('name') || '');
    const category = String(formData.get('category') || '');

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

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        category,
        stock,
        lowStockAlert,
        costPrice,
        sellingPrice,
      },
    });

    return {
      success: true,
      data: newProduct,
    };
  } catch (error) {
    console.error('createProduct error:', error);

    return {
      success: false,
      error: 'Failed to create product. Check if SKU is unique.',
    };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const sku = String(formData.get('sku') || '');
    const name = String(formData.get('name') || '');
    const category = String(formData.get('category') || '');

    const stock = Number(formData.get('stock'));
    const lowStockAlert = Number(formData.get('lowStockAlert'));
    const costPrice = Number(formData.get('costPrice'));
    const sellingPrice = Number(formData.get('sellingPrice'));

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        sku,
        name,
        category,
        stock,
        lowStockAlert,
        costPrice,
        sellingPrice,
      },
    });

    return {
      success: true,
      data: updatedProduct,
    };
  } catch (error) {
    console.error('updateProduct error:', error);

    return {
      success: false,
      error: 'Failed to update product',
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('deleteProduct error:', error);

    return {
      success: false,
      error: 'Failed to delete product',
    };
  }
}
