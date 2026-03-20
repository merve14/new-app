import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DateTimePicker from '../components/DateTimePicker';
import { calculateHayzIstihadha } from '../utils/calculation';
import { generateId } from '../utils/storage';
import { formatDateTime, getCurrentMonthYear, formatMonthYear } from '../utils/dateHelpers';
import { BleedingRecord, PreviousMonthData, MonthlyRecord, CalculationResult } from '../types';

export default function HomePage() {
  const { state, dispatch } = useApp();

  // Önceki ay verileri
  const [prevHayzStart, setPrevHayzStart] = useState('');
  const [prevHayzEnd, setPrevHayzEnd] = useState('');
  const [prevTuhrStart, setPrevTuhrStart] = useState('');
  const [prevTuhrEnd, setPrevTuhrEnd] = useState('');
  const [mutadDays, setMutadDays] = useState('6');

  // Bu ay verileri
  const [bleedStart, setBleedStart] = useState('');
  const [bleedEnd, setBleedEnd] = useState('');
  const [isOngoing, setIsOngoing] = useState(false);

  // Sonuç
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showForm, setShowForm] = useState(true);

  const currentMonth = getCurrentMonthYear();

  // Mevcut ay kaydını bul
  const existingRecord = state.records.find(r => r.monthYear === currentMonth);

  const handleCalculate = () => {
    if (!bleedStart) return;

    const bleeding: BleedingRecord = {
      id: generateId(),
      startDateTime: bleedStart,
      endDateTime: isOngoing ? null : bleedEnd || null,
      isOngoing,
    };

    let prevMonth: PreviousMonthData | null = null;
    if (prevHayzStart && prevHayzEnd) {
      prevMonth = {
        hayzStart: prevHayzStart,
        hayzEnd: prevHayzEnd,
        tuhrStart: prevTuhrStart || prevHayzEnd,
        tuhrEnd: prevTuhrEnd || bleedStart,
        mutadDays: parseInt(mutadDays) || 6,
      };
    }

    const calcResult = calculateHayzIstihadha(bleeding, prevMonth, state.madhab);
    setResult(calcResult);
    setShowForm(false);

    // Kaydı oluştur/güncelle
    const record: MonthlyRecord = {
      id: existingRecord?.id || generateId(),
      monthYear: currentMonth,
      previousMonth: prevMonth,
      currentBleeding: bleeding,
      calculationResult: calcResult,
      createdAt: new Date().toISOString(),
    };

    if (existingRecord) {
      dispatch({ type: 'UPDATE_RECORD', payload: record });
    } else {
      dispatch({ type: 'ADD_RECORD', payload: record });
    }

    // Kaza namazlarını ekle
    if (calcResult.qadaDays.length > 0) {
      dispatch({ type: 'ADD_QADA_DAYS', payload: calcResult.qadaDays });
    }
  };

  const resetForm = () => {
    setResult(null);
    setShowForm(true);
  };

  return (
    <div className="animate-fade-in">
      {/* Başlık */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Özel Gün Defterim</h1>
        <p className="text-sm text-gray-400">{formatMonthYear(currentMonth)}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-rose-50 text-rose-400 px-3 py-1 rounded-full text-xs font-medium">
          <span>📿</span>
          {state.madhab === 'hanefi' ? 'Hanefî' : 'Mâlikî Taklidi'}
          <button
            onClick={() => dispatch({ type: 'SHOW_MADHAB_SELECTION' })}
            className="ml-1 underline"
          >
            değiştir
          </button>
        </div>
      </div>

      {/* Mevcut sonuç veya form */}
      {!showForm && result ? (
        <ResultView result={result} onReset={resetForm} />
      ) : (
        <div className="space-y-4">
          {/* Önceki Ay Bilgileri */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-rose-300">◆</span>
              Önceki Ay Bilgileri
            </h2>

            <DateTimePicker
              label="Önceki Hayız Başlangıcı"
              value={prevHayzStart}
              onChange={setPrevHayzStart}
              optional
            />
            <DateTimePicker
              label="Önceki Hayız Bitişi"
              value={prevHayzEnd}
              onChange={setPrevHayzEnd}
              optional
            />
            <DateTimePicker
              label="Temizlik (Tuhr) Başlangıcı"
              value={prevTuhrStart}
              onChange={setPrevTuhrStart}
              optional
            />
            <DateTimePicker
              label="Temizlik (Tuhr) Bitişi"
              value={prevTuhrEnd}
              onChange={setPrevTuhrEnd}
              optional
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Âdet-i Mu'tâde (Alışılmış Hayız Süresi)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMutadDays(String(Math.max(3, (parseInt(mutadDays) || 6) - 1)))}
                  className="w-12 h-12 rounded-xl bg-rose-50 text-rose-400 text-xl font-bold hover:bg-rose-100 transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-semibold text-gray-800">{mutadDays}</span>
                  <span className="text-gray-400 ml-2">gün</span>
                </div>
                <button
                  onClick={() => setMutadDays(String(Math.min(10, (parseInt(mutadDays) || 6) + 1)))}
                  className="w-12 h-12 rounded-xl bg-rose-50 text-rose-400 text-xl font-bold hover:bg-rose-100 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">En az 3, en çok 10 gün</p>
            </div>
          </div>

          {/* Bu Ay Bilgileri */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-rose-300">◆</span>
              Bu Ay Kanama Bilgileri
            </h2>

            <DateTimePicker
              label="Kanama Başlangıcı"
              value={bleedStart}
              onChange={setBleedStart}
            />

            {!isOngoing && (
              <DateTimePicker
                label="Kanama Bitişi"
                value={bleedEnd}
                onChange={setBleedEnd}
              />
            )}

            <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={e => setIsOngoing(e.target.checked)}
                className="w-5 h-5 rounded-md border-rose-300 text-rose-400 focus:ring-rose-300"
              />
              <span className="text-sm text-gray-600">Kanama devam ediyor</span>
            </label>
          </div>

          {/* Hesapla Butonu */}
          <button
            onClick={handleCalculate}
            disabled={!bleedStart}
            className={`btn-primary w-full text-center text-lg ${!bleedStart ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Hesapla
          </button>
        </div>
      )}

      {/* Feragatname */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          Bu uygulama yalnızca bilgi amaçlıdır.<br />
          Şüphe durumlarında mutlaka bir âlime danışınız.
        </p>
      </div>
    </div>
  );
}

// ─── Sonuç Görünümü ───

function ResultView({ result, onReset }: { result: CalculationResult; onReset: () => void }) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Hayız Günleri */}
      {result.hayzDays.length > 0 && (
        <div className="card border-l-4 border-l-rose-300">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-300"></span>
            Hayız Günleri
          </h3>
          {result.hayzDays.map((period, i) => (
            <div key={i} className="text-sm text-gray-600 bg-rose-50 rounded-lg p-3 mb-2">
              <div>{formatDateTime(period.start)}</div>
              <div className="text-gray-400 my-1">↓</div>
              <div>{formatDateTime(period.end)}</div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">
            Bu günlerde namaz kılınmaz ve kaza da edilmez.
          </p>
        </div>
      )}

      {/* İstihâza Günleri */}
      {result.istihadhaDays.length > 0 && (
        <div className="card border-l-4 border-l-amber-300">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-300"></span>
            İstihâza Günleri
          </h3>
          {result.istihadhaDays.map((period, i) => (
            <div key={i} className="text-sm text-gray-600 bg-amber-50 rounded-lg p-3 mb-2">
              <div>{formatDateTime(period.start)}</div>
              <div className="text-gray-400 my-1">↓</div>
              <div>{formatDateTime(period.end)}</div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">
            İstihâza günlerinde namaz kılınmalıdır. Kılınmadıysa kaza edilmelidir.
          </p>
        </div>
      )}

      {/* Kaza Namazları */}
      {result.qadaDays.length > 0 && (
        <div className="card border-l-4 border-l-indigo-300">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-300"></span>
            Kaza Edilecek Namazlar
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {result.qadaDays.length} gün için kaza namazı bulunmaktadır.
          </p>
          <p className="text-xs text-gray-400">
            Detaylar için "Kaza Namazlarım" sekmesine gidiniz.
          </p>
        </div>
      )}

      {/* Durum */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-2">Sonuç</h3>
        <div className={`text-sm p-3 rounded-lg ${result.isNewHayzConfirmed ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
          {result.isNewHayzConfirmed
            ? '✓ Yeni hayız dönemi onaylanmıştır.'
            : '○ Önceki âdet-i mu\u2019tâdeye dönülmüştür.'}
        </div>
        {result.updatedMutad && (
          <p className="text-sm text-gray-500 mt-2">
            Güncel mu'tâd: <strong>{result.updatedMutad} gün</strong>
          </p>
        )}
      </div>

      {/* Notlar */}
      {result.notes.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-2">Notlar</h3>
          <div className="space-y-2">
            {result.notes.map((note, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed">
                • {note}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Âlime Danışma Uyarısı */}
      {result.needsScholarConsultation && (
        <div className="card bg-amber-50/50 border-amber-200">
          <p className="text-sm text-amber-700 font-medium">
            ⚠ Bu konuda bir âlime danışmanız tavsiye edilir.
          </p>
        </div>
      )}

      <button onClick={onReset} className="btn-secondary w-full text-center">
        Yeni Hesaplama Yap
      </button>
    </div>
  );
}
