export const TIME_ZONE = 'Europe/Berlin';
export function berlinDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function shiftDay(day, amount) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function validDay(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day || '') && !Number.isNaN(Date.parse(day)) && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
}
export function yearDays(year) {
  const days = [];
  for (let day = `${year}-01-01`; day.startsWith(`${year}-`); day = shiftDay(day, 1)) days.push(day);
  return days;
}
export function stats(completed, year, today = berlinDay()) {
  const days = yearDays(year).filter(day => day <= today);
  const done = new Set(completed);
  let longest = 0, run = 0;
  for (const day of days) { run = done.has(day) ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0;
  let cursor = done.has(today) ? today : shiftDay(today, -1);
  while (done.has(cursor)) { current++; cursor = shiftDay(cursor, -1); }
  const count = days.filter(day => done.has(day)).length;
  return { count, longest, current, average: days.length ? Math.round(count / days.length * 100) : 0 };
}
