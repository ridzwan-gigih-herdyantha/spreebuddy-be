export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// e.g. "Lemari Kayu" -> "lemari-kayu-1708459324382-932647"
// slug base + current timestamp + 6 random digits (unique per create/edit).
export function generateSlug(name: string): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${slugify(name)}-${Date.now()}-${random}`;
}
