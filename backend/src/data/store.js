const now = new Date().toISOString();

export const store = {
  users: [
    { id: 'u1', username: 'admin', name: 'Administrador', password: '123', role: 'Administrador', active: true },
    { id: 'u2', username: 'aydee', name: 'Aydee', password: '123', role: 'Vendedora', active: true },
  ],
  products: [
    { id: 'p1', barcode: '7750243051205', name: 'Leche Gloria Entera', category: 'Lácteos', purchasePrice: 3.6, salePrice: 4.5, stock: 28, minStock: 8, unit: 'unidad', active: true, createdAt: now },
    { id: 'p2', barcode: '7750885001019', name: 'Inca Kola 600 ml', category: 'Bebidas', purchasePrice: 2.2, salePrice: 3, stock: 34, minStock: 10, unit: 'unidad', active: true, createdAt: now },
    { id: 'p3', barcode: '7751271000159', name: 'Arroz Costeño 1 kg', category: 'Abarrotes', purchasePrice: 4.1, salePrice: 5.2, stock: 7, minStock: 10, unit: 'bolsa', active: true, createdAt: now },
    { id: 'p4', barcode: '7750168000108', name: 'Aceite Primor 900 ml', category: 'Abarrotes', purchasePrice: 8.1, salePrice: 9.8, stock: 5, minStock: 6, unit: 'botella', active: true, createdAt: now },
    { id: 'p5', barcode: '7750106000252', name: 'Galleta Soda Field', category: 'Galletas', purchasePrice: 0.8, salePrice: 1.2, stock: 42, minStock: 12, unit: 'paquete', active: true, createdAt: now },
    { id: 'p6', barcode: '7750463001837', name: 'Detergente Bolívar 500 g', category: 'Limpieza', purchasePrice: 4.5, salePrice: 5.8, stock: 18, minStock: 5, unit: 'bolsa', active: true, createdAt: now },
  ],
  sales: [
    { id: 'v1', number: 'V-0001', date: '2026-08-08T09:10:00.000Z', total: 16.8, cost: 12.2, paymentMethod: 'Efectivo', received: 20, change: 3.2, items: 4, detail: [] },
    { id: 'v2', number: 'V-0002', date: '2026-08-08T10:32:00.000Z', total: 24.4, cost: 18.1, paymentMethod: 'Yape', received: 24.4, change: 0, items: 6, detail: [] },
    { id: 'v3', number: 'V-0003', date: '2026-08-08T12:05:00.000Z', total: 9.8, cost: 8.1, paymentMethod: 'Efectivo', received: 10, change: 0.2, items: 1, detail: [] },
  ],
  expenses: [
    { id: 'g1', date: '2026-08-08', description: 'Transporte de mercadería', category: 'Transporte', amount: 12, createdAt: now },
    { id: 'g2', date: '2026-08-07', description: 'Bolsas para despacho', category: 'Insumos', amount: 8.5, createdAt: now },
  ],
  purchases: [
    { id: 'c1', number: 'C-0001', date: '2026-08-06', supplier: 'Distribuidora Arequipa', total: 286.4, document: 'factura-001.pdf', items: 24, createdAt: now },
  ],
  inventoryMovements: [],
};

export const nextNumber = (prefix, collection) =>
  `${prefix}-${String(collection.length + 1).padStart(4, '0')}`;