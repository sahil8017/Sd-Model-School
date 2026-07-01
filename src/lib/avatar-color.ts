// Hash a name to one of 6 palette-aligned avatar colors so 100+ rosters
// don't read as a wall of identical navy circles.
const PALETTE = [
  "bg-brand text-brand-foreground",
  "bg-crimson text-crimson-foreground",
  "bg-success text-success-foreground",
  "bg-warning text-warning-foreground",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white",
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function initials(name: string): string {
  return name
    .replace(/^(Mrs?|Ms|Mr|Dr|Sh|Smt)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
