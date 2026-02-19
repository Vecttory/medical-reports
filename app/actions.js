"use server";

export async function processReport(prevState, formData) {
  // Extract fields from formData
  const patientData = {
    name: formData.get("name"),
    age: formData.get("age"),
    date: formData.get("date"),
    weight: formData.get("weight"),
    height: formData.get("height"),
    reference: formData.get("reference"),
  };

  // Basic validation (even though HTML5 handles most of it)
  if (!patientData.name || !patientData.age || !patientData.date || !patientData.weight || !patientData.height) {
    return { error: "Faltan campos requeridos." };
  }

  try {
    // In the future, this is where word document manipulation would happen.
    // e.g., using docxtemplater or similar to generate the report
    
    // Simulating processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { 
      success: true, 
      message: "El documento ha sido generado exitosamente." 
    };
  } catch (error) {
    return { error: "Hubo un error al generar el documento." };
  }
}
