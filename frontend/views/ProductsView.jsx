'use client';

import { useMemo, useState } from 'react';
import {
  Barcode,
  Boxes,
  Calculator,
  ImagePlus,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { EmptyState, Modal, PageTitle } from '../components/ui';
import { formatMoney, formatQuantity } from '../data/mock';

const emptyProduct = {
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  purchasePresentation: 'unidad',
  purchasePrice: '',
  contentQuantity: '1',
  purchaseQuantity: '1',
  salePrice: '',
  minStock: '5',
  saleUnit: 'unidad',
  image: '',
  expirationDate: '',
  sanitaryRegistration: '',
  lot: '',
  active: true,
  targetMarkup: '25',
};

const presentationLabels = {
  unidad: 'Unidad',
  paquete: 'Paquete',
  caja: 'Caja',
  saco: 'Saco',
  bandeja: 'Bandeja',
  docena: 'Docena',
};

const saleUnitLabels = {
  unidad: 'unidad',
  kg: 'kg',
  litro: 'litro',
};

function pluralizePresentation(value, quantity) {
  const label =
    presentationLabels[value] ||
    value ||
    'Presentación';

  return Number(quantity) === 1
    ? label.toLowerCase()
    : `${label.toLowerCase()}s`;
}

function pluralizeSaleUnit(value, quantity) {
  const label =
    saleUnitLabels[value] ||
    value ||
    'unidad';

  if (label === 'kg') {
    return 'kg';
  }

  if (label === 'litro') {
    return Number(quantity) === 1
      ? 'litro'
      : 'litros';
  }

  return Number(quantity) === 1
    ? 'unidad'
    : 'unidades';
}

function money4(value) {
  const number =
    Number(value || 0);

  return `S/ ${
    Number.isFinite(number)
      ? number.toFixed(4)
      : '0.0000'
  }`;
}

function calculateProfit(
  salePrice,
  unitCost,
) {
  const sale =
    Number(salePrice || 0);

  const cost =
    Number(unitCost || 0);

  const amount =
    sale - cost;

  const percentage =
    cost > 0
      ? (amount / cost) * 100
      : 0;

  return {
    amount,
    percentage,
  };
}

function roundSuggestedPrice(
  value,
) {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Number(
    (
      Math.ceil(
        value * 10 - 1e-9,
      ) / 10
    ).toFixed(2),
  );
}

function stockBreakdown(
  stock,
  contentQuantity,
  presentation,
  saleUnit,
) {
  const total =
    Number(stock || 0);

  const content =
    Number(
      contentQuantity || 1,
    );

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(content) ||
    total < 0 ||
    content <= 0 ||
    presentation === 'unidad'
  ) {
    return `${formatQuantity(
      total,
    )} ${pluralizeSaleUnit(
      saleUnit,
      total,
    )}`;
  }

  const complete =
    Math.floor(
      (total + 1e-9) /
        content,
    );

  const loose =
    Number(
      (
        total -
        complete * content
      ).toFixed(3),
    );

  const presentationText =
    `${formatQuantity(
      complete,
    )} ${pluralizePresentation(
      presentation,
      complete,
    )}`;

  if (loose > 0.0001) {
    return `${presentationText} + ${formatQuantity(
      loose,
    )} ${pluralizeSaleUnit(
      saleUnit,
      loose,
    )}`;
  }

  return presentationText;
}

function readFileAsDataUrl(
  file,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            String(
              reader.result ||
                '',
            ),
          );

      reader.onerror =
        () =>
          reject(
            new Error(
              'No se pudo leer la imagen.',
            ),
          );

      reader.readAsDataURL(
        file,
      );
    },
  );
}

function loadImageElement(
  src,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const image =
        new Image();

      image.onload =
        () =>
          resolve(
            image,
          );

      image.onerror =
        () =>
          reject(
            new Error(
              'No se pudo procesar la imagen. Usa una foto JPG, PNG o WebP.',
            ),
          );

      image.src =
        src;
    },
  );
}

async function compressProductImage(
  file,
) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (
    !allowedTypes.includes(
      file.type,
    )
  ) {
    throw new Error(
      'La imagen debe ser JPG, PNG o WebP.',
    );
  }

  if (
    file.size >
    15 * 1024 * 1024
  ) {
    throw new Error(
      'La imagen original no debe superar 15 MB.',
    );
  }

  const source =
    await readFileAsDataUrl(
      file,
    );

  const image =
    await loadImageElement(
      source,
    );

  const maxSide =
    1100;

  const scale =
    Math.min(
      1,
      maxSide /
        Math.max(
          image.width,
          image.height,
        ),
    );

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          scale,
      ),
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          scale,
      ),
    );

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const context =
    canvas.getContext(
      '2d',
    );

  if (!context) {
    throw new Error(
      'Tu navegador no pudo procesar la imagen.',
    );
  }

  context.fillStyle =
    '#ffffff';

  context.fillRect(
    0,
    0,
    width,
    height,
  );

  context.drawImage(
    image,
    0,
    0,
    width,
    height,
  );

  let quality =
    0.82;

  let result =
    canvas.toDataURL(
      'image/jpeg',
      quality,
    );

  while (
    result.length >
      1_600_000 &&
    quality > 0.45
  ) {
    quality -=
      0.08;

    result =
      canvas.toDataURL(
        'image/jpeg',
        quality,
      );
  }

  if (
    result.length >
    2_200_000
  ) {
    throw new Error(
      'La imagen sigue siendo demasiado grande. Intenta con una foto de menor resolución.',
    );
  }

  return result;
}

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

  const [
    processingImage,
    setProcessingImage,
  ] =
    useState(
      false,
    );

  const categoryName =
    (id) =>
      categories.find(
        (
          item,
        ) =>
          item.id ===
          id,
      )?.name ||
      'Sin categoría';

  const brandName =
    (id) =>
      brands.find(
        (
          item,
        ) =>
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
            `${
              product.name ||
              ''
            } ${
              product.barcode ||
              ''
            } ${categoryName(
              product.categoryId,
            )} ${brandName(
              product.brandId,
            )} ${
              product.lot ||
              ''
            }`
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
      product = null,
    ) => {
      setError(
        '',
      );

      if (product) {
        setEditing({
          ...emptyProduct,

          ...product,

          barcode:
            String(
              product.barcode ||
                '',
            ),

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

          targetMarkup:
            '25',
        });

        return;
      }

      setEditing({
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
      });
    };

  const setField =
    (
      field,
      value,
    ) => {
      setEditing(
        (
          current,
        ) => {
          if (
            !current
          ) {
            return current;
          }

          if (
            field ===
              'purchasePresentation' &&
            value ===
              'unidad'
          ) {
            return {
              ...current,

              purchasePresentation:
                value,

              contentQuantity:
                '1',
            };
          }

          return {
            ...current,
            [field]:
              value,
          };
        },
      );
    };

  const purchasePresentation =
    editing
      ?.purchasePresentation ||
    'unidad';

  const contentQuantity =
    purchasePresentation ===
    'unidad'
      ? 1
      : Math.max(
          Number(
            editing
              ?.contentQuantity ||
              0,
          ),
          0,
        );

  const purchasePrice =
    Number(
      editing
        ?.purchasePrice ||
        0,
    );

  const purchaseQuantity =
    Number(
      editing
        ?.purchaseQuantity ||
        0,
    );

  const calculatedUnitCost =
    purchasePrice >
        0 &&
    contentQuantity >
        0
      ? purchasePrice /
        contentQuantity
      : 0;

  const displayUnitCost =
    editing?.id
      ? Number(
          editing.unitCost ||
            0,
        )
      : calculatedUnitCost;

  const calculatedInitialStock =
    !editing?.id &&
    purchaseQuantity >
      0 &&
    contentQuantity >
      0
      ? purchaseQuantity *
        contentQuantity
      : Number(
          editing
            ?.stock ||
            0,
        );

  const markup =
    Math.max(
      Number(
        editing
          ?.targetMarkup ||
          0,
      ),
      0,
    );

  const suggestedPrice =
    roundSuggestedPrice(
      displayUnitCost *
        (
          1 +
          markup / 100
        ),
    );

  const profit =
    calculateProfit(
      editing
        ?.salePrice,
      displayUnitCost,
    );

  const initialStockText =
    stockBreakdown(
      calculatedInitialStock,
      contentQuantity ||
        1,
      purchasePresentation,
      editing?.saleUnit ||
        'unidad',
    );

  const loadImage =
    async (
      event,
    ) => {
      const file =
        event.target
          .files?.[0];

      event.target.value =
        '';

      if (!file) {
        return;
      }

      setError(
        '',
      );

      setProcessingImage(
        true,
      );

      try {
        const compressed =
          await compressProductImage(
            file,
          );

        setField(
          'image',
          compressed,
        );
      } catch (
        imageError
      ) {
        setError(
          imageError.message ||
            'No se pudo cargar la imagen.',
        );
      } finally {
        setProcessingImage(
          false,
        );
      }
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
          !String(
            editing.name ||
              '',
          ).trim()
        ) {
          throw new Error(
            'Ingresa el nombre del producto.',
          );
        }

        if (
          !editing.id
        ) {
          if (
            !Number.isFinite(
              purchasePrice,
            ) ||
            purchasePrice <=
              0
          ) {
            throw new Error(
              'Ingresa el costo de la presentación comprada.',
            );
          }

          if (
            !Number.isFinite(
              purchaseQuantity,
            ) ||
            purchaseQuantity <=
              0
          ) {
            throw new Error(
              'Ingresa la cantidad de presentaciones compradas.',
            );
          }

          if (
            !Number.isFinite(
              contentQuantity,
            ) ||
            contentQuantity <=
              0
          ) {
            throw new Error(
              'Indica cuántas unidades contiene la presentación.',
            );
          }
        }

        if (
          Number(
            editing
              .salePrice ||
              0,
          ) <= 0
        ) {
          throw new Error(
            'Ingresa el precio de venta por unidad.',
          );
        }

        const payload = {
          id:
            editing.id,

          barcode:
            String(
              editing
                .barcode ||
                '',
            ).trim(),

          name:
            String(
              editing.name ||
                '',
            ).trim(),

          description:
            String(
              editing
                .description ||
                '',
            ).trim(),

          categoryId:
            editing
              .categoryId,

          brandId:
            editing
              .brandId ||
            '',

          salePrice:
            Number(
              editing
                .salePrice,
            ),

          minStock:
            Number(
              editing
                .minStock ||
                0,
            ),

          saleUnit:
            editing
              .saleUnit ||
            'unidad',

          image:
            editing.image ||
            '',

          expirationDate:
            editing
              .expirationDate ||
            '',

          sanitaryRegistration:
            String(
              editing
                .sanitaryRegistration ||
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

        if (
          !editing.id
        ) {
          payload.purchasePresentation =
            purchasePresentation;

          payload.purchasePrice =
            purchasePrice;

          payload.contentQuantity =
            contentQuantity;

          payload.purchaseQuantity =
            purchaseQuantity;
        }

        await onSave(
          payload,
        );

        setEditing(
          null,
        );
      } catch (
        submitError
      ) {
        setError(
          submitError.message ||
            'No se pudo guardar el producto.',
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
        description="Registra cómo compras cada producto y cuántas unidades trae cada presentación. Por ejemplo: un paquete de pastelitos puede traer 5, 6 o 7 unidades; un paquete de gaseosas puede traer 4, 6, 12 o 15. El stock se guarda en unidades vendibles."
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
            placeholder="Buscar por nombre, código, categoría, marca o lote..."
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event
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
                calculateProfit(
                  product
                    .salePrice,
                  product
                    .unitCost,
                );

              const low =
                Number(
                  product.stock,
                ) <=
                Number(
                  product
                    .minStock,
                );

              const stockText =
                stockBreakdown(
                  product.stock,
                  product
                    .contentQuantity,
                  product
                    .purchasePresentation,
                  product
                    .saleUnit,
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

                          <p className="mt-1 text-xs font-bold text-black/40">
                            {categoryName(
                              product
                                .categoryId,
                            )}{' '}
                            ·{' '}
                            {brandName(
                              product
                                .brandId,
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-xl p-2 text-black/45 hover:bg-black/5"
                          onClick={() =>
                            open(
                              product,
                            )
                          }
                          title="Editar producto"
                        >
                          <Pencil
                            size={
                              17
                            }
                          />
                        </button>
                      </div>

                      <p className="mt-2 flex items-center gap-1 text-xs text-black/45">
                        <Barcode
                          size={
                            14
                          }
                        />

                        {product.barcode ||
                          'Sin código de barras'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/[0.025] p-3">
                      <p className="text-xs font-bold text-black/40">
                        Venta
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {formatMoney(
                          product
                            .salePrice,
                        )}
                      </p>

                      <p className="text-xs text-black/40">
                        por{' '}
                        {saleUnitLabels[
                          product
                            .saleUnit
                        ] ||
                          product
                            .saleUnit}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.025] p-3">
                      <p className="text-xs font-bold text-black/40">
                        Costo unitario
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {formatMoney(
                          product
                            .unitCost,
                        )}
                      </p>

                      <p className="text-xs text-black/40">
                        +
                        {Number(
                          currentProfit
                            .percentage ||
                            0,
                        ).toFixed(
                          1,
                        )}
                        %
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-2xl p-3 ${
                      low
                        ? 'bg-coral/10 text-coral'
                        : 'bg-mint text-forest'
                    }`}
                  >
                    <p className="text-xs font-bold">
                      Stock disponible
                    </p>

                    <p className="mt-1 font-black">
                      {formatQuantity(
                        product.stock,
                      )}{' '}
                      {pluralizeSaleUnit(
                        product
                          .saleUnit,
                        product.stock,
                      )}
                    </p>

                    {product.purchasePresentation !==
                      'unidad' && (
                      <p className="mt-1 text-xs font-bold opacity-75">
                        Equivale a{' '}
                        {
                          stockText
                        }{' '}
                        ·{' '}
                        {formatQuantity(
                          product
                            .contentQuantity,
                        )}{' '}
                        {pluralizeSaleUnit(
                          product
                            .saleUnit,
                          product
                            .contentQuantity,
                        )}{' '}
                        por{' '}
                        {
                          product.purchasePresentation
                        }
                      </p>
                    )}
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
          onClose={() =>
            !saving &&
            setEditing(
              null,
            )
          }
          wide
        >
          <form
            onSubmit={
              submit
            }
            className="space-y-5"
          >
            <div className="rounded-2xl bg-mint p-4 text-sm text-forest">
              <p className="font-black">
                ¿Cómo funciona el stock?
              </p>

              <p className="mt-1 leading-relaxed">
                Tú indicas cómo
                compras el
                producto y cuántas
                unidades trae cada
                presentación. Por
                ejemplo: 1 paquete
                de pastelitos puede
                traer 5, 6 o 7
                pastelitos; 1
                paquete de KR puede
                traer 15 gaseosas.
                El sistema guarda
                el stock final en
                unidades vendibles.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Código de barras{' '}
                <span className="font-normal text-black/40">
                  (opcional)
                </span>

                <div className="relative mt-2">
                  <Barcode
                    size={
                      17
                    }
                    className="absolute left-3 top-3 text-black/30"
                  />

                  <input
                    className="field pl-10"
                    value={
                      editing.barcode ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'barcode',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Déjalo vacío si no tiene código"
                  />
                </div>

                <span className="mt-1 block text-xs font-normal text-black/40">
                  Pastelitos,
                  empanadas,
                  productos caseros,
                  etc. pueden
                  registrarse sin
                  código.
                </span>
              </label>

              <label className="text-sm font-bold">
                Nombre

                <input
                  required
                  className="field mt-2"
                  value={
                    editing.name ||
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      'name',
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Ej. Pastelito de chocolate"
                />
              </label>
            </div>

            <label className="text-sm font-bold">
              Descripción

              <textarea
                className="field mt-2 min-h-20 resize-y"
                value={
                  editing.description ||
                  ''
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'description',
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Descripción opcional"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Categoría

                <select
                  required
                  className="field mt-2"
                  value={
                    editing.categoryId ||
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      'categoryId',
                      event
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
                    event,
                  ) =>
                    setField(
                      'brandId',
                      event
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

            <section className="rounded-3xl bg-black/[0.025] p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white">
                  <PackageOpen
                    size={
                      19
                    }
                  />
                </span>

                <div>
                  <p className="font-black">
                    {editing.id
                      ? 'Información de compra actual'
                      : 'Compra inicial y stock'}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-black/45">
                    {editing.id
                      ? 'El costo y el stock de un producto existente se actualizan desde Compras o Inventario para mantener la trazabilidad.'
                      : 'Indica cómo compras este producto. El sistema convertirá la compra a unidades vendibles.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-bold">
                  Presentación de
                  compra

                  <select
                    className="field mt-2"
                    disabled={
                      Boolean(
                        editing.id,
                      )
                    }
                    value={
                      purchasePresentation
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'purchasePresentation',
                        event
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

                    <option value="caja">
                      Caja
                    </option>

                    <option value="saco">
                      Saco
                    </option>

                    <option value="bandeja">
                      Bandeja
                    </option>

                    <option value="docena">
                      Docena
                    </option>
                  </select>
                </label>

                <label className="text-sm font-bold">
                  Costo por
                  presentación

                  <input
                    required={
                      !editing.id
                    }
                    disabled={
                      Boolean(
                        editing.id,
                      )
                    }
                    min="0.0001"
                    step="0.0001"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.purchasePrice ??
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'purchasePrice',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ej. 6.30"
                  />

                  <span className="mt-1 block text-xs font-normal text-black/40">
                    Es el precio de
                    un paquete, una
                    caja, un saco o
                    una unidad,
                    según lo que
                    elijas.
                  </span>
                </label>

                <label className="text-sm font-bold">
                  Unidades que trae
                  cada presentación

                  <input
                    required={
                      !editing.id
                    }
                    disabled={
                      Boolean(
                        editing.id,
                      ) ||
                      purchasePresentation ===
                        'unidad'
                    }
                    min="0.001"
                    step="0.001"
                    type="number"
                    className="field mt-2"
                    value={
                      purchasePresentation ===
                      'unidad'
                        ? '1'
                        : editing.contentQuantity
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'contentQuantity',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ej. 7"
                  />

                  <span className="mt-1 block text-xs font-normal text-black/40">
                    Ejemplos: paquete
                    de pastelitos = 5,
                    6 o 7; paquete de
                    gaseosa = 4, 6,
                    12 o 15.
                  </span>
                </label>

                <label className="text-sm font-bold">
                  Cantidad de
                  presentaciones
                  compradas

                  <input
                    required={
                      !editing.id
                    }
                    disabled={
                      Boolean(
                        editing.id,
                      )
                    }
                    min="0.001"
                    step="0.001"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.purchaseQuantity ??
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'purchaseQuantity',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ej. 1"
                  />

                  <span className="mt-1 block text-xs font-normal text-black/40">
                    Si compras 2
                    paquetes, escribe
                    2.
                  </span>
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-black/45">
                    Costo por unidad
                    vendible
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {money4(
                      displayUnitCost,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    costo de una
                    presentación ÷
                    unidades que
                    contiene
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-black/45">
                    {editing.id
                      ? 'Stock actual'
                      : 'Stock inicial total'}
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {formatQuantity(
                      calculatedInitialStock,
                    )}{' '}
                    {pluralizeSaleUnit(
                      editing.saleUnit,
                      calculatedInitialStock,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    {
                      initialStockText
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-black/45">
                    Cálculo de stock
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {formatQuantity(
                      purchaseQuantity ||
                        0,
                    )}{' '}
                    ×{' '}
                    {formatQuantity(
                      contentQuantity ||
                        0,
                    )}{' '}
                    ={' '}
                    {formatQuantity(
                      Math.max(
                        purchaseQuantity ||
                          0,
                        0,
                      ) *
                        Math.max(
                          contentQuantity ||
                            0,
                          0,
                        ),
                    )}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    presentaciones ×
                    unidades por
                    presentación
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-black/5 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-mint text-forest">
                  <Calculator
                    size={
                      19
                    }
                  />
                </span>

                <div>
                  <p className="font-black">
                    Precio de venta y
                    ganancia
                  </p>

                  <p className="mt-1 text-xs text-black/45">
                    El precio sugerido
                    es una ayuda.
                    Puedes vender al
                    precio que decidas.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-bold">
                  Precio de venta por
                  unidad

                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    className="field mt-2"
                    value={
                      editing.salePrice ??
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      setField(
                        'salePrice',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ej. 1.50"
                  />
                </label>

                <label className="text-sm font-bold">
                  Ganancia objetivo

                  <div className="relative mt-2">
                    <input
                      min="0"
                      step="1"
                      type="number"
                      className="field pr-9"
                      value={
                        editing.targetMarkup ??
                        '25'
                      }
                      onChange={(
                        event,
                      ) =>
                        setField(
                          'targetMarkup',
                          event
                            .target
                            .value,
                        )
                      }
                    />

                    <span className="absolute right-3 top-3 text-sm font-bold text-black/40">
                      %
                    </span>
                  </div>
                </label>

                <div className="rounded-2xl bg-mint p-4 text-forest">
                  <p className="text-xs font-bold">
                    Precio sugerido
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {formatMoney(
                      suggestedPrice,
                    )}
                  </p>

                  <button
                    type="button"
                    className="mt-2 text-xs font-black underline"
                    onClick={() =>
                      setField(
                        'salePrice',
                        suggestedPrice.toFixed(
                          2,
                        ),
                      )
                    }
                    disabled={
                      suggestedPrice <=
                      0
                    }
                  >
                    Usar precio
                    sugerido
                  </button>
                </div>

                <div
                  className={`rounded-2xl p-4 ${
                    profit.amount >=
                    0
                      ? 'bg-mint text-forest'
                      : 'bg-coral/10 text-coral'
                  }`}
                >
                  <p className="flex items-center gap-2 text-xs font-bold">
                    <TrendingUp
                      size={
                        15
                      }
                    />

                    Ganancia estimada
                    por unidad
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
              </div>

              {!editing.id &&
                purchasePrice >
                  0 &&
                contentQuantity >
                  0 && (
                  <div className="mt-4 rounded-2xl bg-black/[0.025] p-4 text-sm">
                    <p className="font-black">
                      Ejemplo con tus
                      datos
                    </p>

                    <p className="mt-1 text-black/55">
                      Compras cada{' '}
                      {
                        purchasePresentation
                      }{' '}
                      a{' '}
                      {formatMoney(
                        purchasePrice,
                      )}{' '}
                      y contiene{' '}
                      {formatQuantity(
                        contentQuantity,
                      )}{' '}
                      {pluralizeSaleUnit(
                        editing.saleUnit,
                        contentQuantity,
                      )}
                      . Por eso cada
                      unidad te cuesta{' '}
                      <strong>
                        {money4(
                          displayUnitCost,
                        )}
                      </strong>
                      . Si la vendes a{' '}
                      <strong>
                        {formatMoney(
                          editing.salePrice ||
                            0,
                        )}
                      </strong>
                      , ganas{' '}
                      <strong>
                        {formatMoney(
                          profit.amount,
                        )}
                      </strong>{' '}
                      por unidad.
                    </p>
                  </div>
                )}
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Stock mínimo

                <input
                  required
                  min="0"
                  step="0.001"
                  type="number"
                  className="field mt-2"
                  value={
                    editing.minStock ??
                    '0'
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      'minStock',
                      event
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
                    editing.saleUnit ||
                    'unidad'
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      'saleUnit',
                      event
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
                    event,
                  ) =>
                    setField(
                      'lot',
                      event
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
                    event,
                  ) =>
                    setField(
                      'expirationDate',
                      event
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
                    event,
                  ) =>
                    setField(
                      'sanitaryRegistration',
                      event
                        .target
                        .value,
                    )
                  }
                />
              </label>
            </div>

            <section className="rounded-3xl bg-black/[0.025] p-4">
              <p className="font-black">
                Imagen del producto
              </p>

              <p className="mt-1 text-xs text-black/45">
                Puedes seleccionar una
                foto grande del
                celular. El sistema la
                redimensiona y comprime
                automáticamente antes
                de guardarla.
              </p>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white">
                  {editing.image ? (
                    <img
                      src={
                        editing.image
                      }
                      alt="Vista previa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus
                      size={
                        30
                      }
                      className="text-black/20"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="btn-secondary cursor-pointer">
                    <ImagePlus
                      size={
                        17
                      }
                    />

                    {processingImage
                      ? 'Procesando...'
                      : 'Elegir imagen'}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={
                        processingImage
                      }
                      onChange={
                        loadImage
                      }
                    />
                  </label>

                  {editing.image && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        setField(
                          'image',
                          '',
                        )
                      }
                    >
                      <Trash2
                        size={
                          16
                        }
                      />

                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            </section>

            <label className="flex items-center gap-3 rounded-2xl bg-mint p-4 text-sm font-bold text-forest">
              <input
                type="checkbox"
                checked={
                  editing.active !==
                  false
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    'active',
                    event
                      .target
                      .checked,
                  )
                }
              />

              Producto activo
            </label>

            {error && (
              <p className="rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
              <button
                type="button"
                className="btn-secondary"
                disabled={
                  saving
                }
                onClick={() =>
                  setEditing(
                    null,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  saving ||
                  processingImage
                }
              >
                <ShieldCheck
                  size={
                    17
                  }
                />

                {saving
                  ? 'Guardando...'
                  : editing.id
                    ? 'Guardar cambios'
                    : 'Crear producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}