/*
  Warnings:

  - You are about to drop the column `agent_id` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `agent_id` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the `agents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `agents` DROP FOREIGN KEY `agents_level_id_fkey`;

-- DropForeignKey
ALTER TABLE `contacts` DROP FOREIGN KEY `contacts_agent_id_fkey`;

-- DropForeignKey
ALTER TABLE `customers` DROP FOREIGN KEY `customers_agent_id_fkey`;

-- DropForeignKey
ALTER TABLE `customers` DROP FOREIGN KEY `customers_category_id_fkey`;

-- AlterTable
ALTER TABLE `contacts` DROP COLUMN `agent_id`;

-- AlterTable
ALTER TABLE `customers` DROP COLUMN `agent_id`,
    DROP COLUMN `category_id`,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `short_name` VARCHAR(191) NULL,
    ADD COLUMN `type_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `suppliers` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `short_name` VARCHAR(191) NULL,
    ADD COLUMN `type_id` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `agents`;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `dictionaries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `dictionaries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
