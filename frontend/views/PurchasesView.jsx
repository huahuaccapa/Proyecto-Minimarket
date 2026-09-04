'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  FileText,
  Building2,
  UserRound,
  Phone,
  Mail,
  MapPin,
  Eye,
  ImageIcon,
  ReceiptText,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  Modal,
  PageTitle,
  EmptyState,
} from '../components/ui';

import {
  formatDate,
  formatMoney,
  createId,
} from '../data/mock';

const emptyRepresentative = () => ({
  id: createId(),
  name: '',
  position: '',
  phone: '',
  email: '',
  notes: '',
});

const emptySupplier = () => ({
  businessName: '',
  ruc: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  representatives: [],
});

const emptyPurchase = (
  supplierId = ''
) => ({
  supplierId,
  documentType: 'Factura',
  documentNumber: '',
  date: new Date()
    .toISOString()
    .slice(0, 10),

  total: '',
  items: '',
  currency: 'PEN',

  notes: '',

  documentName: '',
  documentMimeType: '',
  documentDataUrl: '',
});

export default function PurchasesView({
  purchases,
  suppliers,
  onSavePurchase,
  onSaveSupplier,
}) {
  const [tab, setTab] =
    useState('documents');

  const [
    purchaseForm,
    setPurchaseForm,
  ] = useState(null);

  const [
    supplierForm,
    setSupplierForm,
  ] = useState(null);

  const [detail, setDetail] =
    useState(null);

  const [error, setError] =
    useState('');

  /*
   * Facilita encontrar un proveedor
   * usando supplierId.
   */
  const supplierById =
    useMemo(
      () =>
        new Map(
          suppliers.map(
            (supplier) => [
              supplier.id,
              supplier,
            ]
          )
        ),
      [suppliers]
    );

  /*
   * ABRIR FORMULARIO DE DOCUMENTO
   */
  const openPurchase = () => {
    setError('');

    setPurchaseForm(
      emptyPurchase(
        suppliers[0]?.id || ''
      )
    );
  };

  /*
   * ABRIR FORMULARIO DE PROVEEDOR
   */
  const openSupplier = (
    supplier = null
  ) => {
    setError('');

    setSupplierForm(
      supplier
        ? {
            ...supplier,

            representatives:
              (
                supplier.representatives ||
                []
              ).map(
                (item) => ({
                  ...item,
                })
              ),
          }
        : emptySupplier()
    );
  };

  /*
   * LEER IMAGEN DE FACTURA / BOLETA
   */
  const readDocument = (
    file
  ) => {
    if (!file) {
      return;
    }

    /*
     * Limitamos el tamaño debido a que
     * actualmente el backend todavía
     * almacena todo en memoria.
     */
    if (
      file.size >
      1.5 * 1024 * 1024
    ) {
      setError(
        'La imagen debe pesar como máximo 1.5 MB.'
      );

      return;
    }

    /*
     * En esta versión usamos imágenes
     * porque podemos visualizarlas
     * directamente dentro del sistema.
     */
    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      setError(
        'Por ahora adjunta una imagen JPG, PNG o WEBP para poder visualizarla dentro del sistema.'
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setPurchaseForm(
        (current) => ({
          ...current,

          documentName:
            file.name,

          documentMimeType:
            file.type,

          documentDataUrl:
            reader.result,
        })
      );

      setError('');
    };

    reader.readAsDataURL(file);
  };

  /*
   * GUARDAR BOLETA / FACTURA
   */
  const submitPurchase =
    async (event) => {
      event.preventDefault();

      setError('');

      if (
        !purchaseForm.supplierId
      ) {
        setError(
          'Primero registra o selecciona un proveedor.'
        );

        return;
      }

      await onSavePurchase({
        ...purchaseForm,

        total: Number(
          purchaseForm.total
        ),

        items: Number(
          purchaseForm.items ||
            0
        ),
      });

      setPurchaseForm(null);
    };

  /*
   * GUARDAR PROVEEDOR
   */
  const submitSupplier =
    async (event) => {
      event.preventDefault();

      setError('');

      /*
       * Quitamos representantes
       * completamente vacíos.
       */
      const cleanRepresentatives =
        (
          supplierForm.representatives ||
          []
        ).filter(
          (item) =>
            item.name.trim() ||
            item.phone.trim() ||
            item.email.trim()
        );

      await onSaveSupplier({
        ...supplierForm,

        representatives:
          cleanRepresentatives,
      });

      setSupplierForm(null);
    };

  /*
   * AÑADIR REPRESENTANTE
   */
  const addRepresentative =
    () => {
      setSupplierForm(
        (current) => ({
          ...current,

          representatives: [
            ...(
              current.representatives ||
              []
            ),

            emptyRepresentative(),
          ],
        })
      );
    };

  /*
   * MODIFICAR REPRESENTANTE
   */
  const updateRepresentative = (
    id,
    field,
    value
  ) => {
    setSupplierForm(
      (current) => ({
        ...current,

        representatives:
          current.representatives.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          ),
      })
    );
  };

  /*
   * ELIMINAR REPRESENTANTE
   */
  const removeRepresentative =
    (id) => {
      setSupplierForm(
        (current) => ({
          ...current,

          representatives:
            current.representatives.filter(
              (item) =>
                item.id !== id
            ),
        })
      );
    };

  return (
    <>
      <PageTitle
        eyebrow="Abastecimiento"
        title="Compras y boletas"
        description="Organiza facturas y boletas de proveedores, conserva su imagen y administra los contactos comerciales de cada proveedor."
        action={
          <button
            className="btn-primary"
            onClick={
              tab ===
              'documents'
                ? openPurchase
                : () =>
                    openSupplier()
            }
          >
            <Plus size={18} />

            {tab ===
            'documents'
              ? 'Registrar documento'
              : 'Nuevo proveedor'}
          </button>
        }
      />

      {/* PESTAÑAS */}

      <div className="mb-5 flex w-fit rounded-2xl bg-black/5 p-1">

        <button
          className={`
            rounded-xl
            px-4
            py-2
            text-sm
            font-black

            ${
              tab ===
              'documents'
                ? 'bg-white shadow-sm'
                : 'text-black/45'
            }
          `}
          onClick={() =>
            setTab(
              'documents'
            )
          }
        >
          Documentos de compra
        </button>

        <button
          className={`
            rounded-xl
            px-4
            py-2
            text-sm
            font-black

            ${
              tab ===
              'suppliers'
                ? 'bg-white shadow-sm'
                : 'text-black/45'
            }
          `}
          onClick={() =>
            setTab(
              'suppliers'
            )
          }
        >
          Proveedores y
          representantes
        </button>
      </div>

      {/* ===================================== */}
      {/* DOCUMENTOS DE COMPRA */}
      {/* ===================================== */}

      {tab ===
      'documents' ? (
        purchases.length ? (
          <section className="grid gap-4 xl:grid-cols-2">

            {purchases.map(
              (purchase) => {
                const supplier =
                  supplierById.get(
                    purchase.supplierId
                  );

                return (
                  <article
                    className="panel p-5"
                    key={
                      purchase.id
                    }
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <span className="grid size-11 place-items-center rounded-2xl bg-amber/20 text-[#8c5c00]">
                          <ReceiptText
                            size={
                              20
                            }
                          />
                        </span>

                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-black/35">
                            {purchase.documentType ||
                              'Documento'}
                          </p>

                          <h2 className="font-black">
                            {purchase.documentNumber ||
                              purchase.number}
                          </h2>
                        </div>
                      </div>

                      <span className="badge bg-black/5 text-black/45">
                        {
                          purchase.number
                        }
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm text-black/40">
                        Proveedor
                      </p>

                      <p className="font-black">
                        {supplier?.businessName ||
                          purchase.supplier}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 text-sm">

                      <div>
                        <p className="text-black/40">
                          Fecha
                        </p>

                        <strong>
                          {formatDate(
                            purchase.date
                          )}
                        </strong>
                      </div>

                      <div>
                        <p className="text-black/40">
                          Total
                        </p>

                        <strong>
                          {formatMoney(
                            purchase.total
                          )}
                        </strong>
                      </div>

                      <div>
                        <p className="text-black/40">
                          Artículos
                        </p>

                        <strong>
                          {purchase.items ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <p className="text-black/40">
                          Adjunto
                        </p>

                        <strong>
                          {purchase.documentDataUrl
                            ? 'Con imagen'
                            : 'Sin imagen'}
                        </strong>
                      </div>
                    </div>

                    <button
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-forest"
                      onClick={() =>
                        setDetail(
                          purchase
                        )
                      }
                    >
                      <Eye
                        size={17}
                      />

                      Ver detalles
                    </button>
                  </article>
                );
              }
            )}
          </section>
        ) : (
          <EmptyState text="Todavía no hay boletas o facturas registradas" />
        )
      ) : suppliers.length ? (

        /* ===================================== */
        /* PROVEEDORES */
        /* ===================================== */

        <section className="grid gap-4 xl:grid-cols-2">

          {suppliers.map(
            (supplier) => (
              <article
                className="panel p-5"
                key={
                  supplier.id
                }
              >
                <div className="flex items-start justify-between gap-3">

                  <span className="grid size-11 place-items-center rounded-2xl bg-mint text-forest">
                    <Building2
                      size={20}
                    />
                  </span>

                  <button
                    className="inline-flex items-center gap-2 text-xs font-black text-forest"
                    onClick={() =>
                      openSupplier(
                        supplier
                      )
                    }
                  >
                    <Pencil
                      size={15}
                    />

                    Editar
                  </button>
                </div>

                <h2 className="mt-4 text-lg font-black">
                  {
                    supplier.businessName
                  }
                </h2>

                <p className="text-sm text-black/40">
                  RUC:{' '}
                  {supplier.ruc ||
                    'No registrado'}
                </p>

                <div className="mt-4 space-y-2 text-sm">

                  {supplier.phone && (
                    <p className="flex items-center gap-2">
                      <Phone
                        size={
                          15
                        }
                      />

                      {
                        supplier.phone
                      }
                    </p>
                  )}

                  {supplier.email && (
                    <p className="flex items-center gap-2">
                      <Mail
                        size={
                          15
                        }
                      />

                      {
                        supplier.email
                      }
                    </p>
                  )}

                  {supplier.address && (
                    <p className="flex items-center gap-2">
                      <MapPin
                        size={
                          15
                        }
                      />

                      {
                        supplier.address
                      }
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-black/5 pt-4">

                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-black/35">
                    Representantes
                    comerciales
                  </p>

                  {(
                    supplier.representatives ||
                    []
                  ).length ? (
                    <div className="space-y-3">

                      {supplier.representatives.map(
                        (rep) => (
                          <div
                            className="rounded-2xl bg-cream p-3"
                            key={
                              rep.id
                            }
                          >
                            <p className="font-black">
                              {
                                rep.name
                              }
                            </p>

                            <p className="text-xs text-black/45">
                              {rep.position ||
                                'Representante'}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">

                              {rep.phone && (
                                <span>
                                  {
                                    rep.phone
                                  }
                                </span>
                              )}

                              {rep.email && (
                                <span>
                                  {
                                    rep.email
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-black/40">
                      Sin representantes
                      registrados.
                    </p>
                  )}
                </div>
              </article>
            )
          )}
        </section>
      ) : (
        <EmptyState text="Todavía no hay proveedores registrados" />
      )}

      {/* ===================================== */}
      {/* MODAL REGISTRAR DOCUMENTO */}
      {/* ===================================== */}

      {purchaseForm && (
        <Modal
          title="Registrar boleta o factura"
          onClose={() =>
            setPurchaseForm(
              null
            )
          }
        >
          <form
            className="space-y-4"
            onSubmit={
              submitPurchase
            }
          >

            <label className="block text-sm font-bold">
              Proveedor

              <select
                required
                className="field mt-2"
                value={
                  purchaseForm.supplierId
                }
                onChange={(
                  e
                ) =>
                  setPurchaseForm(
                    {
                      ...purchaseForm,

                      supplierId:
                        e.target
                          .value,
                    }
                  )
                }
              >
                <option value="">
                  Selecciona un
                  proveedor
                </option>

                {suppliers.map(
                  (
                    supplier
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
                  )
                )}
              </select>
            </label>

            {!suppliers.length && (
              <p className="rounded-2xl bg-amber/15 p-3 text-sm font-bold text-[#8c5c00]">
                Primero crea un
                proveedor desde la
                pestaña
                “Proveedores y
                representantes”.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">

              <label className="text-sm font-bold">
                Tipo de documento

                <select
                  className="field mt-2"
                  value={
                    purchaseForm.documentType
                  }
                  onChange={(
                    e
                  ) =>
                    setPurchaseForm(
                      {
                        ...purchaseForm,

                        documentType:
                          e
                            .target
                            .value,
                      }
                    )
                  }
                >
                  <option>
                    Factura
                  </option>

                  <option>
                    Boleta
                  </option>

                  <option>
                    Nota de venta
                  </option>

                  <option>
                    Guía / Otro
                  </option>
                </select>
              </label>

              <label className="text-sm font-bold">
                Número

                <input
                  required
                  className="field mt-2"
                  placeholder="F001-000123"
                  value={
                    purchaseForm.documentNumber
                  }
                  onChange={(
                    e
                  ) =>
                    setPurchaseForm(
                      {
                        ...purchaseForm,

                        documentNumber:
                          e
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <label className="text-sm font-bold">
                Fecha de emisión

                <input
                  required
                  type="date"
                  className="field mt-2"
                  value={
                    purchaseForm.date
                  }
                  onChange={(
                    e
                  ) =>
                    setPurchaseForm(
                      {
                        ...purchaseForm,

                        date:
                          e
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Cantidad de
                artículos

                <input
                  min="0"
                  type="number"
                  className="field mt-2"
                  value={
                    purchaseForm.items
                  }
                  onChange={(
                    e
                  ) =>
                    setPurchaseForm(
                      {
                        ...purchaseForm,

                        items:
                          e
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>
            </div>

            <label className="block text-sm font-bold">
              Total del documento

              <input
                required
                min="0"
                step="0.01"
                type="number"
                className="field mt-2"
                value={
                  purchaseForm.total
                }
                onChange={(
                  e
                ) =>
                  setPurchaseForm(
                    {
                      ...purchaseForm,

                      total:
                        e
                          .target
                          .value,
                    }
                  )
                }
              />
            </label>

            {/* IMAGEN */}

            <label className="block text-sm font-bold">
              Foto de la boleta o
              factura

              <div className="mt-2 rounded-2xl border border-dashed border-black/15 bg-white p-4">

                <div className="flex items-center gap-3">

                  <ImageIcon className="text-forest" />

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(
                      e
                    ) =>
                      readDocument(
                        e.target
                          .files?.[0]
                      )
                    }
                  />
                </div>

                <p className="mt-2 text-xs text-black/40">
                  JPG, PNG o WEBP ·
                  máximo 1.5 MB.
                </p>
              </div>
            </label>

            {/* VISTA PREVIA */}

            {purchaseForm.documentDataUrl && (
              <img
                src={
                  purchaseForm.documentDataUrl
                }
                alt="Vista previa del documento"
                className="max-h-64 w-full rounded-2xl border border-black/5 object-contain"
              />
            )}

            <label className="block text-sm font-bold">
              Observaciones

              <textarea
                className="field mt-2 min-h-24"
                placeholder="Productos principales, condición de pago, crédito, etc."
                value={
                  purchaseForm.notes
                }
                onChange={(
                  e
                ) =>
                  setPurchaseForm(
                    {
                      ...purchaseForm,

                      notes:
                        e
                          .target
                          .value,
                    }
                  )
                }
              />
            </label>

            {error && (
              <p className="text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full"
              disabled={
                !suppliers.length
              }
            >
              Guardar documento
            </button>
          </form>
        </Modal>
      )}

      {/* ===================================== */}
      {/* MODAL PROVEEDOR */}
      {/* ===================================== */}

      {supplierForm && (
        <Modal
          title={
            supplierForm.id
              ? 'Editar proveedor'
              : 'Nuevo proveedor'
          }
          onClose={() =>
            setSupplierForm(
              null
            )
          }
        >
          <form
            className="space-y-4"
            onSubmit={
              submitSupplier
            }
          >

            <label className="block text-sm font-bold">
              Nombre o razón social

              <input
                required
                className="field mt-2"
                value={
                  supplierForm.businessName
                }
                onChange={(
                  e
                ) =>
                  setSupplierForm(
                    {
                      ...supplierForm,

                      businessName:
                        e
                          .target
                          .value,
                    }
                  )
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-4">

              <label className="text-sm font-bold">
                RUC

                <input
                  className="field mt-2"
                  maxLength={
                    11
                  }
                  value={
                    supplierForm.ruc
                  }
                  onChange={(
                    e
                  ) =>
                    setSupplierForm(
                      {
                        ...supplierForm,

                        ruc:
                          e
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>

              <label className="text-sm font-bold">
                Teléfono

                <input
                  className="field mt-2"
                  value={
                    supplierForm.phone
                  }
                  onChange={(
                    e
                  ) =>
                    setSupplierForm(
                      {
                        ...supplierForm,

                        phone:
                          e
                            .target
                            .value,
                      }
                    )
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
                  supplierForm.email
                }
                onChange={(
                  e
                ) =>
                  setSupplierForm(
                    {
                      ...supplierForm,

                      email:
                        e
                          .target
                          .value,
                    }
                  )
                }
              />
            </label>

            <label className="block text-sm font-bold">
              Dirección

              <input
                className="field mt-2"
                value={
                  supplierForm.address
                }
                onChange={(
                  e
                ) =>
                  setSupplierForm(
                    {
                      ...supplierForm,

                      address:
                        e
                          .target
                          .value,
                    }
                  )
                }
              />
            </label>

            {/* REPRESENTANTES */}

            <div className="rounded-3xl border border-black/10 p-4">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <p className="font-black">
                    Representantes /
                    vendedores
                  </p>

                  <p className="text-xs text-black/40">
                    Puedes guardar
                    varios contactos
                    para el mismo
                    proveedor.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    addRepresentative
                  }
                >
                  <Plus
                    size={16}
                  />

                  Añadir
                </button>
              </div>

              <div className="mt-4 space-y-4">

                {(
                  supplierForm.representatives ||
                  []
                ).map(
                  (
                    rep,
                    index
                  ) => (
                    <div
                      className="rounded-2xl bg-cream p-4"
                      key={
                        rep.id
                      }
                    >
                      <div className="mb-3 flex items-center justify-between">

                        <div className="flex items-center gap-2 font-black">
                          <UserRound
                            size={
                              17
                            }
                          />

                          Representante{' '}
                          {index +
                            1}
                        </div>

                        <button
                          type="button"
                          className="text-coral"
                          onClick={() =>
                            removeRepresentative(
                              rep.id
                            )
                          }
                        >
                          <Trash2
                            size={
                              17
                            }
                          />
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">

                        <input
                          className="field"
                          placeholder="Nombre completo"
                          value={
                            rep.name
                          }
                          onChange={(
                            e
                          ) =>
                            updateRepresentative(
                              rep.id,
                              'name',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          className="field"
                          placeholder="Cargo / vendedor / preventista"
                          value={
                            rep.position
                          }
                          onChange={(
                            e
                          ) =>
                            updateRepresentative(
                              rep.id,
                              'position',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          className="field"
                          placeholder="Celular"
                          value={
                            rep.phone
                          }
                          onChange={(
                            e
                          ) =>
                            updateRepresentative(
                              rep.id,
                              'phone',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          type="email"
                          className="field"
                          placeholder="Correo"
                          value={
                            rep.email
                          }
                          onChange={(
                            e
                          ) =>
                            updateRepresentative(
                              rep.id,
                              'email',
                              e
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <input
                        className="field mt-3"
                        placeholder="Notas: día de visita, zona, horario, etc."
                        value={
                          rep.notes
                        }
                        onChange={(
                          e
                        ) =>
                          updateRepresentative(
                            rep.id,
                            'notes',
                            e
                              .target
                              .value
                          )
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            <label className="block text-sm font-bold">
              Notas del proveedor

              <textarea
                className="field mt-2 min-h-20"
                value={
                  supplierForm.notes
                }
                onChange={(
                  e
                ) =>
                  setSupplierForm(
                    {
                      ...supplierForm,

                      notes:
                        e
                          .target
                          .value,
                    }
                  )
                }
              />
            </label>

            {error && (
              <p className="text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button className="btn-primary w-full">
              Guardar proveedor
            </button>
          </form>
        </Modal>
      )}

      {/* ===================================== */}
      {/* VER DETALLE DOCUMENTO */}
      {/* ===================================== */}

      {detail && (
        <Modal
          title={`${
            detail.documentType ||
            'Documento'
          } ${
            detail.documentNumber ||
            ''
          }`}
          onClose={() =>
            setDetail(null)
          }
        >
          <div className="space-y-5">

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 text-sm">

              <div>
                <p className="text-black/40">
                  Proveedor
                </p>

                <strong>
                  {supplierById.get(
                    detail.supplierId
                  )
                    ?.businessName ||
                    detail.supplier}
                </strong>
              </div>

              <div>
                <p className="text-black/40">
                  Fecha
                </p>

                <strong>
                  {formatDate(
                    detail.date
                  )}
                </strong>
              </div>

              <div>
                <p className="text-black/40">
                  Total
                </p>

                <strong>
                  {formatMoney(
                    detail.total
                  )}
                </strong>
              </div>

              <div>
                <p className="text-black/40">
                  Artículos
                </p>

                <strong>
                  {detail.items ||
                    0}
                </strong>
              </div>
            </div>

            {detail.notes && (
              <div>
                <p className="text-sm font-black">
                  Observaciones
                </p>

                <p className="mt-1 text-sm text-black/60">
                  {
                    detail.notes
                  }
                </p>
              </div>
            )}

            {detail.documentDataUrl ? (
              <div>
                <p className="mb-2 text-sm font-black">
                  Imagen del
                  documento
                </p>

                <img
                  src={
                    detail.documentDataUrl
                  }
                  alt={`${detail.documentType} ${detail.documentNumber}`}
                  className="max-h-[60vh] w-full rounded-2xl border border-black/5 object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-black/40">

                <FileText className="mx-auto mb-2" />

                No se adjuntó una
                imagen.
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}