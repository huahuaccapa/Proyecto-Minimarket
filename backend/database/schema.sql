-- Esquema generado automáticamente desde la base real del Minimarket Mamá.
-- Base origen: minimarket_mama
-- Fecha: 2026-09-16T01:47:39.826Z

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_brands_name` (`name`),
  KEY `idx_brands_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `business_settings`;
CREATE TABLE `business_settings` (
  `id` tinyint unsigned NOT NULL,
  `business_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_movements`;
CREATE TABLE `cash_movements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('in','out') COLLATE utf8mb4_unicode_ci NOT NULL,
  `movement_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `reference_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `reference_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `movement_date` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_cash_movements_user` (`user_id`),
  KEY `idx_cash_movements_session` (`session_id`),
  KEY `idx_cash_movements_date` (`movement_date`),
  KEY `idx_cash_movements_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_cash_movements_session` FOREIGN KEY (`session_id`) REFERENCES `cash_sessions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cash_movements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cash_sessions`;
CREATE TABLE `cash_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `opening_amount` decimal(12,2) NOT NULL,
  `opened_at` datetime(3) NOT NULL,
  `opened_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `closing_amount` decimal(12,2) DEFAULT NULL,
  `expected_amount` decimal(12,2) DEFAULT NULL,
  `difference` decimal(12,2) DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  `closed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cash_sessions_number` (`number`),
  KEY `fk_cash_sessions_opened_by` (`opened_by`),
  KEY `fk_cash_sessions_closed_by` (`closed_by`),
  KEY `idx_cash_sessions_status` (`status`),
  KEY `idx_cash_sessions_opened_at` (`opened_at`),
  CONSTRAINT `fk_cash_sessions_closed_by` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cash_sessions_opened_by` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`),
  KEY `idx_categories_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_credits`;
CREATE TABLE `customer_credits` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(14,3) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `unit_cost` decimal(12,4) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `status` enum('active','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voided_at` datetime(3) DEFAULT NULL,
  `voided_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `fk_customer_credits_created_by` (`created_by`),
  KEY `fk_customer_credits_updated_by` (`updated_by`),
  KEY `fk_customer_credits_voided_by` (`voided_by`),
  KEY `idx_customer_credits_customer` (`customer_id`),
  KEY `idx_customer_credits_product` (`product_id`),
  KEY `idx_customer_credits_status` (`status`),
  KEY `idx_customer_credits_created` (`created_at`),
  CONSTRAINT `fk_customer_credits_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_credits_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_credits_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_credits_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_credits_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_payments`;
CREATE TABLE `customer_payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('active','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voided_at` datetime(3) DEFAULT NULL,
  `voided_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `fk_customer_payments_created_by` (`created_by`),
  KEY `fk_customer_payments_voided_by` (`voided_by`),
  KEY `idx_customer_payments_customer` (`customer_id`),
  KEY `idx_customer_payments_status` (`status`),
  KEY `idx_customer_payments_created` (`created_at`),
  CONSTRAINT `fk_customer_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_payments_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dni` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_customers_created_by` (`created_by`),
  KEY `fk_customers_updated_by` (`updated_by`),
  KEY `fk_customers_deleted_by` (`deleted_by`),
  KEY `idx_customers_name` (`name`),
  KEY `idx_customers_dni` (`dni`),
  KEY `idx_customers_phone` (`phone`),
  KEY `idx_customers_active` (`active`),
  CONSTRAINT `fk_customers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customers_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customers_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_date` date NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Efectivo',
  `status` enum('active','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voided_at` datetime(3) DEFAULT NULL,
  `voided_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `fk_expenses_created_by` (`created_by`),
  KEY `fk_expenses_voided_by` (`voided_by`),
  KEY `idx_expenses_date` (`expense_date`),
  KEY `idx_expenses_status` (`status`),
  CONSTRAINT `fk_expenses_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_expenses_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_movements`;
CREATE TABLE `inventory_movements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `movement_type` enum('entrada','salida') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `reference_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `quantity` decimal(14,3) NOT NULL,
  `stock_after` decimal(14,3) NOT NULL,
  `movement_date` datetime(3) NOT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_inventory_movements_user` (`created_by`),
  KEY `idx_inventory_product` (`product_id`),
  KEY `idx_inventory_date` (`movement_date`),
  KEY `idx_inventory_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_inventory_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_movements_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `category_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_presentation` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unidad',
  `purchase_price` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `content_quantity` decimal(12,3) NOT NULL DEFAULT '1.000',
  `purchase_quantity` decimal(12,3) NOT NULL DEFAULT '1.000',
  `unit_cost` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `sale_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock` decimal(14,3) NOT NULL DEFAULT '0.000',
  `min_stock` decimal(14,3) NOT NULL DEFAULT '0.000',
  `sale_unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unidad',
  `image` mediumtext COLLATE utf8mb4_unicode_ci,
  `expiration_date` date DEFAULT NULL,
  `sanitary_registration` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `lot` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_barcode` (`barcode`),
  KEY `idx_products_name` (`name`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_brand` (`brand_id`),
  KEY `idx_products_active` (`active`),
  KEY `idx_products_stock` (`stock`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_items`;
CREATE TABLE `purchase_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `purchase_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `packages` decimal(14,3) NOT NULL,
  `content_quantity` decimal(14,3) NOT NULL,
  `units` decimal(14,3) NOT NULL,
  `purchase_price` decimal(12,2) NOT NULL,
  `unit_cost` decimal(12,4) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `lot` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `expiration_date` date DEFAULT NULL,
  `stock_before` decimal(14,3) DEFAULT NULL,
  `unit_cost_before` decimal(12,4) DEFAULT NULL,
  `purchase_price_before` decimal(12,4) DEFAULT NULL,
  `content_quantity_before` decimal(14,3) DEFAULT NULL,
  `purchase_quantity_before` decimal(14,3) DEFAULT NULL,
  `lot_before` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `expiration_date_before` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_items_purchase` (`purchase_id`),
  KEY `idx_purchase_items_product` (`product_id`),
  CONSTRAINT `fk_purchase_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_items_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_date` date NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `items` decimal(14,3) NOT NULL DEFAULT '0.000',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PEN',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Efectivo',
  `payment_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pagado',
  `status` enum('completed','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `document_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `document_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `document_data_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voided_at` datetime(3) DEFAULT NULL,
  `voided_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_purchases_number` (`number`),
  UNIQUE KEY `uq_supplier_document` (`supplier_id`,`document_type`,`document_number`),
  KEY `fk_purchases_created_by` (`created_by`),
  KEY `fk_purchases_voided_by` (`voided_by`),
  KEY `idx_purchases_supplier` (`supplier_id`),
  KEY `idx_purchases_date` (`purchase_date`),
  KEY `idx_purchases_status` (`status`),
  CONSTRAINT `fk_purchases_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_purchases_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_purchases_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(14,3) NOT NULL,
  `base_unit_price` decimal(12,2) NOT NULL,
  `is_chilled` tinyint(1) NOT NULL DEFAULT '0',
  `chilled_surcharge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit_price` decimal(12,2) NOT NULL,
  `unit_cost` decimal(12,4) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_items_sale` (`sale_id`),
  KEY `idx_sale_items_product` (`product_id`),
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(3) NOT NULL,
  `status` enum('completed','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `total` decimal(12,2) NOT NULL,
  `cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gross_profit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Efectivo',
  `received` decimal(12,2) NOT NULL,
  `change` decimal(12,2) NOT NULL DEFAULT '0.00',
  `items` decimal(14,3) NOT NULL DEFAULT '0.000',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voided_at` datetime(3) DEFAULT NULL,
  `voided_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_number` (`number`),
  KEY `fk_sales_created_by` (`created_by`),
  KEY `fk_sales_voided_by` (`voided_by`),
  KEY `idx_sales_date` (`date`),
  KEY `idx_sales_status` (`status`),
  CONSTRAINT `fk_sales_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sequences`;
CREATE TABLE `sequences` (
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_value` bigint unsigned NOT NULL DEFAULT '0',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  PRIMARY KEY (`token`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `supplier_representatives`;
CREATE TABLE `supplier_representatives` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_supplier_representatives_supplier` (`supplier_id`),
  CONSTRAINT `fk_supplier_representatives_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruc` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_suppliers_ruc` (`ruc`),
  KEY `idx_suppliers_name` (`business_name`),
  KEY `idx_suppliers_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Administrador','Vendedora') COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `password_updated_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
