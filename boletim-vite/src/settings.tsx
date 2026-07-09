

// URL base da API definida por ambiente (VITE_API_URL), não mais por flag manual.
// Ver .env.development (dev, aponta pro Django em :8000) e .env.production
// (prod, string vazia = mesma origem, já que o Django serve o build do Vite).
export const ApiBaseUrl = import.meta.env.VITE_API_URL ?? ""
