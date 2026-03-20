import React from 'react';
import { useApp } from '../context/AppContext';
import { formatMonthYear, formatDateTime } from '../utils/dateHelpers';

export default function HistoryPage() {
  const { state, dispatch } = useApp();

  const sortedRecords = [...state.records].sort((a, b) =>
    b.monthYear.localeCompare(a.monthYear)
  );

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1 text-center">Geçmiş Aylar</h1>
      <p className="text-sm text-gray-400 text-center mb-6">Tüm kayıtlarınız</p>

      {sortedRecords.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500">Henüz kayıt bulunmamaktadır.</p>
          <p className="text-sm text-gray-400 mt-1">
            Ana sayfadan yeni kayıt ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRecords.map(record => (
            <div key={record.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700">
                  {formatMonthYear(record.monthYear)}
                </h3>
                <button
                  onClick={() => {
                    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
                      dispatch({ type: 'DELETE_RECORD', payload: record.id });
                    }
                  }}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                >
                  Sil
                </button>
              </div>

              {/* Kanama Bilgisi */}
              {record.currentBleeding && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Kanama</p>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(record.currentBleeding.startDateTime)}
                    {record.currentBleeding.endDateTime && (
                      <> — {formatDateTime(record.currentBleeding.endDateTime)}</>
                    )}
                    {record.currentBleeding.isOngoing && (
                      <span className="ml-2 text-rose-400 text-xs">(devam ediyor)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Hesaplama Sonucu */}
              {record.calculationResult && (
                <>
                  {/* Hayız */}
                  {record.calculationResult.hayzDays.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Hayız</span>
                      </div>
                      {record.calculationResult.hayzDays.map((p, i) => (
                        <p key={i} className="text-sm text-gray-600 pl-4">
                          {formatDateTime(p.start)} — {formatDateTime(p.end)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* İstihâza */}
                  {record.calculationResult.istihadhaDays.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">İstihâza</span>
                      </div>
                      {record.calculationResult.istihadhaDays.map((p, i) => (
                        <p key={i} className="text-sm text-gray-600 pl-4">
                          {formatDateTime(p.start)} — {formatDateTime(p.end)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Durum */}
                  <div className={`text-xs mt-2 px-3 py-1.5 rounded-full inline-block ${
                    record.calculationResult.isNewHayzConfirmed
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    {record.calculationResult.isNewHayzConfirmed
                      ? '✓ Hayız onaylandı'
                      : '○ Önceki hayız müddetine dönüldü'}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
