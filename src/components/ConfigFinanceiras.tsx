import React, { useState, useEffect } from 'react';
import { Calculator, Bell, MessageCircle, ShieldCheck } from 'lucide-react';

export default function ConfigFinanceiras() {
  const [cardFeesSettings, setCardFeesSettings] = useState<Record<number, number>>(() => {
    const DEFAULT_CARD_FEES = {
      1: 3.05, 2: 4.3, 3: 5.25, 4: 6.20, 5: 7.15, 6: 8.01,
      7: 8.90, 8: 9.85, 9: 10.80, 10: 11.75, 11: 12.70, 12: 13.65
    };
    const saved = localStorage.getItem('cardFeesSettings');
    return saved ? JSON.parse(saved) : DEFAULT_CARD_FEES;
  });

  const [fiadoSettings, setFiadoSettings] = useState(() => {
    const saved = localStorage.getItem('fiadoSettings');
    return saved ? JSON.parse(saved) : {
      monthlyInterest: 2.5,
      notificationDaysBefore: 3,
      notificationDaysAfter: 5,
      autoNotification: true,
      lateFeeRate: 2,
      lateInterestRate: 1
    };
  });

  useEffect(() => {
    localStorage.setItem('cardFeesSettings', JSON.stringify(cardFeesSettings));
  }, [cardFeesSettings]);

  useEffect(() => {
    localStorage.setItem('fiadoSettings', JSON.stringify(fiadoSettings));
  }, [fiadoSettings]);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calculator size={24} className="text-blue-500" />
          Configuração de Repasse de Juros
        </h3>
        <p className="text-sm text-slate-500 mb-8">Defina as taxas cobradas pela sua operadora de cartão por parcela.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {Object.keys(cardFeesSettings).sort((a, b) => Number(a) - Number(b)).map(parcela => (
            <div key={parcela}>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">{parcela}x Cartão (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={cardFeesSettings[Number(parcela)]}
                  onChange={e => {
                    const newFees = { ...cardFeesSettings, [Number(parcela)]: parseFloat(e.target.value) || 0 };
                    setCardFeesSettings(newFees);
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-blue-600 text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => {
              localStorage.setItem('cardFeesSettings', JSON.stringify(cardFeesSettings));
              alert('Taxas de cartão atualizadas com sucesso!');
            }}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck size={20} /> Salvar Tabela de Taxas
          </button>
        </div>
      </div>

      <div className="max-w-4xl space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell size={24} className="text-emerald-500" />
            Régua de Cobrança e Automação
          </h3>

          <div className="space-y-6">
            {[
              { title: 'Lembrete Preventivo', desc: 'Enviar mensagem 2 dias antes do vencimento via WhatsApp.', active: fiadoSettings.autoNotification },
              { title: 'Aviso de Atraso I', desc: 'Enviar alerta após 1 dia de atraso com valor atualizado.', active: true },
              { title: 'Notificação Jurídica', desc: 'Gerar aviso de protesto após 15 dias de inadimplência.', active: false },
              { title: 'Obrigado pelo Pagamento', desc: 'Enviar agradecimento automático após liquidação do débito.', active: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><MessageCircle size={20} /></div>
                  <div>
                    <p className="font-bold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${item.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.active ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Regras de Encargos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Multa por Atraso (%)</label>
              <input
                type="number"
                value={fiadoSettings.lateFeeRate}
                onChange={e => setFiadoSettings({ ...fiadoSettings, lateFeeRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Juros de Mora (Mensal %)</label>
              <input
                type="number"
                value={fiadoSettings.lateInterestRate}
                onChange={e => setFiadoSettings({ ...fiadoSettings, lateInterestRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
