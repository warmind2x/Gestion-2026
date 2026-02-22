-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ABIERTO', 'CERRADO', 'TECO');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'CERRADO';
