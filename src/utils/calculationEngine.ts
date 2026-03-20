/**
 * HESAPLAMA MOTORU — Hayız / İstihâza Hesabı (Alternatif modül)
 *
 * Bu modül, saat bazlı hassas hesaplama sunar.
 * Ana hesaplama için calculation.ts kullanılmaktadır.
 *
 * Temel kaynaklar:
 * - Saadeti Ebediyye (Hakikat Kitabevi)
 * - Hanımlara Rehber (Hasan Yavaş)
 */

import {
  BleedingRecord,
  PreviousMonthData,
  CalculationResult,
  QadaDay,
  QadaPrayer,
  ALL_PRAYERS,
  MadhabPreference,
  DateTimeString,
} from '../types';

// ============================================================
// SABITLER
// ============================================================

/** Hayız asgari süresi: 3 gün = 72 saat */
const HAYZ_MIN_HOURS = 72;

/** Hayız azami süresi (Hanefî): 10 gün = 240 saat */
const HAYZ_MAX_HOURS_HANEFI = 240;

/** Hayız azami süresi (Mâlikî taklidi): 15 gün = 360 saat */
const HAYZ_MAX_HOURS_MALIKI = 360;

/** Temizlik müddeti asgari süresi: 15 gün = 360 saat */
const TUHR_MIN_HOURS = 360;

/** Bir gün = milisaniye */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Bir saat = milisaniye */
const ONE_HOUR_MS = 60 * 60 * 1000;

function getMaxHayzHours(madhab: MadhabPreference): number {
  return madhab === 'maliki_taklid' ? HAYZ_MAX_HOURS_MALIKI : HAYZ_MAX_HOURS_HANEFI;
}

function getMaxHayzDays(madhab: MadhabPreference): number {
  return madhab === 'maliki_taklid' ? 15 : 10;
}

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

function hoursBetween(start: DateTimeString, end: DateTimeString): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff / ONE_HOUR_MS;
}

function daysBetween(start: DateTimeString, end: DateTimeString): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / ONE_DAY_MS);
}

function calculateOverlapDays(
  range1Start: DateTimeString, range1End: DateTimeString,
  range2Start: DateTimeString, range2End: DateTimeString
): number {
  const start1 = new Date(range1Start);
  const end1 = new Date(range1End);
  const start2 = new Date(range2Start);
  const end2 = new Date(range2End);

  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  const days = new Set<string>();
  const current = new Date(overlapStart);
  while (current < overlapEnd) {
    days.add(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  days.add(new Date(overlapEnd).toISOString().split('T')[0]);
  return days.size;
}

function addDays(date: DateTimeString, days: number): DateTimeString {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addHours(date: DateTimeString, hours: number): DateTimeString {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * ONE_HOUR_MS);
  return d.toISOString();
}

function getCalendarDays(start: DateTimeString, end: DateTimeString): string[] {
  const days: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function createQadaPrayers(): QadaPrayer[] {
  return ALL_PRAYERS.map((name) => ({ name, isCompleted: false }));
}

// ============================================================
// ANA HESAPLAMA FONKSİYONU
// ============================================================

export function calculateHayzIstihadhaEngine(
  bleeding: BleedingRecord,
  previousMonth: PreviousMonthData | null,
  madhab: MadhabPreference
): CalculationResult {
  const notes: string[] = [];
  let needsScholarConsultation = false;
  const maxHayzHours = getMaxHayzHours(madhab);
  const maxHayzDays = getMaxHayzDays(madhab);

  const bleedingEnd = bleeding.endDateTime || new Date().toISOString();
  const totalHours = hoursBetween(bleeding.startDateTime, bleedingEnd);
  const totalDays = daysBetween(bleeding.startDateTime, bleedingEnd);

  // DURUM 1: Kanama 3 günden (72 saat) az
  if (totalHours < HAYZ_MIN_HOURS) {
    notes.push(
      `Kanama süresi ${totalDays} gün (${Math.round(totalHours)} saat). ` +
      'Hayız en az 3 gün (72 saat) sürer. Bu kanama istihâza (özür kanı) sayılır.'
    );
    return {
      hayzDays: [],
      istihadhaDays: [{ start: bleeding.startDateTime, end: bleedingEnd }],
      isNewHayzConfirmed: false,
      updatedHayzDuration: null,
      qadaDays: [],
      notes,
      needsScholarConsultation: false,
    };
  }

  // DURUM 2: Kanama azamî süre içinde
  if (totalHours <= maxHayzHours) {
    notes.push(`Kanama süresi ${totalDays} gün. Tamamı hayız sayılır.`);

    if (madhab === 'maliki_taklid' && totalHours > HAYZ_MAX_HOURS_HANEFI) {
      notes.push(
        'Mâlikî mezhebini taklit ettiğiniz için 10 günü aşan kanama da hayız kabul edilmektedir. ' +
        'Taklit şartlarına dikkat ediniz; kitaptan okuyunuz ya da bir bilene sorunuz.'
      );
    }

    return {
      hayzDays: [{ start: bleeding.startDateTime, end: bleedingEnd }],
      istihadhaDays: [],
      isNewHayzConfirmed: true,
      updatedHayzDuration: totalDays,
      qadaDays: [],
      notes,
      needsScholarConsultation: false,
    };
  }

  // DURUM 3: Kanama azamî süreyi aşıyor → hayız müddetine bakılır
  notes.push(
    `Kanama süresi ${totalDays} gün olup ${maxHayzDays} günü aşmıştır. ` +
    'Hayız müddetine göre hesaplama yapılır.'
  );

  if (!previousMonth) {
    notes.push('Önceki ay verisi bulunamadı. Mübtedia olarak değerlendirilmektedir.');
    notes.push('Bu konuda kitaptan okuyunuz ya da bir bilene sorunuz.');
    needsScholarConsultation = true;

    const hayzEnd = addHours(bleeding.startDateTime, maxHayzHours);
    const qadaCalendarDays = getCalendarDays(hayzEnd, bleedingEnd);
    const qadaDays: QadaDay[] = qadaCalendarDays.map((date) => ({
      date, prayers: createQadaPrayers(),
    }));

    if (qadaDays.length > 0) {
      notes.push(`${qadaDays.length} günlük istihâza tespit edildi. Bu günlerde kılınamayan namazlar kaza edilecektir.`);
    }

    return {
      hayzDays: [{ start: bleeding.startDateTime, end: hayzEnd }],
      istihadhaDays: [{ start: hayzEnd, end: bleedingEnd }],
      isNewHayzConfirmed: false,
      updatedHayzDuration: maxHayzDays,
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }

  const hayzDuration = previousMonth.hayzDuration;

  const overlapDays = calculateOverlapDays(
    bleeding.startDateTime, bleedingEnd,
    previousMonth.hayzStart, previousMonth.hayzEnd
  );

  if (overlapDays >= 3) {
    notes.push(
      `Önceki hayız ile ${overlapDays} gün örtüşme tespit edildi (>= 3 gün). Yeni hayız geçerlidir.`
    );

    const newHayzHours = Math.min(totalHours, maxHayzHours);
    const newHayzEnd = addHours(bleeding.startDateTime, newHayzHours);

    const istihadhaDays = totalHours > maxHayzHours
      ? [{ start: newHayzEnd, end: bleedingEnd }]
      : [];

    const qadaDays: QadaDay[] = [];
    if (istihadhaDays.length > 0) {
      const qadaCalendarDays = getCalendarDays(newHayzEnd, bleedingEnd);
      qadaCalendarDays.forEach((date) => {
        qadaDays.push({ date, prayers: createQadaPrayers() });
      });
      notes.push(
        `${maxHayzDays}. günden itibaren ${qadaDays.length} gün istihâza sayılır. Bu günlerdeki namazlar kaza edilecektir.`
      );
    }

    return {
      hayzDays: [{ start: bleeding.startDateTime, end: newHayzEnd }],
      istihadhaDays,
      isNewHayzConfirmed: true,
      updatedHayzDuration: Math.min(Math.ceil(newHayzHours / 24), maxHayzDays),
      qadaDays,
      notes,
      needsScholarConsultation: false,
    };
  } else {
    notes.push(
      `Önceki hayız ile ${overlapDays} gün örtüşme tespit edildi (< 3 gün). ` +
      `Önceki hayız müddeti (${hayzDuration} gün) esas alınır.`
    );

    const hayzEnd = addDays(bleeding.startDateTime, hayzDuration);
    const qadaCalendarDays = getCalendarDays(hayzEnd, bleedingEnd);
    const qadaDays: QadaDay[] = qadaCalendarDays.map((date) => ({
      date, prayers: createQadaPrayers(),
    }));

    notes.push(
      `${hayzDuration}. günden itibaren ${qadaDays.length} gün istihâza sayılır. Bu günlerdeki namazlar kaza edilecektir.`
    );

    if (madhab === 'maliki_taklid') {
      notes.push(
        'Mâlikî mezhebini taklit etme durumunda farklı hükümler geçerli olabilir. ' +
        'Bu konuda kitaptan okuyunuz ya da bir bilene sorunuz.'
      );
      needsScholarConsultation = true;
    }

    return {
      hayzDays: [{ start: bleeding.startDateTime, end: hayzEnd }],
      istihadhaDays: [{ start: hayzEnd, end: bleedingEnd }],
      isNewHayzConfirmed: false,
      updatedHayzDuration: null,
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }
}

/**
 * Temizlik müddeti kontrolü.
 * İki hayız arasında en az 15 gün temizlik olmalıdır.
 */
export function validateTuhr(
  previousHayzEnd: DateTimeString,
  currentHayzStart: DateTimeString
): { isValid: boolean; hours: number; message: string } {
  const hours = hoursBetween(previousHayzEnd, currentHayzStart);
  const days = Math.floor(hours / 24);

  if (hours >= TUHR_MIN_HOURS) {
    return {
      isValid: true,
      hours,
      message: `Temizlik müddeti ${days} gün. Geçerli temizlik müddeti (>= 15 gün).`,
    };
  }

  return {
    isValid: false,
    hours,
    message:
      `Temizlik müddeti ${days} gün. İki hayız arasında en az 15 gün (360 saat) ` +
      'temizlik müddeti olmalıdır. Bu konuda kitaptan okuyunuz ya da bir bilene sorunuz.',
  };
}
