import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

/**
 * Dokunmatik uyumlu tarih-saat seçici.
 * Drum-roll tarzı kaydırmalı seçiciler yerine,
 * mobil-dostu büyük butonlu bir arayüz sunar.
 */
export default function DateTimePicker({ label, value, onChange, optional }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    if (value) return new Date(value);
    const now = new Date();
    now.setMinutes(0);
    return now;
  });

  useEffect(() => {
    if (value) setTempDate(new Date(value));
  }, [value]);

  const year = tempDate.getFullYear();
  const month = tempDate.getMonth();
  const day = tempDate.getDate();
  const hour = tempDate.getHours();
  const minute = tempDate.getMinutes();

  const updateField = (field: 'year' | 'month' | 'day' | 'hour' | 'minute', delta: number) => {
    const d = new Date(tempDate);
    if (field === 'year') d.setFullYear(d.getFullYear() + delta);
    else if (field === 'month') d.setMonth(d.getMonth() + delta);
    else if (field === 'day') d.setDate(d.getDate() + delta);
    else if (field === 'hour') d.setHours(d.getHours() + delta);
    else if (field === 'minute') d.setMinutes(d.getMinutes() + delta * 5);
    setTempDate(d);
  };

  const confirm = () => {
    onChange(tempDate.toISOString());
    setIsOpen(false);
  };

  const displayValue = value
    ? new Date(value).toLocaleString('tr-TR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : '';

  const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-600 mb-1.5">
        {label}
        {optional && <span className="text-gray-400 ml-1">(isteğe bağlı)</span>}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-left input-field flex items-center justify-between"
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
          {displayValue || 'Tarih ve saat seçiniz...'}
        </span>
        <span className="text-rose-300">📅</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Tarih seçici */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {/* Gün */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => updateField('day', 1)}
                  className="w-14 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▲
                </button>
                <div className="w-14 h-14 flex items-center justify-center text-2xl font-semibold text-gray-800 bg-rose-50/50 rounded-xl">
                  {day.toString().padStart(2, '0')}
                </div>
                <button
                  onClick={() => updateField('day', -1)}
                  className="w-14 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▼
                </button>
                <span className="text-xs text-gray-400 mt-1">Gün</span>
              </div>

              {/* Ay */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => updateField('month', 1)}
                  className="w-20 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▲
                </button>
                <div className="w-20 h-14 flex items-center justify-center text-lg font-semibold text-gray-800 bg-rose-50/50 rounded-xl">
                  {MONTHS[month]}
                </div>
                <button
                  onClick={() => updateField('month', -1)}
                  className="w-20 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▼
                </button>
                <span className="text-xs text-gray-400 mt-1">Ay</span>
              </div>

              {/* Yıl */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => updateField('year', 1)}
                  className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▲
                </button>
                <div className="w-16 h-14 flex items-center justify-center text-lg font-semibold text-gray-800 bg-rose-50/50 rounded-xl">
                  {year}
                </div>
                <button
                  onClick={() => updateField('year', -1)}
                  className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▼
                </button>
                <span className="text-xs text-gray-400 mt-1">Yıl</span>
              </div>
            </div>

            {/* Saat seçici */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => updateField('hour', 1)}
                  className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▲
                </button>
                <div className="w-16 h-14 flex items-center justify-center text-2xl font-semibold text-gray-800 bg-rose-50/50 rounded-xl">
                  {hour.toString().padStart(2, '0')}
                </div>
                <button
                  onClick={() => updateField('hour', -1)}
                  className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▼
                </button>
                <span className="text-xs text-gray-400 mt-1">Saat</span>
              </div>

              <span className="text-2xl font-bold text-gray-300 mt-[-20px]">:</span>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => updateField('minute', 1)}
                  className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▲
                </button>
                <div className="w-16 h-14 flex items-center justify-center text-2xl font-semibold text-gray-800 bg-rose-50/50 rounded-xl">
                  {minute.toString().padStart(2, '0')}
                </div>
                <button
                  onClick={() => updateField('minute', -1)}
                  className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-rose-400 text-xl rounded-lg hover:bg-rose-50 transition-colors"
                >
                  ▼
                </button>
                <span className="text-xs text-gray-400 mt-1">Dakika</span>
              </div>
            </div>

            <button onClick={confirm} className="btn-primary w-full text-center">
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
