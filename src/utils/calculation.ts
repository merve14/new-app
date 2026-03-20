/**
 * HAYIZ / İSTİHÂZA HESAPLAMA MOTORU
 *
 * Kaynak: Saadeti Ebediyye (Hakikat Kitabevi), Hanımlara Rehber (Hasan Yavaş)
 *
 * TEMEL KURALLAR (Hanefi Mezhebi):
 * ─────────────────────────────────
 * 1. Hayız en az 3 gün (72 saat), en çok 10 gün (240 saat) sürer.
 * 2. Temizlik müddeti en az 15 gündür.
 * 3. Kanama 10 günü aşarsa → hayız müddetine bakılır.
 * 4. Yeni kanamanın önceki hayızla 3+ gün örtüşmesi varsa → yeni hayız geçerlidir.
 * 5. Örtüşme 3 günden azsa → önceki hayız müddetine dönülür; fazla günler istihâzadır.
 * 6. İki hayız arasında en az 15 gün temizlik müddeti olmalıdır.
 * 7. Fasılalı kanama (ara verip devam eden kanama) 10 gün içinde değerlendirilir.
 *
 * MÂLİKÎ TAKLİDİ:
 * ─────────────────
 * 8. Mâlikî mezhebinde hayızın azamî süresi 15 gündür.
 *    Mâlikî'yi taklit eden Hanefî kadınlar için kanama 15 güne kadar
 *    tamamen hayız sayılabilir.
 *
 * NOT: Bu modül yalnızca bilgi amaçlıdır.
 * Şüphe durumlarında kitaptan okuyunuz ya da bir bilene sorunuz.
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

/** Mezhebe göre azamî hayız süresini döndürür */
function getMaxHayzDays(madhab: MadhabPreference): number {
  return madhab === 'maliki_taklid' ? 15 : 10;
}

// ─── Ana Hesaplama Fonksiyonu ───

/**
 * Hayız / İstihâza hesaplamasını gerçekleştirir.
 *
 * @param currentBleeding - Bu ayki kanama kaydı (fasılalı kanamalar dahil)
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
  const maxHayzDays = getMaxHayzDays(madhab);

  const bleedStart = toDate(currentBleeding.startDateTime);
  const bleedEnd = currentBleeding.endDateTime
    ? toDate(currentBleeding.endDateTime)
    : new Date(); // Devam ediyorsa şu anki zamana kadar hesapla

  // ═══════════════════════════════════════
  // KURAL 6: Temizlik müddeti kontrolü (en az 15 gün)
  // ═══════════════════════════════════════
  if (previousMonth) {
    const prevHayzEnd = toDate(previousMonth.hayzEnd);
    const tuhrDays = daysBetween(prevHayzEnd, bleedStart);

    if (tuhrDays < 15) {
      notes.push(
        `Önceki hayız bitişi ile bu kanamanın başlangıcı arasında ${tuhrDays.toFixed(1)} gün var. ` +
        `İki hayız arasında en az 15 gün temizlik müddeti olmalıdır. ` +
        `Bu kanama ayrı bir hayız olarak değerlendirilemez.`
      );

      // Önceki hayızla birleştir ve toplam süreyi kontrol et
      const prevHayzStart = toDate(previousMonth.hayzStart);
      const combinedDays = daysBetween(prevHayzStart, bleedEnd);

      if (combinedDays <= maxHayzDays) {
        notes.push(
          `Önceki hayızla birlikte toplam süre ${combinedDays.toFixed(1)} gün olup ` +
          `${maxHayzDays} günü aşmadığından tamamı hayız sayılır.`
        );
        return {
          hayzDays: [{ start: toISOStr(prevHayzStart), end: toISOStr(bleedEnd) }],
          istihadhaDays: [],
          isNewHayzConfirmed: true,
          updatedHayzDuration: Math.round(combinedDays),
          qadaDays: [],
          notes,
          needsScholarConsultation: false,
        };
      } else {
        // Birleşik süre azamîyi aştı → hayız müddetine göre hesapla
        const hayzMuddeti = previousMonth.hayzDuration;
        const hayzEndDate = addDays(prevHayzStart, hayzMuddeti);
        const istihadhaStart = hayzEndDate;
        const istihadhaDates = getDateList(istihadhaStart, bleedEnd);
        const qadaDays = createQadaDays(istihadhaDates);

        notes.push(
          `Birleşik süre ${combinedDays.toFixed(1)} gün olup ${maxHayzDays} günü aştığından, ` +
          `hayız müddeti olan ${hayzMuddeti} gün hayız, geri kalan istihâzadır.`
        );

        return {
          hayzDays: [{ start: toISOStr(prevHayzStart), end: toISOStr(hayzEndDate) }],
          istihadhaDays: istihadhaDates.length > 0
            ? [{ start: toISOStr(istihadhaStart), end: toISOStr(bleedEnd) }]
            : [],
          isNewHayzConfirmed: false,
          updatedHayzDuration: null,
          qadaDays,
          notes,
          needsScholarConsultation: false,
        };
      }
    }
  }

  // ═══════════════════════════════════════
  // Fasılalı kanama: arada duruş varsa 10 (veya 15) gün içinde değerlendir
  // ═══════════════════════════════════════
  const totalBleedingDays = daysBetween(bleedStart, bleedEnd);

  // Fasılalı kanama desteği: intermittentBleedingPeriods varsa
  // toplam kanama süresi başlangıçtan bitişe kadar olan süre olarak alınır
  // (arada temiz günler olsa bile 10/15 günlük pencere içinde hayız sayılır)
  if (currentBleeding.intermittentPeriods && currentBleeding.intermittentPeriods.length > 0) {
    notes.push(
      'Fasılalı kanama (ara verip devam eden kanama) tespit edilmiştir. ' +
      `Başlangıçtan bitişe kadar olan ${totalBleedingDays.toFixed(1)} günlük süre değerlendirilmektedir.`
    );
  }

  // ═══════════════════════════════════════
  // KURAL 1: Kanama 3 günden az mı?
  // ═══════════════════════════════════════
  if (totalBleedingDays < 3) {
    notes.push('Kanama süresi 3 günden (72 saatten) azdır. Bu kanama hayız sayılmaz, istihâzadır.');
    return {
      hayzDays: [],
      istihadhaDays: [{ start: toISOStr(bleedStart), end: toISOStr(bleedEnd) }],
      isNewHayzConfirmed: false,
      updatedHayzDuration: null,
      qadaDays: createQadaDays(getDateList(bleedStart, bleedEnd)),
      notes,
      needsScholarConsultation: false,
    };
  }

  // ═══════════════════════════════════════
  // KURAL 2: Kanama azamî süre veya altında mı?
  // Hanefî: ≤ 10 gün → Tamamı hayız
  // Mâlikî taklidi: ≤ 15 gün → Tamamı hayız
  // ═══════════════════════════════════════
  if (totalBleedingDays <= maxHayzDays) {
    notes.push(
      `Kanama ${totalBleedingDays.toFixed(1)} gün sürmüştür. ` +
      `${maxHayzDays} günü aşmadığı için tamamı hayızdır.`
    );

    if (madhab === 'maliki_taklid' && totalBleedingDays > 10) {
      notes.push(
        `Hanefî mezhebine göre azamî hayız 10 gündür, ancak Mâlikî mezhebini taklit ettiğiniz için ` +
        `${totalBleedingDays.toFixed(1)} güne kadar hayız kabul edilmektedir. ` +
        `Taklit şartlarına dikkat ediniz; kitaptan okuyunuz ya da bir bilene sorunuz.`
      );
    }

    return {
      hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(bleedEnd) }],
      istihadhaDays: [],
      isNewHayzConfirmed: true,
      updatedHayzDuration: Math.round(totalBleedingDays),
      qadaDays: [], // Hayız günlerinde namaz düşer, kaza gerekmez
      notes,
      needsScholarConsultation: false,
    };
  }

  // ═══════════════════════════════════════
  // KURAL 3: Kanama azamî süreyi aştı
  // → Hayız müddetine bakılır
  // ═══════════════════════════════════════
  notes.push(
    `Kanama ${totalBleedingDays.toFixed(1)} gün sürmüş olup ${maxHayzDays} günü aşmıştır. ` +
    `Hayız müddetine göre hesaplama yapılacaktır.`
  );

  // ─── Mübtedia (ilk defa hayız gören veya önceki verisi olmayan) ───
  if (!previousMonth) {
    notes.push(
      'Önceki ay verisi bulunmadığından mübtedia (ilk kez âdet gören) olarak değerlendirilmektedir.'
    );

    // Mübtedia için Hanefî hükmü:
    // İlk hayız azamî süre (10 gün Hanefî / 15 gün Mâlikî taklidi) kabul edilir
    const hayzEnd = addDays(bleedStart, maxHayzDays);
    const istihadhaStart = hayzEnd;
    const istihadhaDates = getDateList(istihadhaStart, bleedEnd);
    const qadaDays = createQadaDays(istihadhaDates);

    notes.push(
      `Mübtedia olarak ilk ${maxHayzDays} gün hayız, kalan ${istihadhaDates.length} gün istihâza sayılır.`
    );
    notes.push(
      'İstihâza günlerinde kılınmayan namazlar kaza edilecektir.'
    );
    notes.push(
      'Bu konuda kitaptan okuyunuz ya da bir bilene sorunuz.'
    );
    needsScholarConsultation = true;

    return {
      hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(hayzEnd) }],
      istihadhaDays: istihadhaDates.length > 0
        ? [{ start: toISOStr(istihadhaStart), end: toISOStr(bleedEnd) }]
        : [],
      isNewHayzConfirmed: false,
      updatedHayzDuration: maxHayzDays,
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }

  // ─── Mu'tâde (düzenli âdeti olan) ───
  const hayzMuddeti = previousMonth.hayzDuration;
  const prevHayzStart = toDate(previousMonth.hayzStart);
  const prevHayzEnd = toDate(previousMonth.hayzEnd);

  // ═══════════════════════════════════════
  // KURAL 4: Önceki hayızla döngüsel örtüşme kontrolü
  // Döngü uzunluğuna göre hesaplanır (hayız + temizlik müddeti)
  // ═══════════════════════════════════════
  const overlap = calculateCyclicOverlap(
    bleedStart, bleedEnd,
    prevHayzStart, prevHayzEnd,
    previousMonth.tuhrStart ? toDate(previousMonth.tuhrStart) : prevHayzEnd,
    previousMonth.tuhrEnd ? toDate(previousMonth.tuhrEnd) : bleedStart
  );

  if (overlap >= 3) {
    // ─── Yeni hayız geçerlidir ───
    notes.push(
      `Önceki hayız günleriyle ${overlap.toFixed(1)} gün örtüşme tespit edilmiştir (>= 3 gün). ` +
      `Yeni hayız geçerlidir.`
    );

    // Hayız = hayız müddeti kadar gün, kalan = istihâza
    const hayzEndDate = addDays(bleedStart, hayzMuddeti);
    const istihadhaStart = hayzEndDate;

    const istihadhaDates = getDateList(istihadhaStart, bleedEnd);
    const qadaDays = createQadaDays(istihadhaDates);

    if (istihadhaDates.length > 0) {
      notes.push(
        `İlk ${hayzMuddeti} gün hayız, geri kalan ${istihadhaDates.length} gün istihâzadır. ` +
        `İstihâza günlerinde kılınmayan namazlar kaza edilecektir.`
      );
    }

    if (madhab === 'maliki_taklid') {
      notes.push(
        'Mâlikî mezhebini taklit eden Hanefî hesabına göre işlem yapılmıştır. ' +
        'Mâlikî mezhebinde hayızın azamî süresi 15 gündür.'
      );

      if (totalBleedingDays <= 15) {
        notes.push(
          'Mâlikî mezhebine göre bu kanama süresi (<= 15 gün) tamamen hayız sayılabilir. ' +
          'Taklit şartlarını kitaptan okuyunuz ya da bir bilene sorunuz.'
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
      updatedHayzDuration: hayzMuddeti, // Hayız müddeti aynı kalır
      qadaDays,
      notes,
      needsScholarConsultation,
    };
  }

  // ═══════════════════════════════════════
  // KURAL 5: Örtüşme 3 günden az
  // → Önceki hayız müddetine dönülür
  // → Hayız müddeti kadar gün hayız, kalan istihâza
  // ═══════════════════════════════════════
  notes.push(
    `Önceki hayız günleriyle örtüşme ${overlap.toFixed(1)} gün olup 3 günden azdır. ` +
    `Önceki hayız müddetine (${hayzMuddeti} gün) dönülür.`
  );

  const hayzEndByMutad = addDays(bleedStart, hayzMuddeti);
  const istihadhaStartByMutad = hayzEndByMutad;

  const istihadhaDates = getDateList(istihadhaStartByMutad, bleedEnd);
  const qadaDays = createQadaDays(istihadhaDates);

  notes.push(
    `İlk ${hayzMuddeti} gün hayız sayılır, ${istihadhaDates.length} gün istihâza sayılır. ` +
    `İstihâza günlerinde kılınmayan namazlar kaza edilecektir.`
  );

  if (madhab === 'maliki_taklid') {
    notes.push(
      'Mâlikî mezhebini taklit etme durumunda farklı hükümler geçerli olabilir. ' +
      'Bu konuda kitaptan okuyunuz ya da bir bilene sorunuz.'
    );
    needsScholarConsultation = true;
  }

  return {
    hayzDays: [{ start: toISOStr(bleedStart), end: toISOStr(hayzEndByMutad) }],
    istihadhaDays: [{ start: toISOStr(istihadhaStartByMutad), end: toISOStr(bleedEnd) }],
    isNewHayzConfirmed: false,
    updatedHayzDuration: null,
    qadaDays,
    notes,
    needsScholarConsultation,
  };
}

/**
 * İki kanama döneminin döngüsel örtüşmesini hesaplar.
 *
 * Döngü uzunluğu = önceki hayız süresi + temizlik müddeti süresi
 * Yeni kanamanın başlangıcını döngü içindeki pozisyonuna göre
 * önceki hayız günleriyle karşılaştırır.
 */
function calculateCyclicOverlap(
  newStart: Date,
  newEnd: Date,
  prevHayzStart: Date,
  prevHayzEnd: Date,
  tuhrStart: Date,
  tuhrEnd: Date
): number {
  const prevHayzDuration = daysBetween(prevHayzStart, prevHayzEnd);
  const tuhrDuration = daysBetween(tuhrStart, tuhrEnd);

  // Döngü uzunluğu = hayız + temizlik müddeti
  const cycleLength = prevHayzDuration + tuhrDuration;

  if (cycleLength <= 0) {
    // Döngü hesaplanamıyorsa, doğrudan tarih bazlı örtüşme yap
    return overlapDays(newStart, newEnd, prevHayzStart, prevHayzEnd);
  }

  // Yeni kanamanın başlangıcının döngü içindeki pozisyonunu hesapla
  const daysSincePrevHayzStart = daysBetween(prevHayzStart, newStart);
  const positionInCycle = ((daysSincePrevHayzStart % cycleLength) + cycleLength) % cycleLength;

  // Yeni kanamanın döngü içindeki hayız günleriyle örtüşmesini hesapla
  // Hayız günleri döngünün 0 ile prevHayzDuration arasındaki kısmı
  const newDuration = Math.min(daysBetween(newStart, newEnd), 31);

  let overlapCount = 0;
  for (let i = 0; i < newDuration; i++) {
    const dayPosition = ((positionInCycle + i) % cycleLength + cycleLength) % cycleLength;
    if (dayPosition < prevHayzDuration) {
      overlapCount++;
    }
  }

  return overlapCount;
}
