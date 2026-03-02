"use client";

import { useActionState, useState, useEffect, startTransition } from "react";
import { processReport } from "./actions";
import { ThemeToggle } from "../components/theme-toggle";

function SubmitButton({ pending }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium mt-1 py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Generando documento..." : "Generar Reporte"}
    </button>
  );
}

export default function Home() {
  const [state, formAction, isPending] = useActionState(processReport, null);
  const [hasReference, setHasReference] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state?.success && state?.documentBase64) {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${state.documentBase64}`;
      link.download = state.fileName || "Reporte_Medico.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [state]);

  return (
    <div className="min-h-screen p-6 sm:p-12 relative">
      {/* Botón de tema en la esquina superior derecha */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <header className="mb-10 max-w-2xl mx-auto text-center pt-8 sm:pt-0">
        <h1 className="text-3xl font-bold tracking-tight">Reportes Médicos</h1>
      </header>

      <main className="max-w-2xl mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md border-1 border-slate-300 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nombre Del Paciente
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
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
                className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Peso */}
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <label htmlFor="weight" className="block text-sm font-medium">
                  Peso
                </label>
                <div className="flex items-center space-x-3 text-sm">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" name="weightUnit" value="kg" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                    <span>Kg</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" name="weightUnit" value="lbs" className="text-blue-600 focus:ring-blue-500" />
                    <span>Lbs</span>
                  </label>
                </div>
              </div>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Estatura */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-2">
                Estatura (mts)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
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
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Referencia */}
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <label className="block text-sm font-medium">
                Referencia
              </label>
              <div className="flex items-center space-x-3 text-sm">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="hasReference" 
                    value="false" 
                    checked={!hasReference}
                    onChange={() => setHasReference(false)}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span>No</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="hasReference" 
                    value="true" 
                    checked={hasReference}
                    onChange={() => setHasReference(true)}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span>Sí</span>
                </label>
              </div>
            </div>
            {hasReference && (
              <input
                type="text"
                id="reference"
                name="reference"
                required
                className="w-full px-4 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            )}
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

          <SubmitButton pending={isPending} />
        </form>
      </main>
    </div>
  );
}
