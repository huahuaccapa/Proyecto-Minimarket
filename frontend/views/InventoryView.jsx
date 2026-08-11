'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { Modal, PageTitle } from '../components/ui';

export default function InventoryView({ products, onAdjust }) {
  const [adjustment, setAdjustment] = useState(null);
  const submit = async (event) => { event.preventDefault(); await onAdjust({ productId: adjustment.productId, type: adjustment.type, quantity: Number(adjustment.quantity), reason: adjustment.reason }); setAdjustment(null); };
  const open = (product) => setAdjustment({ productId: product.id, productName: product.name, type: 'entrada', quantity: 1, reason: '' });

  return (
    <>
      <PageTitle eyebrow="Control de existencias" title="Inventario" description="Revisa las unidades disponibles y registra entradas, salidas o correcciones." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => { const low = product.stock <= product.minStock; return <article key={product.id} className="panel p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-black/35">{product.category}</p><h2 className="mt-1 font-black">{product.name}</h2><p className="mt-1 text-xs text-black/40">{product.barcode}</p></div>{low && <span className="grid size-10 place-items-center rounded-2xl bg-coral/10 text-coral"><AlertTriangle size={19} /></span>}</div><div className="mt-7 flex items-end justify-between"><div><p className="text-4xl font-black">{product.stock}</p><p className="text-xs text-black/40">{product.unit}(s) disponibles</p></div><button className="btn-secondary px-3 py-2 text-xs" onClick={() => open(product)}><SlidersHorizontal size={15} /> Ajustar</button></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-black/5"><div className={`h-full rounded-full ${low ? 'bg-coral' : 'bg-forest'}`} style={{ width: `${Math.min((product.stock / Math.max(product.minStock * 3, 1)) * 100, 100)}%` }} /></div><p className={`mt-2 text-xs font-bold ${low ? 'text-coral' : 'text-black/35'}`}>{low ? `Reponer: mínimo ${product.minStock}` : `Nivel mínimo: ${product.minStock}`}</p></article>; })}</section>
      {adjustment && <Modal title="Ajustar inventario" onClose={() => setAdjustment(null)}><form onSubmit={submit}><p className="mb-5 rounded-2xl bg-mint p-4 font-bold text-forest">{adjustment.productName}</p><label className="text-sm font-bold">Tipo de movimiento</label><div className="mt-2 grid grid-cols-2 gap-3"><button type="button" onClick={() => setAdjustment({ ...adjustment, type: 'entrada' })} className={`rounded-2xl border p-4 text-sm font-bold ${adjustment.type === 'entrada' ? 'border-forest bg-mint text-forest' : 'border-black/10'}`}><ArrowDownToLine className="mx-auto mb-2" />Entrada</button><button type="button" onClick={() => setAdjustment({ ...adjustment, type: 'salida' })} className={`rounded-2xl border p-4 text-sm font-bold ${adjustment.type === 'salida' ? 'border-coral bg-coral/10 text-coral' : 'border-black/10'}`}><ArrowUpFromLine className="mx-auto mb-2" />Salida</button></div><label className="mt-5 block text-sm font-bold">Cantidad<input required min="1" type="number" className="field mt-2" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })} /></label><label className="mt-5 block text-sm font-bold">Motivo<input required className="field mt-2" placeholder="Compra, merma, corrección..." value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} /></label><button className="btn-primary mt-6 w-full">Guardar ajuste</button></form></Modal>}
    </>
  );
}
