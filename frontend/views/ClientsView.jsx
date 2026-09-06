'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  Banknote,
  Barcode,
  Check,
  ChevronDown,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  X,
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

const emptyCustomer = {
  name:
    '',
  dni:
    '',
  phone:
    '',
  address:
    '',
  notes:
    '',
};

const formatDateTime = (
  value,
) => {
  if (
    !value
  ) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(
      'es-PE',
      {
        dateStyle:
          'short',

        timeStyle:
          'short',

        timeZone:
          'America/Lima',
      },
    ).format(
      new Date(
        value,
      ),
    );
  } catch {
    return value;
  }
};

export default function ClientsView({
  customers,
  products,
  cash,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onLoadCustomer,
  onAddCredit,
  onUpdateCredit,
  onDeleteCredit,
  onAddPayment,
}) {
  /*
   * ==========================================
   * CLIENTES
   * ==========================================
   */

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    customerForm,
    setCustomerForm,
  ] = useState(null);

  /*
   * ==========================================
   * CRÉDITO
   * ==========================================
   */

  const [
    creditForm,
    setCreditForm,
  ] = useState(null);

  const [
    productSearch,
    setProductSearch,
  ] = useState('');

  const [
    productDropdown,
    setProductDropdown,
  ] = useState(false);

  /*
   * ==========================================
   * PAGOS
   * ==========================================
   */

  const [
    paymentForm,
    setPaymentForm,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
   * ==========================================
   * LISTA CLIENTES
   * ==========================================
   */

  const filtered =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        return customers.filter(
          (
            customer,
          ) =>
            `${customer.name} ${customer.dni || ''} ${customer.phone || ''}`
              .toLowerCase()
              .includes(
                term,
              ),
        );
      },

      [
        customers,
        search,
      ],
    );

  /*
   * ==========================================
   * PRODUCTOS
   * ==========================================
   */

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (
            product,
          ) =>
            product.id ===
            creditForm
              ?.productId,
        ) ||
        null,

      [
        products,
        creditForm,
      ],
    );

  const searchableProducts =
    useMemo(
      () => {
        const term =
          productSearch
            .trim()
            .toLowerCase();

        return products
          .filter(
            (
              product,
            ) =>
              product.active,
          )
          .filter(
            (
              product,
            ) => {
              /*
               * En edición también
               * permitimos ver el
               * producto actual,
               * incluso si su stock
               * quedó temporalmente
               * en cero.
               */
              if (
                creditForm
                  ?.id &&
                product.id ===
                  creditForm
                    .productId
              ) {
                return true;
              }

              return Number(
                product.stock ||
                  0,
              ) >
              0;
            },
          )
          .filter(
            (
              product,
            ) =>
              !term ||
              `${product.name || ''} ${product.barcode || ''}`
                .toLowerCase()
                .includes(
                  term,
                ),
          )
          .slice(
            0,
            15,
          );
      },

      [
        products,
        productSearch,
        creditForm,
      ],
    );

  /*
   * ==========================================
   * RESUMEN GENERAL
   * ==========================================
   */

  const totalReceivable =
    useMemo(
      () =>
        customers.reduce(
          (
            sum,
            customer,
          ) =>
            sum +
            Number(
              customer
                .account
                ?.balance ||
                0,
            ),

          0,
        ),

      [
        customers,
      ],
    );

  const debtors =
    useMemo(
      () =>
        customers.filter(
          (
            customer,
          ) =>
            Number(
              customer
                .account
                ?.balance ||
                0,
            ) >
            0,
        ).length,

      [
        customers,
      ],
    );

  /*
   * ==========================================
   * ABRIR CLIENTE
   * ==========================================
   */

  const openCustomer =
    async (
      customer,
    ) => {
      setError('');

      setLoading(true);

      try {
        const full =
          await onLoadCustomer(
            customer.id,
          );

        setSelected(
          full,
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * ==========================================
   * GUARDAR CLIENTE
   * ==========================================
   */

  const saveCustomer =
    async (
      event,
    ) => {
      event.preventDefault();

      setError('');

      setLoading(true);

      try {
        if (
          customerForm.id
        ) {
          const updated =
            await onUpdateCustomer(
              customerForm.id,

              customerForm,
            );

          if (
            selected?.id ===
            updated.id
          ) {
            setSelected(
              updated,
            );
          }
        } else {
          const created =
            await onCreateCustomer(
              customerForm,
            );

          setSelected(
            created,
          );
        }

        setCustomerForm(
          null,
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * ==========================================
   * ELIMINAR CLIENTE
   * ==========================================
   */

  const deleteCustomer =
    async (
      customer,
    ) => {
      if (
        !window.confirm(
          `¿Eliminar a ${customer.name}?`,
        )
      ) {
        return;
      }

      setError('');

      try {
        await onDeleteCustomer(
          customer.id,
        );

        if (
          selected?.id ===
          customer.id
        ) {
          setSelected(
            null,
          );
        }
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      }
    };

  /*
   * ==========================================
   * NUEVO CRÉDITO
   * ==========================================
   */

  const openNewCredit =
    () => {
      setError('');

      setProductSearch('');

      setProductDropdown(
        true,
      );

      setCreditForm({
        productId:
          '',

        quantity:
          '1',

        notes:
          '',
      });
    };

  /*
   * ==========================================
   * EDITAR CRÉDITO
   * ==========================================
   */

  const openEditCredit =
    (
      credit,
    ) => {
      setError('');

      setProductSearch(
        credit.productName ||
          '',
      );

      setProductDropdown(
        false,
      );

      setCreditForm({
        id:
          credit.id,

        productId:
          credit.productId,

        quantity:
          String(
            credit.quantity,
          ),

        notes:
          credit.notes ||
          '',
      });
    };

  /*
   * ==========================================
   * ELEGIR PRODUCTO
   * ==========================================
   */

  const chooseProduct =
    (
      product,
    ) => {
      setCreditForm(
        (
          current,
        ) => ({
          ...current,

          productId:
            product.id,
        }),
      );

      setProductSearch(
        product.name,
      );

      setProductDropdown(
        false,
      );
    };

  const clearSelectedProduct =
    () => {
      setCreditForm(
        (
          current,
        ) => ({
          ...current,

          productId:
            '',
        }),
      );

      setProductSearch('');

      setProductDropdown(
        true,
      );
    };

  /*
   * ==========================================
   * GUARDAR PRODUCTO FIADO
   * ==========================================
   */

  const saveCredit =
    async (
      event,
    ) => {
      event.preventDefault();

      if (
        !selected
      ) {
        return;
      }

      if (
        !creditForm
          .productId
      ) {
        setError(
          'Busca y selecciona un producto.',
        );

        return;
      }

      const quantity =
        Number(
          creditForm.quantity,
        );

      if (
        !Number.isFinite(
          quantity,
        ) ||
        quantity <=
          0
      ) {
        setError(
          'Ingresa una cantidad válida.',
        );

        return;
      }

      setError('');

      setLoading(true);

      try {
        const payload = {
          productId:
            creditForm.productId,

          quantity,

          notes:
            creditForm.notes,
        };

        const updated =
          creditForm.id
            ? await onUpdateCredit(
                selected.id,

                creditForm.id,

                payload,
              )
            : await onAddCredit(
                selected.id,

                payload,
              );

        setSelected(
          updated,
        );

        setCreditForm(
          null,
        );

        setProductSearch('');

        setProductDropdown(
          false,
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * ==========================================
   * ELIMINAR PRODUCTO FIADO
   * ==========================================
   */

  const removeCredit =
    async (
      credit,
    ) => {
      if (
        !selected
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `¿Eliminar el registro de ${credit.productName}? El producto volverá al stock.`,
        );

      if (
        !confirmed
      ) {
        return;
      }

      setError('');

      try {
        const updated =
          await onDeleteCredit(
            selected.id,

            credit.id,
          );

        setSelected(
          updated,
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      }
    };

  /*
   * ==========================================
   * PAGO
   * ==========================================
   */

  const savePayment =
    async (
      event,
    ) => {
      event.preventDefault();

      if (
        !selected
      ) {
        return;
      }

      setError('');

      setLoading(true);

      try {
        const updated =
          await onAddPayment(
            selected.id,

            {
              amount:
                Number(
                  paymentForm.amount,
                ),

              notes:
                paymentForm.notes,
            },
          );

        setSelected(
          updated,
        );

        setPaymentForm(
          null,
        );
      } catch (
        err
      ) {
        setError(
          err.message,
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * ==========================================
   * REGISTROS ACTIVOS
   * ==========================================
   */

  const activeCredits =
    selected
      ?.credits
      ?.filter(
        (
          item,
        ) =>
          item.status !==
          'voided',
      ) ||
    [];

  const activePayments =
    selected
      ?.payments
      ?.filter(
        (
          item,
        ) =>
          item.status !==
          'voided',
      ) ||
    [];

  return (
    <>
      <PageTitle
        eyebrow="Cuentas por cobrar"
        title="Clientes"
        description="Crea clientes, anota productos a crédito y controla cuánto debe cada persona."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setError('');

              setCustomerForm({
                ...emptyCustomer,
              });
            }}
          >
            <UserPlus
              size={
                18
              }
            />

            Nuevo cliente
          </button>
        }
      />

      {/* ======================================
          ESTADÍSTICAS
      ====================================== */}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <article className="panel p-5">
          <div className="flex items-center gap-3 text-forest">
            <Users
              size={
                21
              }
            />

            <span className="font-bold">
              Clientes
            </span>
          </div>

          <p className="mt-3 text-3xl font-black">
            {
              customers.length
            }
          </p>
        </article>

        <article className="panel p-5">
          <div className="flex items-center gap-3 text-[#9a6800]">
            <WalletCards
              size={
                21
              }
            />

            <span className="font-bold">
              Con deuda
            </span>
          </div>

          <p className="mt-3 text-3xl font-black">
            {
              debtors
            }
          </p>
        </article>

        <article className="panel p-5">
          <div className="flex items-center gap-3 text-coral">
            <Banknote
              size={
                21
              }
            />

            <span className="font-bold">
              Total por cobrar
            </span>
          </div>

          <p className="mt-3 text-3xl font-black">
            {formatMoney(
              totalReceivable,
            )}
          </p>
        </article>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">
          {error}
        </p>
      )}

      {/* ======================================
          CLIENTES + CUENTA
      ====================================== */}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="panel overflow-hidden">
          <div className="border-b border-black/5 p-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-black/30"
                size={
                  18
                }
              />

              <input
                className="field pl-10"
                placeholder="Buscar cliente..."
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

          <div className="max-h-[68vh] overflow-y-auto p-2">
            {!filtered.length ? (
              <EmptyState
                text="No hay clientes registrados."
              />
            ) : (
              filtered.map(
                (
                  customer,
                ) => (
                  <button
                    type="button"
                    key={
                      customer.id
                    }
                    onClick={() =>
                      openCustomer(
                        customer,
                      )
                    }
                    className={`
                      mb-2 w-full rounded-2xl
                      p-4 text-left transition

                      ${
                        selected?.id ===
                        customer.id
                          ? 'bg-forest text-white'
                          : 'hover:bg-black/[0.04]'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black">
                          {
                            customer.name
                          }
                        </p>

                        <p
                          className={`
                            mt-1 text-xs

                            ${
                              selected?.id ===
                              customer.id
                                ? 'text-white/60'
                                : 'text-black/45'
                            }
                          `}
                        >
                          {customer.phone ||
                            customer.dni ||
                            'Sin teléfono'}
                        </p>
                      </div>

                      <span
                        className={`
                          shrink-0 rounded-xl px-2 py-1
                          text-xs font-black

                          ${
                            Number(
                              customer
                                .account
                                ?.balance ||
                                0,
                            ) >
                            0
                              ? selected?.id ===
                                customer.id
                                ? 'bg-white/15 text-white'
                                : 'bg-coral/10 text-coral'
                              : selected?.id ===
                                customer.id
                              ? 'bg-white/15 text-white'
                              : 'bg-mint text-forest'
                          }
                        `}
                      >
                        {formatMoney(
                          customer
                            .account
                            ?.balance ||
                            0,
                        )}
                      </span>
                    </div>
                  </button>
                ),
              )
            )}
          </div>
        </section>

        <section className="panel min-h-[520px] p-5 sm:p-6">
          {!selected ? (
            <div className="grid min-h-[450px] place-items-center text-center text-black/40">
              <div>
                <Users
                  className="mx-auto mb-3"
                  size={
                    40
                  }
                />

                <p className="font-bold">
                  Selecciona un
                  cliente para
                  ver su cuenta.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-4 border-b border-black/5 pb-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-forest">
                    Cuenta del
                    cliente
                  </p>

                  <h2 className="mt-1 text-3xl font-black">
                    {
                      selected.name
                    }
                  </h2>

                  <p className="mt-2 text-sm text-black/45">
                    Creada{' '}
                    {formatDateTime(
                      selected.createdAt,
                    )}

                    {selected.phone
                      ? ` · ${selected.phone}`
                      : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setCustomerForm({
                        ...selected,
                      })
                    }
                  >
                    <Pencil
                      size={
                        16
                      }
                    />

                    Editar
                  </button>

                  <button
                    type="button"
                    className="btn-secondary text-coral"
                    onClick={() =>
                      deleteCustomer(
                        selected,
                      )
                    }
                  >
                    <Trash2
                      size={
                        16
                      }
                    />

                    Eliminar
                  </button>
                </div>
              </div>

              {/* RESUMEN DEUDA */}

              <div className="my-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/[0.03] p-4">
                  <p className="text-xs font-bold text-black/45">
                    Productos
                    anotados
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {formatMoney(
                      selected
                        .account
                        ?.charges ||
                        0,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-mint p-4">
                  <p className="text-xs font-bold text-forest/60">
                    Pagado
                  </p>

                  <p className="mt-1 text-xl font-black text-forest">
                    {formatMoney(
                      selected
                        .account
                        ?.payments ||
                        0,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-coral/10 p-4">
                  <p className="text-xs font-bold text-coral/70">
                    Total
                    pendiente
                  </p>

                  <p className="mt-1 text-2xl font-black text-coral">
                    {formatMoney(
                      selected
                        .account
                        ?.balance ||
                        0,
                    )}
                  </p>
                </div>
              </div>

              {/* BOTONES */}

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    openNewCredit
                  }
                >
                  <Plus
                    size={
                      17
                    }
                  />

                  Anotar
                  producto
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={
                    Number(
                      selected
                        .account
                        ?.balance ||
                        0,
                    ) <=
                    0
                  }
                  onClick={() => {
                    setError('');

                    setPaymentForm({
                      amount:
                        String(
                          selected
                            .account
                            ?.balance ||
                            '',
                        ),

                      notes:
                        '',
                    });
                  }}
                >
                  <Banknote
                    size={
                      17
                    }
                  />

                  Registrar
                  pago
                </button>
              </div>

              {/* PRODUCTOS DE LA CUENTA */}

              <h3 className="mb-3 font-black">
                Productos de la
                cuenta
              </h3>

              {!activeCredits.length ? (
                <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-black/40">
                  Este cliente
                  no tiene
                  productos
                  pendientes.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-black/5">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black/[0.025] text-left text-xs uppercase tracking-wide text-black/45">
                      <tr>
                        <th className="px-4 py-3">
                          Fecha y
                          hora
                        </th>

                        <th className="px-4 py-3">
                          Producto
                        </th>

                        <th className="px-4 py-3">
                          Cantidad
                        </th>

                        <th className="px-4 py-3">
                          P.
                          unitario
                        </th>

                        <th className="px-4 py-3">
                          Total
                        </th>

                        <th className="px-4 py-3 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {activeCredits.map(
                        (
                          credit,
                        ) => (
                          <tr
                            key={
                              credit.id
                            }
                            className="border-t border-black/5"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-black/55">
                              {formatDateTime(
                                credit.createdAt,
                              )}
                            </td>

                            <td className="px-4 py-3 font-bold">
                              {
                                credit.productName
                              }
                            </td>

                            <td className="px-4 py-3">
                              {formatQuantity(
                                credit.quantity,
                              )}{' '}

                              {credit.saleUnit ||
                                ''}
                            </td>

                            <td className="px-4 py-3">
                              {formatMoney(
                                credit.unitPrice,
                              )}
                            </td>

                            <td className="px-4 py-3 font-black">
                              {formatMoney(
                                credit.total,
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  className="rounded-xl p-2 hover:bg-black/5"
                                  title="Editar"
                                  onClick={() =>
                                    openEditCredit(
                                      credit,
                                    )
                                  }
                                >
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="rounded-xl p-2 text-coral hover:bg-coral/10"
                                  title="Eliminar"
                                  onClick={() =>
                                    removeCredit(
                                      credit,
                                    )
                                  }
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGOS */}

              {!!activePayments.length && (
                <div className="mt-6">
                  <h3 className="mb-3 font-black">
                    Historial de
                    pagos
                  </h3>

                  <div className="space-y-2">
                    {activePayments.map(
                      (
                        payment,
                      ) => (
                        <div
                          key={
                            payment.id
                          }
                          className="flex items-center justify-between rounded-2xl bg-mint/60 p-3"
                        >
                          <div>
                            <p className="font-bold text-forest">
                              Pago
                              recibido
                            </p>

                            <p className="text-xs text-black/45">
                              {formatDateTime(
                                payment.createdAt,
                              )}

                              {payment.notes
                                ? ` · ${payment.notes}`
                                : ''}
                            </p>
                          </div>

                          <strong className="text-forest">
                            {formatMoney(
                              payment.amount,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ======================================
          MODAL CLIENTE
      ====================================== */}

      {customerForm && (
        <Modal
          title={
            customerForm.id
              ? 'Editar cliente'
              : 'Nuevo cliente'
          }
          onClose={() => {
            setCustomerForm(
              null,
            );

            setError('');
          }}
        >
          <form
            className="space-y-4"
            onSubmit={
              saveCustomer
            }
          >
            <label className="block text-sm font-bold">
              Nombre completo

              <input
                required
                className="field mt-2"
                value={
                  customerForm.name
                }
                onChange={(
                  e,
                ) =>
                  setCustomerForm({
                    ...customerForm,

                    name:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                DNI

                <input
                  className="field mt-2"
                  value={
                    customerForm.dni ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setCustomerForm({
                      ...customerForm,

                      dni:
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
                    customerForm.phone ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setCustomerForm({
                      ...customerForm,

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
              Dirección

              <input
                className="field mt-2"
                value={
                  customerForm.address ||
                  ''
                }
                onChange={(
                  e,
                ) =>
                  setCustomerForm({
                    ...customerForm,

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
                rows="3"
                className="field mt-2"
                value={
                  customerForm.notes ||
                  ''
                }
                onChange={(
                  e,
                ) =>
                  setCustomerForm({
                    ...customerForm,

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
                loading
              }
            >
              {loading
                ? 'Guardando...'
                : 'Guardar cliente'}
            </button>
          </form>
        </Modal>
      )}

      {/* ======================================
          MODAL PRODUCTO A CRÉDITO
      ====================================== */}

      {creditForm &&
        selected && (
          <Modal
            title={
              creditForm.id
                ? 'Editar producto anotado'
                : 'Anotar producto a crédito'
            }
            onClose={() => {
              setCreditForm(
                null,
              );

              setProductSearch('');

              setProductDropdown(
                false,
              );

              setError('');
            }}
          >
            <form
              className="space-y-4"
              onSubmit={
                saveCredit
              }
            >
              {/* BUSCADOR PRODUCTO */}

              <div>
                <label className="block text-sm font-bold">
                  Buscar producto
                </label>

                <div className="relative mt-2">
                  <Search
                    className="absolute left-3 top-3.5 text-black/30"
                    size={
                      18
                    }
                  />

                  <input
                    type="text"
                    autoComplete="off"
                    className="field pl-10 pr-10"
                    placeholder="Escribe nombre o código de barras..."
                    value={
                      productSearch
                    }
                    onFocus={() =>
                      setProductDropdown(
                        true,
                      )
                    }
                    onChange={(
                      e,
                    ) => {
                      setProductSearch(
                        e
                          .target
                          .value,
                      );

                      setProductDropdown(
                        true,
                      );

                      /*
                       * Si escribe algo
                       * diferente después
                       * de haber elegido,
                       * obligamos a volver
                       * a seleccionar.
                       */
                      if (
                        selectedProduct &&
                        e.target.value !==
                          selectedProduct.name
                      ) {
                        setCreditForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            productId:
                              '',
                          }),
                        );
                      }
                    }}
                  />

                  {productSearch ? (
                    <button
                      type="button"
                      className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg hover:bg-black/5"
                      onClick={
                        clearSelectedProduct
                      }
                    >
                      <X
                        size={
                          16
                        }
                      />
                    </button>
                  ) : (
                    <ChevronDown
                      className="absolute right-3 top-3.5 text-black/30"
                      size={
                        18
                      }
                    />
                  )}

                  {productDropdown && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
                      {!searchableProducts.length ? (
                        <div className="p-4 text-center text-sm text-black/40">
                          No se
                          encontraron
                          productos.
                        </div>
                      ) : (
                        searchableProducts.map(
                          (
                            product,
                          ) => {
                            const chosen =
                              creditForm.productId ===
                              product.id;

                            return (
                              <button
                                type="button"
                                key={
                                  product.id
                                }
                                onMouseDown={(
                                  event,
                                ) =>
                                  event.preventDefault()
                                }
                                onClick={() =>
                                  chooseProduct(
                                    product,
                                  )
                                }
                                className={`
                                  flex w-full items-center
                                  justify-between gap-3
                                  rounded-xl p-3 text-left
                                  transition

                                  ${
                                    chosen
                                      ? 'bg-mint'
                                      : 'hover:bg-black/[0.04]'
                                  }
                                `}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/[0.04]">
                                    <Package
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black">
                                      {
                                        product.name
                                      }
                                    </p>

                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-black/40">
                                      <Barcode
                                        size={
                                          12
                                        }
                                      />

                                      {product.barcode ||
                                        'Sin código'}
                                    </p>

                                    <p className="mt-1 text-xs text-black/45">
                                      Stock:{' '}
                                      {formatQuantity(
                                        product.stock,
                                      )}{' '}
                                      ·{' '}
                                      {formatMoney(
                                        product.salePrice,
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {chosen && (
                                  <Check
                                    className="shrink-0 text-forest"
                                    size={
                                      18
                                    }
                                  />
                                )}
                              </button>
                            );
                          },
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* PRODUCTO SELECCIONADO */}

              {selectedProduct && (
                <div className="rounded-2xl bg-mint p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-forest/60">
                    Producto
                    seleccionado
                  </p>

                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-forest">
                        {
                          selectedProduct.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-black/50">
                        Stock
                        disponible:{' '}
                        {formatQuantity(
                          selectedProduct.stock,
                        )}{' '}

                        {selectedProduct.saleUnit ||
                          ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-black/45">
                        Precio
                        unitario
                      </p>

                      <p className="font-black text-forest">
                        {formatMoney(
                          selectedProduct.salePrice,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <label className="block text-sm font-bold">
                Cantidad

                <input
                  required
                  min="0.001"
                  step="0.001"
                  type="number"
                  className="field mt-2"
                  value={
                    creditForm.quantity
                  }
                  onChange={(
                    e,
                  ) =>
                    setCreditForm({
                      ...creditForm,

                      quantity:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>

              {/* TOTAL PREVIO */}

              {selectedProduct &&
                Number(
                  creditForm.quantity,
                ) >
                  0 && (
                  <div className="flex items-center justify-between rounded-2xl bg-ink p-4 text-white">
                    <span className="text-sm font-bold text-white/60">
                      Total a
                      agregar
                    </span>

                    <strong className="text-xl">
                      {formatMoney(
                        Number(
                          selectedProduct.salePrice ||
                            0,
                        ) *
                          Number(
                            creditForm.quantity ||
                              0,
                          ),
                      )}
                    </strong>
                  </div>
                )}

              <label className="block text-sm font-bold">
                Nota opcional

                <textarea
                  rows="2"
                  className="field mt-2"
                  value={
                    creditForm.notes ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setCreditForm({
                      ...creditForm,

                      notes:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <div className="rounded-2xl bg-amber/10 p-3 text-xs leading-relaxed text-black/60">
                El precio se
                obtiene
                automáticamente
                del producto.
                Al anotarlo, el
                stock disminuye,
                pero la caja no
                recibe dinero
                hasta que el
                cliente pague.
              </div>

              {error && (
                <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                  {error}
                </p>
              )}

              <button
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  loading ||
                  !creditForm
                    .productId
                }
              >
                {loading
                  ? 'Guardando...'
                  : creditForm.id
                    ? 'Guardar cambios'
                    : 'Agregar a la cuenta'}
              </button>
            </form>
          </Modal>
        )}

      {/* ======================================
          MODAL PAGO
      ====================================== */}

      {paymentForm &&
        selected && (
          <Modal
            title="Registrar pago del cliente"
            onClose={() => {
              setPaymentForm(
                null,
              );

              setError('');
            }}
          >
            <form
              className="space-y-4"
              onSubmit={
                savePayment
              }
            >
              <div className="rounded-2xl bg-coral/10 p-4">
                <p className="text-sm text-coral/70">
                  Deuda
                  pendiente
                </p>

                <p className="text-2xl font-black text-coral">
                  {formatMoney(
                    selected
                      .account
                      ?.balance ||
                      0,
                  )}
                </p>
              </div>

              <label className="block text-sm font-bold">
                Monto recibido

                <input
                  required
                  min="0.01"
                  step="0.01"
                  max={
                    selected
                      .account
                      ?.balance ||
                    0
                  }
                  type="number"
                  className="field mt-2"
                  value={
                    paymentForm.amount
                  }
                  onChange={(
                    e,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,

                      amount:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <label className="block text-sm font-bold">
                Nota opcional

                <input
                  className="field mt-2"
                  placeholder="Ej. Pago parcial"
                  value={
                    paymentForm.notes ||
                    ''
                  }
                  onChange={(
                    e,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,

                      notes:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <div
                className={`
                  rounded-2xl p-3 text-xs

                  ${
                    cash?.isOpen
                      ? 'bg-mint text-forest'
                      : 'bg-coral/10 text-coral'
                  }
                `}
              >
                {cash?.isOpen
                  ? 'El pago ingresará automáticamente a la caja actual.'
                  : 'La caja está cerrada. Ábrela antes de registrar el pago.'}
              </div>

              {error && (
                <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                  {error}
                </p>
              )}

              <button
                className="btn-primary w-full"
                disabled={
                  loading ||
                  !cash?.isOpen
                }
              >
                {loading
                  ? 'Registrando...'
                  : 'Registrar pago'}
              </button>
            </form>
          </Modal>
        )}
    </>
  );
}