'use client';

import { Printer, TrendingUp, ShoppingBag, CircleDollarSign } from 'lucide-react';
import { PageTitle, StatCard } from '../components/ui';
import { formatDate, formatMoney } from '../data/mock';

export default function ReportsView({ sales, expenses }) {
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cost = sales.reduce((sum, sale) => sum + Number(sale.cost || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const profit = revenue - cost - expenseTotal;
  return <><PageTitle eyebrow="Resultados" title="Reportes" description="Resumen de ingresos, costos, gastos y operaciones realizadas." action={<button className="btn-secondary no-print" onClick={() => window.print()}><Printer size={18} /> Imprimir</button>} /><section className="grid gap-4 sm:grid-cols-3"><StatCard label="Ingresos" value={formatMoney(revenue)} helper="Total vendido" icon={TrendingUp} /><StatCard label="Gastos" value={formatMoney(expenseTotal)} helper="Salidas registradas" icon={ShoppingBag} tone="coral" /><StatCard label="Ganancia estimada" value={formatMoney(profit)} helper="Ingreso − costo − gastos" icon={CircleDollarSign} tone="dark" /></section><section className="panel mt-6 overflow-hidden"><div className="border-b border-black/5 p-5"><h2 className="text-xl font-black">Historial de ventas</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-cream text-xs uppercase text-black/40"><tr><th className="p-4">Venta</th><th className="p-4">Fecha</th><th className="p-4">Productos</th><th className="p-4">Pago</th><th className="p-4 text-right">Total</th></tr></thead><tbody className="divide-y divide-black/5">{[...sales].reverse().map((sale) => <tr key={sale.id}><td className="p-4 font-bold">{sale.number}</td><td className="p-4">{formatDate(sale.date)}</td><td className="p-4">{sale.items} unid.</td><td className="p-4"><span className="badge bg-mint text-forest">{sale.paymentMethod}</span></td><td className="p-4 text-right font-black">{formatMoney(sale.total)}</td></tr>)}</tbody></table></div></section></>;
}
