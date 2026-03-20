import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DateTimePicker from '../components/DateTimePicker';
import { calculateHayzIstihadha } from '../utils/calculation';
import { generateId } from '../utils/storage';
import { formatDateTime, getCurrentMonthYear, formatMonthYear } from '../utils/dateHelpers';
import { BleedingRecord, PreviousMonthData, MonthlyRecord, CalculationResult } from '../types';

export default function HomePage() {
  const { state, dispatch } = useApp();

  const isFirstUse = !state.savedPreviousMonth && state.records.length === 0;
  const maxHayzDays = state.madhab === 'maliki_taklid' ? 15 : 10;

  // Önceki ay verileri (sadece ilk kullanımda gösterilir)
  const [prevHayzStart, setPrevHayzStart] = useState('');
  const [prevHayzEnd, setPrevHayzEnd] = useState('');
  const [prevTuhrStart, setPrevTuhrStart] = useState('');
  const [prevTuhrEnd, setPrevTuhrEnd] = useState('');
  const [hayzDuration, setHayzDuration] = useState('6');

  // Bu ay verileri
  const [bleedStart, setBleedStart] = useState('');
  const [bleedEnd, setBleedEnd] = useState('');
  const [isOngoing, setIsOngoing] = useState(false);

  // Fasılalı kanama
  const [hasIntermittent, setHasIntermittent] = useState(false);
  const [intermittentPeriods, setIntermittentPeriods] = useState<{start: string; end: string}[]>([]);

  // Sonuç
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showForm, setShowForm] = useState(true);

  const currentMonth = getCurrentMonthYear();
  const existingRecord = state.records.find(r => r.monthYear === currentMonth);

  const addIntermittentPeriod = () => {
    setIntermittentPeriods([...intermittentPeriods, { start: '', end: '' }]);
  };

  const updateIntermittentPeriod = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...intermittentPeriods];
    updated[index] = { ...updated[index], [field]: value };
    setIntermittentPeriods(updated);
  };

  const removeIntermittentPeriod = (index: number) => {
    setIntermittentPeriods(intermittentPeriods.filter((_, i) => i !== index));
  };

  const handleCalculate = () => {
    if (!bleedStart) return;

    const bleeding: BleedingRecord = {
      id: generateId(),
      startDateTime: bleedStart,
      endDateTime: isOngoing ? null : bleedEnd || null,
      isOngoing,
      intermittentPeriods: hasIntermittent && intermittentPeriods.length > 0
        ? intermittentPeriods.filter(p => p.start && p.end)
        : undefined,
    };

    // Önceki ay verisi: ilk kullanımda formdan al, sonra kaydedilmişi kullan
    let prevMonth: PreviousMonthData | null = null;
    if (isFirstUse && prevHayzStart && prevHayzEnd) {
      prevMonth = {
        hayzStart: prevHayzStart,
        hayzEnd: prevHayzEnd,
        tuhrStart: prevTuhrStart || prevHayzEnd,
        tuhrEnd: prevTuhrEnd || bleedStart,
        hayzDuration: parseInt(hayzDuration) || 6,
      };
      // İlk kullanım verisini kaydet
      dispatch({ type: 'SET_PREVIOUS_MONTH', payload: prevMonth });
    } else if (state.savedPreviousMonth) {
      prevMonth = {
        ...state.savedPreviousMonth,
        tuhrEnd: state.savedPreviousMonth.tuhrEnd || bleedStart,
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

    // Hesaplama sonucundan sonra önceki ay bilgisini otomatik güncelle
    if (calcResult.hayzDays.length > 0) {
      dispatch({
        type: 'UPDATE_PREVIOUS_MONTH_FROM_RESULT',
        payload: {
          hayzStart: calcResult.hayzDays[0].start,
          hayzEnd: calcResult.hayzDays[calcResult.hayzDays.length - 1].end,
          hayzDuration: calcResult.updatedHayzDuration || (prevMonth?.hayzDuration ?? 6),
        },
      });
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
        {state.userEmail && (
          <p className="text-xs text-gray-400 mt-1">{state.userEmail}</p>
        )}
      </div>

      {/* Mevcut sonuç veya form */}
      {!showForm && result ? (
        <ResultView result={result} onReset={resetForm} madhab={state.madhab} />
      ) : (
        <div className="space-y-4">
          {/* Önceki Ay Bilgileri — sadece ilk kullanımda */}
          {isFirstUse && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-rose-300">◆</span>
                Önceki Ay Bilgileri
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Bu bilgiler sadece ilk kullanımda istenmektedir. Sonraki aylarda otomatik hesaplanır.
              </p>

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
                label="Temizlik Müddeti Başlangıcı"
                value={prevTuhrStart}
                onChange={setPrevTuhrStart}
                optional
              />
              <DateTimePicker
                label="Temizlik Müddeti Bitişi"
                value={prevTuhrEnd}
                onChange={setPrevTuhrEnd}
                optional
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Hayız Müddeti (Alışılmış Hayız Süresi)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setHayzDuration(String(Math.max(3, (parseInt(hayzDuration) || 6) - 1)))}
                    className="w-12 h-12 rounded-xl bg-rose-50 text-rose-400 text-xl font-bold hover:bg-rose-100 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-semibold text-gray-800">{hayzDuration}</span>
                    <span className="text-gray-400 ml-2">gün</span>
                  </div>
                  <button
                    onClick={() => setHayzDuration(String(Math.min(maxHayzDays, (parseInt(hayzDuration) || 6) + 1)))}
                    className="w-12 h-12 rounded-xl bg-rose-50 text-rose-400 text-xl font-bold hover:bg-rose-100 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  En az 3, en çok {maxHayzDays} gün
                </p>
              </div>
            </div>
          )}

          {/* Kaydedilmiş önceki ay bilgisi göstergesi */}
          {!isFirstUse && state.savedPreviousMonth && (
            <div className="card bg-green-50/50 border-green-100">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span>✓</span>
                <span>
                  Önceki ay bilgileri mevcut — Hayız müddeti: <strong>{state.savedPreviousMonth.hayzDuration} gün</strong>
                </span>
              </div>
            </div>
          )}

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

            <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={e => setIsOngoing(e.target.checked)}
                className="w-5 h-5 rounded-md border-rose-300 text-rose-400 focus:ring-rose-300"
              />
              <span className="text-sm text-gray-600">Kanama devam ediyor</span>
            </label>

            {/* Fasılalı kanama */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={hasIntermittent}
                onChange={e => setHasIntermittent(e.target.checked)}
                className="w-5 h-5 rounded-md border-rose-300 text-rose-400 focus:ring-rose-300"
              />
              <span className="text-sm text-gray-600">Kanama ara verip devam etti (fasılalı kanama)</span>
            </label>

            {hasIntermittent && (
              <div className="ml-2 space-y-3 mb-3">
                <p className="text-xs text-gray-400">
                  Kanamanın kesilip tekrar başladığı dönemleri ekleyiniz.
                </p>
                {intermittentPeriods.map((period, i) => (
                  <div key={i} className="bg-rose-50/50 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500">Dönem {i + 2}</span>
                      <button
                        onClick={() => removeIntermittentPeriod(i)}
                        className="text-xs text-red-400 hover:text-red-500"
                      >
                        Kaldır
                      </button>
                    </div>
                    <DateTimePicker
                      label="Tekrar Başlangıç"
                      value={period.start}
                      onChange={v => updateIntermittentPeriod(i, 'start', v)}
                    />
                    <DateTimePicker
                      label="Bitiş"
                      value={period.end}
                      onChange={v => updateIntermittentPeriod(i, 'end', v)}
                    />
                  </div>
                ))}
                <button
                  onClick={addIntermittentPeriod}
                  className="text-sm text-rose-400 hover:text-rose-500 font-medium"
                >
                  + Yeni dönem ekle
                </button>
              </div>
            )}
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
          Şüphe durumlarında kitaptan okuyunuz ya da bir bilene sorunuz.
        </p>
      </div>
    </div>
  );
}

// ─── Sonuç Görünümü ───

function ResultView({ result, onReset, madhab }: { result: CalculationResult; onReset: () => void; madhab: string }) {
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
            : '○ Önceki hayız müddetine dönülmüştür.'}
        </div>
        {result.updatedHayzDuration && (
          <p className="text-sm text-gray-500 mt-2">
            Güncel hayız müddeti: <strong>{result.updatedHayzDuration} gün</strong>
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

      {/* Kitaptan okuyun uyarısı */}
      {result.needsScholarConsultation && (
        <div className="card bg-amber-50/50 border-amber-200">
          <p className="text-sm text-amber-700 font-medium">
            ⚠ Bu konuda kitaptan okuyunuz ya da bir bilene sorunuz.
          </p>
        </div>
      )}

      <button onClick={onReset} className="btn-secondary w-full text-center">
        Yeni Hesaplama Yap
      </button>
    </div>
  );
}
