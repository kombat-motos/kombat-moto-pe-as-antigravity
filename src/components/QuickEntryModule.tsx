import React, { useState } from 'react';
import { Calculator, Calendar, PlusCircle, Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const QuickEntryModule = ({ onSave, formatBRL }: any) => {
    const [rawText, setRawText] = useState('');
    const [preview, setPreview] = useState<any>(null);

    const parseEntry = (text: string) => {
        // Default values
        let data = {
            description: "Compra Indefinida",
            date: "08/04/2026",
            totalValue: 0,
            quantity: 1,
            unitValue: 0,
            installments: [] as any[]
        };

        const lowerText = text.toLowerCase();

        // 1. Extract Quantity & Description
        // Pattern: "5 pneus Levorin para Biz"
        const qtyMatch = text.match(/(\d+)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)(?=\s+para|\s+total|\s+de|\s+dividi|$)/i);
        if (qtyMatch) {
            data.quantity = parseInt(qtyMatch[1]);
            data.description = qtyMatch[2].trim();
        }

        // 2. Extract Total Value
        // Pattern: "total de 750 reais" or "750 reais" or "R$ 750"
        const totalMatch = text.match(/(?:total\s+de\s+|total\s+)?(?:R\$\s*)?([\d.,]+)\s*(?:reais|)?/i);
        if (totalMatch) {
            data.totalValue = parseFloat(totalMatch[1].replace('.', '').replace(',', '.'));
        }

        // 3. Extract Installments
        // Pattern: "dividi em 3 vezes"
        const instMatch = text.match(/dividi\s+em\s+(\d+)\s+vezes/i);
        const numInst = instMatch ? parseInt(instMatch[1]) : 1;

        // 4. Extract Date
        if (lowerText.includes('hoje')) {
            data.date = "08/04/2026";
        } else if (lowerText.includes('ontem')) {
            data.date = "07/04/2026";
        } else {
            const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
            if (dateMatch) data.date = dateMatch[1];
        }

        // Calculations
        data.unitValue = data.totalValue / data.quantity;
        
        const instValue = data.totalValue / numInst;
        
        // Parse date for building installment schedule
        const [day, month, year] = data.date.split('/').map(Number);
        const baseDate = new Date(year || 2026, (month || 4) - 1, day || 8);

        for (let i = 0; i < numInst; i++) {
            const d = new Date(baseDate);
            d.setMonth(baseDate.getMonth() + i);
            data.installments.push({
                index: i + 1,
                value: instValue,
                date: d.toLocaleDateString('pt-BR')
            });
        }

        return data;
    };

    const handleProcess = () => {
        if (!rawText.trim()) return;
        const result = parseEntry(rawText);
        setPreview(result);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-rose-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <Calculator size={18} className="text-rose-600" />
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-700">Módulo de Entrada Inteligente</h3>
                </div>
                
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Descreva a Compra (Linguagem Natural)</label>
                <textarea 
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder='Ex: "Chegou hoje 5 pneus Levorin para Biz, total de 750 reais. Dividi em 3 vezes no boleto pro fornecedor."'
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium text-slate-700 shadow-inner"
                />
                
                <div className="flex gap-2">
                    <button 
                       onClick={handleProcess}
                       className="mt-4 flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                    >
                        <Calculator size={18} strokeWidth={3} />
                        Processar e Organizar
                    </button>
                    <button 
                       onClick={() => { setRawText(''); setPreview(null); }}
                       className="mt-4 p-4 bg-slate-200 text-slate-500 rounded-2xl hover:bg-slate-300 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {preview && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <PlusCircle size={120} className="text-rose-600" />
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex flex-col">
                                <h4 className="font-black text-slate-900 uppercase text-sm tracking-tighter">Entrada Estruturada</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Kombat Moto Peças v1.0</p>
                            </div>
                            <div className="bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                                <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                                    <Calendar size={12} /> {preview.date}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">COMPRA (Peça/Fornecedor)</p>
                                <p className="font-bold text-slate-800 text-lg uppercase">{preview.description}</p>
                            </div>
                            <div className="p-4 bg-rose-600 rounded-2xl shadow-lg shadow-rose-100">
                                <p className="text-[10px] uppercase font-black text-rose-200 mb-1">VALOR TOTAL</p>
                                <p className="font-black text-white text-2xl">{formatBRL(preview.totalValue)}</p>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-900 rounded-2xl text-white">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-[0.2em]">Detalhamento de Itens</p>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-black text-rose-400">
                                   DETALHES: {preview.quantity}x {preview.description}
                                </p>
                                <p className="text-xs font-bold text-slate-400">
                                   Unid: {formatBRL(preview.unitValue)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Plano Financeiro</p>
                                <div className="h-[1px] flex-1 bg-slate-100 mx-4"></div>
                             </div>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {preview.installments.map((inst: any) => (
                                    <div key={inst.index} className="p-3 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Parcela {inst.index}</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                        </div>
                                        <p className="text-sm font-black text-slate-800">{formatBRL(inst.value)}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{inst.date}</p>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <button 
                            onClick={() => onSave(preview)}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 mt-4"
                        >
                            <Send size={18} className="text-rose-500" />
                            Confirmar e Salvar no Financeiro
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickEntryModule;
