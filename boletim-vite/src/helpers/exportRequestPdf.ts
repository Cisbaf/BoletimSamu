import { jsPDF } from "jspdf";
import type { DocumentDetail } from "../domain/documentDetail";
import {
  APPLICANT_TYPE_LABELS,
  RELATIONSHIP_DEGREE_LABELS,
} from "../domain/documentSchemaForm";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLUMN_GAP = 6;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;

const COLOR_ACCENT: [number, number, number] = [37, 99, 235];
const COLOR_TITLE: [number, number, number] = [55, 65, 81];
const COLOR_LABEL: [number, number, number] = [156, 163, 175];
const COLOR_VALUE: [number, number, number] = [17, 24, 39];
const COLOR_MUTED: [number, number, number] = [107, 114, 128];
const COLOR_BORDER: [number, number, number] = [229, 231, 235];
const COLOR_HEADER_BG: [number, number, number] = [239, 246, 255];
const COLOR_HEADER_BORDER: [number, number, number] = [191, 219, 254];

interface Field {
  label: string;
  value?: string | null;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function drawSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(MARGIN, y, 1.2, 4.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_TITLE);
  doc.text(title, MARGIN + 4, y + 3.6);
  return y + 9;
}

function fieldHeight(doc: jsPDF, field: Field, width: number): number {
  const lines = doc.splitTextToSize(field.value?.trim() || "—", width);
  return 4 + lines.length * 4.2 + 3;
}

function drawField(doc: jsPDF, x: number, y: number, width: number, field: Field): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_LABEL);
  doc.text(field.label.toUpperCase(), x, y);

  const lines = doc.splitTextToSize(field.value?.trim() || "—", width);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_VALUE);
  doc.text(lines, x, y + 4.5);

  return 4 + lines.length * 4.2 + 3;
}

function drawFieldColumns(doc: jsPDF, y: number, left: Field[], right: Field[]): number {
  const rows = Math.max(left.length, right.length);
  let cursorY = y;

  for (let i = 0; i < rows; i++) {
    const leftField = left[i];
    const rightField = right[i];

    const leftHeight = leftField ? fieldHeight(doc, leftField, COLUMN_WIDTH) : 0;
    const rightHeight = rightField ? fieldHeight(doc, rightField, COLUMN_WIDTH) : 0;
    const rowHeight = Math.max(leftHeight, rightHeight);

    cursorY = ensureSpace(doc, cursorY, rowHeight);

    if (leftField) drawField(doc, MARGIN, cursorY, COLUMN_WIDTH, leftField);
    if (rightField) drawField(doc, MARGIN + COLUMN_WIDTH + COLUMN_GAP, cursorY, COLUMN_WIDTH, rightField);

    cursorY += rowHeight;
  }

  return cursorY;
}

export function exportRequestPdf(data: DocumentDetail) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_TITLE);
  doc.text("Solicitação de Cópia de Boletim", MARGIN, y);
  y += 8;

  const applicantLabel = [
    APPLICANT_TYPE_LABELS[data.applicant.applicantType],
    data.applicant.relationshipDegree
      ? `› ${RELATIONSHIP_DEGREE_LABELS[data.applicant.relationshipDegree]}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const headerHeight = 20;
  doc.setFillColor(...COLOR_HEADER_BG);
  doc.setDrawColor(...COLOR_HEADER_BORDER);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, headerHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(96, 165, 250);
  doc.text("PROTOCOLO", MARGIN + 5, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(29, 78, 216);
  doc.text(`#${data.protocol}`, MARGIN + 5, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(applicantLabel, MARGIN + 5, y + 18.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    `Solicitado em ${new Date(data.createdAt).toLocaleString("pt-BR")}`,
    MARGIN + CONTENT_WIDTH - 5,
    y + 7,
    { align: "right" }
  );

  y += headerHeight + 8;

  // Dados do Requerente
  y = drawSectionTitle(doc, y, "Dados do Requerente");
  y = drawFieldColumns(
    doc,
    y,
    [
      { label: "Nome Completo", value: data.applicant.fullName },
      { label: "RG", value: data.applicant.rg },
      { label: "Email", value: data.applicant.email },
      { label: "Finalidade", value: data.otherPurpose || data.purpose },
    ],
    [
      { label: "CPF", value: data.applicant.cpf },
      { label: "Telefone", value: data.applicant.phone },
      { label: "Endereço", value: data.applicant.address },
      { label: "Motivo da Solicitação", value: data.incident.reason },
    ]
  );

  y += 6;

  // Dados da Ocorrência
  y = ensureSpace(doc, y, 12);
  y = drawSectionTitle(doc, y, "Dados da Ocorrência");
  y = drawFieldColumns(
    doc,
    y,
    [
      { label: "Nome do Paciente", value: data.incident.patientName },
      { label: "Data da Ocorrência", value: data.incident.date },
      { label: "Hora da Ocorrência", value: data.incident.time },
    ],
    [
      { label: "Município", value: data.incident.city },
      { label: "Bairro", value: data.incident.neighborhood },
      { label: "Endereço", value: data.incident.address },
    ]
  );

  if (data.incident.attendanceLocation) {
    y = ensureSpace(doc, y, 12);
    y += drawField(doc, MARGIN, y, CONTENT_WIDTH, {
      label: "Local de Atendimento",
      value: data.incident.attendanceLocation,
    });
  }

  // Observações
  if (data.incident.notes) {
    y += 6;
    y = ensureSpace(doc, y, 12);
    y = drawSectionTitle(doc, y, "Observações");
    y = ensureSpace(doc, y, fieldHeight(doc, { label: "", value: data.incident.notes }, CONTENT_WIDTH));
    const lines = doc.splitTextToSize(data.incident.notes, CONTENT_WIDTH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_VALUE);
    doc.text(lines, MARGIN, y);
  }

  doc.setDrawColor(...COLOR_BORDER);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")}`,
      MARGIN,
      PAGE_HEIGHT - 8
    );
  }

  doc.save(`solicitacao-${data.protocol}.pdf`);
}
