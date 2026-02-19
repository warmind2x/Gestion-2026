/*
  Warnings:

  - Added the required column `purchaseOrder` to the `Real` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Real" ADD COLUMN     "purchaseOrder" TEXT NOT NULL;
