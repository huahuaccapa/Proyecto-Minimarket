"use client";

import {
  useState,
} from "react";

import {
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  managementApi,
} from "../lib/managementApi";

export default function PasswordChangeGate({
  required =
    false,
}) {
  const [
    done,
    setDone,
  ] =
    useState(
      false,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const [
    form,
    setForm,
  ] =
    useState({
      currentPassword:
        "",

      newPassword:
        "",

      confirmPassword:
        "",
    });

  if (
    !required ||
    done
  ) {
    return null;
  }

  const submit =
    async (
      event,
    ) => {
      event.preventDefault();

      setError(
        "",
      );

      if (
        form.newPassword !==
        form.confirmPassword
      ) {
        setError(
          "La confirmación de la nueva contraseña no coincide.",
        );

        return;
      }

      setLoading(
        true,
      );

      try {
        await managementApi.changePassword({
          currentPassword:
            form.currentPassword,

          newPassword:
            form.newPassword,
        });

        setDone(
          true,
        );
      } catch (
        changeError
      ) {
        setError(
          changeError.message ||
            "No se pudo cambiar la contraseña",
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#10251d]/90 p-4 backdrop-blur-sm">
      <form
        onSubmit={
          submit
        }
        className="w-full max-w-md rounded-[2rem] bg-[#f7f5ee] p-6 shadow-2xl sm:p-8"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-mint text-forest">
          <KeyRound
            size={
              26
            }
          />
        </span>

        <h2 className="mt-5 text-2xl font-black">
          Cambia tu contraseña
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-black/50">
          Estás usando una
          contraseña temporal.
          Por seguridad debes
          crear una nueva antes
          de continuar.
        </p>

        <label className="mt-6 block text-sm font-bold">
          Contraseña temporal
          actual

          <input
            className="field mt-2"
            type="password"
            autoComplete="current-password"
            value={
              form.currentPassword
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  currentPassword:
                    event
                      .target
                      .value,
                }),
              )
            }
            required
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Nueva contraseña

          <input
            className="field mt-2"
            type="password"
            autoComplete="new-password"
            value={
              form.newPassword
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  newPassword:
                    event
                      .target
                      .value,
                }),
              )
            }
            minLength={
              8
            }
            required
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Repite la nueva
          contraseña

          <input
            className="field mt-2"
            type="password"
            autoComplete="new-password"
            value={
              form.confirmPassword
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  confirmPassword:
                    event
                      .target
                      .value,
                }),
              )
            }
            minLength={
              8
            }
            required
          />
        </label>

        <p className="mt-3 text-xs text-black/45">
          Usa al menos 8
          caracteres e incluye
          por lo menos una letra
          y un número.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary mt-6 w-full"
          disabled={
            loading
          }
        >
          <ShieldCheck
            size={
              18
            }
          />

          {loading
            ? "Actualizando..."
            : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  );
}