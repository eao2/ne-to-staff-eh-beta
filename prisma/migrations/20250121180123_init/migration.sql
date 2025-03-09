/*
  Warnings:

  - You are about to drop the column `currentStatus` on the `cargotracking` table. All the data in the column will be lost.
  - You are about to drop the `cargostatushistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cargostatushistory` DROP FOREIGN KEY `CargoStatusHistory_cargoId_fkey`;

-- DropForeignKey
ALTER TABLE `cargotracking` DROP FOREIGN KEY `CargoTracking_userId_fkey`;

-- AlterTable
ALTER TABLE `cargotracking` DROP COLUMN `currentStatus`,
    ADD COLUMN `deliveredDate` DATETIME(3) NULL,
    ADD COLUMN `deliveredToUBDate` DATETIME(3) NULL,
    ADD COLUMN `inTransitDate` DATETIME(3) NULL,
    ADD COLUMN `receivedAtEreenDate` DATETIME(3) NULL,
    MODIFY `cargoType` ENUM('QUICK', 'NORMAL') NOT NULL DEFAULT 'NORMAL',
    MODIFY `price` DECIMAL(10, 2) NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `cargostatushistory`;

-- AddForeignKey
ALTER TABLE `CargoTracking` ADD CONSTRAINT `CargoTracking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
