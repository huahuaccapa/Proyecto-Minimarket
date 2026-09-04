import { Router } from 'express';

import authRoutes from './modules/auth/auth.routes.js';

import productsRoutes from './modules/products/products.routes.js';

import catalogsRoutes from './modules/catalogs/catalogs.routes.js';

import inventoryRoutes from './modules/inventory/inventory.routes.js';

import salesRoutes from './modules/sales/sales.routes.js';

import purchasesRoutes from './modules/purchases/purchases.routes.js';

import expensesRoutes from './modules/expenses/expenses.routes.js';

import reportsRoutes from './modules/reports/reports.routes.js';

import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

import cashRoutes from './modules/cash/cash.routes.js';

const router = Router();

router.get(
  '/health',
  (req, res) =>
    res.json({
      success: true,

      message:
        'API funcionando',

      data: {
        status: 'ok',

        storage: 'memory',

        timestamp:
          new Date().toISOString(),
      },
    })
);

router.use(
  '/auth',
  authRoutes
);

router.use(
  '/products',
  productsRoutes
);

router.use(
  '/catalogs',
  catalogsRoutes
);

router.use(
  '/inventory',
  inventoryRoutes
);

router.use(
  '/sales',
  salesRoutes
);

router.use(
  '/purchases',
  purchasesRoutes
);

router.use(
  '/expenses',
  expensesRoutes
);

router.use(
  '/reports',
  reportsRoutes
);

router.use(
  '/dashboard',
  dashboardRoutes
);

router.use(
  '/cash',
  cashRoutes
);

export default router;