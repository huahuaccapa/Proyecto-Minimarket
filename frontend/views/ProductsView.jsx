'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Barcode } from 'lucide-react';
import { Modal, PageTitle } from '../components/ui';
import { formatMoney } from '../data/mock';

const empty = { barcode: '', name: '', category: 'Abarrotes', purchasePrice: '', salePrice: '', stock: '', minStock: '5', unit: 'unidad', active: true };

export default function ProductsView({ products, onSave }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.barcode} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const open = (product = empty) => setEditing({ ...product });
  const submit = async (event) => { event.preventDefault(); await onSave({ ...editing, purchasePrice: Number(editing.purchasePrice), salePrice: Number(editing.salePrice), stock: Number(editing.stock), minStock: Number(editing.minStock) }); setEditing(null); };

  return (
    <>
      <PageTitle eyebrow="Catálogo" title="Productos" description="Administra códigos, precios, categorías y existencias." action={<button className="btn-primary" onClick={() => open()}><Plus size={18} /> Nuevo producto</button>} />
      <section className="panel overflow-hidden">
        <div className="border-b border-black/5 p-5"><div className="relative max-w-md"><Search className="absolute left-4 top-3.5 text-black/30" size={19} /><input className="field pl-11" placeholder="Buscar por nombre, código o categoría" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-cream text-xs uppercase tracking-wider text-black/40"><tr><th className="p-4">Producto</th><th className="p-4">Categoría</th><th className="p-4">Compra</th><th className="p-4">Venta</th><th className="p-4">Stock</th><th className="p-4">Estado</th><th className="p-4"></th></tr></thead><tbody className="divide-y divide-black/5">{filtered.map((product) => <tr key={product.id} className="hover:bg-cream/60"><td className="p-4"><p className="font-bold">{product.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-black/35"><Barcode size={13} />{product.barcode}</p></td><td className="p-4">{product.category}</td><td className="p-4">{formatMoney(product.purchasePrice)}</td><td className="p-4 font-black">{formatMoney(product.salePrice)}</td><td className="p-4"><span className={`badge ${product.stock <= product.minStock ? 'bg-coral/10 text-coral' : 'bg-mint text-forest'}`}>{product.stock} {product.unit}</span></td><td className="p-4"><span className="badge bg-black/5 text-black/55">{product.active ? 'Activo' : 'Inactivo'}</span></td><td className="p-4"><button className="rounded-xl p-2 hover:bg-black/5" onClick={() => open(product)}><Pencil size={17} /></button></td></tr>)}</tbody></table></div>
      </section>

      {editing && <Modal title={editing.id ? 'Editar producto' : 'Nuevo producto'} onClose={() => setEditing(null)}><form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}><label className="sm:col-span-2 text-sm font-bold">Nombre<input required className="field mt-2" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label><label className="text-sm font-bold">Código de barras<input required className="field mt-2" value={editing.barcode} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} /></label><label className="text-sm font-bold">Categoría<input required className="field mt-2" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label><label className="text-sm font-bold">Precio de compra<input required min="0" step="0.01" type="number" className="field mt-2" value={editing.purchasePrice} onChange={(e) => setEditing({ ...editing, purchasePrice: e.target.value })} /></label><label className="text-sm font-bold">Precio de venta<input required min="0" step="0.01" type="number" className="field mt-2" value={editing.salePrice} onChange={(e) => setEditing({ ...editing, salePrice: e.target.value })} /></label><label className="text-sm font-bold">Stock inicial<input required min="0" type="number" className="field mt-2" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></label><label className="text-sm font-bold">Stock mínimo<input required min="0" type="number" className="field mt-2" value={editing.minStock} onChange={(e) => setEditing({ ...editing, minStock: e.target.value })} /></label><div className="sm:col-span-2 flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Guardar producto</button></div></form></Modal>}
    </>
  );
}
