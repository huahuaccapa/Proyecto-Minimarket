'use client';

import { useMemo, useRef, useState } from 'react';
import { ScanBarcode, Search, Minus, Plus, Trash2, Wallet, Banknote, Smartphone, CreditCard, CheckCircle2 } from 'lucide-react';
import { PageTitle, EmptyState } from '../components/ui';
import { formatMoney } from '../data/mock';

export default function PosView({ products, onCheckout }) {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [received, setReceived] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0), [cart]);
  const change = Math.max(Number(received || 0) - total, 0);

  const addProduct = (product) => {
    if (!product) { setMessage('No encontramos ese código. Registra primero el producto.'); return; }
    if (product.stock <= 0) { setMessage('Este producto no tiene stock disponible.'); return; }
    const step = product.saleUnit === 'kg' ? 0.25 : 1;
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(Number((item.quantity + step).toFixed(3)), item.stock) } : item);
      return [...current, { ...product, quantity: Math.min(step, product.stock) }];
    });
    setBarcode(''); setMessage(`${product.name} agregado`); inputRef.current?.focus();
  };

  const scan = (event) => {
    event.preventDefault();
    addProduct(products.find((product) => product.barcode === barcode.trim()));
  };

  const quantity = (id, direction) => setCart((current) => current.map((item) => {
    if (item.id !== id) return item;
    const step = item.saleUnit === 'kg' ? 0.25 : 1;
    const minimum = step;
    return { ...item, quantity: Math.max(minimum, Math.min(item.stock, Number((item.quantity + direction * step).toFixed(3)))) };
  }));

  const setExactQuantity = (id, value) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(item.stock, Math.max(item.saleUnit === 'kg' ? 0.001 : 1, Number(value) || 0)) } : item));

  const confirm = async () => {
    if (!cart.length) return;
    if (paymentMethod === 'Efectivo' && Number(received || 0) < total) { setMessage('El efectivo recibido es menor al total.'); return; }
    const result = await onCheckout({ items: cart.map(({ id, quantity }) => ({ productId: id, quantity })), paymentMethod, received: Number(received || total) });
    setCart([]); setReceived(''); setMessage(`Venta ${result?.number || ''} registrada correctamente`); inputRef.current?.focus();
  };

  return (
    <>
      <PageTitle eyebrow="Punto de venta" title="Caja rápida" description="Escanea el código, revisa el pedido y cobra sin hacer cálculos manuales." />
      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <section className="space-y-5">
          <form className="panel p-5" onSubmit={scan}>
            <label className="text-sm font-black">Escanear código de barras</label>
            <div className="mt-3 flex gap-3"><div className="relative flex-1"><ScanBarcode className="absolute left-4 top-3.5 text-forest" /><input ref={inputRef} autoFocus className="field pl-12 text-lg font-bold" placeholder="Escanea o escribe el código" value={barcode} onChange={(e) => setBarcode(e.target.value)} /></div><button className="btn-primary" type="submit"><Search size={18} /><span className="hidden sm:inline">Buscar</span></button></div>
            {message && <p className="mt-3 text-sm font-bold text-forest">{message}</p>}
            <div className="mt-4 flex flex-wrap gap-2">{products.slice(0, 4).map((product) => <button key={product.id} type="button" className="rounded-full bg-cream px-3 py-2 text-xs font-bold hover:bg-mint" onClick={() => addProduct(product)}>{product.name}</button>)}</div>
          </form>

          <section className="panel overflow-hidden">
            <div className="border-b border-black/5 p-5"><h2 className="text-lg font-black">Productos de la venta</h2><p className="text-sm text-black/40">{cart.length} productos agregados</p></div>
            {!cart.length ? <EmptyState text="Escanea un producto para comenzar la venta" /> : <div className="divide-y divide-black/5">{cart.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-black/40">{item.barcode} · {formatMoney(item.salePrice)} por {item.saleUnit === 'kg' ? 'kg' : 'unidad'}</p></div><div className="flex items-center gap-2"><button className="grid size-8 place-items-center rounded-xl bg-cream" onClick={() => quantity(item.id, -1)}><Minus size={15} /></button><input aria-label={`Cantidad de ${item.name}`} className="w-16 rounded-xl border border-black/10 px-2 py-1.5 text-center font-black" type="number" min={item.saleUnit === 'kg' ? '0.001' : '1'} max={item.stock} step={item.saleUnit === 'kg' ? '0.001' : '1'} value={item.quantity} onChange={(event) => setExactQuantity(item.id, event.target.value)} /><button className="grid size-8 place-items-center rounded-xl bg-cream" onClick={() => quantity(item.id, 1)}><Plus size={15} /></button><span className="text-xs text-black/40">{item.saleUnit === 'kg' ? 'kg' : 'un.'}</span></div><div className="flex items-center justify-end gap-3"><span className="min-w-20 text-right font-black">{formatMoney(item.salePrice * item.quantity)}</span><button className="text-coral" onClick={() => setCart(cart.filter((product) => product.id !== item.id))}><Trash2 size={18} /></button></div></div>)}</div>}
          </section>
        </section>

        <aside className="panel h-fit overflow-hidden xl:sticky xl:top-28">
          <div className="bg-ink p-6 text-white"><div className="flex items-center gap-2 text-white/50"><Wallet size={18} /><span className="text-sm font-bold">Total a cobrar</span></div><p className="mt-2 text-5xl font-black tracking-tight">{formatMoney(total)}</p></div>
          <div className="p-6">
            <p className="text-sm font-black">Medio de pago</p>
            <div className="mt-3 grid grid-cols-3 gap-2">{[['Efectivo', Banknote], ['Yape', Smartphone], ['Tarjeta', CreditCard]].map(([method, Icon]) => <button key={method} onClick={() => setPaymentMethod(method)} className={`rounded-2xl border p-3 text-xs font-bold ${paymentMethod === method ? 'border-forest bg-mint text-forest' : 'border-black/10'}`}><Icon className="mx-auto mb-1" size={19} />{method}</button>)}</div>
            {paymentMethod === 'Efectivo' && <><label className="mt-5 block text-sm font-black">Efectivo recibido</label><input className="field mt-2" inputMode="decimal" placeholder="S/ 0.00" value={received} onChange={(e) => setReceived(e.target.value)} /><div className="mt-3 flex justify-between rounded-2xl bg-cream p-4 text-sm"><span className="text-black/50">Vuelto</span><strong>{formatMoney(change)}</strong></div></>}
            <button className="btn-primary mt-6 w-full py-4" disabled={!cart.length} onClick={confirm}><CheckCircle2 size={20} /> Confirmar venta</button>
          </div>
        </aside>
      </div>
    </>
  );
}