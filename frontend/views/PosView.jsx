'use client';

import {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertTriangle,
  Banknote,
  Camera,
  CheckCircle2,
  LockKeyhole,
  Minus,
  Plus,
  ScanBarcode,
  Search,
  Snowflake,
  Trash2,
  Wallet,
} from 'lucide-react';

import BarcodeScanner from '../components/BarcodeScanner';

import {
  EmptyState,
  PageTitle,
} from '../components/ui';

import {
  formatMoney,
} from '../data/mock';

const CHILLED_SURCHARGE =
  1;

const normalizeText = (
  value = '',
) =>
  String(
    value,
  )
    .normalize(
      'NFD',
    )
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .trim()
    .toLowerCase();

function isExpired(
  expirationDate,
) {
  if (
    !expirationDate
  ) {
    return false;
  }

  const expiration =
    new Date(
      `${expirationDate}T23:59:59-05:00`,
    );

  if (
    Number.isNaN(
      expiration.getTime(),
    )
  ) {
    return false;
  }

  return (
    expiration <
    new Date()
  );
}

export default function PosView({
  products = [],
  categories = [],
  cash,
  onCheckout,
}) {
  const [
    barcode,
    setBarcode,
  ] =
    useState(
      '',
    );

  const [
    cart,
    setCart,
  ] =
    useState(
      [],
    );

  const [
    received,
    setReceived,
  ] =
    useState(
      '',
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      '',
    );

  const [
    messageType,
    setMessageType,
  ] =
    useState(
      'success',
    );

  const [
    processing,
    setProcessing,
  ] =
    useState(
      false,
    );

  const [
    scannerOpen,
    setScannerOpen,
  ] =
    useState(
      false,
    );

  const inputRef =
    useRef(
      null,
    );

  const receivedRef =
    useRef(
      null,
    );

  const cashOpen =
    Boolean(
      cash?.isOpen,
    );

  /*
   * ==========================================
   * BEBIDAS
   * ==========================================
   */

  const beverageCategoryIds =
    useMemo(
      () =>
        new Set(
          categories
            .filter(
              (
                category,
              ) =>
                normalizeText(
                  category.name,
                ) ===
                'bebidas',
            )
            .map(
              (
                category,
              ) =>
                category.id,
            ),
        ),

      [
        categories,
      ],
    );

  const isBeverage = (
    product,
  ) =>
    beverageCategoryIds.has(
      product.categoryId,
    );

  /*
   * ==========================================
   * PRECIO
   * ==========================================
   */

  const unitPrice = (
    item,
  ) =>
    Number(
      item.salePrice ||
        0,
    ) +
    (
      item.isChilled
        ? CHILLED_SURCHARGE
        : 0
    );

  /*
   * ==========================================
   * TOTAL
   * ==========================================
   */

  const total =
    useMemo(
      () =>
        Number(
          cart
            .reduce(
              (
                sum,
                item,
              ) =>
                sum +
                unitPrice(
                  item,
                ) *
                  Number(
                    item.quantity ||
                      0,
                  ),

              0,
            )
            .toFixed(
              2,
            ),
        ),

      [
        cart,
      ],
    );

  const cartUnits =
    useMemo(
      () =>
        Number(
          cart
            .reduce(
              (
                sum,
                item,
              ) =>
                sum +
                Number(
                  item.quantity ||
                    0,
                ),

              0,
            )
            .toFixed(
              3,
            ),
        ),

      [
        cart,
      ],
    );

  const receivedAmount =
    Number(
      received ||
        0,
    );

  const change =
    Math.max(
      Number(
        (
          receivedAmount -
          total
        ).toFixed(
          2,
        ),
      ),

      0,
    );

  /*
   * ==========================================
   * MENSAJES
   * ==========================================
   */

  const showMessage = (
    text,
    type =
      'success',
  ) => {
    setMessage(
      text,
    );

    setMessageType(
      type,
    );
  };

  /*
   * ==========================================
   * VALIDAR PRODUCTO
   * ==========================================
   */

  const productValidationError =
    (
      product,
    ) => {
      if (
        !product
      ) {
        return 'Producto no registrado.';
      }

      if (
        product.active ===
        false
      ) {
        return `${product.name} está desactivado.`;
      }

      if (
        Number(
          product.stock,
        ) <=
        0
      ) {
        return `${product.name} no tiene stock disponible.`;
      }

      if (
        isExpired(
          product.expirationDate,
        )
      ) {
        return `${product.name} está vencido y no puede venderse.`;
      }

      return '';
    };

  /*
   * ==========================================
   * AGREGAR PRODUCTO
   * ==========================================
   */

  const addProduct = (
    product,
  ) => {
    if (
      !cashOpen
    ) {
      const text =
        'No puedes registrar ventas porque la caja está cerrada.';

      showMessage(
        text,
        'error',
      );

      return {
        ok:
          false,

        message:
          text,
      };
    }

    const validation =
      productValidationError(
        product,
      );

    if (
      validation
    ) {
      showMessage(
        validation,
        'error',
      );

      return {
        ok:
          false,

        message:
          validation,
      };
    }

    const step =
      product.saleUnit ===
      'kg'
        ? 0.25
        : 1;

    const existing =
      cart.find(
        (
          item,
        ) =>
          item.id ===
          product.id,
      );

    if (
      existing
    ) {
      const next =
        Number(
          (
            Number(
              existing.quantity,
            ) +
            step
          ).toFixed(
            3,
          ),
        );

      if (
        next >
        Number(
          product.stock,
        )
      ) {
        const text =
          `No hay más stock disponible de ${product.name}.`;

        showMessage(
          text,
          'error',
        );

        return {
          ok:
            false,

          message:
            text,
        };
      }

      setCart(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              product.id
                ? {
                    ...item,

                    quantity:
                      next,
                  }
                : item,
          ),
      );
    } else {
      setCart(
        (
          current,
        ) => [
          ...current,

          {
            ...product,

            quantity:
              Math.min(
                step,

                Number(
                  product.stock,
                ),
              ),

            isChilled:
              false,
          },
        ],
      );
    }

    setBarcode(
      '',
    );

    const text =
      `${product.name} agregado.`;

    showMessage(
      text,
    );

    return {
      ok:
        true,

      message:
        text,
    };
  };

  /*
   * ==========================================
   * BUSCAR POR CÓDIGO
   * ==========================================
   */

  const addByBarcode = (
    rawCode,
  ) => {
    const code =
      String(
        rawCode ||
          '',
      ).trim();

    if (
      !code
    ) {
      const text =
        'Ingresa o escanea un código de barras.';

      showMessage(
        text,
        'error',
      );

      return {
        ok:
          false,

        message:
          text,
      };
    }

    const product =
      products.find(
        (
          item,
        ) =>
          String(
            item.barcode ||
              '',
          ).trim() ===
          code,
      );

    if (
      !product
    ) {
      const text =
        `El código ${code} no está registrado.`;

      showMessage(
        text,
        'error',
      );

      return {
        ok:
          false,

        message:
          text,
      };
    }

    return addProduct(
      product,
    );
  };

  /*
   * ==========================================
   * CÓDIGO MANUAL / LECTOR USB
   * ==========================================
   */

  const scan = (
    event,
  ) => {
    event.preventDefault();

    addByBarcode(
      barcode,
    );

    window.setTimeout(
      () =>
        inputRef
          .current
          ?.focus(),
      50,
    );
  };

  /*
   * ==========================================
   * CÁMARA
   * ==========================================
   */

  const openScanner =
    () => {
      if (
        !cashOpen
      ) {
        showMessage(
          'Primero debes abrir la caja.',
          'error',
        );

        return;
      }

      setScannerOpen(
        true,
      );
    };

  const closeScanner =
    (
      goToPayment =
        false,
    ) => {
      setScannerOpen(
        false,
      );

      if (
        goToPayment
      ) {
        window.setTimeout(
          () => {
            receivedRef
              .current
              ?.scrollIntoView({
                behavior:
                  'smooth',

                block:
                  'center',
              });

            receivedRef
              .current
              ?.focus();
          },

          150,
        );
      } else {
        window.setTimeout(
          () =>
            inputRef
              .current
              ?.focus(),
          100,
        );
      }
    };

  /*
   * ==========================================
   * CANTIDAD
   * ==========================================
   */

  const changeQuantity = (
    id,
    direction,
  ) => {
    setCart(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) => {
            if (
              item.id !==
              id
            ) {
              return item;
            }

            const step =
              item.saleUnit ===
              'kg'
                ? 0.25
                : 1;

            const minimum =
              step;

            const candidate =
              Number(
                (
                  Number(
                    item.quantity,
                  ) +
                  direction *
                    step
                ).toFixed(
                  3,
                ),
              );

            const next =
              Math.max(
                minimum,

                Math.min(
                  Number(
                    item.stock,
                  ),

                  candidate,
                ),
              );

            return {
              ...item,

              quantity:
                next,
            };
          },
        ),
    );
  };

  const setExactQuantity = (
    id,
    value,
  ) => {
    const numeric =
      Number(
        value,
      );

    setCart(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) => {
            if (
              item.id !==
              id
            ) {
              return item;
            }

            const minimum =
              item.saleUnit ===
              'kg'
                ? 0.001
                : 1;

            let next =
              Number.isFinite(
                numeric,
              )
                ? numeric
                : minimum;

            if (
              item.saleUnit !==
                'kg' &&
              !Number.isInteger(
                next,
              )
            ) {
              next =
                Math.floor(
                  next,
                );
            }

            next =
              Math.max(
                minimum,

                Math.min(
                  Number(
                    item.stock,
                  ),

                  next,
                ),
              );

            return {
              ...item,

              quantity:
                Number(
                  next.toFixed(
                    3,
                  ),
                ),
            };
          },
        ),
    );
  };

  /*
   * ==========================================
   * BEBIDA HELADA
   * ==========================================
   */

  const toggleChilled = (
    id,
  ) => {
    setCart(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) => {
            if (
              item.id !==
                id ||
              !isBeverage(
                item,
              )
            ) {
              return item;
            }

            return {
              ...item,

              isChilled:
                !item.isChilled,
            };
          },
        ),
    );
  };

  /*
   * ==========================================
   * ELIMINAR
   * ==========================================
   */

  const removeProduct = (
    id,
  ) => {
    setCart(
      (
        current,
      ) =>
        current.filter(
          (
            item,
          ) =>
            item.id !==
            id,
        ),
    );
  };

  /*
   * ==========================================
   * CONFIRMAR VENTA
   * ==========================================
   */

  const confirm =
    async () => {
      if (
        processing
      ) {
        return;
      }

      if (
        !cashOpen
      ) {
        showMessage(
          'La caja está cerrada.',
          'error',
        );

        return;
      }

      if (
        !cart.length
      ) {
        showMessage(
          'Agrega al menos un producto.',
          'error',
        );

        return;
      }

      if (
        !Number.isFinite(
          receivedAmount,
        ) ||
        receivedAmount <
          total
      ) {
        showMessage(
          'El efectivo recibido es menor al total de la venta.',
          'error',
        );

        return;
      }

      setProcessing(
        true,
      );

      try {
        const result =
          await onCheckout({
            items:
              cart.map(
                (
                  item,
                ) => ({
                  productId:
                    item.id,

                  quantity:
                    Number(
                      item.quantity,
                    ),

                  isChilled:
                    Boolean(
                      item.isChilled,
                    ),
                }),
              ),

            paymentMethod:
              'Efectivo',

            received:
              receivedAmount,
          });

        const saleNumber =
          result?.number ||
          '';

        const saleChange =
          result?.change ??
          change;

        setCart(
          [],
        );

        setReceived(
          '',
        );

        showMessage(
          `Venta ${saleNumber} registrada. Vuelto: ${formatMoney(
            saleChange,
          )}`,
        );

        window.setTimeout(
          () =>
            inputRef
              .current
              ?.focus(),
          100,
        );
      } catch (
        error
      ) {
        showMessage(
          error.message ||
            'No se pudo registrar la venta.',
          'error',
        );
      } finally {
        setProcessing(
          false,
        );
      }
    };

  /*
   * ==========================================
   * PRODUCTOS RÁPIDOS
   * ==========================================
   */

  const quickProducts =
    products
      .filter(
        (
          product,
        ) =>
          product.active !==
            false &&
          Number(
            product.stock,
          ) >
            0 &&
          !isExpired(
            product.expirationDate,
          ),
      )
      .slice(
        0,
        6,
      );

  return (
    <>
      <PageTitle
        eyebrow="Punto de venta"
        title="Caja rápida"
        description="Escanea productos con la cámara, lector físico o código manual. El stock, la caja y los reportes se actualizan automáticamente."
      />

      {/* ======================================
          CAJA CERRADA
      ====================================== */}

      {!cashOpen && (
        <section className="mb-6 flex items-start gap-4 rounded-2xl border border-coral/20 bg-coral/10 p-5 text-coral">
          <LockKeyhole
            className="mt-0.5 shrink-0"
            size={
              22
            }
          />

          <div>
            <p className="font-black">
              Caja cerrada
            </p>

            <p className="mt-1 text-sm font-semibold">
              No se pueden
              registrar ventas.
              Un administrador
              debe abrir la
              caja.
            </p>
          </div>
        </section>
      )}

      {/* ======================================
          CAJA ABIERTA
      ====================================== */}

      {cashOpen && (
        <section className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-mint p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-forest/60">
              Caja abierta
            </p>

            <p className="font-black text-forest">
              {cash.session
                ?.number ||
                'Sesión activa'}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold text-forest/60">
              Efectivo
              esperado
            </p>

            <strong className="text-lg text-forest">
              {formatMoney(
                cash.balance ||
                  0,
              )}
            </strong>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <section className="space-y-5">

          {/* ==================================
              ESCANEO
          ================================== */}

          <section className="panel overflow-hidden">
            <div className="bg-forest p-5 text-white sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/55">
                Venta rápida
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Escanea los
                productos
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/60">
                En celular usa
                la cámara. En
                laptop puedes
                usar cámara,
                lector USB o
                escribir el
                código.
              </p>

              <button
                type="button"
                disabled={
                  !cashOpen
                }
                onClick={
                  openScanner
                }
                className="mt-5 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 text-lg font-black text-forest shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[280px]"
              >
                <Camera
                  size={
                    24
                  }
                />

                Escanear con
                cámara
              </button>
            </div>

            <form
              className="p-5"
              onSubmit={
                scan
              }
            >
              <label className="text-sm font-black">
                Código manual
                o lector USB
              </label>

              <div className="mt-3 flex gap-3">
                <div className="relative flex-1">
                  <ScanBarcode
                    className="absolute left-4 top-3.5 text-forest"
                    size={
                      21
                    }
                  />

                  <input
                    ref={
                      inputRef
                    }
                    autoFocus
                    disabled={
                      !cashOpen
                    }
                    inputMode="numeric"
                    autoComplete="off"
                    className="field pl-12 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Escanea o escribe el código"
                    value={
                      barcode
                    }
                    onChange={(
                      event,
                    ) =>
                      setBarcode(
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </div>

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={
                    !cashOpen
                  }
                >
                  <Search
                    size={
                      18
                    }
                  />

                  <span className="hidden sm:inline">
                    Buscar
                  </span>
                </button>
              </div>

              {message && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm font-bold ${
                    messageType ===
                    'error'
                      ? 'bg-coral/10 text-coral'
                      : 'bg-mint text-forest'
                  }`}
                >
                  {messageType ===
                  'error' ? (
                    <AlertTriangle
                      className="mt-0.5 shrink-0"
                      size={
                        17
                      }
                    />
                  ) : (
                    <CheckCircle2
                      className="mt-0.5 shrink-0"
                      size={
                        17
                      }
                    />
                  )}

                  <span>
                    {
                      message
                    }
                  </span>
                </div>
              )}

              {quickProducts.length >
                0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold text-black/35">
                    Acceso rápido
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {quickProducts.map(
                      (
                        product,
                      ) => (
                        <button
                          key={
                            product.id
                          }
                          type="button"
                          disabled={
                            !cashOpen
                          }
                          className="rounded-full bg-cream px-3 py-2 text-xs font-bold transition hover:bg-mint disabled:opacity-40"
                          onClick={() =>
                            addProduct(
                              product,
                            )
                          }
                        >
                          {
                            product.name
                          }
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </form>
          </section>

          {/* ==================================
              CARRITO
          ================================== */}

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/5 p-5">
              <div>
                <h2 className="text-lg font-black">
                  Venta actual
                </h2>

                <p className="text-sm text-black/40">
                  {
                    cart.length
                  }{' '}
                  productos
                  diferentes ·{' '}
                  {
                    cartUnits
                  }{' '}
                  unidades
                </p>
              </div>

              {cart.length >
                0 && (
                <strong className="text-xl text-forest">
                  {formatMoney(
                    total,
                  )}
                </strong>
              )}
            </div>

            {!cart.length ? (
              <EmptyState text="Escanea un producto para comenzar la venta" />
            ) : (
              <div className="divide-y divide-black/5">
                {cart.map(
                  (
                    item,
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      className="grid grid-cols-[1fr_auto] gap-4 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-5"
                    >
                      <div>
                        <p className="font-bold">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {
                            item.barcode
                          }{' '}
                          ·{' '}
                          {formatMoney(
                            item.salePrice,
                          )}{' '}
                          por{' '}
                          {item.saleUnit ===
                          'kg'
                            ? 'kg'
                            : 'unidad'}
                        </p>

                        <p className="mt-1 text-xs font-bold text-black/35">
                          Stock:{' '}
                          {
                            item.stock
                          }
                        </p>

                        {isBeverage(
                          item,
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleChilled(
                                item.id,
                              )
                            }
                            className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                              item.isChilled
                                ? 'border-sky-300 bg-sky-100 text-sky-800'
                                : 'border-black/10 bg-white text-black/60 hover:border-sky-200 hover:bg-sky-50'
                            }`}
                          >
                            <Snowflake
                              size={
                                15
                              }
                            />

                            {item.isChilled
                              ? `Helada · ${formatMoney(
                                  unitPrice(
                                    item,
                                  ),
                                )}`
                              : `Helada + ${formatMoney(
                                  CHILLED_SURCHARGE,
                                )}`}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-xl bg-cream"
                          onClick={() =>
                            changeQuantity(
                              item.id,
                              -1,
                            )
                          }
                        >
                          <Minus
                            size={
                              15
                            }
                          />
                        </button>

                        <input
                          aria-label={`Cantidad de ${item.name}`}
                          className="w-16 rounded-xl border border-black/10 px-2 py-2 text-center font-black"
                          type="number"
                          min={
                            item.saleUnit ===
                            'kg'
                              ? '0.001'
                              : '1'
                          }
                          max={
                            item.stock
                          }
                          step={
                            item.saleUnit ===
                            'kg'
                              ? '0.001'
                              : '1'
                          }
                          value={
                            item.quantity
                          }
                          onChange={(
                            event,
                          ) =>
                            setExactQuantity(
                              item.id,

                              event
                                .target
                                .value,
                            )
                          }
                        />

                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-xl bg-cream"
                          onClick={() =>
                            changeQuantity(
                              item.id,
                              1,
                            )
                          }
                        >
                          <Plus
                            size={
                              15
                            }
                          />
                        </button>

                        <span className="text-xs text-black/40">
                          {item.saleUnit ===
                          'kg'
                            ? 'kg'
                            : 'un.'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <div className="min-w-24 text-right">
                          <span className="font-black">
                            {formatMoney(
                              unitPrice(
                                item,
                              ) *
                                item.quantity,
                            )}
                          </span>

                          {item.isChilled && (
                            <p className="mt-1 text-[11px] font-bold text-sky-700">
                              Incluye
                              recargo
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-xl text-coral hover:bg-coral/10"
                          onClick={() =>
                            removeProduct(
                              item.id,
                            )
                          }
                        >
                          <Trash2
                            size={
                              18
                            }
                          />
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </section>

        {/* ====================================
            COBRO
        ==================================== */}

        <aside className="panel h-fit overflow-hidden xl:sticky xl:top-28">
          <div className="bg-ink p-6 text-white">
            <div className="flex items-center gap-2 text-white/50">
              <Wallet
                size={
                  18
                }
              />

              <span className="text-sm font-bold">
                Total a cobrar
              </span>
            </div>

            <p className="mt-2 text-5xl font-black tracking-tight">
              {formatMoney(
                total,
              )}
            </p>

            <p className="mt-2 text-sm text-white/40">
              {cartUnits}{' '}
              unidades
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-black">
              Método de pago
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-forest bg-mint p-4 text-forest">
              <span className="grid size-11 place-items-center rounded-xl bg-white/70">
                <Banknote
                  size={
                    22
                  }
                />
              </span>

              <div>
                <p className="font-black">
                  Efectivo
                </p>

                <p className="text-xs font-bold opacity-60">
                  Método
                  disponible
                </p>
              </div>
            </div>

            <label className="mt-5 block text-sm font-black">
              Efectivo
              recibido
            </label>

            <input
              ref={
                receivedRef
              }
              disabled={
                !cashOpen ||
                !cart.length
              }
              className="field mt-2 text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              placeholder="S/ 0.00"
              value={
                received
              }
              onChange={(
                event,
              ) =>
                setReceived(
                  event
                    .target
                    .value,
                )
              }
            />

            {total >
              0 &&
              cashOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    10,
                    20,
                    50,
                    100,
                    200,
                  ].map(
                    (
                      amount,
                    ) => (
                      <button
                        key={
                          amount
                        }
                        type="button"
                        className="rounded-xl bg-cream px-3 py-2 text-xs font-black hover:bg-mint"
                        onClick={() =>
                          setReceived(
                            String(
                              amount,
                            ),
                          )
                        }
                      >
                        S/{' '}
                        {
                          amount
                        }
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    className="rounded-xl bg-forest px-3 py-2 text-xs font-black text-white"
                    onClick={() =>
                      setReceived(
                        total.toFixed(
                          2,
                        ),
                      )
                    }
                  >
                    Exacto
                  </button>
                </div>
              )}

            <div className="mt-4 rounded-2xl bg-cream p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black/50">
                  Recibido
                </span>

                <strong>
                  {formatMoney(
                    receivedAmount,
                  )}
                </strong>
              </div>

              <div className="my-3 border-t border-black/5" />

              <div className="flex items-center justify-between">
                <span className="font-black">
                  Vuelto
                </span>

                <strong className="text-xl text-forest">
                  {formatMoney(
                    change,
                  )}
                </strong>
              </div>
            </div>

            {cart.length >
              0 &&
              receivedAmount <
                total && (
                <p className="mt-3 text-xs font-bold text-coral">
                  Falta{' '}
                  {formatMoney(
                    total -
                      receivedAmount,
                  )}{' '}
                  para completar
                  el pago.
                </p>
              )}

            <button
              type="button"
              className="btn-primary mt-6 w-full py-4"
              disabled={
                processing ||
                !cashOpen ||
                !cart.length ||
                receivedAmount <
                  total
              }
              onClick={
                confirm
              }
            >
              <CheckCircle2
                size={
                  20
                }
              />

              {processing
                ? 'Registrando...'
                : `Cobrar ${formatMoney(total)}`}
            </button>
          </div>
        </aside>
      </div>

      {/* ======================================
          ESCÁNER FULL SCREEN
      ====================================== */}

      {scannerOpen && (
        <BarcodeScanner
          total={
            total
          }

          cartCount={
            cart.length
          }

          onBarcode={
            addByBarcode
          }

          onClose={
            closeScanner
          }
        />
      )}
    </>
  );
}