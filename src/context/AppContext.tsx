import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState,
  MadhabPreference,
  MonthlyRecord,
  PreviousMonthData,
  QadaDay,
  TabId,
} from '../types';
import { loadState, saveState } from '../utils/storage';

interface AppContextState extends AppState {
  activeTab: TabId;
  showMadhabSelection: boolean;
  showEmailLogin: boolean;
}

type Action =
  | { type: 'SET_MADHAB'; payload: MadhabPreference }
  | { type: 'SET_TAB'; payload: TabId }
  | { type: 'ADD_RECORD'; payload: MonthlyRecord }
  | { type: 'UPDATE_RECORD'; payload: MonthlyRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'ADD_QADA_DAYS'; payload: QadaDay[] }
  | { type: 'TOGGLE_QADA_PRAYER'; payload: { date: string; prayerName: string } }
  | { type: 'HIDE_MADHAB_SELECTION' }
  | { type: 'SHOW_MADHAB_SELECTION' }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'HIDE_EMAIL_LOGIN' }
  | { type: 'SET_PREVIOUS_MONTH'; payload: PreviousMonthData }
  | { type: 'UPDATE_PREVIOUS_MONTH_FROM_RESULT'; payload: { hayzStart: string; hayzEnd: string; hayzDuration: number } };

const loaded = loadState();

const initialState: AppContextState = {
  ...loaded,
  activeTab: 'home',
  showMadhabSelection: false,
  showEmailLogin: false,
};

// İlk açılışta e-posta girişi göster (e-posta yoksa)
if (!initialState.userEmail) {
  initialState.showEmailLogin = true;
}
// E-posta girildikten sonra, mezhep seçimi yoksa göster
else if (initialState.records.length === 0 && !initialState.savedPreviousMonth) {
  initialState.showMadhabSelection = true;
}

function reducer(state: AppContextState, action: Action): AppContextState {
  switch (action.type) {
    case 'SET_MADHAB':
      return { ...state, madhab: action.payload, showMadhabSelection: false };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'ADD_RECORD':
      return { ...state, records: [...state.records, action.payload] };
    case 'UPDATE_RECORD': {
      const records = state.records.map(r =>
        r.id === action.payload.id ? action.payload : r
      );
      return { ...state, records };
    }
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter(r => r.id !== action.payload) };
    case 'ADD_QADA_DAYS': {
      const newQada = [...state.qadaPrayers];
      for (const day of action.payload) {
        const idx = newQada.findIndex(d => d.date === day.date);
        if (idx >= 0) {
          const existing = newQada[idx];
          for (const prayer of day.prayers) {
            const ep = existing.prayers.find(p => p.name === prayer.name);
            if (ep) prayer.isCompleted = ep.isCompleted;
          }
          newQada[idx] = day;
        } else {
          newQada.push(day);
        }
      }
      return { ...state, qadaPrayers: newQada };
    }
    case 'TOGGLE_QADA_PRAYER': {
      const qadaPrayers = state.qadaPrayers.map(day => {
        if (day.date === action.payload.date) {
          return {
            ...day,
            prayers: day.prayers.map(p =>
              p.name === action.payload.prayerName
                ? { ...p, isCompleted: !p.isCompleted }
                : p
            ),
          };
        }
        return day;
      });
      return { ...state, qadaPrayers };
    }
    case 'HIDE_MADHAB_SELECTION':
      return { ...state, showMadhabSelection: false };
    case 'SHOW_MADHAB_SELECTION':
      return { ...state, showMadhabSelection: true };
    case 'SET_EMAIL':
      return {
        ...state,
        userEmail: action.payload,
        showEmailLogin: false,
        // E-posta girildikten sonra mezhep seçimi göster
        showMadhabSelection: true,
      };
    case 'HIDE_EMAIL_LOGIN':
      return { ...state, showEmailLogin: false };
    case 'SET_PREVIOUS_MONTH':
      return { ...state, savedPreviousMonth: action.payload };
    case 'UPDATE_PREVIOUS_MONTH_FROM_RESULT': {
      // Hesaplama sonucundan sonra önceki ay bilgisini otomatik güncelle
      const newPrevMonth: PreviousMonthData = {
        hayzStart: action.payload.hayzStart,
        hayzEnd: action.payload.hayzEnd,
        tuhrStart: action.payload.hayzEnd,
        tuhrEnd: '', // Bir sonraki kanama başlangıcında güncellenecek
        hayzDuration: action.payload.hayzDuration,
      };
      return { ...state, savedPreviousMonth: newPrevMonth };
    }
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppContextState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Her state değişikliğinde localStorage'a kaydet
  useEffect(() => {
    const { activeTab, showMadhabSelection, showEmailLogin, ...persistState } = state;
    saveState(persistState);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
