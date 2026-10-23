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

const normalizeSearch = (str: string) => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const cleanDigits = (str: string) => (str || '').replace(/\D/g, '');

const ALIAS_MAP: Record<string, string[]> = {
  'juninho': ['junior', 'júnior', 'jr'],
  'junior': ['juninho', 'jr'],
  'ze': ['jose', 'josé'],
  'jose': ['ze', 'zé'],
  'beto': ['roberto'],
  'roberto': ['beto'],
  'chico': ['francisco'],
  'francisco': ['chico'],
  'tonho': ['antonio', 'antônio'],
  'antonio': ['tonho'],
  'neto': ['netto']
};

function buildGroupedFromProps(credits: any[], customers: any[], sales: any[]): CustomerDebtGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const customerMap = new Map<number, CustomerDebtGroup>();
  const customerById = new Map<number, any>();
  (customers || []).forEach(c => {
    if (c.id) customerById.set(Number(c.id), c);
  });

  const salesById = new Map<string, any>();
  (sales || []).forEach(s => {
    if (s.id) salesById.set(String(s.id), s);
  });

  (credits || []).forEach(cr => {
    const cust = customerById.get(Number(cr.customer_id)) || {};
    const sale = cr.sale_id ? salesById.get(String(cr.sale_id)) : null;

    const originalVal = Number(cr.original_value || 0);
    const paidVal = Number(cr.paid_value || 0);
    const balance = Math.max(0, Number((originalVal - paidVal).toFixed(2)));

    let diffDays = 0;
    let isOverdue = false;
    let isDueToday = false;
    if (cr.due_date) {
      const parts = String(cr.due_date).split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        d.setHours(0, 0, 0, 0);
        diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        isOverdue = diffDays > 0;
        isDueToday = diffDays === 0;
      }
    }

    const noteObj: CreditNote = {
      id: cr.id,
      sale_id: cr.sale_id,
      identifier: cr.identifier || `NOTA-${cr.id}`,
      original_value: originalVal,
      paid_value: paidVal,
      balance: balance,
      due_date: cr.due_date,
      sale_date: cr.sale_date || (sale ? sale.date : '') || cr.created_at,
      status: cr.status || 'Pendente',
      collection_status: cr.collection_status || 'PENDENTE',
      last_collection_at: cr.last_collection_at,
      next_collection_at: cr.next_collection_at,
      promise_date: cr.promise_date,
      promise_amount: cr.promise_amount,
      parcel_number: cr.parcel_number || 1,
      total_parcels: cr.total_parcels || 1,
      moto_details: cr.moto_details || (sale ? sale.moto_details : '') || '',
      days_overdue: diffDays,
      is_overdue: isOverdue,
      is_due_today: isDueToday
    };

    const cId = Number(cr.customer_id);
    if (!cId) return;

    if (!customerMap.has(cId)) {
      customerMap.set(cId, {
        customer_id: cId,
        customer_name: cr.customer_name || cust.name || 'Cliente Sem Nome',
        nickname: cust.nickname || '',
        whatsapp: cust.whatsapp || cr.whatsapp || '',
        phone: cust.whatsapp || cr.whatsapp || '',
        cpf: cust.cpf || cust.cnpj || cr.cpf || '',
        address: cust.address || '',
        neighborhood: cust.neighborhood || cr.neighborhood || '',
        city: cust.city || 'Andirá - PR',
        credit_status: cust.credit_status || 'LIBERADO',
        credit_limit: cust.credit_limit || 0,
        credit_block_reason: cust.credit_block_reason || '',
        notes: [],
        total_original: 0,
        total_paid: 0,
        total_balance: 0,
        total_overdue: 0,
        total_upcoming: 0,
        max_overdue_days: 0,
        has_overdue: false,
        open_notes_count: 0
      });
    }

    const cGroup = customerMap.get(cId)!;
    cGroup.notes.push(noteObj);

    if (cr.status === 'Aberto' || cr.status === 'Pendente' || cr.status === 'Atrasado') {
      cGroup.total_original += originalVal;
      cGroup.total_paid += paidVal;
      cGroup.total_balance += balance;
      cGroup.open_notes_count++;

      if (isOverdue) {
        cGroup.total_overdue += balance;
        cGroup.has_overdue = true;
        if (diffDays > cGroup.max_overdue_days) {
          cGroup.max_overdue_days = diffDays;
        }
      } else {
        cGroup.total_upcoming += balance;
      }
    }
  });

  // Also include sales that are fiado/pendente but not yet in credits
  const existingSaleIds = new Set<string>();
  (credits || []).forEach(cr => {
    if (cr.sale_id) existingSaleIds.add(String(cr.sale_id));
  });

  (sales || []).forEach(s => {
    if (s.id && !existingSaleIds.has(String(s.id))) {
      const isPending = s.payment_status === 'Pendente' || s.payment_method === 'Fiado' || s.charge_type === 'credito_30_dias';
      const bal = Number((s.total || 0) - (s.paid_total || 0));
      if (isPending && bal > 0 && s.customer_id) {
        const cust = customerById.get(Number(s.customer_id)) || {};
        let diffDays = 0;
        let isOverdue = false;
        let isDueToday = false;
        if (s.due_date) {
          const parts = String(s.due_date).split('-');
          if (parts.length === 3) {
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            d.setHours(0, 0, 0, 0);
            diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            isOverdue = diffDays > 0;
            isDueToday = diffDays === 0;
          }
        }

        const noteObj: CreditNote = {
          id: -Math.abs(Number(String(s.id).replace(/\D/g, '') || Math.floor(Math.random() * 100000))),
          sale_id: String(s.id),
          identifier: `VENDA-${String(s.id).substring(0, 8).toUpperCase()}`,
          original_value: Number(s.total || 0),
          paid_value: Number(s.paid_total || 0),
          balance: bal,
          due_date: s.due_date || new Date().toISOString().split('T')[0],
          sale_date: s.date || '',
          status: 'Pendente',
          collection_status: 'PENDENTE',
          parcel_number: 1,
          total_parcels: 1,
          moto_details: s.moto_details || '',
          days_overdue: diffDays,
          is_overdue: isOverdue,
          is_due_today: isDueToday
        };

        const cId = Number(s.customer_id);
        if (!customerMap.has(cId)) {
          customerMap.set(cId, {
            customer_id: cId,
            customer_name: s.customer_name || cust.name || 'Cliente Sem Nome',
            nickname: cust.nickname || '',
            whatsapp: cust.whatsapp || s.whatsapp || '',
            phone: cust.whatsapp || s.whatsapp || '',
            cpf: cust.cpf || cust.cnpj || '',
            address: cust.address || '',
            neighborhood: cust.neighborhood || '',
            city: cust.city || 'Andirá - PR',
            credit_status: cust.credit_status || 'LIBERADO',
            credit_limit: cust.credit_limit || 0,
            credit_block_reason: cust.credit_block_reason || '',
            notes: [],
            total_original: 0,
            total_paid: 0,
            total_balance: 0,
            total_overdue: 0,
            total_upcoming: 0,
            max_overdue_days: 0,
            has_overdue: false,
            open_notes_count: 0
          });
        }
        const cGroup = customerMap.get(cId)!;
        cGroup.notes.push(noteObj);
        cGroup.total_original += Number(s.total || 0);
        cGroup.total_paid += Number(s.paid_total || 0);
        cGroup.total_balance += bal;
        cGroup.open_notes_count++;
        if (isOverdue) {
          cGroup.total_overdue += bal;
          cGroup.has_overdue = true;
          if (diffDays > cGroup.max_overdue_days) cGroup.max_overdue_days = diffDays;
        } else {
          cGroup.total_upcoming += bal;
        }
      }
    }
  });

  return Array.from(customerMap.values()).map(g => ({
    ...g,
    total_original: Number(g.total_original.toFixed(2)),
    total_paid: Number(g.total_paid.toFixed(2)),
    total_balance: Number(g.total_balance.toFixed(2)),
    total_overdue: Number(g.total_overdue.toFixed(2)),
    total_upcoming: Number(g.total_upcoming.toFixed(2))
  }));
}

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

  // Fallback / Unified customer debts list
  const effectiveCustomers = useMemo(() => {
    if (groupedCustomers && groupedCustomers.length > 0) {
      return groupedCustomers;
    }
    return buildGroupedFromProps(credits, customers, sales);
  }, [groupedCustomers, credits, customers, sales]);

  // Fallback / Unified dashboard stats
  const effectiveStats = useMemo<CobrancaDashboardStats>(() => {
    if (dashboardStats) return dashboardStats;

    let totalReceivable = 0;
    let totalOverdue = 0;
    let totalUpcoming = 0;
    let overdueCount = 0;
    let blockedCount = 0;

    effectiveCustomers.forEach(c => {
      totalReceivable += c.total_balance;
      totalOverdue += c.total_overdue;
      totalUpcoming += c.total_upcoming;
      if (c.has_overdue && c.total_overdue > 0) overdueCount++;
      if (c.credit_status?.includes('BLOQUEADO')) blockedCount++;
    });

    return {
      totalReceivable: Number(totalReceivable.toFixed(2)),
      totalOverdue: Number(totalOverdue.toFixed(2)),
      totalUpcoming: Number(totalUpcoming.toFixed(2)),
      totalMonthReceived: 0,
      overdueCustomersCount: overdueCount,
      collectionsSentCount: 0,
      recoveredAmount: 0,
      blockedCustomersCount: blockedCount,
      recoveryRate: 0,
      aging: { d1_15: 0, d16_30: 0, d31_60: 0, d60_plus: 0 }
    };
  }, [dashboardStats, effectiveCustomers]);

  // Fetch updated data from Cobrança V4.0 backend
  const loadCobrancaData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Dashboard stats & Grouped list
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
        if (Array.isArray(groupedData) && groupedData.length > 0) {
          setGroupedCustomers(groupedData);
        }
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
    effectiveCustomers.forEach(cust => {
      cust.notes.forEach(note => {
        list.push({ note, customer: cust });
      });
    });
    return list;
  }, [effectiveCustomers]);

  // Filtered customers (Grouped View)
  const filteredCustomers = useMemo(() => {
    let list = [...effectiveCustomers];

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

    // Search term with diacritic-insensitivity and alias matching
    if (searchTerm.trim()) {
      const term = normalizeSearch(searchTerm);
      const digits = cleanDigits(searchTerm);

      const searchTerms = [term];
      if (ALIAS_MAP[term]) {
        searchTerms.push(...ALIAS_MAP[term].map(normalizeSearch));
      }
      term.split(/\s+/).forEach(word => {
        if (ALIAS_MAP[word]) {
          ALIAS_MAP[word].forEach(alias => searchTerms.push(normalizeSearch(alias)));
        }
      });

      list = list.filter(c => {
        const custName = normalizeSearch(c.customer_name);
        const custNick = normalizeSearch(c.nickname);
        const custAddress = normalizeSearch(c.address);
        const custNeigh = normalizeSearch(c.neighborhood);
        const custCity = normalizeSearch(c.city);
        const custCpf = cleanDigits(c.cpf);
        const custPhone = cleanDigits(c.whatsapp || c.phone);

        const matchesNameOrNick = searchTerms.some(st => 
          custName.includes(st) || 
          custNick.includes(st) ||
          custAddress.includes(st) ||
          custNeigh.includes(st) ||
          custCity.includes(st)
        );

        if (matchesNameOrNick) return true;

        if (digits.length >= 3 && (custCpf.includes(digits) || custPhone.includes(digits))) {
          return true;
        }

        return c.notes.some(n => {
          const ident = normalizeSearch(n.identifier);
          const moto = normalizeSearch(n.moto_details);
          const saleId = normalizeSearch(String(n.sale_id || ''));
          return searchTerms.some(st => ident.includes(st) || moto.includes(st) || saleId.includes(st));
        });
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'maior_saldo') return b.total_balance - a.total_balance;
      if (sortBy === 'maior_atraso') return b.max_overdue_days - a.max_overdue_days;
      if (sortBy === 'nome') return (a.customer_name || '').localeCompare(b.customer_name || '');
      return 0;
    });

    return list;
  }, [effectiveCustomers, filter, searchTerm, sortBy]);

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
      const term = normalizeSearch(searchTerm);
      const digits = cleanDigits(searchTerm);

      const searchTerms = [term];
      if (ALIAS_MAP[term]) {
        searchTerms.push(...ALIAS_MAP[term].map(normalizeSearch));
      }
      term.split(/\s+/).forEach(word => {
        if (ALIAS_MAP[word]) {
          ALIAS_MAP[word].forEach(alias => searchTerms.push(normalizeSearch(alias)));
        }
      });

      list = list.filter(i => {
        const custName = normalizeSearch(i.customer.customer_name);
        const custNick = normalizeSearch(i.customer.nickname);
        const ident = normalizeSearch(i.note.identifier);
        const moto = normalizeSearch(i.note.moto_details);
        const saleId = normalizeSearch(String(i.note.sale_id || ''));
        const custCpf = cleanDigits(i.customer.cpf);
        const custPhone = cleanDigits(i.customer.whatsapp || i.customer.phone);

        const matchesText = searchTerms.some(st => 
          custName.includes(st) || 
          custNick.includes(st) || 
          ident.includes(st) || 
          moto.includes(st) || 
          saleId.includes(st)
        );
        if (matchesText) return true;

        if (digits.length >= 3 && (custCpf.includes(digits) || custPhone.includes(digits))) {
          return true;
        }

        return false;
      });
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
            {formatCurrencyBRL(effectiveStats.totalReceivable)}
          </p>
          <span className="text-[10px] text-slate-400">Total de títulos em aberto</span>
        </div>

        {/* 2. Total Vencido */}
        <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-900/40 shadow-sm">
          <p className="text-[10px] uppercase font-black text-rose-400 tracking-wider">Total Vencido</p>
          <p className="text-lg font-black text-rose-400 mt-1">
            {formatCurrencyBRL(effectiveStats.totalOverdue)}
          </p>
          <span className="text-[10px] text-rose-300/70">Em atraso no crediário</span>
        </div>

        {/* 3. Total a Vencer */}
        <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-900/30 shadow-sm">
          <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Total a Vencer</p>
          <p className="text-lg font-black text-amber-300 mt-1">
            {formatCurrencyBRL(effectiveStats.totalUpcoming)}
          </p>
          <span className="text-[10px] text-amber-400/70">Vencimento futuro</span>
        </div>

        {/* 4. Total Recebido no Mês */}
        <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-900/40 shadow-sm">
          <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Recebido no Mês</p>
          <p className="text-lg font-black text-emerald-400 mt-1">
            {formatCurrencyBRL(effectiveStats.totalMonthReceived)}
          </p>
          <span className="text-[10px] text-emerald-300/70">Baixas financeiras</span>
        </div>

        {/* 5. Inadimplentes */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Inadimplentes</p>
          <p className="text-lg font-black text-white mt-1">
            {effectiveStats.overdueCustomersCount} <span className="text-xs font-normal text-slate-400">clientes</span>
          </p>
          <span className="text-[10px] text-slate-400">Com débitos vencidos</span>
        </div>

        {/* 6. Cobranças Enviadas */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cobranças Enviadas</p>
          <p className="text-lg font-black text-white mt-1">
            {effectiveStats.collectionsSentCount} <span className="text-xs font-normal text-slate-400">envios</span>
          </p>
          <span className="text-[10px] text-slate-400">Registros confirmados</span>
        </div>

        {/* 7. Valores Recuperados */}
        <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/30 shadow-sm">
          <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Valores Recuperados</p>
          <p className="text-lg font-black text-emerald-300 mt-1">
            {formatCurrencyBRL(effectiveStats.recoveredAmount)}
          </p>
          <span className="text-[10px] text-emerald-400/70">Após acionamento</span>
        </div>

        {/* 8. Clientes Bloqueados */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] uppercase font-black text-rose-400 tracking-wider">Crédito Bloqueado</p>
          <p className="text-lg font-black text-white mt-1">
            {effectiveStats.blockedCustomersCount} <span className="text-xs font-normal text-slate-400">clientes</span>
          </p>
          <span className="text-[10px] text-slate-400">&gt;30 dias de atraso</span>
        </div>

        {/* 9. Taxa de Recuperação */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm sm:col-span-2 lg:col-span-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Taxa de Recuperação</p>
            <span className="text-xs font-black text-emerald-400">{effectiveStats.recoveryRate}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, effectiveStats.recoveryRate)}%` }}
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
                        <h3 className="font-black text-white text-base tracking-tight">
                          {customer.customer_name}
                          {customer.nickname && (
                            <span className="text-xs text-rose-400 font-bold ml-2">({customer.nickname})</span>
                          )}
                        </h3>
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
                        {customer.nickname && (
                          <span className="text-[10px] text-rose-400 font-bold ml-1.5">({customer.nickname})</span>
                        )}
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
