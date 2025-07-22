-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN DEFAULT false,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalProvider" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "picture" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
