'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  BadgePercent,
  Barcode,
  Boxes,
  CalendarClock,
  ImagePlus,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import {
  Modal,
  PageTitle,
} from '../components/ui';

import {
  formatMoney,
  formatQuantity,
} from '../data/mock';

const empty = {
  barcode: '',
  name: '',
  description: '',
  category: '',
  categoryId: '',
  brand: '',
  brandId: '',

  purchasePresentation: 'unidad',
  purchasePrice: '',
  contentQuantity: '1',
  purchaseQuantity: '1',

  unitCost: 0,
  salePrice: '',
  stock: '',
  minStock: '5',
  saleUnit: 'unidad',

  image: '',

  expirationDate: '',
  sanitaryRegistration: '',
  lot: '',

  active: true,
};

const presentationNames = {
  unidad: 'unidad',
  paquete: 'paquete',
  saco: 'saco',
};

const saleUnitNames = {
  unidad: 'unidades',
  kg: 'kg',
};

const calculateProfit = (
  salePrice,
  cost
) => {
  const amount =
    Number(salePrice || 0) -
    Number(cost || 0);

  const percentage =
    Number(cost) > 0
      ? (amount / Number(cost)) * 100
      : 0;

  return {
    amount:
      Number.isFinite(amount)
        ? amount
        : 0,

    percentage:
      Number.isFinite(percentage)
        ? percentage
        : 0,
  };
};

export default function ProductsView({
  products,
  categories = [],
  brands = [],
  onSave,
}) {
  const [search, setSearch] =
    useState('');

  const [editing, setEditing] =
    useState(null);

  const categoryName = (id) =>
    categories.find(
      (item) => item.id === id
    )?.name || 'Sin categoría';

  const brandName = (id) =>
    brands.find(
      (item) => item.id === id
    )?.name || 'Sin marca';

  const filtered = useMemo(
    () =>
      products.filter((product) =>
        `
          ${product.name || ''}
          ${product.barcode || ''}
          ${categoryName(
            product.categoryId
          )}
          ${brandName(
            product.brandId
          )}
          ${product.lot || ''}
          ${
            product.sanitaryRegistration ||
            ''
          }
        `
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      ),
    [
      products,
      categories,
      brands,
      search,
    ]
  );

  const open = (product = empty) => {
    setEditing({
      ...empty,
      ...product,

      purchaseQuantity:
        product.purchaseQuantity ||
        '1',

      contentQuantity:
        product.contentQuantity ||
        '1',

      saleUnit:
        product.saleUnit ||
        product.unit ||
        'unidad',

      expirationDate:
        product.expirationDate ||
        '',

      sanitaryRegistration:
        product.sanitaryRegistration ||
        '',

      lot:
        product.lot || '',
    });
  };

  const unitCost = editing
    ? Number(
        editing.purchasePrice || 0
      ) /
      Math.max(
        Number(
          editing.contentQuantity ||
            1
        ),
        1
      )
    : 0;

  const calculatedStock = editing
    ? Number(
        editing.purchaseQuantity ||
          0
      ) *
      Number(
        editing.contentQuantity ||
          0
      )
    : 0;

  const profit = calculateProfit(
    editing?.salePrice,
    unitCost
  );

  const changePresentation = (
    value
  ) => {
    const next = {
      ...editing,
      purchasePresentation: value,
    };

    if (value === 'unidad') {
      next.contentQuantity = '1';
    }

    if (value === 'saco') {
      next.saleUnit = 'kg';
    }

    setEditing(next);
  };

  const loadImage = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      1024 * 1024
    ) {
      window.alert(
        'La imagen debe pesar como máximo 1 MB.'
      );

      event.target.value = '';

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setEditing((current) => ({
        ...current,
        image: String(
          reader.result
        ),
      }));
    };

    reader.readAsDataURL(file);
  };

  const submit = async (
    event
  ) => {
    event.preventDefault();

    const isNew = !editing.id;

    const selectedCategory =
      categories.find(
        (item) =>
          item.id ===
          editing.categoryId
      );

    const selectedBrand =
      brands.find(
        (item) =>
          item.id ===
          editing.brandId
      );

    if (!selectedCategory) {
      window.alert(
        'Selecciona una categoría válida.'
      );

      return;
    }

    const product = {
      ...editing,

      category:
        selectedCategory.name,

      brand:
        selectedBrand?.name || '',

      purchasePrice: Number(
        editing.purchasePrice
      ),

      contentQuantity: Number(
        editing.contentQuantity
      ),

      purchaseQuantity: Number(
        editing.purchaseQuantity
      ),

      unitCost: Number(
        unitCost.toFixed(4)
      ),

      salePrice: Number(
        editing.salePrice
      ),

      stock: isNew
        ? Number(
            calculatedStock.toFixed(
              3
            )
          )
        : Number(editing.stock),

      minStock: Number(
        editing.minStock
      ),

      expirationDate:
        editing.expirationDate ||
        '',

      sanitaryRegistration:
        String(
          editing.sanitaryRegistration ||
            ''
        ).trim(),

      lot: String(
        editing.lot || ''
      ).trim(),
    };

    await onSave(product);

    setEditing(null);
  };

  return (
    <>
      <PageTitle
        eyebrow="Catálogo"
        title="Productos"
        description="Registra cómo compras cada producto y cómo lo vendes; el sistema convertirá paquetes o sacos a unidades y kilos."
        action={
          <button
            className="btn-primary"
            onClick={() => open()}
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-4 top-3.5 text-black/30"
              size={19}
            />

            <input
              className="field pl-11"
              placeholder="Buscar por producto, código, categoría, marca o lote"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-black/40">
              <tr>
                <th className="p-4">
                  Producto
                </th>

                <th className="p-4">
                  Categoría / marca
                </th>

                <th className="p-4">
                  Compra
                </th>

                <th className="p-4">
                  Costo real
                </th>

                <th className="p-4">
                  Venta / ganancia
                </th>

                <th className="p-4">
                  Stock
                </th>

                <th className="p-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {filtered.map(
                (product) => {
                  const productProfit =
                    calculateProfit(
                      product.salePrice,

                      product.unitCost ??
                        product.purchasePrice
                    );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-cream/60"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              className="size-12 rounded-xl object-cover"
                              src={
                                product.image
                              }
                              alt=""
                            />
                          ) : (
                            <span className="grid size-12 place-items-center rounded-xl bg-cream text-black/25">
                              <PackageOpen
                                size={20}
                              />
                            </span>
                          )}

                          <div>
                            <p className="font-bold">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-black/35">
                              <Barcode
                                size={13}
                              />

                              {
                                product.barcode
                              }
                            </p>

                            {product.lot && (
                              <p className="mt-1 text-xs text-black/40">
                                Lote:{' '}
                                {
                                  product.lot
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold">
                          {categoryName(
                            product.categoryId
                          )}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {brandName(
                            product.brandId
                          )}
                        </p>
                      </td>

                      <td className="p-4">
                        <p>
                          {formatMoney(
                            product.purchasePrice
                          )}{' '}
                          /{' '}
                          {presentationNames[
                            product
                              .purchasePresentation
                          ] || 'unidad'}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          Contiene{' '}
                          {formatQuantity(
                            product.contentQuantity ||
                              1
                          )}{' '}
                          {saleUnitNames[
                            product.saleUnit
                          ] ||
                            product.saleUnit}
                        </p>
                      </td>

                      <td className="p-4">
                        {formatMoney(
                          product.unitCost ??
                            product.purchasePrice
                        )}{' '}
                        /{' '}
                        {product.saleUnit ===
                        'kg'
                          ? 'kg'
                          : 'unidad'}
                      </td>

                      <td className="p-4">
                        <p className="font-black">
                          {formatMoney(
                            product.salePrice
                          )}
                        </p>

                        <p
                          className={`mt-1 text-xs font-bold ${
                            productProfit.percentage <
                            0
                              ? 'text-coral'
                              : 'text-forest'
                          }`}
                        >
                          {productProfit.percentage.toFixed(
                            2
                          )}
                          % de ganancia
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`badge ${
                            product.stock <=
                            product.minStock
                              ? 'bg-coral/10 text-coral'
                              : 'bg-mint text-forest'
                          }`}
                        >
                          {formatQuantity(
                            product.stock
                          )}{' '}
                          {saleUnitNames[
                            product.saleUnit
                          ] ||
                            product.saleUnit}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          className="rounded-xl p-2 hover:bg-black/5"
                          onClick={() =>
                            open(product)
                          }
                          aria-label={`Editar ${product.name}`}
                        >
                          <Pencil
                            size={17}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <Modal
          title={
            editing.id
              ? 'Editar producto'
              : 'Nuevo producto'
          }
          onClose={() =>
            setEditing(null)
          }
          wide
        >
          <form
            className="space-y-6"
            onSubmit={submit}
          >
            <section>
              <h3 className="flex items-center gap-2 font-black">
                <Barcode
                  size={18}
                  className="text-forest"
                />

                Datos del producto
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Nombre del producto

                  <input
                    required
                    className="field mt-2"
                    value={editing.name}
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        name:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="text-sm font-bold">
                  Código de barras

                  <input
                    required
                    inputMode="numeric"
                    className="field mt-2"
                    value={
                      editing.barcode
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        barcode:
                          event.target.value.replace(
                            /\D/g,
                            ''
                          ),
                      })
                    }
                  />
                </label>

                <label className="text-sm font-bold">
                  Categoría

                  <select
                    required
                    className="field mt-2"
                    value={
                      editing.categoryId
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        categoryId:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona una
                      categoría
                    </option>

                    {categories
                      .filter(
                        (item) =>
                          item.active !==
                          false
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Marca

                  <select
                    className="field mt-2"
                    value={
                      editing.brandId
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        brandId:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Sin marca
                    </option>

                    {brands
                      .filter(
                        (item) =>
                          item.active !==
                          false
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="sm:col-span-2 text-sm font-bold">
                  Descripción

                  <textarea
                    rows="3"
                    className="field mt-2 resize-none"
                    placeholder="Presentación, tamaño, sabor u otra información útil"
                    value={
                      editing.description
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        description:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="sm:col-span-2 text-sm font-bold">
                  Imagen del producto

                  <div className="mt-2 flex items-center gap-4 rounded-2xl border border-dashed border-black/15 bg-white p-4">
                    {editing.image ? (
                      <img
                        className="size-20 rounded-2xl object-cover"
                        src={
                          editing.image
                        }
                        alt="Vista previa del producto"
                      />
                    ) : (
                      <span className="grid size-20 place-items-center rounded-2xl bg-cream text-black/30">
                        <ImagePlus
                          size={28}
                        />
                      </span>
                    )}

                    <div>
                      <input
                        id="product-image"
                        className="sr-only"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          loadImage
                        }
                      />

                      <label
                        htmlFor="product-image"
                        className="btn-secondary cursor-pointer px-4 py-2 text-sm"
                      >
                        <ImagePlus
                          size={17}
                        />

                        Elegir imagen
                      </label>

                      <p className="mt-2 text-xs text-black/40">
                        JPG, PNG o WebP ·
                        máximo 1 MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-black/5 bg-white p-5">
              <h3 className="flex items-center gap-2 font-black">
                <Boxes
                  size={18}
                  className="text-forest"
                />

                Compra y conversión de
                stock
              </h3>

              <p className="mt-1 text-sm text-black/45">
                Indica cómo lo entrega el
                proveedor y en qué medida
                se vende al cliente.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-bold">
                  Lo compro por

                  <select
                    className="field mt-2"
                    value={
                      editing.purchasePresentation
                    }
                    onChange={(event) =>
                      changePresentation(
                        event.target.value
                      )
                    }
                  >
                    <option value="unidad">
                      Unidad individual
                    </option>

                    <option value="paquete">
                      Paquete o caja
                    </option>

                    <option value="saco">
                      Saco
                    </option>
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Precio pagado por{' '}
                  {
                    presentationNames[
                      editing
                        .purchasePresentation
                    ]
                  }

                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.purchasePrice
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        purchasePrice:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="text-sm font-bold">
                  Lo vendo por

                  <select
                    className="field mt-2"
                    value={
                      editing.saleUnit
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        saleUnit:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="unidad">
                      Unidad
                    </option>

                    <option value="kg">
                      Kilogramo
                    </option>
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Cantidad de{' '}
                  {editing.purchasePresentation ===
                  'unidad'
                    ? 'unidades compradas'
                    : `${
                        presentationNames[
                          editing
                            .purchasePresentation
                        ]
                      }s comprados`}

                  <input
                    required
                    min="0.001"
                    step="0.001"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.purchaseQuantity
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        purchaseQuantity:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="text-sm font-bold">
                  {editing.purchasePresentation ===
                  'unidad'
                    ? 'Contenido por unidad'
                    : `${
                        editing.saleUnit ===
                        'kg'
                          ? 'Kilos'
                          : 'Unidades'
                      } por ${
                        presentationNames[
                          editing
                            .purchasePresentation
                        ]
                      }`}

                  <input
                    required
                    disabled={
                      editing.purchasePresentation ===
                      'unidad'
                    }
                    min="0.001"
                    step="0.001"
                    type="number"
                    className="field mt-2 disabled:bg-black/[0.03] disabled:text-black/35"
                    value={
                      editing.contentQuantity
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        contentQuantity:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                {editing.id ? (
                  <label className="text-sm font-bold">
                    Stock actual (
                    {editing.saleUnit ===
                    'kg'
                      ? 'kg'
                      : 'unidades'}
                    )

                    <input
                      required
                      min="0"
                      step={
                        editing.saleUnit ===
                        'kg'
                          ? '0.001'
                          : '1'
                      }
                      type="number"
                      className="field mt-2"
                      value={
                        editing.stock
                      }
                      onChange={(event) =>
                        setEditing({
                          ...editing,

                          stock:
                            event.target
                              .value,
                        })
                      }
                    />
                  </label>
                ) : (
                  <div className="rounded-2xl bg-mint p-4">
                    <p className="text-xs font-bold text-forest/65">
                      Stock inicial
                      calculado
                    </p>

                    <p className="mt-1 text-2xl font-black text-forest">
                      {formatQuantity(
                        calculatedStock
                      )}{' '}
                      {
                        saleUnitNames[
                          editing.saleUnit
                        ]
                      }
                    </p>

                    <p className="mt-1 text-xs text-forest/60">
                      Cantidad comprada ×
                      contenido
                    </p>
                  </div>
                )}

                <label className="text-sm font-bold">
                  Stock mínimo (
                  {editing.saleUnit ===
                  'kg'
                    ? 'kg'
                    : 'unidades'}
                  )

                  <input
                    required
                    min="0"
                    step={
                      editing.saleUnit ===
                      'kg'
                        ? '0.001'
                        : '1'
                    }
                    type="number"
                    className="field mt-2"
                    value={
                      editing.minStock
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        minStock:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-amber/30 bg-amber/10 p-5">
              <h3 className="flex items-center gap-2 font-black text-[#8c5c00]">
                <CalendarClock
                  size={19}
                />

                Lote, registro sanitario
                y vencimiento
              </h3>

              <p className="mt-1 text-sm text-black/50">
                La alerta se activará
                automáticamente cuando
                falten dos meses o menos
                para la fecha de
                vencimiento.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Fecha de vencimiento
                  (FV)

                  <input
                    type="date"
                    className="field mt-2"
                    value={
                      editing.expirationDate
                    }
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        expirationDate:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="text-sm font-bold">
                  Lote

                  <input
                    className="field mt-2"
                    placeholder="Ej. L-2026-084"
                    value={editing.lot}
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        lot:
                          event.target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="sm:col-span-2 text-sm font-bold">
                  Registro sanitario

                  <div className="relative mt-2">
                    <ShieldCheck
                      className="absolute left-4 top-3.5 text-black/30"
                      size={18}
                    />

                    <input
                      className="field pl-11"
                      placeholder="Ej. A1234567N"
                      value={
                        editing.sanitaryRegistration
                      }
                      onChange={(event) =>
                        setEditing({
                          ...editing,

                          sanitaryRegistration:
                            event.target
                              .value,
                        })
                      }
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-ink p-5 text-white">
              <h3 className="flex items-center gap-2 font-black">
                <BadgePercent
                  size={19}
                  className="text-amber"
                />

                Precio de venta y
                ganancia
              </h3>

              <p className="mt-1 text-sm text-white/45">
                Tú defines el precio de
                venta y el sistema
                calcula automáticamente
                el porcentaje real de
                ganancia.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold text-white/45">
                    Costo real por{' '}
                    {editing.saleUnit ===
                    'kg'
                      ? 'kg'
                      : 'unidad'}
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {formatMoney(
                      unitCost
                    )}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Precio de compra ÷
                    contenido
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-4 ${
                    profit.percentage < 0
                      ? 'bg-coral/20 text-white'
                      : 'bg-mint text-forest'
                  }`}
                >
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                    {profit.percentage <
                    0 ? (
                      <TrendingDown
                        size={16}
                      />
                    ) : (
                      <TrendingUp
                        size={16}
                      />
                    )}

                    {profit.percentage < 0
                      ? 'Pérdida estimada'
                      : 'Ganancia real'}
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {profit.percentage.toFixed(
                      2
                    )}
                    %
                  </p>

                  <p className="mt-1 text-xs opacity-65">
                    {profit.amount >= 0
                      ? 'Ganas'
                      : 'Pierdes'}{' '}
                    {formatMoney(
                      Math.abs(
                        profit.amount
                      )
                    )}{' '}
                    por{' '}
                    {editing.saleUnit ===
                    'kg'
                      ? 'kg'
                      : 'unidad'}
                  </p>
                </div>
              </div>

              <label className="mt-4 block text-sm font-bold">
                Precio de venta final
                por{' '}
                {editing.saleUnit ===
                'kg'
                  ? 'kg'
                  : 'unidad'}

                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  className="field mt-2 text-ink"
                  value={
                    editing.salePrice
                  }
                  onChange={(event) =>
                    setEditing({
                      ...editing,

                      salePrice:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <p className="mt-2 text-xs text-white/40">
                Cálculo: (precio de venta
                − costo real) ÷ costo real
                × 100.
              </p>
            </section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setEditing(null)
                }
              >
                Cancelar
              </button>

              <button className="btn-primary">
                Guardar producto
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}