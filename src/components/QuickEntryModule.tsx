import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ShoppingCart, 
  Calendar, 
  CreditCard, 
  Plus, 
  CheckCircle, 
  Trash2, 
  AlertTriangle,
  Package,
  ArrowRight
} from 'lucide-react';

const QuickEntryModule = ({ onSave, formatBRL }: any) => {
  const [inputText, setInputText] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const safeFormat = (val: number) => {
    if (typeof formatBRL === 'function') {
      return formatBRL(val);
    }
    return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const parseInput = () => {
    setIsProcessing(true);
    // Simular processamento (Regex simplificado para estabilidade)
    setTimeout(() => {
      const text = inputText.toLowerCase();
      
      // Extrair valor principal
      const priceMatch = text.match(/(\d+[,.]?\d*)\s*(reais|real|\$|r\$)/i) || text.match(/(reais|real|\$|r\$)\s*(\d+[,.]?\d*)/i);
      let totalValue = 0;
      if (priceMatch) {
         const valStr = priceMatch[1].match(/\d/) ? priceMatch[1] : priceMatch[2];
         totalValue = parseFloat(valStr.replace(',', '.'));
      }

      // Extrair quantidade
      const qtyMatch = text.match(/(\d+)\s*(unidades|un|x|pneus|pneu|pecas|peca)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

      // Extrair parcelas
      const installmentsMatch = text.match(/(\d+)\s*(vezes|x|parcelas|pago em)/i);
      const installments = installmentsMatch ? parseInt(installmentsMatch[1]) : 1;

      // Descrição simples
      const description = inputText.split(/[0-9]/)[0].trim() || "Compra de Oficina";

      const today = new Date();
      const plan = [];
      const installmentValue = totalValue / installments;

      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + (i * 30));
        plan.push({
          installment: i + 1,
          value: installmentValue,
          date: dueDate.toISOString().split('T')[0]
        });
      }

      setPreview({
        description,
        totalValue,
        quantity,
        installments: plan,
        date: today.toISOString().split('T')[0]
      });
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-rose-600 rounded-xl text-white">
            <Package size={28} />
          </div>
          Entrada Estruturada
        </h2>
        <p className="text-slate-500 font-medium">Digitalize suas compras enviando o texto da nota ou descrição informal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Entrada de Texto</span>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
              </div>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: Chegou hoje 5 pneus Levorin para Biz, total de 750 reais. Dividi em 3 vezes no cartão."
              className="w-full h-48 bg-white border-2 border-slate-200 rounded-2xl p-5 text-slate-700 font-medium focus:border-rose-500 outline-none transition-all placeholder:text-slate-300 resize-none shadow-inner"
            />

            <button
              onClick={parseInput}
              disabled={!inputText || isProcessing}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 group overflow-hidden relative"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Processar e Organizar</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="min-h-[400px]">
          {!preview ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                <Send size={32} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold">Aguardando Entrada</h3>
                <p className="text-slate-400 text-sm max-w-[200px]">Os dados estruturados aparecerão aqui após o processamento.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-rose-100 rounded-[2rem] shadow-xl shadow-rose-900/5 overflow-hidden flex flex-col transition-all duration-300">
              <div className="bg-rose-600 p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Dados Extraídos</span>
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-xl font-bold line-clamp-1">{preview.description}</h3>
                <p className="text-white/70 text-sm font-medium">Quantidade: {preview.quantity} unidades</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-white/60 text-sm">Total:</span>
                  <p className="font-black text-white text-2xl">{safeFormat(preview.totalValue)}</p>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black tracking-widest uppercase">
                    <Calendar size={14} />
                    Plano Financeiro
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                    {preview.installments.map((inst: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-rose-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{inst.installment}ª</span>
                          <span className="text-sm font-bold text-slate-700">{new Date(inst.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{safeFormat(inst.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => setPreview(null)}
                    className="flex-1 py-3 border-2 border-slate-100 text-slate-400 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => onSave(preview)}
                    className="flex-[2] py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95"
                  >
                    Confirmar e Salvar no Financeiro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickEntryModule;
