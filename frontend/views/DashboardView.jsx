'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CircleDollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

import {
  EmptyState,
  PageTitle,
  StatCard,
} from '../components/ui';

import {
  formatDate,
  formatMoney,
} from '../data/mock';

import {
  api,
} from '../lib/api';

export default function DashboardView({
  onNavigate,
}) {
  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const loadDashboard =
    async () => {
      setLoading(true);

      setError('');

      try {
        const result =
          await api.dashboard();

        setData(
          result.data,
        );
      } catch (error) {
        setError(
          error.message ||
            'No se pudo cargar el resumen.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (
    loading
  ) {
    return (
      <>
        <PageTitle
          eyebrow="Vista general"
          title="Resumen del negocio"
          description="Cargando información del minimarket."
        />

        <div className="panel p-8 text-center font-bold text-black/40">
          Cargando
          indicadores...
        </div>
      </>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <>
        <PageTitle
          eyebrow="Vista general"
          title="Resumen del negocio"
          description="Información general del minimarket."
        />

        <div className="panel p-8">
          <p className="font-bold text-coral">
            {error ||
              'No se pudo cargar el Dashboard.'}
          </p>

          <button
            className="btn-primary mt-4"
            onClick={
              loadDashboard
            }
          >
            Volver a
            intentar
          </button>
        </div>
      </>
    );
  }

  const summary =
    data.summary ||
    {};

  const cash =
    data.cash || {
      isOpen: false,
      balance: 0,
    };

  const recentSales =
    data.recentSales ||
    [];

  const lowStock =
    data.lowStock ||
    [];

  const maxSale =
    Math.max(
      ...recentSales.map(
        (
          sale,
        ) =>
          Number(
            sale.total ||
              0,
          ),
      ),
      1,
    );

  return (
    <>
      <PageTitle
        eyebrow="Vista general"
        title="Resumen del negocio"
        description="Indicadores calculados con las ventas, costos, gastos, inventario y caja registrados en el sistema."
        action={
          <button
            className="btn-primary"
            onClick={() =>
              onNavigate(
                'pos',
              )
            }
          >
            <ShoppingCart
              size={18}
            />

            Nueva venta
          </button>
        }
      />

      <section className="mb-6 rounded-[2rem] bg-ink p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-white/45">
              Estado de caja
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {cash.isOpen
                ? 'Caja abierta'
                : 'Caja cerrada'}
            </h2>

            {cash.isOpen && (
              <p className="mt-1 text-sm text-white/45">
                Sesión{' '}
                {cash.session
                  ?.number ||
                  'activa'}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-sm font-bold text-white/45">
              Efectivo
              esperado
            </p>

            <p className="mt-1 text-4xl font-black">
              {formatMoney(
                cash.balance ||
                  0,
              )}
            </p>
          </div>
        </div>

        <button
          className="mt-6 inline-flex items-center gap-2 text-sm font-black text-mint"
          onClick={() =>
            onNavigate(
              'cash',
            )
          }
        >
          Administrar caja

          <ArrowRight
            size={16}
          />
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas del mes"
          value={formatMoney(
            summary.revenue ||
              0,
          )}
          helper={`${summary.salesCount || 0} operaciones registradas`}
          icon={
            Banknote
          }
        />

        <StatCard
          label="Ganancia bruta"
          value={formatMoney(
            summary.grossProfit ||
              0,
          )}
          helper="Ventas menos costo de mercadería"
          icon={
            TrendingUp
          }
          tone="dark"
        />

        <StatCard
          label="Ganancia neta"
          value={formatMoney(
            summary.netProfit ||
              0,
          )}
          helper={`${summary.margin || 0}% de margen neto`}
          icon={
            CircleDollarSign
          }
          tone="amber"
        />

        <StatCard
          label="Gastos del mes"
          value={formatMoney(
            summary.expenses ||
              0,
          )}
          helper="Gastos operativos registrados"
          icon={
            WalletCards
          }
          tone="coral"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="panel p-5 sm:p-7">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Ventas
                recientes
              </h2>

              <p className="mt-1 text-sm text-black/40">
                Últimas
                operaciones
                registradas
              </p>
            </div>

            <span className="badge bg-mint text-forest">
              {
                recentSales.length
              }{' '}
              últimas
            </span>
          </div>

          {recentSales.length ? (
            <>
              <div className="flex h-56 items-end gap-4 border-b border-black/10 px-2">
                {recentSales
                  .slice()
                  .reverse()
                  .map(
                    (
                      sale,
                    ) => (
                      <div
                        key={
                          sale.id
                        }
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <span className="text-[10px] font-bold text-black/45 sm:text-xs">
                          {formatMoney(
                            sale.total,
                          )}
                        </span>

                        <div
                          className="w-full max-w-16 rounded-t-2xl bg-forest transition hover:bg-coral"
                          style={{
                            height: `${Math.max(
                              (Number(
                                sale.total ||
                                  0,
                              ) /
                                maxSale) *
                                150,
                              18,
                            )}px`,
                          }}
                        />

                        <span className="pb-3 text-[10px] text-black/35 sm:text-xs">
                          {sale.number?.replace(
                            'V-',
                            '#',
                          )}
                        </span>
                      </div>
                    ),
                  )}
              </div>

              <div className="mt-5 space-y-2">
                {recentSales.map(
                  (
                    sale,
                  ) => (
                    <div
                      key={
                        sale.id
                      }
                      className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-4"
                    >
                      <div>
                        <p className="font-black">
                          {
                            sale.number
                          }
                        </p>

                        <p className="text-xs text-black/40">
                          {formatDate(
                            sale.date,
                          )}{' '}
                          ·{' '}
                          {sale.items ||
                            0}{' '}
                          unidades
                        </p>
                      </div>

                      <strong className="text-forest">
                        {formatMoney(
                          sale.total,
                        )}
                      </strong>
                    </div>
                  ),
                )}
              </div>
            </>
          ) : (
            <EmptyState text="Todavía no existen ventas registradas" />
          )}
        </article>

        <article className="panel p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                Stock por
                reponer
              </h2>

              <p className="mt-1 text-sm text-black/40">
                Productos que
                llegaron o
                bajaron del
                mínimo
              </p>
            </div>

            <span className="grid size-10 place-items-center rounded-2xl bg-coral/10 text-coral">
              <AlertTriangle
                size={20}
              />
            </span>
          </div>

          {lowStock.length ? (
            <div className="space-y-3">
              {lowStock.map(
                (
                  product,
                ) => (
                  <div
                    key={
                      product.id
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl bg-cream p-4"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        Mínimo:{' '}
                        {
                          product.minStock
                        }
                      </p>
                    </div>

                    <span className="badge bg-coral/10 text-coral">
                      {
                        product.stock
                      }{' '}
                      unid.
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-mint p-4 text-sm font-bold text-forest">
              Todo el stock se
              encuentra por
              encima del mínimo.
            </div>
          )}

          <button
            className="mt-5 flex items-center gap-2 text-sm font-black text-forest"
            onClick={() =>
              onNavigate(
                'inventory',
              )
            }
          >
            Revisar
            inventario

            <ArrowRight
              size={16}
            />
          </button>
        </article>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-5">
          <Package className="text-forest" />

          <p className="mt-4 text-sm font-bold text-black/40">
            Unidades
            vendidas
          </p>

          <p className="mt-1 text-3xl font-black">
            {summary.unitsSold ||
              0}
          </p>
        </article>

        <article className="panel p-5">
          <ShoppingCart className="text-forest" />

          <p className="mt-4 text-sm font-bold text-black/40">
            Ventas
          </p>

          <p className="mt-1 text-3xl font-black">
            {summary.salesCount ||
              0}
          </p>
        </article>

        <article className="panel p-5">
          <AlertTriangle className="text-coral" />

          <p className="mt-4 text-sm font-bold text-black/40">
            Stock bajo
          </p>

          <p className="mt-1 text-3xl font-black text-coral">
            {summary.lowStockCount ||
              0}
          </p>
        </article>

        <article className="panel p-5">
          <CircleDollarSign className="text-forest" />

          <p className="mt-4 text-sm font-bold text-black/40">
            Costo vendido
          </p>

          <p className="mt-1 text-3xl font-black">
            {formatMoney(
              summary.cost ||
                0,
            )}
          </p>
        </article>
      </section>

      <div className="mt-6 flex justify-end">
        <button
          className="flex items-center gap-2 text-sm font-black text-forest"
          onClick={() =>
            onNavigate(
              'reports',
            )
          }
        >
          Ver reportes
          completos

          <ArrowRight
            size={16}
          />
        </button>
      </div>
    </>
  );
}