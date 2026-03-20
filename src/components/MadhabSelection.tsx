import React from 'react';
import { useApp } from '../context/AppContext';
import { MadhabPreference } from '../types';

export default function MadhabSelection() {
  const { state, dispatch } = useApp();

  if (!state.showMadhabSelection) return null;

  const select = (madhab: MadhabPreference) => {
    dispatch({ type: 'SET_MADHAB', payload: madhab });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌸</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Hoş Geldiniz
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Hesaplama yöntemini seçiniz. Bu tercih daha sonra değiştirilebilir.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => select('hanefi')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              state.madhab === 'hanefi'
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/50'
            }`}
          >
            <div className="font-semibold text-gray-800 mb-1">Hanefî Mezhebi</div>
            <div className="text-sm text-gray-500">
              Standart Hanefî hesaplama yöntemi
            </div>
          </button>

          <button
            onClick={() => select('maliki_taklid')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              state.madhab === 'maliki_taklid'
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/50'
            }`}
          >
            <div className="font-semibold text-gray-800 mb-1">Mâlikî'yi Taklit Eden Hanefî</div>
            <div className="text-sm text-gray-500">
              Mâlikî mezhebini taklit yoluyla uygulayan Hanefî hesaplama yöntemi
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          Bu uygulama yalnızca bilgi amaçlıdır.<br />
          Şüphe durumlarında mutlaka bir âlime danışınız.
        </p>
      </div>
    </div>
  );
}
