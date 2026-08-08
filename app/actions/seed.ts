'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function createInitialAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin)
    return { success: false, message: 'Admin already exists!' };

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@store.com',
      firstName: 'System',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  return { success: true, email: admin.email };
}
