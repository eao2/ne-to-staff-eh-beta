-- AlterTable
ALTER TABLE `cargotracking` ADD COLUMN `currentStatus` ENUM('PRE_REGISTERED', 'RECEIVED_AT_ERENHOT', 'IN_TRANSIT', 'DELIVERED_TO_UB', 'DELIVERED') NOT NULL DEFAULT 'PRE_REGISTERED';
