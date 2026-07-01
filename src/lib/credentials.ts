export function generateSchoolEmail(fullName: string) {
  const parts = fullName
    .replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, "")
    .trim()
    .toLowerCase()
    .split(/\s+/);
  const first = parts[0] ?? "user";
  const last  = parts[parts.length - 1] ?? "school";
  return `${first}.${last}@sdmodelkarnal.edu`;
}

// Cryptographically secure password using Web Crypto API (available in all modern browsers)
export function generatePassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
