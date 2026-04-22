import { describe, it, expect } from "vitest";
import { DocumentSchema, ApplicantSchema } from "../../domain/documentSchemaForm";

describe("DocumentSchema", () => {
  it("deve validar um payload válido", () => {
    const validData = {
      purpose: "DPVAT",

      applicant: {
        applicant_type: "PATIENT",
        full_name: "João da Silva",
        cpf: "18714933748",
        rg: "287557672",
        email: "joao.silva@email.com",
        address: "Rua A, 123 - Centro - São Paulo/SP",
        phone: "(11) 99999-9999",
      },

      incident: {
        date: "2026-01-29",
        time: "14:35:00",
        patient_name: "Maria da Silva",
        city: "NOVA IGUACU",
        neighborhood: "Centro",
        address: "Rua Doutor Barros Júnior, 245",
        reason: "Queda com possível fratura",
        attendance_location: "OTH",
        other_location_description: "Estabelecimento comercial",
        occurrence_number: "OC-2026-000123",
        notes: "Paciente consciente",
      },

      documents: [
        new File(["fake"], "paciente.jpg", { type: "image/jpeg" }),
      ],

      document_types: ["PATIENT_ID"],
    };

    const result = DocumentSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("deve falhar se attendance_location for OTH sem descrição", () => {
    const invalidData = {
      purpose: "DPVAT",

      applicant: {
        applicant_type: "PATIENT",
        full_name: "João da Silva",
        cpf: "18714933748",
        rg: "287557672",
        email: "joao.silva@email.com",
        address: "Rua A, 123",
        phone: "(11) 99999-9999",
      },

      incident: {
        date: "2026-01-29",
        time: "14:35:00",
        patient_name: "Maria da Silva",
        city: "NOVA IGUACU",
        neighborhood: "Centro",
        address: "Rua Doutor Barros Júnior, 245",
        reason: "Queda",
        attendance_location: "OTH",
        occurrence_number: "OC-2026-000123",
      },

      documents: [
        new File(["fake"], "paciente.jpg"),
      ],

      document_types: ["PATIENT_ID"],
    };

    const result = DocumentSchema.safeParse(invalidData);

    expect(result.success).toBe(false);

    if (!result.success) {
    const errors = result.error.format();

    expect(
        errors.incident?.other_location_description?._errors.length
    ).toBeGreaterThan(0);
    }

  });

  it("deve falhar se document_types estiver vazio", () => {
    const invalidData = {
      purpose: "DPVAT",
      applicant: {
        applicant_type: "PATIENT",
        full_name: "João da Silva",
        cpf: "18714933748",
        rg: "287557672",
        email: "joao.silva@email.com",
        address: "Rua A, 123",
        phone: "(11) 99999-9999",
      },
      incident: {
        date: "2026-01-29",
        time: "14:35:00",
        patient_name: "Maria da Silva",
        city: "NOVA IGUACU",
        neighborhood: "Centro",
        address: "Rua Doutor Barros Júnior, 245",
        reason: "Queda",
        attendance_location: "RES",
        occurrence_number: "OC-2026-000123",
      },
      documents: [
        new File(["fake"], "paciente.jpg"),
      ],
      document_types: [],
    };

    const result = DocumentSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

});



describe("ApplicantSchema – validação condicional", () => {
  it("deve FALHAR se applicant_type for PATIENT e relationship_degree estiver preenchido", () => {
    const invalidPatient = {
      applicant_type: "PATIENT",
      relationship_degree: "FAMILY",
      full_name: "João da Silva",
      cpf: "18714933748",
      rg: "287557672",
      email: "joao.silva@email.com",
      address: "Rua A, 123",
      phone: "(11) 99999-9999",
    };

    const result = ApplicantSchema.safeParse(invalidPatient);

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.format();

      expect(
        errors.relationship_degree?._errors[0]
      ).toBe(
        "Grau de parentesco não deve ser informado quando o solicitante é o próprio paciente"
      );
    }
  });

  it("deve FALHAR se applicant_type for REPRESENTATIVE e relationship_degree NÃO for informado", () => {
    const invalidRepresentative = {
      applicant_type: "REPRESENTATIVE",
      full_name: "Maria da Silva",
      cpf: "12345678900",
      rg: "1234567",
      email: "maria@email.com",
      address: "Rua B, 456",
      phone: "(11) 98888-8888",
    };

    const result = ApplicantSchema.safeParse(invalidRepresentative);

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.format();

      expect(
        errors.relationship_degree?._errors[0]
      ).toBe(
        "Grau de parentesco é obrigatório para representante"
      );
    }
  });

  it("deve PASSAR se applicant_type for PATIENT sem relationship_degree", () => {
    const validPatient = {
      applicant_type: "PATIENT",
      full_name: "João da Silva",
      cpf: "18714933748",
      rg: "287557672",
      email: "joao.silva@email.com",
      address: "Rua A, 123",
      phone: "(11) 99999-9999",
    };

    const result = ApplicantSchema.safeParse(validPatient);

    expect(result.success).toBe(true);
  });

  it("deve PASSAR se applicant_type for REPRESENTATIVE com relationship_degree", () => {
    const validRepresentative = {
      applicant_type: "REPRESENTATIVE",
      relationship_degree: "ATTORNEY",
      full_name: "Maria da Silva",
      cpf: "12345678900",
      rg: "1234567",
      email: "maria@email.com",
      address: "Rua B, 456",
      phone: "(11) 98888-8888",
    };

    const result = ApplicantSchema.safeParse(validRepresentative);

    expect(result.success).toBe(true);
  });
});