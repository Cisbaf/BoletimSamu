

const buildForDjango = true;

const urlForViteDev = "http://localhost:8000"
const urlForIncludeInDjango = ""

export const ApiBaseUrl = buildForDjango? urlForIncludeInDjango : urlForViteDev
