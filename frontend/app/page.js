'use client';

import { useEffect, useState } from 'react';

import Login from '../components/Login';
import AppShell from '../components/AppShell';

import DashboardView from '../views/DashboardView';
import PosView from '../views/PosView';
import ProductsView from '../views/ProductsView';
import CategoriesView from '../views/CategoriesView';
import BrandsView from '../views/BrandsView';
import InventoryView from '../views/InventoryView';
import PurchasesView from '../views/PurchasesView';
import ExpensesView from '../views/ExpensesView';
import ReportsView from '../views/ReportsView';
import SettingsView from '../views/SettingsView';


import { api } from '../lib/api';

import {
  seedProducts,
  seedCategories,
  seedBrands,
  seedSales,
  seedExpenses,
  seedPurchases,
  createId,
} from '../data/mock';

const demoUsers = [
  {
    id: 'u1',
    username: 'admin',
    password: '123',
    name: 'Administrador',
    role: 'Administrador',
  },
  {
    id: 'u2',
    username: 'aydee',
    password: '123',
    name: 'Aydee',
    role: 'Vendedora',
  },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState('dashboard');
  const [online, setOnline] = useState(false);

  const [products, setProducts] = useState(seedProducts);
  const [categories, setCategories] = useState(seedCategories);
  const [brands, setBrands] = useState(seedBrands);
  const [sales, setSales] = useState(seedSales);
  const [expenses, setExpenses] = useState(seedExpenses);
  const [purchases, setPurchases] = useState(seedPurchases);

  useEffect(() => {
    Promise.all([
      api.products(),
      api.categories(),
      api.brands(),
      api.sales(),
      api.expenses(),
      api.purchases(),
    ])
      .then(
        ([
          productData,
          categoryData,
          brandData,
          saleData,
          expenseData,
          purchaseData,
        ]) => {
          setProducts(productData.data);
          setCategories(categoryData.data);
          setBrands(brandData.data);
          setSales(saleData.data);
          setExpenses(expenseData.data);
          setPurchases(purchaseData.data);
          setOnline(true);
        }
      )
      .catch(() => {
        setOnline(false);
      });
  }, []);

  const login = async (credentials) => {
    const normalizedUsername = credentials.username
      .trim()
      .toLowerCase();

    if (!normalizedUsername || !credentials.password) {
      throw new Error(
        'Completa el usuario y la contraseña.'
      );
    }

    try {
      const result = await api.login({
        username: normalizedUsername,
        password: credentials.password,
      });

      const loggedUser = result.data.user;

      setUser(loggedUser);

      setActive(
        loggedUser.role === 'Vendedora'
          ? 'pos'
          : 'dashboard'
      );

      return;
    } catch {
      const demoUser = demoUsers.find(
        (item) =>
          item.username === normalizedUsername &&
          item.password === credentials.password
      );

      if (!demoUser) {
        throw new Error(
          'Usuario o contraseña incorrectos.'
        );
      }

      const { password, ...safeUser } = demoUser;

      setUser(safeUser);

      setActive(
        safeUser.role === 'Vendedora'
          ? 'pos'
          : 'dashboard'
      );
    }
  };

  if (!user) {
    return <Login onLogin={login} />;
  }

  const saveProduct = async (product) => {
    if (product.id) {
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? product
            : item
        )
      );

      if (online) {
        await api.updateProduct(
          product.id,
          product
        );
      }

      return;
    }

    const localProduct = {
      ...product,
      id: createId(),
    };

    setProducts((current) => [
      localProduct,
      ...current,
    ]);

    if (online) {
      const response =
        await api.createProduct(product);

      setProducts((current) =>
        current.map((item) =>
          item.id === localProduct.id
            ? response.data
            : item
        )
      );
    }
  };

  const saveCatalog = async (type, item) => {
    const setter =
      type === 'category'
        ? setCategories
        : setBrands;

    const create =
      type === 'category'
        ? api.createCategory
        : api.createBrand;

    const update =
      type === 'category'
        ? api.updateCategory
        : api.updateBrand;

    if (item.id) {
      setter((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? item
            : currentItem
        )
      );

      if (online) {
        await update(item.id, item);
      }

      return;
    }

    const localItem = {
      ...item,
      id: createId(),
      active: true,
    };

    /*
     * Al guardar una categoría o marca, se actualiza
     * inmediatamente su estado correspondiente.
     * ProductsView recibe esos estados y muestra las
     * nuevas opciones sin recargar la página.
     */
    setter((current) => [
      localItem,
      ...current,
    ]);

    if (online) {
      const response = await create(item);

      setter((current) =>
        current.map((currentItem) =>
          currentItem.id === localItem.id
            ? response.data
            : currentItem
        )
      );
    }
  };

  const checkout = async (payload) => {
    let sale;

    if (online) {
      const response =
        await api.createSale(payload);

      sale = response.data;

      const productData =
        await api.products();

      setProducts(productData.data);
    } else {
      const detail = payload.items.map(
        (item) => ({
          ...item,
          product: products.find(
            (product) =>
              product.id === item.productId
          ),
        })
      );

      sale = {
        id: createId(),

        number: `V-${String(
          sales.length + 1
        ).padStart(4, '0')}`,

        date: new Date().toISOString(),

        total: detail.reduce(
          (sum, item) =>
            sum +
            item.product.salePrice *
              item.quantity,
          0
        ),

        cost: detail.reduce(
          (sum, item) =>
            sum +
            (item.product.unitCost ??
              item.product.purchasePrice) *
              item.quantity,
          0
        ),

        paymentMethod:
          payload.paymentMethod,

        items: detail.reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        ),
      };

      setProducts((current) =>
        current.map((product) => {
          const sold = payload.items.find(
            (item) =>
              item.productId === product.id
          );

          if (!sold) {
            return product;
          }

          return {
            ...product,
            stock:
              product.stock -
              sold.quantity,
          };
        })
      );
    }

    setSales((current) => [
      ...current,
      sale,
    ]);

    return sale;
  };

  const adjust = async (payload) => {
    setProducts((current) =>
      current.map((product) => {
        if (
          product.id !== payload.productId
        ) {
          return product;
        }

        const movement =
          payload.type === 'entrada'
            ? payload.quantity
            : -payload.quantity;

        return {
          ...product,
          stock:
            product.stock + movement,
        };
      })
    );

    if (online) {
      await api.adjustStock(payload);

      const response =
        await api.products();

      setProducts(response.data);
    }
  };

  const saveExpense = async (expense) => {
    let created = {
      ...expense,
      id: createId(),
    };

    if (online) {
      const response =
        await api.createExpense(expense);

      created = response.data;
    }

    setExpenses((current) => [
      created,
      ...current,
    ]);
  };

  const savePurchase = async (purchase) => {
    let created = {
      ...purchase,
      id: createId(),

      number: `C-${String(
        purchases.length + 1
      ).padStart(4, '0')}`,
    };

    if (online) {
      const response =
        await api.createPurchase(purchase);

      created = response.data;
    }

    setPurchases((current) => [
      created,
      ...current,
    ]);
  };

  const views = {
    dashboard: (
      <DashboardView
        products={products}
        sales={sales}
        expenses={expenses}
        onNavigate={setActive}
      />
    ),

    pos: (
      <PosView
        products={products}
        onCheckout={checkout}
      />
    ),

    products: (
     <ProductsView
    products={products}
    categories={categories}
    brands={brands}
    onSave={saveProduct}
      />
    ),

    categories: (
      <CategoriesView
        categories={categories}
        onSave={saveCatalog}
      />
    ),

    brands: (
      <BrandsView
        brands={brands}
        onSave={saveCatalog}
      />
    ),

    inventory: (
  <InventoryView
    products={products}
    categories={categories}
    brands={brands}
    onAdjust={adjust}
  />
),

    purchases: (
      <PurchasesView
        purchases={purchases}
        onSave={savePurchase}
      />
    ),

    expenses: (
      <ExpensesView
        expenses={expenses}
        onSave={saveExpense}
      />
    ),

    reports: (
      <ReportsView
        sales={sales}
        expenses={expenses}
      />
    ),

    settings: <SettingsView />,
  };

  const logout = () => {
    setUser(null);
    setActive('dashboard');
  };

  return (
    <AppShell
      active={active}
      setActive={setActive}
      online={online}
      user={user}
      onLogout={logout}
    >
      {views[active]}
    </AppShell>
  );
}