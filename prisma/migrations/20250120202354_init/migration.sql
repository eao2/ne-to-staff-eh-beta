-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `userType` ENUM('TEMPORARY', 'REGISTERED') NOT NULL DEFAULT 'TEMPORARY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CargoTracking` (
    `id` VARCHAR(191) NOT NULL,
    `trackingNumber` VARCHAR(191) NOT NULL,
    `cargoType` ENUM('QUICK', 'NORMAL') NOT NULL,
    `currentStatus` ENUM('RECEIVED_AT_EREEN', 'IN_TRANSIT', 'DELIVERED_TO_UB', 'DELIVERED') NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `paymentStatus` ENUM('PENDING', 'PAID', 'PARTIALLY_PAID') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CargoTracking_trackingNumber_key`(`trackingNumber`),
    INDEX `CargoTracking_trackingNumber_idx`(`trackingNumber`),
    INDEX `CargoTracking_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CargoStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('RECEIVED_AT_EREEN', 'IN_TRANSIT', 'DELIVERED_TO_UB', 'DELIVERED') NOT NULL,
    `timestamp` TIMESTAMP(0) NOT NULL,
    `notes` TEXT NULL,
    `cargoId` VARCHAR(191) NOT NULL,

    INDEX `CargoStatusHistory_cargoId_idx`(`cargoId`),
    INDEX `CargoStatusHistory_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CargoTracking` ADD CONSTRAINT `CargoTracking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CargoStatusHistory` ADD CONSTRAINT `CargoStatusHistory_cargoId_fkey` FOREIGN KEY (`cargoId`) REFERENCES `CargoTracking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
