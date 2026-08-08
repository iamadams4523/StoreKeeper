// import { PrismaClient } from '@prisma/client';

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// const prisma = globalThis.prisma ?? new PrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//   globalThis.prisma = prisma;
// }

// export default prisma;
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
