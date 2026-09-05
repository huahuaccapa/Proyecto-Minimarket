import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const now = new Date().toISOString();

const hashPassword = (value) =>
  createHash('sha256')
    .update(String(value))
    .digest('hex');

const initialStore = () => ({
  meta: {
    sequences: {
      sale: 0,
      purchase: 0,
      cashSession: 0,
    },
    version: 2,
  },

  users: [
    {
      id: 'u1',
      username: 'admin',
      name: 'Administrador',
      passwordHash: hashPassword('123'),
      role: 'Administrador',
      active: true,
    },
    {
      id: 'u2',
      username: 'aydee',
      name: 'Aydee',
      passwordHash: hashPassword('123'),
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
      expirationDate: '',
      sanitaryRegistration: '',
      lot: '',
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
      stock: 36,
      minStock: 10,
      saleUnit: 'unidad',
      image: '',
      expirationDate: '',
      sanitaryRegistration: '',
      lot: '',
      active: true,
      createdAt: now,
    },
  ],

  suppliers: [
    {
      id: 'sup1',
      businessName: 'Distribuidora Arequipa',
      ruc: '20400000001',
      phone: '054-400000',
      email: 'ventas@distribuidoraarequipa.pe',
      address: 'Arequipa, Perú',
      notes: 'Proveedor principal.',
      active: true,
      representatives: [],
      createdAt: now,
    },
  ],

  sales: [],
  purchases: [],
  expenses: [],
  inventoryMovements: [],
  cashMovements: [],
  cashSessions: [],
});

function migrate(data) {
  const base = initialStore();

  const merged = {
    ...base,
    ...data,
  };

  for (const key of [
    'users',
    'categories',
    'brands',
    'products',
    'suppliers',
    'sales',
    'purchases',
    'expenses',
    'inventoryMovements',
    'cashMovements',
    'cashSessions',
  ]) {
    if (!Array.isArray(merged[key])) {
      merged[key] = [];
    }
  }

  merged.meta = {
    ...base.meta,
    ...(data.meta || {}),
  };

  merged.meta.sequences = {
    ...base.meta.sequences,
    ...(data.meta?.sequences || {}),
  };

  merged.users = merged.users.map((user) => ({
    ...user,
    passwordHash:
      user.passwordHash ||
      hashPassword(user.password || '123'),
    password: undefined,
  }));

  return merged;
}

function loadStore() {
  fs.mkdirSync(DATA_DIR, {
    recursive: true,
  });

  if (!fs.existsSync(DATA_FILE)) {
    const fresh = initialStore();

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(fresh, null, 2),
    );

    return fresh;
  }

  try {
    return migrate(
      JSON.parse(
        fs.readFileSync(DATA_FILE, 'utf8'),
      ),
    );
  } catch {
    const backup = `${DATA_FILE}.corrupt-${Date.now()}`;

    fs.copyFileSync(
      DATA_FILE,
      backup,
    );

    const fresh = initialStore();

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(fresh, null, 2),
    );

    return fresh;
  }
}

export const store = loadStore();

export function persistStore() {
  fs.mkdirSync(DATA_DIR, {
    recursive: true,
  });

  const temp = `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    temp,
    JSON.stringify(store, null, 2),
  );

  fs.renameSync(
    temp,
    DATA_FILE,
  );
}

export function nextNumber(type, prefix) {
  store.meta.sequences[type] =
    Number(store.meta.sequences[type] || 0) + 1;

  persistStore();

  return `${prefix}-${String(
    store.meta.sequences[type],
  ).padStart(4, '0')}`;
}

export {
  hashPassword,
};