'use client';

import { Banknote, CircleDollarSign, Package, ShoppingCart, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageTitle, StatCard } from '../components/ui';
import { formatMoney } from '../data/mock';

export default function DashboardView({ products, sales, expenses, onNavigate }) {
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cost = sales.reduce((sum, sale) => sum + Number(sale.cost || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const profit = revenue - cost - expenseTotal;
  const lowStock = products.filter((product) => product.stock <= product.minStock);
  const max = Math.max(...sales.map((sale) => sale.total), 1);

  return (
    <>
      <PageTitle eyebrow="Vista general" title="Así va el negocio hoy" description="Una lectura rápida de las ventas, ganancias e inventario del minimarket." action={<button className="btn-primary" onClick={() => onNavigate('pos')}><ShoppingCart size={18} /> Nueva venta</button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas de hoy" value={formatMoney(revenue)} helper={`${sales.length} operaciones registradas`} icon={Banknote} />
        <StatCard label="Ganancia estimada" value={formatMoney(profit)} helper="Ventas menos costos y gastos" icon={CircleDollarSign} tone="dark" />
        <StatCard label="Productos activos" value={products.length} helper={`${lowStock.length} requieren reposición`} icon={Package} tone="amber" />
        <StatCard label="Gastos registrados" value={formatMoney(expenseTotal)} helper={`${expenses.length} movimientos`} icon={ShoppingCart} tone="coral" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="panel p-5 sm:p-7">
          <div className="mb-7 flex items-center justify-between"><div><h2 className="text-xl font-black">Actividad de ventas</h2><p className="mt-1 text-sm text-black/40">Importe de las operaciones recientes</p></div><span className="badge bg-mint text-forest">Hoy</span></div>
          <div className="flex h-56 items-end gap-4 border-b border-black/10 px-2">
            {sales.slice(-7).map((sale) => (
              <div key={sale.id} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold text-black/45">{formatMoney(sale.total)}</span><div className="w-full max-w-16 rounded-t-2xl bg-forest transition hover:bg-coral" style={{ height: `${Math.max((sale.total / max) * 150, 18)}px` }} /><span className="pb-3 text-xs text-black/35">{sale.number?.replace('V-', '#')}</span></div>
            ))}
          </div>
        </article>

        <article className="panel p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">Stock por reponer</h2><p className="mt-1 text-sm text-black/40">Productos bajo el mínimo</p></div><span className="grid size-10 place-items-center rounded-2xl bg-coral/10 text-coral"><AlertTriangle size={20} /></span></div>
          <div className="space-y-3">
            {lowStock.slice(0, 5).map((product) => <div key={product.id} className="flex items-center justify-between rounded-2xl bg-cream p-4"><div><p className="text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-black/40">Mínimo: {product.minStock}</p></div><span className="badge bg-coral/10 text-coral">{product.stock} unid.</span></div>)}
          </div>
          <button className="mt-5 flex items-center gap-2 text-sm font-black text-forest" onClick={() => onNavigate('inventory')}>Revisar inventario <ArrowRight size={16} /></button>
        </article>
      </section>
    </>
  );
}
