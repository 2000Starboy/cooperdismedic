// ============================================================================
// sanitize.ts — Input sanitization utilities (OWASP-aligned)
// ============================================================================
// All user-supplied strings pass through here before being sent to Web3Forms.
// Since this is a pure-frontend app (no server-side rendering), the primary
// risk vector is XSS via reflected/stored form data. We strip HTML tags,
// control characters, and encode dangerous sequences.
// ============================================================================

/** Strip HTML tags and dangerous characters from a string */
export function sanitizeText(raw: string): string {
  return raw
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like sequences
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove null bytes and control chars (except \n \r \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim
    .trim();
}

/** Validate email format (RFC-5321 simplified) */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    email
  );
}

/** Validate phone — allow +, spaces, digits, dashes, parens */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // optional field
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

/** Hard length limits to prevent payload attacks */
export const LIMITS = {
  name: 100,
  email: 254,
  phone: 20,
  company: 150,
  service: 80,
  message: 3000,
} as const;

/** Sanitize and truncate a field value */
export function sanitizeField(value: string, field: keyof typeof LIMITS): string {
  return sanitizeText(value).slice(0, LIMITS[field]);
}

/** Sanitize an entire form-shaped object whose values are strings */
export function sanitizeForm(form: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(form)) {
    const limit = (LIMITS as Record<string, number>)[key] ?? 500;
    result[key] = sanitizeText(form[key]).slice(0, limit);
  }
  return result;
}
