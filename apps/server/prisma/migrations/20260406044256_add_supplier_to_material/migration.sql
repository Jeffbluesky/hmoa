-- AlterTable
ALTER TABLE `materials` ADD COLUMN `supplier_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
