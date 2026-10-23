// src/components/CentralCobranca.tsx
// CENTRAL INTELIGENTE DE COBRANÇAS V4.0 - KOMBAT MOTO PEÇAS

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, AlertTriangle, Clock, Search, Send, FileText, 
  CheckCircle, Phone, MessageCircle, DollarSign, Handshake, 
  Settings, Download, Layers, Users, ChevronDown, ChevronUp, 
  Printer, ArrowUpDown, Filter, Lock, CheckSquare, Eye 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  CreditNote, CustomerDebtGroup, CobrancaDashboardStats, 
  WhatsAppTemplate, CollectionSettingsV4 
} from './cobranca/types';
import { 
  formatCurrencyBRL, formatDateBR, DEFAULT_WHATSAPP_TEMPLATES 
} from './cobranca/defaultTemplates';
import { 
  generateConsolidatedPDF, generateIndividualPDF 
} from './cobranca/CobrancaPDFGenerator';
import { CobrancaAgrupadaModal } from './cobranca/CobrancaAgrupadaModal';
import { WhatsAppModal } from './cobranca/WhatsAppModal';
import { RegistrarPagamentoModal } from './cobranca/RegistrarPagamentoModal';
import { NegociarDividaModal } from './cobranca/NegociarDividaModal';
import { HistoricoCobrancaModal } from './cobranca/HistoricoCobrancaModal';
import { CobrancaLoteModal } from './cobranca/CobrancaLoteModal';
import { ConfiguracoesCobrancaModal } from './cobranca/ConfiguracoesCobrancaModal';

interface CentralCobrancaProps {
  customers: any[];
  credits: any[];
  sales?: any[];
  companyData?: any;
  currentUser?: any;
  onPrintReceipt?: (sale: any) => void;
  fetchCredits?: () => void;
}

export default function CentralCobranca({
  customers = [],
  credits = [],
  sales = [],
  companyData,
  currentUser,
  onPrintReceipt,
  fetchCredits
}: CentralCobrancaProps) {
  // View mode: 'agrupado' (por cliente) | 'individual' (por nota)
  const [viewMode, setViewMode] = useState<'agrupado' | 'individual'>('agrupado');
  const [filter, setFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'maior_saldo' | 'maior_atraso' | 'vencimento' | 'nome'>('maior_saldo');

  // Backend loaded data
  const [dashboardStats, setDashboardStats] = useState<CobrancaDashboardStats | null>(null);
  const [groupedCustomers, setGroupedCustomers] = useState<CustomerDebtGroup[]>([]);
  const [settings, setSettings] = useState<CollectionSettingsV4 | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Modals
  const [selectedCustomerForGroup, setSelectedCustomerForGroup] = useState<CustomerDebtGroup | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [singleCobrarCustomer, setSingleCobrarCustomer] = useState<CustomerDebtGroup | null>(null);
  const [singleCobrarNotes, setSingleCobrarNotes] = useState<CreditNote[]>([]);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const [paymentCustomer, setPaymentCustomer] = useState<CustomerDebtGroup | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<CreditNote[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [negotiateCustomer, setNegotiateCustomer] = useState<CustomerDebtGroup | null>(null);
  const [negotiateNotes, setNegotiateNotes] = useState<CreditNote[]>([]);
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);

  const [historyCustomer, setHistoryCustomer] = useState<CustomerDebtGroup | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Collapsed state for customer cards in grouped view
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Record<number, boolean>>({});

  // Check role permission
  const userRole = (currentUser?.role || '').toUpperCase();
  const isMecanico = userRole === 'MECANICO' || userRole === 'MECÂNICO';

  // Fetch updated data from Cobrança V4.0 backend
  const loadCobrancaData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Dashboard stats
      const [statsRes, groupedRes, settingsRes] = await Promise.all([
        fetch('/api/collections/dashboard-v4', { headers }),
        fetch('/api/collections/grouped', { headers }),
        fetch('/api/collections/settings-v4', { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData);
      }

      if (groupedRes.ok) {
        const groupedData = await groupedRes.json();
        setGroupedCustomers(groupedData);
      }

      if (settingsRes.ok) {
        const settsData = await settingsRes.json();
        setSettings(settsData);
      }
    } catch (err) {
      console.error("[Central Cobranca Load Error]", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCobrancaData();
  }, []);

  const handleDataRefresh = () => {
    loadCobrancaData();
    if (fetchCredits) fetchCredits();
  };

  // Toggle card expansion
  const toggleCustomerExpand = (customerId: number) => {
    setExpandedCustomerIds(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  // Flattened notes list for individual note view
  const allNotesList = useMemo(() => {
    const list: { note: CreditNote; customer: CustomerDebtGroup }[] = [];
    groupedCustomers.forEach(cust => {
      cust.notes.forEach(note => {
        list.push({ note, customer: cust });
      });
    });
    return list;
  }, [groupedCustomers]);

  // Filtered customers (Grouped View)
  const filteredCustomers = useMemo(() => {
    let list = [...groupedCustomers];

    // Filter pill
    if (filter === 'VENCIDOS') {
      list = list.filter(c => c.has_overdue && c.total_overdue > 0);
    } else if (filter === 'VENCE HOJE') {
      list = list.filter(c => c.notes.some(n => n.is_due_today && n.status !== 'Pago'));
    } else if (filter === 'A VENCER') {
      list = list.filter(c => c.total_upcoming > 0 && c.total_overdue === 0);
    } else if (filter === 'PARCIAIS') {
      list = list.filter(c => c.notes.some(n => n.paid_value > 0 && n.status !== 'Pago'));
    } else if (filter === 'NEGOCIADOS') {
      list = list.filter(c => c.notes.some(n => n.status === 'Negociado' || n.identifier?.includes('ACORDO')));
    } else if (filter === 'QUITADOS') {
      list = list.filter(c => c.notes.every(n => n.status === 'Pago'));
    } else if (filter === 'BLOQUEADOS') {
      list = list.filter(c => c.credit_status?.includes('BLOQUEADO'));
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => 
        (c.customer_name || '').toLowerCase().includes(term) ||
        (c.cpf || '').toLowerCase().includes(term) ||
        (c.whatsapp || '').toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term) ||
        c.notes.some(n => (n.identifier || '').toLowerCase().includes(term))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'maior_saldo') return b.total_balance - a.total_balance;
      if (sortBy === 'maior_atraso') return b.max_overdue_days - a.max_overdue_days;
      if (sortBy === 'nome') return (a.customer_name || '').localeCompare(b.customer_name || '');
      return 0;
    });

    return list;
  }, [groupedCustomers, filter, searchTerm, sortBy]);

  // Filtered notes (Individual View)
  const filteredNotes = useMemo(() => {
    let list = [...allNotesList];

    if (filter === 'VENCIDOS') {
      list = list.filter(i => i.note.is_overdue && i.note.status !== 'Pago');
    } else if (filter === 'VENCE HOJE') {
      list = list.filter(i => i.note.is_due_today && i.note.status !== 'Pago');
    } else if (filter === 'A VENCER') {
      list = list.filter(i => !i.note.is_overdue && !i.note.is_due_today && i.note.status !== 'Pago');
    } else if (filter === 'PARCIAIS') {
      list = list.filter(i => i.note.paid_value > 0 && i.note.status !== 'Pago');
    } else if (filter === 'NEGOCIADOS') {
      list = list.filter(i => i.note.status === 'Negociado' || i.note.identifier?.includes('ACORDO'));
    } else if (filter === 'QUITADOS') {
      list = list.filter(i => i.note.status === 'Pago');
    } else if (filter === 'BLOQUEADOS') {
      list = list.filter(i => i.customer.credit_status?.includes('BLOQUEADO'));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(i => 
        (i.customer.customer_name || '').toLowerCase().includes(term) ||
        (i.customer.cpf || '').toLowerCase().includes(term) ||
        (i.note.identifier || '').toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'maior_saldo') return (b.note.balance || b.note.original_value) - (a.note.balance || a.note.original_value);
      if (sortBy === 'maior_atraso') return b.note.days_overdue - a.note.days_overdue;
      if (sortBy === 'vencimento') return new Date(a.note.due_date).getTime() - new Date(b.note.due_date).getTime();
      return (a.customer.customer_name || '').localeCompare(b.customer.customer_name || '');
    });

    return list;
  }, [allNotesList, filter, searchTerm, sortBy]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = filteredNotes.map(item => ({
        'Cliente': item.customer.customer_name,
        'CPF / CNPJ': item.customer.cpf,
        'WhatsApp': item.customer.whatsapp || item.customer.phone,
        'Identificador da Nota': item.note.identifier || item.note.id,
        'Data Venda': formatDateBR(item.note.sale_date),
        'Vencimento': formatDateBR(item.note.due_date),
        'Valor Original (R$)': item.note.original_value,
        'Valor Pago (R$)': item.note.paid_value || 0,
        'Saldo Devedor (R$)': item.note.balance,
        'Dias de Atraso': Math.max(0, item.note.days_overdue),
        'Situação': item.note.status === 'Pago' ? 'Quitada' : item.note.is_overdue ? 'Vencida' : 'A Vencer',
        'Status do Crédito': item.customer.credit_status
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contas_a_Receber');
      
      const fileName = `cobrancas_kombat_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao exportar Excel.');
    }
  };

  // Open multi-note modal for a specific customer
  const handleOpenGroupModal = (customer: CustomerDebtGroup) => {
    setSelectedCustomerForGroup(customer);
    setIsGroupModalOpen(true);
  };

  // Single note collection via WhatsApp
  const handleCobrarSingleNote = (customer: CustomerDebtGroup, note: CreditNote) => {
    setSingleCobrarCustomer(customer);
    setSingleCobrarNotes([note]);
    setIsWhatsAppModalOpen(true);
  };

  // Single note payment
  const handlePaymentSingleNote = (customer: CustomerDebtGroup, note: CreditNote) => {
    setPaymentCustomer(customer);
    setPaymentNotes([note]);
    setIsPaymentModalOpen(true);
  };

  // If user is Mecânico, block financial screen
  if (isMecanico) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Acesso Financeiro Restrito</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          O perfil de <strong>Mecânico</strong> não possui autorização para consultar saldos financeiros e dívidas de clientes. Caso necessite de acesso, solicite autorização a um Administrador ou Gerente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-500">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                  Central Inteligente de Cobranças V4.0
                </h1>
                <span className="text-[10px] bg-rose-600/20 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  KOMBAT MOTO PEÇAS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Gestão financeira de contas a receber, cobrança agrupada e recuperação de crédito.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all border-b-2 border-rose-800 active:scale-95"
          >
            <Send size={15} />
            COBRAR EM LOTE
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            title="Exportar base filtrada em planilha Excel"
          >
            <Download size={15} />
            Excel
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            title="Configurações da Central: Régua, Pix e Mensagens"
          >
            <Settings size={15} />
            Configurações
          </button>
        </div>
      </div>

      {/* DASHBOARD INDICATORS (9 KPI CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Geral a Receber */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total a Receber</p>
          <p className="text-lg font-black text-white mt-1">
            {formatCurrencyBRL(dashboardStats?.totalReceivable || 0)}
          </p>
          <span className="text-[10px] text-slate-400">Total de títulos em aberto</span>
        </div>

        {/* 2. Total Vencido */}
        <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-900/40 shadow-sm">
          <p className="text-[10px] uppercase font-black text-rose-400 tracking-wider">Total Vencido</p>
          <p className="text-lg font-black text-rose-400 mt-1">
            {formatCurrencyBRL(dashboardStats?.totalOverdue || 0)}
          </p>
          <span className="text-[10px] text-rose-300/70">Em atraso no crediário</span>
        </div>

        {/* 3. Total a Vencer */}
        <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-900/30 shadow-sm">
          <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Total a Vencer</p>
          <p className="text-lg font-black text-amber-300 mt-1">
            {formatCurrencyBRL(dashboardStats?.totalUpcoming || 0)}
          </p>
          <span className="text-[10px] text-amber-400/70">Vencimento futuro</span>
        </div>

        {/* 4. Total Recebido no Mês */}
        <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-900/40 shadow-sm">
          <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Recebido no Mês</p>
          <p className="text-lg font-black text-emerald-400 mt-1">
            {formatCurrencyBRL(dashboardStats?.totalMonthReceived || 0)}
          </p>
          <span className="text-[10px] text-emerald-300/70">Baixas financeiras</span>
        </div>

        {/* 5. Inadimplentes */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Inadimplentes</p>
          <p className="text-lg font-black text-white mt-1">
            {dashboardStats?.overdueCustomersCount || 0} <span className="text-xs font-normal text-slate-400">clientes</span>
          </p>
          <span className="text-[10px] text-slate-400">Com débitos vencidos</span>
        </div>

        {/* 6. Cobranças Enviadas */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cobranças Enviadas</p>
          <p className="text-lg font-black text-white mt-1">
            {dashboardStats?.collectionsSentCount || 0} <span className="text-xs font-normal text-slate-400">envios</span>
          </p>
          <span className="text-[10px] text-slate-400">Registros confirmados</span>
        </div>

        {/* 7. Valores Recuperados */}
        <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/30 shadow-sm">
          <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Valores Recuperados</p>
          <p className="text-lg font-black text-emerald-300 mt-1">
            {formatCurrencyBRL(dashboardStats?.recoveredAmount || 0)}
          </p>
          <span className="text-[10px] text-emerald-400/70">Após acionamento</span>
        </div>

        {/* 8. Clientes Bloqueados */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-rose-400 tracking-wider">Crédito Bloqueado</p>
          <p className="text-lg font-black text-white mt-1">
            {dashboardStats?.blockedCustomersCount || 0} <span className="text-xs font-normal text-slate-400">clientes</span>
          </p>
          <span className="text-[10px] text-slate-400">&gt;30 dias de atraso</span>
        </div>

        {/* 9. Taxa de Recuperação */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm sm:col-span-2 lg:col-span-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Taxa de Recuperação</p>
            <span className="text-xs font-black text-emerald-400">{dashboardStats?.recoveryRate || 0}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, dashboardStats?.recoveryRate || 0)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>Eficiência das cobranças enviadas</span>
            <span>Meta: 75%</span>
          </div>
        </div>
      </div>

      {/* FILTER PILLS & SEARCH BAR */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        {/* Filter buttons */}
        <div className="flex gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: 'TODOS', label: 'TODOS' },
            { id: 'VENCIDOS', label: 'VENCIDOS' },
            { id: 'VENCE HOJE', label: 'VENCE HOJE' },
            { id: 'A VENCER', label: 'A VENCER' },
            { id: 'PARCIAIS', label: 'PARCIAIS' },
            { id: 'NEGOCIADOS', label: 'NEGOCIADOS' },
            { id: 'QUITADOS', label: 'QUITADOS' },
            { id: 'BLOQUEADOS', label: 'BLOQUEADOS' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search, Sort and View Toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente, CPF, nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="maior_saldo">Maior Dívida</option>
            <option value="maior_atraso">Maior Atraso</option>
            <option value="vencimento">Vencimento</option>
            <option value="nome">Nome A-Z</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('agrupado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'agrupado'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              Por Cliente
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'individual'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              Por Nota
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      {viewMode === 'agrupado' ? (
        /* ================================================= */
        /* VISÃO AGRUPADA POR CLIENTE (DESTAQUE PRIORITÁRIO) */
        /* ================================================= */
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 font-medium">Carregando central de cobrança...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
              Nenhum cliente ou débito localizado para este filtro.
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const isExpanded = !!expandedCustomerIds[customer.customer_id];
              const isBlocked = customer.credit_status?.includes('BLOQUEADO');
              const unpaidNotes = customer.notes.filter(n => n.status !== 'Pago');

              return (
                <div 
                  key={customer.customer_id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all shadow-md overflow-hidden"
                >
                  {/* Card Header Bar */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Customer identity */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-black text-white text-base tracking-tight">{customer.customer_name}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isBlocked ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        }`}>
                          {customer.credit_status}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                          {unpaidNotes.length} nota{unpaidNotes.length > 1 ? 's' : ''} em aberto
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                        <span>WhatsApp: <strong className="text-emerald-400">{customer.whatsapp || customer.phone || 'Sem telefone'}</strong></span>
                        <span>CPF/CNPJ: <strong className="text-slate-300">{customer.cpf || 'Não informado'}</strong></span>
                        {customer.has_overdue && (
                          <span className="text-rose-400 font-bold">
                            &bull; Maior atraso: {customer.max_overdue_days} dias
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial stats and Primary Action */}
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Geral Pendente</span>
                        <p className="text-2xl font-black text-rose-400">
                          {formatCurrencyBRL(customer.total_balance)}
                        </p>
                      </div>

                      {/* Main Group Button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenGroupModal(customer)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-all border-b-2 border-rose-800 active:scale-95"
                        >
                          <Layers size={15} />
                          COBRAR TODAS AS NOTAS
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCustomerExpand(customer.customer_id)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title={isExpanded ? 'Recolher notas' : 'Expandir notas deste cliente'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Notes Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5 animate-in fade-in duration-150 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Demonstrativo das notas de {customer.customer_name}:
                        </span>
                        <button
                          type="button"
                          onClick={() => generateConsolidatedPDF(customer, unpaidNotes, companyData, settings?.pix_key)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                        >
                          <Printer size={13} /> Imprimir Demonstrativo Consolidado
                        </button>
                      </div>

                      <div className="space-y-2">
                        {customer.notes.map(note => {
                          const bal = note.balance > 0 ? note.balance : note.original_value;
                          const isPaid = note.status === 'Pago';

                          return (
                            <div 
                              key={note.id}
                              className="p-3 rounded-xl border border-slate-800 bg-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="font-bold text-xs text-white">{note.identifier || `#${note.id}`}</span>
                                  <span className="text-xs text-slate-400 ml-2">Venc: {formatDateBR(note.due_date)}</span>
                                  {note.is_overdue && (
                                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold ml-2">
                                      {Math.abs(note.days_overdue)}d atraso
                                    </span>
                                  )}
                                  {note.is_due_today && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold ml-2">
                                      Vence Hoje
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo</span>
                                  <span className="font-black text-sm text-rose-400">{formatCurrencyBRL(bal)}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleCobrarSingleNote(customer, note)}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                    title="Cobrar esta nota individualmente"
                                  >
                                    <Send size={14} />
                                  </button>
                                  <button
                                    onClick={() => generateIndividualPDF(customer, note, companyData, settings?.pix_key)}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                    title="Gerar PDF desta nota"
                                  >
                                    <FileText size={14} />
                                  </button>
                                  <button
                                    onClick={() => handlePaymentSingleNote(customer, note)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs transition-colors"
                                    title="Registrar pagamento desta nota"
                                  >
                                    Pagar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* =================================================== */
        /* VISÃO INDIVIDUAL POR NOTA (TABELA DETALHADA)        */
        /* =================================================== */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-3.5">Nota / Venda</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Telefone WhatsApp</th>
                <th className="p-3.5">Data Compra</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5 text-right">Valor Original</th>
                <th className="p-3.5 text-right">Já Pago</th>
                <th className="p-3.5 text-right">Saldo Devedor</th>
                <th className="p-3.5 text-center">Atraso</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500">
                    Nenhuma nota localizada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredNotes.map(({ note, customer }) => {
                  const bal = note.balance > 0 ? note.balance : note.original_value;
                  const isPaid = note.status === 'Pago';

                  return (
                    <tr key={note.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-white">{note.identifier || `#${note.id}`}</td>
                      <td className="p-3.5 font-bold text-white">
                        {customer.customer_name}
                        {customer.credit_status?.includes('BLOQUEADO') && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded ml-2 font-bold">
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-emerald-400 font-medium">{customer.whatsapp || customer.phone || 'Sem telefone'}</td>
                      <td className="p-3.5 text-slate-400">{formatDateBR(note.sale_date)}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-300">{formatDateBR(note.due_date)}</span>
                        {note.is_due_today && <span className="text-[10px] text-amber-400 font-bold block">Vence Hoje</span>}
                      </td>
                      <td className="p-3.5 text-right text-slate-300 font-medium">{formatCurrencyBRL(note.original_value)}</td>
                      <td className="p-3.5 text-right text-emerald-400">{formatCurrencyBRL(note.paid_value || 0)}</td>
                      <td className="p-3.5 text-right font-black text-rose-400 text-sm">{formatCurrencyBRL(bal)}</td>
                      <td className="p-3.5 text-center">
                        {isPaid ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">Quitada</span>
                        ) : note.is_overdue ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                            {Math.abs(note.days_overdue)}d
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Em dia</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCobrarSingleNote(customer, note)}
                            className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition-colors"
                            title="Cobrar Nota via WhatsApp"
                          >
                            <Send size={13} />
                          </button>
                          <button
                            onClick={() => generateIndividualPDF(customer, note, companyData, settings?.pix_key)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Gerar PDF"
                          >
                            <FileText size={13} />
                          </button>
                          <button
                            onClick={() => handlePaymentSingleNote(customer, note)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 transition-colors"
                            title="Registrar Pagamento"
                          >
                            <DollarSign size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setHistoryCustomer(customer);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Histórico"
                          >
                            <Clock size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ALL MODALS INTEGRATED */}
      <CobrancaAgrupadaModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        customer={selectedCustomerForGroup}
        companyData={companyData}
        currentUser={currentUser}
        customTemplates={settings?.whatsapp_templates ? (typeof settings.whatsapp_templates === 'string' ? JSON.parse(settings.whatsapp_templates) : settings.whatsapp_templates) : undefined}
        pixKey={settings?.pix_key}
        onDataRefresh={handleDataRefresh}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        customer={singleCobrarCustomer}
        selectedNotes={singleCobrarNotes}
        customTemplates={settings?.whatsapp_templates ? (typeof settings.whatsapp_templates === 'string' ? JSON.parse(settings.whatsapp_templates) : settings.whatsapp_templates) : undefined}
        pixKey={settings?.pix_key}
        initialTemplateCode="B"
        onCollectionLogged={handleDataRefresh}
      />

      <RegistrarPagamentoModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={paymentCustomer}
        selectedNotes={paymentNotes}
        currentUser={currentUser}
        companyData={companyData}
        onPaymentSuccess={handleDataRefresh}
      />

      <NegociarDividaModal
        isOpen={isNegotiateModalOpen}
        onClose={() => setIsNegotiateModalOpen(false)}
        customer={negotiateCustomer}
        selectedNotes={negotiateNotes}
        companyData={companyData}
        onNegotiationSuccess={handleDataRefresh}
      />

      <HistoricoCobrancaModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        customer={historyCustomer}
      />

      <CobrancaLoteModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        customersWithDebts={groupedCustomers}
        customTemplates={settings?.whatsapp_templates ? (typeof settings.whatsapp_templates === 'string' ? JSON.parse(settings.whatsapp_templates) : settings.whatsapp_templates) : undefined}
        pixKey={settings?.pix_key}
        onBatchComplete={handleDataRefresh}
      />

      <ConfiguracoesCobrancaModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSaved={handleDataRefresh}
      />
    </div>
  );
}
