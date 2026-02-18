/*
  Warnings:

  - You are about to drop the column `currency` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `lcpBase` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `ProjectBudget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectLine` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[lcpCode]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lcpCode` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProjectBudget" DROP CONSTRAINT "ProjectBudget_lineId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectLine" DROP CONSTRAINT "ProjectLine_projectId_fkey";

-- DropIndex
DROP INDEX "Project_lcpBase_currency_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "currency",
DROP COLUMN "lcpBase",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lcpCode" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ProjectBudget";

-- DropTable
DROP TABLE "ProjectLine";

-- DropEnum
DROP TYPE "ProjectLineType";

-- CreateIndex
CREATE UNIQUE INDEX "Project_lcpCode_key" ON "Project"("lcpCode");
