/**
 * Secure client-side credential hashing utilities.
 * Uses the Web Crypto API (SHA-256) so user passwords and security answers
 * are never stored in plain text in localStorage.
 */

export async function hashString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyHash(value: string, hash: string): Promise<boolean> {
  const computed = await hashString(value);
  return computed === hash;
}
