/*
  Warnings:

  - You are about to drop the column `amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `lcpCode` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lcpBase,currency]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lcpBase` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectLineType" AS ENUM ('CAPITAL', 'EXPENSE');

-- DropIndex
DROP INDEX "Project_lcpCode_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "amount",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "lcpCode",
DROP COLUMN "updatedAt",
ADD COLUMN     "lcpBase" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProjectLine" (
    "id" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "lineCode" TEXT NOT NULL,
    "type" "ProjectLineType" NOT NULL,

    CONSTRAINT "ProjectLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectBudget" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "lineId" INTEGER NOT NULL,

    CONSTRAINT "ProjectBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLine_projectId_lineCode_type_key" ON "ProjectLine"("projectId", "lineCode", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Project_lcpBase_currency_key" ON "Project"("lcpBase", "currency");

-- AddForeignKey
ALTER TABLE "ProjectLine" ADD CONSTRAINT "ProjectLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProjectLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
