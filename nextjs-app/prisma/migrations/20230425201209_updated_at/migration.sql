/*
  Warnings:

  - You are about to drop the column `timestamp` on the `TokenUsageSummary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TokenUsageSummary" DROP COLUMN "timestamp",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
