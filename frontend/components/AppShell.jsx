'use client';

import {
  useState,
} from 'react';

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
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
} from 'lucide-react';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Resumen',
    icon: LayoutDashboard,
    roles: ['Administrador'],
  },

  {
    id: 'pos',
    label: 'Caja y ventas',
    icon: ScanBarcode,
    roles: [
      'Administrador',
      'Vendedora',
    ],
  },

  {
    id: 'cash',
    label: 'Caja actual',
    icon: CircleDollarSign,
    roles: ['Administrador'],
  },

  {
    id: 'products',
    label: 'Productos',
    icon: Package,
    roles: ['Administrador'],
  },

  {
    id: 'categories',
    label: 'Categorías',
    icon: FolderTree,
    roles: ['Administrador'],
  },

  {
    id: 'brands',
    label: 'Marcas',
    icon: Tags,
    roles: ['Administrador'],
  },

  {
    id: 'inventory',
    label: 'Inventario',
    icon: Warehouse,
    roles: ['Administrador'],
  },

  {
    id: 'purchases',
    label: 'Compras',
    icon: Truck,
    roles: ['Administrador'],
  },

  {
    id: 'expenses',
    label: 'Gastos',
    icon: WalletCards,
    roles: ['Administrador'],
  },

  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    roles: ['Administrador'],
  },

  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    roles: ['Administrador'],
  },
];

export default function AppShell({
  active,
  setActive,
  online,
  user,
  onLogout,
  children,
}) {
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const allowedItems =
    menuItems.filter(
      (item) =>
        item.roles.includes(
          user.role,
        ),
    );

  const navigate = (
    id,
  ) => {
    setActive(id);

    setMobileOpen(false);
  };

  return (
    <div
      className={`min-h-screen bg-[#f7f5ee] lg:grid ${
        collapsed
          ? 'lg:grid-cols-[88px_1fr]'
          : 'lg:grid-cols-[260px_1fr]'
      } transition-all duration-300`}
    >
      {/* Fondo móvil */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() =>
            setMobileOpen(
              false,
            )
          }
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-screen flex-col
          bg-[#10251d] text-white
          shadow-2xl
          transition-all duration-300

          ${
            collapsed
              ? 'w-[88px]'
              : 'w-[260px]'
          }

          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }

          lg:sticky
          lg:top-0
          lg:translate-x-0
        `}
      >
        {/* CABECERA / LOGO */}
        <div
          className={`
            flex h-[78px] shrink-0 items-center
            border-b border-white/10
            ${
              collapsed
                ? 'justify-center px-3'
                : 'justify-between px-5'
            }
          `}
        >
          <button
            type="button"
            onClick={() =>
              navigate(
                user.role ===
                  'Vendedora'
                  ? 'pos'
                  : 'dashboard',
              )
            }
            className="flex min-w-0 items-center gap-3"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[#176b48] shadow-sm">
              <ShoppingBasket
                size={22}
              />
            </span>

            {!collapsed && (
              <div className="min-w-0 text-left">
                <p className="truncate text-[17px] font-black leading-tight">
                  Minimarket
                </p>

                <p className="mt-0.5 text-xs font-semibold text-white/45">
                  Mamá
                </p>
              </div>
            )}
          </button>

          {/* cerrar móvil */}
          {!collapsed && (
            <button
              type="button"
              className="grid size-9 place-items-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() =>
                setMobileOpen(
                  false,
                )
              }
            >
              <X
                size={20}
              />
            </button>
          )}
        </div>

        {/* MENÚ CON SCROLL PROPIO */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]">
          <nav className="space-y-1">
            {allowedItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const selected =
                  active ===
                  item.id;

                return (
                  <button
                    type="button"
                    key={
                      item.id
                    }
                    title={
                      collapsed
                        ? item.label
                        : undefined
                    }
                    onClick={() =>
                      navigate(
                        item.id,
                      )
                    }
                    className={`
                      group relative flex w-full items-center
                      rounded-xl
                      transition-all duration-150

                      ${
                        collapsed
                          ? 'justify-center px-2 py-3'
                          : 'gap-3 px-4 py-3'
                      }

                      ${
                        selected
                          ? 'bg-white text-[#12231d] shadow-sm'
                          : 'text-white/58 hover:bg-white/[0.07] hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      size={19}
                      strokeWidth={
                        selected
                          ? 2.3
                          : 1.9
                      }
                      className="shrink-0"
                    />

                    {!collapsed && (
                      <span className="truncate text-[14px] font-bold">
                        {
                          item.label
                        }
                      </span>
                    )}

                    {selected &&
                      !collapsed && (
                        <span className="ml-auto size-1.5 rounded-full bg-[#1e7653]" />
                      )}

                    {/* Tooltip al colapsar */}
                    {collapsed && (
                      <span
                        className="
                          pointer-events-none
                          absolute left-[72px] z-[80]
                          hidden whitespace-nowrap
                          rounded-lg bg-[#0b1712]
                          px-3 py-2
                          text-xs font-bold text-white
                          shadow-xl
                          group-hover:block
                        "
                      >
                        {
                          item.label
                        }
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </nav>
        </div>

        {/* USUARIO SIEMPRE VISIBLE */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {!collapsed ? (
            <div className="rounded-2xl bg-white/[0.06] p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-black">
                  {String(
                    user.name ||
                      'U',
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">
                    {
                      user.name
                    }
                  </p>

                  <p className="mt-0.5 truncate text-[11px] font-semibold text-white/40">
                    {
                      user.role
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  onLogout
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-xs font-black text-[#ff8b7b] transition hover:bg-[#ff6f61]/10"
              >
                <LogOut
                  size={16}
                />

                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              type="button"
              title="Cerrar sesión"
              onClick={
                onLogout
              }
              className="grid w-full place-items-center rounded-xl py-3 text-[#ff8b7b] transition hover:bg-white/[0.06]"
            >
              <LogOut
                size={19}
              />
            </button>
          )}

          {/* BOTÓN COLAPSAR DESKTOP */}
          <button
            type="button"
            title={
              collapsed
                ? 'Expandir menú'
                : 'Reducir menú'
            }
            onClick={() =>
              setCollapsed(
                (
                  current,
                ) =>
                  !current,
              )
            }
            className="
              mt-2 hidden w-full items-center justify-center
              gap-2 rounded-xl py-2
              text-xs font-bold text-white/35
              transition hover:bg-white/[0.05] hover:text-white
              lg:flex
            "
          >
            {collapsed ? (
              <ChevronRight
                size={17}
              />
            ) : (
              <>
                <ChevronLeft
                  size={17}
                />

                Reducir menú
              </>
            )}
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="min-w-0">
        {/* HEADER */}
        <header
          className="
            sticky top-0 z-30
            flex h-[78px] items-center
            border-b border-black/[0.05]
            bg-[#f7f5ee]/95 px-4
            backdrop-blur-xl
            sm:px-7 lg:px-8
          "
        >
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() =>
              setMobileOpen(
                true,
              )
            }
            className="mr-3 grid size-10 place-items-center rounded-xl border border-black/5 bg-white shadow-sm lg:hidden"
          >
            <Menu
              size={20}
            />
          </button>

          <div className="min-w-0">
            <p className="hidden text-[11px] font-bold text-black/35 sm:block">
              Panel
              administrativo
            </p>

            <p className="truncate text-base font-black sm:text-lg">
              Hola,{' '}
              {user.name}
            </p>
          </div>

          <div
            className={`
              ml-auto flex shrink-0 items-center
              gap-2 rounded-full px-3 py-2
              text-xs font-black
              ${
                online
                  ? 'bg-[#dff3e8] text-[#1c6b4b]'
                  : 'bg-[#fff0d5] text-[#966000]'
              }
            `}
          >
            {online ? (
              <Wifi
                size={15}
              />
            ) : (
              <WifiOff
                size={15}
              />
            )}

            <span className="hidden sm:inline">
              {online
                ? 'Servidor conectado'
                : 'Servidor desconectado'}
            </span>
          </div>
        </header>

        {/* CUERPO */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}