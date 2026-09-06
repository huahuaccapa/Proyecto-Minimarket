"use client";

import {
  useEffect,
  useState,
} from "react";

import Login from "../components/Login";

import AppShell from "../components/AppShell";

import DashboardView from "../views/DashboardView";

import PosView from "../views/PosView";

import ClientsView from "../views/ClientsView";

import CashView from "../views/CashView";

import ProductsView from "../views/ProductsView";

import CategoriesView from "../views/CategoriesView";

import BrandsView from "../views/BrandsView";

import InventoryView from "../views/InventoryView";

import PurchasesView from "../views/PurchasesView";

import ExpensesView from "../views/ExpensesView";

import ReportsView from "../views/ReportsView";

import SettingsView from "../views/SettingsView";

import {
  api,
  getAuthToken,
  setAuthToken,
} from "../lib/api";

export default function Home() {
  const [
    user,
    setUser,
  ] =
    useState(
      null,
    );

  const [
    active,
    setActive,
  ] =
    useState(
      "dashboard",
    );

  const [
    online,
    setOnline,
  ] =
    useState(
      false,
    );

  const [
    checkingSession,
    setCheckingSession,
  ] =
    useState(
      true,
    );

  const [
    sessionMessage,
    setSessionMessage,
  ] =
    useState(
      "",
    );

  const [
    products,
    setProducts,
  ] =
    useState(
      [],
    );

  const [
    categories,
    setCategories,
  ] =
    useState(
      [],
    );

  const [
    brands,
    setBrands,
  ] =
    useState(
      [],
    );

  const [
    sales,
    setSales,
  ] =
    useState(
      [],
    );

  const [
    customers,
    setCustomers,
  ] =
    useState(
      [],
    );

  const [
    expenses,
    setExpenses,
  ] =
    useState(
      [],
    );

  const [
    purchases,
    setPurchases,
  ] =
    useState(
      [],
    );

  const [
    suppliers,
    setSuppliers,
  ] =
    useState(
      [],
    );

  const [
    cash,
    setCash,
  ] =
    useState({
      isOpen:
        false,

      balance:
        0,

      movements:
        [],
    });

  /*
   * ==========================================
   * LIMPIAR ESTADO LOCAL
   * ==========================================
   */

  const clearApplicationState =
    () => {
      setProducts(
        [],
      );

      setCategories(
        [],
      );

      setBrands(
        [],
      );

      setSales(
        [],
      );

      setCustomers(
        [],
      );

      setExpenses(
        [],
      );

      setPurchases(
        [],
      );

      setSuppliers(
        [],
      );

      setCash({
        isOpen:
          false,

        balance:
          0,

        movements:
          [],
      });
    };

  /*
   * ==========================================
   * DETECTAR 401 GLOBAL
   * ==========================================
   */

  useEffect(
    () => {
      const unauthorized =
        (
          event,
        ) => {
          setAuthToken(
            "",
          );

          setUser(
            null,
          );

          setActive(
            "dashboard",
          );

          clearApplicationState();

          setSessionMessage(
            event.detail
              ?.message ||
              "Tu sesión terminó. Inicia sesión nuevamente.",
          );
        };

      window.addEventListener(
        "minimarket:unauthorized",

        unauthorized,
      );

      return () => {
        window.removeEventListener(
          "minimarket:unauthorized",

          unauthorized,
        );
      };
    },
    [],
  );

  /*
   * ==========================================
   * CARGAR DATOS
   * ==========================================
   */

  const loadData =
    async (
      currentUser,
    ) => {
      const common =
        await Promise.all([
          api.products(),
          api.categories(),
          api.brands(),
          api.sales(),
          api.cash(),
          api.customers(),
        ]);

      setProducts(
        common[
          0
        ].data,
      );

      setCategories(
        common[
          1
        ].data,
      );

      setBrands(
        common[
          2
        ].data,
      );

      setSales(
        common[
          3
        ].data,
      );

      setCash(
        common[
          4
        ].data,
      );

      setCustomers(
        common[
          5
        ].data,
      );

      if (
        currentUser.role ===
        "Administrador"
      ) {
        const admin =
          await Promise.all([
            api.expenses(),
            api.purchases(),
            api.suppliers(),
          ]);

        setExpenses(
          admin[
            0
          ].data,
        );

        setPurchases(
          admin[
            1
          ].data,
        );

        setSuppliers(
          admin[
            2
          ].data,
        );
      }

      setOnline(
        true,
      );
    };

  /*
   * ==========================================
   * RESTAURAR SESIÓN
   * ==========================================
   */

  useEffect(
    () => {
      const restore =
        async () => {
          try {
            await api.health();

            setOnline(
              true,
            );

            const token =
              getAuthToken();

            if (
              !token
            ) {
              return;
            }

            const me =
              await api.me();

            setUser(
              me.data,
            );

            setActive(
              me.data.role ===
                "Vendedora"
                ? "pos"
                : "dashboard",
            );

            await loadData(
              me.data,
            );
          } catch (
            error
          ) {
            setAuthToken(
              "",
            );

            setUser(
              null,
            );

            clearApplicationState();

            /*
             * Si health también falla,
             * significa que backend
             * está apagado.
             */
            try {
              await api.health();

              setOnline(
                true,
              );
            } catch {
              setOnline(
                false,
              );
            }
          } finally {
            setCheckingSession(
              false,
            );
          }
        };

      restore();
    },
    [],
  );

  /*
   * ==========================================
   * LOGIN
   * ==========================================
   */

  const login =
    async (
      credentials,
    ) => {
      setSessionMessage(
        "",
      );

      const result =
        await api.login({
          username:
            credentials.username
              .trim()
              .toLowerCase(),

          password:
            credentials.password,
        });

      setAuthToken(
        result.data
          .token,
      );

      const loggedUser =
        result.data
          .user;

      try {
        /*
         * Primero comprobamos
         * que el token recién
         * creado realmente
         * funciona.
         */
        const me =
          await api.me();

        setUser(
          me.data ||
            loggedUser,
        );

        setActive(
          loggedUser.role ===
            "Vendedora"
            ? "pos"
            : "dashboard",
        );

        await loadData(
          loggedUser,
        );

        setOnline(
          true,
        );
      } catch (
        error
      ) {
        setAuthToken(
          "",
        );

        setUser(
          null,
        );

        clearApplicationState();

        throw error;
      }
    };

  /*
   * ==========================================
   * REFRESH
   * ==========================================
   */

  const refreshProducts =
    async () => {
      const result =
        await api.products();

      setProducts(
        result.data,
      );
    };

  const refreshSales =
    async () => {
      const result =
        await api.sales();

      setSales(
        result.data,
      );
    };

  const refreshCash =
    async () => {
      const result =
        await api.cash();

      setCash(
        result.data,
      );
    };

  const refreshPurchases =
    async () => {
      const result =
        await api.purchases();

      setPurchases(
        result.data,
      );
    };

  const refreshExpenses =
    async () => {
      const result =
        await api.expenses();

      setExpenses(
        result.data,
      );
    };

  const refreshCustomers =
    async () => {
      const result =
        await api.customers();

      setCustomers(
        result.data,
      );
    };

  /*
   * ==========================================
   * PRODUCTOS
   * ==========================================
   */

  const saveProduct =
    async (
      product,
    ) => {
      const result =
        product.id
          ? await api.updateProduct(
              product.id,
              product,
            )
          : await api.createProduct(
              product,
            );

      await refreshProducts();

      return result.data;
    };

  /*
   * ==========================================
   * CATÁLOGOS
   * ==========================================
   */

  const saveCatalog =
    async (
      type,
      item,
    ) => {
      const create =
        type ===
        "category"
          ? api.createCategory
          : api.createBrand;

      const update =
        type ===
        "category"
          ? api.updateCategory
          : api.updateBrand;

      const result =
        item.id
          ? await update(
              item.id,
              item,
            )
          : await create(
              item,
            );

      if (
        type ===
        "category"
      ) {
        const data =
          await api.categories();

        setCategories(
          data.data,
        );
      } else {
        const data =
          await api.brands();

        setBrands(
          data.data,
        );
      }

      return result.data;
    };

  /*
   * ==========================================
   * VENTAS
   * ==========================================
   */

  const checkout =
    async (
      payload,
    ) => {
      const result =
        await api.createSale(
          payload,
        );

      await Promise.all([
        refreshProducts(),
        refreshSales(),
        refreshCash(),
      ]);

      return result.data;
    };

  /*
   * ==========================================
   * INVENTARIO
   * ==========================================
   */

  const adjust =
    async (
      payload,
    ) => {
      await api.adjustStock(
        payload,
      );

      await refreshProducts();
    };

  /*
   * ==========================================
   * GASTOS
   * ==========================================
   */

  const saveExpense =
    async (
      expense,
    ) => {
      const result =
        await api.createExpense(
          expense,
        );

      await Promise.all([
        refreshExpenses(),
        refreshCash(),
      ]);

      return result.data;
    };

  /*
   * ==========================================
   * COMPRAS
   * ==========================================
   */

  const savePurchase =
    async (
      purchase,
    ) => {
      const result =
        await api.createPurchase(
          purchase,
        );

      await Promise.all([
        refreshPurchases(),
        refreshProducts(),
        refreshCash(),
      ]);

      return result.data;
    };

  const voidPurchase =
    async (
      id,
      reason,
    ) => {
      const result =
        await api.voidPurchase(
          id,
          reason,
        );

      await Promise.all([
        refreshPurchases(),
        refreshProducts(),
        refreshCash(),
      ]);

      return result.data;
    };

  /*
   * ==========================================
   * PROVEEDORES
   * ==========================================
   */

  const saveSupplier =
    async (
      supplier,
    ) => {
      const result =
        supplier.id
          ? await api.updateSupplier(
              supplier.id,
              supplier,
            )
          : await api.createSupplier(
              supplier,
            );

      const data =
        await api.suppliers();

      setSuppliers(
        data.data,
      );

      return result.data;
    };

  /*
   * ==========================================
   * CAJA
   * ==========================================
   */

  const saveCashMovement =
    async (
      movement,
    ) => {
      const result =
        await api.createCashMovement(
          movement,
        );

      await refreshCash();

      return result.data;
    };

  const openCash =
    async (
      amount,
    ) => {
      await api.openCash(
        amount,
      );

      await refreshCash();
    };

  const closeCash =
    async (
      amount,
    ) => {
      await api.closeCash(
        amount,
      );

      await refreshCash();
    };

  /*
   * ==========================================
   * CLIENTES
   * ==========================================
   */

  const loadCustomer =
    async (
      id,
    ) =>
      (
        await api.customer(
          id,
        )
      ).data;

  const createCustomer =
    async (
      payload,
    ) => {
      const result =
        await api.createCustomer(
          payload,
        );

      await refreshCustomers();

      return result.data;
    };

  const updateCustomer =
    async (
      id,
      payload,
    ) => {
      const result =
        await api.updateCustomer(
          id,
          payload,
        );

      await refreshCustomers();

      return result.data;
    };

  const deleteCustomer =
    async (
      id,
    ) => {
      const result =
        await api.deleteCustomer(
          id,
        );

      await refreshCustomers();

      return result.data;
    };

  const addCustomerCredit =
    async (
      customerId,
      payload,
    ) => {
      const result =
        await api.addCustomerCredit(
          customerId,
          payload,
        );

      await Promise.all([
        refreshCustomers(),
        refreshProducts(),
      ]);

      return result.data;
    };

  const updateCustomerCredit =
    async (
      customerId,
      creditId,
      payload,
    ) => {
      const result =
        await api.updateCustomerCredit(
          customerId,
          creditId,
          payload,
        );

      await Promise.all([
        refreshCustomers(),
        refreshProducts(),
      ]);

      return result.data;
    };

  const deleteCustomerCredit =
    async (
      customerId,
      creditId,
    ) => {
      const result =
        await api.deleteCustomerCredit(
          customerId,
          creditId,
        );

      await Promise.all([
        refreshCustomers(),
        refreshProducts(),
      ]);

      return result.data;
    };

  const addCustomerPayment =
    async (
      customerId,
      payload,
    ) => {
      const result =
        await api.addCustomerPayment(
          customerId,
          payload,
        );

      await Promise.all([
        refreshCustomers(),
        refreshCash(),
      ]);

      return result.data;
    };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (
    checkingSession
  ) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f5ee]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-black/10 border-t-forest" />

          <p className="font-bold text-black/50">
            Cargando sistema…
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * LOGIN
   * ==========================================
   */

  if (
    !user
  ) {
    return (
      <>
        {sessionMessage && (
          <div className="fixed left-1/2 top-5 z-[100] -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-xl">
            {sessionMessage}
          </div>
        )}

        <Login
          onLogin={
            login
          }
        />
      </>
    );
  }

  /*
   * ==========================================
   * VISTAS
   * ==========================================
   */

  const views = {
    dashboard: (
      <DashboardView
        onNavigate={
          setActive
        }
      />
    ),

    pos: (
      <PosView
        products={
          products
        }

        categories={
          categories
        }

        cash={
          cash
        }

        onCheckout={
          checkout
        }
      />
    ),

    customers: (
      <ClientsView
        customers={
          customers
        }

        products={
          products
        }

        cash={
          cash
        }

        onCreateCustomer={
          createCustomer
        }

        onUpdateCustomer={
          updateCustomer
        }

        onDeleteCustomer={
          deleteCustomer
        }

        onLoadCustomer={
          loadCustomer
        }

        onAddCredit={
          addCustomerCredit
        }

        onUpdateCredit={
          updateCustomerCredit
        }

        onDeleteCredit={
          deleteCustomerCredit
        }

        onAddPayment={
          addCustomerPayment
        }
      />
    ),

    cash: (
      <CashView
        cash={
          cash
        }

        onSaveMovement={
          saveCashMovement
        }

        onOpen={
          openCash
        }

        onClose={
          closeCash
        }
      />
    ),

    products: (
      <ProductsView
        products={
          products
        }

        categories={
          categories
        }

        brands={
          brands
        }

        onSave={
          saveProduct
        }
      />
    ),

    categories: (
      <CategoriesView
        categories={
          categories
        }

        onSave={
          saveCatalog
        }
      />
    ),

    brands: (
      <BrandsView
        brands={
          brands
        }

        onSave={
          saveCatalog
        }
      />
    ),

    inventory: (
      <InventoryView
        products={
          products
        }

        categories={
          categories
        }

        brands={
          brands
        }

        onAdjust={
          adjust
        }
      />
    ),

    purchases: (
      <PurchasesView
        purchases={
          purchases
        }

        suppliers={
          suppliers
        }

        products={
          products
        }

        onSavePurchase={
          savePurchase
        }

        onVoidPurchase={
          voidPurchase
        }

        onSaveSupplier={
          saveSupplier
        }
      />
    ),

    expenses: (
      <ExpensesView
        expenses={
          expenses
        }

        onSave={
          saveExpense
        }
      />
    ),

    reports: (
      <ReportsView />
    ),

    settings: (
      <SettingsView />
    ),
  };

  /*
   * ==========================================
   * LOGOUT
   * ==========================================
   */

  const logout =
    async () => {
      try {
        await api.logout();
      } catch {
        /*
         * Incluso si el servidor
         * no responde, cerramos
         * localmente.
         */
      }

      setAuthToken(
        "",
      );

      setUser(
        null,
      );

      setActive(
        "dashboard",
      );

      setSessionMessage(
        "",
      );

      clearApplicationState();
    };

  /*
   * ==========================================
   * APP
   * ==========================================
   */

  return (
    <AppShell
      active={
        active
      }

      setActive={
        setActive
      }

      online={
        online
      }

      user={
        user
      }

      onLogout={
        logout
      }
    >
      {views[
        active
      ] ||
        views.dashboard}
    </AppShell>
  );
}