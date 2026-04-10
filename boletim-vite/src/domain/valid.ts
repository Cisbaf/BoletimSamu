export function isValidCPF(cpf: string) {
  const clean = cpf.replace(/\D/g, "");

  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  const calcDigit = (base: string, factor: number) => {
    let total = 0;
    for (const n of base) total += Number(n) * factor--;
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(clean.slice(0, 9), 10);
  const d2 = calcDigit(clean.slice(0, 10), 11);

  return (
    d1 === Number(clean[9]) &&
    d2 === Number(clean[10])
  );
}
