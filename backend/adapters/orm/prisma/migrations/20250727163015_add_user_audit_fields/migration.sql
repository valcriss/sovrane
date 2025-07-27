-- Add audit columns to User
ALTER TABLE "User" ADD COLUMN "createdById" TEXT;
ALTER TABLE "User" ADD COLUMN "updatedById" TEXT;

-- Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
