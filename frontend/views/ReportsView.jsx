'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import {
  EmptyState,
  PageTitle,
  StatCard,
} from '../components/ui';

import {
  formatMoney,
} from '../data/mock';

import {
  api,
} from '../lib/api';

export default function ReportsView() {
  const [
    period,
    setPeriod,
  ] = useState(
    'weekly',
  );

  const [
    data,
    setData,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    let alive =
      true;

    setError('');

    setData(null);

    api
      .report(
        period,
      )
      .then(
        (
          response,
        ) => {
          if (alive) {
            setData(
              response.data,
            );
          }
        },
      )
      .catch(
        (
          error,
        ) => {
          if (alive) {
            setError(
              error.message,
            );
          }
        },
      );

    return () => {
      alive =
        false;
    };
  }, [period]);

  return (
    <>
      <PageTitle
        eyebrow="Análisis del negocio"
        title="Reportes"
        description="Los cálculos provienen directamente del backend utilizando las mismas ventas, costos y gastos registrados por el sistema."
      />

      <section className="panel mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-mint text-forest">
            <CalendarDays
              size={21}
            />
          </span>

          <div>
            <p className="font-black">
              Periodo del
              reporte
            </p>

            <p className="text-xs text-black/40">
              Elige reporte
              semanal o
              mensual.
            </p>
          </div>
        </div>

        <div className="flex rounded-2xl bg-black/5 p-1">
          <button
            className={`rounded-xl px-5 py-2.5 text-sm font-black ${
              period ===
              'weekly'
                ? 'bg-white shadow-sm'
                : 'text-black/40'
            }`}
            onClick={() =>
              setPeriod(
                'weekly',
              )
            }
          >
            Semanal
          </button>

          <button
            className={`rounded-xl px-5 py-2.5 text-sm font-black ${
              period ===
              'monthly'
                ? 'bg-white shadow-sm'
                : 'text-black/40'
            }`}
            onClick={() =>
              setPeriod(
                'monthly',
              )
            }
          >
            Mensual
          </button>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-coral/10 p-4 font-bold text-coral">
          {error}
        </p>
      )}

      {!data ? (
        !error && (
          <p className="text-sm text-black/40">
            Cargando
            reporte…
          </p>
        )
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Ingresos por ventas"
              value={formatMoney(
                data.revenue,
              )}
              helper={`${data.salesCount} ventas registradas`}
              icon={
                TrendingUp
              }
            />

            <StatCard
              label="Costo vendido"
              value={formatMoney(
                data.cost,
              )}
              helper="Costo de mercadería vendida"
              icon={
                ShoppingBag
              }
              tone="amber"
            />

            <StatCard
              label="Gastos"
              value={formatMoney(
                data.expenses,
              )}
              helper="Gastos operativos activos"
              icon={
                ShoppingCart
              }
              tone="coral"
            />

            <StatCard
              label="Ganancia neta"
              value={formatMoney(
                data.netProfit,
              )}
              helper={`${data.margin}% de margen neto`}
              icon={
                CircleDollarSign
              }
              tone="dark"
            />
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="panel p-5">
              <p className="text-sm font-bold text-black/40">
                Ganancia
                bruta
              </p>

              <p className="mt-2 text-3xl font-black text-forest">
                {formatMoney(
                  data.grossProfit,
                )}
              </p>

              <p className="mt-2 text-xs text-black/40">
                Ventas menos
                costo de
                mercadería
                vendida.
              </p>
            </article>

            <article className="panel p-5">
              <p className="text-sm font-bold text-black/40">
                Unidades
                vendidas
              </p>

              <p className="mt-2 text-3xl font-black">
                {
                  data.unitsSold
                }
              </p>
            </article>

            <article className="panel p-5">
              <p className="text-sm font-bold text-black/40">
                Productos con
                stock bajo
              </p>

              <p className="mt-2 text-3xl font-black text-coral">
                {
                  data.lowStockCount
                }
              </p>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <article className="panel p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    Productos que
                    más se venden
                  </h2>

                  <p className="text-sm text-black/40">
                    Productos con
                    mayor rotación
                    durante el
                    periodo.
                  </p>
                </div>

                <Trophy />
              </div>

              {data
                .topProducts
                .length ? (
                <div className="space-y-3">
                  {data.topProducts.map(
                    (
                      product,
                      index,
                    ) => (
                      <div
                        key={
                          product.productId
                        }
                        className="flex justify-between gap-4 rounded-2xl bg-cream p-4"
                      >
                        <div>
                          <p className="font-black">
                            {index +
                              1}
                            .{' '}
                            {
                              product.name
                            }
                          </p>

                          <p className="text-xs text-black/40">
                            {
                              product.quantity
                            }{' '}
                            vendidos
                            ·{' '}
                            {formatMoney(
                              product.revenue,
                            )}
                          </p>
                        </div>

                        <strong>
                          {
                            product.quantity
                          }
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <EmptyState text="Aún no existen ventas durante este periodo" />
              )}
            </article>

            <article className="panel p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    Productos sin
                    salida
                  </h2>

                  <p className="text-sm text-black/40">
                    Productos
                    activos que no
                    tuvieron
                    ventas.
                  </p>
                </div>

                <AlertTriangle />
              </div>

              {data
                .noSalesProducts
                .length ? (
                <div className="space-y-3">
                  {data.noSalesProducts.map(
                    (
                      product,
                    ) => (
                      <div
                        key={
                          product.productId
                        }
                        className="flex justify-between gap-3 rounded-2xl bg-cream p-4"
                      >
                        <div>
                          <span className="font-bold">
                            {
                              product.name
                            }
                          </span>

                          <p className="mt-1 text-xs text-black/40">
                            Stock
                            actual:{' '}
                            {
                              product.stock
                            }
                          </p>
                        </div>

                        <span className="badge bg-coral/10 text-coral">
                          0 ventas
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="rounded-2xl bg-mint p-4 text-sm font-bold text-forest">
                  Todos los
                  productos
                  activos
                  tuvieron
                  movimiento
                  durante el
                  periodo.
                </p>
              )}
            </article>
          </section>

          <section className="panel mt-6 p-6">
            <h2 className="text-xl font-black">
              Productos de baja
              rotación
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Estos productos sí
              tuvieron ventas,
              pero su movimiento
              fue considerablemente
              menor al promedio.
            </p>

            {data
              .slowProducts
              .length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.slowProducts.map(
                  (
                    product,
                  ) => (
                    <div
                      key={
                        product.productId
                      }
                      className="rounded-2xl bg-cream p-4"
                    >
                      <p className="font-black">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-2 text-sm">
                        Unidades
                        vendidas:{' '}
                        <strong>
                          {
                            product.quantity
                          }
                        </strong>
                      </p>

                      <p className="text-sm">
                        Ingresos:{' '}
                        <strong>
                          {formatMoney(
                            product.revenue,
                          )}
                        </strong>
                      </p>

                      <p className="text-sm">
                        Ganancia
                        bruta:{' '}
                        <strong>
                          {formatMoney(
                            product.profit,
                          )}
                        </strong>
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState text="No se detectaron productos de baja rotación" />
              </div>
            )}
          </section>

          <section className="panel mt-6 p-6">
            <h2 className="text-xl font-black">
              Promociones
              sugeridas
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Las sugerencias
              utilizan solamente
              una parte del margen
              disponible para
              evitar vender por
              debajo del costo.
            </p>

            {data.promotions
              .length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.promotions.map(
                  (
                    product,
                  ) => (
                    <div
                      key={
                        product.productId
                      }
                      className="rounded-2xl bg-cream p-4"
                    >
                      <p className="font-black">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        {
                          product.reason
                        }
                      </p>

                      {product.suggestedDiscountPercent >
                      0 ? (
                        <>
                          <p className="mt-3 text-sm">
                            Descuento
                            sugerido:{' '}
                            <strong>
                              {
                                product.suggestedDiscountPercent
                              }
                              %
                            </strong>
                          </p>

                          <p className="text-sm">
                            Precio
                            sugerido:{' '}
                            <strong>
                              {formatMoney(
                                product.suggestedPrice,
                              )}
                            </strong>
                          </p>
                        </>
                      ) : (
                        <p className="mt-3 text-sm font-bold text-coral">
                          El margen
                          actual es
                          demasiado
                          bajo para
                          recomendar
                          un
                          descuento.
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState text="No hay productos candidatos a promoción durante este periodo" />
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}