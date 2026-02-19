"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { processReport } from "./actions";
import { ThemeToggle } from "../components/theme-toggle";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Generando documento..." : "Generar Reporte"}
    </button>
  );
}

export default function Home() {
  const [state, formAction] = useActionState(processReport, null);

  return (
    <div className="min-h-screen p-6 sm:p-12">
      <header className="flex justify-between items-center mb-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Reportes Médicos</h1>
        <ThemeToggle />
      </header>

      <main className="max-w-2xl mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <form action={formAction} className="space-y-6">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Edad */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium mb-2">
                Edad
              </label>
              <input
                type="number"
                id="age"
                name="age"
                min="0"
                required
                placeholder="30"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Fecha */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-2">
                Fecha
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Peso */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.01"
                min="0"
                required
                placeholder="70.5"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Estatura */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-2">
                Estatura (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                step="0.1"
                min="0"
                required
                placeholder="175"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium mb-2">
              Referencia (Opcional)
            </label>
            <textarea
              id="reference"
              name="reference"
              rows={3}
              placeholder="Detalles adicionales o motivo de consulta..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
            />
          </div>

          {/* Mensajes de estado */}
          {state?.error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/50">
              {state.message}
            </div>
          )}

          <SubmitButton />
        </form>
      </main>
    </div>
  );
}
