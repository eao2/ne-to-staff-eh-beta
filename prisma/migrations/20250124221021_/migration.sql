/*
  Warnings:

  - You are about to drop the column `receivedAtEreenDate` on the `cargotracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cargotracking` DROP COLUMN `receivedAtEreenDate`,
    ADD COLUMN `receivedAtErenhotDate` DATETIME(3) NULL;
