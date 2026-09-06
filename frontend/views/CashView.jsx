'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Equal,
  LockKeyhole,
  Minus,
  Plus,
  UnlockKeyhole,
} from 'lucide-react';

import {
  EmptyState,
  Modal,
  PageTitle,
  StatCard,
} from '../components/ui';

import {
  formatDate,
  formatMoney,
} from '../data/mock';

export default function CashView({
  cash,
  onSaveMovement,
  onOpen,
  onClose,
}) {
  const [
    form,
    setForm,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  /*
   * ==========================================
   * DATOS PRINCIPALES DE CAJA
   * ==========================================
   */

  const openingAmount =
    Number(
      cash.openingAmount ||
        0,
    );

  const inflow =
    Number(
      cash.inflow ||
        0,
    );

  const outflow =
    Number(
      cash.outflow ||
        0,
    );

  /*
   * cash.balance viene calculado
   * desde el backend.
   *
   * Si por alguna razón no viene,
   * usamos:
   *
   * fondo inicial
   * + entradas
   * - salidas
   */
  const expectedCash =
    Number.isFinite(
      Number(
        cash.balance,
      ),
    )
      ? Number(
          cash.balance,
        )
      : openingAmount +
        inflow -
        outflow;

  /*
   * ==========================================
   * ARQUEO EN TIEMPO REAL
   * ==========================================
   */

  const closePreview =
    useMemo(
      () => {
        if (
          !form ||
          form.mode !==
            'close'
        ) {
          return null;
        }

        const raw =
          String(
            form.amount ??
              '',
          ).trim();

        if (
          raw ===
          ''
        ) {
          return {
            hasAmount:
              false,

            counted:
              0,

            expected:
              expectedCash,

            difference:
              0,

            type:
              'pending',
          };
        }

        const counted =
          Number(
            raw,
          );

        if (
          !Number.isFinite(
            counted,
          ) ||
          counted <
            0
        ) {
          return {
            hasAmount:
              false,

            counted:
              0,

            expected:
              expectedCash,

            difference:
              0,

            type:
              'invalid',
          };
        }

        const difference =
          Number(
            (
              counted -
              expectedCash
            ).toFixed(
              2,
            ),
          );

        let type =
          'exact';

        if (
          difference >
          0.009
        ) {
          type =
            'surplus';
        } else if (
          difference <
          -0.009
        ) {
          type =
            'shortage';
        }

        return {
          hasAmount:
            true,

          counted,

          expected:
            expectedCash,

          difference,

          type,
        };
      },

      [
        form,
        expectedCash,
      ],
    );

  /*
   * ==========================================
   * GUARDAR
   * ==========================================
   */

  const submit =
    async (
      event,
    ) => {
      event.preventDefault();

      setError('');

      const amount =
        Number(
          form.amount,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount <
          0
      ) {
        setError(
          'Ingresa un monto válido.',
        );

        return;
      }

      setSaving(true);

      try {
        if (
          form.mode ===
          'open'
        ) {
          await onOpen(
            amount,
          );
        } else if (
          form.mode ===
          'close'
        ) {
          await onClose(
            amount,
          );
        } else {
          if (
            amount <=
            0
          ) {
            throw new Error(
              'El monto debe ser mayor que cero.',
            );
          }

          await onSaveMovement({
            type:
              form.mode,

            amount,

            reason:
              form.reason,

            notes:
              form.notes ||
              '',
          });
        }

        setForm(null);
      } catch (e) {
        setError(
          e.message,
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * ==========================================
   * ABRIR FORMULARIO
   * ==========================================
   */

  const openForm = (
    mode,
  ) => {
    setError('');

    setForm({
      mode,

      amount:
        '',

      reason:
        mode ===
        'entrada'
          ? 'Ingreso manual'
          : mode ===
              'retiro'
            ? 'Retiro de efectivo'
            : '',

      notes:
        '',
    });
  };

  /*
   * ==========================================
   * TEXTO DEL ARQUEO
   * ==========================================
   */

  const differenceTitle =
    closePreview?.type ===
    'surplus'
      ? 'Sobrante'
      : closePreview?.type ===
          'shortage'
        ? 'Faltante'
        : closePreview?.type ===
            'exact'
          ? 'Caja exacta'
          : 'Diferencia';

  const differenceAmount =
    Math.abs(
      Number(
        closePreview
          ?.difference ||
          0,
      ),
    );

  const differenceClasses =
    closePreview?.type ===
    'exact'
      ? 'bg-mint text-forest'
      : closePreview?.type ===
          'surplus'
        ? 'bg-amber/15 text-[#8b6500]'
        : closePreview?.type ===
            'shortage'
          ? 'bg-coral/10 text-coral'
          : 'bg-black/[0.035] text-black/50';

  return (
    <>
      <PageTitle
        eyebrow="Control de efectivo"
        title="Caja actual"
        description="La caja funciona por aperturas y cierres. Las ventas, compras, pagos de clientes y gastos en efectivo se reflejan automáticamente."
        action={
          <div className="flex gap-2">
            {cash.isOpen ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    openForm(
                      'retiro',
                    )
                  }
                >
                  <Minus
                    size={
                      18
                    }
                  />

                  Retiro
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() =>
                    openForm(
                      'entrada',
                    )
                  }
                >
                  <Plus
                    size={
                      18
                    }
                  />

                  Ingreso
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  openForm(
                    'open',
                  )
                }
              >
                <UnlockKeyhole
                  size={
                    18
                  }
                />

                Abrir caja
              </button>
            )}
          </div>
        }
      />

      {/* ======================================
          SALDO PRINCIPAL
      ====================================== */}

      <section className="mb-6 rounded-[2rem] bg-ink p-6 text-white sm:p-8">
        <div className="flex items-center gap-3 text-white/50">
          <CircleDollarSign />

          <span className="font-bold">
            Efectivo esperado
          </span>
        </div>

        <p className="mt-4 break-words text-4xl font-black sm:text-5xl">
          {formatMoney(
            expectedCash,
          )}
        </p>

        <p className="mt-3 text-sm text-white/45">
          {cash.isOpen
            ? `Caja ${
                cash.session
                  ?.number ||
                ''
              } abierta desde ${formatDate(
                cash.session
                  ?.openedAt,
              )}`
            : 'No existe una caja abierta. Abre caja antes de vender o registrar salidas de efectivo.'}
        </p>

        {cash.isOpen && (
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-ink"
            onClick={() =>
              openForm(
                'close',
              )
            }
          >
            <LockKeyhole
              size={
                17
              }
            />

            Cerrar y arquear
            caja
          </button>
        )}
      </section>

      {/* ======================================
          RESUMEN
      ====================================== */}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Fondo inicial"
          value={formatMoney(
            openingAmount,
          )}
          helper="Monto con el que abrió la caja"
          icon={
            UnlockKeyhole
          }
        />

        <StatCard
          label="Entradas"
          value={formatMoney(
            inflow,
          )}
          helper="Ventas, pagos de clientes e ingresos"
          icon={
            Plus
          }
          tone="amber"
        />

        <StatCard
          label="Salidas"
          value={formatMoney(
            outflow,
          )}
          helper="Compras, gastos y retiros"
          icon={
            Minus
          }
          tone="coral"
        />
      </section>

      {/* ======================================
          FÓRMULA ACTUAL
      ====================================== */}

      {cash.isOpen && (
        <section className="panel mt-6 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-forest">
            Cómo se obtiene
            el saldo
          </p>

          <h2 className="mt-1 text-xl font-black">
            Cálculo de la
            caja actual
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
            <div className="rounded-2xl bg-black/[0.03] p-4 text-center">
              <p className="text-xs text-black/45">
                Fondo inicial
              </p>

              <p className="mt-1 font-black">
                {formatMoney(
                  openingAmount,
                )}
              </p>
            </div>

            <Plus
              className="mx-auto text-black/25"
              size={
                18
              }
            />

            <div className="rounded-2xl bg-mint p-4 text-center">
              <p className="text-xs text-forest/60">
                Entradas
              </p>

              <p className="mt-1 font-black text-forest">
                {formatMoney(
                  inflow,
                )}
              </p>
            </div>

            <Minus
              className="mx-auto text-black/25"
              size={
                18
              }
            />

            <div className="rounded-2xl bg-coral/10 p-4 text-center">
              <p className="text-xs text-coral/70">
                Salidas
              </p>

              <p className="mt-1 font-black text-coral">
                {formatMoney(
                  outflow,
                )}
              </p>
            </div>

            <Equal
              className="mx-auto text-black/25"
              size={
                18
              }
            />

            <div className="rounded-2xl bg-ink p-4 text-center text-white">
              <p className="text-xs text-white/50">
                Esperado
              </p>

              <p className="mt-1 font-black">
                {formatMoney(
                  expectedCash,
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ======================================
          MOVIMIENTOS
      ====================================== */}

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <h2 className="text-xl font-black">
            Movimientos de
            esta caja
          </h2>
        </div>

        {cash.movements
          ?.length ? (
          <div className="divide-y divide-black/5">
            {cash.movements.map(
              (
                movement,
              ) => (
                <div
                  key={
                    movement.id
                  }
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-0">
                    <p className="font-bold">
                      {
                        movement.reason
                      }
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      {formatDate(
                        movement.date,
                      )}{' '}
                      ·{' '}
                      {
                        movement.type
                      }
                    </p>
                  </div>

                  <strong
                    className={
                      movement.direction ===
                      'in'
                        ? 'shrink-0 text-forest'
                        : 'shrink-0 text-coral'
                    }
                  >
                    {movement.direction ===
                    'in'
                      ? '+'
                      : '-'}{' '}
                    {formatMoney(
                      movement.amount,
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState text="No hay movimientos en la caja actual" />
        )}
      </section>

      {/* ======================================
          MODAL
      ====================================== */}

      {form && (
        <Modal
          title={
            form.mode ===
            'open'
              ? 'Abrir caja'
              : form.mode ===
                  'close'
                ? 'Cerrar caja'
                : form.mode ===
                    'entrada'
                  ? 'Añadir efectivo'
                  : 'Registrar retiro'
          }
          onClose={() => {
            setForm(
              null,
            );

            setError('');
          }}
        >
          <form
            className="space-y-4"
            onSubmit={
              submit
            }
          >
            <label className="block text-sm font-bold">
              {form.mode ===
              'close'
                ? 'Efectivo contado'
                : form.mode ===
                    'open'
                  ? 'Fondo inicial'
                  : 'Monto'}

              <input
                required
                min="0"
                step="0.01"
                type="number"
                inputMode="decimal"
                className="field mt-2"
                placeholder="0.00"
                value={
                  form.amount
                }
                onChange={(
                  e,
                ) =>
                  setForm({
                    ...form,

                    amount:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            {/* ==================================
                CÁLCULO DE CIERRE EN VIVO
            ================================== */}

            {form.mode ===
              'close' && (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/[0.035] p-4">
                    <p className="text-xs font-bold text-black/45">
                      Efectivo
                      esperado
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {formatMoney(
                        expectedCash,
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/[0.035] p-4">
                    <p className="text-xs font-bold text-black/45">
                      Efectivo
                      contado
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {closePreview
                        ?.hasAmount
                        ? formatMoney(
                            closePreview.counted,
                          )
                        : '—'}
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-4 ${differenceClasses}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-black">
                        {closePreview
                          ?.type ===
                        'exact' ? (
                          <CheckCircle2
                            size={
                              18
                            }
                          />
                        ) : closePreview
                            ?.type ===
                            'shortage' ||
                          closePreview
                            ?.type ===
                            'surplus' ? (
                          <AlertTriangle
                            size={
                              18
                            }
                          />
                        ) : (
                          <CircleDollarSign
                            size={
                              18
                            }
                          />
                        )}

                        {
                          differenceTitle
                        }
                      </p>

                      <p className="mt-1 text-xs opacity-70">
                        Contado −
                        esperado
                      </p>
                    </div>

                    <p className="text-2xl font-black">
                      {closePreview
                        ?.hasAmount
                        ? formatMoney(
                            differenceAmount,
                          )
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-amber/10 p-3 text-xs font-bold leading-relaxed">
                  Fondo inicial{' '}
                  {formatMoney(
                    openingAmount,
                  )}
                  {' + '}
                  entradas{' '}
                  {formatMoney(
                    inflow,
                  )}
                  {' − '}
                  salidas{' '}
                  {formatMoney(
                    outflow,
                  )}
                  {' = '}
                  <strong>
                    {formatMoney(
                      expectedCash,
                    )}
                  </strong>
                </div>
              </div>
            )}

            {[
              'entrada',
              'retiro',
            ].includes(
              form.mode,
            ) && (
              <>
                <label className="block text-sm font-bold">
                  Motivo

                  <input
                    required
                    className="field mt-2"
                    value={
                      form.reason
                    }
                    onChange={(
                      e,
                    ) =>
                      setForm({
                        ...form,

                        reason:
                          e
                            .target
                            .value,
                      })
                    }
                  />
                </label>

                <label className="block text-sm font-bold">
                  Notas

                  <input
                    className="field mt-2"
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
              </>
            )}

            {form.mode ===
              'close' && (
              <p className="rounded-xl bg-black/[0.035] p-3 text-xs leading-relaxed text-black/55">
                Cuenta físicamente
                todo el efectivo
                disponible en la
                caja. El sistema
                compara ese monto
                con el efectivo
                esperado y muestra
                inmediatamente si
                existe sobrante o
                faltante.
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                saving
              }
            >
              {saving
                ? 'Procesando...'
                : form.mode ===
                    'close'
                  ? 'Confirmar cierre'
                  : 'Confirmar'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}