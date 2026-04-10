import type { DocumentFormData } from "../domain/documentSchemaForm";

export const initialFilling: DocumentFormData = {
  purpose: "OUTROS",

  applicant: {
    applicant_type: "PATIENT",
    // NÃO pode ter relationship_degree quando for PATIENT
    full_name: "Daniel Fernandes Pereira",
    cpf: "18714933748", // apenas números
    rg: "287557672",
    email: "danielfernandes202@gmail.com",
    address: "Rua Kátia nº 200 - Marco II",
    phone: "21991920338",
  },

  incident: {
    date: "2026-02-27",
    time: "16:20",
    patient_name: "Daniel Fernandes Pereira",
    city: "DUQUE DE CAXIAS",
    neighborhood: "Marco II",
    address: "Rua Kátia nº 200",
    reason: "Queda acidental em via pública",
    attendance_location: "RES",
    // other_location_description NÃO é necessário pois não é OTH
    occurrence_number: "",
    notes: "",
  },

};