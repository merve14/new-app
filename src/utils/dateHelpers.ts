/**
 * Tarih formatlama yardımcıları
 */

const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TURKISH_DAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  return `${TURKISH_MONTHS[parseInt(month) - 1]} ${year}`;
}

export function getDayName(dateStr: string): string {
  return TURKISH_DAYS[new Date(dateStr).getDay()];
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function toLocalDateTimeString(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}
