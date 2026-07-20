import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Search, AlertCircle } from 'lucide-react';

interface Quote {
  id: number;
  customer_name: string;
  total_value: number;
  status: string;
  created_at: string;
}

interface WorkshopService {
  id: number;
  customer_name: string;
  service_requested: string;
  mechanic_name?: string;
  status: string;
  entry_date: string;
  total_value?: number;
}

interface Atendimento {
  id: number;
  status: string;
  last_contact: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  interest?: string;
  status: string;
  created_at: string;
}

interface CRMRelatoriosProps {
  orcamentos: Quote[];
  services: WorkshopService[];
  atendimentos: Atendimento[];
  leads: Lead[];
  formatBRL: (v: number) => string;
}

type Period = 'hoje' | '7dias' | 'mes_atual' | 'mes_anterior' | 'personalizado';

export default function CRMRelatorios({
  orcamentos,
  services,
  atendimentos,
  leads,
  formatBRL
}: CRMRelatoriosProps) {
  const [period, setPeriod] = useState<Period>('mes_atual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Date filtering logic
  const filterByDate = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    
    if (period === 'hoje') {
      return date.toDateString() === now.toDateString();
    } else if (period === '7dias') {
      const diff = now.getTime() - date.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'mes_atual') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (period === 'mes_anterior') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    } else if (period === 'personalizado') {
      if (!startDate || !endDate) return true;
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      return date >= s && date <= e;
    }
    return true;
  };

  // Filtered Datasets
  const fQuotes = orcamentos.filter(q => filterByDate(q.created_at));
  const fServices = services.filter(s => filterByDate(s.entry_date));
  const fAtendimentos = atendimentos.filter(a => filterByDate(a.last_contact));
  const fLeads = leads.filter(l => filterByDate(l.created_at));

  // 1. Calculations
  const totalAtendimentos = fAtendimentos.length;
  const totalOrcamentosEnviados = fQuotes.length;
  const orcamentosAprovados = fQuotes.filter(q => q.status === 'Aprovado' || q.status === 'Finalizado').length;
  const orcamentoApprovalRate = totalOrcamentosEnviados > 0 
    ? (orcamentosAprovados / totalOrcamentosEnviados) * 100 
    : 0;

  // Total sales estimation in period
  const totalSales = fQuotes.filter(q => q.status === 'Aprovado' || q.status === 'Finalizado')
    .reduce((acc, curr) => acc + curr.total_value, 0) + 
    fServices.filter(s => s.status === 'Finalizado' || s.status === 'Entregue')
    .reduce((acc, curr) => acc + (curr.total_value || 0), 0);

  // 2. Top Clients (frequency)
  const clientFrequency: Record<string, number> = {};
  fQuotes.forEach(q => {
    clientFrequency[q.customer_name] = (clientFrequency[q.customer_name] || 0) + q.total_value;
  });
  const topClients = Object.entries(clientFrequency)
    .map(([name, val]) => ({ name, value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 3. Top Products most wanted (extracted from leads/quotes interest text)
  const productFrequency: Record<string, number> = {};
  fLeads.forEach(l => {
    if (l.interest) {
      const words = l.interest.split(/[,\s/]+/);
      words.forEach(w => {
        if (w.length > 3) {
          const word = w.toLowerCase().trim();
          productFrequency[word] = (productFrequency[word] || 0) + 1;
        }
      });
    }
  });
  const topProducts = Object.entries(productFrequency)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Most Performed Services
  const servicesFrequency: Record<string, number> = {};
  fServices.forEach(s => {
    if (s.service_requested) {
      servicesFrequency[s.service_requested] = (servicesFrequency[s.service_requested] || 0) + 1;
    }
  });
  const topServices = Object.entries(servicesFrequency)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Mechanic services leaderboard
  const mechanicLeaderboard: Record<string, number> = {};
  fServices.forEach(s => {
    if (s.mechanic_name) {
      mechanicLeaderboard[s.mechanic_name] = (mechanicLeaderboard[s.mechanic_name] || 0) + 1;
    }
  });
  const topMechanics = Object.entries(mechanicLeaderboard)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 6. Lost leads & mock reasons
  const lostLeads = fLeads.filter(l => l.status === 'Perdido');
  const mockLossReasons = [
    'Preço muito alto',
    'Cliente não respondeu follow-up',
    'Prazo de entrega muito longo',
    'Falta de peça no estoque',
    'Decidiu comprar em outra loja'
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Date Filter Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-rose-600" size={18} />
          <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Período de Análise</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          {(['hoje', '7dias', 'mes_atual', 'mes_anterior', 'personalizado'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                period === p 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-100 dark:shadow-none' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {p === 'hoje' ? 'Hoje' :
               p === '7dias' ? 'Últimos 7 dias' :
               p === 'mes_atual' ? 'Mês Atual' :
               p === 'mes_anterior' ? 'Mês Anterior' :
               'Personalizado'}
            </button>
          ))}

          {period === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-800 outline-none"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-800 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atendimentos no Período</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalAtendimentos}</h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full font-bold text-slate-500">Chats</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos Enviados</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalOrcamentosEnviados}</h3>
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full font-bold text-amber-600">Total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Aprovação</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-black text-emerald-600">{orcamentoApprovalRate.toFixed(1)}%</h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-bold text-emerald-600">Aprovados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Estimado</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-lg font-black text-rose-600">{formatBRL(totalSales)}</h3>
            <span className="text-[10px] bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full font-bold text-rose-600">OS + Vendas</span>
          </div>
        </div>
      </div>

      {/* Detailed charts lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top selling clients */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
            <Users size={16} className="text-rose-500" />
            <span>Melhores Clientes (Faturamento)</span>
          </h4>
          <div className="space-y-3">
            {topClients.map((client, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-300 w-4">#{idx+1}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{client.name}</span>
                </div>
                <span className="font-black text-rose-600">{formatBRL(client.value)}</span>
              </div>
            ))}
            {topClients.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum dado de faturamento no período.</p>
            )}
          </div>
        </div>

        {/* Most Performative Mechanics */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
            <TrendingUp size={16} className="text-rose-500" />
            <span>Mecânicos mais Produtivos (Serviços)</span>
          </h4>
          <div className="space-y-3">
            {topMechanics.map((mech, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-300 w-4">#{idx+1}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{mech.name}</span>
                </div>
                <span className="font-black text-slate-600 dark:text-slate-400">{mech.count} OS finalizadas</span>
              </div>
            ))}
            {topMechanics.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum serviço realizado por mecânicos no período.</p>
            )}
          </div>
        </div>

        {/* Products Most Wanted (from leads) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
            <BarChart3 size={16} className="text-rose-500" />
            <span>Peças/Acessórios mais procurados</span>
          </h4>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{idx + 1}. {p.name}</span>
                <span className="font-black text-rose-600">{p.count} consultas</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum dado de interesse de peças no período.</p>
            )}
          </div>
        </div>

        {/* Most Performed Services */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
            <BarChart3 size={16} className="text-rose-500" />
            <span>Serviços de Oficina mais realizados</span>
          </h4>
          <div className="space-y-3">
            {topServices.map((srv, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{idx + 1}. {srv.name}</span>
                <span className="font-black text-rose-600">{srv.count} vezes</span>
              </div>
            ))}
            {topServices.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum serviço registrado no período.</p>
            )}
          </div>
        </div>

        {/* Lost Leads and reasons */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 lg:col-span-2 space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
            <AlertCircle className="text-rose-500" size={16} />
            <span>Leads Perdidos e Motivo de Perda</span>
          </h4>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {lostLeads.map((lead, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase">{lead.name}</h5>
                  <p className="text-[10px] text-slate-400">Interesse: {lead.interest || 'Peça'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full dark:bg-rose-950/30">
                    {mockLossReasons[idx % mockLossReasons.length]}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Valor: {formatBRL(lead.value)}</p>
                </div>
              </div>
            ))}
            {lostLeads.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum lead perdido registrado no período. Excelente!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
