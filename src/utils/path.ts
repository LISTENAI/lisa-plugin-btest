import { delimiter } from 'path';

export function alterPathFromEnv(key: string, append: string): Record<string, string> {
  const realKey = Object.keys(process.env).find(k => k.toUpperCase() == key) || key;
  const value = process.env[realKey] || '';
  const segments = value ? value.split(delimiter) : [];
  return { [realKey]: [append, ...segments].join(delimiter) };
}
