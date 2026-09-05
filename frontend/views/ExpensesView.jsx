'use client';

import {
  useState,
} from 'react';

import {
  Plus,
  ReceiptText,
} from 'lucide-react';

import {
  EmptyState,
  Modal,
  PageTitle,
} from '../components/ui';

import {
  formatDate,
  formatMoney,
} from '../data/mock';

export default function ExpensesView({
  expenses,
  onSave,
}) {
  const [
    form,
    setForm,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const active =
    expenses.filter(
      (expense) =>
        expense.status !==
        'voided',
    );

  const total =
    active.reduce(
      (
        sum,
        expense,
      ) =>
        sum +
        Number(
          expense.amount ||
            0,
        ),
      0,
    );

  const submit =
    async (
      event,
    ) => {
      event.preventDefault();

      setError('');

      try {
        await onSave({
          ...form,

          amount:
            Number(
              form.amount,
            ),

          paymentMethod:
            'Efectivo',
        });

        setForm(null);
      } catch (error) {
        setError(
          error.message,
        );
      }
    };

  return (
    <>
      <PageTitle
        eyebrow="Salidas de dinero"
        title="Gastos"
        description="Todo gasto pagado en efectivo descuenta automáticamente dinero de la caja abierta."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setError('');

              setForm({
                date:
                  new Date()
                    .toISOString()
                    .slice(
                      0,
                      10,
                    ),

                description:
                  '',

                category:
                  'Otros',

                amount:
                  '',
              });
            }}
          >
            <Plus
              size={18}
            />
            Nuevo gasto
          </button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/5 p-5">
          <div>
            <p className="text-sm text-black/40">
              Gastos
              activos
            </p>

            <p className="text-3xl font-black">
              {formatMoney(
                total,
              )}
            </p>
          </div>

          <span className="grid size-12 place-items-center rounded-2xl bg-coral/10 text-coral">
            <ReceiptText />
          </span>
        </div>

        {active.length ? (
          <div className="divide-y divide-black/5">
            {active.map(
              (
                expense,
              ) => (
                <div
                  className="flex justify-between gap-3 p-5"
                  key={
                    expense.id
                  }
                >
                  <div>
                    <p className="font-bold">
                      {
                        expense.description
                      }
                    </p>

                    <p className="text-xs text-black/40">
                      {formatDate(
                        expense.date,
                      )}{' '}
                      ·{' '}
                      {
                        expense.category
                      }{' '}
                      ·
                      Efectivo
                    </p>
                  </div>

                  <strong className="text-coral">
                    −{' '}
                    {formatMoney(
                      expense.amount,
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState text="Todavía no hay gastos registrados" />
        )}
      </section>

      {form && (
        <Modal
          title="Registrar gasto"
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
              Descripción

              <input
                required
                className="field mt-2"
                value={
                  form.description
                }
                onChange={(
                  e,
                ) =>
                  setForm({
                    ...form,

                    description:
                      e
                        .target
                        .value,
                  })
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold">
                Categoría

                <select
                  className="field mt-2"
                  value={
                    form.category
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm({
                      ...form,

                      category:
                        e
                          .target
                          .value,
                    })
                  }
                >
                  <option>
                    Servicios
                  </option>

                  <option>
                    Transporte
                  </option>

                  <option>
                    Insumos
                  </option>

                  <option>
                    Personal
                  </option>

                  <option>
                    Otros
                  </option>
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

            <label className="block text-sm font-bold">
              Monto

              <input
                required
                min="0.01"
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

            <div className="rounded-xl bg-amber/10 p-3">
              <p className="text-xs font-bold">
                Método de
                pago:
                Efectivo
              </p>

              <p className="mt-1 text-xs text-black/45">
                El monto se
                descontará
                automáticamente
                de la caja
                abierta.
              </p>
            </div>

            {error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
                {error}
              </p>
            )}

            <button className="btn-primary w-full">
              Guardar gasto
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}