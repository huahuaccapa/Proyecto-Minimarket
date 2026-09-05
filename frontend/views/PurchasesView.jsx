'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  Plus,
  Building2,
  ReceiptText,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  EmptyState,
  Modal,
  PageTitle,
} from '../components/ui';

import {
  createId,
  formatDate,
  formatMoney,
} from '../data/mock';

const emptySupplier =
  () => ({
    businessName:
      '',

    ruc: '',

    phone: '',

    email: '',

    address: '',

    notes: '',

    representatives:
      [],
  });

const newLine = (
  product,
) => ({
  id: createId(),

  productId:
    product?.id ||
    '',

  packages: 1,

  contentQuantity:
    Number(
      product?.contentQuantity ||
        1,
    ),

  purchasePrice:
    Number(
      product?.purchasePrice ||
        0,
    ),

  lot: '',

  expirationDate:
    '',
});

const emptyPurchase = (
  supplierId = '',
  product = null,
) => ({
  supplierId,

  documentType:
    'Factura',

  documentNumber:
    '',

  date:
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      ),

  paymentMethod:
    'Efectivo',

  paymentStatus:
    'Pagado',

  notes: '',

  documentName:
    '',

  documentMimeType:
    '',

  documentDataUrl:
    '',

  detail: [
    newLine(
      product,
    ),
  ],
});

export default function PurchasesView({
  purchases,
  suppliers,
  products,
  onSavePurchase,
  onSaveSupplier,
}) {
  const [
    tab,
    setTab,
  ] = useState(
    'purchases',
  );

  const [
    form,
    setForm,
  ] = useState(null);

  const [
    supplierForm,
    setSupplierForm,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const productMap =
    useMemo(
      () =>
        new Map(
          products.map(
            (
              product,
            ) => [
              product.id,
              product,
            ],
          ),
        ),
      [products],
    );

  const total =
    form
      ? form.detail.reduce(
          (
            sum,
            line,
          ) =>
            sum +
            Number(
              line.packages ||
                0,
            ) *
              Number(
                line.purchasePrice ||
                  0,
              ),
          0,
        )
      : 0;

  const units =
    form
      ? form.detail.reduce(
          (
            sum,
            line,
          ) =>
            sum +
            Number(
              line.packages ||
                0,
            ) *
              Number(
                line.contentQuantity ||
                  0,
              ),
          0,
        )
      : 0;

  const updateLine = (
    id,
    field,
    value,
  ) => {
    setForm(
      (
        current,
      ) => ({
        ...current,

        detail:
          current.detail.map(
            (
              line,
            ) => {
              if (
                line.id !==
                id
              ) {
                return line;
              }

              if (
                field ===
                'productId'
              ) {
                const product =
                  productMap.get(
                    value,
                  );

                return {
                  ...line,

                  productId:
                    value,

                  contentQuantity:
                    Number(
                      product?.contentQuantity ||
                        1,
                    ),

                  purchasePrice:
                    Number(
                      product?.purchasePrice ||
                        0,
                    ),

                  lot: '',

                  expirationDate:
                    '',
                };
              }

              return {
                ...line,

                [field]:
                  value,
              };
            },
          ),
      }),
    );
  };

  const submitPurchase =
    async (
      event,
    ) => {
      event.preventDefault();

      setError('');

      try {
        if (
          !form.supplierId
        ) {
          throw new Error(
            'Selecciona un proveedor.',
          );
        }

        if (
          !form.documentNumber.trim()
        ) {
          throw new Error(
            'Ingresa el número del comprobante.',
          );
        }

        const detail =
          form.detail.map(
            (
              {
                id,
                ...line
              },
            ) => ({
              ...line,

              packages:
                Number(
                  line.packages,
                ),

              contentQuantity:
                Number(
                  line.contentQuantity,
                ),

              purchasePrice:
                Number(
                  line.purchasePrice,
                ),
            }),
          );

        if (
          detail.some(
            (
              line,
            ) =>
              !line.productId,
          )
        ) {
          throw new Error(
            'Selecciona un producto en cada fila.',
          );
        }

        if (
          detail.some(
            (
              line,
            ) =>
              !Number.isFinite(
                line.packages,
              ) ||
              line.packages <=
                0,
          )
        ) {
          throw new Error(
            'La cantidad comprada debe ser mayor que cero.',
          );
        }

        if (
          detail.some(
            (
              line,
            ) =>
              !Number.isFinite(
                line.contentQuantity,
              ) ||
              line.contentQuantity <=
                0,
          )
        ) {
          throw new Error(
            'Las unidades por presentación deben ser mayores que cero.',
          );
        }

        if (
          detail.some(
            (
              line,
            ) =>
              !Number.isFinite(
                line.purchasePrice,
              ) ||
              line.purchasePrice <=
                0,
          )
        ) {
          throw new Error(
            'Todos los productos deben tener un costo válido.',
          );
        }

        await onSavePurchase({
          ...form,
          detail,
        });

        setForm(null);
      } catch (error) {
        setError(
          error.message,
        );
      }
    };

  const submitSupplier =
    async (
      event,
    ) => {
      event.preventDefault();

      setError('');

      try {
        await onSaveSupplier(
          supplierForm,
        );

        setSupplierForm(
          null,
        );
      } catch (error) {
        setError(
          error.message,
        );
      }
    };

  const openPurchase =
    () => {
      setError('');

      setForm(
        emptyPurchase(
          suppliers[0]
            ?.id,

          products[0],
        ),
      );
    };

  const openSupplier =
    () => {
      setError('');

      setSupplierForm(
        emptySupplier(),
      );
    };

  return (
    <>
      <PageTitle
        eyebrow="Abastecimiento"
        title="Compras y proveedores"
        description="Cada compra aumenta el inventario y, cuando se paga en efectivo, descuenta automáticamente el dinero de la caja."
        action={
          <button
            className="btn-primary"
            onClick={() =>
              tab ===
              'purchases'
                ? openPurchase()
                : openSupplier()
            }
          >
            <Plus
              size={18}
            />

            {tab ===
            'purchases'
              ? 'Nueva compra'
              : 'Nuevo proveedor'}
          </button>
        }
      />

      <div className="mb-5 flex w-fit rounded-2xl bg-black/5 p-1">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-black ${
            tab ===
            'purchases'
              ? 'bg-white shadow-sm'
              : 'text-black/45'
          }`}
          onClick={() =>
            setTab(
              'purchases',
            )
          }
        >
          Compras
        </button>

        <button
          className={`rounded-xl px-4 py-2 text-sm font-black ${
            tab ===
            'suppliers'
              ? 'bg-white shadow-sm'
              : 'text-black/45'
          }`}
          onClick={() =>
            setTab(
              'suppliers',
            )
          }
        >
          Proveedores
        </button>
      </div>

      {tab ===
      'purchases' ? (
        purchases.length ? (
          <section className="grid gap-4 xl:grid-cols-2">
            {purchases.map(
              (
                purchase,
              ) => (
                <article
                  className="panel p-5"
                  key={
                    purchase.id
                  }
                >
                  <div className="flex justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-amber/20">
                        <ReceiptText
                          size={
                            20
                          }
                        />
                      </span>

                      <div>
                        <p className="text-xs font-black text-black/35">
                          {
                            purchase.documentType
                          }
                        </p>

                        <h2 className="font-black">
                          {
                            purchase.documentNumber
                          }
                        </h2>
                      </div>
                    </div>

                    <span className="badge bg-black/5">
                      {
                        purchase.number
                      }
                    </span>
                  </div>

                  <p className="mt-4 font-black">
                    {
                      purchase.supplier
                    }
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 text-sm">
                    <div>
                      <p className="text-black/40">
                        Fecha
                      </p>

                      <strong>
                        {formatDate(
                          purchase.date,
                        )}
                      </strong>
                    </div>

                    <div>
                      <p className="text-black/40">
                        Total
                      </p>

                      <strong>
                        {formatMoney(
                          purchase.total,
                        )}
                      </strong>
                    </div>

                    <div>
                      <p className="text-black/40">
                        Unidades
                      </p>

                      <strong>
                        {
                          purchase.items
                        }
                      </strong>
                    </div>

                    <div>
                      <p className="text-black/40">
                        Pago
                      </p>

                      <strong>
                        {
                          purchase.paymentMethod
                        }
                      </strong>
                    </div>
                  </div>

                  {purchase.paymentStatus && (
                    <p className="mt-3 text-xs font-bold text-black/45">
                      Estado:{' '}
                      {
                        purchase.paymentStatus
                      }
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {(
                      purchase.detail ||
                      []
                    ).map(
                      (
                        line,
                        index,
                      ) => (
                        <div
                          key={`${purchase.id}-${index}`}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span>
                            {
                              line.productName
                            }{' '}
                            ·{' '}
                            {
                              line.units
                            }{' '}
                            und.
                          </span>

                          <strong>
                            {formatMoney(
                              line.subtotal,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                </article>
              ),
            )}
          </section>
        ) : (
          <EmptyState text="Todavía no hay compras registradas" />
        )
      ) : suppliers.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {suppliers.map(
            (
              supplier,
            ) => (
              <article
                className="panel p-5"
                key={
                  supplier.id
                }
              >
                <div className="flex justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-mint text-forest">
                    <Building2
                      size={
                        20
                      }
                    />
                  </span>

                  <button
                    className="inline-flex items-center gap-2 text-xs font-black text-forest"
                    onClick={() => {
                      setError(
                        '',
                      );

                      setSupplierForm({
                        ...supplier,
                      });
                    }}
                  >
                    <Pencil
                      size={
                        15
                      }
                    />
                    Editar
                  </button>
                </div>

                <h2 className="mt-4 text-lg font-black">
                  {
                    supplier.businessName
                  }
                </h2>

                <p className="mt-2 text-sm text-black/45">
                  RUC:{' '}
                  {supplier.ruc ||
                    '—'}
                </p>

                <p className="text-sm text-black/45">
                  {supplier.phone ||
                    'Sin teléfono'}{' '}
                  ·{' '}
                  {supplier.email ||
                    'Sin correo'}
                </p>

                {supplier.address && (
                  <p className="mt-2 text-sm text-black/45">
                    {
                      supplier.address
                    }
                  </p>
                )}
              </article>
            ),
          )}
        </section>
      ) : (
        <EmptyState text="Todavía no hay proveedores" />
      )}

      {form && (
        <Modal
          title="Registrar compra"
          onClose={() => {
            setForm(
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
              submitPurchase
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Proveedor

                <select
                  required
                  className="field mt-2"
                  value={
                    form.supplierId
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm({
                      ...form,

                      supplierId:
                        e
                          .target
                          .value,
                    })
                  }
                >
                  <option value="">
                    Selecciona
                  </option>

                  {suppliers.map(
                    (
                      supplier,
                    ) => (
                      <option
                        value={
                          supplier.id
                        }
                        key={
                          supplier.id
                        }
                      >
                        {
                          supplier.businessName
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-sm font-bold">
                Fecha

                <input
                  required
                  type="date"
                  className="field mt-2"
                  value={
                    form.date
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm({
                      ...form,

                      date:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Tipo de
                comprobante

                <select
                  className="field mt-2"
                  value={
                    form.documentType
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm({
                      ...form,

                      documentType:
                        e
                          .target
                          .value,
                    })
                  }
                >
                  <option>
                    Factura
                  </option>

                  <option>
                    Boleta
                  </option>

                  <option>
                    Nota de
                    venta
                  </option>
                </select>
              </label>

              <label className="text-sm font-bold">
                N.º documento

                <input
                  required
                  className="field mt-2"
                  placeholder="F001-000123"
                  value={
                    form.documentNumber
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm({
                      ...form,

                      documentNumber:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black">
                    Productos
                    comprados
                  </h3>

                  <p className="text-xs text-black/40">
                    Cada fila
                    ingresará
                    stock al
                    inventario.
                  </p>
                </div>

                <button
                  type="button"
                  className="text-sm font-black text-forest"
                  onClick={() =>
                    setForm({
                      ...form,

                      detail: [
                        ...form.detail,

                        newLine(
                          products[0],
                        ),
                      ],
                    })
                  }
                >
                  + Agregar
                  producto
                </button>
              </div>

              <div className="space-y-3">
                {form.detail.map(
                  (
                    line,
                    index,
                  ) => (
                    <div
                      className="rounded-2xl bg-cream p-4"
                      key={
                        line.id
                      }
                    >
                      <div className="flex justify-between">
                        <strong>
                          Producto{' '}
                          {index +
                            1}
                        </strong>

                        {form
                          .detail
                          .length >
                          1 && (
                          <button
                            type="button"
                            className="text-coral"
                            onClick={() =>
                              setForm({
                                ...form,

                                detail:
                                  form.detail.filter(
                                    (
                                      item,
                                    ) =>
                                      item.id !==
                                      line.id,
                                  ),
                              })
                            }
                          >
                            <Trash2
                              size={
                                17
                              }
                            />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-bold">
                          Producto

                          <select
                            required
                            className="field mt-1"
                            value={
                              line.productId
                            }
                            onChange={(
                              e,
                            ) =>
                              updateLine(
                                line.id,
                                'productId',
                                e
                                  .target
                                  .value,
                              )
                            }
                          >
                            <option value="">
                              Selecciona
                            </option>

                            {products
                              .filter(
                                (
                                  product,
                                ) =>
                                  product.active !==
                                  false,
                              )
                              .map(
                                (
                                  product,
                                ) => (
                                  <option
                                    key={
                                      product.id
                                    }
                                    value={
                                      product.id
                                    }
                                  >
                                    {
                                      product.name
                                    }
                                  </option>
                                ),
                              )}
                          </select>
                        </label>

                        <label className="text-xs font-bold">
                          Paquetes /
                          presentaciones

                          <input
                            required
                            min="0.001"
                            step="0.001"
                            type="number"
                            className="field mt-1"
                            value={
                              line.packages
                            }
                            onChange={(
                              e,
                            ) =>
                              updateLine(
                                line.id,
                                'packages',
                                e
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>

                        <label className="text-xs font-bold">
                          Unidades
                          por
                          presentación

                          <input
                            required
                            min="0.001"
                            step="0.001"
                            type="number"
                            className="field mt-1"
                            value={
                              line.contentQuantity
                            }
                            onChange={(
                              e,
                            ) =>
                              updateLine(
                                line.id,
                                'contentQuantity',
                                e
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>

                        <label className="text-xs font-bold">
                          Costo por
                          presentación

                          <input
                            required
                            min="0.01"
                            step="0.01"
                            type="number"
                            className="field mt-1"
                            value={
                              line.purchasePrice
                            }
                            onChange={(
                              e,
                            ) =>
                              updateLine(
                                line.id,
                                'purchasePrice',
                                e
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>

                        <label className="text-xs font-bold">
                          Lote

                          <input
                            className="field mt-1"
                            value={
                              line.lot
                            }
                            onChange={(
                              e,
                            ) =>
                              updateLine(
                                line.id,
                                'lot',
                                e
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>

                        <label className="text-xs font-bold">
                          Vencimiento

                          <input
                            type="date"
                            className="field mt-1"
                            value={
                              line.expirationDate
                            }
                            onChange={(
                              e,
                            ) =>
                              updateLine(
                                line.id,
                                'expirationDate',
                                e
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Forma de pago

                <select
                  className="field mt-2"
                  value={
                    form.paymentMethod
                  }
                  onChange={(
                    e,
                  ) => {
                    const paymentMethod =
                      e
                        .target
                        .value;

                    setForm({
                      ...form,

                      paymentMethod,

                      paymentStatus:
                        paymentMethod ===
                        'Efectivo'
                          ? 'Pagado'
                          : 'Pendiente',
                    });
                  }}
                >
                  <option>
                    Efectivo
                  </option>

                  <option>
                    Crédito
                    proveedor
                  </option>
                </select>
              </label>

              <label className="text-sm font-bold">
                Estado

                <select
                  className="field mt-2"
                  value={
                    form.paymentStatus
                  }
                  disabled={
                    form.paymentMethod ===
                    'Efectivo'
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm({
                      ...form,

                      paymentStatus:
                        e
                          .target
                          .value,
                    })
                  }
                >
                  <option>
                    Pagado
                  </option>

                  <option>
                    Pendiente
                  </option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl bg-mint p-4">
              <div className="flex justify-between">
                <span>
                  Unidades a
                  ingresar
                </span>

                <strong>
                  {Number(
                    units.toFixed(
                      3,
                    ),
                  )}
                </strong>
              </div>

              <div className="mt-2 flex justify-between text-lg">
                <span className="font-black">
                  Total
                </span>

                <strong>
                  {formatMoney(
                    total,
                  )}
                </strong>
              </div>
            </div>

            {form.paymentMethod ===
              'Efectivo' && (
              <div className="rounded-xl bg-amber/10 p-3 text-xs">
                <strong>
                  Importante:
                </strong>{' '}
                el total se
                descontará
                automáticamente
                de la caja
                abierta.
              </div>
            )}

            {form.paymentMethod ===
              'Crédito proveedor' && (
              <div className="rounded-xl bg-mint p-3 text-xs">
                El stock
                ingresará al
                inventario,
                pero no se
                descontará
                dinero de caja
                porque la compra
                quedará
                pendiente de
                pago.
              </div>
            )}

            <label className="block text-sm font-bold">
              Notas

              <textarea
                className="field mt-2"
                rows="2"
                value={
                  form.notes
                }
                onChange={(
                  e,
                ) =>
                  setForm({
                    ...form,

                    notes:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            {error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button className="btn-primary w-full">
              Registrar
              compra
            </button>
          </form>
        </Modal>
      )}

      {supplierForm && (
        <Modal
          title={
            supplierForm.id
              ? 'Editar proveedor'
              : 'Nuevo proveedor'
          }
          onClose={() => {
            setSupplierForm(
              null,
            );

            setError(
              '',
            );
          }}
        >
          <form
            className="space-y-4"
            onSubmit={
              submitSupplier
            }
          >
            <label className="block text-sm font-bold">
              Razón social

              <input
                required
                className="field mt-2"
                value={
                  supplierForm.businessName
                }
                onChange={(
                  e,
                ) =>
                  setSupplierForm({
                    ...supplierForm,

                    businessName:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold">
                RUC

                <input
                  className="field mt-2"
                  value={
                    supplierForm.ruc ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setSupplierForm({
                      ...supplierForm,

                      ruc:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Teléfono

                <input
                  className="field mt-2"
                  value={
                    supplierForm.phone ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setSupplierForm({
                      ...supplierForm,

                      phone:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <label className="block text-sm font-bold">
              Correo

              <input
                type="email"
                className="field mt-2"
                value={
                  supplierForm.email ||
                  ''
                }
                onChange={(
                  e,
                ) =>
                  setSupplierForm({
                    ...supplierForm,

                    email:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label className="block text-sm font-bold">
              Dirección

              <input
                className="field mt-2"
                value={
                  supplierForm.address ||
                  ''
                }
                onChange={(
                  e,
                ) =>
                  setSupplierForm({
                    ...supplierForm,

                    address:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label className="block text-sm font-bold">
              Notas

              <textarea
                rows="2"
                className="field mt-2"
                value={
                  supplierForm.notes ||
                  ''
                }
                onChange={(
                  e,
                ) =>
                  setSupplierForm({
                    ...supplierForm,

                    notes:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            {error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button className="btn-primary w-full">
              Guardar
              proveedor
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}