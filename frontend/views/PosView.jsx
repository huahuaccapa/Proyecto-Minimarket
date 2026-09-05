'use client';

import {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertTriangle,
  Banknote,
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

import {
  EmptyState,
  PageTitle,
} from '../components/ui';

import {
  formatMoney,
} from '../data/mock';

const CHILLED_SURCHARGE = 1;

const normalizeText = (
  value = '',
) =>
  String(value)
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .trim()
    .toLowerCase();

function isExpired(
  expirationDate,
) {
  if (!expirationDate) {
    return false;
  }

  const expiration =
    new Date(
      `${expirationDate}T23:59:59`,
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
  ] = useState('');

  const [
    cart,
    setCart,
  ] = useState([]);

  const [
    received,
    setReceived,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    messageType,
    setMessageType,
  ] = useState('success');

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const inputRef =
    useRef(null);

  const cashOpen =
    Boolean(
      cash?.isOpen,
    );

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
      [categories],
    );

  const isBeverage = (
    product,
  ) =>
    beverageCategoryIds.has(
      product.categoryId,
    );

  const unitPrice = (
    item,
  ) =>
    Number(
      item.salePrice ||
        0,
    ) +
    (item.isChilled
      ? CHILLED_SURCHARGE
      : 0);

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
            .toFixed(2),
        ),
      [cart],
    );

  const receivedAmount =
    Number(
      received || 0,
    );

  const change =
    Math.max(
      Number(
        (
          receivedAmount -
          total
        ).toFixed(2),
      ),
      0,
    );

  const showMessage = (
    text,
    type = 'success',
  ) => {
    setMessage(text);

    setMessageType(type);
  };

  const validateProduct = (
    product,
  ) => {
    if (!product) {
      showMessage(
        'No encontramos ese código. Registra primero el producto.',
        'error',
      );

      return false;
    }

    if (
      product.active ===
      false
    ) {
      showMessage(
        `${product.name} está desactivado.`,
        'error',
      );

      return false;
    }

    if (
      Number(
        product.stock,
      ) <= 0
    ) {
      showMessage(
        `${product.name} no tiene stock disponible.`,
        'error',
      );

      return false;
    }

    if (
      isExpired(
        product.expirationDate,
      )
    ) {
      showMessage(
        `${product.name} está vencido y no puede venderse.`,
        'error',
      );

      return false;
    }

    return true;
  };

  const addProduct = (
    product,
  ) => {
    if (
      !cashOpen
    ) {
      showMessage(
        'No puedes registrar ventas porque la caja está cerrada.',
        'error',
      );

      return;
    }

    if (
      !validateProduct(
        product,
      )
    ) {
      return;
    }

    const step =
      product.saleUnit ===
      'kg'
        ? 0.25
        : 1;

    setCart(
      (
        current,
      ) => {
        const existing =
          current.find(
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
              ).toFixed(3),
            );

          if (
            next >
            Number(
              product.stock,
            )
          ) {
            showMessage(
              `No hay más stock disponible de ${product.name}.`,
              'error',
            );

            return current;
          }

          return current.map(
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
          );
        }

        return [
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
        ];
      },
    );

    setBarcode('');

    showMessage(
      `${product.name} agregado a la venta.`,
    );

    inputRef.current?.focus();
  };

  const scan = (
    event,
  ) => {
    event.preventDefault();

    const code =
      barcode.trim();

    if (!code) {
      showMessage(
        'Ingresa o escanea un código de barras.',
        'error',
      );

      return;
    }

    const product =
      products.find(
        (
          item,
        ) =>
          String(
            item.barcode,
          ).trim() ===
          code,
      );

    addProduct(
      product,
    );
  };

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
      Number(value);

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
          'La caja está cerrada. Un administrador debe abrirla antes de registrar ventas.',
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

        setCart([]);

        setReceived('');

        showMessage(
          `Venta ${saleNumber} registrada. Vuelto: ${formatMoney(
            saleChange,
          )}`,
        );

        inputRef.current?.focus();
      } catch (error) {
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
          ) > 0 &&
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
        description="Escanea productos, recibe el efectivo y registra la venta. Todo movimiento queda conectado con inventario y caja."
      />

      {!cashOpen && (
        <section className="mb-6 flex items-start gap-4 rounded-2xl border border-coral/20 bg-coral/10 p-5 text-coral">
          <LockKeyhole
            className="mt-0.5 shrink-0"
            size={22}
          />

          <div>
            <p className="font-black">
              Caja cerrada
            </p>

            <p className="mt-1 text-sm font-semibold">
              No se pueden
              registrar ventas.
              Un administrador
              debe ingresar a
              “Caja actual” y
              realizar la
              apertura.
            </p>
          </div>
        </section>
      )}

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
          <form
            className="panel p-5"
            onSubmit={
              scan
            }
          >
            <label className="text-sm font-black">
              Escanear código
              de barras
            </label>

            <div className="mt-3 flex gap-3">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-4 top-3.5 text-forest" />

                <input
                  ref={
                    inputRef
                  }
                  autoFocus
                  disabled={
                    !cashOpen
                  }
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
                  size={18}
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
                    size={17}
                  />
                ) : (
                  <CheckCircle2
                    className="mt-0.5 shrink-0"
                    size={17}
                  />
                )}

                <span>
                  {message}
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

          <section className="panel overflow-hidden">
            <div className="border-b border-black/5 p-5">
              <h2 className="text-lg font-black">
                Productos de
                la venta
              </h2>

              <p className="text-sm text-black/40">
                {
                  cart.length
                }{' '}
                productos
                diferentes
              </p>
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
                      className="grid grid-cols-[1fr_auto] gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
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
                          Stock
                          disponible:{' '}
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
                              size={15}
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
                          className="grid size-8 place-items-center rounded-xl bg-cream"
                          onClick={() =>
                            changeQuantity(
                              item.id,
                              -1,
                            )
                          }
                        >
                          <Minus
                            size={15}
                          />
                        </button>

                        <input
                          aria-label={`Cantidad de ${item.name}`}
                          className="w-16 rounded-xl border border-black/10 px-2 py-1.5 text-center font-black"
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
                          className="grid size-8 place-items-center rounded-xl bg-cream"
                          onClick={() =>
                            changeQuantity(
                              item.id,
                              1,
                            )
                          }
                        >
                          <Plus
                            size={15}
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
                          className="text-coral"
                          onClick={() =>
                            removeProduct(
                              item.id,
                            )
                          }
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2
                            size={18}
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

        <aside className="panel h-fit overflow-hidden xl:sticky xl:top-28">
          <div className="bg-ink p-6 text-white">
            <div className="flex items-center gap-2 text-white/50">
              <Wallet
                size={18}
              />

              <span className="text-sm font-bold">
                Total a
                cobrar
              </span>
            </div>

            <p className="mt-2 text-5xl font-black tracking-tight">
              {formatMoney(
                total,
              )}
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-black">
              Método de pago
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-forest bg-mint p-4 text-forest">
              <span className="grid size-11 place-items-center rounded-xl bg-white/70">
                <Banknote
                  size={22}
                />
              </span>

              <div>
                <p className="font-black">
                  Efectivo
                </p>

                <p className="text-xs font-bold opacity-60">
                  Único método
                  disponible
                  actualmente
                </p>
              </div>
            </div>

            <label className="mt-5 block text-sm font-black">
              Efectivo
              recibido
            </label>

            <input
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

            {total > 0 &&
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
                        {amount}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    className="rounded-xl bg-cream px-3 py-2 text-xs font-black hover:bg-mint"
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
                  Efectivo
                  recibido
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
                size={20}
              />

              {processing
                ? 'Registrando...'
                : 'Confirmar venta'}
            </button>

            {!cashOpen && (
              <p className="mt-3 text-center text-xs font-bold text-coral">
                Debes abrir la
                caja antes de
                vender.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}