'use client';

import { useMemo, useState } from 'react';
import {
  Printer,
  TrendingUp,
  ShoppingBag,
  CircleDollarSign,
  ShoppingCart,
  Trophy,
  AlertTriangle,
  Lightbulb,
  Percent,
  CalendarDays,
  Boxes,
} from 'lucide-react';

import { PageTitle, StatCard, EmptyState } from '../components/ui';
import { formatDate, formatMoney, formatQuantity } from '../data/mock';

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getPeriod = (type) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (type === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const buildPromotion = (product, quantity) => {
  const salePrice = Number(product.salePrice || 0);
  const cost = Number(product.unitCost ?? product.purchasePrice ?? 0);

  if (salePrice <= 0 || cost <= 0) {
    return {
      discount: 0,
      promoPrice: salePrice,
      message: 'Revisa primero el costo del producto antes de aplicar una promoción.',
    };
  }

  const minimumSafePrice = cost * 1.1;
  const availableDiscount =
    ((salePrice - minimumSafePrice) / salePrice) * 100;

  let discount = 0;

  if (availableDiscount >= 15) discount = 15;
  else if (availableDiscount >= 10) discount = 10;
  else if (availableDiscount >= 5) discount = 5;

  if (!discount) {
    return {
      discount: 0,
      promoPrice: salePrice,
      message:
        quantity === 0
          ? 'Tiene poco margen. Conviene usar exhibición destacada, combo o venta cruzada en lugar de reducir el precio.'
          : 'El margen actual es reducido. Evita bajar el precio; prueba una mejor ubicación o venta cruzada.',
    };
  }

  const promoPrice = Number(
    (salePrice * (1 - discount / 100)).toFixed(2)
  );

  return {
    discount,
    promoPrice,
    message:
      quantity === 0
        ? `Puedes probar ${discount}% de descuento temporal sin bajar del margen mínimo recomendado.`
        : `Puedes probar una promoción de ${discount}% durante pocos días para aumentar su rotación.`,
  };
};

export default function ReportsView({ sales, expenses, products }) {
  const [periodType, setPeriodType] = useState('weekly');

  const period = useMemo(() => getPeriod(periodType), [periodType]);

  const periodSales = useMemo(
    () =>
      sales.filter((sale) => {
        const date = new Date(sale.date);
        return date >= period.start && date <= period.end;
      }),
    [sales, period]
  );

  const periodExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const date = normalizeDate(expense.date);
        return date >= period.start && date <= period.end;
      }),
    [expenses, period]
  );

  const revenue = useMemo(
    () =>
      periodSales.reduce(
        (sum, sale) => sum + Number(sale.total || 0),
        0
      ),
    [periodSales]
  );

  const cost = useMemo(
    () =>
      periodSales.reduce(
        (sum, sale) => sum + Number(sale.cost || 0),
        0
      ),
    [periodSales]
  );

  const expenseTotal = useMemo(
    () =>
      periodExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      ),
    [periodExpenses]
  );

  const grossProfit = revenue - cost;
  const netProfit = grossProfit - expenseTotal;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const unitsSold = periodSales.reduce(
    (sum, sale) => sum + Number(sale.items || 0),
    0
  );

  const productAnalysis = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      map.set(product.id, {
        product,
        quantity: 0,
        revenue: 0,
        cost: 0,
        operations: 0,
      });
    });

    periodSales.forEach((sale) => {
      (sale.detail || []).forEach((detail) => {
        const current = map.get(detail.productId);
        if (!current) return;

        current.quantity += Number(detail.quantity || 0);
        current.revenue += Number(detail.subtotal || 0);
        current.cost +=
          Number(detail.unitCost || 0) * Number(detail.quantity || 0);
        current.operations += 1;
      });
    });

    return [...map.values()];
  }, [products, periodSales]);

  const soldProducts = productAnalysis
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const topProducts = soldProducts.slice(0, 5);

  const averageQuantity = soldProducts.length
    ? soldProducts.reduce((sum, item) => sum + item.quantity, 0) /
      soldProducts.length
    : 0;

  const slowProducts = soldProducts
    .filter((item) => item.quantity <= Math.max(1, averageQuantity * 0.4))
    .slice(0, 8);

  const noSalesProducts = productAnalysis
    .filter(
      (item) => item.quantity === 0 && item.product.active !== false
    )
    .slice(0, 10);

  const promotionCandidates = [
    ...noSalesProducts,
    ...slowProducts,
  ]
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) => candidate.product.id === item.product.id
        ) === index
    )
    .slice(0, 8);

  const maxTopQuantity = Math.max(
    ...topProducts.map((item) => item.quantity),
    1
  );

  return (
    <>
      <PageTitle
        eyebrow="Análisis del negocio"
        title="Reportes inteligentes"
        description="Analiza ventas, ganancias, rotación de productos y oportunidades para mejorar las ventas sin sacrificar innecesariamente el margen."
        action={
          <button
            className="btn-secondary no-print"
            onClick={() => window.print()}
          >
            <Printer size={18} />
            Imprimir
          </button>
        }
      />

      <section className="panel mb-6 p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-mint text-forest">
              <CalendarDays size={21} />
            </span>

            <div>
              <p className="font-black">Periodo del reporte</p>
              <p className="text-xs text-black/40">
                {formatDate(period.start)} — {formatDate(period.end)}
              </p>
            </div>
          </div>

          <div className="flex rounded-2xl bg-black/5 p-1">
            <button
              type="button"
              onClick={() => setPeriodType('weekly')}
              className={`rounded-xl px-5 py-2.5 text-sm font-black transition ${
                periodType === 'weekly'
                  ? 'bg-white shadow-sm'
                  : 'text-black/40'
              }`}
            >
              Semanal
            </button>

            <button
              type="button"
              onClick={() => setPeriodType('monthly')}
              className={`rounded-xl px-5 py-2.5 text-sm font-black transition ${
                periodType === 'monthly'
                  ? 'bg-white shadow-sm'
                  : 'text-black/40'
              }`}
            >
              Mensual
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos por ventas"
          value={formatMoney(revenue)}
          helper={`${periodSales.length} ventas registradas`}
          icon={TrendingUp}
        />

        <StatCard
          label="Costo de mercadería"
          value={formatMoney(cost)}
          helper="Costo de productos vendidos"
          icon={ShoppingBag}
          tone="amber"
        />

        <StatCard
          label="Gastos"
          value={formatMoney(expenseTotal)}
          helper={`${periodExpenses.length} gastos del periodo`}
          icon={ShoppingCart}
          tone="coral"
        />

        <StatCard
          label="Ganancia neta"
          value={formatMoney(netProfit)}
          helper={`${margin.toFixed(1)}% de margen neto`}
          icon={CircleDollarSign}
          tone="dark"
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm font-bold text-black/40">
            Ganancia bruta
          </p>
          <p className="mt-2 text-3xl font-black text-forest">
            {formatMoney(grossProfit)}
          </p>
          <p className="mt-2 text-xs text-black/40">
            Ventas menos costo de mercadería.
          </p>
        </article>

        <article className="panel p-5">
          <p className="text-sm font-bold text-black/40">
            Ganancia neta
          </p>
          <p
            className={`mt-2 text-3xl font-black ${
              netProfit >= 0 ? 'text-forest' : 'text-coral'
            }`}
          >
            {formatMoney(netProfit)}
          </p>
          <p className="mt-2 text-xs text-black/40">
            Ganancia después de descontar gastos.
          </p>
        </article>

        <article className="panel p-5">
          <p className="text-sm font-bold text-black/40">
            Unidades vendidas
          </p>
          <p className="mt-2 text-3xl font-black">
            {formatQuantity(unitsSold)}
          </p>
          <p className="mt-2 text-xs text-black/40">
            Productos movilizados durante el periodo.
          </p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                Productos que más salen
              </h2>
              <p className="mt-1 text-sm text-black/40">
                Mayor rotación del periodo seleccionado
              </p>
            </div>

            <span className="grid size-11 place-items-center rounded-2xl bg-amber/20 text-[#8c5c00]">
              <Trophy size={21} />
            </span>
          </div>

          {topProducts.length ? (
            <div className="space-y-5">
              {topProducts.map((item, index) => (
                <div key={item.product.id}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-black">
                        {index + 1}. {item.product.name}
                      </p>
                      <p className="text-xs text-black/40">
                        {formatQuantity(item.quantity)} vendidos ·{' '}
                        {formatMoney(item.revenue)}
                      </p>
                    </div>

                    <span className="badge bg-mint text-forest">
                      {formatQuantity(item.quantity)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{
                        width: `${Math.max(
                          (item.quantity / maxTopQuantity) * 100,
                          5
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Todavía no hay suficiente detalle de ventas para calcular los productos más vendidos." />
          )}
        </article>

        <article className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                Productos sin salida
              </h2>
              <p className="mt-1 text-sm text-black/40">
                No registraron ventas durante este periodo
              </p>
            </div>

            <span className="grid size-11 place-items-center rounded-2xl bg-coral/10 text-coral">
              <AlertTriangle size={21} />
            </span>
          </div>

          {noSalesProducts.length ? (
            <div className="space-y-3">
              {noSalesProducts.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-cream p-4"
                >
                  <div>
                    <p className="font-bold">{item.product.name}</p>
                    <p className="mt-1 text-xs text-black/40">
                      Stock: {formatQuantity(item.product.stock)} · Precio:{' '}
                      {formatMoney(item.product.salePrice)}
                    </p>
                  </div>

                  <span className="badge bg-coral/10 text-coral">
                    0 ventas
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-mint p-5 text-sm font-bold text-forest">
              Todos los productos activos registraron al menos una venta
              durante este periodo.
            </div>
          )}
        </article>
      </section>

      <section className="panel mt-6 p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">
              Productos con poca rotación
            </h2>
            <p className="mt-1 text-sm text-black/40">
              Productos que sí se venden, pero están por debajo del promedio
            </p>
          </div>

          <Boxes className="text-[#8c5c00]" />
        </div>

        {slowProducts.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {slowProducts.map((item) => (
              <div
                key={item.product.id}
                className="rounded-2xl border border-black/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{item.product.name}</p>
                    <p className="text-xs text-black/40">
                      Stock actual: {formatQuantity(item.product.stock)}
                    </p>
                  </div>

                  <span className="badge bg-amber/20 text-[#8c5c00]">
                    {formatQuantity(item.quantity)} vendidos
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-black/40">
            No hay productos de baja rotación identificados por ahora.
          </p>
        )}
      </section>

      <section className="panel mt-6 p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">
              Sugerencias de promociones
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-black/40">
              El sistema analiza costo, precio y rotación antes de proponer
              descuentos. El objetivo es aumentar las ventas sin vender por
              debajo del costo.
            </p>
          </div>

          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-forest">
            <Lightbulb size={21} />
          </span>
        </div>

        {promotionCandidates.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {promotionCandidates.map((item) => {
              const suggestion = buildPromotion(
                item.product,
                item.quantity
              );

              const unitCost = Number(
                item.product.unitCost ??
                  item.product.purchasePrice ??
                  0
              );

              const currentMargin =
                Number(item.product.salePrice) - unitCost;

              return (
                <article
                  key={item.product.id}
                  className="rounded-3xl border border-black/5 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{item.product.name}</p>
                      <p className="mt-1 text-xs text-black/40">
                        {item.quantity === 0
                          ? 'Sin ventas en el periodo'
                          : `${formatQuantity(
                              item.quantity
                            )} vendidos en el periodo`}
                      </p>
                    </div>

                    {suggestion.discount > 0 ? (
                      <span className="badge bg-mint text-forest">
                        <Percent size={13} />
                        {suggestion.discount}%
                      </span>
                    ) : (
                      <span className="badge bg-amber/20 text-[#8c5c00]">
                        Sin descuento
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-black/40">Costo</p>
                      <strong>{formatMoney(unitCost)}</strong>
                    </div>

                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-black/40">Precio</p>
                      <strong>{formatMoney(item.product.salePrice)}</strong>
                    </div>

                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-black/40">Margen</p>
                      <strong>{formatMoney(currentMargin)}</strong>
                    </div>
                  </div>

                  {suggestion.discount > 0 && (
                    <div className="mt-3 rounded-2xl bg-mint p-4">
                      <p className="text-xs font-bold text-forest/60">
                        Precio promocional sugerido
                      </p>
                      <p className="mt-1 text-2xl font-black text-forest">
                        {formatMoney(suggestion.promoPrice)}
                      </p>
                    </div>
                  )}

                  <p className="mt-4 text-sm leading-relaxed text-black/55">
                    {suggestion.message}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-black/40">
            Todavía no existen datos suficientes para sugerir promociones.
          </p>
        )}
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <h2 className="text-xl font-black">Ventas del periodo</h2>
          <p className="mt-1 text-sm text-black/40">
            Operaciones utilizadas para calcular este reporte
          </p>
        </div>

        {periodSales.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-cream text-xs uppercase text-black/40">
                <tr>
                  <th className="p-4">Venta</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Productos</th>
                  <th className="p-4">Pago</th>
                  <th className="p-4 text-right">Costo</th>
                  <th className="p-4 text-right">Venta</th>
                  <th className="p-4 text-right">Ganancia bruta</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/5">
                {[...periodSales].reverse().map((sale) => {
                  const saleCost = Number(sale.cost || 0);

                  return (
                    <tr key={sale.id}>
                      <td className="p-4 font-bold">{sale.number}</td>
                      <td className="p-4">{formatDate(sale.date)}</td>
                      <td className="p-4">
                        {formatQuantity(sale.items)} unid.
                      </td>
                      <td className="p-4">
                        <span className="badge bg-mint text-forest">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {formatMoney(saleCost)}
                      </td>
                      <td className="p-4 text-right font-black">
                        {formatMoney(sale.total)}
                      </td>
                      <td className="p-4 text-right font-black text-forest">
                        {formatMoney(Number(sale.total) - saleCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No existen ventas en el periodo seleccionado." />
        )}
      </section>
    </>
  );
}
