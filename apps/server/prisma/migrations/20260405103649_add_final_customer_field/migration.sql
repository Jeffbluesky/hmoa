-- AlterTable
ALTER TABLE `customers` ADD COLUMN `final_customer_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_final_customer_id_fkey` FOREIGN KEY (`final_customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
