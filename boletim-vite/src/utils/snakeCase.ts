

export function ToSnakeCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => ToSnakeCase(item));
  } else if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      result[snakeKey] = ToSnakeCase(value);
    }
    return result;
  }
  return obj;
}
