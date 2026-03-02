"use client";

import { useActionState, useState, useEffect, startTransition, useRef } from "react";
import { processReport } from "./actions";
import { ThemeToggle } from "../components/theme-toggle";
import { ChevronDown } from "lucide-react";

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

function AccordionSection({ title, defaultOpen = false, id, isOpen, onToggle, children, isFirst, isLast }) {
  // If controlled (isOpen/onToggle provided), use those, otherwise fallback to internal state
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isActuallyOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const sectionRef = useRef(null);
  const isInitialMount = useRef(true);
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (isActuallyOpen && sectionRef.current) {
      // A very small delay just to let the browser register the state change before scrolling
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 75);
    }
  }, [isActuallyOpen]);

  return (
    <div 
      id={id} 
      ref={sectionRef}
      className={`scroll-mt-8 group border border-slate-300 dark:border-slate-500 bg-white/30 dark:bg-slate-900/30 ${!isFirst ? '-mt-px' : ''} ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''} ${isActuallyOpen ? 'z-10 relative bg-white/70 dark:bg-slate-900/70' : 'z-0'}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex justify-between items-center w-full p-4 text-left text-xl font-bold cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80 ${isFirst && !isActuallyOpen ? 'rounded-t-xl' : ''} ${isFirst && isActuallyOpen ? 'rounded-t-xl' : ''} ${isLast && !isActuallyOpen ? 'rounded-b-xl' : ''} ${isActuallyOpen ? 'border-b border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/50' : ''}`}
      >
        {title}
        <div className={`p-1.5 rounded-full transition-colors ${isActuallyOpen ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <ChevronDown className={`h-5 w-5 transition-transform duration-100 ${isActuallyOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      <div
        className={`grid transition-all duration-100 ease-in-out ${
          isActuallyOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden p-1 -m-1">
          <div className="p-5 pt-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [state, formAction, isPending] = useActionState(processReport, null);
  const [hasReference, setHasReference] = useState(false);
  
  // State for accordions
  const [openSections, setOpenSections] = useState({
    paciente: true,
    ventriculoIzquierdo: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check for invalid fields on form submit attempt
  const handleInvalid = (e) => {
    // We do NOT call e.preventDefault() here so the browser can show its native tooltip.
    
    const form = e.currentTarget;
    // Find ALL invalid elements currently on the form
    const invalidElements = form.querySelectorAll(':invalid');
    if (invalidElements.length === 0) return;
    
    // Only care about the VERY FIRST invalid element
    const firstInvalid = invalidElements[0];
    
    // If the event target isn't the first invalid element, ignore it.
    // This prevents the event from firing and opening multiple sections for subsequent invalid fields.
    if (e.target !== firstInvalid) return;

    const sectionId = firstInvalid.closest('.group')?.id;
    
    if (sectionId) {
      setOpenSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    }
  };

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

      <main className="max-w-2xl mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md border-1 border-slate-300 dark:border-slate-500">
        <form onSubmit={handleSubmit} onInvalid={handleInvalid} className="flex flex-col" autoComplete="off">

          {/* SECCIÓN: PACIENTE */}
          <AccordionSection 
            id="paciente"
            title="Paciente" 
            isOpen={openSections.paciente}
            onToggle={() => toggleSection('paciente')}
            isFirst={true}
          >
            <div className="space-y-4">
            
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold mb-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {/* Edad */}
            <div>
              <label htmlFor="age" className="block text-sm font-bold mb-2">
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
                <label htmlFor="weight" className="block text-sm font-bold">
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
              <label htmlFor="height" className="block text-sm font-bold mb-2">
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
              <label htmlFor="date" className="block text-sm font-bold mb-2">
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
            <div className="flex items-center space-x-4">
              <span className="block text-sm font-bold">
                Referencia
              </span>
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
                aria-label="Detalle de referencia"
                required
                className="w-full px-4 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            )}
          </div>
          </div>
          </AccordionSection>

            {/* SECCIÓN: VENTRÍCULO IZQUIERDO */}
            <AccordionSection 
              id="ventriculoIzquierdo"
              title="Ventrículo Izquierdo"
              isOpen={openSections.ventriculoIzquierdo}
              onToggle={() => toggleSection('ventriculoIzquierdo')}
              isLast={true}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              
              <div>
                <label htmlFor="diametroTelediastolico" className="block text-sm font-bold mb-2">
                  Diámetro telediastólico
                </label>
                <input
                  type="number"
                  id="diametroTelediastolico"
                  name="diametroTelediastolico"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="vdf" className="block text-sm font-bold mb-2">
                  Volumen Telediastólico (VDF)
                </label>
                <input
                  type="number"
                  id="vdf"
                  name="vdf"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="masa" className="block text-sm font-bold mb-2">
                  Masa
                </label>
                <input
                  type="number"
                  id="masa"
                  name="masa"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="sivd" className="block text-sm font-bold mb-2">
                  SIVd
                </label>
                <input
                  type="number"
                  id="sivd"
                  name="sivd"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="divid" className="block text-sm font-bold mb-2">
                  DIVId
                </label>
                <input
                  type="number"
                  id="divid"
                  name="divid"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ppvid" className="block text-sm font-bold mb-2">
                  PPVId
                </label>
                <input
                  type="number"
                  id="ppvid"
                  name="ppvid"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="vsf" className="block text-sm font-bold mb-2">
                  Volumen Telesistólico (VSF)
                </label>
                <input
                  type="number"
                  id="vsf"
                  name="vsf"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ondaE" className="block text-sm font-bold mb-2">
                  Onda E
                </label>
                <input
                  type="number"
                  id="ondaE"
                  name="ondaE"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ondaA" className="block text-sm font-bold mb-2">
                  Onda A
                </label>
                <input
                  type="number"
                  id="ondaA"
                  name="ondaA"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="pendienteDesaceleracion" className="block text-sm font-bold mb-2">
                  Pendiente de desaceleración
                </label>
                <input
                  type="number"
                  id="pendienteDesaceleracion"
                  name="pendienteDesaceleracion"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="triv" className="block text-sm font-bold mb-2">
                  TRIV
                </label>
                <input
                  type="number"
                  id="triv"
                  name="triv"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ondaESeptal" className="block text-sm font-bold mb-2">
                  Onda e septal
                </label>
                <input
                  type="number"
                  id="ondaESeptal"
                  name="ondaESeptal"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ondaELateral" className="block text-sm font-bold mb-2">
                  Onda e lateral
                </label>
                <input
                  type="number"
                  id="ondaELateral"
                  name="ondaELateral"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="diametroTractoSalida" className="block text-sm font-bold mb-2">
                  Diámetro del tracto de salida
                </label>
                <input
                  type="number"
                  id="diametroTractoSalida"
                  name="diametroTractoSalida"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="raizAortica" className="block text-sm font-bold mb-2">
                  Raíz aórtica
                </label>
                <input
                  type="number"
                  id="raizAortica"
                  name="raizAortica"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="diametroUnionSinotubular" className="block text-sm font-bold mb-2">
                  Diámetro unión sinotubular
                </label>
                <input
                  type="number"
                  id="diametroUnionSinotubular"
                  name="diametroUnionSinotubular"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="diametroAortaProximal" className="block text-sm font-bold mb-2">
                  Diámetro aorta proximal ascendente
                </label>
                <input
                  type="number"
                  id="diametroAortaProximal"
                  name="diametroAortaProximal"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

            </div>
          </AccordionSection>

          {/* Mensajes de estado */}
          {state?.error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 mb-6 mt-4">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/50 mb-6 mt-4">
              {state.message}
            </div>
          )}

          <div className="mt-4">
            <SubmitButton pending={isPending} />
          </div>
        </form>
      </main>
    </div>
  );
}
