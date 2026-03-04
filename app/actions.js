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

    // Format date to DD/MM/YYYY
    const [year, month, day] = patientData.date.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    // Reference logic
    const hasRefBool = patientData.hasReference === "true";
    const referenceValue = hasRefBool ? patientData.reference : "";

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
