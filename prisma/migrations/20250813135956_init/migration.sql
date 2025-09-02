/*
  Warnings:

  - Added the required column `ownerId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('BUYER', 'SHOP_OWNER', 'DELIVERY');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "deliveryPartnerId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'BUYER';

-- AddForeignKey
ALTER TABLE "public"."Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
