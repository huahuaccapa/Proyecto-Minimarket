"use client";

import { useEffect, useState } from "react";

import Login from "../components/Login";
import AppShell from "../components/AppShell";

import DashboardView from "../views/DashboardView";
import PosView from "../views/PosView";
import CashView from "../views/CashView";
import ProductsView from "../views/ProductsView";
import CategoriesView from "../views/CategoriesView";
import BrandsView from "../views/BrandsView";
import InventoryView from "../views/InventoryView";
import PurchasesView from "../views/PurchasesView";
import ExpensesView from "../views/ExpensesView";
import ReportsView from "../views/ReportsView";
import SettingsView from "../views/SettingsView";

import { api, getAuthToken, setAuthToken } from "../lib/api";

export default function Home() {
  const [user, setUser] = useState(null);

  const [active, setActive] = useState("dashboard");

  const [online, setOnline] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [brands, setBrands] = useState([]);

  const [sales, setSales] = useState([]);

  const [expenses, setExpenses] = useState([]);

  const [purchases, setPurchases] = useState([]);

  const [suppliers, setSuppliers] = useState([]);

  const [cash, setCash] = useState({
    isOpen: false,
    balance: 0,
    movements: [],
  });

  const loadData = async (currentUser) => {
    const common = await Promise.all([
      api.products(),
      api.categories(),
      api.brands(),
      api.sales(),
      api.cash(),
    ]);

    setProducts(common[0].data);

    setCategories(common[1].data);

    setBrands(common[2].data);

    setSales(common[3].data);

    setCash(common[4].data);

    if (currentUser.role === "Administrador") {
      const admin = await Promise.all([
        api.expenses(),
        api.purchases(),
        api.suppliers(),
      ]);

      setExpenses(admin[0].data);

      setPurchases(admin[1].data);

      setSuppliers(admin[2].data);
    }

    setOnline(true);
  };

  useEffect(() => {
    const restore = async () => {
      try {
        await api.health();

        setOnline(true);

        if (!getAuthToken()) {
          return;
        }

        const me = await api.me();

        setUser(me.data);

        setActive(me.data.role === "Vendedora" ? "pos" : "dashboard");

        await loadData(me.data);
      } catch {
        setAuthToken("");

        setUser(null);

        setOnline(false);
      } finally {
        setCheckingSession(false);
      }
    };

    restore();
  }, []);

  const login = async (credentials) => {
    const result = await api.login({
      username: credentials.username.trim().toLowerCase(),

      password: credentials.password,
    });

    setAuthToken(result.data.token);

    const loggedUser = result.data.user;

    setUser(loggedUser);

    setActive(loggedUser.role === "Vendedora" ? "pos" : "dashboard");

    try {
      await loadData(loggedUser);
    } catch (error) {
      setAuthToken("");

      setUser(null);

      throw error;
    }
  };

  const refreshProducts = async () => {
    const result = await api.products();

    setProducts(result.data);
  };

  const refreshSales = async () => {
    const result = await api.sales();

    setSales(result.data);
  };

  const refreshCash = async () => {
    const result = await api.cash();

    setCash(result.data);
  };

  const refreshPurchases = async () => {
    const result = await api.purchases();

    setPurchases(result.data);
  };

  const refreshExpenses = async () => {
    const result = await api.expenses();

    setExpenses(result.data);
  };

  const saveProduct = async (product) => {
    const result = product.id
      ? await api.updateProduct(product.id, product)
      : await api.createProduct(product);

    await refreshProducts();

    return result.data;
  };

  const saveCatalog = async (type, item) => {
    const create = type === "category" ? api.createCategory : api.createBrand;

    const update = type === "category" ? api.updateCategory : api.updateBrand;

    const result = item.id ? await update(item.id, item) : await create(item);

    if (type === "category") {
      const data = await api.categories();

      setCategories(data.data);
    } else {
      const data = await api.brands();

      setBrands(data.data);
    }

    return result.data;
  };

  const checkout = async (payload) => {
    const result = await api.createSale(payload);

    await Promise.all([refreshProducts(), refreshSales(), refreshCash()]);

    return result.data;
  };

  const adjust = async (payload) => {
    await api.adjustStock(payload);

    await refreshProducts();
  };

  const saveExpense = async (expense) => {
    const result = await api.createExpense(expense);

    await Promise.all([refreshExpenses(), refreshCash()]);

    return result.data;
  };

  const savePurchase = async (purchase) => {
    const result = await api.createPurchase(purchase);

    await Promise.all([refreshPurchases(), refreshProducts(), refreshCash()]);

    return result.data;
  };

  const saveSupplier = async (supplier) => {
    const result = supplier.id
      ? await api.updateSupplier(supplier.id, supplier)
      : await api.createSupplier(supplier);

    const data = await api.suppliers();

    setSuppliers(data.data);

    return result.data;
  };

  const saveCashMovement = async (movement) => {
    const result = await api.createCashMovement(movement);

    await refreshCash();

    return result.data;
  };

  const openCash = async (amount) => {
    await api.openCash(amount);

    await refreshCash();
  };

  const closeCash = async (amount) => {
    await api.closeCash(amount);

    await refreshCash();
  };

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center font-bold">
        Cargando sistema…
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  const views = {
    dashboard: <DashboardView onNavigate={setActive} />,

    pos: (
      <PosView
        products={products}
        categories={categories}
        cash={cash}
        onCheckout={checkout}
      />
    ),

    cash: (
      <CashView
        cash={cash}
        onSaveMovement={saveCashMovement}
        onOpen={openCash}
        onClose={closeCash}
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

    categories: <CategoriesView categories={categories} onSave={saveCatalog} />,

    brands: <BrandsView brands={brands} onSave={saveCatalog} />,

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
        suppliers={suppliers}
        products={products}
        onSavePurchase={savePurchase}
        onSaveSupplier={saveSupplier}
      />
    ),

    expenses: <ExpensesView expenses={expenses} onSave={saveExpense} />,

    reports: <ReportsView />,

    settings: <SettingsView />,
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Si el servidor ya no responde,
      // cerramos igualmente la sesión local.
    }

    setAuthToken("");

    setUser(null);

    setActive("dashboard");

    setProducts([]);

    setCategories([]);

    setBrands([]);

    setSales([]);

    setExpenses([]);

    setPurchases([]);

    setSuppliers([]);

    setCash({
      isOpen: false,
      balance: 0,
      movements: [],
    });
  };

  return (
    <AppShell
      active={active}
      setActive={setActive}
      online={online}
      user={user}
      onLogout={logout}
    >
      {views[active] || views.dashboard}
    </AppShell>
  );
}
