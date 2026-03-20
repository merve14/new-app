import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, getDayName } from '../utils/dateHelpers';
import { QadaDay } from '../types';

export default function QadaPage() {
  const { state, dispatch } = useApp();

  // Tarihe göre sırala (yakından uzağa)
  const sortedDays = [...state.qadaPrayers].sort((a, b) => b.date.localeCompare(a.date));

  const pendingDays = sortedDays.filter(d => d.prayers.some(p => !p.isCompleted));
  const completedDays = sortedDays.filter(d => d.prayers.every(p => p.isCompleted));

  const totalPending = pendingDays.reduce(
    (sum, d) => sum + d.prayers.filter(p => !p.isCompleted).length, 0
  );

  const togglePrayer = (date: string, prayerName: string) => {
    dispatch({ type: 'TOGGLE_QADA_PRAYER', payload: { date, prayerName } });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1 text-center">Kaza Namazlarım</h1>
      <p className="text-sm text-gray-400 text-center mb-4">Tüm aylara ait kaza namazları</p>

      {/* Özet */}
      {state.qadaPrayers.length > 0 && (
        <div className="card mb-4 text-center">
          <div className="flex justify-around">
            <div>
              <div className="text-2xl font-bold text-rose-400">{pendingDays.length}</div>
              <div className="text-xs text-gray-400">Bekleyen Gün</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{totalPending}</div>
              <div className="text-xs text-gray-400">Bekleyen Namaz</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{completedDays.length}</div>
              <div className="text-xs text-gray-400">Tamamlanan Gün</div>
            </div>
          </div>
        </div>
      )}

      {sortedDays.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🤲</div>
          <p className="text-gray-500">Kaza namazı bulunmamaktadır.</p>
          <p className="text-sm text-gray-400 mt-1">Elhamdülillah!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bekleyen kaza namazları */}
          {pendingDays.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Bekleyen Kaza Namazları
              </h2>
              {pendingDays.map(day => (
                <QadaDayCard key={day.date} day={day} onToggle={togglePrayer} />
              ))}
            </div>
          )}

          {/* Tamamlanan günler */}
          {completedDays.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1 mt-6">
                Tamamlanan Günler
              </h2>
              {completedDays.map(day => (
                <QadaDayCard key={day.date} day={day} onToggle={togglePrayer} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QadaDayCard({ day, onToggle }: { day: QadaDay; onToggle: (date: string, name: string) => void }) {
  const allCompleted = day.prayers.every(p => p.isCompleted);
  const completedCount = day.prayers.filter(p => p.isCompleted).length;

  return (
    <div className={`card mb-3 ${allCompleted ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="font-semibold text-gray-700 text-sm">
            {formatDate(day.date)}
          </div>
          <div className="text-xs text-gray-400">{getDayName(day.date)}</div>
        </div>
        <div className="text-xs text-gray-400">
          {completedCount}/{day.prayers.length}
        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div
          className="bg-gradient-to-r from-rose-300 to-green-300 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(completedCount / day.prayers.length) * 100}%` }}
        />
      </div>

      {/* Namazlar */}
      <div className="grid grid-cols-2 gap-2">
        {day.prayers.map(prayer => (
          <button
            key={prayer.name}
            onClick={() => onToggle(day.date, prayer.name)}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-sm transition-all duration-200 ${
              prayer.isCompleted
                ? 'bg-green-50 text-green-600'
                : 'bg-gray-50 text-gray-600 hover:bg-rose-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs transition-all ${
              prayer.isCompleted
                ? 'bg-green-400 border-green-400 text-white'
                : 'border-gray-300'
            }`}>
              {prayer.isCompleted && '✓'}
            </span>
            <span className={prayer.isCompleted ? 'line-through' : ''}>
              {prayer.name}
            </span>
            {prayer.isCompleted && (
              <span className="text-xs text-green-500 ml-auto">Kılındı</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
