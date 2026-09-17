-- ============================================================
-- MINIMARKET MAMÁ
-- MIGRACIÓN 002
-- PRODUCTOS CON/SIN CÓDIGO DE BARRAS
-- ============================================================
--
-- Esta migración permite:
--
-- 1. Productos con código de barras.
-- 2. Productos sin código de barras.
-- 3. Mantener códigos únicos cuando sí existen.
-- 4. Registrar pasteles, panes, empanadas, etc.
--    sin obligar a ingresar código.
--
-- ============================================================

ALTER TABLE products
  MODIFY COLUMN barcode VARCHAR(100) NULL DEFAULT NULL;

ALTER TABLE sale_items
  MODIFY COLUMN barcode VARCHAR(100) NULL DEFAULT NULL;

ALTER TABLE customer_credits
  MODIFY COLUMN barcode VARCHAR(100) NULL DEFAULT NULL;

-- Convertimos códigos vacíos antiguos a NULL.

UPDATE products
SET barcode = NULL
WHERE barcode IS NOT NULL
  AND TRIM(barcode) = '';

UPDATE sale_items
SET barcode = NULL
WHERE barcode IS NOT NULL
  AND TRIM(barcode) = '';

UPDATE customer_credits
SET barcode = NULL
WHERE barcode IS NOT NULL
  AND TRIM(barcode) = '';