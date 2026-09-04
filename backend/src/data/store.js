const now = new Date().toISOString();

export const store = {
  users: [
    {
      id: 'u1',
      username: 'admin',
      name: 'Administrador',
      password: '123',
      role: 'Administrador',
      active: true,
    },
    {
      id: 'u2',
      username: 'aydee',
      name: 'Aydee',
      password: '123',
      role: 'Vendedora',
      active: true,
    },
  ],

  categories: [
    {
      id: 'cat1',
      name: 'Abarrotes',
      description: 'Alimentos secos y productos de despensa',
      active: true,
      createdAt: now,
    },
    {
      id: 'cat2',
      name: 'Bebidas',
      description: 'Gaseosas, agua, jugos y bebidas',
      active: true,
      createdAt: now,
    },
    {
      id: 'cat3',
      name: 'Lácteos',
      description: 'Leche, yogurt, queso y derivados',
      active: true,
      createdAt: now,
    },
    {
      id: 'cat4',
      name: 'Limpieza',
      description: 'Productos para limpieza del hogar',
      active: true,
      createdAt: now,
    },
    {
      id: 'cat5',
      name: 'Mascotas',
      description: 'Alimentos y cuidado para mascotas',
      active: true,
      createdAt: now,
    },
  ],

  brands: [
    {
      id: 'brand1',
      name: 'Gloria',
      description: 'Productos lácteos y alimentos',
      active: true,
      createdAt: now,
    },
    {
      id: 'brand2',
      name: 'Inca Kola',
      description: 'Bebidas gaseosas',
      active: true,
      createdAt: now,
    },
    {
      id: 'brand3',
      name: 'Costeño',
      description: 'Abarrotes',
      active: true,
      createdAt: now,
    },
    {
      id: 'brand4',
      name: 'Primor',
      description: 'Aceites y alimentos',
      active: true,
      createdAt: now,
    },
    {
      id: 'brand5',
      name: 'Bolívar',
      description: 'Limpieza del hogar',
      active: true,
      createdAt: now,
    },
  ],

  products: [
    {
      id: 'p1',
      barcode: '7750243051205',
      name: 'Leche Gloria Entera',
      description: 'Leche evaporada entera',
      categoryId: 'cat3',
      brandId: 'brand1',
      purchasePresentation: 'unidad',
      purchasePrice: 3.6,
      contentQuantity: 1,
      purchaseQuantity: 28,
      unitCost: 3.6,
      salePrice: 4.5,
      stock: 28,
      minStock: 8,
      saleUnit: 'unidad',
      image: '',
      active: true,
      createdAt: now,
    },
    {
      id: 'p2',
      barcode: '7750885001019',
      name: 'Inca Kola 600 ml',
      description: 'Botella personal de 600 ml',
      categoryId: 'cat2',
      brandId: 'brand2',
      purchasePresentation: 'paquete',
      purchasePrice: 26.4,
      contentQuantity: 12,
      purchaseQuantity: 3,
      unitCost: 2.2,
      salePrice: 3,
      stock: 34,
      minStock: 10,
      saleUnit: 'unidad',
      image: '',
      active: true,
      createdAt: now,
    },
    {
      id: 'p3',
      barcode: '7751271000159',
      name: 'Arroz Costeño 1 kg',
      description: 'Arroz extra en bolsa de 1 kg',
      categoryId: 'cat1',
      brandId: 'brand3',
      purchasePresentation: 'unidad',
      purchasePrice: 4.1,
      contentQuantity: 1,
      purchaseQuantity: 7,
      unitCost: 4.1,
      salePrice: 5.2,
      stock: 7,
      minStock: 10,
      saleUnit: 'unidad',
      image: '',
      active: true,
      createdAt: now,
    },
    {
      id: 'p4',
      barcode: '7750168000108',
      name: 'Aceite Primor 900 ml',
      description: 'Aceite vegetal',
      categoryId: 'cat1',
      brandId: 'brand4',
      purchasePresentation: 'unidad',
      purchasePrice: 8.1,
      contentQuantity: 1,
      purchaseQuantity: 5,
      unitCost: 8.1,
      salePrice: 9.8,
      stock: 5,
      minStock: 6,
      saleUnit: 'unidad',
      image: '',
      active: true,
      createdAt: now,
    },
    {
      id: 'p5',
      barcode: '7750106000252',
      name: 'Galleta Soda Field',
      description: 'Paquete individual',
      categoryId: 'cat1',
      brandId: '',
      purchasePresentation: 'paquete',
      purchasePrice: 9.6,
      contentQuantity: 12,
      purchaseQuantity: 4,
      unitCost: 0.8,
      salePrice: 1.2,
      stock: 42,
      minStock: 12,
      saleUnit: 'unidad',
      image: '',
      active: true,
      createdAt: now,
    },
    {
      id: 'p6',
      barcode: '7750463001837',
      name: 'Detergente Bolívar 500 g',
      description: 'Detergente en bolsa',
      categoryId: 'cat4',
      brandId: 'brand5',
      purchasePresentation: 'unidad',
      purchasePrice: 4.5,
      contentQuantity: 1,
      purchaseQuantity: 18,
      unitCost: 4.5,
      salePrice: 5.8,
      stock: 18,
      minStock: 5,
      saleUnit: 'unidad',
      image: '',
      active: true,
      createdAt: now,
    },
    {
      id: 'p7',
      barcode: '2000000000015',
      name: 'Comida para perro a granel',
      description: 'Alimento balanceado vendido por kilogramo',
      categoryId: 'cat5',
      brandId: '',
      purchasePresentation: 'saco',
      purchasePrice: 60,
      contentQuantity: 15,
      purchaseQuantity: 1,
      unitCost: 4,
      salePrice: 5.2,
      stock: 15,
      minStock: 3,
      saleUnit: 'kg',
      image: '',
      active: true,
      createdAt: now,
    },
  ],

  sales: [
    {
      id: 'v1',
      number: 'V-0001',
      date: '2026-08-08T09:10:00.000Z',
      total: 16.8,
      cost: 12.2,
      paymentMethod: 'Efectivo',
      received: 20,
      change: 3.2,
      items: 4,
      detail: [],
    },
    {
      id: 'v2',
      number: 'V-0002',
      date: '2026-08-08T10:32:00.000Z',
      total: 24.4,
      cost: 18.1,
      paymentMethod: 'Yape',
      received: 24.4,
      change: 0,
      items: 6,
      detail: [],
    },
    {
      id: 'v3',
      number: 'V-0003',
      date: '2026-08-08T12:05:00.000Z',
      total: 9.8,
      cost: 8.1,
      paymentMethod: 'Efectivo',
      received: 10,
      change: 0.2,
      items: 1,
      detail: [],
    },
  ],

  expenses: [
    {
      id: 'g1',
      date: '2026-08-08',
      description: 'Transporte de mercadería',
      category: 'Transporte',
      amount: 12,
      createdAt: now,
    },
    {
      id: 'g2',
      date: '2026-08-07',
      description: 'Bolsas para despacho',
      category: 'Insumos',
      amount: 8.5,
      createdAt: now,
    },
  ],

  

  suppliers: [
  {
    id: 'sup1',

    businessName:
      'Distribuidora Arequipa',

    ruc:
      '20400000001',

    phone:
      '054-400000',

    email:
      'ventas@distribuidoraarequipa.pe',

    address:
      'Arequipa, Perú',

    notes:
      'Proveedor principal de bebidas y abarrotes.',

    active:
      true,

    representatives: [
      {
        id:
          'rep1',

        name:
          'Carlos Mendoza',

        position:
          'Representante de ventas',

        phone:
          '987654321',

        email:
          'carlos.mendoza@distribuidoraarequipa.pe',

        notes:
          'Visita semanal.',
      },
    ],

    createdAt:
      now,
  },
],

purchases: [
  {
    id:
      'c1',

    number:
      'C-0001',

    supplierId:
      'sup1',

    supplier:
      'Distribuidora Arequipa',

    documentType:
      'Factura',

    documentNumber:
      'F001-000123',

    date:
      '2026-08-06',

    total:
      286.4,

    items:
      24,

    currency:
      'PEN',

    notes:
      'Compra semanal de mercadería.',

    documentName:
      'factura-001.jpg',

    documentMimeType:
      'image/jpeg',

    documentDataUrl:
      '',

    createdAt:
      now,
  },
],

  inventoryMovements: [],
};

export const nextNumber = (prefix, collection) =>
  `${prefix}-${String(collection.length + 1).padStart(4, '0')}`;

