/*
  Warnings:

  - You are about to drop the column `token` on the `RefreshToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hashtoken]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hashtoken` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."RefreshToken_token_key";

-- AlterTable
ALTER TABLE "public"."RefreshToken" DROP COLUMN "token",
ADD COLUMN     "hashtoken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_hashtoken_key" ON "public"."RefreshToken"("hashtoken");
