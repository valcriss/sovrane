-- AlterTable
ALTER TABLE "UserPermission" ADD COLUMN "scopeId" TEXT;
ALTER TABLE "RolePermission" ADD COLUMN "scopeId" TEXT;
