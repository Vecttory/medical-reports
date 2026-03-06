"use server";

import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export async function processReport(prevState, formData) {
  // Extract fields from formData
  const patientData = {
    name: formData.get("name"),
    age: formData.get("age"),
    date: formData.get("date"),
    weight: formData.get("weight"),
    weightUnit: formData.get("weightUnit"),
    height: formData.get("height"),
    reference: formData.get("reference"),
    hasReference: formData.get("hasReference"),
  };

  const leftVentricleData = {
    lvedd: parseFloat(formData.get("lvedd") || "0"),
    lvedv: parseFloat(formData.get("lvedv") || "0"),
    lvmass: parseFloat(formData.get("lvmass") || "0"),
    ivsd: parseFloat(formData.get("ivsd") || "0"),
    lvided: parseFloat(formData.get("lvided") || "0"),
    lvpwd: parseFloat(formData.get("lvpwd") || "0"),
    lvesv: parseFloat(formData.get("lvesv") || "0"),
    eWave: parseFloat(formData.get("eWave") || "0"),
    aWave: parseFloat(formData.get("aWave") || "0"),
    lvfdt: parseFloat(formData.get("lvfdt") || "0"),
    lfivrt: parseFloat(formData.get("lfivrt") || "0"),
    ePrimeSeptal: parseFloat(formData.get("ePrimeSeptal") || "0"),
    ePrimeLateral: parseFloat(formData.get("ePrimeLateral") || "0"),
    lvotd: parseFloat(formData.get("lvotd") || "0"),
    lvar: parseFloat(formData.get("lvar") || "0"),
    lvstj: parseFloat(formData.get("lvstj") || "0"),
    lvaad: parseFloat(formData.get("lvaad") || "0"),
  };

  const rightVentricleData = {
    rvbd: parseFloat(formData.get("rvbd") || "0"),
    rvmd: parseFloat(formData.get("rvmd") || "0"),
    rvld: parseFloat(formData.get("rvld") || "0"),
    sWave: parseFloat(formData.get("sWave") || "0"),
    rvtapse: parseFloat(formData.get("rvtapse") || "0"),
    rveda: parseFloat(formData.get("rveda") || "0"),
    rvesa: parseFloat(formData.get("rvesa") || "0"),
    rvfwt: parseFloat(formData.get("rvfwt") || "0"),
  };

  const leftAtriumData = {
    laapd: parseFloat(formData.get("laapd") || "0"),
    lav: parseFloat(formData.get("lav") || "0"),
  };

  const rightAtriumData = {
    raa: parseFloat(formData.get("raa") || "0"),
    rav: parseFloat(formData.get("rav") || "0"),
    rap: parseFloat(formData.get("rap") || "0"),
  };

  const mitralValveData = {
    mvvti: parseFloat(formData.get("mvvti") || "0"),
    mvvmax: parseFloat(formData.get("mvvmax") || "0"),
    mvmg: parseFloat(formData.get("mvmg") || "0"),
    mva: parseFloat(formData.get("mva") || "0"),
  };

  const aorticValveData = {
    avvti: parseFloat(formData.get("avvti") || "0"),
    lvotvti: parseFloat(formData.get("lvotvti") || "0"),
    avMaxGrad: parseFloat(formData.get("avMaxGrad") || "0"),
    avMeanGrad: parseFloat(formData.get("avMeanGrad") || "0"),
    avvmax: parseFloat(formData.get("avvmax") || "0"),
    avao: parseFloat(formData.get("avao") || "0"),
  };

  const pulmonaryValveData = {
    pvvmax: parseFloat(formData.get("pvvmax") || "0"),
    rvotvti: parseFloat(formData.get("rvotvti") || "0"),
    pvat: parseFloat(formData.get("pvat") || "0"),
    pvd: parseFloat(formData.get("pvd") || "0"),
  };

  const tricuspidValveData = {
    trvmax: parseFloat(formData.get("trvmax") || "0"),
    trMaxGrad: parseFloat(formData.get("trMaxGrad") || "0"),
    ivcMaxDiam: parseFloat(formData.get("ivcMaxDiam") || "0"),
    ivcMinDiam: parseFloat(formData.get("ivcMinDiam") || "0"),
    psap: parseFloat(formData.get("psap") || "0"),
    ivcci: parseInt(formData.get("ivcci") || "0", 10),
  };

  // Basic validation (even though HTML5 handles most of it)
  if (!patientData.name || !patientData.age || !patientData.date || !patientData.weight || !patientData.height) {
    return { error: "Faltan campos requeridos." };
  }

  try {
    // Convert weight to kg if lbs
    let weightKg = parseFloat(patientData.weight);
    if (patientData.weightUnit === "lbs") {
      weightKg = weightKg * 0.453592;
    }

    // Height is in meters
    const heightM = parseFloat(patientData.height);
    const heightCm = heightM * 100;

    // Helper to truncate without rounding
    const truncateDecimals = (num, decimals = 2) => {
      const str = num.toString();
      const [intPart, decPart] = str.split('.');
      
      if (decimals === 0) return intPart;

      if (!decPart) return `${intPart}.${'0'.repeat(decimals)}`;
      return `${intPart}.${decPart.slice(0, decimals).padEnd(decimals, '0')}`;
    };

    // Calculate BSA (Mosteller formula: sqrt(height(cm) * weight(kg) / 3600))
    const bsa = Math.sqrt((heightCm * weightKg) / 3600);
    const ascFormatted = truncateDecimals(bsa);

    // Left Ventricle Calculations
    const {
      lvedd, lvedv, lvmass, ivsd, lvided, lvpwd, lvesv,
      eWave, aWave, lvfdt, lfivrt, ePrimeSeptal, ePrimeLateral,
      lvotd, lvar, lvstj, lvaad
    } = leftVentricleData;

    const ilvedd = lvedd / bsa;
    const ilvedv = lvedv / bsa;
    const ilvmass = lvmass / bsa;
    const lvrwt = lvided !== 0 ? (2 * lvpwd) / lvided : 0;
    const lvef = lvedv !== 0 ? ((lvedv - lvesv) / lvedv) * 100 : 0;
    const eaWaveRel = aWave !== 0 ? eWave / aWave : 0;
    const ePrimeAvg = (ePrimeSeptal + ePrimeLateral) / 2;
    const eRatio = ePrimeAvg !== 0 ? eWave / ePrimeAvg : 0;
    const ilvar = lvar / bsa;
    const ilvaad = lvaad / bsa;

    // Right Ventricle Calculations
    const {
      rvbd, rvmd, rvld,
      sWave, rvtapse, rveda, rvesa, rvfwt
    } = rightVentricleData;

    const rvfac = rveda !== 0 ? ((rveda - rvesa) / rveda) * 100 : 0;

    // Left Atrium Calculations
    const { laapd, lav } = leftAtriumData;
    const ilav = lav / bsa;

    // Right Atrium Calculations
    const { raa, rav, rap } = rightAtriumData;
    const irav = rav / bsa;

    // Mitral Valve Calculations
    const { mvvti, mvvmax, mvmg, mva } = mitralValveData;

    // Aortic Valve Calculations
    const { avvti, lvotvti, avMaxGrad, avMeanGrad, avvmax, avao } = aorticValveData;
    const iavao = avao / bsa;

    // Pulmonary Valve Calculations
    const { pvvmax, rvotvti, pvat, pvd } = pulmonaryValveData;

    // Tricuspid Valve Calculations
    const { trvmax, trMaxGrad, ivcMaxDiam, ivcMinDiam, psap, ivcci } = tricuspidValveData;
    
    // Conclusions Calculations
    const pasp = rap + trMaxGrad;

    // Format date to DD/MM/YYYY
    const [year, month, day] = patientData.date.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    // Reference logic
    const hasRefBool = patientData.hasReference === "true";
    const referenceValue = hasRefBool ? patientData.reference : "";

    // Observaciones logic
    const hasObLeftVentricleBool = formData.get("hasObLeftVentricle") === "true";
    const obLeftVentricleValue = hasObLeftVentricleBool && formData.get("obLeftVentricle")?.trim() ? ` ${formData.get("obLeftVentricle")}` : "";

    const hasObRightVentricleBool = formData.get("hasObRightVentricle") === "true";
    const obRightVentricleValue = hasObRightVentricleBool && formData.get("obRightVentricle")?.trim() ? ` ${formData.get("obRightVentricle")}` : "";

    const hasObLeftAtriumBool = formData.get("hasObLeftAtrium") === "true";
    const obLeftAtriumValue = hasObLeftAtriumBool && formData.get("obLeftAtrium")?.trim() ? ` ${formData.get("obLeftAtrium")}` : "";

    const hasObRightAtriumBool = formData.get("hasObRightAtrium") === "true";
    const obRightAtriumValue = hasObRightAtriumBool && formData.get("obRightAtrium")?.trim() ? ` ${formData.get("obRightAtrium")}` : "";

    const hasObMitralValveBool = formData.get("hasObMitralValve") === "true";
    const obMitralValveValue = hasObMitralValveBool && formData.get("obMitralValve")?.trim() ? ` ${formData.get("obMitralValve")}` : "";

    const hasObAorticValveBool = formData.get("hasObAorticValve") === "true";
    const obAorticValveValue = hasObAorticValveBool && formData.get("obAorticValve")?.trim() ? ` ${formData.get("obAorticValve")}` : "";

    const hasObPulmonaryValveBool = formData.get("hasObPulmonaryValve") === "true";
    const obPulmonaryValveValue = hasObPulmonaryValveBool && formData.get("obPulmonaryValve")?.trim() ? ` ${formData.get("obPulmonaryValve")}` : "";

    const hasObTricuspidValveBool = formData.get("hasObTricuspidValve") === "true";
    const obTricuspidValveValue = hasObTricuspidValveBool && formData.get("obTricuspidValve")?.trim() ? ` ${formData.get("obTricuspidValve")}` : "";

    // Load the template
    const templatePath = path.join(process.cwd(), "public", "medical-rerpot-template.docx");
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Set the template variables
    doc.render({
      name: patientData.name,
      age: patientData.age,
      date: formattedDate,
      weight: truncateDecimals(weightKg),
      height: truncateDecimals(heightM),
      asc: ascFormatted,
      reference: referenceValue,
      hasReference: hasRefBool, // Boolean sent in addition to the string
      
      // Left Ventricle Data
      ilvedd: truncateDecimals(ilvedd),
      ilvedv: truncateDecimals(ilvedv),
      ilvmass: truncateDecimals(ilvmass),
      ivsd: truncateDecimals(ivsd),
      lvided: truncateDecimals(lvided),
      lvpwd: truncateDecimals(lvpwd),
      lvrwt: truncateDecimals(lvrwt),
      lvedv: truncateDecimals(lvedv),
      lvesv: truncateDecimals(lvesv),
      lvef: truncateDecimals(lvef),
      eWave: truncateDecimals(eWave),
      aWave: truncateDecimals(aWave),
      eaWaveRel: truncateDecimals(eaWaveRel),
      lvfdt: truncateDecimals(lvfdt, 0),
      lfivrt: truncateDecimals(lfivrt, 0),
      ePrimeSeptal: truncateDecimals(ePrimeSeptal),
      ePrimeLateral: truncateDecimals(ePrimeLateral),
      eRatio: truncateDecimals(eRatio),
      lvotd: truncateDecimals(lvotd),
      lvar: truncateDecimals(lvar),
      ilvar: truncateDecimals(ilvar),
      lvstj: truncateDecimals(lvstj),
      lvaad: truncateDecimals(lvaad),
      ilvaad: truncateDecimals(ilvaad),

      // Right Ventricle Data
      rvbd: truncateDecimals(rvbd),
      rvmd: truncateDecimals(rvmd),
      rvld: truncateDecimals(rvld),
      sWave: truncateDecimals(sWave),
      rvtapse: truncateDecimals(rvtapse, 0),
      rveda: truncateDecimals(rveda),
      rvesa: truncateDecimals(rvesa),
      rvfac: truncateDecimals(rvfac),
      rvfwt: truncateDecimals(rvfwt, 0),

      // Left Atrium Data
      laapd: truncateDecimals(laapd),
      // lav: truncateDecimals(lav), not used in the template
      ilav: truncateDecimals(ilav),

      // Right Atrium Data
      raa: truncateDecimals(raa),
      // rav: truncateDecimals(rav), not used in the template 
      irav: truncateDecimals(irav),

      // Mitral Valve Data
      mvvti: truncateDecimals(mvvti),
      mvvmax: truncateDecimals(mvvmax),
      mvmg: truncateDecimals(mvmg),
      mva: truncateDecimals(mva),

      // Aortic Valve Data
      avvti: truncateDecimals(avvti),
      lvotvti: truncateDecimals(lvotvti),
      avMaxGrad: truncateDecimals(avMaxGrad),
      avMeanGrad: truncateDecimals(avMeanGrad),
      avvmax: truncateDecimals(avvmax),
      avao: truncateDecimals(avao),
      iavao: truncateDecimals(iavao),

      // Pulmonary Valve Data
      pvvmax: truncateDecimals(pvvmax),
      rvotvti: truncateDecimals(rvotvti),
      pvat: truncateDecimals(pvat, 0),
      pvd: truncateDecimals(pvd),

      // Tricuspid Valve Data
      trvmax: truncateDecimals(trvmax),
      trMaxGrad: truncateDecimals(trMaxGrad),
      ivcMaxDiam: truncateDecimals(ivcMaxDiam),
      // ivcMinDiam: truncateDecimals(ivcMinDiam), not used in the template
      psap: truncateDecimals(psap),
      ivcci: ivcci, // No truncation needed, it's already an integer from the form

      // Observations
      obLeftVentricle: obLeftVentricleValue,
      obRightVentricle: obRightVentricleValue,
      obLeftAtrium: obLeftAtriumValue,
      obRightAtrium: obRightAtriumValue,
      obMitralValve: obMitralValveValue,
      obAorticValve: obAorticValveValue,
      obPulmonaryValve: obPulmonaryValveValue,
      obTricuspidValve: obTricuspidValveValue,

      // Conclusions (no decimals values)
      lvefInt: truncateDecimals(lvef, 0),
      rvfacInt: truncateDecimals(rvfac, 0),
      pasp: truncateDecimals(pasp, 0),
    });

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const base64Doc = buf.toString("base64");

    return { 
      success: true, 
      message: "El documento ha sido generado exitosamente.",
      documentBase64: base64Doc,
      fileName: `Reporte_${patientData.name.replace(/\s+/g, "_")}.docx`
    };
  } catch (error) {
    console.error("Error generating document:", error);
    return { error: "Hubo un error al generar el documento." };
  }
}
