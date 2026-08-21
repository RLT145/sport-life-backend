/*
  Warnings:

  - You are about to drop the column `precio` on the `Sku` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Sku` table. All the data in the column will be lost.
  - You are about to drop the column `talla` on the `Sku` table. All the data in the column will be lost.
  - Added the required column `precio` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `talla` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Made the column `descripcion` on table `Producto` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "imagenUrl" TEXT,
ADD COLUMN     "precio" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "talla" TEXT NOT NULL,
ALTER COLUMN "descripcion" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sku" DROP COLUMN "precio",
DROP COLUMN "stock",
DROP COLUMN "talla";
