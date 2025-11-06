-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "fingerprintId" INTEGER;

-- CreateTable
CREATE TABLE "fingerprints" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "data" JSONB NOT NULL,
    "ownerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
