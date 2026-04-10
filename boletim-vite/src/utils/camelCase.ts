export function ToCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => ToCamelCase(item));
  } else if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );

      result[camelKey] = ToCamelCase(value);
    }

    return result;
  }

  return obj;
}