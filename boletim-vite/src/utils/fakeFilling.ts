// Gerador de dados fictícios para facilitar testes manuais do formulário em
// DESENVOLVIMENTO. Nunca é importado/usado em produção (ver botão dev-only em
// ApplicantForm.tsx, condicionado por import.meta.env.DEV).
import { fakerPT_BR as faker } from "@faker-js/faker";
import type { DocumentFormData, RequiredDocument } from "../domain/documentSchemaForm";
import {
  ATTENDANCE_LOCATIONS,
  CITIES,
  PURPOSES,
  RELATIONSHIP_DEGREES,
  getRequiredDocuments,
} from "../domain/documentSchemaForm";

/* =========================
 * Helpers de geração
 * ========================= */

function randomFrom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Gera um CPF com dígitos verificadores válidos (mesmo algoritmo de domain/valid.ts). */
function generateValidCPF(): string {
  const randomBase = () => Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  let base = randomBase();
  // isValidCPF rejeita sequências com todos os dígitos iguais
  while (base.every((d) => d === base[0])) {
    base = randomBase();
  }

  const calcDigit = (digits: number[], factor: number) => {
    let total = 0;
    for (const n of digits) total += n * factor--;
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(base, 10);
  const d2 = calcDigit([...base, d1], 11);

  return [...base, d1, d2].join("");
}

/** DDD 21 = Baixada Fluminense/RJ, região das cidades listadas em CITIES. */
function generatePhone(): string {
  return `21${faker.string.numeric(9).replace(/^./, "9")}`;
}

// PNG transparente 1x1 — usado como conteúdo mínimo válido para os anexos fake.
const FAKE_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function createFakeFile(baseName: string): File {
  const binary = atob(FAKE_IMAGE_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], `${baseName}.png`, { type: "image/png" });
}

/* =========================
 * Gerador principal
 * ========================= */

/** Gera um preenchimento fictício novo a cada chamada (dados aleatórios, mas válidos pelo schema atual). */
export function generateFakeFilling(): DocumentFormData {
  const applicantType = randomFrom(["PATIENT", "REPRESENTATIVE"] as const);
  const relationshipDegree =
    applicantType === "REPRESENTATIVE" ? randomFrom(RELATIONSHIP_DEGREES) : undefined;

  // Paciente não pode solicitar óbito do próprio nome (regra da UI em IncidentForm)
  const purposeOptions = applicantType === "PATIENT"
    ? PURPOSES.filter((p) => p !== "OBITO")
    : PURPOSES;
  const purpose = randomFrom(purposeOptions);
  const otherPurpose = purpose === "OUTROS" ? faker.lorem.words({ min: 3, max: 6 }) : undefined;

  const applicantName = faker.person.fullName();
  const patientName = applicantType === "PATIENT" ? applicantName : faker.person.fullName();

  const [firstName, ...restName] = applicantName.split(" ");
  const lastName = restName[restName.length - 1] ?? "Solicitante";
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();

  const attendanceLocation = randomFrom(ATTENDANCE_LOCATIONS);
  const otherLocationDescription =
    attendanceLocation === "OTH" ? faker.lorem.words({ min: 2, max: 5 }) : undefined;

  const incidentDate = faker.date.recent({ days: 60 });
  const hour = String(faker.number.int({ min: 0, max: 23 })).padStart(2, "0");
  const minute = String(faker.number.int({ min: 0, max: 59 })).padStart(2, "0");

  const requiredDocs = getRequiredDocuments(applicantType, relationshipDegree, purpose);
  // Partial aqui de propósito: só entram as chaves realmente exigidas (mesmo
  // comportamento do formulário real, que nunca preenche as demais). O tipo
  // gerado pelo zod para z.record com chave enum exige as 5 chaves em TS —
  // por isso o cast abaixo, no retorno, para o tipo exato de DocumentFormData.
  const documents: Partial<Record<RequiredDocument, File>> = {};
  requiredDocs.forEach((doc) => {
    documents[doc] = createFakeFile(doc.toLowerCase());
  });

  return {
    purpose,
    other_purpose: otherPurpose,

    applicant: {
      applicant_type: applicantType,
      relationship_degree: relationshipDegree,
      full_name: applicantName,
      cpf: generateValidCPF(),
      rg: faker.string.numeric({ length: { min: 7, max: 9 } }),
      email,
      address: faker.location.streetAddress(),
      phone: generatePhone(),
    },

    incident: {
      date: incidentDate.toISOString().slice(0, 10),
      time: `${hour}:${minute}`,
      patient_name: patientName,
      city: randomFrom(CITIES),
      neighborhood: faker.location.street(),
      address: faker.location.streetAddress(),
      reason: faker.lorem.sentence({ min: 3, max: 6 }).replace(/\.$/, "").slice(0, 50),
      attendance_location: attendanceLocation,
      other_location_description: otherLocationDescription,
      occurrence_number: `${faker.string.numeric(7)}/0`,
      notes: faker.lorem.sentence().slice(0, 150),
    },

    documents: documents as DocumentFormData["documents"],
  };
}
