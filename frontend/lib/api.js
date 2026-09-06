const API_URL =
  "/backend-api";

let memoryToken =
  "";

/*
 * ==========================================
 * TOKEN
 * ==========================================
 */

export function setAuthToken(
  token,
) {
  memoryToken =
    token ||
    "";

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  if (
    memoryToken
  ) {
    localStorage.setItem(
      "minimarket_token",

      memoryToken,
    );
  } else {
    localStorage.removeItem(
      "minimarket_token",
    );
  }
}

export function getAuthToken() {
  if (
    memoryToken
  ) {
    return memoryToken;
  }

  if (
    typeof window !==
    "undefined"
  ) {
    memoryToken =
      localStorage.getItem(
        "minimarket_token",
      ) ||
      "";
  }

  return memoryToken;
}

/*
 * ==========================================
 * 401 GLOBAL
 * ==========================================
 */

function notifyUnauthorized(
  message,
) {
  setAuthToken(
    "",
  );

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "minimarket:unauthorized",

        {
          detail: {
            message:
              message ||
              "Tu sesión terminó. Inicia sesión nuevamente.",
          },
        },
      ),
    );
  }
}

/*
 * ==========================================
 * REQUEST
 * ==========================================
 */

async function request(
  path,
  options = {},
) {
  const token =
    getAuthToken();

  let response;

  try {
    response =
      await fetch(
        `${API_URL}${path}`,

        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),

            ...options.headers,
          },
        },
      );
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor",
    );
  }

  const data =
    await response
      .json()
      .catch(
        () => ({}),
      );

  if (
    !response.ok
  ) {
    const message =
      data.message ||
      "No se pudo completar la solicitud";

    if (
      response.status ===
        401 &&
      path !==
        "/auth/login"
    ) {
      notifyUnauthorized(
        message,
      );
    }

    throw new Error(
      message,
    );
  }

  return data;
}

export const api = {
  health:
    () =>
      request(
        "/health",
      ),

  login:
    (
      credentials,
    ) =>
      request(
        "/auth/login",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              credentials,
            ),
        },
      ),

  me:
    () =>
      request(
        "/auth/me",
      ),

  logout:
    () =>
      request(
        "/auth/logout",

        {
          method:
            "POST",
        },
      ),

  dashboard:
    () =>
      request(
        "/dashboard",
      ),

  /*
   * PRODUCTOS
   */
  products:
    () =>
      request(
        "/products",
      ),

  createProduct:
    (
      product,
    ) =>
      request(
        "/products",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              product,
            ),
        },
      ),

  updateProduct:
    (
      id,
      product,
    ) =>
      request(
        `/products/${id}`,

        {
          method:
            "PUT",

          body:
            JSON.stringify(
              product,
            ),
        },
      ),

  findBarcode:
    (
      barcode,
    ) =>
      request(
        `/products/barcode/${barcode}`,
      ),

  /*
   * CATEGORÍAS
   */
  categories:
    () =>
      request(
        "/catalogs/categories",
      ),

  createCategory:
    (
      item,
    ) =>
      request(
        "/catalogs/categories",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              item,
            ),
        },
      ),

  updateCategory:
    (
      id,
      item,
    ) =>
      request(
        `/catalogs/categories/${id}`,

        {
          method:
            "PUT",

          body:
            JSON.stringify(
              item,
            ),
        },
      ),

  /*
   * MARCAS
   */
  brands:
    () =>
      request(
        "/catalogs/brands",
      ),

  createBrand:
    (
      item,
    ) =>
      request(
        "/catalogs/brands",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              item,
            ),
        },
      ),

  updateBrand:
    (
      id,
      item,
    ) =>
      request(
        `/catalogs/brands/${id}`,

        {
          method:
            "PUT",

          body:
            JSON.stringify(
              item,
            ),
        },
      ),

  /*
   * VENTAS
   */
  sales:
    () =>
      request(
        "/sales",
      ),

  createSale:
    (
      sale,
    ) =>
      request(
        "/sales",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              sale,
            ),
        },
      ),

  voidSale:
    (
      id,
      reason,
    ) =>
      request(
        `/sales/${id}/void`,

        {
          method:
            "POST",

          body:
            JSON.stringify({
              reason,
            }),
        },
      ),

  /*
   * INVENTARIO
   */
  adjustStock:
    (
      payload,
    ) =>
      request(
        "/inventory/adjust",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),

  movements:
    () =>
      request(
        "/inventory/movements",
      ),

  expiring:
    () =>
      request(
        "/inventory/expiring",
      ),

  /*
   * COMPRAS
   */
  purchases:
    () =>
      request(
        "/purchases",
      ),

  createPurchase:
    (
      purchase,
    ) =>
      request(
        "/purchases",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              purchase,
            ),
        },
      ),

  voidPurchase:
    (
      id,
      reason,
    ) =>
      request(
        `/purchases/${id}/void`,

        {
          method:
            "POST",

          body:
            JSON.stringify({
              reason,
            }),
        },
      ),

  suppliers:
    () =>
      request(
        "/purchases/suppliers",
      ),

  createSupplier:
    (
      supplier,
    ) =>
      request(
        "/purchases/suppliers",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              supplier,
            ),
        },
      ),

  updateSupplier:
    (
      id,
      supplier,
    ) =>
      request(
        `/purchases/suppliers/${id}`,

        {
          method:
            "PUT",

          body:
            JSON.stringify(
              supplier,
            ),
        },
      ),

  /*
   * GASTOS
   */
  expenses:
    () =>
      request(
        "/expenses",
      ),

  createExpense:
    (
      expense,
    ) =>
      request(
        "/expenses",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              expense,
            ),
        },
      ),

  voidExpense:
    (
      id,
      reason,
    ) =>
      request(
        `/expenses/${id}/void`,

        {
          method:
            "POST",

          body:
            JSON.stringify({
              reason,
            }),
        },
      ),

  /*
   * CLIENTES
   */
  customers:
    () =>
      request(
        "/customers",
      ),

  customer:
    (
      id,
    ) =>
      request(
        `/customers/${id}`,
      ),

  createCustomer:
    (
      customer,
    ) =>
      request(
        "/customers",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              customer,
            ),
        },
      ),

  updateCustomer:
    (
      id,
      customer,
    ) =>
      request(
        `/customers/${id}`,

        {
          method:
            "PUT",

          body:
            JSON.stringify(
              customer,
            ),
        },
      ),

  deleteCustomer:
    (
      id,
    ) =>
      request(
        `/customers/${id}`,

        {
          method:
            "DELETE",
        },
      ),

  addCustomerCredit:
    (
      customerId,
      payload,
    ) =>
      request(
        `/customers/${customerId}/credits`,

        {
          method:
            "POST",

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),

  updateCustomerCredit:
    (
      customerId,
      creditId,
      payload,
    ) =>
      request(
        `/customers/${customerId}/credits/${creditId}`,

        {
          method:
            "PUT",

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),

  deleteCustomerCredit:
    (
      customerId,
      creditId,
      reason =
        "Registro eliminado",
    ) =>
      request(
        `/customers/${customerId}/credits/${creditId}`,

        {
          method:
            "DELETE",

          body:
            JSON.stringify({
              reason,
            }),
        },
      ),

  addCustomerPayment:
    (
      customerId,
      payload,
    ) =>
      request(
        `/customers/${customerId}/payments`,

        {
          method:
            "POST",

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),

  /*
   * REPORTES
   */
  report:
    (
      period =
        "weekly",
    ) =>
      request(
        `/reports/summary?period=${encodeURIComponent(
          period,
        )}`,
      ),

  /*
   * CAJA
   */
  cash:
    () =>
      request(
        "/cash",
      ),

  openCash:
    (
      openingAmount,
    ) =>
      request(
        "/cash/open",

        {
          method:
            "POST",

          body:
            JSON.stringify({
              openingAmount,
            }),
        },
      ),

  closeCash:
    (
      closingAmount,
    ) =>
      request(
        "/cash/close",

        {
          method:
            "POST",

          body:
            JSON.stringify({
              closingAmount,
            }),
        },
      ),

  createCashMovement:
    (
      movement,
    ) =>
      request(
        "/cash/movements",

        {
          method:
            "POST",

          body:
            JSON.stringify(
              movement,
            ),
        },
      ),
};