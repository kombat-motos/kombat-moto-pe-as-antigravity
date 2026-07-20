import React from 'react';
import { Package, History, ShoppingBag, Calendar, Trash2 } from 'lucide-react';
import QuickEntryModule from './QuickEntryModule';

interface WorkshopPurchase {
  id: string;
  description: string;
  purchase_date: string;
  total_value: number;
  details?: string;
  installments: any;
}

interface PurchasesTabProps {
  onSave: (data: any) => Promise<void>;
  onDelete: (id: any) => Promise<void>;
  onClearHistory: () => Promise<void>;
  formatBRL: (val: number) => string;
  workshopPurchases: WorkshopPurchase[];
}

const PurchasesTab: React.FC<PurchasesTabProps> = ({ onSave, onDelete, onClearHistory, formatBRL, workshopPurchases }) => {
  return (
    <div key="purchases-module-wrapper" className="space-y-12 pb-20 notranslate" translate="no">
      <QuickEntryModule onSave={onSave} formatBRL={formatBRL} />
      
      {/* Compact Purchases Dashboard */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History size={20} className="text-slate-400" />
            Histórico de Lançamentos
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-sm font-black text-slate-500 uppercase tracking-tighter">
              Total em compras: <span className="text-rose-600 font-black">{formatBRL(workshopPurchases.reduce((acc, p) => acc + (p.total_value || 0), 0))}</span>
            </div>
            {workshopPurchases.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearHistory();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all text-[10px] font-black uppercase tracking-widest border border-rose-100"
              >
                <Trash2 size={12} /> Limpar Histórico
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {workshopPurchases.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
              Nenhuma compra registrada ainda.
            </div>
          ) : (
            workshopPurchases.slice(0, 15).map((purchase) => {
              const insts = typeof purchase.installments === 'string' 
                ? (purchase.installments !== 'null' && purchase.installments !== '[]' ? JSON.parse(purchase.installments) : []) 
                : (purchase.installments || []);
              
              const hasInstallments = Array.isArray(insts) && insts.length > 0;

              return (
                <div key={purchase.id} className="space-y-1">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{purchase.description}</p>
                          {purchase.details && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              {purchase.details}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Lançado em {new Date(purchase.purchase_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-black text-slate-900">{formatBRL(purchase.total_value)}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-300">Entrada Financeira</p>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDelete(purchase.id);
                        }}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                        title="Excluir Registro"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Installments Detail */}
                  {hasInstallments && (
                    <div className="mt-1 ml-14 p-4 bg-white/50 rounded-2xl border border-slate-100/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Calendar size={12} />
                        Plano de Vencimentos
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {insts.map((inst: any, i: number) => (
                          <div key={i} className="flex-none bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">{inst.installment || (i+1)}ª Parcela</p>
                            <p className="text-[11px] font-bold text-slate-700 leading-none mb-1">{new Date(inst.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-[12px] font-black text-rose-600 leading-none">{formatBRL(inst.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {workshopPurchases.length > 15 && (
            <p className="text-center text-xs text-slate-400 font-medium py-2">Mostrando as 15 compras mais recentes.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchasesTab;
