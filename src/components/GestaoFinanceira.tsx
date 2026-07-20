import React, { useState } from 'react';
import ContasAPagar from './ContasAPagar';
import FluxoCaixa from './FluxoCaixa';
import FechamentoCliente from './FechamentoCliente';
import ConfigFinanceiras from './ConfigFinanceiras';
import { Wallet, TrendingUp, FileText, Settings, ArrowDownCircle } from 'lucide-react';

export default function GestaoFinanceira() {
  const [activeSubTab, setActiveSubTab] = useState('fluxo_caixa');

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
          <ArrowDownCircle size={18} />
          Contas a Pagar / Promissórias
        </button>
        <button
          onClick={() => setActiveSubTab('fechamento')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'fechamento' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <FileText size={18} />
          Fechamento de Cliente
        </button>
        <button
          onClick={() => setActiveSubTab('configuracoes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'configuracoes' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Settings size={18} />
          Configurações (Taxas e Régua)
        </button>
      </div>

      <div className="mt-6">
        {activeSubTab === 'fluxo_caixa' && <FluxoCaixa />}
        {activeSubTab === 'contas_pagar' && <ContasAPagar />}
        {activeSubTab === 'fechamento' && <FechamentoCliente />}
        {activeSubTab === 'configuracoes' && <ConfigFinanceiras />}
      </div>
    </div>
  );
}
