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
  Users,
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
    roles: [
      'Administrador',
    ],
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
    id: 'customers',
    label: 'Clientes',
    icon: Users,
    roles: [
      'Administrador',
      'Vendedora',
    ],
  },

  {
    id: 'cash',
    label: 'Caja actual',
    icon: CircleDollarSign,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'products',
    label: 'Productos',
    icon: Package,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'categories',
    label: 'Categorías',
    icon: FolderTree,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'brands',
    label: 'Marcas',
    icon: Tags,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'inventory',
    label: 'Inventario',
    icon: Warehouse,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'purchases',
    label: 'Compras',
    icon: Truck,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'expenses',
    label: 'Gastos',
    icon: WalletCards,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    roles: [
      'Administrador',
    ],
  },

  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    roles: [
      'Administrador',
    ],
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
  ] =
    useState(
      false,
    );

  const [
    collapsed,
    setCollapsed,
  ] =
    useState(
      false,
    );

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
    setActive(
      id,
    );

    setMobileOpen(
      false,
    );
  };

  const current =
    allowedItems.find(
      (item) =>
        item.id ===
        active,
    );

  return (
    <div
      className={`min-h-screen bg-[#f7f5ee] lg:grid ${
        collapsed
          ? 'lg:grid-cols-[88px_1fr]'
          : 'lg:grid-cols-[260px_1fr]'
      } transition-all duration-300`}
    >
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
                size={
                  22
                }
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

          {!collapsed && (
            <button
              type="button"
              className="grid size-9 place-items-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() =>
                setMobileOpen(
                  false,
                )
              }
            >
              <X
                size={
                  20
                }
              />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            {allowedItems.map(
              (
                item,
              ) => {
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
                      rounded-xl transition-all duration-150

                      ${
                        collapsed
                          ? 'justify-center px-2 py-3'
                          : 'gap-3 px-4 py-3'
                      }

                      ${
                        selected
                          ? 'bg-white text-[#12231d] shadow-sm'
                          : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      size={
                        19
                      }
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
                  </button>
                );
              },
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          {!collapsed && (
            <div className="mb-3 rounded-2xl bg-white/[0.06] p-3">
              <p className="truncate text-sm font-black">
                {
                  user.name
                }
              </p>

              <p className="mt-1 text-xs text-white/45">
                {
                  user.role
                }
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={
              onLogout
            }
            title={
              collapsed
                ? 'Cerrar sesión'
                : undefined
            }
            className={`
              flex w-full items-center rounded-xl
              text-white/60 transition
              hover:bg-white/[0.07]
              hover:text-white

              ${
                collapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-4 py-3'
              }
            `}
          >
            <LogOut
              size={
                18
              }
            />

            {!collapsed && (
              <span className="text-sm font-bold">
                Cerrar sesión
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            setCollapsed(
              (
                value,
              ) =>
                !value,
            )
          }
          className="absolute -right-3 top-[94px] hidden size-7 place-items-center rounded-full border border-black/10 bg-white text-black shadow-sm lg:grid"
        >
          {collapsed ? (
            <ChevronRight
              size={
                15
              }
            />
          ) : (
            <ChevronLeft
              size={
                15
              }
            />
          )}
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-black/5 bg-[#f7f5ee]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl bg-white shadow-sm lg:hidden"
              onClick={() =>
                setMobileOpen(
                  true,
                )
              }
            >
              <Menu
                size={
                  20
                }
              />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-black sm:text-base">
                {current?.label ||
                  'Minimarket Mamá'}
              </p>

              <p className="hidden text-xs text-black/40 sm:block">
                {user.name} ·{' '}
                {user.role}
              </p>
            </div>
          </div>

          <div
            className={`
              flex items-center gap-2 rounded-full
              px-3 py-1.5 text-xs font-bold

              ${
                online
                  ? 'bg-mint text-forest'
                  : 'bg-coral/10 text-coral'
              }
            `}
          >
            {online ? (
              <Wifi
                size={
                  14
                }
              />
            ) : (
              <WifiOff
                size={
                  14
                }
              />
            )}

            <span className="hidden sm:inline">
              {online
                ? 'Conectado'
                : 'Sin conexión'}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}