const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

let memoryToken = "";

export function setAuthToken(token) {
  memoryToken = token || "";

  if (typeof window !== "undefined") {
    if (memoryToken) {
      localStorage.setItem("minimarket_token", memoryToken);
    } else {
      localStorage.removeItem("minimarket_token");
    }
  }
}

export function getAuthToken() {
  if (memoryToken) {
    return memoryToken;
  }

  if (typeof window !== "undefined") {
    memoryToken = localStorage.getItem("minimarket_token") || "";
  }

  return memoryToken;
}

async function request(path, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken("");
    }

    throw new Error(data.message || "No se pudo completar la solicitud");
  }

  return data;
}

export const api = {
  health: () => request("/health"),

  login: (credentials) =>
    request("/auth/login", {
      method: "POST",

      body: JSON.stringify(credentials),
    }),

  me: () => request("/auth/me"),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  dashboard: () => request("/dashboard"),

  products: () => request("/products"),

  createProduct: (product) =>
    request("/products", {
      method: "POST",

      body: JSON.stringify(product),
    }),

  updateProduct: (id, product) =>
    request(`/products/${id}`, {
      method: "PUT",

      body: JSON.stringify(product),
    }),

  findBarcode: (barcode) => request(`/products/barcode/${barcode}`),

  categories: () => request("/catalogs/categories"),

  createCategory: (item) =>
    request("/catalogs/categories", {
      method: "POST",

      body: JSON.stringify(item),
    }),

  updateCategory: (id, item) =>
    request(`/catalogs/categories/${id}`, {
      method: "PUT",

      body: JSON.stringify(item),
    }),

  brands: () => request("/catalogs/brands"),

  createBrand: (item) =>
    request("/catalogs/brands", {
      method: "POST",

      body: JSON.stringify(item),
    }),

  updateBrand: (id, item) =>
    request(`/catalogs/brands/${id}`, {
      method: "PUT",

      body: JSON.stringify(item),
    }),

  sales: () => request("/sales"),

  createSale: (sale) =>
    request("/sales", {
      method: "POST",

      body: JSON.stringify(sale),
    }),

  voidSale: (id, reason) =>
    request(`/sales/${id}/void`, {
      method: "POST",

      body: JSON.stringify({
        reason,
      }),
    }),

  adjustStock: (payload) =>
    request("/inventory/adjust", {
      method: "POST",

      body: JSON.stringify(payload),
    }),

  movements: () => request("/inventory/movements"),

  expiring: () => request("/inventory/expiring"),

  purchases: () => request("/purchases"),

  createPurchase: (purchase) =>
    request("/purchases", {
      method: "POST",

      body: JSON.stringify(purchase),
    }),

  suppliers: () => request("/purchases/suppliers"),

  createSupplier: (supplier) =>
    request("/purchases/suppliers", {
      method: "POST",

      body: JSON.stringify(supplier),
    }),

  updateSupplier: (id, supplier) =>
    request(`/purchases/suppliers/${id}`, {
      method: "PUT",

      body: JSON.stringify(supplier),
    }),

  expenses: () => request("/expenses"),

  createExpense: (expense) =>
    request("/expenses", {
      method: "POST",

      body: JSON.stringify(expense),
    }),

  voidExpense: (id, reason) =>
    request(`/expenses/${id}/void`, {
      method: "POST",

      body: JSON.stringify({
        reason,
      }),
    }),

  report: (period = "weekly") =>
    request(`/reports/summary?period=${encodeURIComponent(period)}`),

  cash: () => request("/cash"),

  openCash: (openingAmount) =>
    request("/cash/open", {
      method: "POST",

      body: JSON.stringify({
        openingAmount,
      }),
    }),

  closeCash: (closingAmount) =>
    request("/cash/close", {
      method: "POST",

      body: JSON.stringify({
        closingAmount,
      }),
    }),

  createCashMovement: (movement) =>
    request("/cash/movements", {
      method: "POST",

      body: JSON.stringify(movement),
    }),
};
