-- Drop size column and add length/width/height/seat_h
ALTER TABLE `products` DROP COLUMN `size`,
    ADD COLUMN `length` VARCHAR(191) NULL,
    ADD COLUMN `width` VARCHAR(191) NULL,
    ADD COLUMN `height` VARCHAR(191) NULL,
    ADD COLUMN `seat_h` VARCHAR(191) NULL;

-- Make item_no unique
ALTER TABLE `products` ADD UNIQUE INDEX `products_item_no_key`(`item_no`);
