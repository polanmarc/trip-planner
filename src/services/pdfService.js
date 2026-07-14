import { jsPDF } from 'jspdf';

const addPageIfNeeded = (doc, currentY, height, margin) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + height > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return currentY;
};

const addText = (doc, text, y, margin, maxWidth, fontSize = 11, fontStyle = 'normal') => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  const lines = doc.splitTextToSize(text, maxWidth);
  const height = lines.length * fontSize * 1.2;
  y = addPageIfNeeded(doc, y, height, margin);
  doc.text(lines, margin, y, { maxWidth });
  return y + height + 6;
};

const addSectionTitle = (doc, title, y, margin, maxWidth) => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(title, maxWidth);
  const height = lines.length * 16 * 1.2;
  y = addPageIfNeeded(doc, y, height, margin);
  doc.text(lines, margin, y, { maxWidth });
  return y + height + 8;
};

export const exportItineraryToPdf = (formData, tripData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`Itinerario: ${tripData.destination}`, margin, y);
  y += 28;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const headerLine = `Origen: ${formData.origin || 'N/A'} · Destino: ${formData.destination || 'N/A'} · Ida: ${formData.departureDate || 'N/A'} · Vuelta: ${formData.returnDate || 'N/A'} · Presupuesto: ${formData.budget}`;
  y = addText(doc, headerLine, y, margin, maxWidth, 10);

  y = addSectionTitle(doc, 'Resumen del viaje', y, margin, maxWidth);
  y = addText(doc, tripData.summary, y, margin, maxWidth, 11);

  y = addSectionTitle(doc, 'Detalles del viaje', y, margin, maxWidth);
  y = addText(doc, `Estilo: ${formData.style}`, y, margin, maxWidth, 11);
  y = addText(doc, `Compañía: ${formData.companions}`, y, margin, maxWidth, 11);
  y = addText(doc, `Transporte principal: ${formData.transport}`, y, margin, maxWidth, 11);

  if (tripData.days && tripData.days.length > 0) {
    y = addSectionTitle(doc, 'Itinerario diario', y, margin, maxWidth);
    tripData.days.forEach((day) => {
      y = addText(doc, `Día ${day.dayNumber}: ${day.theme}`, y, margin, maxWidth, 12, 'bold');
      day.activities.forEach((activity) => {
        y = addText(doc, `• ${activity.time} | ${activity.location} | ${activity.price}`, y, margin, maxWidth, 11);
        y = addText(doc, `  ${activity.description}`, y, margin, maxWidth, 10);
        if (activity.transportNote) {
          y = addText(doc, `  Transporte sugerido: ${activity.transportNote}`, y, margin, maxWidth, 10);
        }
      });
      y += 4;
    });
  }

  if (tripData.transportAdvice) {
    y = addSectionTitle(doc, 'Logística y transporte', y, margin, maxWidth);
    y = addText(doc, tripData.transportAdvice.summary, y, margin, maxWidth, 11);
    if (tripData.transportAdvice.travelCost) {
      y = addText(doc, `Costo estimado: ${tripData.transportAdvice.travelCost}`, y, margin, maxWidth, 11);
    } else if (tripData.transportAdvice.estimatedCost) {
      y = addText(doc, `Costo estimado: ${tripData.transportAdvice.estimatedCost}`, y, margin, maxWidth, 11);
    }
  }

  if (tripData.siteIdeas && tripData.siteIdeas.length > 0) {
    y = addSectionTitle(doc, 'Ideas de sitios según tus temáticas', y, margin, maxWidth);
    tripData.siteIdeas.forEach((idea) => {
      y = addText(doc, `• ${idea.name} (${idea.category}) — ${idea.estimatedCost}`, y, margin, maxWidth, 11);
      y = addText(doc, `  Horario: ${idea.entryTime} - ${idea.exitTime}`, y, margin, maxWidth, 10);
      y = addText(doc, `  Por qué encaja: ${idea.whyItFits}`, y, margin, maxWidth, 10);
      y += 2;
    });
  }

  if (tripData.recommendations && tripData.recommendations.length > 0) {
    y = addSectionTitle(doc, 'Recomendaciones clave', y, margin, maxWidth);
    tripData.recommendations.forEach((rec) => {
      y = addText(doc, `• ${rec}`, y, margin, maxWidth, 11);
    });
  }

  if (tripData.packingList && tripData.packingList.length > 0) {
    y = addSectionTitle(doc, 'Lista de equipaje', y, margin, maxWidth);
    tripData.packingList.forEach((item) => {
      y = addText(doc, `• ${item}`, y, margin, maxWidth, 11);
    });
  }

  const fileName = `itinerario-${formData.destination?.toLowerCase().replace(/\s+/g, '-') || 'viaje'}.pdf`;
  doc.save(fileName);
};
