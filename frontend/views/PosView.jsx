'use client';

import { useMemo, useRef, useState } from 'react';

import {
  ScanBarcode,
  Search,
  Minus,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  CheckCircle2,
  Snowflake,
} from 'lucide-react';

import {
  PageTitle,
  EmptyState,
} from '../components/ui';

import {
  formatMoney,
} from '../data/mock';

const CHILLED_SURCHARGE = 1;

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export default function PosView({
  products,
  categories = [],
  onCheckout,
}) {
  const [barcode, setBarcode] =
    useState('');

  const [cart, setCart] =
    useState([]);

  /*
   * Por ahora Caja únicamente acepta
   * pagos en efectivo.
   */
  const paymentMethod =
    'Efectivo';

  const [received, setReceived] =
    useState('');

  const [message, setMessage] =
    useState('');

  const inputRef =
    useRef(null);

  /*
   * IDs pertenecientes a la categoría
   * Bebidas.
   */
  const beverageCategoryIds =
    useMemo(
      () =>
        new Set(
          categories
            .filter(
              (category) =>
                normalizeText(
                  category.name
                ) ===
                'bebidas'
            )
            .map(
              (category) =>
                category.id
            )
        ),

      [categories]
    );

  /*
   * Determinar si un producto es bebida.
   */
  const isBeverage = (
    product
  ) =>
    beverageCategoryIds.has(
      product.categoryId
    );

  /*
   * Precio unitario final.
   *
   * Si la bebida es helada:
   * precio normal + S/ 1.
   */
  const unitPrice = (
    item
  ) =>
    Number(
      item.salePrice
    ) +
    (item.isChilled
      ? CHILLED_SURCHARGE
      : 0);

  /*
   * Total de la venta.
   */
  const total =
    useMemo(
      () =>
        cart.reduce(
          (
            sum,
            item
          ) =>
            sum +
            unitPrice(
              item
            ) *
              item.quantity,

          0
        ),

      [cart]
    );

  /*
   * Dinero recibido.
   */
  const receivedAmount =
    Number(
      received || 0
    );

  /*
   * Vuelto.
   */
  const change =
    Math.max(
      receivedAmount -
        total,

      0
    );

  /*
   * AGREGAR PRODUCTO
   */
  const addProduct = (
    product
  ) => {
    if (!product) {
      setMessage(
        'No encontramos ese código. Registra primero el producto.'
      );

      return;
    }

    if (
      product.stock <= 0
    ) {
      setMessage(
        'Este producto no tiene stock disponible.'
      );

      return;
    }

    const step =
      product.saleUnit ===
      'kg'
        ? 0.25
        : 1;

    setCart(
      (current) => {
        const exists =
          current.find(
            (item) =>
              item.id ===
              product.id
          );

        if (exists) {
          return current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,

                    quantity:
                      Math.min(
                        Number(
                          (
                            item.quantity +
                            step
                          ).toFixed(
                            3
                          )
                        ),

                        item.stock
                      ),
                  }
                : item
          );
        }

        return [
          ...current,

          {
            ...product,

            quantity:
              Math.min(
                step,
                product.stock
              ),

            /*
             * Toda bebida comienza
             * inicialmente sin recargo.
             */
            isChilled:
              false,
          },
        ];
      }
    );

    setBarcode('');

    setMessage(
      `${product.name} agregado`
    );

    inputRef.current?.focus();
  };

  /*
   * BUSCAR POR CÓDIGO
   */
  const scan = (
    event
  ) => {
    event.preventDefault();

    const product =
      products.find(
        (item) =>
          item.barcode ===
          barcode.trim()
      );

    addProduct(product);
  };

  /*
   * CAMBIAR CANTIDAD
   */
  const quantity = (
    id,
    direction
  ) =>
    setCart(
      (current) =>
        current.map(
          (item) => {
            if (
              item.id !== id
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

            return {
              ...item,

              quantity:
                Math.max(
                  minimum,

                  Math.min(
                    item.stock,

                    Number(
                      (
                        item.quantity +
                        direction *
                          step
                      ).toFixed(
                        3
                      )
                    )
                  )
                ),
            };
          }
        )
    );

  /*
   * ESCRIBIR CANTIDAD
   */
  const setExactQuantity = (
    id,
    value
  ) =>
    setCart(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,

                  quantity:
                    Math.min(
                      item.stock,

                      Math.max(
                        item.saleUnit ===
                        'kg'
                          ? 0.001
                          : 1,

                        Number(
                          value
                        ) ||
                          0
                      )
                    ),
                }
              : item
        )
    );

  /*
   * ACTIVAR / DESACTIVAR
   * BEBIDA HELADA.
   */
  const toggleChilled = (
    id
  ) => {
    setCart(
      (current) =>
        current.map(
          (item) => {
            if (
              item.id !== id ||
              !isBeverage(
                item
              )
            ) {
              return item;
            }

            return {
              ...item,

              isChilled:
                !item.isChilled,
            };
          }
        )
    );
  };

  /*
   * CONFIRMAR VENTA
   */
  const confirm =
    async () => {
      if (
        !cart.length
      ) {
        return;
      }

      /*
       * Como solamente existe efectivo,
       * siempre comprobamos el monto.
       */
      if (
        receivedAmount <
        total
      ) {
        setMessage(
          'El efectivo recibido es menor al total.'
        );

        return;
      }

      try {
        const result =
          await onCheckout({
            items:
              cart.map(
                ({
                  id,
                  quantity,
                  isChilled,
                }) => ({
                  productId:
                    id,

                  quantity,

                  isChilled:
                    Boolean(
                      isChilled
                    ),
                })
              ),

            /*
             * Único método habilitado.
             */
            paymentMethod:
              'Efectivo',

            received:
              receivedAmount,
          });

        setCart([]);

        setReceived('');

        setMessage(
          `Venta ${
            result?.number ||
            ''
          } registrada correctamente`
        );

        inputRef.current?.focus();
      } catch (
        error
      ) {
        setMessage(
          error.message ||
            'No se pudo registrar la venta.'
        );
      }
    };

  return (
    <>
      <PageTitle
        eyebrow="Punto de venta"
        title="Caja rápida"
        description="Escanea el código, revisa el pedido, recibe el efectivo y registra la venta."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">

        {/* ================================= */}
        {/* PRODUCTOS */}
        {/* ================================= */}

        <section className="space-y-5">

          {/* BUSCADOR */}

          <form
            className="panel p-5"
            onSubmit={scan}
          >
            <label className="text-sm font-black">
              Escanear código de
              barras
            </label>

            <div className="mt-3 flex gap-3">

              <div className="relative flex-1">

                <ScanBarcode className="absolute left-4 top-3.5 text-forest" />

                <input
                  ref={
                    inputRef
                  }
                  autoFocus
                  className="field pl-12 text-lg font-bold"
                  placeholder="Escanea o escribe el código"
                  value={
                    barcode
                  }
                  onChange={(
                    event
                  ) =>
                    setBarcode(
                      event
                        .target
                        .value
                    )
                  }
                />

              </div>

              <button
                className="btn-primary"
                type="submit"
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
              <p className="mt-3 text-sm font-bold text-forest">
                {message}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">

              {products
                .slice(
                  0,
                  4
                )
                .map(
                  (product) => (
                    <button
                      key={
                        product.id
                      }
                      type="button"
                      className="rounded-full bg-cream px-3 py-2 text-xs font-bold hover:bg-mint"
                      onClick={() =>
                        addProduct(
                          product
                        )
                      }
                    >
                      {
                        product.name
                      }
                    </button>
                  )
                )}

            </div>

          </form>

          {/* ================================= */}
          {/* CARRITO */}
          {/* ================================= */}

          <section className="panel overflow-hidden">

            <div className="border-b border-black/5 p-5">

              <h2 className="text-lg font-black">
                Productos de la
                venta
              </h2>

              <p className="text-sm text-black/40">
                {
                  cart.length
                }{' '}
                productos
                agregados
              </p>

            </div>

            {!cart.length ? (
              <EmptyState text="Escanea un producto para comenzar la venta" />
            ) : (
              <div className="divide-y divide-black/5">

                {cart.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="grid grid-cols-[1fr_auto] gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                    >

                      {/* PRODUCTO */}

                      <div>

                        <p className="font-bold">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {
                            item.barcode
                          }
                          {' · '}

                          {formatMoney(
                            item.salePrice
                          )}

                          {' por '}

                          {item.saleUnit ===
                          'kg'
                            ? 'kg'
                            : 'unidad'}
                        </p>

                        {/* BEBIDA HELADA */}

                        {isBeverage(
                          item
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleChilled(
                                item.id
                              )
                            }
                            className={`
                              mt-3
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              px-3
                              py-2
                              text-xs
                              font-black
                              transition

                              ${
                                item.isChilled
                                  ? 'border-sky-300 bg-sky-100 text-sky-800'
                                  : 'border-black/10 bg-white text-black/60 hover:border-sky-200 hover:bg-sky-50'
                              }
                            `}
                          >
                            <Snowflake
                              size={
                                15
                              }
                            />

                            {item.isChilled
                              ? `Helada activada · ${formatMoney(
                                  unitPrice(
                                    item
                                  )
                                )}`
                              : `Helada + ${formatMoney(
                                  CHILLED_SURCHARGE
                                )}`}
                          </button>
                        )}

                      </div>

                      {/* CANTIDAD */}

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-xl bg-cream"
                          onClick={() =>
                            quantity(
                              item.id,
                              -1
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
                            event
                          ) =>
                            setExactQuantity(
                              item.id,
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-xl bg-cream"
                          onClick={() =>
                            quantity(
                              item.id,
                              1
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

                      {/* SUBTOTAL */}

                      <div className="flex items-center justify-end gap-3">

                        <div className="min-w-24 text-right">

                          <span className="font-black">
                            {formatMoney(
                              unitPrice(
                                item
                              ) *
                                item.quantity
                            )}
                          </span>

                          {item.isChilled && (
                            <p className="mt-1 text-[11px] font-bold text-sky-700">
                              Incluye
                              recargo por
                              helada
                            </p>
                          )}

                        </div>

                        <button
                          type="button"
                          className="text-coral"
                          onClick={() =>
                            setCart(
                              (
                                current
                              ) =>
                                current.filter(
                                  (
                                    product
                                  ) =>
                                    product.id !==
                                    item.id
                                )
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
                  )
                )}

              </div>
            )}

          </section>

        </section>

        {/* ================================= */}
        {/* COBRO */}
        {/* ================================= */}

        <aside className="panel h-fit overflow-hidden xl:sticky xl:top-28">

          <div className="bg-ink p-6 text-white">

            <div className="flex items-center gap-2 text-white/50">

              <Wallet
                size={18}
              />

              <span className="text-sm font-bold">
                Total a cobrar
              </span>

            </div>

            <p className="mt-2 text-5xl font-black tracking-tight">
              {formatMoney(
                total
              )}
            </p>

          </div>

          <div className="p-6">

            {/* MÉTODO DE PAGO */}

            <p className="text-sm font-black">
              Método de pago
            </p>

            <div className="mt-3">

              <div className="flex items-center gap-3 rounded-2xl border border-forest bg-mint p-4 text-forest">

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
                    disponible por
                    ahora
                  </p>

                </div>

              </div>

            </div>

            {/* EFECTIVO RECIBIDO */}

            <label className="mt-5 block text-sm font-black">
              Efectivo recibido
            </label>

            <input
              className="field mt-2 text-lg font-black"
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              placeholder="S/ 0.00"
              value={
                received
              }
              onChange={(
                event
              ) =>
                setReceived(
                  event.target
                    .value
                )
              }
            />

            {/* ATAJOS DE EFECTIVO */}

            {total > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">

                {[
                  10,
                  20,
                  50,
                  100,
                ].map(
                  (amount) => (
                    <button
                      key={
                        amount
                      }
                      type="button"
                      className="rounded-xl bg-cream px-3 py-2 text-xs font-black hover:bg-mint"
                      onClick={() =>
                        setReceived(
                          String(
                            amount
                          )
                        )
                      }
                    >
                      S/{' '}
                      {
                        amount
                      }
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="rounded-xl bg-cream px-3 py-2 text-xs font-black hover:bg-mint"
                  onClick={() =>
                    setReceived(
                      total.toFixed(
                        2
                      )
                    )
                  }
                >
                  Exacto
                </button>

              </div>
            )}

            {/* VUELTO */}

            <div className="mt-4 rounded-2xl bg-cream p-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-black/50">
                  Efectivo
                  recibido
                </span>

                <strong>
                  {formatMoney(
                    receivedAmount
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
                    change
                  )}
                </strong>

              </div>

            </div>

            {/* ADVERTENCIA */}

            {cart.length >
              0 &&
              receivedAmount <
                total && (
                <p className="mt-3 text-xs font-bold text-coral">
                  Falta{' '}
                  {formatMoney(
                    total -
                      receivedAmount
                  )}{' '}
                  para completar
                  el pago.
                </p>
              )}

            {/* CONFIRMAR */}

            <button
              type="button"
              className="btn-primary mt-6 w-full py-4"
              disabled={
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

              Confirmar venta
            </button>

          </div>

        </aside>

      </div>
    </>
  );
}