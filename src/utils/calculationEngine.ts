/**
 * HESAPLAMA MOTORU — Hayız / İstihâza Hesabı
 *
 * Bu modül, Hanefî fıkhına göre hayız ve istihâza hesaplamasını yapar.
 * Mâlikî taklidi seçeneği de desteklenmektedir.
 *
 * Temel kaynaklar:
 * - Saadeti Ebediyye (Hakikat Kitabevi)
 * - Hanımlara Rehber (Hasan Yavaş)
 *
 * TEMEL KURALLAR:
 * 1. Hayız asgari süresi: 3 gün (72 saat)
 * 2. Hayız azami süresi: 10 gün (240 saat)
 * 3. Tuhur (temizlik) asgari süresi: 15 gün
 * 4. Kanama 10 günü aşarsa → âdet-i mu'tâde'ye (alışılmış süreye) bakılır
 * 5. Önceki hayız ile 3+ gün örtüşme varsa → yeni hayız geçerli
 * 6. 3 günden az örtüşme varsa → önceki âdete dönülür
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

/** Hayız azami süresi: 10 gün = 240 saat */
const HAYZ_MAX_HOURS = 240;

/** Tuhur (temizlik) asgari süresi: 15 gün = 360 saat */
const TUHR_MIN_HOURS = 360;

/** Bir gün = milisaniye */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Bir saat = milisaniye */
const ONE_HOUR_MS = 60 * 60 * 1000;

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

/** İki tarih arasındaki farkı saat olarak hesaplar */
function hoursBetween(start: DateTimeString, end: DateTimeString): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff / ONE_HOUR_MS;
}

/** İki tarih arasındaki farkı gün olarak hesaplar (yukarı yuvarlama) */
function daysBetween(start: DateTimeString, end: DateTimeString): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / ONE_DAY_MS);
}

/**
 * İki tarih aralığının örtüşen gün sayısını hesaplar.
 * Örtüşme, günlerin takvim günü bazında karşılaştırılmasıyla belirlenir.
 */
function calculateOverlapDays(
  range1Start: DateTimeString,
  range1End: DateTimeString,
  range2Start: DateTimeString,
  range2End: DateTimeString
): number {
  const start1 = new Date(range1Start);
  const end1 = new Date(range1End);
  const start2 = new Date(range2Start);
  const end2 = new Date(range2End);

  // Örtüşme aralığını bul
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart >= overlapEnd) {
    return 0;
  }

  // Takvim günü bazında örtüşen günleri say
  const days = new Set<string>();
  const current = new Date(overlapStart);
  while (current < overlapEnd) {
    days.add(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  // Son günü de ekle (eğer tam saat değilse)
  days.add(new Date(overlapEnd).toISOString().split('T')[0]);

  return days.size;
}

/** Belirli bir tarihten itibaren N gün ekler */
function addDays(date: DateTimeString, days: number): DateTimeString {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Belirli bir tarihten itibaren N saat ekler */
function addHours(date: DateTimeString, hours: number): DateTimeString {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * ONE_HOUR_MS);
  return d.toISOString();
}

/** Tarih aralığındaki takvim günlerini listeler (YYYY-MM-DD) */
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

/** Kaza namazlarını oluşturur */
function createQadaPrayers(): QadaPrayer[] {
  return ALL_PRAYERS.map((name) => ({
    name,
    isCompleted: false,
  }));
}

// ============================================================
// ANA HESAPLAMA FONKSİYONU
// ============================================================

/**
 * Ana hesaplama fonksiyonu.
 *
 * Bu fonksiyon, verilen kanama kaydı ve önceki ay verisine göre
 * hayız/istihâza hesaplamasını gerçekleştirir.
 *
 * @param bleeding - Mevcut kanama kaydı
 * @param previousMonth - Önceki ay verisi (varsa)
 * @param madhab - Mezhep tercihi
 * @returns CalculationResult - Hesaplama sonucu
 */
export function calculateHayzIstihadha(
  bleeding: BleedingRecord,
  previousMonth: PreviousMonthData | null,
  madhab: MadhabPreference
): CalculationResult {
  const notes: string[] = [];
  let needsScholarConsultation = false;

  // Kanama bitiş tarihi (devam ediyorsa bugünü al)
  const bleedingEnd = bleeding.endDateTime || new Date().toISOString();
  const totalHours = hoursBetween(bleeding.startDateTime, bleedingEnd);
  const totalDays = daysBetween(bleeding.startDateTime, bleedingEnd);

  // ============================================================
  // DURUM 1: Kanama 3 günden (72 saat) az
  // ============================================================
  if (totalHours < HAYZ_MIN_HOURS) {
    notes.push(
      `Kanama süresi ${totalDays} gün (${Math.round(totalHours)} saat). ` +
        'Hayız en az 3 gün (72 saat) sürer. Bu kanama istihâza (özür kanı) sayılır.'
    );

    return {
      hayzDays: [],
      istihadhaDays: [{ start: bleeding.startDateTime, end: bleedingEnd }],
      isNewHayzConfirmed: false,
      updatedMutad: null,
      qadaDays: [], // İstihâzada namaz kılınır, kaza gerekmez
      notes,
      needsScholarConsultation: false,
    };
  }

  // ============================================================
  // DURUM 2: Kanama 3-10 gün arası (72-240 saat)
  // → Tamamı hayız
  // ============================================================
  if (totalHours <= HAYZ_MAX_HOURS) {
    notes.push(
      `Kanama süresi ${totalDays} gün. Tamamı hayız sayılır.`
    );

    const hayzDays = [{ start: bleeding.startDateTime, end: bleedingEnd }];
    const calendarDays = getCalendarDays(bleeding.startDateTime, bleedingEnd);
    const qadaDays: QadaDay[] = []; // Hayızda namaz kılınmaz, kaza da edilmez

    return {
      hayzDays,
      istihadhaDays: [],
      isNewHayzConfirmed: true,
      updatedMutad: totalDays,
      qadaDays,
      notes,
      needsScholarConsultation: false,
    };
  }

  // ============================================================
  // DURUM 3: Kanama 10 günü (240 saat) aşıyor
  // → Âdet-i mu'tâde'ye bakılır
  // ============================================================
  notes.push(
    `Kanama süresi ${totalDays} gün olup 10 günü aşmıştır. ` +
      'Âdet-i mu\'tâde (alışılmış hayız süresi) esas alınarak hesaplama yapılır.'
  );

  // Önceki ay verisi yoksa
  if (!previousMonth) {
    notes.push(
      'Önceki ay verisi bulunamadı. Lütfen önceki ay bilgilerinizi giriniz.'
    );
    notes.push('Bu konuda bir âlime danışmanız tavsiye edilir.');
    needsScholarConsultation = true;

    // Varsayılan olarak 10 gün hayız kabul et
    const hayzEnd = addHours(bleeding.startDateTime, HAYZ_MAX_HOURS);
    const hayzDays = [{ start: bleeding.startDateTime, end: hayzEnd }];
    const istihadhaDays = [{ start: hayzEnd, end: bleedingEnd }];

    // Kaza günlerini hesapla: hayız bitişinden kanama sonuna kadar
    const qadaCalendarDays = getCalendarDays(hayzEnd, bleedingEnd);
    const qadaDays: QadaDay[] = qadaCalendarDays.map((date) => ({
      date,
      prayers: createQadaPrayers(),
    }));

    if (qadaDays.length > 0) {
      notes.push(
        `${qadaDays.length} günlük istihâza tespit edildi. ` +
          'Bu günlerde kılınamayan namazlar kaza edilecektir.'
      );
    }

    return {
      hayzDays,
      istihadhaDays,
      isNewHayzConfirmed: false,
      updatedMutad: null,
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }

  // ============================================================
  // Önceki hayız ile örtüşme kontrolü
  // ============================================================
  const mutadDays = previousMonth.mutadDays;
  const mutadEnd = addDays(bleeding.startDateTime, mutadDays);

  // Önceki hayız dönemiyle örtüşen günleri hesapla
  const overlapDays = calculateOverlapDays(
    bleeding.startDateTime,
    bleedingEnd,
    previousMonth.hayzStart,
    previousMonth.hayzEnd
  );

  if (overlapDays >= 3) {
    // ============================================================
    // 3+ gün örtüşme var → Yeni hayız geçerli
    // ============================================================
    notes.push(
      `Önceki hayız ile ${overlapDays} gün örtüşme tespit edildi (≥ 3 gün). ` +
        'Yeni hayız geçerlidir.'
    );

    // Yeni hayız süresi en fazla 10 gün olabilir
    const newHayzHours = Math.min(totalHours, HAYZ_MAX_HOURS);
    const newHayzEnd = addHours(bleeding.startDateTime, newHayzHours);
    const hayzDays = [{ start: bleeding.startDateTime, end: newHayzEnd }];

    const istihadhaDays =
      totalHours > HAYZ_MAX_HOURS
        ? [{ start: newHayzEnd, end: bleedingEnd }]
        : [];

    // Kaza günleri: istihâza günlerinde kılınamayan namazlar
    const qadaDays: QadaDay[] = [];
    if (istihadhaDays.length > 0) {
      const qadaCalendarDays = getCalendarDays(newHayzEnd, bleedingEnd);
      qadaCalendarDays.forEach((date) => {
        qadaDays.push({ date, prayers: createQadaPrayers() });
      });

      notes.push(
        `10. günden itibaren ${qadaDays.length} gün istihâza sayılır. ` +
          'Bu günlerdeki namazlar kaza edilecektir.'
      );
    }

    const newMutadDays = Math.min(Math.ceil(newHayzHours / 24), 10);

    return {
      hayzDays,
      istihadhaDays,
      isNewHayzConfirmed: true,
      updatedMutad: newMutadDays,
      qadaDays,
      notes,
      needsScholarConsultation: false,
    };
  } else {
    // ============================================================
    // Örtüşme < 3 gün → Önceki mu'tâde'ye dönülür
    // ============================================================
    notes.push(
      `Önceki hayız ile ${overlapDays} gün örtüşme tespit edildi (< 3 gün). ` +
        `Önceki âdet süresi (${mutadDays} gün) esas alınır.`
    );

    const hayzEnd = addDays(bleeding.startDateTime, mutadDays);
    const hayzDays = [{ start: bleeding.startDateTime, end: hayzEnd }];
    const istihadhaDays = [{ start: hayzEnd, end: bleedingEnd }];

    // Kaza günleri
    const qadaCalendarDays = getCalendarDays(hayzEnd, bleedingEnd);
    const qadaDays: QadaDay[] = qadaCalendarDays.map((date) => ({
      date,
      prayers: createQadaPrayers(),
    }));

    notes.push(
      `${mutadDays}. günden itibaren ${qadaDays.length} gün istihâza sayılır. ` +
        'Bu günlerdeki namazlar kaza edilecektir.'
    );

    // Mâlikî taklidi durumunda ek kontroller
    if (madhab === 'maliki_taklid') {
      notes.push(
        'Mâlikî mezhebini taklit eden Hanefî hesabı uygulanmaktadır. ' +
          'Bu konuda bir âlime danışmanız tavsiye edilir.'
      );
      needsScholarConsultation = true;
    }

    return {
      hayzDays,
      istihadhaDays,
      isNewHayzConfirmed: false,
      updatedMutad: null,
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }
}

/**
 * Tuhur (temizlik süresi) kontrolü.
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
      message: `Temizlik süresi ${days} gün. Geçerli tuhur süresi (≥ 15 gün).`,
    };
  }

  return {
    isValid: false,
    hours,
    message:
      `Temizlik süresi ${days} gün. İki hayız arasında en az 15 gün (360 saat) ` +
      'temizlik olmalıdır. Bu konuda bir âlime danışmanız tavsiye edilir.',
  };
}
