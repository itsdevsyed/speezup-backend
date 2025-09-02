/*
  Warnings:

  - You are about to drop the column `storeId` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to alter the column `totalPrice` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[addressId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `addressId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Address" DROP CONSTRAINT "Address_storeId_fkey";

-- DropIndex
DROP INDEX "public"."Address_storeId_key";

-- DropIndex
DROP INDEX "public"."Address_userId_key";

-- AlterTable
ALTER TABLE "public"."Address" DROP COLUMN "storeId";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "updatedAt",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."OrderItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "addressId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."StoreCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StoreCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_StoreToStoreCategory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StoreToStoreCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreCategory_name_key" ON "public"."StoreCategory"("name");

-- CreateIndex
CREATE INDEX "_StoreToStoreCategory_B_index" ON "public"."_StoreToStoreCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Store_addressId_key" ON "public"."Store"("addressId");

-- AddForeignKey
ALTER TABLE "public"."Store" ADD CONSTRAINT "Store_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StoreToStoreCategory" ADD CONSTRAINT "_StoreToStoreCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StoreToStoreCategory" ADD CONSTRAINT "_StoreToStoreCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."StoreCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
