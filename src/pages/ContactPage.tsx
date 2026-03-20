import React, { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Statik form — veriler sadece görsel olarak kaydedilir
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1 text-center">Bize Ulaşın</h1>
      <p className="text-sm text-gray-400 text-center mb-6">Görüş ve önerileriniz</p>

      <div className="card mb-4">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-rose-300">💌</span>
          Geri Bildirim
        </h2>

        {submitted ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-gray-600 font-medium">Mesajınız alınmıştır!</p>
            <p className="text-sm text-gray-400 mt-1">Teşekkür ederiz.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                İsminiz
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="İsminizi giriniz..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Mesajınız
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="input-field min-h-[120px] resize-none"
                placeholder="Görüş, öneri veya sorularınızı yazınız..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !message.trim()}
              className={`btn-primary w-full text-center ${
                (!name.trim() || !message.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Gönder
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-rose-300">ℹ️</span>
          Hakkında
        </h2>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            <strong>Özel Gün Defterim</strong>, Müslüman hanımların hayız ve istihâza
            takibini kolaylaştırmak amacıyla hazırlanmış bir uygulamadır.
          </p>
          <p>
            Hesaplamalar <em>Se'âdet-i Ebediyye</em> (Hakîkat Kitâbevi) ve
            <em> Hanımlara Rehber</em> (Hasan Yavaş) kaynaklarına dayanmaktadır.
          </p>
          <p>
            Verileriniz cihazınızda saklanır ve e-posta adresiniz aracılığıyla
            farklı cihazlardan erişilebilir.
          </p>
        </div>
      </div>

      <div className="card mt-4 bg-gray-50/50">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Bu uygulama yalnızca bilgi amaçlıdır ve fıkhî fetva niteliği taşımaz.<br />
          Şüphe durumlarında kitaptan okuyunuz ya da bir bilene sorunuz.
        </p>
      </div>
    </div>
  );
}
