'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  Barcode,
  Boxes,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import {
  EmptyState,
  Modal,
  PageTitle,
} from '../components/ui';

import {
  formatMoney,
  formatQuantity,
} from '../data/mock';

const emptyProduct = {
  barcode:
    '',
  name:
    '',
  description:
    '',
  categoryId:
    '',
  brandId:
    '',
  purchasePresentation:
    'unidad',
  purchasePrice:
    '',
  contentQuantity:
    '1',
  purchaseQuantity:
    '1',
  salePrice:
    '',
  minStock:
    '5',
  saleUnit:
    'unidad',
  image:
    '',
  expirationDate:
    '',
  sanitaryRegistration:
    '',
  lot:
    '',
  active:
    true,
};

const profitInfo = (
  salePrice,
  unitCost,
) => {
  const sale =
    Number(
      salePrice ||
        0,
    );

  const cost =
    Number(
      unitCost ||
        0,
    );

  const amount =
    sale -
    cost;

  const percentage =
    cost >
    0
      ? (
          amount /
          cost
        ) *
        100
      : 0;

  return {
    amount,
    percentage,
  };
};

export default function ProductsView({
  products,
  categories = [],
  brands = [],
  onSave,
}) {
  const [
    search,
    setSearch,
  ] =
    useState(
      '',
    );

  const [
    editing,
    setEditing,
  ] =
    useState(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState(
      '',
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const categoryName =
    (id) =>
      categories.find(
        (item) =>
          item.id ===
          id,
      )?.name ||
      'Sin categoría';

  const brandName =
    (id) =>
      brands.find(
        (item) =>
          item.id ===
          id,
      )?.name ||
      'Sin marca';

  const filtered =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (
            product,
          ) =>
            `${product.name || ''} ${product.barcode || ''} ${categoryName(product.categoryId)} ${brandName(product.brandId)} ${product.lot || ''}`
              .toLowerCase()
              .includes(
                term,
              ),
        );
      },

      [
        products,
        categories,
        brands,
        search,
      ],
    );

  const open =
    (
      product =
        null,
    ) => {
      setError(
        '',
      );

      setEditing(
        product
          ? {
              ...emptyProduct,

              ...product,

              purchasePrice:
                String(
                  product.purchasePrice ??
                    '',
                ),

              contentQuantity:
                String(
                  product.contentQuantity ??
                    1,
                ),

              purchaseQuantity:
                String(
                  product.purchaseQuantity ??
                    1,
                ),

              salePrice:
                String(
                  product.salePrice ??
                    '',
                ),

              minStock:
                String(
                  product.minStock ??
                    0,
                ),
            }
          : {
              ...emptyProduct,

              categoryId:
                categories.find(
                  (
                    item,
                  ) =>
                    item.active,
                )?.id ||
                '',

              brandId:
                brands.find(
                  (
                    item,
                  ) =>
                    item.active,
                )?.id ||
                '',
            },
      );
    };

  const calculatedUnitCost =
    editing
      ? Number(
          editing.purchasePrice ||
            0,
        ) /
        Math.max(
          Number(
            editing.contentQuantity ||
              1,
          ),
          1,
        )
      : 0;

  const displayUnitCost =
    editing?.id
      ? Number(
          editing.unitCost ||
            0,
        )
      : calculatedUnitCost;

  const calculatedInitialStock =
    editing
      ? Number(
          editing.purchaseQuantity ||
            0,
        ) *
        Number(
          editing.contentQuantity ||
            0,
        )
      : 0;

  const profit =
    profitInfo(
      editing?.salePrice,

      displayUnitCost,
    );

  const setField =
    (
      field,
      value,
    ) => {
      setEditing(
        (
          current,
        ) => ({
          ...current,

          [field]:
            value,
        }),
      );
    };

  const loadImage =
    (
      event,
    ) => {
      const file =
        event.target
          .files?.[0];

      if (
        !file
      ) {
        return;
      }

      if (
        file.size >
        1024 *
          1024
      ) {
        setError(
          'La imagen debe pesar como máximo 1 MB.',
        );

        event.target.value =
          '';

        return;
      }

      const reader =
        new FileReader();

      reader.onload =
        () =>
          setField(
            'image',

            String(
              reader.result,
            ),
          );

      reader.readAsDataURL(
        file,
      );
    };

  const submit =
    async (
      event,
    ) => {
      event.preventDefault();

      setError(
        '',
      );

      setSaving(
        true,
      );

      try {
        if (
          !editing.categoryId
        ) {
          throw new Error(
            'Selecciona una categoría.',
          );
        }

        if (
          !editing.barcode.trim()
        ) {
          throw new Error(
            'Ingresa un código de barras.',
          );
        }

        if (
          !editing.name.trim()
        ) {
          throw new Error(
            'Ingresa el nombre del producto.',
          );
        }

        /*
         * NO enviamos
         * stock ni
         * unitCost.
         */
        const payload = {
          id:
            editing.id,

          barcode:
            editing.barcode.trim(),

          name:
            editing.name.trim(),

          description:
            editing.description ||
            '',

          categoryId:
            editing.categoryId,

          brandId:
            editing.brandId ||
            '',

          purchasePresentation:
            editing.purchasePresentation ||
            'unidad',

          purchasePrice:
            Number(
              editing.purchasePrice,
            ),

          contentQuantity:
            Number(
              editing.contentQuantity,
            ),

          purchaseQuantity:
            Number(
              editing.purchaseQuantity,
            ),

          salePrice:
            Number(
              editing.salePrice,
            ),

          minStock:
            Number(
              editing.minStock,
            ),

          saleUnit:
            editing.saleUnit ||
            'unidad',

          image:
            editing.image ||
            '',

          expirationDate:
            editing.expirationDate ||
            '',

          sanitaryRegistration:
            String(
              editing.sanitaryRegistration ||
                '',
            ).trim(),

          lot:
            String(
              editing.lot ||
                '',
            ).trim(),

          active:
            editing.active !==
            false,
        };

        await onSave(
          payload,
        );

        setEditing(
          null,
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      } finally {
        setSaving(
          false,
        );
      }
    };

  return (
    <>
      <PageTitle
        eyebrow="Catálogo"
        title="Productos"
        description="Administra la información comercial. El stock se modifica únicamente mediante compras, ventas, créditos o inventario."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              open()
            }
          >
            <Plus
              size={
                18
              }
            />

            Nuevo producto
          </button>
        }
      />

      <div className="panel mb-5 p-4">
        <div className="relative max-w-xl">
          <Search
            className="absolute left-3 top-3 text-black/30"
            size={
              18
            }
          />

          <input
            className="field pl-10"
            placeholder="Buscar producto..."
            value={
              search
            }
            onChange={(
              e,
            ) =>
              setSearch(
                e
                  .target
                  .value,
              )
            }
          />
        </div>
      </div>

      {!filtered.length ? (
        <div className="panel">
          <EmptyState
            text="No hay productos para mostrar."
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(
            (
              product,
            ) => {
              const currentProfit =
                profitInfo(
                  product.salePrice,

                  product.unitCost,
                );

              const low =
                Number(
                  product.stock,
                ) <=
                Number(
                  product.minStock,
                );

              return (
                <article
                  key={
                    product.id
                  }
                  className="panel overflow-hidden p-5"
                >
                  <div className="flex gap-4">
                    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/[0.035]">
                      {product.image ? (
                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Boxes
                          className="text-black/20"
                          size={
                            30
                          }
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-black/40">
                            {
                              product.barcode
                            }
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-xl p-2 hover:bg-black/5"
                          onClick={() =>
                            open(
                              product,
                            )
                          }
                        >
                          <Pencil
                            size={
                              17
                            }
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-mint px-2.5 py-1 text-forest">
                          {categoryName(
                            product.categoryId,
                          )}
                        </span>

                        <span className="rounded-full bg-black/[0.04] px-2.5 py-1">
                          {brandName(
                            product.brandId,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div
                      className={`
                        rounded-2xl p-3

                        ${
                          low
                            ? 'bg-coral/10 text-coral'
                            : 'bg-black/[0.03]'
                        }
                      `}
                    >
                      <p className="text-xs opacity-60">
                        Stock
                      </p>

                      <p className="mt-1 font-black">
                        {formatQuantity(
                          product.stock,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.03] p-3">
                      <p className="text-xs text-black/45">
                        Costo
                      </p>

                      <p className="mt-1 font-black">
                        {formatMoney(
                          product.unitCost,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-forest p-3 text-white">
                      <p className="text-xs text-white/60">
                        Venta
                      </p>

                      <p className="mt-1 font-black">
                        {formatMoney(
                          product.salePrice,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-amber/10 p-3 text-sm">
                    <span className="flex items-center gap-2 font-bold">
                      <TrendingUp
                        size={
                          16
                        }
                      />

                      Margen
                    </span>

                    <strong>
                      {formatMoney(
                        currentProfit.amount,
                      )}{' '}
                      ·{' '}
                      {Number(
                        currentProfit.percentage ||
                          0,
                      ).toFixed(
                        1,
                      )}
                      %
                    </strong>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      {editing && (
        <Modal
          title={
            editing.id
              ? 'Editar producto'
              : 'Nuevo producto'
          }
          wide
          onClose={() => {
            setEditing(
              null,
            );

            setError(
              '',
            );
          }}
        >
          <form
            className="space-y-5"
            onSubmit={
              submit
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Código de barras

                <div className="relative mt-2">
                  <Barcode
                    className="absolute left-3 top-3 text-black/30"
                    size={
                      18
                    }
                  />

                  <input
                    required
                    className="field pl-10"
                    value={
                      editing.barcode
                    }
                    onChange={(
                      e,
                    ) =>
                      setField(
                        'barcode',

                        e
                          .target
                          .value,
                      )
                    }
                  />
                </div>
              </label>

              <label className="text-sm font-bold">
                Nombre

                <input
                  required
                  className="field mt-2"
                  value={
                    editing.name
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'name',

                      e
                        .target
                        .value,
                    )
                  }
                />
              </label>
            </div>

            <label className="block text-sm font-bold">
              Descripción

              <textarea
                className="field mt-2"
                rows="2"
                value={
                  editing.description ||
                  ''
                }
                onChange={(
                  e,
                ) =>
                  setField(
                    'description',

                    e
                      .target
                      .value,
                  )
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Categoría

                <select
                  required
                  className="field mt-2"
                  value={
                    editing.categoryId
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'categoryId',

                      e
                        .target
                        .value,
                    )
                  }
                >
                  <option value="">
                    Selecciona
                  </option>

                  {categories
                    .filter(
                      (
                        item,
                      ) =>
                        item.active,
                    )
                    .map(
                      (
                        item,
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      ),
                    )}
                </select>
              </label>

              <label className="text-sm font-bold">
                Marca

                <select
                  className="field mt-2"
                  value={
                    editing.brandId ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'brandId',

                      e
                        .target
                        .value,
                    )
                  }
                >
                  <option value="">
                    Sin marca
                  </option>

                  {brands
                    .filter(
                      (
                        item,
                      ) =>
                        item.active,
                    )
                    .map(
                      (
                        item,
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      ),
                    )}
                </select>
              </label>
            </div>

            <div className="rounded-3xl bg-black/[0.025] p-4">
              <p className="mb-4 font-black">
                Compra y costo
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-bold">
                  Presentación

                  <select
                    className="field mt-2"
                    value={
                      editing.purchasePresentation
                    }
                    onChange={(
                      e,
                    ) =>
                      setField(
                        'purchasePresentation',

                        e
                          .target
                          .value,
                      )
                    }
                  >
                    <option value="unidad">
                      Unidad
                    </option>

                    <option value="paquete">
                      Paquete
                    </option>

                    <option value="saco">
                      Saco
                    </option>
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Costo presentación

                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.purchasePrice
                    }
                    onChange={(
                      e,
                    ) =>
                      setField(
                        'purchasePrice',

                        e
                          .target
                          .value,
                      )
                    }
                  />
                </label>

                <label className="text-sm font-bold">
                  Contenido

                  <input
                    required
                    min="0.001"
                    step="0.001"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.contentQuantity
                    }
                    onChange={(
                      e,
                    ) =>
                      setField(
                        'contentQuantity',

                        e
                          .target
                          .value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-bold">
                  Cantidad de presentaciones

                  <input
                    required
                    min="0.001"
                    step="0.001"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.purchaseQuantity
                    }
                    onChange={(
                      e,
                    ) =>
                      setField(
                        'purchaseQuantity',

                        e
                          .target
                          .value,
                      )
                    }
                  />
                </label>

                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold text-black/45">
                    Costo
                    unitario
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {formatMoney(
                      displayUnitCost,
                    )}
                  </p>

                  {editing.id && (
                    <p className="mt-1 text-xs text-black/40">
                      Costo
                      promedio
                      protegido.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold text-black/45">
                    {editing.id
                      ? 'Stock actual'
                      : 'Stock inicial'}
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {formatQuantity(
                      editing.id
                        ? editing.stock
                        : calculatedInitialStock,
                    )}
                  </p>

                  {editing.id && (
                    <p className="mt-1 text-xs text-black/40">
                      Solo lectura.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-bold">
                Precio de venta

                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  className="field mt-2"
                  value={
                    editing.salePrice
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'salePrice',

                      e
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Stock mínimo

                <input
                  required
                  min="0"
                  step="0.001"
                  type="number"
                  className="field mt-2"
                  value={
                    editing.minStock
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'minStock',

                      e
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Unidad de venta

                <select
                  className="field mt-2"
                  value={
                    editing.saleUnit
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'saleUnit',

                      e
                        .target
                        .value,
                    )
                  }
                >
                  <option value="unidad">
                    Unidad
                  </option>

                  <option value="kg">
                    Kilogramo
                  </option>

                  <option value="litro">
                    Litro
                  </option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-bold">
                Lote

                <input
                  className="field mt-2"
                  value={
                    editing.lot ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'lot',

                      e
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Vencimiento

                <input
                  type="date"
                  className="field mt-2"
                  value={
                    editing.expirationDate ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'expirationDate',

                      e
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Registro sanitario

                <input
                  className="field mt-2"
                  value={
                    editing.sanitaryRegistration ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'sanitaryRegistration',

                      e
                        .target
                        .value,
                    )
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="text-sm font-bold">
                Imagen

                <div className="mt-2 flex items-center gap-3">
                  <label className="btn-secondary cursor-pointer">
                    <ImagePlus
                      size={
                        17
                      }
                    />

                    Elegir imagen

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={
                        loadImage
                      }
                    />
                  </label>

                  {editing.image && (
                    <span className="text-xs font-bold text-forest">
                      Imagen
                      cargada
                    </span>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-mint p-4 text-sm font-bold text-forest">
                <input
                  type="checkbox"
                  checked={
                    editing.active !==
                    false
                  }
                  onChange={(
                    e,
                  ) =>
                    setField(
                      'active',

                      e
                        .target
                        .checked,
                    )
                  }
                />

                Producto
                activo
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-mint p-4 text-forest">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck
                    size={
                      17
                    }
                  />

                  Ganancia
                  estimada
                </p>

                <p className="mt-1 text-xl font-black">
                  {formatMoney(
                    profit.amount,
                  )}{' '}
                  ·{' '}
                  {Number(
                    profit.percentage ||
                      0,
                  ).toFixed(
                    1,
                  )}
                  %
                </p>
              </div>

              {editing.id && (
                <div className="rounded-2xl bg-amber/10 p-4 text-sm text-black/60">
                  Para cambiar
                  stock usa{' '}
                  <strong>
                    Inventario
                  </strong>{' '}
                  o registra
                  una{' '}
                  <strong>
                    Compra
                  </strong>
                  .
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full"
              disabled={
                saving
              }
            >
              {saving
                ? 'Guardando...'
                : editing.id
                ? 'Guardar cambios'
                : 'Crear producto'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}