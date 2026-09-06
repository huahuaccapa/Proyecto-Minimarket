'use client';

import {
  useState,
} from 'react';

import {
  LockKeyhole,
  UserRound,
  ShoppingBasket,
  ArrowRight,
} from 'lucide-react';

export default function Login({
  onLogin,
}) {
  const [
    form,
    setForm,
  ] =
    useState({
      username:
        '',

      password:
        '',
    });

  const [
    error,
    setError,
  ] =
    useState(
      '',
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const submit =
    async (
      event,
    ) => {
      event.preventDefault();

      setError(
        '',
      );

      setLoading(
        true,
      );

      try {
        await onLogin(
          form,
        );
      } catch (
        loginError
      ) {
        setError(
          loginError.message ||
            'Usuario o contraseña incorrectos.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  return (
    <main className="min-h-screen p-4 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
      <section className="relative hidden min-h-[calc(100vh-3rem)] overflow-hidden rounded-[2.5rem] bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-coral/30 blur-3xl" />

        <div className="absolute -bottom-20 left-20 size-72 rounded-full bg-amber/20 blur-3xl" />

        <div className="relative flex items-center gap-3 text-lg font-black">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-forest">
            <ShoppingBasket />
          </span>

          Minimarket Mamá
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-amber">
            Tu negocio, más
            ordenado
          </p>

          <h1 className="text-6xl font-black leading-[0.96] tracking-tight">
            Vende rápido.
            <br />

            Controla todo.
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-white/60">
            Productos, caja,
            inventario,
            clientes y
            ganancias en un
            solo lugar.
          </p>
        </div>

        <p className="relative text-sm text-white/35">
          Sistema privado
          del minimarket ·
          Arequipa, Perú
        </p>
      </section>

      <section className="grid min-h-[calc(100vh-2rem)] place-items-center px-4 py-10 lg:min-h-0 lg:px-16">
        <form
          className="w-full max-w-md"
          onSubmit={
            submit
          }
        >
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-2xl bg-forest text-white">
              <ShoppingBasket />
            </span>

            <span className="font-black">
              Minimarket Mamá
            </span>
          </div>

          <p className="text-sm font-black uppercase tracking-[0.2em] text-forest">
            Bienvenida
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-tight">
            Inicia sesión
          </h2>

          <p className="mt-3 text-black/50">
            Ingresa con tu
            cuenta autorizada.
          </p>

          <label
            className="mt-8 block text-sm font-bold"
            htmlFor="username"
          >
            Usuario
          </label>

          <div className="relative mt-2">
            <UserRound
              className="absolute left-4 top-3.5 text-black/30"
              size={20}
            />

            <input
              id="username"
              className="field pl-12"
              type="text"
              autoComplete="username"
              placeholder="Escribe tu usuario"
              value={
                form.username
              }
              onChange={(
                e,
              ) =>
                setForm({
                  ...form,

                  username:
                    e
                      .target
                      .value,
                })
              }
            />
          </div>

          <label
            className="mt-5 block text-sm font-bold"
            htmlFor="password"
          >
            Contraseña
          </label>

          <div className="relative mt-2">
            <LockKeyhole
              className="absolute left-4 top-3.5 text-black/30"
              size={20}
            />

            <input
              id="password"
              className="field pl-12"
              type="password"
              autoComplete="current-password"
              placeholder="Escribe tu contraseña"
              value={
                form.password
              }
              onChange={(
                e,
              ) =>
                setForm({
                  ...form,

                  password:
                    e
                      .target
                      .value,
                })
              }
            />
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">
              {error}
            </p>
          )}

          <button
            className="btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? 'Ingresando...'
              : 'Ingresar al sistema'}

            {!loading && (
              <ArrowRight
                size={
                  19
                }
              />
            )}
          </button>
        </form>
      </section>
    </main>
  );
}