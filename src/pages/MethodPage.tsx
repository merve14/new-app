import React from 'react';
import { useApp } from '../context/AppContext';

export default function MethodPage() {
  const { state } = useApp();

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1 text-center">Hesaplama Yöntemi</h1>
      <p className="text-sm text-gray-400 text-center mb-6">Fıkhî kurallar ve açıklamalar</p>

      <div className="space-y-4">
        {/* Kaynaklar */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-rose-300">📖</span>
            Kaynaklar
          </h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-rose-300 mt-0.5">•</span>
              <span><strong>Se'âdet-i Ebediyye</strong> — Hakîkat Kitâbevi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-300 mt-0.5">•</span>
              <span><strong>Hanımlara Rehber</strong> — Hasan Yavaş</span>
            </li>
          </ul>
        </div>

        {/* Temel Kurallar */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-rose-300">📋</span>
            Temel Kurallar (Hanefî Mezhebi)
          </h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">1. Hayız Süresi</h3>
              <p>
                Hayızın en az süresi <strong>3 gün (72 saat)</strong>, en çok süresi
                <strong> 10 gün (240 saat)</strong>tir. Bu sürelerin altında veya üstünde
                olan kanamalar hayız sayılmaz.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">2. Temizlik Müddeti</h3>
              <p>
                İki hayız arasındaki temizlik müddetinin en azı <strong>15 gün</strong>dür.
                15 günden kısa olan temizlik müddeti geçerli sayılmaz.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">3. Kanama 10 Günü Aşarsa</h3>
              <p>
                Kanama 10 günü aştığında, <strong>hayız müddeti</strong>ne (alışılmış hayız
                süresine) bakılır. Hayız müddeti kadar olan kısım hayız, geri kalanı
                istihâza (özür kanı) sayılır.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">4. Örtüşme Kuralı</h3>
              <p>
                Yeni kanamanın önceki hayız günleriyle <strong>3 veya daha fazla gün</strong> örtüşmesi
                durumunda yeni hayız geçerli kabul edilir. Örtüşme 3 günden azsa, önceki
                hayız müddetine dönülür.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">5. İstihâza (Özür Kanı)</h3>
              <p>
                İstihâza günlerinde namaz kılınmalıdır. Bu günlerde namaz kılınmadıysa
                kaza edilmesi gerekir. İstihâzalı kadın her namaz vakti için abdest alır.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">6. Fasılalı Kanama</h3>
              <p>
                Kanama ara verip tekrar başlarsa, başlangıçtan bitişe kadar olan süre
                bir bütün olarak değerlendirilir. Toplam süre {state.madhab === 'maliki_taklid' ? '15' : '10'} günü
                aşmadığı sürece tamamı hayız sayılır.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">7. Mübtedia ve Mu'tâde</h3>
              <p>
                İlk defa hayız gören (mübtedia) ile düzenli âdeti olan (mu'tâde) kadınlar
                için farklı hükümler uygulanır. Mübtedia için hayız müddeti bilinmediğinden
                azamî süre esas alınır.
              </p>
            </div>
          </div>
        </div>

        {/* Mâlikî Taklidi */}
        {state.madhab === 'maliki_taklid' && (
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-rose-300">📿</span>
              Mâlikî Taklidi Hakkında
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                Mâlikî mezhebinde hayızın azamî (en çok) süresi <strong>15 gün</strong>dür.
                Hanefî mezhebinde bu süre 10 gündür.
              </p>
              <p>
                Hanefî mezhebine göre amel eden bir kadın, bazı durumlarda Mâlikî
                mezhebini taklit edebilir. Bu taklit, belirli şartlara bağlıdır ve
                bir bütün olarak yapılmalıdır.
              </p>
              <p>
                Mâlikî'yi taklit eden Hanefî kadınlar, en çok hayız gördükleri gün
                sayısını <strong>15 güne kadar</strong> girebilirler. Bu durumda
                10 ile 15 gün arasındaki kanamalar da istihâza sayılmaz, hayız kabul edilir.
              </p>
              <p className="text-amber-600 font-medium">
                ⚠ Mâlikî taklidi konusunda kitaptan okuyunuz ya da bir bilene sorunuz.
              </p>
            </div>
          </div>
        )}

        {/* Hesaplama Adımları */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-rose-300">⚙️</span>
            Hesaplama Adımları
          </h2>
          <div className="text-sm text-gray-600 leading-relaxed">
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">1</span>
                <span>Kanama süresi hesaplanır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">2</span>
                <span>İki hayız arasında en az 15 gün temizlik müddeti olup olmadığı kontrol edilir.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">3</span>
                <span>Süre {'<='} {state.madhab === 'maliki_taklid' ? '15' : '10'} gün ise → Tamamı hayızdır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">4</span>
                <span>Süre {'>'} {state.madhab === 'maliki_taklid' ? '15' : '10'} gün ise → Önceki hayız verileriyle karşılaştırılır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">5</span>
                <span>3+ gün örtüşme varsa → Yeni hayız geçerlidir, hayız müddeti kadar gün hayız sayılır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">6</span>
                <span>{'<'} 3 gün örtüşme → Önceki hayız müddetine dönülür.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold">7</span>
                <span>İstihâza günleri ve kaza namazları belirlenir.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Feragatname */}
        <div className="card bg-gray-50/50">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Bu uygulama yalnızca bilgi amaçlıdır ve fıkhî fetva niteliği taşımaz.
            Hesaplamalar yukarıda belirtilen kaynaklara dayanmaktadır.
            Şüphe durumlarında kitaptan okuyunuz ya da bir bilene sorunuz.
          </p>
        </div>
      </div>
    </div>
  );
}
