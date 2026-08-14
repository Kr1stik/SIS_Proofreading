/**
 * Utility function to combine CSS class names.
 */
export function cn(...classes: (string | undefined | null | false | Record<string, boolean> | (string | undefined | null | false)[] )[]): string {
  const result: string[] = [];

  for (const item of classes) {
    if (!item) continue;

    if (typeof item === 'string') {
      result.push(item);
    } else if (Array.isArray(item)) {
      const nested = cn(...item);
      if (nested) result.push(nested);
    } else if (typeof item === 'object') {
      for (const [key, val] of Object.entries(item)) {
        if (Boolean(val)) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}
