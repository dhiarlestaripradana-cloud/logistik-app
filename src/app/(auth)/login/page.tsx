"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/modules/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="Logo PT"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            PT Dhiar Lestari Pradana
          </h1>
          <p className="text-sm text-slate-500">Masuk untuk melanjutkan</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              suppressHydrationWarning
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              suppressHydrationWarning
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {state?.error && (
            <p
              className={
                state.terkunci
                  ? "rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              }
            >
              {state.terkunci ? "🔒 " : ""}
              {state.error}
            </p>
          )}

          <button
            suppressHydrationWarning
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}