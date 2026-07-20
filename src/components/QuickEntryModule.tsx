import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Calendar, 
  Plus, 
  CheckCircle, 
  Trash2, 
  AlertTriangle,
  Package,
  PlusCircle,
  Truck,
  DollarSign
} from 'lucide-react';

const QuickEntryModule = ({ onSave, formatBRL }: any) => {
  const [description, setDescription] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'Vista' | 'Prazo'>('Vista');
  const [installments, setInstallments] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const safeFormat = (val: number) => {
    if (typeof formatBRL === 'function') {
      return formatBRL(val);
    }
    return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const generateInstallments = () => {
    const val = parseFloat(totalValue.replace(',', '.')) || 0;
    const count = installments;
    const installmentValue = val / count;
    const plan = [];

    const startDate = new Date(purchaseDate);
    for (let i = 0; i < count; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + (i * 30));
      plan.push({
        installment: i + 1,
        value: installmentValue,
        date: dueDate.toISOString().split('T')[0]
      });
    }
    return plan;
  };

  const handleManualSave = async () => {
    if (!description || !totalValue) {
      alert("Por favor, preencha a descrição e o valor.");
      return;
    }

    setIsSaving(true);
    const val = parseFloat(totalValue.replace(',', '.')) || 0;
    const data = {
      description,
      totalValue: val,
      date: purchaseDate,
      details: brand,
      quantity: 1, // Default for manual entries unless we add a qty field
      installments: generateInstallments()
    };

    try {
      await onSave(data);
      // Reset form after save (parent logic might navigate away, but good to reset)
      setDescription('');
      setTotalValue('');
      setBrand('');
      setPaymentType('Vista');
      setInstallments(1);
    } finally {
      setIsSaving(false);
    }
  };

  const previewInstallments = paymentType === 'Prazo' ? generateInstallments() : [];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto notranslate" translate="no">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-rose-600 rounded-xl text-white">
            <Package size={28} />
          </div>
          Entrada Manual de Compras
        </h2>
        <p className="text-slate-500 font-medium">Cadastre as compras de peças da oficina para controle financeiro.</p>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-900/5 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Basic Info Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black tracking-widest uppercase">
            <Truck size={14} />
            Dados da Compra
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Descrição / Fornecedor</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 10 Pneus Biz - Distribuidora X"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-700 font-bold focus:border-rose-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Valor Total</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                  <input
                    type="text"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value.replace(/[^\d.,]/g, ''))}
                    placeholder="0,00"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-slate-700 font-black focus:border-rose-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Data da Compra</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-700 font-bold focus:border-rose-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Marca / Fabricante (Opcional)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Pirelli, Honda, Bosch..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-700 font-bold focus:border-rose-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black tracking-widest uppercase mb-4">
              <DollarSign size={14} />
              Condição de Pagamento
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setPaymentType('Vista'); setInstallments(1); }}
                className={`py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 ${paymentType === 'Vista' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                À Vista
              </button>
              <button
                onClick={() => setPaymentType('Prazo')}
                className={`py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 ${paymentType === 'Prazo' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                Parcelado
              </button>
            </div>

            {paymentType === 'Prazo' && (
              <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                <label className="block text-xs font-black text-amber-700 uppercase tracking-widest">Número de Parcelas</label>
                <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar">
                  {[2, 3, 4, 5, 6, 10, 12].map((n) => (
                    <button
                      key={n}
                      onClick={() => setInstallments(n)}
                      className={`flex-none w-12 h-12 rounded-xl font-black transition-all ${installments === n ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-500 hover:bg-amber-100'}`}
                    >
                      {n}x
                    </button>
                  ))}
                  <div className="flex-none flex items-center px-2">
                    <input
                      type="number"
                      value={installments}
                      onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-white border-2 border-amber-200 rounded-xl px-2 py-1 text-center font-black text-amber-700"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 font-bold">Vencimentos a cada 30 dias a partir da data da compra.</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview and Save Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black tracking-widest uppercase">
            <CheckCircle size={14} />
            Resumo do Lançamento
          </div>

          <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-slate-500 font-medium">Total a pagar:</span>
              <span className="text-3xl font-black text-slate-900">{safeFormat(parseFloat(totalValue.replace(',', '.')) || 0)}</span>
            </div>

            {paymentType === 'Prazo' && (
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {previewInstallments.map((inst: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">{inst.installment}ª</span>
                      <span className="text-sm font-bold text-slate-700">{new Date(inst.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{safeFormat(inst.value)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-6">
              <button
                onClick={handleManualSave}
                disabled={isSaving || !description || !totalValue}
                className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSaving ? (
                   <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Salvar Compra no Financeiro
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700">
             <AlertTriangle size={20} className="shrink-0" />
             <p className="text-xs font-medium">Este lançamento criará registros de saída no seu fluxo financeiro automaticamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEntryModule;
