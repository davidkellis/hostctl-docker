import { z } from 'hostctl';

export const BooleanishSchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const NumberishSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return value;
}, z.number());

export const StringArraySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return value;
}, z.array(z.string()));
