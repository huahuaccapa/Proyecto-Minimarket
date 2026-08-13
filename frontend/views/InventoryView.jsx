'use client';

import { useMemo, useState } from 'react';

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  CircleCheck,
  Eye,
  PackageX,
  SlidersHorizontal,
} from 'lucide-react';

import {
  Modal,
  PageTitle,
} from '../components/ui';

import {
  formatMoney,
  formatQuantity,
} from '../data/mock';

import {
  formatExpirationDate,
  getExpiryStatus,
} from '../lib/expiry';

export default function InventoryView({
  products,
  categories = [],
  brands = [],
  onAdjust,
}) {
  const [adjustment, setAdjustment] =
    useState(null);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const expirySummary = useMemo(
    () =>
      products.reduce(
        (summary, product) => {
          const expiry =
            getExpiryStatus(
              product.expirationDate
            );

          if (
            expiry.status === 'expired'
          ) {
            summary.expired += 1;
          }

          if (
            expiry.status === 'expiring'
          ) {
            summary.expiring += 1;
          }

          return summary;
        },
        {
          expired: 0,
          expiring: 0,
        }
      ),
    [products]
  );

  const submit = async (event) => {
    event.preventDefault();

    await onAdjust({
      productId:
        adjustment.productId,

      type: adjustment.type,

      quantity: Number(
        adjustment.quantity
      ),

      reason: adjustment.reason,
    });

    setAdjustment(null);
  };

  const open = (product) => {
    setAdjustment({
      productId: product.id,
      productName: product.name,
      type: 'entrada',
      quantity: 1,
      reason: '',
    });
  };

  const categoryName = (product) =>
    product.category ||
    categories.find(
      (item) =>
        item.id === product.categoryId
    )?.name ||
    'Sin categoría';

  const brandName = (product) =>
    product.brand ||
    brands.find(
      (item) =>
        item.id === product.brandId
    )?.name ||
    'Sin marca';

  const unitName = (product) =>
    (
      product.saleUnit ||
      product.unit
    ) === 'kg'
      ? 'kg'
      : 'unidades';

  const profitPercentage = (
    product
  ) => {
    const cost = Number(
      product.unitCost ??
        product.purchasePrice ??
        0
    );

    const price = Number(
      product.salePrice || 0
    );

    return cost > 0
      ? ((price - cost) / cost) * 100
      : 0;
  };

  return (
    <>
      <PageTitle
        eyebrow="Control de existencias"
        title="Inventario"
        description="Revisa existencias, lotes, registros sanitarios y productos próximos a vencer."
      />

      {(expirySummary.expired > 0 ||
        expirySummary.expiring > 0) && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          {expirySummary.expired >
            0 && (
            <article className="flex items-center gap-4 rounded-3xl border border-coral/20 bg-coral/10 p-5 text-coral">
              <PackageX size={28} />

              <div>
                <p className="font-black">
                  {expirySummary.expired}{' '}
                  producto
                  {expirySummary.expired ===
                  1
                    ? ''
                    : 's'}{' '}
                  vencido
                  {expirySummary.expired ===
                  1
                    ? ''
                    : 's'}
                </p>

                <p className="mt-1 text-xs text-black/55">
                  Revisa los lotes antes
                  de realizar una venta.
                </p>
              </div>
            </article>
          )}

          {expirySummary.expiring >
            0 && (
            <article className="flex items-center gap-4 rounded-3xl border border-amber/40 bg-amber/15 p-5 text-[#8c5c00]">
              <CalendarClock size={28} />

              <div>
                <p className="font-black">
                  {expirySummary.expiring}{' '}
                  producto
                  {expirySummary.expiring ===
                  1
                    ? ''
                    : 's'}{' '}
                  por vencer
                </p>

                <p className="mt-1 text-xs text-black/55">
                  Su fecha de vencimiento
                  está dentro de los
                  próximos 2 meses.
                </p>
              </div>
            </article>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const low =
            product.stock <=
            product.minStock;

          const expiry =
            getExpiryStatus(
              product.expirationDate
            );

          const expiryTone = {
            expired:
              'bg-coral/10 text-coral',

            expiring:
              'bg-amber/20 text-[#8c5c00]',

            valid:
              'bg-mint text-forest',

            none:
              'bg-black/5 text-black/45',
          }[expiry.status];

          return (
            <article
              key={product.id}
              className={`panel p-5 ${
                expiry.status === 'expired'
                  ? 'border-coral/30'
                  : expiry.status ===
                      'expiring'
                    ? 'border-amber/50'
                    : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-black/35">
                    {categoryName(product)}
                  </p>

                  <h2 className="mt-1 font-black">
                    {product.name}
                  </h2>

                  <p className="mt-1 text-xs text-black/40">
                    {product.barcode}
                  </p>
                </div>

                {low && (
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-coral/10 text-coral">
                    <AlertTriangle
                      size={19}
                    />
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`badge ${expiryTone}`}
                >
                  {expiry.label}
                </span>

                {product.lot && (
                  <span className="badge bg-black/5 text-black/55">
                    Lote: {product.lot}
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-4xl font-black">
                    {formatQuantity(
                      product.stock
                    )}
                  </p>

                  <p className="text-xs text-black/40">
                    {unitName(product)}{' '}
                    disponibles
                  </p>
                </div>

                <button
                  className="btn-secondary px-3 py-2 text-xs"
                  onClick={() =>
                    open(product)
                  }
                >
                  <SlidersHorizontal
                    size={15}
                  />

                  Ajustar
                </button>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/5">
                <div
                  className={`h-full rounded-full ${
                    low
                      ? 'bg-coral'
                      : 'bg-forest'
                  }`}
                  style={{
                    width: `${Math.min(
                      (product.stock /
                        Math.max(
                          product.minStock *
                            3,
                          1
                        )) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p
                className={`mt-2 text-xs font-bold ${
                  low
                    ? 'text-coral'
                    : 'text-black/35'
                }`}
              >
                {low
                  ? `Reponer: mínimo ${formatQuantity(
                      product.minStock
                    )} ${unitName(product)}`
                  : `Nivel mínimo: ${formatQuantity(
                      product.minStock
                    )} ${unitName(product)}`}
              </p>

              <button
                className="btn-secondary mt-4 w-full px-3 py-2 text-xs"
                onClick={() =>
                  setSelectedProduct(
                    product
                  )
                }
              >
                <Eye size={15} />
                Ver detalles
              </button>
            </article>
          );
        })}
      </section>

      {selectedProduct &&
        (() => {
          const expiry =
            getExpiryStatus(
              selectedProduct.expirationDate
            );

          const detailItems = [
            [
              'Código de barras',
              selectedProduct.barcode ||
                'No registrado',
            ],

            [
              'Categoría',
              categoryName(
                selectedProduct
              ),
            ],

            [
              'Marca',
              brandName(
                selectedProduct
              ),
            ],

            [
              'Lote',
              selectedProduct.lot ||
                'No registrado',
            ],

            [
              'Registro sanitario',
              selectedProduct.sanitaryRegistration ||
                'No registrado',
            ],

            [
              'Fecha de vencimiento',
              formatExpirationDate(
                selectedProduct.expirationDate
              ),
            ],

            [
              'Presentación de compra',
              selectedProduct.purchasePresentation ||
                'unidad',
            ],

            [
              'Contenido por presentación',
              `${formatQuantity(
                selectedProduct.contentQuantity ||
                  1
              )} ${unitName(
                selectedProduct
              )}`,
            ],

            [
              'Precio de compra',
              formatMoney(
                selectedProduct.purchasePrice
              ),
            ],

            [
              'Costo real unitario',
              formatMoney(
                selectedProduct.unitCost ??
                  selectedProduct.purchasePrice
              ),
            ],

            [
              'Precio de venta',
              formatMoney(
                selectedProduct.salePrice
              ),
            ],

            [
              'Ganancia',
              `${profitPercentage(
                selectedProduct
              ).toFixed(2)}%`,
            ],

            [
              'Stock actual',
              `${formatQuantity(
                selectedProduct.stock
              )} ${unitName(
                selectedProduct
              )}`,
            ],

            [
              'Stock mínimo',
              `${formatQuantity(
                selectedProduct.minStock
              )} ${unitName(
                selectedProduct
              )}`,
            ],
          ];

          return (
            <Modal
              title="Detalle del producto"
              onClose={() =>
                setSelectedProduct(null)
              }
              wide
            >
              <div className="rounded-2xl bg-white p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-black/35">
                      Información completa
                    </p>

                    <h3 className="mt-1 text-2xl font-black">
                      {
                        selectedProduct.name
                      }
                    </h3>
                  </div>

                  <span
                    className={`badge ${
                      expiry.status ===
                      'expired'
                        ? 'bg-coral/10 text-coral'
                        : expiry.status ===
                            'expiring'
                          ? 'bg-amber/20 text-[#8c5c00]'
                          : expiry.status ===
                              'valid'
                            ? 'bg-mint text-forest'
                            : 'bg-black/5 text-black/45'
                    }`}
                  >
                    {expiry.status ===
                      'valid' && (
                      <CircleCheck
                        className="mr-1"
                        size={14}
                      />
                    )}

                    {expiry.label}
                  </span>
                </div>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {detailItems.map(
                    ([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-cream p-4"
                      >
                        <dt className="text-xs font-bold text-black/40">
                          {label}
                        </dt>

                        <dd className="mt-1 break-words font-black">
                          {value}
                        </dd>
                      </div>
                    )
                  )}
                </dl>
              </div>
            </Modal>
          );
        })()}

      {adjustment && (
        <Modal
          title="Ajustar inventario"
          onClose={() =>
            setAdjustment(null)
          }
        >
          <form onSubmit={submit}>
            <p className="mb-5 rounded-2xl bg-mint p-4 font-bold text-forest">
              {adjustment.productName}
            </p>

            <label className="text-sm font-bold">
              Tipo de movimiento
            </label>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setAdjustment({
                    ...adjustment,
                    type: 'entrada',
                  })
                }
                className={`rounded-2xl border p-4 text-sm font-bold ${
                  adjustment.type ===
                  'entrada'
                    ? 'border-forest bg-mint text-forest'
                    : 'border-black/10'
                }`}
              >
                <ArrowDownToLine className="mx-auto mb-2" />
                Entrada
              </button>

              <button
                type="button"
                onClick={() =>
                  setAdjustment({
                    ...adjustment,
                    type: 'salida',
                  })
                }
                className={`rounded-2xl border p-4 text-sm font-bold ${
                  adjustment.type ===
                  'salida'
                    ? 'border-coral bg-coral/10 text-coral'
                    : 'border-black/10'
                }`}
              >
                <ArrowUpFromLine className="mx-auto mb-2" />
                Salida
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold">
              Cantidad

              <input
                required
                min="0.001"
                step="0.001"
                type="number"
                className="field mt-2"
                value={
                  adjustment.quantity
                }
                onChange={(event) =>
                  setAdjustment({
                    ...adjustment,
                    quantity:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="mt-5 block text-sm font-bold">
              Motivo

              <input
                required
                className="field mt-2"
                placeholder="Compra, merma, corrección..."
                value={adjustment.reason}
                onChange={(event) =>
                  setAdjustment({
                    ...adjustment,
                    reason:
                      event.target.value,
                  })
                }
              />
            </label>

            <button className="btn-primary mt-6 w-full">
              Guardar ajuste
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}