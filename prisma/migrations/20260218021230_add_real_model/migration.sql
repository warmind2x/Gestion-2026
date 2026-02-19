-- CreateTable
CREATE TABLE "Real" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "expDescription" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Real_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Real_projectId_idx" ON "Real"("projectId");

-- AddForeignKey
ALTER TABLE "Real" ADD CONSTRAINT "Real_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
