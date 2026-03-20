/**
 * HAYIZ / İSTİHÂZA HESAPLAMA MOTORU
 *
 * Kaynak: Saadeti Ebediyye (Hakikat Kitabevi), Hanımlara Rehber (Hasan Yavaş)
 *
 * TEMEL KURALLAR (Hanefi Mezhebi):
 * ─────────────────────────────────
 * 1. Hayız en az 3 gün (72 saat), en çok 10 gün (240 saat) sürer.
 * 2. Temizlik (tuhr) en az 15 gündür.
 * 3. Kanama 10 günü aşarsa → âdet-i mu'tâde'ye (alışılmış süreye) bakılır.
 * 4. Yeni kanamanın önceki hayızla 3+ gün örtüşmesi varsa → yeni hayız geçerlidir.
 * 5. Örtüşme 3 günden azsa → önceki âdete dönülür; fazla günler istihâzadır.
 *
 * NOT: Bu modül yalnızca bilgi amaçlıdır.
 * Şüphe durumlarında mutlaka bir âlime danışınız.
 */

import {
  CalculationResult,
  BleedingRecord,
  PreviousMonthData,
  QadaDay,
  ALL_PRAYERS,
  MadhabPreference,
} from '../types';

// ─── Yardımcı fonksiyonlar ───

/** İki tarih arasındaki gün farkını hesaplar (kesirli) */
function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

/** Bir tarihe gün ekler */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Tarih string'ini Date'e çevirir */
function toDate(dateStr: string): Date {
  return new Date(dateStr);
}

/** Date'i ISO string'e çevirir */
function toISOStr(date: Date): string {
  return date.toISOString();
}

/** İki tarih aralığının örtüşen gün sayısını hesaplar */
function overlapDays(
  start1: Date, end1: Date,
  start2: Date, end2: Date
): number {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
  if (overlapEnd <= overlapStart) return 0;
  return daysBetween(overlapStart, overlapEnd);
}

/** Belirli bir tarih aralığındaki günlerin listesini oluşturur (YYYY-MM-DD) */
function getDateList(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Kaza günleri oluşturur (her gün için 6 namaz) */
function createQadaDays(dates: string[]): QadaDay[] {
  return dates.map(date => ({
    date,
    prayers: ALL_PRAYERS.map(name => ({ name, isCompleted: false })),
  }));
}

// ─── Ana Hesaplama Fonksiyonu ───

/**
 * Hayız / İstihâza hesaplamasını gerçekleştirir.
 *
 * @param currentBleeding - Bu ayki kanama kaydı
 * @param previousMonth  - Önceki ay verileri
 * @param madhab         - Mezhep tercihi
 * @returns Hesaplama sonucu
 */
export function calculateHayzIstihadha(
  currentBleeding: BleedingRecord,
  previousMonth: PreviousMonthData | null,
  madhab: MadhabPreference
): CalculationResult {
  const notes: string[] = [];
  let needsScholarConsultation = false;

  const bleedStart = toDate(currentBleeding.startDateTime);
  const bleedEnd = currentBleeding.endDateTime
    ? toDate(currentBleeding.endDateTime)
    : new Date(); // Devam ediyorsa şu anki zamana kadar hesapla

  const totalBleedingDays = daysBetween(bleedStart, bleedEnd);

  // ═══════════════════════════════════════
  // KURAL 1: Kanama 3 günden az mı?
  // ═══════════════════════════════════════
  if (totalBleedingDays < 3) {
    notes.push('Kanama süresi 3 günden (72 saatten) azdır. Bu kanama hayız sayılmaz, istihâzadır.');
    return {
      hayzDays: [],
      istihadhaDays: [{ start: toISOStr(bleedStart), end: toISOStr(bleedEnd) }],
      isNewHayzConfirmed: false,
      updatedMutad: null,
      qadaDays: [],
      notes,
      needsScholarConsultation: false,
    };
  }

  // ═══════════════════════════════════════
  // KURAL 2: Kanama 10 gün veya altında mı?
  // → Tamamı hayızdır.
  // ═══════════════════════════════════════
  if (totalBleedingDays <= 10) {
    const hayzDates = getDateList(bleedStart, bleedEnd);
    notes.push(`Kanama ${totalBleedingDays.toFixed(1)} gün sürmüştür. 10 günü aşmadığı için tamamı hayızdır.`);

    // İstihâza günlerini hesapla (hayız bitişinden sonraki günlerde kaza yapılacak)
    // Hayız süresince namaz kılınmaz, kaza da edilmez
    return {
      hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(bleedEnd) }],
      istihadhaDays: [],
      isNewHayzConfirmed: true,
      updatedMutad: Math.round(totalBleedingDays),
      qadaDays: [], // Hayız günlerinde namaz düşer, kaza gerekmez
      notes,
      needsScholarConsultation: false,
    };
  }

  // ═══════════════════════════════════════
  // KURAL 3: Kanama 10 günü aştı
  // → Âdet-i mu'tâde'ye bakılır.
  // ═══════════════════════════════════════
  notes.push(`Kanama ${totalBleedingDays.toFixed(1)} gün sürmüş olup 10 günü aşmıştır. Âdet-i mu'tâde'ye göre hesaplama yapılacaktır.`);

  if (!previousMonth) {
    // Önceki ay verisi yoksa, varsayılan olarak belirsiz durum
    notes.push('Önceki ay verisi girilmediği için kesin hesaplama yapılamamaktadır.');
    notes.push('Bu konuda bir âlime danışmanız tavsiye edilir.');
    needsScholarConsultation = true;

    // En güvenli yol: İlk 10 günü hayız, kalanını istihâza say
    const hayzEnd10 = addDays(bleedStart, 10);
    const istihadhaStart = hayzEnd10;
    const hayzDates = getDateList(bleedStart, hayzEnd10);

    // İstihâza günlerinde namaz kılınmalıdır; kılınmadıysa kaza gerekir
    const istihadhaDates = getDateList(istihadhaStart, bleedEnd);
    const qadaDays = createQadaDays(istihadhaDates);

    return {
      hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(hayzEnd10) }],
      istihadhaDays: [{ start: toISOStr(istihadhaStart), end: toISOStr(bleedEnd) }],
      isNewHayzConfirmed: false,
      updatedMutad: null,
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }

  const mutadDays = previousMonth.mutadDays;
  const prevHayzStart = toDate(previousMonth.hayzStart);
  const prevHayzEnd = toDate(previousMonth.hayzEnd);

  // ═══════════════════════════════════════
  // KURAL 3a: Önceki hayızla örtüşme kontrolü
  // "Yeni kanamanın başlangıcından itibaren, önceki hayız
  //  günleriyle 3+ gün örtüşüyorsa yeni hayız geçerlidir."
  // ═══════════════════════════════════════

  // Önceki hayızın ayın hangi günlerinde olduğunu belirle
  // ve yeni kanamayla karşılaştır (gün-of-month bazında)
  const overlap = calculateCyclicOverlap(bleedStart, bleedEnd, prevHayzStart, prevHayzEnd);

  if (overlap >= 3) {
    // ─── Yeni hayız geçerlidir ───
    notes.push(
      `Önceki hayız günleriyle ${overlap.toFixed(1)} gün örtüşme tespit edilmiştir (≥ 3 gün). ` +
      `Yeni hayız geçerlidir.`
    );

    // Hayız = mu'tâd kadar gün, kalan = istihâza
    const hayzEndDate = addDays(bleedStart, mutadDays);
    const istihadhaStart = hayzEndDate;

    const istihadhaDates = getDateList(istihadhaStart, bleedEnd);
    const qadaDays = createQadaDays(istihadhaDates);

    if (istihadhaDates.length > 0) {
      notes.push(
        `İlk ${mutadDays} gün hayız, geri kalan ${istihadhaDates.length} gün istihâzadır. ` +
        `İstihâza günlerinde kılınmayan namazlar kaza edilecektir.`
      );
    }

    // Mâlikî taklidi durumunda ek not
    if (madhab === 'maliki_taklid') {
      notes.push(
        'Mâlikî mezhebini taklit eden Hanefî hesabına göre işlem yapılmıştır. ' +
        'Mâlikî mezhebinde hayızın azamî süresi 15 gündür. ' +
        'Ancak taklit şartlarına dikkat edilmelidir.'
      );

      // Mâlikî'de azamî 15 gün; eğer kanama 10-15 gün arasındaysa
      // ve taklit ediliyorsa tamamı hayız olabilir
      if (totalBleedingDays <= 15) {
        notes.push(
          'Mâlikî mezhebine göre bu kanama süresi (≤ 15 gün) tamamen hayız sayılabilir. ' +
          'Ancak taklit şartlarını bir âlimle değerlendirmeniz tavsiye edilir.'
        );
        needsScholarConsultation = true;
      }
    }

    return {
      hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(hayzEndDate) }],
      istihadhaDays: istihadhaDates.length > 0
        ? [{ start: toISOStr(istihadhaStart), end: toISOStr(bleedEnd) }]
        : [],
      isNewHayzConfirmed: true,
      updatedMutad: mutadDays, // Mu'tâd güncellenmez, aynı kalır
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }

  // ═══════════════════════════════════════
  // KURAL 3b: Örtüşme 3 günden az
  // → Önceki âdete (mu'tâd) dönülür.
  // → Mu'tâd kadar gün hayız, kalan istihâza.
  // ═══════════════════════════════════════
  notes.push(
    `Önceki hayız günleriyle örtüşme ${overlap.toFixed(1)} gün olup 3 günden azdır. ` +
    `Önceki âdet-i mu'tâde'ye (${mutadDays} gün) dönülür.`
  );

  const hayzEndByMutad = addDays(bleedStart, mutadDays);
  const istihadhaStartByMutad = hayzEndByMutad;

  const istihadhaDates = getDateList(istihadhaStartByMutad, bleedEnd);
  const qadaDays = createQadaDays(istihadhaDates);

  notes.push(
    `İlk ${mutadDays} gün hayız sayılır, ${istihadhaDates.length} gün istihâza sayılır. ` +
    `İstihâza günlerinde kılınmayan namazlar kaza edilecektir.`
  );

  if (madhab === 'maliki_taklid') {
    notes.push(
      'Mâlikî mezhebini taklit etme durumunda farklı hükümler geçerli olabilir. ' +
      'Bu konuda bir âlime danışmanız tavsiye edilir.'
    );
    needsScholarConsultation = true;
  }

  return {
    hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(hayzEndByMutad) }],
    istihadhaDays: [{ start: toISOStr(istihadhaStartByMutad), end: toISOStr(bleedEnd) }],
    isNewHayzConfirmed: false,
    updatedMutad: null,
    qadaDays,
    notes,
    needsScholarConsultation,
  };
}

/**
 * İki kanama döneminin döngüsel örtüşmesini hesaplar.
 *
 * Önceki hayızın ay içindeki konumunu (gün numaraları) alır ve
 * yeni kanamanın aynı pozisyondaki günleriyle karşılaştırır.
 *
 * Basitleştirilmiş yaklaşım: Her iki dönemin başlangıç günü
 * farkını hesaplayarak örtüşme gün sayısını bulur.
 */
function calculateCyclicOverlap(
  newStart: Date,
  newEnd: Date,
  prevStart: Date,
  prevEnd: Date
): number {
  // Önceki hayızın gün aralığını hesapla
  const prevDuration = daysBetween(prevStart, prevEnd);

  // Yeni kanamanın başlangıcından itibaren, önceki hayız
  // günlerinin ay içindeki pozisyonuyla karşılaştır.
  // Basitleştirilmiş: prevStart'ın ay-içi gün pozisyonunu al,
  // newStart'ın ay-içi gün pozisyonunu al, farkı hesapla.
  const prevDayOfMonth = prevStart.getDate();
  const newDayOfMonth = newStart.getDate();

  // Önceki hayızın gün aralığı (ay-içi gün numaraları)
  const prevDays: number[] = [];
  for (let i = 0; i < prevDuration; i++) {
    prevDays.push(prevDayOfMonth + i);
  }

  // Yeni kanamanın gün aralığı
  const newDuration = Math.min(daysBetween(newStart, newEnd), 31);
  const newDays: number[] = [];
  for (let i = 0; i < newDuration; i++) {
    newDays.push(newDayOfMonth + i);
  }

  // Örtüşen günleri say
  const overlap = prevDays.filter(d => newDays.includes(d)).length;
  return overlap;
}
