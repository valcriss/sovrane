/* eslint-disable no-undef */
/* eslint-env node */
// Initialize application with default administrator
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const argon2 = require('argon2');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://sovrane:sovrane@localhost:5432/sovrane';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function main() {
  const prisma = new PrismaClient();
  const existing = await prisma.role.findFirst({ where: { label: 'Administrators' } });
  if (existing) {
    console.log('Administrators role already exists. Initialization aborted.');
    await prisma.$disconnect();
    return;
  }

  const siteName = process.env.MAIN_SITE_NAME || 'Main Site';
  let site = await prisma.site.findFirst({ where: { label: siteName } });
  if (!site) {
    site = await prisma.site.create({ data: { id: randomUUID(), label: siteName } });
  }

  const departmentName = process.env.MAIN_DEPARTMENT_NAME || 'Main Department';
  let department = await prisma.department.findFirst({ where: { label: departmentName } });
  if (!department) {
    department = await prisma.department.create({ data: { id: randomUUID(), label: departmentName, siteId: site.id } });
  }

  let group = await prisma.userGroup.findFirst({ where: { name: 'Administrators' } });
  if (!group) {
    group = await prisma.userGroup.create({ data: { id: randomUUID(), name: 'Administrators' } });
  }

  let rootPermission = await prisma.permission.findFirst({ where: { permissionKey: 'root' } });
  if (!rootPermission) {
    rootPermission = await prisma.permission.create({ data: { id: randomUUID(), permissionKey: 'root', description: 'All permissions' } });
  }

  const role = await prisma.role.create({
    data: {
      id: randomUUID(),
      label: 'Administrators',
      permissions: { create: { permissionId: rootPermission.id } }
    }
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'rootadmin';
  const passwordHash = await argon2.hash(adminPassword);

  await prisma.user.create({
    data: {
      id: randomUUID(),
      firstname: 'Admin',
      lastname: 'Admin',
      email: adminEmail,
      password: passwordHash,
      status: 'active',
      departmentId: department.id,
      siteId: site.id,
      roles: { create: { roleId: role.id } },
      groups: { create: { groupId: group.id } }
    }
  });

  console.log(`Administrator account created with email ${adminEmail}`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  process.exit(1);
});
