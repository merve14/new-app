/**
 * localStorage yönetimi
 */

import { AppState, MadhabPreference, MonthlyRecord, QadaDay, PreviousMonthData } from '../types';

const STORAGE_KEY = 'ozel-gun-defterim';

const DEFAULT_STATE: AppState = {
  madhab: 'hanefi',
  records: [],
  qadaPrayers: [],
  userEmail: null,
  savedPreviousMonth: null,
};

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_STATE;
    const parsed = JSON.parse(data);
    // Eski verilerle uyumluluk: yeni alanlar yoksa varsayılan değer ata
    return {
      ...DEFAULT_STATE,
      ...parsed,
      // mutadDays → hayzDuration göçü
      savedPreviousMonth: parsed.savedPreviousMonth
        ? {
            ...parsed.savedPreviousMonth,
            hayzDuration: parsed.savedPreviousMonth.hayzDuration ?? parsed.savedPreviousMonth.mutadDays ?? 6,
          }
        : null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Veri kaydedilemedi:', e);
  }
}

export function saveMadhab(madhab: MadhabPreference): void {
  const state = loadState();
  state.madhab = madhab;
  saveState(state);
}

export function saveRecord(record: MonthlyRecord): void {
  const state = loadState();
  const idx = state.records.findIndex(r => r.id === record.id);
  if (idx >= 0) {
    state.records[idx] = record;
  } else {
    state.records.push(record);
  }
  saveState(state);
}

export function deleteRecord(id: string): void {
  const state = loadState();
  state.records = state.records.filter(r => r.id !== id);
  saveState(state);
}

export function saveQadaPrayers(qadaPrayers: QadaDay[]): void {
  const state = loadState();
  for (const newDay of qadaPrayers) {
    const existingIdx = state.qadaPrayers.findIndex(d => d.date === newDay.date);
    if (existingIdx >= 0) {
      const existing = state.qadaPrayers[existingIdx];
      for (const prayer of newDay.prayers) {
        const existingPrayer = existing.prayers.find(p => p.name === prayer.name);
        if (existingPrayer) {
          prayer.isCompleted = existingPrayer.isCompleted;
        }
      }
      state.qadaPrayers[existingIdx] = newDay;
    } else {
      state.qadaPrayers.push(newDay);
    }
  }
  saveState(state);
}

export function toggleQadaPrayer(date: string, prayerName: string): void {
  const state = loadState();
  const day = state.qadaPrayers.find(d => d.date === date);
  if (day) {
    const prayer = day.prayers.find(p => p.name === prayerName);
    if (prayer) {
      prayer.isCompleted = !prayer.isCompleted;
    }
  }
  saveState(state);
}

export function saveUserEmail(email: string): void {
  const state = loadState();
  state.userEmail = email;
  saveState(state);
}

export function savePreviousMonth(prevMonth: PreviousMonthData): void {
  const state = loadState();
  state.savedPreviousMonth = prevMonth;
  saveState(state);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
