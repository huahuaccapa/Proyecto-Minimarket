'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  Building2,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
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
  formatQuantity,
} from '../data/mock';

const emptySupplier =
  () => ({
    businessName:
      '',
    ruc:
      '',
    phone:
      '',
    email:
      '',
    address:
      '',
    notes:
      '',
    representatives:
      [],
  });

const newLine =
  (
    product,
  ) => ({
    id:
      createId(),

    productId:
      product?.id ||
      '',

    packages:
      '1',

    contentQuantity:
      String(
        product?.contentQuantity ||
          1,
      ),

    purchasePrice:
      String(
        product?.purchasePrice ||
          '',
      ),

    lot:
      '',

    expirationDate:
      '',
  });

const emptyPurchase =
  (
    supplierId =
      '',

    product =
      null,
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

    notes:
      '',

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
  onVoidPurchase,
  onSaveSupplier,
}) {
  const [
    tab,
    setTab,
  ] =
    useState(
      'purchases',
    );

  const [
    form,
    setForm,
  ] =
    useState(
      null,
    );

  const [
    supplierForm,
    setSupplierForm,
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

  const activeProducts =
    useMemo(
      () =>
        products.filter(
          (item) =>
            item.active,
        ),

      [
        products,
      ],
    );

  const activeSuppliers =
    useMemo(
      () =>
        suppliers.filter(
          (item) =>
            item.active !==
            false,
        ),

      [
        suppliers,
      ],
    );

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

      [
        products,
      ],
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

  const openPurchase =
    () => {
      setError(
        '',
      );

      setForm(
        emptyPurchase(
          activeSuppliers[0]
            ?.id ||
            '',

          activeProducts[0] ||
            null,
        ),
      );
    };

  const updateLine =
    (
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
                      String(
                        product?.contentQuantity ||
                          1,
                      ),

                    purchasePrice:
                      String(
                        product?.purchasePrice ||
                          '',
                      ),

                    lot:
                      '',

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

  const addLine =
    () => {
      setForm(
        (
          current,
        ) => ({
          ...current,

          detail: [
            ...current.detail,

            newLine(
              activeProducts[0] ||
                null,
            ),
          ],
        }),
      );
    };

  const removeLine =
    (
      id,
    ) => {
      setForm(
        (
          current,
        ) => ({
          ...current,

          detail:
            current.detail
              .length >
            1
              ? current.detail.filter(
                  (
                    line,
                  ) =>
                    line.id !==
                    id,
                )
              : current.detail,
        }),
      );
    };

  const readDocument =
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
        1_800_000
      ) {
        setError(
          'El comprobante debe pesar menos de 1.8 MB.',
        );

        event.target.value =
          '';

        return;
      }

      const reader =
        new FileReader();

      reader.onload =
        () => {
          setForm(
            (
              current,
            ) => ({
              ...current,

              documentName:
                file.name,

              documentMimeType:
                file.type,

              documentDataUrl:
                String(
                  reader.result,
                ),
            }),
          );
        };

      reader.readAsDataURL(
        file,
      );
    };

  const submitPurchase =
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

        await onSavePurchase({
          ...form,

          paymentMethod:
            'Efectivo',

          paymentStatus:
            'Pagado',

          detail,
        });

        setForm(
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

  const voidPurchase =
    async (
      purchase,
    ) => {
      if (
        purchase.status ===
        'voided'
      ) {
        return;
      }

      if (
        !window.confirm(
          `¿Anular ${purchase.number}? El stock se revertirá y el dinero regresará a caja.`,
        )
      ) {
        return;
      }

      const reason =
        window.prompt(
          'Motivo de la anulación:',

          'Compra registrada por error',
        );

      if (
        reason ===
        null
      ) {
        return;
      }

      setError(
        '',
      );

      try {
        await onVoidPurchase(
          purchase.id,

          reason.trim() ||
            'Anulación de compra',
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      }
    };

  const submitSupplier =
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
        await onSaveSupplier(
          supplierForm,
        );

        setSupplierForm(
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
        eyebrow="Abastecimiento"
        title="Compras y proveedores"
        description="Toda compra registrada se paga en efectivo, aumenta el stock y descuenta automáticamente el total de la caja abierta."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={
              tab ===
              'purchases'
                ? openPurchase
                : () =>
                    setSupplierForm(
                      emptySupplier(),
                    )
            }
          >
            <Plus
              size={
                18
              }
            />

            {tab ===
            'purchases'
              ? 'Nueva compra'
              : 'Nuevo proveedor'}
          </button>
        }
      />

      <div className="mb-5 flex gap-2 rounded-2xl bg-black/[0.035] p-1.5 sm:w-fit">
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
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
          <ReceiptText
            className="mr-2 inline"
            size={
              16
            }
          />

          Compras
        </button>

        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
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
          <Building2
            className="mr-2 inline"
            size={
              16
            }
          />

          Proveedores
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">
          {error}
        </p>
      )}

      {tab ===
      'purchases' ? (
        !purchases.length ? (
          <div className="panel">
            <EmptyState
              text="Todavía no hay compras registradas."
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {purchases.map(
              (
                purchase,
              ) => (
                <article
                  key={
                    purchase.id
                  }
                  className={`panel p-5 ${
                    purchase.status ===
                    'voided'
                      ? 'opacity-60'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-forest">
                        {
                          purchase.number
                        }
                      </p>

                      <h3 className="mt-1 text-lg font-black">
                        {
                          purchase.supplier
                        }
                      </h3>

                      <p className="mt-1 text-xs text-black/45">
                        {
                          purchase.documentType
                        }{' '}
                        {
                          purchase.documentNumber
                        }{' '}
                        ·{' '}
                        {formatDate(
                          purchase.date,
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-black/40">
                        Total
                      </p>

                      <p className="text-xl font-black">
                        {formatMoney(
                          purchase.total,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(purchase.detail ||
                      []).map(
                      (
                        line,
                      ) => (
                        <div
                          key={`${purchase.id}-${line.productId}`}
                          className="flex justify-between gap-3 rounded-xl bg-black/[0.025] p-3 text-sm"
                        >
                          <div>
                            <p className="font-bold">
                              {
                                line.productName
                              }
                            </p>

                            <p className="mt-1 text-xs text-black/45">
                              {formatQuantity(
                                line.units,
                              )}{' '}
                              unidades ·
                              costo unit.{' '}
                              {formatMoney(
                                line.unitCost,
                              )}
                            </p>
                          </div>

                          <strong>
                            {formatMoney(
                              line.subtotal,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-mint p-3 text-xs text-forest">
                    <strong>
                      Efectivo ·
                      Pagado.
                    </strong>{' '}
                    Esta compra
                    descontó{' '}
                    {formatMoney(
                      purchase.total,
                    )}{' '}
                    de caja.
                  </div>

                  {purchase.documentDataUrl && (
                    <a
                      href={
                        purchase.documentDataUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary mt-3 w-full"
                    >
                      <FileText
                        size={
                          16
                        }
                      />

                      Ver
                      comprobante
                    </a>
                  )}

                  {purchase.status ===
                  'voided' ? (
                    <div className="mt-4 rounded-xl bg-coral/10 p-3 text-xs font-bold text-coral">
                      Compra
                      anulada

                      {purchase.voidReason
                        ? ` · ${purchase.voidReason}`
                        : ''}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary mt-4 w-full text-coral"
                      onClick={() =>
                        voidPurchase(
                          purchase,
                        )
                      }
                    >
                      <Trash2
                        size={
                          16
                        }
                      />

                      Anular
                      compra
                    </button>
                  )}
                </article>
              ),
            )}
          </div>
        )
      ) : !suppliers.length ? (
        <div className="panel">
          <EmptyState
            text="Todavía no hay proveedores registrados."
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map(
            (
              supplier,
            ) => (
              <article
                key={
                  supplier.id
                }
                className="panel p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">
                      {
                        supplier.businessName
                      }
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      RUC:{' '}
                      {supplier.ruc ||
                        '—'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl p-2 hover:bg-black/5"
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
                        17
                      }
                    />
                  </button>
                </div>

                <div className="mt-4 space-y-1 text-sm text-black/55">
                  <p>
                    {supplier.phone ||
                      'Sin teléfono'}
                  </p>

                  <p>
                    {supplier.email ||
                      'Sin correo'}
                  </p>

                  <p>
                    {supplier.address ||
                      'Sin dirección'}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      {form && (
        <Modal
          title="Registrar compra"
          wide
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

                  {activeSuppliers.map(
                    (
                      supplier,
                    ) => (
                      <option
                        key={
                          supplier.id
                        }
                        value={
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                    Ticket
                  </option>
                </select>
              </label>

              <label className="text-sm font-bold">
                Número de
                comprobante

                <input
                  required
                  className="field mt-2"
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

            <div className="rounded-3xl bg-black/[0.025] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-black">
                  Productos
                  comprados
                </h3>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    addLine
                  }
                >
                  <Plus
                    size={
                      16
                    }
                  />

                  Agregar
                </button>
              </div>

              <div className="space-y-4">
                {form.detail.map(
                  (
                    line,
                    index,
                  ) => (
                    <div
                      key={
                        line.id
                      }
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <strong>
                          Producto{' '}
                          {index +
                            1}
                        </strong>

                        <button
                          type="button"
                          className="rounded-xl p-2 text-coral hover:bg-coral/10"
                          onClick={() =>
                            removeLine(
                              line.id,
                            )
                          }
                          disabled={
                            form
                              .detail
                              .length ===
                            1
                          }
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>
                      </div>

                      <label className="block text-sm font-bold">
                        Producto

                        <select
                          required
                          className="field mt-2"
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

                          {activeProducts.map(
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

                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <label className="text-sm font-bold">
                          Presentaciones

                          <input
                            required
                            min="0.001"
                            step="0.001"
                            type="number"
                            className="field mt-2"
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

                        <label className="text-sm font-bold">
                          Contenido

                          <input
                            required
                            min="0.001"
                            step="0.001"
                            type="number"
                            className="field mt-2"
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

                        <label className="text-sm font-bold">
                          Costo por
                          presentación

                          <input
                            required
                            min="0.01"
                            step="0.01"
                            type="number"
                            className="field mt-2"
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
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-bold">
                          Lote

                          <input
                            className="field mt-2"
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

                        <label className="text-sm font-bold">
                          Vencimiento

                          <input
                            type="date"
                            className="field mt-2"
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

                <input
                  readOnly
                  className="field mt-2 bg-black/[0.03]"
                  value="Efectivo"
                />
              </label>

              <label className="text-sm font-bold">
                Estado

                <input
                  readOnly
                  className="field mt-2 bg-black/[0.03]"
                  value="Pagado"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-mint p-4">
              <div className="flex justify-between">
                <span>
                  Unidades a
                  ingresar
                </span>

                <strong>
                  {formatQuantity(
                    units,
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

            <div className="rounded-xl bg-amber/10 p-3 text-xs">
              <strong>
                Importante:
              </strong>{' '}

              al registrar la
              compra, el total
              se descontará
              automáticamente
              de la caja
              abierta. Si no
              existe caja
              abierta o no
              alcanza el
              efectivo, la
              compra será
              rechazada y el
              stock no cambiará.
            </div>

            <label className="block text-sm font-bold">
              Comprobante digital

              <input
                type="file"
                accept="image/*,application/pdf"
                className="field mt-2"
                onChange={
                  readDocument
                }
              />

              {form.documentName && (
                <p className="mt-1 text-xs text-forest">
                  {
                    form.documentName
                  }
                </p>
              )}
            </label>

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

            <button
              className="btn-primary w-full"
              disabled={
                saving
              }
            >
              {saving
                ? 'Registrando...'
                : `Registrar compra por ${formatMoney(total)}`}
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

            <button
              className="btn-primary w-full"
              disabled={
                saving
              }
            >
              {saving
                ? 'Guardando...'
                : 'Guardar proveedor'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}