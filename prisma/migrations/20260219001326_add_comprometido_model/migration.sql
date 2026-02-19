-- CreateTable
CREATE TABLE "Comprometido" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "refDoc" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "docDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comprometido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comprometido_projectId_idx" ON "Comprometido"("projectId");

-- AddForeignKey
ALTER TABLE "Comprometido" ADD CONSTRAINT "Comprometido_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
