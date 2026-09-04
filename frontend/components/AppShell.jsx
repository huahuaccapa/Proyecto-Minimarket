'use client';

import { useState } from 'react';
import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScanBarcode,
  Settings,
  ShoppingBasket,
  Tags,
  Truck,
  WalletCards,
  Warehouse,
  Wifi,
  WifiOff,
  X,
  CircleDollarSign,
} from 'lucide-react';

const items = [
  ['dashboard', 'Resumen', LayoutDashboard, ['Administrador']],
  ['pos', 'Caja y ventas', ScanBarcode, ['Administrador', 'Vendedora']],
  ['cash', 'Caja actual', CircleDollarSign, ['Administrador']],
  ['products', 'Productos', Package, ['Administrador']],
  ['categories', 'Categorías', FolderTree, ['Administrador']],
  ['brands', 'Marcas', Tags, ['Administrador']],
  ['inventory', 'Inventario', Warehouse, ['Administrador']],
  ['purchases', 'Compras', Truck, ['Administrador']],
  ['expenses', 'Gastos', WalletCards, ['Administrador']],
  ['reports', 'Reportes', BarChart3, ['Administrador']],
  ['settings', 'Configuración', Settings, ['Administrador']],
];

export default function AppShell({
  active,
  setActive,
  online,
  user,
  onLogout,
  children,
}) {
  const [open, setOpen] = useState(false);

  const navigate = (id) => {
    setActive(id);
    setOpen(false);
  };

  const allowedItems = items.filter(([, , , roles]) =>
    roles.includes(user.role)
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {open && (
        <button
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-ink p-5 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto ${
          open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-white text-forest">
              <ShoppingBasket size={21} />
            </span>

            <div>
              <p className="font-black">Minimarket</p>
              <p className="text-xs text-white/40">Mamá</p>
            </div>
          </div>

          <button
            className="p-2 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-1.5">
          {allowedItems.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                active === id
                  ? 'bg-white text-ink'
                  : 'text-white/55 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-bold">{user.name}</p>
          <p className="mt-1 text-xs text-white/40">{user.role}</p>

          <button
            className="mt-4 flex items-center gap-2 text-xs font-bold text-coral"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-black/5 bg-cream/90 px-4 backdrop-blur-xl sm:px-8">
          <button
            className="rounded-xl p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>

          <div className="hidden lg:block">
            <p className="text-xs font-bold text-black/35">
              Panel administrativo
            </p>
            <p className="font-black">Buenas tardes, {user.name}</p>
          </div>

          <div
            className={`ml-auto flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
              online
                ? 'bg-mint text-forest'
                : 'bg-amber/20 text-[#8c5c00]'
            }`}
          >
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            {online ? 'Servidor conectado' : 'Modo demostración'}
          </div>
        </header>

        <main className="p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
