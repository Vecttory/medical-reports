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
    const truncateDecimals = (num) => {
      const str = num.toString();
      const [intPart, decPart] = str.split('.');
      if (!decPart) return `${intPart}.00`;
      return `${intPart}.${decPart.slice(0, 2).padEnd(2, '0')}`;
    };

    // Calculate BSA (Mosteller formula: sqrt(height(cm) * weight(kg) / 3600))
    const bsa = Math.sqrt((heightCm * weightKg) / 3600);
    const ascFormatted = truncateDecimals(bsa);

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
