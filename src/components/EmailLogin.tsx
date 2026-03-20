import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function EmailLogin() {
  const { state, dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!state.showEmailLogin) return null;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    dispatch({ type: 'SET_EMAIL', payload: email.trim().toLowerCase() });
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
            Verilerinize farklı cihazlardan ulaşabilmeniz ve bilgilerinizin
            e-posta adresinize gönderilebilmesi için lütfen e-posta adresinizi giriniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              E-posta Adresiniz
            </label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
              className="input-field"
              placeholder="ornek@email.com"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!email.trim()}
            className={`btn-primary w-full text-center text-lg ${
              !email.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Devam Et
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          E-posta adresiniz yalnızca veri senkronizasyonu için kullanılacaktır.<br />
          Bilgileriniz gizli tutulur ve üçüncü kişilerle paylaşılmaz.
        </p>
      </div>
    </div>
  );
}
