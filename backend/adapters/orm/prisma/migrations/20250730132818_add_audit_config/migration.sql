-- CreateTable
CREATE TABLE "AuditConfig" (
    "id" SERIAL NOT NULL,
    "levels" TEXT[] NOT NULL,
    "categories" TEXT[] NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "singleton" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AuditConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditConfig_singleton_key" ON "AuditConfig"("singleton");
