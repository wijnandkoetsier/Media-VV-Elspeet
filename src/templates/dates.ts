const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Eerstvolgende zaterdag (of vandaag als het zaterdag is), als YYYY-MM-DD. */
export function nextSaturday(offsetWeeks = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7) + offsetWeeks * 7);
  return iso(d);
}

export function lastSaturday(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  return iso(d);
}

export function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}
