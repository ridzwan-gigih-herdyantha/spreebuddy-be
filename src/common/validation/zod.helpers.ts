import { z } from 'zod';

// String that must be present and non-empty, with a uniform "required" message.
export const requiredString = (label: string) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`);

// Multipart sends everything as strings; parse a JSON string back into an object.
export const tryParseJson = (v: unknown) => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};
