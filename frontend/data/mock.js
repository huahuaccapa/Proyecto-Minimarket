export const seedCategories = [
  { id: 'cat1', name: 'Abarrotes', description: 'Alimentos secos y productos de despensa', active: true },
  { id: 'cat2', name: 'Bebidas', description: 'Gaseosas, agua, jugos y bebidas', active: true },
  { id: 'cat3', name: 'Lácteos', description: 'Leche, yogurt, queso y derivados', active: true },
  { id: 'cat4', name: 'Limpieza', description: 'Productos para limpieza del hogar', active: true },
  { id: 'cat5', name: 'Mascotas', description: 'Alimentos y cuidado para mascotas', active: true },
];

export const seedBrands = [
  { id: 'brand1', name: 'Gloria', description: 'Productos lácteos y alimentos', active: true },
  { id: 'brand2', name: 'Inca Kola', description: 'Bebidas gaseosas', active: true },
  { id: 'brand3', name: 'Costeño', description: 'Abarrotes', active: true },
  { id: 'brand4', name: 'Primor', description: 'Aceites y alimentos', active: true },
  { id: 'brand5', name: 'Bolívar', description: 'Limpieza del hogar', active: true },
];

export const seedProducts = [
  { id: 'p1', barcode: '7750243051205', name: 'Leche Gloria Entera', description: 'Leche evaporada entera', categoryId: 'cat3', brandId: 'brand1', purchasePresentation: 'unidad', purchasePrice: 3.6, contentQuantity: 1, purchaseQuantity: 28, unitCost: 3.6, salePrice: 4.5, stock: 28, minStock: 8, saleUnit: 'unidad', image: '', active: true },
  { id: 'p2', barcode: '7750885001019', name: 'Inca Kola 600 ml', description: 'Botella personal de 600 ml', categoryId: 'cat2', brandId: 'brand2', purchasePresentation: 'paquete', purchasePrice: 26.4, contentQuantity: 12, purchaseQuantity: 3, unitCost: 2.2, salePrice: 3.0, stock: 34, minStock: 10, saleUnit: 'unidad', image: '', active: true },
  { id: 'p3', barcode: '7751271000159', name: 'Arroz Costeño 1 kg', description: 'Arroz extra en bolsa de 1 kg', categoryId: 'cat1', brandId: 'brand3', purchasePresentation: 'unidad', purchasePrice: 4.1, contentQuantity: 1, purchaseQuantity: 7, unitCost: 4.1, salePrice: 5.2, stock: 7, minStock: 10, saleUnit: 'unidad', image: '', active: true },
  { id: 'p4', barcode: '7750168000108', name: 'Aceite Primor 900 ml', description: 'Aceite vegetal', categoryId: 'cat1', brandId: 'brand4', purchasePresentation: 'unidad', purchasePrice: 8.1, contentQuantity: 1, purchaseQuantity: 5, unitCost: 8.1, salePrice: 9.8, stock: 5, minStock: 6, saleUnit: 'unidad', image: '', active: true },
  { id: 'p5', barcode: '7750106000252', name: 'Galleta Soda Field', description: 'Paquete individual', categoryId: 'cat1', brandId: '', purchasePresentation: 'paquete', purchasePrice: 9.6, contentQuantity: 12, purchaseQuantity: 4, unitCost: 0.8, salePrice: 1.2, stock: 42, minStock: 12, saleUnit: 'unidad', image: '', active: true },
  { id: 'p6', barcode: '7750463001837', name: 'Detergente Bolívar 500 g', description: 'Detergente en bolsa', categoryId: 'cat4', brandId: 'brand5', purchasePresentation: 'unidad', purchasePrice: 4.5, contentQuantity: 1, purchaseQuantity: 18, unitCost: 4.5, salePrice: 5.8, stock: 18, minStock: 5, saleUnit: 'unidad', image: '', active: true },
  { id: 'p7', barcode: '2000000000015', name: 'Comida para perro a granel', description: 'Alimento balanceado vendido por kilogramo', categoryId: 'cat5', brandId: '', purchasePresentation: 'saco', purchasePrice: 60, contentQuantity: 15, purchaseQuantity: 1, unitCost: 4, salePrice: 5.2, stock: 15, minStock: 3, saleUnit: 'kg', image: '', active: true },
];

export const seedSales = [
  { id: 'v1', number: 'V-0001', date: '2026-08-08T09:10:00.000Z', total: 16.8, cost: 12.2, paymentMethod: 'Efectivo', items: 4 },
  { id: 'v2', number: 'V-0002', date: '2026-08-08T10:32:00.000Z', total: 24.4, cost: 18.1, paymentMethod: 'Yape', items: 6 },
  { id: 'v3', number: 'V-0003', date: '2026-08-08T12:05:00.000Z', total: 9.8, cost: 8.1, paymentMethod: 'Efectivo', items: 1 },
];

export const seedExpenses = [
  { id: 'g1', date: '2026-08-08', description: 'Transporte de mercadería', category: 'Transporte', amount: 12 },
  { id: 'g2', date: '2026-08-07', description: 'Bolsas para despacho', category: 'Insumos', amount: 8.5 },
];

export const seedPurchases = [
  { id: 'c1', number: 'C-0001', date: '2026-08-06', supplier: 'Distribuidora Arequipa', total: 286.4, document: 'factura-001.pdf', items: 24 },
];

export const formatMoney = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));

export const formatDate = (value) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

export const createId = () =>
  globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const formatQuantity = (value) =>
  new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(Number(value || 0));