import { PrismaClient } from '@prisma/client';
import { PermissionKeys } from '../domain/entities/PermissionKeys';
import { randomUUID } from 'crypto';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const keys = Object.values(PermissionKeys);
  for (const key of keys) {
    await prisma.permission.upsert({
      where: { permissionKey: key },
      update: {},
      create: { id: randomUUID(), permissionKey: key, description: key },
    });
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
