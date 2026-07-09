

interface Menu {
    label: string;
    path: string;
}

export const MENU: Menu[] = [
    { label: "Inicio", path: "/" },
    { label: "Solicitar", path: "/solicitar" },
    { label: "Acompanhar / Retificar", path: "/acompanhar" }
]