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
      className={`scroll-mt-12 group border border-slate-300 dark:border-slate-500 bg-white/30 dark:bg-slate-900/30 ${!isFirst ? '-mt-px' : ''} ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''} ${isActuallyOpen ? 'z-10 relative bg-white/70 dark:bg-slate-900/70' : 'z-0'}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex justify-between items-center w-full p-4 text-left text-xl font-bold cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-800 ${isFirst && !isActuallyOpen ? 'rounded-t-xl' : ''} ${isFirst && isActuallyOpen ? 'rounded-t-xl' : ''} ${isLast && !isActuallyOpen ? 'rounded-b-xl' : ''} ${isActuallyOpen ? 'border-b border-slate-300 dark:border-slate-500 bg-slate-200 dark:bg-slate-800' : ''}`}
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

  // State for Observaciones
  const [hasObLeftVentricle, setHasObLeftVentricle] = useState(null);
  const [hasObRightVentricle, setHasObRightVentricle] = useState(null);
  const [hasObLeftAtrium, setHasObLeftAtrium] = useState(null);
  const [hasObRightAtrium, setHasObRightAtrium] = useState(null);
  const [hasObMitralValve, setHasObMitralValve] = useState(null);
  const [hasObAorticValve, setHasObAorticValve] = useState(null);
  const [hasObPulmonaryValve, setHasObPulmonaryValve] = useState(null);
  const [hasObTricuspidValve, setHasObTricuspidValve] = useState(null);
  
  // State for Tricuspid Valve calculation
  const [ivcMaxDiam, setIvcMaxDiam] = useState('');
  const [ivcMinDiam, setIvcMinDiam] = useState('');

  // Calculate IVCCI
  const parsedIvcMax = parseFloat(ivcMaxDiam);
  const parsedIvcMin = parseFloat(ivcMinDiam);
  let ivcciDisplay = 0;
  if (!isNaN(parsedIvcMax) && !isNaN(parsedIvcMin) && parsedIvcMax > 0) {
    const ivcci = ((parsedIvcMax - parsedIvcMin) / parsedIvcMax) * 100;
    ivcciDisplay = Math.trunc(ivcci);
  }
  
  // State for accordions
  const [openSections, setOpenSections] = useState({
    patient: true,
    leftVentricle: false,
    rightVentricle: false,
    leftAtrium: false,
    rightAtrium: false,
    mitralValve: false,
    aorticValve: false,
    pulmonaryValve: false,
    tricuspidValve: false
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
    const target = e.target;
    
    // Set custom Spanish validation message
    if (target.validity.valueMissing) {
      target.setCustomValidity('Por favor, completa este campo.');
    } else if (target.validity.typeMismatch || target.validity.badInput || target.validity.stepMismatch) {
      target.setCustomValidity('Por favor, introduce un valor válido.');
    } else {
      target.setCustomValidity('Valor no válido.');
    }

    // Find ALL invalid elements currently on the form
    const invalidElements = form.querySelectorAll(':invalid');
    if (invalidElements.length === 0) return;
    
    // Only care about the VERY FIRST invalid element
    const firstInvalid = invalidElements[0];
    
    // If the event target isn't the first invalid element, ignore it.
    // This prevents the event from firing and opening multiple sections for subsequent invalid fields.
    if (target !== firstInvalid) return;

    const sectionId = firstInvalid.closest('.group')?.id;
    
    if (sectionId) {
      setOpenSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    }
  };

  const handleInput = (e) => {
    // Clear the custom validity when the user starts typing so it can be re-evaluated
    e.target.setCustomValidity('');
    if (e.target.type === 'radio') {
      const form = e.currentTarget;
      const radios = form.querySelectorAll(`input[name="${e.target.name}"]`);
      radios.forEach(r => r.setCustomValidity(''));
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
      {/* Theme button in the top right corner */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <header className="mb-8 max-w-2xl mx-auto text-center pt-8 sm:pt-0">
        <h1 className="text-3xl font-bold tracking-tight">Informe De Ecocardiograma Transtorácico</h1>
      </header>

      <main className="max-w-2xl mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md border-1 border-slate-300 dark:border-slate-500">
        <form onSubmit={handleSubmit} onInvalid={handleInvalid} onChange={handleInput} className="flex flex-col" autoComplete="off">

          {/* PATIENT SECTION */}
          <AccordionSection 
            id="patient"
            title="Paciente" 
            isOpen={openSections.patient}
            onToggle={() => toggleSection('patient')}
            isFirst={true}
          >
            <div className="space-y-4">
            
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold mb-2">
                Nombre Del Paciente
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue="Rui Lopéz"
                className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-bold mb-2">
                Edad (años)
              </label>
              <input
                type="number"
                id="age"
                name="age"
                min="0"
                required
                defaultValue="45"
                className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Weight */}
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
                defaultValue="65"
                className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Height */}
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
                defaultValue="1.67"
                className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Date */}
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
                className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Reference */}
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
                    checked={hasReference === false}
                    onChange={() => setHasReference(false)}
                    required
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span>No</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="hasReference" 
                    value="true" 
                    checked={hasReference === true}
                    onChange={() => setHasReference(true)}
                    required
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
                className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            )}
          </div>

          </div>
          </AccordionSection>

            {/* LEFT VENTRICLE SECTION */}
            <AccordionSection 
              id="leftVentricle"
              title="Ventrículo Izquierdo"
              isOpen={openSections.leftVentricle}
              onToggle={() => toggleSection('leftVentricle')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* LVEDD: Left Ventricular End-Diastolic Diameter (in Spanish: DTDVI) */}
              <div>
                <label htmlFor="lvedd" className="block text-sm font-bold mb-2">
                  Diámetro Telediastólico (cm)
                </label>
                <input
                  type="number"
                  id="lvedd"
                  name="lvedd"
                  step="0.01"
                  required
                  defaultValue="4.15"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVEDV: Left Ventricular End-Diastolic Volume (in Spanish: VTD) */}
                <label htmlFor="lvedv" className="block text-sm font-bold mb-2">
                  Volumen Telediastólico (VTD) (ml)
                </label>
                <input
                  type="number"
                  id="lvedv"
                  name="lvedv"
                  step="0.01"
                  required
                  defaultValue="94.17"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVMASS: Left Ventricular Mass */}
                <label htmlFor="lvmass" className="block text-sm font-bold mb-2">
                  Masa (gr)
                </label>
                <input
                  type="number"
                  id="lvmass"
                  name="lvmass"
                  step="0.01"
                  required
                  defaultValue="99.47"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* IVSD: Interventricular Septal Thickness at Diastole (in Spanish: SIVd) */}
                <label htmlFor="ivsd" className="block text-sm font-bold mb-2">
                  SIVd (cm)
                </label>
                <input
                  type="number"
                  id="ivsd"
                  name="ivsd"
                  step="0.01"
                  required
                  defaultValue="0.8"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVIDED: Left Ventricular Internal Dimension at end diastole (in Spanish: DIVId) */}
                <label htmlFor="lvided" className="block text-sm font-bold mb-2">
                  DIVId (cm)
                </label>
                <input
                  type="number"
                  id="lvided"
                  name="lvided"
                  step="0.01"
                  required
                  defaultValue="4.2"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVPWD: Left Ventricular Posterior Wall Thickness at Diastole (in Spanish: PPVId) */}
                <label htmlFor="lvpwd" className="block text-sm font-bold mb-2">
                  PPVId (cm)
                </label>
                <input
                  type="number"
                  id="lvpwd"
                  name="lvpwd"
                  step="0.01"
                  required
                  defaultValue="0.78"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVESV: Left Ventricular End-Systolic Volume (in Spanish: VTS) */}
                <label htmlFor="lvesv" className="block text-sm font-bold mb-2">
                  Volumen Telesistólico (VTS) (ml)
                </label>
                <input
                  type="number"
                  id="lvesv"
                  name="lvesv"
                  step="0.01"
                  required
                  defaultValue="28.87"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="eWave" className="block text-sm font-bold mb-2">
                  Onda E (cm/s)
                </label>
                <input
                  type="number"
                  id="eWave"
                  name="eWave"
                  step="0.01"
                  required
                  defaultValue="48.84"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="aWave" className="block text-sm font-bold mb-2">
                  Onda A (cm/s)
                </label>
                <input
                  type="number"
                  id="aWave"
                  name="aWave"
                  step="0.01"
                  required
                  defaultValue="58.82"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVFDT: Left Ventricular Deceleration Time (in Spanish: Pendiente de desaceleración) */}
                <label htmlFor="lvfdt" className="block text-sm font-bold mb-2">
                  Pendiente de desaceleración (mseg)
                </label>
                <input
                  type="number"
                  id="lvfdt"
                  name="lvfdt"
                  step="0.01"
                  required
                  defaultValue="192"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LFIVRT: Left Ventricular Isovolumetric Relaxation Time (in Spanish: TRIV) */}
                <label htmlFor="lfivrt" className="block text-sm font-bold mb-2">
                  TRIV (mseg)
                </label>
                <input
                  type="number"
                  id="lfivrt"
                  name="lfivrt"
                  step="0.01"
                  required
                  defaultValue="96"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ePrimeSeptal" className="block text-sm font-bold mb-2">
                  Onda e Septal (cm/s)
                </label>
                <input
                  type="number"
                  id="ePrimeSeptal"
                  name="ePrimeSeptal"
                  step="0.01"
                  required
                  defaultValue="7.79"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="ePrimeLateral" className="block text-sm font-bold mb-2">
                  Onda e Lateral (cm/s)
                </label>
                <input
                  type="number"
                  id="ePrimeLateral"
                  name="ePrimeLateral"
                  step="0.01"
                  required
                  defaultValue="11.38"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVOTD: Left Ventricular Outflow Tract Diameter (in Spanish: DTSVI) */}
                <label htmlFor="lvotd" className="block text-sm font-bold mb-2">
                  Diámetro del tracto de salida (cm)
                </label>
                <input
                  type="number"
                  id="lvotd"
                  name="lvotd"
                  step="0.01"
                  required
                  defaultValue="2.14"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVAR: Left Ventricular Aortic Root (in Spanish: Raíz Aórtica) */}
                <label htmlFor="lvar" className="block text-sm font-bold mb-2">
                  Raíz Aórtica (cm)
                </label>
                <input
                  type="number"
                  id="lvar"
                  name="lvar"
                  step="0.01"
                  required
                  defaultValue="2.99"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVSTJ: Left Ventricular Sinotubular Junction Diameter */}
                <label htmlFor="lvstj" className="block text-sm font-bold mb-2">
                  Diámetro unión sinotubular (cm)
                </label>
                <input
                  type="number"
                  id="lvstj"
                  name="lvstj"
                  step="0.01"
                  required
                  defaultValue="2.27"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVAAD: Left Ventricular Ascending Aorta Diameter */}
                <label htmlFor="lvaad" className="block text-sm font-bold mb-2">
                  Diámetro aorta prox. ascendente (cm)
                </label>
                <input
                  type="number"
                  id="lvaad"
                  name="lvaad"
                  step="0.01"
                  required
                  defaultValue="2.48"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Left Ventricle */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObLeftVentricle" 
                        value="false" 
                        checked={hasObLeftVentricle === false}
                        onChange={() => setHasObLeftVentricle(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObLeftVentricle" 
                        value="true" 
                        checked={hasObLeftVentricle === true}
                        onChange={() => setHasObLeftVentricle(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObLeftVentricle && (
                  <textarea
                    id="obLeftVentricle"
                    name="obLeftVentricle"
                    rows="3"
                    aria-label="Observaciones Ventrículo Izquierdo"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* RIGHT VENTRICLE SECTION */}
          <AccordionSection
            id="rightVentricle"
            title="Ventrículo Derecho"
            isOpen={openSections.rightVentricle}
            onToggle={() => toggleSection('rightVentricle')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* RVBD: Right Ventricular Basal Diameter */}
                <label htmlFor="rvbd" className="block text-sm font-bold mb-2">
                  Diámetro Basal (cm)
                </label>
                <input
                  type="number"
                  id="rvbd"
                  name="rvbd"
                  step="0.01"
                  required
                  defaultValue="3.88"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVMD: Right Ventricular Mid Diameter */}
                <label htmlFor="rvmd" className="block text-sm font-bold mb-2">
                  Diámetro Medio (cm)
                </label>
                <input
                  type="number"
                  id="rvmd"
                  name="rvmd"
                  step="0.01"
                  required
                  defaultValue="2.97"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVLD: Right Ventricular Longitudinal Diameter */}
                <label htmlFor="rvld" className="block text-sm font-bold mb-2">
                  Diámetro Longitudinal (cm)
                </label>
                <input
                  type="number"
                  id="rvld"
                  name="rvld"
                  step="0.01"
                  required
                  defaultValue="7.15"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="sWave" className="block text-sm font-bold mb-2">
                  Onda S Tricuspídea (cm/s)
                </label>
                <input
                  type="number"
                  id="sWave"
                  name="sWave"
                  step="0.01"
                  required
                  defaultValue="13.18"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVTAPSE: Right Ventricular TAPSE */}
                <label htmlFor="rvtapse" className="block text-sm font-bold mb-2">
                  TAPSE (mm)
                </label>
                <input
                  type="number"
                  id="rvtapse"
                  name="rvtapse"
                  step="0.01"
                  required
                  defaultValue="22"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVEDA: Right Ventricular End-Diastolic Area */}
                <label htmlFor="rveda" className="block text-sm font-bold mb-2">
                  Área Telediastólica VD (cm²)
                </label>
                <input
                  type="number"
                  id="rveda"
                  name="rveda"
                  step="0.01"
                  required
                  defaultValue="17.15"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVESA: Right Ventricular End-Systolic Area */}
                <label htmlFor="rvesa" className="block text-sm font-bold mb-2">
                  Área Telesistólica VD (cm²)
                </label>
                <input
                  type="number"
                  id="rvesa"
                  name="rvesa"
                  step="0.01"
                  required
                  defaultValue="10.18"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVFWT: Right Ventricular Free Wall Thickness */}
                <label htmlFor="rvfwt" className="block text-sm font-bold mb-2">
                  Diámetro pared libre VD (mm)
                </label>
                <input
                  type="number"
                  id="rvfwt"
                  name="rvfwt"
                  step="0.01"
                  required
                  defaultValue="4"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Right Ventricle */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObRightVentricle" 
                        value="false" 
                        checked={hasObRightVentricle === false}
                        onChange={() => setHasObRightVentricle(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObRightVentricle" 
                        value="true" 
                        checked={hasObRightVentricle === true}
                        onChange={() => setHasObRightVentricle(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObRightVentricle && (
                  <textarea
                    id="obRightVentricle"
                    name="obRightVentricle"
                    rows="3"
                    aria-label="Observaciones Ventrículo Derecho"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* LEFT ATRIUM SECTION */}
          <AccordionSection
            id="leftAtrium"
            title="Aurícula Izquierda"
            isOpen={openSections.leftAtrium}
            onToggle={() => toggleSection('leftAtrium')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* LAAPD: Left Atrial Anteroposterior Diameter */}
                <label htmlFor="laapd" className="block text-sm font-bold mb-2">
                  Diámetro Anteroposterior (cm)
                </label>
                <input
                  type="number"
                  id="laapd"
                  name="laapd"
                  step="0.01"
                  required
                  defaultValue="3.63"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LAV: Left Atrial Volume */}
                <label htmlFor="lav" className="block text-sm font-bold mb-2">
                  Volumen aurícula izquierda (ml)
                </label>
                <input
                  type="number"
                  id="lav"
                  name="lav"
                  step="0.01"
                  required
                  defaultValue="43.84"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Left Atrium */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObLeftAtrium" 
                        value="false" 
                        checked={hasObLeftAtrium === false}
                        onChange={() => setHasObLeftAtrium(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObLeftAtrium" 
                        value="true" 
                        checked={hasObLeftAtrium === true}
                        onChange={() => setHasObLeftAtrium(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObLeftAtrium && (
                  <textarea
                    id="obLeftAtrium"
                    name="obLeftAtrium"
                    rows="3"
                    aria-label="Observaciones Aurícula Izquierda"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* RIGHT ATRIUM SECTION */}
          <AccordionSection
            id="rightAtrium"
            title="Aurícula Derecha"
            isOpen={openSections.rightAtrium}
            onToggle={() => toggleSection('rightAtrium')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* RAA: Right Atrial Area */}
                <label htmlFor="raa" className="block text-sm font-bold mb-2">
                  Área aurícula derecha (cm²)
                </label>
                <input
                  type="number"
                  id="raa"
                  name="raa"
                  step="0.01"
                  required
                  defaultValue="15.62"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RAV: Right Atrial Volume */}
                <label htmlFor="rav" className="block text-sm font-bold mb-2">
                  Volumen aurícula derecha (ml)
                </label>
                <input
                  type="number"
                  id="rav"
                  name="rav"
                  step="0.01"
                  required
                  defaultValue="42.19"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RAP: Right Atrial Pressure */}
                <label htmlFor="rap" className="block text-sm font-bold mb-2">
                  Presión aurícula derecha (mmHg)
                </label>
                <input
                  type="number"
                  id="rap"
                  name="rap"
                  step="0.01"
                  required
                  defaultValue="4.00"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Right Atrium */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObRightAtrium" 
                        value="false" 
                        checked={hasObRightAtrium === false}
                        onChange={() => setHasObRightAtrium(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObRightAtrium" 
                        value="true" 
                        checked={hasObRightAtrium === true}
                        onChange={() => setHasObRightAtrium(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObRightAtrium && (
                  <textarea
                    id="obRightAtrium"
                    name="obRightAtrium"
                    rows="3"
                    aria-label="Observaciones Aurícula Derecha"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* MITRAL VALVE SECTION */}
          <AccordionSection
            id="mitralValve"
            title="Válvula Mitral"
            isOpen={openSections.mitralValve}
            onToggle={() => toggleSection('mitralValve')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* MVVTI: Mitral Valve Velocity Time Integral */}
                <label htmlFor="mvvti" className="block text-sm font-bold mb-2">
                  IVT VM (cm)
                </label>
                <input
                  type="number"
                  id="mvvti"
                  name="mvvti"
                  step="0.01"
                  required
                  defaultValue="21.26"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* MVVMAX: Mitral Valve Maximum Velocity */}
                <label htmlFor="mvvmax" className="block text-sm font-bold mb-2">
                  Vmax VM (cm/s)
                </label>
                <input
                  type="number"
                  id="mvvmax"
                  name="mvvmax"
                  step="0.01"
                  required
                  defaultValue="71.31"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* MVMG: Mitral Valve Mean Gradient */}
                <label htmlFor="mvmg" className="block text-sm font-bold mb-2">
                  Grad Med VM (mmHg)
                </label>
                <input
                  type="number"
                  id="mvmg"
                  name="mvmg"
                  step="0.01"
                  required
                  defaultValue="0.81"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* MVA: Mitral Valve Area */}
                <label htmlFor="mva" className="block text-sm font-bold mb-2">
                  AVM (cm²)
                </label>
                <input
                  type="number"
                  id="mva"
                  name="mva"
                  step="0.01"
                  required
                  defaultValue="3.26"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Mitral Valve */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObMitralValve" 
                        value="false" 
                        checked={hasObMitralValve === false}
                        onChange={() => setHasObMitralValve(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObMitralValve" 
                        value="true" 
                        checked={hasObMitralValve === true}
                        onChange={() => setHasObMitralValve(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObMitralValve && (
                  <textarea
                    id="obMitralValve"
                    name="obMitralValve"
                    rows="3"
                    aria-label="Observaciones Válvula Mitral"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* AORTIC VALVE SECTION */}
          <AccordionSection
            id="aorticValve"
            title="Válvula Aórtica"
            isOpen={openSections.aorticValve}
            onToggle={() => toggleSection('aorticValve')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* AVVTI: Aortic Valve Velocity Time Integral */}
                <label htmlFor="avvti" className="block text-sm font-bold mb-2">
                  IVT VA (cm)
                </label>
                <input
                  type="number"
                  id="avvti"
                  name="avvti"
                  step="0.01"
                  required
                  defaultValue="26.29"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* LVOTVTI: Left Ventricular Outflow Tract Velocity Time Integral */}
                <label htmlFor="lvotvti" className="block text-sm font-bold mb-2">
                  IVT TSVI (cm)
                </label>
                <input
                  type="number"
                  id="lvotvti"
                  name="lvotvti"
                  step="0.01"
                  required
                  defaultValue="18.02"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* AV MAX GRAD: Aortic Valve Maximum Gradient */}
                <label htmlFor="avMaxGrad" className="block text-sm font-bold mb-2">
                  Grad Max (mmHg)
                </label>
                <input
                  type="number"
                  id="avMaxGrad"
                  name="avMaxGrad"
                  step="0.01"
                  required
                  defaultValue="7.98"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* AV MEAN GRAD: Aortic Valve Mean Gradient */}
                <label htmlFor="avMeanGrad" className="block text-sm font-bold mb-2">
                  Gradiente medio (mmHg)
                </label>
                <input
                  type="number"
                  id="avMeanGrad"
                  name="avMeanGrad"
                  step="0.01"
                  required
                  defaultValue="3.62"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* AVVMAX: Aortic Valve Maximum Velocity */}
                <label htmlFor="avvmax" className="block text-sm font-bold mb-2">
                  Velocidad Máxima (cm/s)
                </label>
                <input
                  type="number"
                  id="avvmax"
                  name="avvmax"
                  step="0.01"
                  required
                  defaultValue="141.18"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* AVAO: Aortic Valve Area */}
                <label htmlFor="avao" className="block text-sm font-bold mb-2">
                  Área valvular aórtica (AVAo) (cm²)
                </label>
                <input
                  type="number"
                  id="avao"
                  name="avao"
                  step="0.01"
                  required
                  defaultValue="2.46"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Aortic Valve */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObAorticValve" 
                        value="false" 
                        checked={hasObAorticValve === false}
                        onChange={() => setHasObAorticValve(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObAorticValve" 
                        value="true" 
                        checked={hasObAorticValve === true}
                        onChange={() => setHasObAorticValve(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObAorticValve && (
                  <textarea
                    id="obAorticValve"
                    name="obAorticValve"
                    rows="3"
                    aria-label="Observaciones Válvula Aórtica"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* PULMONARY VALVE SECTION */}
          <AccordionSection
            id="pulmonaryValve"
            title="Válvula Pulmonar"
            isOpen={openSections.pulmonaryValve}
            onToggle={() => toggleSection('pulmonaryValve')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* PVVMAX: Pulmonary Valve Maximum Velocity */}
                <label htmlFor="pvvmax" className="block text-sm font-bold mb-2">
                  Vmax VP (cm/s)
                </label>
                <input
                  type="number"
                  id="pvvmax"
                  name="pvvmax"
                  step="0.01"
                  required
                  defaultValue="88.42"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* RVOTVTI: Right Ventricular Outflow Tract Velocity Time Integral */}
                <label htmlFor="rvotvti" className="block text-sm font-bold mb-2">
                  IVT TSVD (cm)
                </label>
                <input
                  type="number"
                  id="rvotvti"
                  name="rvotvti"
                  step="0.01"
                  required
                  defaultValue="13.86"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* PVAT: Pulmonary Valve Acceleration Time or (RVOT AT) Right Ventricular Outflow Tract Acceleration Time )*/}
                <label htmlFor="pvat" className="block text-sm font-bold mb-2">
                  Tiempo de aceleración VP (mseg)
                </label>
                <input
                  type="number"
                  id="pvat"
                  name="pvat"
                  step="0.01"
                  required
                  defaultValue="172"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* PVD: Pulmonary Valve Diameter */}
                <label htmlFor="pvd" className="block text-sm font-bold mb-2">
                  Diámetro AAP (cm)
                </label>
                <input
                  type="number"
                  id="pvd"
                  name="pvd"
                  step="0.01"
                  required
                  defaultValue="2.02"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Observaciones Pulmonary Valve */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObPulmonaryValve" 
                        value="false" 
                        checked={hasObPulmonaryValve === false}
                        onChange={() => setHasObPulmonaryValve(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObPulmonaryValve" 
                        value="true" 
                        checked={hasObPulmonaryValve === true}
                        onChange={() => setHasObPulmonaryValve(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObPulmonaryValve && (
                  <textarea
                    id="obPulmonaryValve"
                    name="obPulmonaryValve"
                    rows="3"
                    aria-label="Observaciones Válvula Pulmonar"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* TRICUSPID VALVE SECTION */}
          <AccordionSection
            id="tricuspidValve"
            title="Válvula Tricúspide"
            isOpen={openSections.tricuspidValve}
            onToggle={() => toggleSection('tricuspidValve')}
            isLast={true}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {/* TRVMAX: Tricuspid Regurgitation Maximum Velocity */}
                <label htmlFor="trvmax" className="block text-sm font-bold mb-2">
                  Vmax IT (cm/s)
                </label>
                <input
                  type="number"
                  id="trvmax"
                  name="trvmax"
                  step="0.01"
                  required
                  defaultValue="222.32"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* TR MAX GRAD: Tricuspid Regurgitation Maximum Gradient */}
                <label htmlFor="trMaxGrad" className="block text-sm font-bold mb-2">
                  Gradiente Máximo IT (mmHg)
                </label>
                <input
                  type="number"
                  id="trMaxGrad"
                  name="trMaxGrad"
                  step="0.01"
                  required
                  defaultValue="20.5"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* IVC MAX DIAM: IVC Maximum Diameter */}
                <label htmlFor="ivcMaxDiam" className="block text-sm font-bold mb-2">
                  Diámetro Máximo VCI (cm)
                </label>
                <input
                  type="number"
                  id="ivcMaxDiam"
                  name="ivcMaxDiam"
                  step="0.01"
                  required
                  value={ivcMaxDiam}
                  onChange={(e) => {
                    setIvcMaxDiam(e.target.value);
                    handleInput(e);
                  }}
                  onInvalid={handleInvalid}
                  defaultValue="1.72"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* IVC MIN DIAM: IVC Minimum Diameter */}
                <label htmlFor="ivcMinDiam" className="block text-sm font-bold mb-2">
                  Díametro Mínimo VCI (cm)
                </label>
                <input
                  type="number"
                  id="ivcMinDiam"
                  name="ivcMinDiam"
                  step="0.01"
                  required
                  value={ivcMinDiam}
                  onChange={(e) => {
                    setIvcMinDiam(e.target.value);
                    handleInput(e);
                  }}
                  onInvalid={handleInvalid}
                  defaultValue="1.00"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* PSAP: Pulmonary Systolic Arterial Pressure */}
                <label htmlFor="psap" className="block text-sm font-bold mb-2">
                  PSAP (mmHg)
                </label>
                <input
                  type="number"
                  id="psap"
                  name="psap"
                  step="0.01"
                  required
                  defaultValue="24"
                  className="scroll-mt-12 w-full px-2 py-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                {/* Calculated IVCCI Display */}
                <label className="block text-sm font-bold mb-2 text-blue-700 dark:text-blue-300">
                  Índice Colapsabilidad VCI
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${ivcciDisplay} %`}
                  className="w-full px-2 py-2 border border-blue-700 dark:border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold cursor-default focus:outline-none"
                  placeholder="-"
                />
                <input type="hidden" name="ivcci" value={ivcciDisplay} />
              </div>

              {/* Observaciones Tricuspid Valve */}
              <div className="sm:col-span-2 w-full mt-2">
                <div className="flex items-center space-x-4">
                  <span className="block text-sm font-bold">
                    Observaciones
                  </span>
                  <div className="flex items-center space-x-3 text-sm">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObTricuspidValve" 
                        value="false" 
                        checked={hasObTricuspidValve === false}
                        onChange={() => setHasObTricuspidValve(false)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hasObTricuspidValve" 
                        value="true" 
                        checked={hasObTricuspidValve === true}
                        onChange={() => setHasObTricuspidValve(true)}
                        required
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Sí</span>
                    </label>
                  </div>
                </div>
                {hasObTricuspidValve && (
                  <textarea
                    id="obTricuspidValve"
                    name="obTricuspidValve"
                    rows="3"
                    aria-label="Observaciones Válvula Tricúspide"
                    required
                    className="scroll-mt-12 w-full px-2 py-2 mt-2 border-1 border-slate-400 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                  ></textarea>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* Status messages */}
          {state?.error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 mb-6 mt-4">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/50 mt-5">
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
