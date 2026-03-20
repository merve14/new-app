/**
 * Temel veri tipleri — Hayız/İstihâza Takip Uygulaması
 *
 * Kaynaklar:
 * - Saadeti Ebediyye (Hakikat Kitabevi)
 * - Hanımlara Rehber (Hasan Yavaş)
 */

/** Mezhep tercihi */
export type MadhabPreference = 'hanefi' | 'maliki_taklid';

/** Tarih + saat birlikte (ISO string olarak saklanır) */
export type DateTimeString = string;

/** Fasılalı kanama dönemi */
export interface IntermittentPeriod {
  start: DateTimeString;
  end: DateTimeString;
}

/** Kanama kaydı */
export interface BleedingRecord {
  id: string;
  startDateTime: DateTimeString;
  endDateTime: DateTimeString | null; // null = devam ediyor
  isOngoing: boolean;
  /** Fasılalı kanama dönemleri (ara verip devam eden kanama) */
  intermittentPeriods?: IntermittentPeriod[];
}

/** Önceki ay verisi */
export interface PreviousMonthData {
  hayzStart: DateTimeString;
  hayzEnd: DateTimeString;
  tuhrStart: DateTimeString;
  tuhrEnd: DateTimeString;
  /** Hayız müddeti (alışılmış hayız süresi, gün) */
  hayzDuration: number;
}

/** Hesaplama sonucu */
export interface CalculationResult {
  hayzDays: { start: DateTimeString; end: DateTimeString }[];
  istihadhaDays: { start: DateTimeString; end: DateTimeString }[];
  isNewHayzConfirmed: boolean;
  /** Güncellenmiş hayız müddeti */
  updatedHayzDuration: number | null;
  qadaDays: QadaDay[];
  notes: string[];
  /** Belirsiz durumlarda kitaptan okuma / bilene sorma uyarısı */
  needsScholarConsultation: boolean;
}

/** Kaza günü */
export interface QadaDay {
  date: string; // YYYY-MM-DD
  prayers: QadaPrayer[];
}

/** Kaza namazı */
export interface QadaPrayer {
  name: PrayerName;
  isCompleted: boolean;
}

export type PrayerName = 'Sabah' | 'Öğle' | 'İkindi' | 'Akşam' | 'Yatsı' | 'Vitr';

export const ALL_PRAYERS: PrayerName[] = ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'Vitr'];

/** Aylık kayıt */
export interface MonthlyRecord {
  id: string;
  monthYear: string; // "2026-03" formatında
  previousMonth: PreviousMonthData | null;
  currentBleeding: BleedingRecord | null;
  calculationResult: CalculationResult | null;
  createdAt: DateTimeString;
}

/** Uygulama durumu */
export interface AppState {
  madhab: MadhabPreference;
  records: MonthlyRecord[];
  qadaPrayers: QadaDay[];
  /** Kullanıcı e-posta adresi (giriş ve veri senkronizasyonu için) */
  userEmail: string | null;
  /** Saklanan önceki ay verisi (sadece ilk kullanımda girilir, sonra otomatik kullanılır) */
  savedPreviousMonth: PreviousMonthData | null;
}

/** Sekme tanımları */
export type TabId = 'home' | 'history' | 'method' | 'qada' | 'contact';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: Tab[] = [
  { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
  { id: 'history', label: 'Geçmiş', icon: '📅' },
  { id: 'method', label: 'Yöntem', icon: '📖' },
  { id: 'qada', label: 'Kaza', icon: '🤲' },
  { id: 'contact', label: 'İletişim', icon: '✉️' },
];
