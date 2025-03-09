/*
  Warnings:

  - You are about to drop the column `name` on the `cargotracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cargotracking` DROP COLUMN `name`,
    ADD COLUMN `nickname` VARCHAR(191) NULL,
    ADD COLUMN `preRegisteredDate` DATETIME(3) NULL;
