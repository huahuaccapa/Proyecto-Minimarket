'use client';

import {
  useState,
} from 'react';

import {
  CircleDollarSign,
  Plus,
  Minus,
  LockKeyhole,
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

  const submit =
    async (
      event,
    ) => {
      event.preventDefault();

      setError('');

      try {
        if (
          form.mode ===
          'open'
        ) {
          await onOpen(
            Number(
              form.amount,
            ),
          );
        } else if (
          form.mode ===
          'close'
        ) {
          await onClose(
            Number(
              form.amount,
            ),
          );
        } else {
          await onSaveMovement({
            type:
              form.mode,

            amount:
              Number(
                form.amount,
              ),

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
      }
    };

  const openForm = (
    mode,
  ) => {
    setError('');

    setForm({
      mode,

      amount: '',

      reason:
        mode ===
        'entrada'
          ? 'Ingreso manual'
          : mode ===
              'retiro'
            ? 'Retiro de efectivo'
            : '',

      notes: '',
    });
  };

  return (
    <>
      <PageTitle
        eyebrow="Control de efectivo"
        title="Caja actual"
        description="La caja funciona por aperturas y cierres. Las ventas, compras y gastos pagados en efectivo se reflejan automáticamente."
        action={
          <div className="flex gap-2">
            {cash.isOpen ? (
              <>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    openForm(
                      'retiro',
                    )
                  }
                >
                  <Minus
                    size={18}
                  />
                  Retiro
                </button>

                <button
                  className="btn-primary"
                  onClick={() =>
                    openForm(
                      'entrada',
                    )
                  }
                >
                  <Plus
                    size={18}
                  />
                  Ingreso
                </button>
              </>
            ) : (
              <button
                className="btn-primary"
                onClick={() =>
                  openForm(
                    'open',
                  )
                }
              >
                <UnlockKeyhole
                  size={18}
                />
                Abrir caja
              </button>
            )}
          </div>
        }
      />

      <section className="mb-6 rounded-[2rem] bg-ink p-8 text-white">
        <div className="flex items-center gap-3 text-white/50">
          <CircleDollarSign />

          <span className="font-bold">
            Efectivo
            esperado
          </span>
        </div>

        <p className="mt-4 text-5xl font-black">
          {formatMoney(
            cash.balance ||
              0,
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
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-ink"
            onClick={() =>
              openForm(
                'close',
              )
            }
          >
            <LockKeyhole
              size={17}
            />

            Cerrar y
            arquear caja
          </button>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Fondo inicial"
          value={formatMoney(
            cash.openingAmount ||
              0,
          )}
          helper="Monto con el que abrió la caja"
          icon={
            UnlockKeyhole
          }
        />

        <StatCard
          label="Entradas"
          value={formatMoney(
            cash.inflow ||
              0,
          )}
          helper="Ventas e ingresos"
          icon={Plus}
          tone="amber"
        />

        <StatCard
          label="Salidas"
          value={formatMoney(
            cash.outflow ||
              0,
          )}
          helper="Compras, gastos y retiros"
          icon={Minus}
          tone="coral"
        />
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <h2 className="text-xl font-black">
            Movimientos
            de esta caja
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
                  <div>
                    <p className="font-bold">
                      {
                        movement.reason
                      }
                    </p>

                    <p className="text-xs text-black/40">
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
                        ? 'text-forest'
                        : 'text-coral'
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

            setError(
              '',
            );
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
                className="field mt-2"
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
              <p className="rounded-xl bg-amber/10 p-3 text-xs font-bold">
                Cuenta
                físicamente
                todo el
                efectivo que
                existe en la
                caja e ingresa
                ese monto. El
                sistema
                calculará
                automáticamente
                si existe
                sobrante o
                faltante.
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button className="btn-primary w-full">
              Confirmar
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}