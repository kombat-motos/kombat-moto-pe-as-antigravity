import React, { useState } from 'react';
import ContasAPagar from './ContasAPagar';
import { Wallet, TrendingUp, ShoppingBag, Receipt } from 'lucide-react';

export default function GestaoFinanceira() {
  const [activeSubTab, setActiveSubTab] = useState('contas_pagar');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('fluxo_caixa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'fluxo_caixa' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <TrendingUp size={18} />
          Fluxo de Caixa
        </button>
        <button
          onClick={() => setActiveSubTab('contas_pagar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'contas_pagar' 
              ? 'bg-rose-100 text-rose-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Wallet size={18} />
          Contas a Pagar
        </button>
        <button
          onClick={() => setActiveSubTab('compras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'compras' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag size={18} />
          Compras
        </button>
        <button
          onClick={() => setActiveSubTab('boletos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'boletos' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Receipt size={18} />
          Boletos
        </button>
      </div>

      <div className="mt-6">
        {activeSubTab === 'fluxo_caixa' && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-700">Fluxo de Caixa</h3>
            <p>Módulo em desenvolvimento...</p>
          </div>
        )}
        {activeSubTab === 'contas_pagar' && <ContasAPagar />}
        {activeSubTab === 'compras' && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-700">Compras</h3>
            <p>Módulo em desenvolvimento...</p>
          </div>
        )}
        {activeSubTab === 'boletos' && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            <Receipt size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-700">Boletos Cadastrados</h3>
            <p>Módulo em desenvolvimento...</p>
          </div>
        )}
      </div>
    </div>
  );
}
