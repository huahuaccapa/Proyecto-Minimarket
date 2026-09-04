'use client';

import { useMemo, useState } from 'react';
import {
  Banknote,
  Plus,
  Minus,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  CircleDollarSign,
} from 'lucide-react';

import {
  PageTitle,
  StatCard,
  EmptyState,
  Modal,
} from '../components/ui';

import { formatDate, formatMoney } from '../data/mock';

export default function CashView({
  sales,
  cashMovements,
  onSaveMovement,
}) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const cashSales = useMemo(
    () =>
      sales
        .filter((sale) => sale.paymentMethod === 'Efectivo')
        .reduce(
          (sum, sale) => sum + Number(sale.total || 0),
          0
        ),
    [sales]
  );

  const manualIncome = useMemo(
    () =>
      cashMovements
        .filter((movement) => movement.type === 'entrada')
        .reduce(
          (sum, movement) => sum + Number(movement.amount || 0),
          0
        ),
    [cashMovements]
  );

  const withdrawals = useMemo(
    () =>
      cashMovements
        .filter((movement) => movement.type === 'retiro')
        .reduce(
          (sum, movement) => sum + Number(movement.amount || 0),
          0
        ),
    [cashMovements]
  );

  const balance = cashSales + manualIncome - withdrawals;

  const openMovement = (type) => {
    setError('');

    setForm({
      type,
      amount: '',
      reason:
        type === 'entrada'
          ? 'Fondo de caja'
          : 'Retiro de efectivo',
      notes: '',
    });
  };

  const submit = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Ingresa un monto mayor que cero.');
      return;
    }

    if (form.type === 'retiro' && amount > balance) {
      setError(
        'No puedes retirar más dinero del que actualmente existe en caja.'
      );
      return;
    }

    try {
      await onSaveMovement({
        ...form,
        amount,
      });

      setForm(null);
      setError('');
    } catch (exception) {
      setError(
        exception.message ||
          'No se pudo registrar el movimiento.'
      );
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="Control de efectivo"
        title="Caja actual"
        description="Controla cuánto efectivo debería encontrarse físicamente en la caja registradora según ventas, ingresos y retiros."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => openMovement('retiro')}
            >
              <Minus size={18} />
              Registrar retiro
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => openMovement('entrada')}
            >
              <Plus size={18} />
              Añadir efectivo
            </button>
          </div>
        }
      />

      <section className="mb-6 overflow-hidden rounded-[2rem] bg-ink text-white">
        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-3 text-white/50">
            <Wallet size={22} />
            <span className="font-bold">
              Dinero actual esperado en caja
            </span>
          </div>

          <p className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            {formatMoney(balance)}
          </p>

          <p className="mt-4 max-w-xl text-sm text-white/45">
            Este monto se calcula a partir de las ventas en efectivo más
            los ingresos manuales, menos los retiros registrados.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Ventas en efectivo"
          value={formatMoney(cashSales)}
          helper="Se agregan automáticamente"
          icon={Banknote}
        />

        <StatCard
          label="Efectivo añadido"
          value={formatMoney(manualIncome)}
          helper="Fondos e ingresos manuales"
          icon={ArrowDownToLine}
          tone="amber"
        />

        <StatCard
          label="Efectivo retirado"
          value={formatMoney(withdrawals)}
          helper="Retiros registrados"
          icon={ArrowUpFromLine}
          tone="coral"
        />
      </section>

      <section className="panel mt-6 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-forest">
            <CircleDollarSign size={21} />
          </span>

          <div className="w-full">
            <h2 className="font-black">¿Cómo se calcula la caja?</h2>

            <div className="mt-4 rounded-2xl bg-cream p-5">
              <p className="text-sm text-black/50">
                Ventas en efectivo
              </p>
              <p className="mt-1 font-black text-forest">
                + {formatMoney(cashSales)}
              </p>

              <p className="mt-3 text-sm text-black/50">
                Efectivo añadido
              </p>
              <p className="mt-1 font-black text-forest">
                + {formatMoney(manualIncome)}
              </p>

              <p className="mt-3 text-sm text-black/50">Retiros</p>
              <p className="mt-1 font-black text-coral">
                - {formatMoney(withdrawals)}
              </p>

              <div className="my-4 border-t border-black/10" />

              <div className="flex items-center justify-between">
                <strong>Caja actual</strong>
                <strong className="text-xl text-forest">
                  {formatMoney(balance)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <div className="flex items-center gap-3">
            <History size={20} />

            <div>
              <h2 className="text-xl font-black">
                Movimientos de caja
              </h2>
              <p className="text-sm text-black/40">
                Ingresos y retiros realizados manualmente
              </p>
            </div>
          </div>
        </div>

        {cashMovements.length ? (
          <div className="divide-y divide-black/5">
            {[...cashMovements].reverse().map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-10 place-items-center rounded-2xl ${
                      movement.type === 'entrada'
                        ? 'bg-mint text-forest'
                        : 'bg-coral/10 text-coral'
                    }`}
                  >
                    {movement.type === 'entrada' ? (
                      <ArrowDownToLine size={18} />
                    ) : (
                      <ArrowUpFromLine size={18} />
                    )}
                  </span>

                  <div>
                    <p className="font-black">{movement.reason}</p>
                    <p className="mt-1 text-xs text-black/40">
                      {formatDate(movement.date)}
                      {movement.notes ? ` · ${movement.notes}` : ''}
                    </p>
                  </div>
                </div>

                <strong
                  className={
                    movement.type === 'entrada'
                      ? 'text-forest'
                      : 'text-coral'
                  }
                >
                  {movement.type === 'entrada' ? '+ ' : '- '}
                  {formatMoney(movement.amount)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Todavía no existen ingresos o retiros manuales de caja." />
        )}
      </section>

      {form && (
        <Modal
          title={
            form.type === 'entrada'
              ? 'Añadir efectivo a caja'
              : 'Registrar retiro de caja'
          }
          onClose={() => setForm(null)}
        >
          <form className="space-y-4" onSubmit={submit}>
            <div
              className={`rounded-2xl p-4 ${
                form.type === 'entrada'
                  ? 'bg-mint text-forest'
                  : 'bg-coral/10 text-coral'
              }`}
            >
              <p className="text-xs font-bold opacity-60">
                Movimiento
              </p>
              <p className="font-black">
                {form.type === 'entrada'
                  ? 'Ingreso de efectivo'
                  : 'Salida de efectivo'}
              </p>
            </div>

            <label className="block text-sm font-bold">
              Monto
              <input
                required
                autoFocus
                type="number"
                min="0.01"
                step="0.01"
                className="field mt-2 text-lg font-black"
                placeholder="S/ 0.00"
                value={form.amount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount: event.target.value,
                  })
                }
              />
            </label>

            <label className="block text-sm font-bold">
              Motivo
              <input
                required
                className="field mt-2"
                placeholder={
                  form.type === 'entrada'
                    ? 'Ej. Fondo inicial'
                    : 'Ej. Retiro al cierre'
                }
                value={form.reason}
                onChange={(event) =>
                  setForm({
                    ...form,
                    reason: event.target.value,
                  })
                }
              />
            </label>

            <label className="block text-sm font-bold">
              Observación
              <textarea
                className="field mt-2 min-h-20"
                placeholder="Opcional"
                value={form.notes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    notes: event.target.value,
                  })
                }
              />
            </label>

            {error && (
              <p className="text-sm font-bold text-coral">{error}</p>
            )}

            <button className="btn-primary w-full">
              {form.type === 'entrada'
                ? 'Añadir efectivo'
                : 'Registrar retiro'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
