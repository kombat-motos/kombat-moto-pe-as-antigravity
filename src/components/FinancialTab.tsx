import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, CreditCard, Calculator, Bell, Plus, ArrowUpCircle, X, 
  Package, Bike, TrendingUp, Truck, DollarSign, Percent, BarChart3,
  AlertTriangle, Calendar, ShieldCheck, Gavel, MessageCircle, Printer, FileText, CheckCircle, Search,
  ArrowDownCircle, Trash2, Edit2, Copy, Upload, ChevronDown, ChevronUp, ChevronRight, User, Phone, CheckSquare, Square,
  Clock, RefreshCw, Filter, ArrowUpDown, HelpCircle, AlertCircle, Sparkles, Receipt, Send, Check, Layers, ExternalLink,
  ShieldAlert, Award, FileSpreadsheet
} from 'lucide-react';
import Modal from './Modal';

interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
  type?: 'Peça' | 'Serviço' | 'Serviço Principal' | 'Adicional Interno';
}

interface Sale {
  id: string;
  user_id?: string;
  customer_id?: number;
  customer_name: string;
  items: SaleItem[];
  sale_items?: SaleItem[];
  labor_value: number;
  mechanic_id?: string;
  mechanic_name?: string;
  commission: number;
  total: number;
  payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
  type: 'Balcão' | 'Oficina';
  date: string;
  moto_details?: string;
  payment_status: 'Pago' | 'Pendente';
  due_date?: string;
  paid_date?: string;
  paid_total?: number;
  service_description?: string;
  whatsapp?: string;
  status?: 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue';
  charge_type?: 'vista' | 'credito_30_dias';
}

interface Product {
  id: number;
  description: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  [key: string]: any;
}

interface Customer {
  id: number;
  name: string;
  whatsapp?: string;
  phone?: string;
  secondary_phone?: string;
  cpf?: string;
  cnpj?: string;
  nickname?: string;
  apelido?: string;
  billing_day?: number | null;
  dia_vencimento?: number | null;
  credit_limit?: number;
  credit_status?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  [key: string]: any;
}

interface FinancialTabProps {
  sales: Sale[];
  allSales: Sale[];
  products: Product[];
  customers: Customer[];
  companyData: any;
  companyLogo: string | null;
  localApi: any;
  fetchData: () => void;
  formatBRL: (val: number) => string;
}

interface NoteDebtItem {
  sale: Sale;
  original: number;
  paid: number;
  balance: number;
  fine: number;
  interest: number;
  updatedTotal: number;
  daysOverdue: number;
  isOverdue: boolean;
  isDueToday: boolean;
  status: 'Vencido' | 'Vence Hoje' | 'A Vencer' | 'Pago';
}

interface CustomerDebtGroup {
  customerId: number | string;
  customerName: string;
  nickname?: string;
  cpf?: string;
  cnpj?: string;
  whatsapp?: string;
  phone?: string;
  billingDay?: number | null;
  score: number;
  customer?: Customer;
  notes: NoteDebtItem[];
  totalOriginal: number;
  totalPaid: number;
  totalBalance: number;
  totalFineInterest: number;
  totalUpdated: number;
  maxDaysOverdue: number;
  hasOverdue: boolean;
  hasDueToday: boolean;
  earliestDueDate: string;
  latestDueDate: string;
  openNotesCount: number;
  overdueCategory: 'Em dia' | '1 a 7 dias' | '8 a 15 dias' | '16 a 30 dias' | '> 30 dias';
}

// Helpers de Normalização e Datas
const normalizeSearch = (str: string) => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim();
};

const cleanDigits = (str: string) => (str || '').replace(/\\D/g, '');

const formatDateSafe = (isoDateStr?: string) => {
  if (!isoDateStr) return '-';
  const clean = isoDateStr.split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
};

const FinancialTab: React.FC<FinancialTabProps> = ({
  sales,
  allSales,
  products,
  customers,
  companyData,
  companyLogo,
  localApi,
  fetchData,
  formatBRL
}) => {
  // Aba ativa: inicia em 'receber' ou 'caixa'
  const [financialTab, setFinancialTab] = React.useState<'caixa' | 'receber' | 'pagar' | 'fechamento' | 'taxas' | 'automacao'>('receber');

  // --- FILTROS E BUSCA INTELIGENTE DE CONTAS A RECEBER ---
  const [receberSearchTerm, setReceberSearchTerm] = React.useState('');
  const [receberFilterTab, setReceberFilterTab] = React.useState<'todos' | 'vencidos' | 'hoje' | 'avencer' | 'atraso30'>('todos');
  // ORDENAÇÃO ALFABÉTICA OBRIGATÓRIA DE A A Z POR PADRÃO
  const [receberSortOrder, setReceberSortOrder] = React.useState<'az' | 'za' | 'maior_divida' | 'maior_atraso' | 'vencimento_asc' | 'vencimento_desc'>('az');
  const [expandedCustomerIds, setExpandedCustomerIds] = React.useState<Record<string, boolean>>({});
  const [selectedNoteIds, setSelectedNoteIds] = React.useState<string[]>([]);

  // Modais de Gestão Financeira
  const [regularizacaoGroup, setRegularizacaoGroup] = React.useState<CustomerDebtGroup | null>(null);
  const [regSelectedNotes, setRegSelectedNotes] = React.useState<string[]>([]);
  const [regTab, setRegTab] = React.useState<'quitar' | 'parcial' | 'whatsapp' | 'extrato' | 'historico'>('quitar');
  const [regPaymentMethod, setRegPaymentMethod] = React.useState<'Pix' | 'Dinheiro' | 'Cartão' | 'Débito' | 'Crédito'>('Pix');
  const [regWaiveFines, setRegWaiveFines] = React.useState(false);
  const [regCustomDiscount, setRegCustomDiscount] = React.useState('');
  const [regAmortizeAmount, setRegAmortizeAmount] = React.useState('');
  const [isProcessingReg, setIsProcessingReg] = React.useState(false);

  // Modal de Quitação em Lote
  const [isBatchSettleModalOpen, setIsBatchSettleModalOpen] = React.useState(false);
  const [batchPaymentMethod, setBatchPaymentMethod] = React.useState<'Pix' | 'Dinheiro' | 'Cartão' | 'Débito' | 'Crédito'>('Pix');
  const [batchPaymentDate, setBatchPaymentDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [isProcessingBatch, setIsProcessingBatch] = React.useState(false);

  // Modal de Pagamento Parcial Individual
  const [partialModalSale, setPartialModalSale] = React.useState<Sale | null>(null);
  const [partialAmountInput, setPartialAmountInput] = React.useState('');
  const [partialMethodInput, setPartialMethodInput] = React.useState<'Pix' | 'Dinheiro' | 'Cartão' | 'Débito' | 'Crédito'>('Pix');
  const [isProcessingPartial, setIsProcessingPartial] = React.useState(false);

  // --- Estados de Contas a Pagar ---
  const [accountsPayable, setAccountsPayable] = React.useState<any[]>([]);
  const [isPayableModalOpen, setIsPayableModalOpen] = React.useState(false);
  const [editingPayableId, setEditingPayableId] = React.useState<number | null>(null);
  const [isParsingBoleto, setIsParsingBoleto] = React.useState(false);
  const [payableForm, setPayableForm] = React.useState({
    fornecedor: '',
    valor: '',
    due_date: new Date().toISOString().split('T')[0],
    linha_digitavel: '',
    codigo_pix: ''
  });
  const [payableSearchTerm, setPayableSearchTerm] = React.useState('');
  const [payableStatusFilter, setPayableStatusFilter] = React.useState<'todos' | 'pendentes' | 'pagos' | 'vencidos'>('todos');
  // FORNECEDORES DE A A Z POR PADRÃO
  const [payableSortOrder, setPayableSortOrder] = React.useState<'fornecedor_az' | 'fornecedor_za' | 'vencimento_asc' | 'maior_valor'>('fornecedor_az');
  const [payableDateStart, setPayableDateStart] = React.useState('');
  const [payableDateEnd, setPayableDateEnd] = React.useState('');
  const [geminiApiKey, setGeminiApiKey] = React.useState(() => localStorage.getItem('gemini_api_key') || '');

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const now = React.useMemo(() => new Date(), []);

  // Configurações de Juros e Multa
  const [fiadoSettings, setFiadoSettings] = React.useState(() => {
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

  React.useEffect(() => {
    localStorage.setItem('fiadoSettings', JSON.stringify(fiadoSettings));
  }, [fiadoSettings]);

  // Configuração de Taxas de Cartão
  const [cardFeesSettings, setCardFeesSettings] = React.useState<Record<number, number>>(() => {
    const DEFAULT_CARD_FEES = {
      1: 3.05, 2: 4.3, 3: 5.25, 4: 6.20, 5: 7.15, 6: 8.01,
      7: 8.90, 8: 9.85, 9: 10.80, 10: 11.75, 11: 12.70, 12: 13.65
    };
    const saved = localStorage.getItem('cardFeesSettings');
    return saved ? JSON.parse(saved) : DEFAULT_CARD_FEES;
  });

  React.useEffect(() => {
    localStorage.setItem('cardFeesSettings', JSON.stringify(cardFeesSettings));
  }, [cardFeesSettings]);

  // --- Estados de Caixa e Movimentações ---
  const [cashSessions, setCashSessions] = React.useState<any[]>([]);
  const [activeSession, setActiveSession] = React.useState<any | null>(null);
  const [cashTransactions, setCashTransactions] = React.useState<any[]>([]);
  const [isCashModalOpen, setIsCashModalOpen] = React.useState(false);
  const [cashForm, setCashForm] = React.useState({ openingBalance: '', notes: '' });
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
  const [transactionForm, setTransactionForm] = React.useState({ type: 'Sangria' as 'Suprimento' | 'Sangria', amount: '', description: '' });

  // Score do Cliente
  const getCustomerScore = React.useCallback((customerId: number | string, customerName?: string) => {
    const cSales = (allSales || []).filter(s => 
      (customerId && s.customer_id === Number(customerId)) ||
      (customerName && s.customer_name?.toLowerCase().trim() === customerName.toLowerCase().trim())
    );
    if (cSales.length === 0) return 5.0;
    const fiadoSales = cSales.filter(s => s.payment_method === 'Fiado' || s.charge_type === 'credito_30_dias');
    if (fiadoSales.length === 0) return 10.0;
    const onTime = fiadoSales.filter(s => s.payment_status === 'Pago' && (!s.paid_date || !s.due_date || new Date(s.paid_date) <= new Date(s.due_date))).length;
    return parseFloat(((onTime / fiadoSales.length) * 10).toFixed(1));
  }, [allSales]);

  // Cálculo de encargos e dias de atraso por nota
  const calculateOverdueDebt = React.useCallback((sale: Sale) => {
    const balance = Math.max(0, (sale.total || 0) - (sale.paid_total || 0));
    if (sale.payment_status === 'Pago' || !sale.due_date || balance <= 0) {
      return balance;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = sale.due_date.split('T')[0].split('-');
    const dueDate = parts.length === 3 
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) 
      : new Date(sale.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (today <= dueDate) return balance;

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      return Number((balance * 1.15).toFixed(2));
    }

    const fineRate = fiadoSettings?.lateFeeRate ?? 2;
    const interestRate = fiadoSettings?.lateInterestRate ?? 1;

    const fine = balance * (fineRate / 100);
    const interest = balance * (interestRate / 100 / 30) * diffDays;
    return Number((balance + fine + interest).toFixed(2));
  }, [fiadoSettings]);

  // Categoria de Atraso
  const getOverdueCategory = (maxDaysOverdue: number): 'Em dia' | '1 a 7 dias' | '8 a 15 dias' | '16 a 30 dias' | '> 30 dias' => {
    if (maxDaysOverdue <= 0) return 'Em dia';
    if (maxDaysOverdue <= 7) return '1 a 7 dias';
    if (maxDaysOverdue <= 15) return '8 a 15 dias';
    if (maxDaysOverdue <= 30) return '16 a 30 dias';
    return '> 30 dias';
  };

  // --- AGRUPAMENTO INTELIGENTE POR CLIENTE ---
  const customerDebtGroups = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = new Map<string, CustomerDebtGroup>();

    const custById = new Map<number, Customer>();
    const custByName = new Map<string, Customer>();
    (customers || []).forEach(c => {
      if (c.id) custById.set(Number(c.id), c);
      if (c.name) custByName.set(normalizeSearch(c.name), c);
    });

    const debtSales = (allSales || []).filter(s => {
      const isFiadoOrCredito = s.payment_method === 'Fiado' || s.charge_type === 'credito_30_dias' || s.payment_status === 'Pendente';
      return isFiadoOrCredito && s.payment_status !== 'Pago';
    });

    debtSales.forEach(sale => {
      const cust = (sale.customer_id ? custById.get(Number(sale.customer_id)) : null) ||
                   custByName.get(normalizeSearch(sale.customer_name)) ||
                   { id: sale.customer_id || 0, name: sale.customer_name };

      const custKey = cust.id ? `id_${cust.id}` : `name_${normalizeSearch(sale.customer_name || 'Desconhecido')}`;

      const originalVal = Number(sale.total || 0);
      const paidVal = Number(sale.paid_total || 0);
      const balance = Math.max(0, Number((originalVal - paidVal).toFixed(2)));

      let daysOverdue = 0;
      let isOverdue = false;
      let isDueToday = false;
      let dueDateISO = sale.due_date || '';

      if (dueDateISO) {
        const parts = dueDateISO.split('T')[0].split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          d.setHours(0, 0, 0, 0);
          daysOverdue = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          isOverdue = daysOverdue > 0;
          isDueToday = daysOverdue === 0;
        }
      }

      let fine = 0;
      let interest = 0;
      if (isOverdue && balance > 0) {
        if (daysOverdue >= 30) {
          fine = balance * ((fiadoSettings?.lateFeeRate || 2) / 100);
          interest = balance * 0.13;
        } else {
          fine = balance * ((fiadoSettings?.lateFeeRate || 2) / 100);
          interest = balance * ((fiadoSettings?.lateInterestRate || 1) / 100 / 30) * daysOverdue;
        }
      }
      const updatedTotal = Number((balance + fine + interest).toFixed(2));

      const noteItem: NoteDebtItem = {
        sale,
        original: originalVal,
        paid: paidVal,
        balance,
        fine: Number(fine.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        updatedTotal,
        daysOverdue: Math.max(0, daysOverdue),
        isOverdue,
        isDueToday,
        status: isOverdue ? 'Vencido' : isDueToday ? 'Vence Hoje' : 'A Vencer'
      };

      if (!map.has(custKey)) {
        const customerScore = getCustomerScore(cust.id || sale.customer_id || 0, cust.name || sale.customer_name);
        map.set(custKey, {
          customerId: cust.id || sale.customer_id || custKey,
          customerName: (cust.name || sale.customer_name || 'Cliente Sem Nome').trim(),
          nickname: (cust as any).nickname || (cust as any).apelido || '',
          cpf: (cust as any).cpf || '',
          cnpj: (cust as any).cnpj || '',
          whatsapp: (cust as any).whatsapp || sale.whatsapp || '',
          phone: (cust as any).phone || (cust as any).secondary_phone || '',
          billingDay: (cust as any).billing_day || (cust as any).dia_vencimento || null,
          score: customerScore,
          customer: cust as any,
          notes: [noteItem],
          totalOriginal: originalVal,
          totalPaid: paidVal,
          totalBalance: balance,
          totalFineInterest: Number((fine + interest).toFixed(2)),
          totalUpdated: updatedTotal,
          maxDaysOverdue: isOverdue ? daysOverdue : 0,
          hasOverdue: isOverdue,
          hasDueToday: isDueToday,
          earliestDueDate: dueDateISO,
          latestDueDate: dueDateISO,
          openNotesCount: 1,
          overdueCategory: 'Em dia'
        });
      } else {
        const existing = map.get(custKey)!;
        existing.notes.push(noteItem);
        existing.totalOriginal = Number((existing.totalOriginal + originalVal).toFixed(2));
        existing.totalPaid = Number((existing.totalPaid + paidVal).toFixed(2));
        existing.totalBalance = Number((existing.totalBalance + balance).toFixed(2));
        existing.totalFineInterest = Number((existing.totalFineInterest + fine + interest).toFixed(2));
        existing.totalUpdated = Number((existing.totalUpdated + updatedTotal).toFixed(2));
        if (isOverdue && daysOverdue > existing.maxDaysOverdue) {
          existing.maxDaysOverdue = daysOverdue;
        }
        if (isOverdue) existing.hasOverdue = true;
        if (isDueToday) existing.hasDueToday = true;
        if (dueDateISO && (!existing.earliestDueDate || dueDateISO < existing.earliestDueDate)) {
          existing.earliestDueDate = dueDateISO;
        }
        if (dueDateISO && (!existing.latestDueDate || dueDateISO > existing.latestDueDate)) {
          existing.latestDueDate = dueDateISO;
        }
        existing.openNotesCount = existing.notes.length;
      }
    });

    const result: CustomerDebtGroup[] = [];
    map.forEach(group => {
      // Ordena notas do cliente pela data de vencimento da mais antiga para a mais recente
      group.notes.sort((a, b) => {
        const dateA = a.sale.due_date || '9999-99-99';
        const dateB = b.sale.due_date || '9999-99-99';
        return dateA.localeCompare(dateB);
      });
      group.overdueCategory = getOverdueCategory(group.maxDaysOverdue);
      result.push(group);
    });

    return result;
  }, [allSales, customers, fiadoSettings, getCustomerScore]);

  // --- FILTRO E ORDENAÇÃO ALFABÉTICA PADRÃO (A-Z) ---
  const filteredAndSortedGroups = React.useMemo(() => {
    let list = [...customerDebtGroups];

    // Busca inteligente
    if (receberSearchTerm.trim()) {
      const term = normalizeSearch(receberSearchTerm);
      const digits = cleanDigits(receberSearchTerm);

      list = list.filter(g => {
        const nameMatch = normalizeSearch(g.customerName).includes(term);
        const nickMatch = g.nickname ? normalizeSearch(g.nickname).includes(term) : false;
        const docMatch = (g.cpf && cleanDigits(g.cpf).includes(digits)) || (g.cnpj && cleanDigits(g.cnpj).includes(digits));
        const phoneMatch = digits.length >= 3 && ((g.whatsapp && cleanDigits(g.whatsapp).includes(digits)) || (g.phone && cleanDigits(g.phone).includes(digits)));
        const noteMatch = g.notes.some(n => {
          const idStr = String(n.sale.id).toLowerCase();
          return idStr.includes(term) || idStr.replace('#', '').includes(term.replace('#', ''));
        });
        return nameMatch || nickMatch || docMatch || phoneMatch || noteMatch;
      });
    }

    // Filtros rápidos
    if (receberFilterTab === 'vencidos') {
      list = list.filter(g => g.hasOverdue);
    } else if (receberFilterTab === 'hoje') {
      list = list.filter(g => g.hasDueToday);
    } else if (receberFilterTab === 'avencer') {
      list = list.filter(g => !g.hasOverdue);
    } else if (receberFilterTab === 'atraso30') {
      list = list.filter(g => g.maxDaysOverdue >= 30);
    }

    // Classificação: A a Z por padrão
    list.sort((a, b) => {
      if (receberSortOrder === 'az') {
        return a.customerName.localeCompare(b.customerName, 'pt-BR', { sensitivity: 'base' });
      }
      if (receberSortOrder === 'za') {
        return b.customerName.localeCompare(a.customerName, 'pt-BR', { sensitivity: 'base' });
      }
      if (receberSortOrder === 'maior_divida') {
        return b.totalUpdated - a.totalUpdated;
      }
      if (receberSortOrder === 'maior_atraso') {
        return b.maxDaysOverdue - a.maxDaysOverdue;
      }
      if (receberSortOrder === 'vencimento_asc') {
        return (a.earliestDueDate || '9999').localeCompare(b.earliestDueDate || '9999');
      }
      if (receberSortOrder === 'vencimento_desc') {
        return (b.latestDueDate || '0000').localeCompare(a.latestDueDate || '0000');
      }
      return a.customerName.localeCompare(b.customerName, 'pt-BR', { sensitivity: 'base' });
    });

    return list;
  }, [customerDebtGroups, receberSearchTerm, receberFilterTab, receberSortOrder]);

  // Se o termo pesquisado coincidir com número da nota, expande automaticamente
  React.useEffect(() => {
    if (!receberSearchTerm.trim()) return;
    const term = normalizeSearch(receberSearchTerm);
    const newExpanded = { ...expandedCustomerIds };
    let changed = false;
    filteredAndSortedGroups.forEach(g => {
      const hasNoteMatch = g.notes.some(n => {
        const idStr = String(n.sale.id).toLowerCase();
        return idStr.includes(term) || idStr.replace('#', '').includes(term.replace('#', ''));
      });
      if (hasNoteMatch && !newExpanded[String(g.customerId)]) {
        newExpanded[String(g.customerId)] = true;
        changed = true;
      }
    });
    if (changed) setExpandedCustomerIds(newExpanded);
  }, [receberSearchTerm, filteredAndSortedGroups]);

  // --- 8 INDICADORES FINANCEIROS OBRIGATÓRIOS ---
  const statsKPI = React.useMemo(() => {
    // 1. Total a Receber
    const totalReceberPrincipal = customerDebtGroups.reduce((acc, g) => acc + g.totalBalance, 0);
    const totalReceberAtualizado = customerDebtGroups.reduce((acc, g) => acc + g.totalUpdated, 0);

    // 2. Total Vencido
    let totalVencido = 0;
    let countVencidos = 0;

    // 3. Vence Hoje
    let totalVenceHoje = 0;
    let countVenceHoje = 0;

    // 4. A Vencer
    let totalAVencer = 0;
    let countAVencer = 0;

    customerDebtGroups.forEach(g => {
      g.notes.forEach(n => {
        if (n.isOverdue) {
          totalVencido += n.updatedTotal;
          countVencidos++;
        } else if (n.isDueToday) {
          totalVenceHoje += n.updatedTotal;
          countVenceHoje++;
        } else {
          totalAVencer += n.updatedTotal;
          countAVencer++;
        }
      });
    });

    // 5. Recebido no Mês
    const currentMonthPrefix = todayStr.slice(0, 7); // 'YYYY-MM'
    const fiadoPagoMes = (allSales || [])
      .filter(s => s.payment_status === 'Pago' && s.paid_date && s.paid_date.startsWith(currentMonthPrefix))
      .reduce((acc, s) => acc + s.total, 0);
    const vendasDiretasMes = (sales || [])
      .filter(s => s.payment_status === 'Pago' && s.payment_method !== 'Fiado')
      .reduce((acc, s) => acc + s.total, 0);
    const recebidoNoMes = fiadoPagoMes + vendasDiretasMes;

    // 6. Clientes Inadimplentes (distintos)
    const clientesInadimplentes = customerDebtGroups.filter(g => g.hasOverdue).length;

    // 7. Total a Pagar
    const totalPagarPendente = accountsPayable
      .filter(a => a.status !== 'Pago')
      .reduce((acc, a) => acc + (a.valor || 0), 0);

    // 8. Saldo de Caixa
    const saldoCaixaAtual = activeSession ? (activeSession.openingBalance || 0) : 0;

    return {
      totalReceberPrincipal,
      totalReceberAtualizado,
      totalVencido,
      countVencidos,
      totalVenceHoje,
      countVenceHoje,
      totalAVencer,
      countAVencer,
      recebidoNoMes,
      clientesInadimplentes,
      totalClientesComFiado: customerDebtGroups.length,
      totalPagarPendente,
      saldoCaixaAtual,
      isCaixaAberto: !!activeSession
    };
  }, [customerDebtGroups, accountsPayable, activeSession, allSales, sales, todayStr]);

  // Contas a Pagar Filtradas e Estatísticas
  const statsPayable = React.useMemo(() => {
    const overdue = accountsPayable.filter(a => a.status !== 'Pago' && a.due_date < todayStr);
    const dueToday = accountsPayable.filter(a => a.status !== 'Pago' && a.due_date === todayStr);
    const upcoming = accountsPayable.filter(a => a.status !== 'Pago' && a.due_date > todayStr);
    const paid = accountsPayable.filter(a => a.status === 'Pago');

    return {
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, item) => sum + (item.valor || 0), 0),
      dueTodayCount: dueToday.length,
      dueTodayTotal: dueToday.reduce((sum, item) => sum + (item.valor || 0), 0),
      upcomingCount: upcoming.length,
      upcomingTotal: upcoming.reduce((sum, item) => sum + (item.valor || 0), 0),
      paidCount: paid.length,
      paidTotal: paid.reduce((sum, item) => sum + (item.valor || 0), 0),
    };
  }, [accountsPayable, todayStr]);

  const filteredAccountsPayable = React.useMemo(() => {
    return (accountsPayable || [])
      .filter(item => {
        if (!payableSearchTerm) return true;
        const term = payableSearchTerm.toLowerCase();
        return (
          (item.fornecedor || '').toLowerCase().includes(term) ||
          (item.linha_digitavel || '').toLowerCase().includes(term)
        );
      })
      .filter(item => {
        if (payableStatusFilter === 'pendentes') return item.status !== 'Pago';
        if (payableStatusFilter === 'pagos') return item.status === 'Pago';
        if (payableStatusFilter === 'vencidos') return item.status !== 'Pago' && item.due_date < todayStr;
        return true;
      })
      .filter(item => {
        if (payableDateStart && item.due_date < payableDateStart) return false;
        if (payableDateEnd && item.due_date > payableDateEnd) return false;
        return true;
      })
      .sort((a, b) => {
        if (payableSortOrder === 'fornecedor_az') {
          return (a.fornecedor || '').localeCompare(b.fornecedor || '', 'pt-BR', { sensitivity: 'base' });
        }
        if (payableSortOrder === 'fornecedor_za') {
          return (b.fornecedor || '').localeCompare(a.fornecedor || '', 'pt-BR', { sensitivity: 'base' });
        }
        if (payableSortOrder === 'maior_valor') {
          return (b.valor || 0) - (a.valor || 0);
        }
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [accountsPayable, payableSearchTerm, payableStatusFilter, payableDateStart, payableDateEnd, payableSortOrder, todayStr]);

  // Carregar dados de contas a pagar
  const loadAccountsPayable = React.useCallback(async () => {
    try {
      const data = await localApi.get('accounts_payable');
      if (Array.isArray(data)) {
        setAccountsPayable(data);
      }
    } catch (err) {
      console.error('Erro ao carregar contas a pagar:', err);
    }
  }, [localApi]);

  React.useEffect(() => {
    loadAccountsPayable();
  }, [loadAccountsPayable]);

  // Carregar dados de caixa
  const loadFinancialData = React.useCallback(async () => {
    try {
      const [sessions, transactions] = await Promise.all([
        localApi.get('cash_sessions').catch(() => []),
        localApi.get('cash_transactions').catch(() => [])
      ]);
      
      if (Array.isArray(sessions)) {
        const mappedSessions = sessions.map((s: any) => ({
          id: s.id, openedAt: s.opened_at, closedAt: s.closed_at,
          openingBalance: s.opening_balance, closingBalance: s.closing_balance,
          expectedBalance: s.expected_balance || 0, status: s.status, notes: s.notes
        }));
        setCashSessions(mappedSessions);
        const active = mappedSessions.find((s: any) => s.status === 'Aberto');
        setActiveSession(active || null);
      }
      
      if (Array.isArray(transactions)) {
        setCashTransactions(transactions.map((t: any) => ({
          id: t.id, sessionId: t.session_id, type: t.type, amount: t.amount,
          description: t.description, date: t.date
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    }
  }, [localApi]);

  React.useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Alternar expansão de cliente
  const toggleCustomerExpand = (customerId: number | string) => {
    setExpandedCustomerIds(prev => ({
      ...prev,
      [String(customerId)]: !prev[String(customerId)]
    }));
  };

  const expandAllCustomers = () => {
    const allExp: Record<string, boolean> = {};
    filteredAndSortedGroups.forEach(g => {
      allExp[String(g.customerId)] = true;
    });
    setExpandedCustomerIds(allExp);
  };

  const collapseAllCustomers = () => {
    setExpandedCustomerIds({});
  };

  // Seleção de notas por cliente
  const toggleSelectAllCustomerNotes = (group: CustomerDebtGroup) => {
    const noteIds = group.notes.map(n => String(n.sale.id));
    const allSelected = noteIds.every(id => selectedNoteIds.includes(id));
    if (allSelected) {
      setSelectedNoteIds(prev => prev.filter(id => !noteIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedNoteIds, ...noteIds]));
      setSelectedNoteIds(combined);
    }
  };

  const toggleSelectNote = (saleId: string) => {
    setSelectedNoteIds(prev => {
      if (prev.includes(saleId)) return prev.filter(id => id !== saleId);
      return [...prev, saleId];
    });
  };

  // Soma do total selecionado
  const selectedTotal = React.useMemo(() => {
    let sum = 0;
    selectedNoteIds.forEach(id => {
      const sale = allSales.find(s => String(s.id) === String(id));
      if (sale) {
        sum += calculateOverdueDebt(sale);
      }
    });
    return sum;
  }, [selectedNoteIds, allSales, calculateOverdueDebt]);

  // --- COBRANÇA WHATSAPP CONSOLIDADA (REGRA 9) ---
  const handleSendConsolidatedWhatsApp = (group: CustomerDebtGroup) => {
    const cleanPhone = (group.whatsapp || group.phone || '').replace(/\\D/g, '');
    if (!cleanPhone) {
      alert(`O cliente ${group.customerName} não possui número de WhatsApp cadastrado.`);
      return;
    }

    const storeName = 'KOMBAT MOTO PEÇAS';
    const pixKey = companyData.telefone || companyData.cnpj || '';

    let message = `*${storeName}*\\n\\n`;
    message += `Olá, *${group.customerName.trim()}*!\\n\\n`;
    message += `Identificamos os seguintes valores em aberto:\\n\\n`;

    group.notes.forEach(n => {
      const noteCode = String(n.sale.id).slice(-6).toUpperCase();
      const dueDateStr = formatDateSafe(n.sale.due_date);
      const valStr = formatBRL(n.updatedTotal);
      const delayWarning = n.isOverdue ? ` *(Vencida há ${n.daysOverdue} dias)*` : '';
      message += `Nota: *#${noteCode}*\\nVencimento: ${dueDateStr}\\nValor atualizado: *${valStr}*${delayWarning}\\n\\n`;
    });

    message += `*Total geral em aberto: ${formatBRL(group.totalUpdated)}*\\n\\n`;
    if (pixKey) {
      message += `Chave PIX: *${pixKey}*\\n`;
    }
    message += `Para regularização, entre em contato com nossa equipe.\\n\\n`;
    message += `Atenciosamente,\\n`;
    message += `*Kombat Moto Peças* 🏍️`;

    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Cobrança de nota individual
  const handleSendSingleNoteWhatsApp = (sale: Sale, group?: CustomerDebtGroup) => {
    const customer = customers.find(c => c.id === Number(sale.customer_id)) || group?.customer;
    const cleanPhone = (customer?.whatsapp || sale.whatsapp || group?.whatsapp || '').replace(/\\D/g, '');
    if (!cleanPhone) {
      alert(`WhatsApp do cliente ${sale.customer_name} não cadastrado.`);
      return;
    }

    const updatedVal = calculateOverdueDebt(sale);
    const noteCode = String(sale.id).slice(-6).toUpperCase();
    const dueDateStr = formatDateSafe(sale.due_date);
    const storeName = 'KOMBAT MOTO PEÇAS';
    const pixKey = companyData.telefone || companyData.cnpj || '';

    let message = `*${storeName}*\\n\\n`;
    message += `Olá, *${sale.customer_name.trim()}*!\\n\\n`;
    message += `Identificamos os seguintes valores em aberto:\\n\\n`;
    message += `Nota: *#${noteCode}*\\n`;
    message += `Vencimento: ${dueDateStr}\\n`;
    message += `Valor atualizado: *${formatBRL(updatedVal)}*\\n\\n`;
    message += `*Total geral em aberto: ${formatBRL(updatedVal)}*\\n\\n`;
    if (pixKey) {
      message += `Chave PIX: *${pixKey}*\\n`;
    }
    message += `Para regularização, entre em contato com nossa equipe.\\n\\n`;
    message += `Atenciosamente,\\n`;
    message += `*Kombat Moto Peças* 🏍️`;

    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- IMPRIMIR EXTRATO CONSOLIDADO DO CLIENTE ---
  const handlePrintCustomerStatement = (group: CustomerDebtGroup) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const companyName = companyData.razaoSocial || companyData.nomeFantasia || 'KOMBAT MOTO PEÇAS';
    const phone = companyData.telefone || '';
    const cnpj = companyData.cnpj || '';
    const address = companyData.endereco ? `${companyData.endereco}, ${companyData.cidade || ''}-PR` : 'Andirá - PR';
    const logo = companyLogo ? `<img src="${companyLogo}" style="max-height: 70px; object-fit: contain;" alt="Logo" />` : '';

    const rowsHtml = group.notes.map(n => {
      return `
        <tr style="border-bottom: 1px solid #ddd; font-size: 13px;">
          <td style="padding: 8px 6px;"><strong>#${String(n.sale.id).slice(-6).toUpperCase()}</strong></td>
          <td style="padding: 8px 6px;">${formatDateSafe(n.sale.date)}</td>
          <td style="padding: 8px 6px; color: ${n.isOverdue ? '#dc2626' : '#333'}; font-weight: ${n.isOverdue ? 'bold' : 'normal'};">
            ${formatDateSafe(n.sale.due_date)} ${n.daysOverdue > 0 ? `(${n.daysOverdue}d atraso)` : ''}
          </td>
          <td style="padding: 8px 6px; text-align: right;">${formatBRL(n.original)}</td>
          <td style="padding: 8px 6px; text-align: right; color: #16a34a;">${formatBRL(n.paid)}</td>
          <td style="padding: 8px 6px; text-align: right;">${formatBRL(n.balance)}</td>
          <td style="padding: 8px 6px; text-align: right; color: #dc2626;">${formatBRL(n.fine + n.interest)}</td>
          <td style="padding: 8px 6px; text-align: right; font-weight: bold; color: #b91c1c;">${formatBRL(n.updatedTotal)}</td>
        </tr>
      `;
    }).join('');

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Extrato Financeiro - ${group.customerName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 25px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .title { text-align: center; margin: 15px 0; }
            .title h2 { margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
            .customer-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .totals-box { margin-left: auto; width: 350px; background: #f1f5f9; border: 2px solid #334155; border-radius: 8px; padding: 14px; font-size: 14px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .totals-grand { font-size: 18px; font-weight: 900; color: #b91c1c; border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; }
            .signature-box { margin-top: 50px; display: flex; justify-content: space-around; }
            .sig-line { width: 250px; border-top: 1px solid #334155; text-align: center; padding-top: 5px; font-size: 12px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div>${logo}</div>
            <div style="text-align: right;">
              <h3 style="margin: 0; color: #b91c1c;">${companyName}</h3>
              <p style="margin: 3px 0; font-size: 12px;">CNPJ: ${cnpj} | Tel: ${phone}</p>
              <p style="margin: 0; font-size: 12px;">${address}</p>
            </div>
          </div>

          <div class="title">
            <h2>EXTRATO DE DÉBITOS E REGULARIZAÇÃO</h2>
            <p style="margin: 4px 0; font-size: 12px; color: #64748b;">Emitido em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>

          <div class="customer-box">
            <div><strong>Cliente:</strong> ${group.customerName}</div>
            <div><strong>WhatsApp / Tel:</strong> ${group.whatsapp || group.phone || 'Não informado'}</div>
            <div><strong>CPF/CNPJ:</strong> ${group.cpf || group.cnpj || 'Não informado'}</div>
            <div><strong>Vencimento Fixo:</strong> ${group.billingDay ? `Todo dia ${String(group.billingDay).padStart(2, '0')}` : 'Não cadastrado'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Nota</th>
                <th>Data Venda</th>
                <th>Vencimento</th>
                <th style="text-align: right;">Original</th>
                <th style="text-align: right;">Pago</th>
                <th style="text-align: right;">Saldo</th>
                <th style="text-align: right;">Juros/Multa</th>
                <th style="text-align: right;">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="totals-box">
            <div class="totals-row"><span>Total Original:</span><span>${formatBRL(group.totalOriginal)}</span></div>
            <div class="totals-row"><span>Total Já Pago:</span><span style="color: #16a34a;">${formatBRL(group.totalPaid)}</span></div>
            <div class="totals-row"><span>Saldo Principal:</span><span>${formatBRL(group.totalBalance)}</span></div>
            <div class="totals-row"><span>Encargos (Multa/Juros):</span><span style="color: #dc2626;">+ ${formatBRL(group.totalFineInterest)}</span></div>
            <div class="totals-row totals-grand"><span>TOTAL ATUALIZADO:</span><span>${formatBRL(group.totalUpdated)}</span></div>
          </div>

          <div class="signature-box">
            <div class="sig-line">Kombat Moto Peças</div>
            <div class="sig-line">${group.customerName}</div>
          </div>

          <div class="footer">
            Chave PIX para pagamento: <strong>${phone}</strong><br/>
            Documento gerado para conferência e regularização financeira.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Carnê e Promissória Individuais
  const generateCarne = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; border: 2px solid #333;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; align-items: center;">
          <img src="${companyLogo || ''}" style="max-height: 80px;" alt="Logo" />
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #e11d48;">KOMBAT MOTO PEÇAS</h2>
            <p style="margin: 5px 0;">${companyData.telefone}</p>
            <p style="margin: 0; font-size: 12px;">${companyData.endereco}, ${companyData.cidade}-PR</p>
          </div>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <h1 style="text-transform: uppercase; letter-spacing: 2px;">CARNÊ DE PAGAMENTO</h1>
          <p>Documento No: ${String(sale.id).slice(-8).toUpperCase()}</p>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
            <p><strong>BENEFICIÁRIO:</strong> ${companyData.razaoSocial || companyData.nomeFantasia}</p>
            <p><strong>CNPJ:</strong> ${companyData.cnpj}</p>
            <hr />
            <p><strong>PAGADOR:</strong> ${sale.customer_name}</p>
          </div>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa;">
            <p><strong>VENCIMENTO:</strong> ${formatDateSafe(sale.due_date)}</p>
            <p style="font-size: 1.2em; color: #e11d48;"><strong>VALOR: R$ ${sale.total.toFixed(2)}</strong></p>
          </div>
        </div>
        <p style="font-size: 12px; color: #666; font-style: italic;">
          * Após o vencimento, cobrar multa de ${fiadoSettings.lateFeeRate}% e juros de ${fiadoSettings.lateInterestRate}% ao mês.
          Local de pagamento: Kombat Moto Peças ou via PIX ${companyData.telefone}.
        </p>
      </div>
    `;
    printWindow.document.write(`<html><head><title>Carnê - ${sale.customer_name}</title></head><body onload="window.print()">${content}</body></html>`);
    printWindow.document.close();
  };

  const generatePromissoryNote = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <div style="font-family: serif; max-width: 900px; margin: 50px auto; padding: 40px; border: 4px solid #000; position: relative;">
        <div style="position: absolute; top: 10px; right: 20px; font-size: 24px; font-weight: bold;">Nº ${String(sale.id).slice(-6).toUpperCase()}</div>
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 40px; margin: 0;">NOTA PROMISSÓRIA</h1>
          <p style="font-size: 18px;">VENCIMENTO: ${formatDateSafe(sale.due_date)}</p>
        </div>
        <p style="font-size: 20px; line-height: 2; text-align: justify;">
          Aos <strong>${formatDateSafe(sale.due_date)}</strong> pagarei por esta via única de NOTA PROMISSÓRIA a 
          <strong>${companyData.razaoSocial || companyData.nomeFantasia}</strong>, CNPJ <strong>${companyData.cnpj}</strong>, ou à sua ordem, a quantia de 
          <strong>R$ ${sale.total.toFixed(2)}</strong> pagável em <strong>Andirá-PR</strong>.
        </p>
      </div>
    `;
    printWindow.document.write(`<html><head><title>Promissória - ${sale.customer_name}</title></head><body onload="window.print()">${content}</body></html>`);
    printWindow.document.close();
  };

  // --- QUITAÇÃO INDIVIDUAL DE DÉBITO ---
  const handleSettleSingleSale = async (sale: Sale, paymentMethod: string = 'Dinheiro') => {
    if (!confirm(`Confirmar recebimento integral da nota #${String(sale.id).slice(-6).toUpperCase()} no valor de ${formatBRL(sale.total)}?`)) {
      return;
    }
    const paidDate = new Date().toISOString();
    try {
      try {
        await localApi.patch('sales', sale.id, 'partial-payment', {
          paid_total: sale.total,
          payment_status: 'Pago',
          paid_date: paidDate
        });
      } catch (patchErr) {
        await localApi.put('sales', sale.id, {
          ...sale,
          paid_total: sale.total,
          payment_status: 'Pago',
          paid_date: paidDate
        });
      }

      if (activeSession && paymentMethod === 'Dinheiro') {
        try {
          await localApi.post('cash_transactions', {
            session_id: activeSession.id,
            type: 'Suprimento',
            amount: Math.max(0, sale.total - (sale.paid_total || 0)),
            description: `Quitação Fiado Nota #${String(sale.id).slice(-6).toUpperCase()} (${sale.customer_name})`,
            date: paidDate
          });
        } catch (e) {
          console.warn(e);
        }
      }

      fetchData();
      alert(`Nota #${String(sale.id).slice(-6).toUpperCase()} liquidada com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao liquidar nota:', err);
      alert('Erro ao liquidar nota: ' + (err.message || 'Erro no servidor'));
    }
  };

  // --- QUITAÇÃO EM LOTE ---
  const handleExecuteBatchSettle = async () => {
    if (selectedNoteIds.length === 0) return;
    setIsProcessingBatch(true);
    try {
      let settledCount = 0;
      let totalSettled = 0;
      const paidDate = batchPaymentDate || new Date().toISOString().split('T')[0];

      for (const id of selectedNoteIds) {
        const sale = allSales.find(s => String(s.id) === String(id));
        if (!sale) continue;

        const remaining = Math.max(0, sale.total - (sale.paid_total || 0));

        try {
          await localApi.patch('sales', id, 'partial-payment', {
            paid_total: sale.total,
            payment_status: 'Pago',
            paid_date: paidDate
          });
        } catch (patchErr) {
          await localApi.put('sales', id, {
            ...sale,
            paid_total: sale.total,
            payment_status: 'Pago',
            paid_date: paidDate
          });
        }

        settledCount++;
        totalSettled += remaining;
      }

      if (activeSession && batchPaymentMethod === 'Dinheiro' && totalSettled > 0) {
        try {
          await localApi.post('cash_transactions', {
            session_id: activeSession.id,
            type: 'Suprimento',
            amount: totalSettled,
            description: `Baixa em Lote (${settledCount} notas fiado)`,
            date: paidDate
          });
        } catch (cashErr) {
          console.warn('Erro ao registrar no caixa:', cashErr);
        }
      }

      fetchData();
      setSelectedNoteIds([]);
      setIsBatchSettleModalOpen(false);
      alert(`${settledCount} nota(s) liquidada(s) com sucesso! Total recebido: ${formatBRL(totalSettled)}.`);
    } catch (err: any) {
      console.error('Erro ao liquidar em lote:', err);
      alert('Erro ao liquidar notas: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // --- REGULARIZAÇÃO NA CENTRAL (RECEBER SELECIONADAS) ---
  const handleExecuteRegularizacaoSettlement = async () => {
    if (!regularizacaoGroup || regSelectedNotes.length === 0) {
      alert('Selecione ao menos uma nota para receber.');
      return;
    }
    setIsProcessingReg(true);
    try {
      const paidDate = new Date().toISOString();
      let totalReceived = 0;

      for (const id of regSelectedNotes) {
        const sale = allSales.find(s => String(s.id) === String(id));
        if (!sale) continue;

        const remaining = Math.max(0, sale.total - (sale.paid_total || 0));
        try {
          await localApi.patch('sales', id, 'partial-payment', {
            paid_total: sale.total,
            payment_status: 'Pago',
            paid_date: paidDate
          });
        } catch (patchErr) {
          await localApi.put('sales', id, {
            ...sale,
            paid_total: sale.total,
            payment_status: 'Pago',
            paid_date: paidDate
          });
        }
        totalReceived += remaining;
      }

      if (activeSession && regPaymentMethod === 'Dinheiro' && totalReceived > 0) {
        try {
          await localApi.post('cash_transactions', {
            session_id: activeSession.id,
            type: 'Suprimento',
            amount: totalReceived,
            description: `Regularização de Débito - Cliente ${regularizacaoGroup.customerName}`,
            date: paidDate
          });
        } catch (e) {
          console.warn(e);
        }
      }

      fetchData();
      setRegularizacaoGroup(null);
      setRegSelectedNotes([]);
      alert(`Recebimento de ${formatBRL(totalReceived)} regularizado com sucesso para ${regularizacaoGroup.customerName}!`);
    } catch (err: any) {
      console.error('Erro na regularização:', err);
      alert('Erro ao processar recebimento: ' + (err.message || 'Erro no servidor'));
    } finally {
      setIsProcessingReg(false);
    }
  };

  // --- AMORTIZAÇÃO NA CENTRAL DE REGULARIZAÇÃO ---
  const handleExecuteAmortization = async () => {
    if (!regularizacaoGroup) return;
    const amount = parseFloat(regAmortizeAmount.replace(',', '.')) || 0;
    if (amount <= 0) {
      alert('Informe um valor válido para amortização.');
      return;
    }

    setIsProcessingReg(true);
    let remainingToApply = amount;
    const sortedNotes = [...regularizacaoGroup.notes].sort((a, b) => {
      const dA = a.sale.due_date || '9999-99-99';
      const dB = b.sale.due_date || '9999-99-99';
      return dA.localeCompare(dB);
    });
    const paidDate = new Date().toISOString();

    try {
      for (const noteItem of sortedNotes) {
        if (remainingToApply <= 0) break;
        const sale = noteItem.sale;
        const noteBalance = Math.max(0, (sale.total || 0) - (sale.paid_total || 0));
        if (noteBalance <= 0) continue;

        const applyAmount = Math.min(remainingToApply, noteBalance);
        const currentPaid = sale.paid_total || 0;
        const newPaid = Number((currentPaid + applyAmount).toFixed(2));
        const newStatus = newPaid >= (sale.total || 0) ? 'Pago' : 'Pendente';

        try {
          await localApi.patch('sales', sale.id, 'partial-payment', {
            paid_total: newPaid,
            payment_status: newStatus,
            paid_date: paidDate
          });
        } catch (patchErr) {
          await localApi.put('sales', sale.id, {
            ...sale,
            paid_total: newPaid,
            payment_status: newStatus,
            paid_date: paidDate
          });
        }

        remainingToApply = Number((remainingToApply - applyAmount).toFixed(2));
      }

      if (activeSession && regPaymentMethod === 'Dinheiro') {
        try {
          await localApi.post('cash_transactions', {
            session_id: activeSession.id,
            type: 'Suprimento',
            amount: amount,
            description: `Amortização Fiado - Cliente ${regularizacaoGroup.customerName}`,
            date: paidDate
          });
        } catch (cashErr) {
          console.warn('Erro ao registrar no caixa:', cashErr);
        }
      }

      fetchData();
      setRegularizacaoGroup(null);
      setRegAmortizeAmount('');
      alert(`Amortização de ${formatBRL(amount)} realizada com sucesso para ${regularizacaoGroup.customerName}!`);
    } catch (err: any) {
      console.error('Erro na amortização:', err);
      alert('Erro ao processar amortização: ' + (err.message || 'Erro no servidor'));
    } finally {
      setIsProcessingReg(false);
    }
  };

  // --- PAGAMENTO PARCIAL INDIVIDUAL ---
  const handleExecuteSinglePartial = async () => {
    if (!partialModalSale) return;
    const amount = parseFloat(partialAmountInput.replace(',', '.')) || 0;
    if (amount <= 0) {
      alert('Informe um valor válido de pagamento.');
      return;
    }
    const currentPaid = partialModalSale.paid_total || 0;
    const newPaid = Number((currentPaid + amount).toFixed(2));
    const newStatus = newPaid >= (partialModalSale.total || 0) ? 'Pago' : 'Pendente';
    const paidDate = new Date().toISOString();

    setIsProcessingPartial(true);
    try {
      try {
        await localApi.patch('sales', partialModalSale.id, 'partial-payment', {
          paid_total: newPaid,
          payment_status: newStatus,
          paid_date: paidDate
        });
      } catch (patchErr) {
        await localApi.put('sales', partialModalSale.id, {
          ...partialModalSale,
          paid_total: newPaid,
          payment_status: newStatus,
          paid_date: paidDate
        });
      }

      if (activeSession && partialMethodInput === 'Dinheiro') {
        try {
          await localApi.post('cash_transactions', {
            session_id: activeSession.id,
            type: 'Suprimento',
            amount: amount,
            description: `Recebimento Parcial Nota #${String(partialModalSale.id).slice(-6).toUpperCase()} (${partialModalSale.customer_name})`,
            date: paidDate
          });
        } catch (e) {
          console.warn(e);
        }
      }

      fetchData();
      setPartialModalSale(null);
      setPartialAmountInput('');
      alert(`Recebimento de ${formatBRL(amount)} registrado! Saldo restante: ${formatBRL(Math.max(0, partialModalSale.total - newPaid))}`);
    } catch (err: any) {
      console.error('Erro ao registrar parcial:', err);
      alert('Erro: ' + (err.message || 'Erro no servidor'));
    } finally {
      setIsProcessingPartial(false);
    }
  };

  // Handlers de Caixa
  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await localApi.post('cash_sessions', {
        opened_at: new Date().toISOString(),
        opening_balance: parseFloat(cashForm.openingBalance.toString().replace(',', '.')) || 0,
        status: 'Aberto',
        notes: cashForm.notes
      });
      setIsCashModalOpen(false);
      setCashForm({ openingBalance: '', notes: '' });
      await loadFinancialData();
      if (fetchData) fetchData();
      alert('Caixa aberto com sucesso!');
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error);
      alert(error?.message || 'Erro ao abrir caixa.');
    }
  };

  const handleCloseCash = async () => {
    if (!activeSession) return;
    const closingBalance = prompt("Informe o saldo final em dinheiro no caixa:");
    if (closingBalance === null) return;

    const sessionSales = (allSales || []).filter(s => s.date >= activeSession.openedAt && s.payment_method === 'Dinheiro');
    const totalSales = sessionSales.reduce((acc, s) => acc + s.total, 0);
    const sessionTransactions = cashTransactions.filter(t => t.sessionId === activeSession.id);
    const totalTransactions = sessionTransactions.reduce((acc, t) => acc + (t.type === 'Suprimento' ? t.amount : -t.amount), 0);
    const expected = activeSession.openingBalance + totalSales + totalTransactions;

    try {
      await localApi.put('cash_sessions', activeSession.id, {
        closed_at: new Date().toISOString(),
        closing_balance: parseFloat(closingBalance) || 0,
        expected_balance: expected,
        status: 'Fechado'
      });
      setActiveSession(null);
      alert(`Caixa fechado! \nEsperado: R$ ${expected.toFixed(2)} \nInformado: R$ ${parseFloat(closingBalance).toFixed(2)} \nDiferença: R$ ${(parseFloat(closingBalance) - expected).toFixed(2)}`);
      await loadFinancialData();
      if (fetchData) fetchData();
    } catch (error: any) {
      console.error('Erro ao fechar caixa:', error);
      alert(error?.message || 'Erro ao fechar caixa.');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await localApi.post('cash_transactions', {
        session_id: activeSession?.id,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount.toString().replace(',', '.')) || 0,
        description: transactionForm.description,
        date: new Date().toISOString()
      });
      setIsTransactionModalOpen(false);
      setTransactionForm({ type: 'Sangria', amount: '', description: '' });
      await loadFinancialData();
      if (fetchData) fetchData();
      alert('Movimentação registrada!');
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      alert(error?.message || 'Erro ao registrar movimentação.');
    }
  };

  // Upload e Parsing de Boleto por IA
  const handleUploadBoleto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingBoleto(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const key = localStorage.getItem('gemini_api_key') || '';
          const parsedData = await localApi.post('public/parse-boleto', { fileContent: base64, apiKey: key });
          
          const hasData = parsedData && (parsedData.fornecedor || parsedData.valor || parsedData.linha_digitavel || parsedData.codigo_pix);
          
          if (hasData) {
            const valorStr = parsedData.valor ? parsedData.valor.toString() : '0';
            const payload = {
              fornecedor: parsedData.fornecedor || 'Boleto Importado',
              valor: parseFloat(valorStr.replace(',', '.')) || 0,
              due_date: parsedData.data_vencimento || new Date().toISOString().split('T')[0],
              linha_digitavel: parsedData.linha_digitavel || '',
              codigo_pix: parsedData.codigo_pix || '',
              status: 'Pendente'
            };
            
            await localApi.post('accounts_payable', payload);
            loadAccountsPayable();
            setIsPayableModalOpen(false);
            alert(`Boleto de ${payload.fornecedor} no valor de ${formatBRL(payload.valor)} cadastrado com sucesso!`);
          } else {
            alert("Não foi possível extrair dados automaticamente. Por favor, preencha manualmente.");
          }
        } catch (err: any) {
          console.error("Erro no parse do boleto:", err);
          alert("Não foi possível ler o boleto: " + err.message);
        } finally {
          setIsParsingBoleto(false);
        }
      };
    } catch (err: any) {
      alert("Erro ao ler arquivo: " + err.message);
      setIsParsingBoleto(false);
    }
  };

  const handleAddPayable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...payableForm,
        valor: parseFloat(payableForm.valor.replace(',', '.')) || 0
      };

      if (editingPayableId) {
        await localApi.put('accounts_payable', editingPayableId, payload);
        alert('Conta a pagar atualizada com sucesso!');
      } else {
        await localApi.post('accounts_payable', payload);
        alert('Conta a pagar cadastrada com sucesso!');
      }

      setIsPayableModalOpen(false);
      setEditingPayableId(null);
      setPayableForm({
        fornecedor: '',
        valor: '',
        due_date: new Date().toISOString().split('T')[0],
        linha_digitavel: '',
        codigo_pix: ''
      });
      loadAccountsPayable();
    } catch (err: any) {
      alert('Erro ao salvar conta: ' + err.message);
    }
  };

  const handleEditPayableClick = (item: any) => {
    setEditingPayableId(item.id);
    setPayableForm({
      fornecedor: item.fornecedor || '',
      valor: item.valor ? item.valor.toString().replace('.', ',') : '',
      due_date: item.due_date || new Date().toISOString().split('T')[0],
      linha_digitavel: item.linha_digitavel || '',
      codigo_pix: item.codigo_pix || ''
    });
    setIsPayableModalOpen(true);
  };

  const handleLiquidatePayable = async (id: number) => {
    if (!confirm('Confirmar pagamento desta conta?')) return;
    try {
      const bill = accountsPayable.find(a => a.id === id);
      if (!bill) return;
      await localApi.put('accounts_payable', id, {
        ...bill,
        status: 'Pago',
        paid_date: new Date().toISOString().split('T')[0]
      });
      loadAccountsPayable();
      alert('Conta liquidada com sucesso!');
    } catch (err: any) {
      alert('Erro ao liquidar conta: ' + err.message);
    }
  };

  const handleDeletePayable = async (id: number) => {
    const reason = prompt('Motivo do cancelamento desta conta a pagar (obrigatório para auditoria):');
    if (!reason || !reason.trim()) {
      alert('O cancelamento exige um motivo justificado para registro de auditoria.');
      return;
    }
    try {
      await localApi.post(`accounts_payable/${id}/cancel`, { reason: reason.trim() });
      loadAccountsPayable();
      alert('Conta a pagar cancelada com sucesso!');
    } catch (err: any) {
      alert('Erro ao cancelar conta: ' + (err.message || err));
    }
  };

  // --- FECHAMENTO DE CLIENTE ---
  const [closingCustomerId, setClosingCustomerId] = React.useState<string>('');
  const [closingPeriodType, setClosingPeriodType] = React.useState<'day' | 'month' | 'year' | 'interval'>('month');
  const [closingDate, setClosingDate] = React.useState<string>(() => new Date().toISOString().split('T')[0]);
  const [closingMonthYear, setClosingMonthYear] = React.useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [closingYear, setClosingYear] = React.useState<string>(() => new Date().getFullYear().toString());
  const [closingStartDate, setClosingStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [closingEndDate, setClosingEndDate] = React.useState<string>(() => new Date().toISOString().split('T')[0]);
  const [closingResult, setClosingResult] = React.useState<any>(null);

  const handleCalculateClosing = () => {
    if (!closingCustomerId) {
      alert("Selecione um cliente para o fechamento.");
      return;
    }

    const customerIdNum = parseInt(closingCustomerId);
    let customerSales = (allSales || []).filter(s => s.customer_id === customerIdNum);

    customerSales = customerSales.filter(s => {
      const saleDate = new Date(s.date);
      const saleDateLocal = new Date(saleDate.getTime() - (saleDate.getTimezoneOffset() * 60000));
      
      if (closingPeriodType === 'day') {
        return saleDateLocal.toISOString().split('T')[0] === closingDate;
      } else if (closingPeriodType === 'month') {
        const [year, month] = closingMonthYear.split('-');
        return saleDateLocal.getFullYear() === parseInt(year) && (saleDateLocal.getMonth() + 1) === parseInt(month);
      } else if (closingPeriodType === 'interval') {
        const isoDate = saleDateLocal.toISOString().split('T')[0];
        return isoDate >= closingStartDate && isoDate <= closingEndDate;
      } else {
        return saleDateLocal.getFullYear() === parseInt(closingYear);
      }
    });

    if (customerSales.length === 0) {
      alert("Nenhum registro financeiro encontrado para este cliente neste período.");
      setClosingResult(null);
      return;
    }

    let totalPecas = 0;
    let totalServicos = 0;
    let totalBruto = 0;
    let totalLiquido = 0;

    const pecasList: any[] = [];
    const servicosList: any[] = [];

    customerSales.forEach(sale => {
      let saleTotalPecas = 0;
      let saleTotalServicos = 0;
      let hasLaborInItems = false;

      (sale.items || sale.sale_items || []).forEach(item => {
        if (item.type === 'Adicional Interno') return;
        const itemTotal = item.price * item.quantity;
        if (item.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS' || item.type === 'Serviço Principal') {
          hasLaborInItems = true;
        }

        if (item.type === 'Serviço' || item.type === 'Serviço Principal' || item.description.toUpperCase().includes('MÃO DE OBRA')) {
          totalServicos += itemTotal;
          saleTotalServicos += itemTotal;
          servicosList.push({ ...item, date: sale.date, saleId: sale.id });
        } else {
          totalPecas += itemTotal;
          saleTotalPecas += itemTotal;
          pecasList.push({ ...item, date: sale.date, saleId: sale.id });
        }
      });

      if (sale.type === 'Oficina' && sale.labor_value > 0 && !hasLaborInItems) {
        totalServicos += sale.labor_value;
        saleTotalServicos += sale.labor_value;
        servicosList.push({ 
          description: 'Mão de Obra (Registro Antigo)', 
          quantity: 1, 
          price: sale.labor_value, 
          date: sale.date, 
          saleId: sale.id 
        });
      }

      totalBruto += (saleTotalPecas + saleTotalServicos);
      totalLiquido += sale.total;
    });

    const descontos = totalBruto > totalLiquido ? (totalBruto - totalLiquido) : 0;
    const acrescimos = totalLiquido > totalBruto ? (totalLiquido - totalBruto) : 0;
    const customerDetails = customers.find(c => c.id === customerIdNum);

    setClosingResult({
      customerName: customerDetails?.name,
      customerDetails,
      periodLabel: closingPeriodType === 'day' 
        ? new Date(closingDate + 'T00:00:00').toLocaleDateString('pt-BR') 
        : closingPeriodType === 'month' 
          ? closingMonthYear.split('-').reverse().join('/') 
          : closingPeriodType === 'interval'
            ? `${new Date(closingStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(closingEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
            : closingYear,
      totalPecas,
      totalServicos,
      totalBruto,
      totalLiquido,
      descontos,
      acrescimos,
      pecasList,
      servicosList
    });
  };

  const handlePrintClosing = () => {
    if (!closingResult) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0; text-transform: uppercase;">Resumo de Fechamento</h2>
          <h3 style="margin: 5px 0;">${closingResult.customerName}</h3>
          <p style="margin: 0; color: #666;">Período: ${closingResult.periodLabel}</p>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1;">
            <h4 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Peças e Acessórios</h4>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
              ${closingResult.pecasList.length === 0 ? '<li style="color: #999;">Nenhuma peça no período.</li>' : closingResult.pecasList.map((p: any) => `
                <li style="display: flex; justify-content: space-between; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #eee;">
                  <span>${p.quantity}x ${p.description} <small style="color:#999">(${new Date(p.date).toLocaleDateString('pt-BR')})</small></span>
                  <strong>${formatBRL(p.price * p.quantity)}</strong>
                </li>
              `).join('')}
            </ul>
            <p style="text-align: right; margin-top: 10px;"><strong>Subtotal Peças: ${formatBRL(closingResult.totalPecas)}</strong></p>
          </div>

          <div style="flex: 1;">
            <h4 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Mão de Obra e Serviços</h4>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
              ${closingResult.servicosList.length === 0 ? '<li style="color: #999;">Nenhum serviço no período.</li>' : closingResult.servicosList.map((s: any) => `
                <li style="display: flex; justify-content: space-between; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #eee;">
                  <span>${s.quantity}x ${s.description} <small style="color:#999">(${new Date(s.date).toLocaleDateString('pt-BR')})</small></span>
                  <strong>${formatBRL(s.price * s.quantity)}</strong>
                </li>
              `).join('')}
            </ul>
            <p style="text-align: right; margin-top: 10px;"><strong>Subtotal Serviços: ${formatBRL(closingResult.totalServicos)}</strong></p>
          </div>
        </div>

        <div style="border: 2px solid #333; padding: 15px; border-radius: 8px; background: #f9f9f9;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0;">Total em Peças:</td><td style="text-align: right; padding: 4px 0;">${formatBRL(closingResult.totalPecas)}</td></tr>
            <tr><td style="padding: 4px 0;">Total em Serviços:</td><td style="text-align: right; padding: 4px 0;">${formatBRL(closingResult.totalServicos)}</td></tr>
            ${closingResult.descontos > 0 ? `<tr><td style="color: green; padding: 4px 0;">(-) Descontos Aplicados:</td><td style="text-align: right; color: green; padding: 4px 0;">${formatBRL(closingResult.descontos)}</td></tr>` : ''}
            ${closingResult.acrescimos > 0 ? `<tr><td style="color: red; padding: 4px 0;">(+) Acréscimos/Taxas:</td><td style="text-align: right; color: red; padding: 4px 0;">${formatBRL(closingResult.acrescimos)}</td></tr>` : ''}
            <tr><td colspan="2"><hr style="border-top: 1px solid #ccc; margin: 10px 0;" /></td></tr>
            <tr>
              <td style="padding: 4px 0;"><strong>VALOR TOTAL GERAL A PAGAR:</strong></td>
              <td style="text-align: right; font-size: 18px; padding: 4px 0;"><strong>${formatBRL(closingResult.totalLiquido)}</strong></td>
            </tr>
          </table>
        </div>
        <p style="text-align: center; font-size: 12px; margin-top: 30px; color: #666;">Impresso em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `;

    printWindow.document.write(`<html><head><title>Fechamento - ${closingResult.customerName}</title></head><body onload="window.print()">${content}</body></html>`);
    printWindow.document.close();
  };

  // Cálculos de Caixa
  const monthlySales = sales || [];
  const productSales = monthlySales.reduce((acc, s) => {
    const items = s.items || s.sale_items || [];
    const partsItems = items.filter(i => 
      (i.product_id || i.type === 'Peça' || (!i.type && i.product_id)) && 
      i.type !== 'Serviço' && i.type !== 'Serviço Principal' && i.type !== 'Adicional Interno'
    );
    let partsVal = partsItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (items.length === 0) {
      partsVal = Math.max(0, s.total - (s.labor_value || 0));
    }
    return acc + partsVal;
  }, 0);

  const productCosts = monthlySales.reduce((acc, s) => {
    const items = s.items || s.sale_items || [];
    const partsItems = items.filter(i => 
      (i.product_id || i.type === 'Peça' || (!i.type && i.product_id)) && 
      i.type !== 'Serviço' && i.type !== 'Serviço Principal' && i.type !== 'Adicional Interno'
    );
    return acc + partsItems.reduce((sum, i) => {
      const product = products.find(p => p.id === i.product_id);
      return sum + ((product?.purchase_price || 0) * i.quantity);
    }, 0);
  }, 0);

  const productProfit = productSales - productCosts;
  const profitMargin = productSales > 0 ? (productProfit / productSales) * 100 : 0;

  const serviceSales = monthlySales.reduce((acc, s) => {
    const items = s.items || s.sale_items || [];
    const serviceItems = items.filter(i => 
      i.type === 'Serviço' || 
      i.type === 'Serviço Principal' || 
      i.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS'
    );
    let serviceVal = serviceItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (serviceVal === 0 && (s.labor_value || 0) > 0) {
      serviceVal = s.labor_value;
    }
    return acc + serviceVal;
  }, 0);

  const totalRevenue = productSales + serviceSales;

  return (
    <div className="w-full max-w-[98%] mx-auto space-y-6 pb-12 font-sans select-none">
      
      {/* HEADER DE GESTÃO FINANCEIRA PREMIUM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0A101D] border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
            <CreditCard size={26} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">Gestão Financeira Premium</h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                ERP Kombat 4.0
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Controle de recebimentos, agrupamento por clientes de A a Z e quitação inteligente
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO SECUNDÁRIA DAS ABAS */}
        <div className="flex flex-wrap bg-[#0E1726] p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'receber', label: 'Contas a Receber', icon: CreditCard },
            { id: 'caixa', label: 'Fluxo de Caixa', icon: Wallet },
            { id: 'pagar', label: 'Contas a Pagar', icon: ArrowDownCircle },
            { id: 'fechamento', label: 'Fechamento de Cliente', icon: FileText },
            { id: 'taxas', label: 'Taxas de Cartão', icon: Calculator },
            { id: 'automacao', label: 'Cobrança & Alertas', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFinancialTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs ${
                financialTab === tab.id 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PAINEL SUPERIOR: 8 INDICADORES FINANCEIROS OBRIGATÓRIOS (ERP PREMIUM) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total a Receber */}
        <div 
          onClick={() => { setFinancialTab('receber'); setReceberFilterTab('todos'); }}
          className="bg-[#0E1726] border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total a Receber</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><DollarSign size={15} /></div>
          </div>
          <p className="text-base font-black text-white truncate">{formatBRL(statsKPI.totalReceberAtualizado)}</p>
          <p className="text-[10px] font-medium text-slate-400 mt-1 truncate">Saldo: {formatBRL(statsKPI.totalReceberPrincipal)}</p>
        </div>

        {/* 2. Total Vencido */}
        <div 
          onClick={() => { setFinancialTab('receber'); setReceberFilterTab('vencidos'); }}
          className="bg-[#0E1726] border border-rose-900/30 hover:border-rose-700/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Total Vencido</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><AlertTriangle size={15} /></div>
          </div>
          <p className="text-base font-black text-rose-500 truncate">{formatBRL(statsKPI.totalVencido)}</p>
          <p className="text-[10px] font-bold text-rose-400 mt-1">{statsKPI.countVencidos} título(s) vencido(s)</p>
        </div>

        {/* 3. Vence Hoje */}
        <div 
          onClick={() => { setFinancialTab('receber'); setReceberFilterTab('hoje'); }}
          className="bg-[#0E1726] border border-amber-900/30 hover:border-amber-700/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Vence Hoje</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Clock size={15} /></div>
          </div>
          <p className="text-base font-black text-amber-400 truncate">{formatBRL(statsKPI.totalVenceHoje)}</p>
          <p className="text-[10px] font-bold text-amber-300 mt-1">{statsKPI.countVenceHoje} nota(s) hoje</p>
        </div>

        {/* 4. A Vencer */}
        <div 
          onClick={() => { setFinancialTab('receber'); setReceberFilterTab('avencer'); }}
          className="bg-[#0E1726] border border-blue-900/30 hover:border-blue-700/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">A Vencer</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Calendar size={15} /></div>
          </div>
          <p className="text-base font-black text-blue-400 truncate">{formatBRL(statsKPI.totalAVencer)}</p>
          <p className="text-[10px] font-medium text-slate-400 mt-1">{statsKPI.countAVencer} nota(s) futuras</p>
        </div>

        {/* 5. Recebido no Mês */}
        <div 
          className="bg-[#0E1726] border border-emerald-900/30 hover:border-emerald-700/50 p-3.5 rounded-xl shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Recebido no Mês</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><ShieldCheck size={15} /></div>
          </div>
          <p className="text-base font-black text-emerald-400 truncate">{formatBRL(statsKPI.recebidoNoMes)}</p>
          <p className="text-[10px] font-medium text-slate-400 mt-1">Efetivamente recebido</p>
        </div>

        {/* 6. Clientes Inadimplentes */}
        <div 
          onClick={() => { setFinancialTab('receber'); setReceberFilterTab('vencidos'); }}
          className="bg-[#0E1726] border border-purple-900/30 hover:border-purple-700/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Inadimplentes</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><User size={15} /></div>
          </div>
          <p className="text-base font-black text-purple-300 truncate">{statsKPI.clientesInadimplentes} clientes</p>
          <p className="text-[10px] font-medium text-slate-400 mt-1">de {statsKPI.totalClientesComFiado} com fiado</p>
        </div>

        {/* 7. Total a Pagar */}
        <div 
          onClick={() => setFinancialTab('pagar')}
          className="bg-[#0E1726] border border-rose-950/40 hover:border-rose-800/60 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">Total a Pagar</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><ArrowDownCircle size={15} /></div>
          </div>
          <p className="text-base font-black text-white truncate">{formatBRL(statsKPI.totalPagarPendente)}</p>
          <p className="text-[10px] font-bold text-rose-400 mt-1">Fornecedores/Desp.</p>
        </div>

        {/* 8. Saldo de Caixa */}
        <div 
          onClick={() => setFinancialTab('caixa')}
          className="bg-[#0E1726] border border-cyan-900/30 hover:border-cyan-700/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Saldo Caixa</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400"><Wallet size={15} /></div>
          </div>
          <p className="text-base font-black text-cyan-300 truncate">
            {statsKPI.isCaixaAberto ? formatBRL(statsKPI.saldoCaixaAtual) : 'Fechado'}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-1">
            {statsKPI.isCaixaAberto ? 'Sessão aberta' : 'Nenhuma sessão'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: CONTAS A RECEBER (MODERNIZADA COM AGRUPAMENTO E ORDEM ALFABÉTICA) */}
      {/* ========================================================================= */}
      {financialTab === 'receber' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* BARRA DE PESQUISA FINANCEIRA INTELIGENTE + FILTROS PROFISSIONAIS */}
          <div className="bg-[#0E1726] border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Input de Busca Grande */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={receberSearchTerm}
                onChange={e => setReceberSearchTerm(e.target.value)}
                placeholder="Buscar cliente, apelido, CPF, CNPJ, telefone ou número da nota..."
                className="w-full pl-10 pr-10 py-3 bg-[#080D1A] border border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
              />
              {receberSearchTerm && (
                <button
                  onClick={() => setReceberSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filtros Rápidos (Pills) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#080D1A] p-1.5 rounded-xl border border-slate-800">
              {[
                { id: 'todos', label: 'Todos', count: customerDebtGroups.length },
                { id: 'vencidos', label: 'Vencidos', count: customerDebtGroups.filter(g => g.hasOverdue).length, color: 'text-rose-400' },
                { id: 'hoje', label: 'Vence Hoje', count: customerDebtGroups.filter(g => g.hasDueToday).length, color: 'text-amber-400' },
                { id: 'avencer', label: 'A Vencer', count: customerDebtGroups.filter(g => !g.hasOverdue).length, color: 'text-blue-400' },
                { id: 'atraso30', label: '> 30 Dias', count: customerDebtGroups.filter(g => g.maxDaysOverdue >= 30).length, color: 'text-red-500' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setReceberFilterTab(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    receberFilterTab === f.id
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className={f.color}>{f.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Ordenação (A a Z Obrigatório por Padrão) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Ordem:</span>
              <div className="relative">
                <select
                  value={receberSortOrder}
                  onChange={e => setReceberSortOrder(e.target.value as any)}
                  className="bg-[#080D1A] text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-rose-500 pr-8 cursor-pointer appearance-none"
                >
                  <option value="az">Nome (A a Z) - Padrão</option>
                  <option value="za">Nome (Z a A)</option>
                  <option value="maior_divida">Maior Dívida</option>
                  <option value="maior_atraso">Maior Atraso</option>
                  <option value="vencimento_asc">Vencimento Mais Antigo</option>
                  <option value="vencimento_desc">Vencimento Mais Próximo</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Botões Expandir / Recolher Todos */}
              <button
                onClick={expandAllCustomers}
                className="p-2 rounded-xl bg-[#080D1A] border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-xs font-bold"
                title="Expandir todas as notas"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={collapseAllCustomers}
                className="p-2 rounded-xl bg-[#080D1A] border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-xs font-bold"
                title="Recolher todas as notas"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          {/* BARRA DE AÇÃO EM LOTE (SE HOUVER NOTAS SELECIONADAS) */}
          {selectedNoteIds.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-[#0E1726] to-emerald-950/80 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center justify-between shadow-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">
                    {selectedNoteIds.length} nota(s) selecionada(s)
                  </p>
                  <p className="text-xs font-bold text-emerald-400">
                    Total a Receber: {formatBRL(selectedTotal)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNoteIds([])}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
                >
                  Desmarcar Todas
                </button>
                <button
                  onClick={() => setIsBatchSettleModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Quitar Selecionadas ({selectedNoteIds.length})
                </button>
              </div>
            </div>
          )}

          {/* TABELA AGRUPADA POR CLIENTE (COM EXPANSÃO ACCORDION) */}
          <div className="bg-[#0E1726] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#080D1A] text-slate-400 text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                    <th className="px-4 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredAndSortedGroups.length > 0 &&
                          filteredAndSortedGroups.every(g =>
                            g.notes.every(n => selectedNoteIds.includes(String(n.sale.id)))
                          )
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            const allIds: string[] = [];
                            filteredAndSortedGroups.forEach(g => {
                              g.notes.forEach(n => allIds.push(String(n.sale.id)));
                            });
                            setSelectedNoteIds(allIds);
                          } else {
                            setSelectedNoteIds([]);
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        title="Selecionar todas as notas visíveis"
                      />
                    </th>
                    <th className="px-4 py-3.5">Cliente / Dados</th>
                    <th className="px-4 py-3.5 text-center">Notas Abertas</th>
                    <th className="px-4 py-3.5 text-right">Total Original</th>
                    <th className="px-4 py-3.5 text-right">Saldo Atualizado</th>
                    <th className="px-4 py-3.5 text-center">Situação / Atraso</th>
                    <th className="px-4 py-3.5 text-center">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAndSortedGroups.map(group => {
                    const isExpanded = !!expandedCustomerIds[String(group.customerId)];
                    const groupNoteIds = group.notes.map(n => String(n.sale.id));
                    const isAllGroupSelected = groupNoteIds.every(id => selectedNoteIds.includes(id));
                    const isSomeGroupSelected = groupNoteIds.some(id => selectedNoteIds.includes(id));

                    return (
                      <React.Fragment key={String(group.customerId)}>
                        {/* LINHA PRINCIPAL DO CLIENTE (AGRUPADA) */}
                        <tr 
                          className={`transition-colors duration-150 ${
                            isExpanded ? 'bg-slate-900/90' : 'hover:bg-slate-900/50'
                          } ${group.hasOverdue ? 'border-l-4 border-l-rose-600' : 'border-l-4 border-l-emerald-600'}`}
                        >
                          {/* Checkbox de todas as notas do cliente */}
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isAllGroupSelected}
                              ref={el => {
                                if (el) el.indeterminate = !isAllGroupSelected && isSomeGroupSelected;
                              }}
                              onChange={() => toggleSelectAllCustomerNotes(group)}
                              className="rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                              title="Selecionar todas as notas deste cliente"
                            />
                          </td>

                          {/* Nome e Dados do Cliente */}
                          <td className="px-4 py-4 cursor-pointer" onClick={() => toggleCustomerExpand(group.customerId)}>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleCustomerExpand(group.customerId); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                              >
                                {isExpanded ? <ChevronDown size={18} className="text-rose-500" /> : <ChevronRight size={18} />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-white text-sm hover:text-rose-400 transition-colors">
                                    {group.customerName}
                                  </span>
                                  {group.nickname && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                      {group.nickname}
                                    </span>
                                  )}
                                  {group.billingDay && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30" title="Dia fixo de vencimento mensal">
                                      Dia fixo: {String(group.billingDay).padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                  {(group.whatsapp || group.phone) && (
                                    <span className="flex items-center gap-1 font-mono text-[11px]">
                                      <Phone size={11} className="text-emerald-400" />
                                      {group.whatsapp || group.phone}
                                    </span>
                                  )}
                                  {(group.cpf || group.cnpj) && (
                                    <span className="text-[11px] font-mono text-slate-400">
                                      Doc: {group.cpf || group.cnpj}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    group.score >= 8 ? 'bg-emerald-500/10 text-emerald-400' :
                                    group.score >= 5 ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    Score: {group.score.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Quantidade de Notas Abertas */}
                          <td className="px-4 py-4 text-center cursor-pointer" onClick={() => toggleCustomerExpand(group.customerId)}>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-200 border border-slate-700">
                              <Receipt size={13} className="text-slate-400" />
                              {group.openNotesCount} {group.openNotesCount === 1 ? 'nota' : 'notas'}
                            </span>
                          </td>

                          {/* Total Original */}
                          <td className="px-4 py-4 text-right cursor-pointer" onClick={() => toggleCustomerExpand(group.customerId)}>
                            <p className="text-xs font-bold text-slate-400">
                              {formatBRL(group.totalOriginal)}
                            </p>
                            {group.totalPaid > 0 && (
                              <p className="text-[10px] text-emerald-400 font-medium">
                                Pago: {formatBRL(group.totalPaid)}
                              </p>
                            )}
                          </td>

                          {/* Saldo Atualizado */}
                          <td className="px-4 py-4 text-right cursor-pointer" onClick={() => toggleCustomerExpand(group.customerId)}>
                            <p className="text-sm font-black text-white">
                              {formatBRL(group.totalUpdated)}
                            </p>
                            {group.totalFineInterest > 0 && (
                              <p className="text-[10px] text-rose-400 font-bold">
                                + {formatBRL(group.totalFineInterest)} (encargos)
                              </p>
                            )}
                          </td>

                          {/* Faixa de Inadimplência / Situação */}
                          <td className="px-4 py-4 text-center cursor-pointer" onClick={() => toggleCustomerExpand(group.customerId)}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                                group.overdueCategory === 'Em dia' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                group.overdueCategory === '1 a 7 dias' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                group.overdueCategory === '8 a 15 dias' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                                group.overdueCategory === '16 a 30 dias' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                                'bg-red-600/25 text-red-400 border border-red-500/50'
                              }`}>
                                {group.overdueCategory}
                              </span>
                              {group.maxDaysOverdue > 0 && (
                                <span className="text-[10px] text-rose-400 font-bold">
                                  {group.maxDaysOverdue} dia(s) em atraso
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Ações Rápidas */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botão Regularizar Pendências */}
                              <button
                                onClick={() => {
                                  setRegularizacaoGroup(group);
                                  setRegSelectedNotes(group.notes.map(n => String(n.sale.id)));
                                  setRegTab('quitar');
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/40 transition-all flex items-center gap-1"
                                title="Abrir Central de Regularização deste cliente"
                              >
                                <Gavel size={13} />
                                Regularizar
                              </button>

                              {/* Cobrança WhatsApp Consolidada */}
                              <button
                                onClick={() => handleSendConsolidatedWhatsApp(group)}
                                className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all"
                                title="Enviar Cobrança Consolidada no WhatsApp"
                              >
                                <MessageCircle size={15} />
                              </button>

                              {/* Imprimir Extrato */}
                              <button
                                onClick={() => handlePrintCustomerStatement(group)}
                                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                                title="Imprimir Extrato Completo de Pendências"
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ACCORDION EXPANSÍVEL: TODAS AS NOTAS DESTE CLIENTE */}
                        {isExpanded && (
                          <tr className="bg-[#080D1A]/95 border-b border-slate-800">
                            <td colSpan={7} className="p-4 pl-12 pr-4">
                              <div className="bg-[#0B1120] border border-slate-800 rounded-xl overflow-hidden p-3 shadow-inner">
                                <div className="flex items-center justify-between mb-3 px-1">
                                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                                    <Receipt size={14} className="text-rose-500" />
                                    Notas Individuais de {group.customerName} ({group.notes.length})
                                  </h4>
                                  <span className="text-[11px] text-slate-400">
                                    Clique nas ações para baixar individualmente ou cobrar esta nota
                                  </span>
                                </div>

                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="text-slate-400 text-[10px] font-black uppercase border-b border-slate-800 pb-2">
                                      <th className="py-2 px-2 w-8 text-center">Sel.</th>
                                      <th className="py-2 px-2">Cód. Nota</th>
                                      <th className="py-2 px-2">Emissão</th>
                                      <th className="py-2 px-2">Vencimento</th>
                                      <th className="py-2 px-2 text-right">Original</th>
                                      <th className="py-2 px-2 text-right">Pago</th>
                                      <th className="py-2 px-2 text-right">Saldo</th>
                                      <th className="py-2 px-2 text-right">Multa/Juros</th>
                                      <th className="py-2 px-2 text-right font-black">Atualizado</th>
                                      <th className="py-2 px-2 text-center">Atraso</th>
                                      <th className="py-2 px-2 text-center">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60">
                                    {group.notes.map(noteItem => {
                                      const isNoteSelected = selectedNoteIds.includes(String(noteItem.sale.id));
                                      return (
                                        <tr key={noteItem.sale.id} className="hover:bg-slate-900/60 transition-colors">
                                          {/* Checkbox Individual */}
                                          <td className="py-2 px-2 text-center">
                                            <input
                                              type="checkbox"
                                              checked={isNoteSelected}
                                              onChange={() => toggleSelectNote(String(noteItem.sale.id))}
                                              className="rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                            />
                                          </td>

                                          {/* Código da Nota */}
                                          <td className="py-2 px-2 font-mono font-bold text-slate-200">
                                            #{String(noteItem.sale.id).slice(-6).toUpperCase()}
                                          </td>

                                          {/* Data da Venda */}
                                          <td className="py-2 px-2 text-slate-400">
                                            {formatDateSafe(noteItem.sale.date)}
                                          </td>

                                          {/* Vencimento */}
                                          <td className="py-2 px-2 font-medium">
                                            <span className={noteItem.isOverdue ? 'text-rose-400 font-bold' : noteItem.isDueToday ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                              {formatDateSafe(noteItem.sale.due_date)}
                                            </span>
                                          </td>

                                          {/* Original */}
                                          <td className="py-2 px-2 text-right text-slate-400">
                                            {formatBRL(noteItem.original)}
                                          </td>

                                          {/* Pago */}
                                          <td className="py-2 px-2 text-right text-emerald-400 font-medium">
                                            {formatBRL(noteItem.paid)}
                                          </td>

                                          {/* Saldo Principal */}
                                          <td className="py-2 px-2 text-right text-slate-200 font-bold">
                                            {formatBRL(noteItem.balance)}
                                          </td>

                                          {/* Multa / Juros */}
                                          <td className="py-2 px-2 text-right text-rose-400 font-bold">
                                            {noteItem.fine + noteItem.interest > 0 ? `+ ${formatBRL(noteItem.fine + noteItem.interest)}` : '-'}
                                          </td>

                                          {/* Total Atualizado */}
                                          <td className="py-2 px-2 text-right text-white font-black">
                                            {formatBRL(noteItem.updatedTotal)}
                                          </td>

                                          {/* Situação / Dias de atraso */}
                                          <td className="py-2 px-2 text-center">
                                            {noteItem.isOverdue ? (
                                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                                {noteItem.daysOverdue}d atraso
                                              </span>
                                            ) : noteItem.isDueToday ? (
                                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                Vence hoje
                                              </span>
                                            ) : (
                                              <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                A vencer
                                              </span>
                                            )}
                                          </td>

                                          {/* Ações da Nota */}
                                          <td className="py-2 px-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              {/* Baixa Integral Rápida */}
                                              <button
                                                onClick={() => handleSettleSingleSale(noteItem.sale)}
                                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                                title="Quitar Débito Desta Nota"
                                              >
                                                <CheckCircle size={13} />
                                              </button>

                                              {/* Pagamento Parcial */}
                                              <button
                                                onClick={() => {
                                                  setPartialModalSale(noteItem.sale);
                                                  setPartialAmountInput('');
                                                }}
                                                className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                                title="Registrar Pagamento Parcial (Amortização)"
                                              >
                                                <DollarSign size={13} />
                                              </button>

                                              {/* Cobrança WhatsApp da Nota */}
                                              <button
                                                onClick={() => handleSendSingleNoteWhatsApp(noteItem.sale, group)}
                                                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                title="Cobrar Esta Nota no WhatsApp"
                                              >
                                                <MessageCircle size={13} />
                                              </button>

                                              {/* Imprimir Carnê */}
                                              <button
                                                onClick={() => generateCarne(noteItem.sale)}
                                                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                                title="Imprimir Carnê"
                                              >
                                                <Printer size={13} />
                                              </button>

                                              {/* Nota Promissória */}
                                              <button
                                                onClick={() => generatePromissoryNote(noteItem.sale)}
                                                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                                title="Nota Promissória"
                                              >
                                                <FileText size={13} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {filteredAndSortedGroups.length === 0 && (
                <div className="p-16 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mx-auto mb-3">
                    <ShieldCheck size={32} />
                  </div>
                  <p className="text-base font-bold text-white mb-1">
                    {receberSearchTerm ? `Nenhum cliente ou nota encontrada para "${receberSearchTerm}"` : "Nenhum débito em aberto encontrado."}
                  </p>
                  <p className="text-xs text-slate-500">
                    Todos os débitos e pendências financeiras estão em dia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: FLUXO DE CAIXA */}
      {/* ========================================================================= */}
      {financialTab === 'caixa' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[#0E1726] border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${activeSession ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                <Wallet size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Status do Caixa</h3>
                <p className={`text-sm font-bold ${activeSession ? 'text-rose-400' : 'text-slate-400'}`}>
                  {activeSession ? `ABERTO (Início: ${new Date(activeSession.openedAt).toLocaleTimeString()})` : 'CAIXA FECHADO'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!activeSession ? (
                <button
                  onClick={() => setIsCashModalOpen(true)}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center gap-2 text-sm"
                >
                  <Plus size={18} /> Abrir Caixa
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsTransactionModalOpen(true)}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
                  >
                    <ArrowUpCircle size={18} /> Sangria / Suprimento
                  </button>
                  <button
                    onClick={handleCloseCash}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center gap-2 text-sm"
                  >
                    <X size={18} /> Fechar Caixa
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0E1726] border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Package size={20} /></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Venda de Produtos</p>
              </div>
              <h4 className="text-2xl font-black text-white">{formatBRL(productSales)}</h4>
            </div>

            <div className="bg-[#0E1726] border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Bike size={20} /></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Serviços / Mão de Obra</p>
              </div>
              <h4 className="text-2xl font-black text-white">{formatBRL(serviceSales)}</h4>
            </div>

            <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white p-5 rounded-2xl shadow-xl shadow-rose-950/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 text-white rounded-lg"><TrendingUp size={20} /></div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Líquido em Caixa</p>
              </div>
              <h4 className="text-2xl font-black">{formatBRL(totalRevenue)}</h4>
            </div>
          </div>

          {/* Margens e Custos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0E1726] border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-800 text-slate-400 rounded-lg"><Truck size={20} /></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo das Peças</p>
              </div>
              <h4 className="text-2xl font-black text-white">{formatBRL(productCosts)}</h4>
            </div>

            <div className="bg-[#0E1726] border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><DollarSign size={20} /></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido (Peças)</p>
              </div>
              <h4 className="text-2xl font-black text-emerald-400">{formatBRL(productProfit)}</h4>
            </div>

            <div className="bg-[#0E1726] border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Percent size={20} /></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margem de Lucro</p>
              </div>
              <h4 className="text-2xl font-black text-indigo-400">{profitMargin.toFixed(1)}%</h4>
            </div>
          </div>

          {/* Meios de Recebimento */}
          <div className="bg-[#0E1726] border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-base font-extrabold text-white mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-rose-500" />
              Distribuição por Meio de Recebimento
            </h3>
            <div className="space-y-4">
              {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => {
                const total = monthlySales.filter(s => s.payment_method === method).reduce((acc, s) => acc + s.total, 0);
                const percentage = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0;
                return (
                  <div key={method} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-300">{method}</span>
                      <span className="font-extrabold text-white">{formatBRL(total)}</span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full rounded-full bg-rose-600 transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: CONTAS A PAGAR (MODERNIZADA COM FORNECEDORES DE A A Z) */}
      {/* ========================================================================= */}
      {financialTab === 'pagar' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Vencidos', value: `${statsPayable.overdueCount} (${formatBRL(statsPayable.overdueTotal)})`, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: AlertTriangle },
              { label: 'Vence Hoje', value: `${statsPayable.dueTodayCount} (${formatBRL(statsPayable.dueTodayTotal)})`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Bell },
              { label: 'A Vencer', value: `${statsPayable.upcomingCount} (${formatBRL(statsPayable.upcomingTotal)})`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Calendar },
              { label: 'Total Pago', value: formatBRL(statsPayable.paidTotal), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: ShieldCheck }
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} ${stat.color} p-4 rounded-2xl border flex items-center gap-4 shadow-lg`}>
                <div className="p-3 bg-[#0E1726] rounded-xl"><stat.icon size={22} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{stat.label}</p>
                  <p className="text-lg font-black text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0E1726] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowDownCircle size={20} className="text-rose-500" />
                <h3 className="font-extrabold text-white text-base">
                  Listagem de Contas a Pagar
                </h3>
                <span className="text-xs text-slate-400 ml-2">
                  (Ordem alfabética de A a Z por padrão)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Filtro por datas */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    title="Data inicial"
                    className="px-3 py-1.5 bg-[#080D1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    value={payableDateStart}
                    onChange={(e) => setPayableDateStart(e.target.value)}
                  />
                  <span className="text-slate-400 text-xs">até</span>
                  <input
                    type="date"
                    title="Data final"
                    className="px-3 py-1.5 bg-[#080D1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    value={payableDateEnd}
                    onChange={(e) => setPayableDateEnd(e.target.value)}
                  />
                </div>

                {/* Filtro por status */}
                <div className="flex bg-[#080D1A] p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'todos', label: 'Todas' },
                    { id: 'pendentes', label: 'Pendentes' },
                    { id: 'vencidos', label: 'Vencidas' },
                    { id: 'pagos', label: 'Pagas' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPayableStatusFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        payableStatusFilter === f.id ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Ordenação Fornecedores */}
                <select
                  value={payableSortOrder}
                  onChange={e => setPayableSortOrder(e.target.value as any)}
                  className="bg-[#080D1A] text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="fornecedor_az">Fornecedor (A a Z) - Padrão</option>
                  <option value="fornecedor_za">Fornecedor (Z a A)</option>
                  <option value="vencimento_asc">Vencimento Mais Próximo</option>
                  <option value="maior_valor">Maior Valor</option>
                </select>

                {/* Busca rápida */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar fornecedor..."
                    className="pl-8 pr-3 py-1.5 bg-[#080D1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 w-44"
                    value={payableSearchTerm}
                    onChange={(e) => setPayableSearchTerm(e.target.value)}
                  />
                </div>

                {/* Botão Nova Conta */}
                <button
                  onClick={() => setIsPayableModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} /> Nova Conta
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#080D1A] text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                    <th className="px-5 py-3.5">Fornecedor</th>
                    <th className="px-5 py-3.5">Vencimento</th>
                    <th className="px-5 py-3.5 text-right">Valor</th>
                    <th className="px-5 py-3.5">Pagamento / Copiar</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAccountsPayable.map(item => {
                    const isOverdue = item.status !== 'Pago' && item.due_date < todayStr;
                    const isToday = item.status !== 'Pago' && item.due_date === todayStr;
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-white text-sm">{item.fornecedor}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className={`text-xs font-bold ${isOverdue ? 'text-rose-400' : isToday ? 'text-amber-400' : 'text-slate-300'}`}>
                            {formatDateSafe(item.due_date)}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-black text-white">{formatBRL(item.valor)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {item.linha_digitavel && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono truncate max-w-[170px] border border-slate-800">
                                  Boleto: {item.linha_digitavel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.linha_digitavel);
                                    alert('Linha digitável copiada!');
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                                  title="Copiar Linha Digitável"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}
                            {item.codigo_pix && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 font-mono truncate max-w-[170px] border border-emerald-500/20">
                                  PIX: {item.codigo_pix}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.codigo_pix);
                                    alert('Chave/Código PIX copiado!');
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300"
                                  title="Copiar Código PIX"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}
                            {!item.linha_digitavel && !item.codigo_pix && (
                              <span className="text-[10px] text-slate-500 italic">Sem código</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'Pago' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : isOverdue 
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : isToday
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {item.status === 'Pago' ? 'Pago' : isOverdue ? 'Vencido' : isToday ? 'Vence Hoje' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.status !== 'Pago' && (
                              <button
                                type="button"
                                onClick={() => handleLiquidatePayable(item.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                title="Marcar como Pago"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEditPayableClick(item)}
                              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                              title="Editar Conta"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayable(item.id)}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                              title="Cancelar Conta"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredAccountsPayable.length === 0 && (
                <div className="p-12 text-center text-slate-500 text-sm">
                  Nenhuma conta a pagar encontrada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: FECHAMENTO DE CLIENTE (ORDEM ALFABÉTICA DE A A Z) */}
      {/* ========================================================================= */}
      {financialTab === 'fechamento' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[#0E1726] border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
              <FileText size={22} className="text-rose-500" />
              Calcular Fechamento Mensal do Cliente (A a Z)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className={closingPeriodType === 'interval' ? 'md:col-span-1' : 'md:col-span-2'}>
                <label className="block text-xs font-bold text-slate-300 mb-2">Cliente (Ordem de A a Z)</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                  value={closingCustomerId}
                  onChange={e => { setClosingCustomerId(e.target.value); setClosingResult(null); }}
                >
                  <option value="">Selecione um cliente...</option>
                  {[...customers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Tipo de Período</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                  value={closingPeriodType}
                  onChange={e => { setClosingPeriodType(e.target.value as any); setClosingResult(null); }}
                >
                  <option value="day">Por Dia</option>
                  <option value="month">Por Mês</option>
                  <option value="year">Por Ano</option>
                  <option value="interval">Por Período (De / Até)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {closingPeriodType === 'interval' ? 'Data Inicial' : 'Data do Período'}
                </label>
                {closingPeriodType === 'day' ? (
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                    value={closingDate}
                    onChange={e => { setClosingDate(e.target.value); setClosingResult(null); }}
                  />
                ) : closingPeriodType === 'month' ? (
                  <input
                    type="month"
                    className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                    value={closingMonthYear}
                    onChange={e => { setClosingMonthYear(e.target.value); setClosingResult(null); }}
                  />
                ) : closingPeriodType === 'interval' ? (
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                    value={closingStartDate}
                    onChange={e => { setClosingStartDate(e.target.value); setClosingResult(null); }}
                  />
                ) : (
                  <input
                    type="number" min="2000" max="2100"
                    className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                    value={closingYear}
                    onChange={e => { setClosingYear(e.target.value); setClosingResult(null); }}
                  />
                )}
              </div>

              {closingPeriodType === 'interval' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Data Final</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                    value={closingEndDate}
                    onChange={e => { setClosingEndDate(e.target.value); setClosingResult(null); }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleCalculateClosing}
              className="mt-6 w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 text-sm"
            >
              <Calculator size={18} /> Calcular Demonstrativo
            </button>
          </div>

          {closingResult && (
            <div className="bg-[#0E1726] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <div className="text-center border-b border-slate-800 pb-4">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Demonstrativo de Fechamento</h2>
                <p className="text-base font-extrabold text-rose-400 mt-1">{closingResult.customerName}</p>
                <p className="text-xs text-slate-400 mt-1">Período: {closingResult.periodLabel}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peças */}
                <div className="bg-[#080D1A] border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 flex items-center gap-2">
                    <Package size={16} className="text-blue-400" /> Peças e Acessórios
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {closingResult.pecasList.length === 0 ? (
                      <li className="text-slate-500 italic">Nenhuma peça no período.</li>
                    ) : (
                      closingResult.pecasList.map((p: any, i: number) => (
                        <li key={i} className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-300">
                          <span>{p.quantity}x {p.description}</span>
                          <span className="font-bold text-white">{formatBRL(p.price * p.quantity)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="text-right pt-3 border-t border-slate-800 mt-3">
                    <p className="text-xs font-bold text-slate-400">Subtotal Peças</p>
                    <p className="text-base font-black text-blue-400">{formatBRL(closingResult.totalPecas)}</p>
                  </div>
                </div>

                {/* Serviços */}
                <div className="bg-[#080D1A] border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 flex items-center gap-2">
                    <Bike size={16} className="text-amber-400" /> Mão de Obra e Serviços
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {closingResult.servicosList.length === 0 ? (
                      <li className="text-slate-500 italic">Nenhum serviço no período.</li>
                    ) : (
                      closingResult.servicosList.map((s: any, i: number) => (
                        <li key={i} className="flex justify-between border-b border-slate-800/80 pb-1 text-slate-300">
                          <span>{s.quantity}x {s.description}</span>
                          <span className="font-bold text-white">{formatBRL(s.price * s.quantity)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="text-right pt-3 border-t border-slate-800 mt-3">
                    <p className="text-xs font-bold text-slate-400">Subtotal Serviços</p>
                    <p className="text-base font-black text-amber-400">{formatBRL(closingResult.totalServicos)}</p>
                  </div>
                </div>
              </div>

              {/* Total Geral */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-xs text-slate-300 w-full md:w-auto">
                  <div className="flex justify-between gap-6"><span>Total em Peças:</span><span className="font-bold text-white">{formatBRL(closingResult.totalPecas)}</span></div>
                  <div className="flex justify-between gap-6"><span>Total em Serviços:</span><span className="font-bold text-white">{formatBRL(closingResult.totalServicos)}</span></div>
                  {closingResult.descontos > 0 && (
                    <div className="flex justify-between gap-6 text-emerald-400"><span>(-) Descontos:</span><span className="font-bold">{formatBRL(closingResult.descontos)}</span></div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-slate-400">Total Geral a Pagar</p>
                  <p className="text-3xl font-black text-rose-500">{formatBRL(closingResult.totalLiquido)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handlePrintClosing}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <Printer size={15} /> Imprimir Resumo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: TAXAS DE CARTÃO */}
      {/* ========================================================================= */}
      {financialTab === 'taxas' && (
        <div className="max-w-3xl bg-[#0E1726] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Calculator size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Configuração de Repasse de Taxas de Cartão</h3>
              <p className="text-xs text-slate-400">Taxas cobradas pela maquininha aplicadas nas simulações de venda</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(cardFeesSettings).sort((a, b) => Number(a) - Number(b)).map(parcela => (
              <div key={parcela} className="bg-[#080D1A] border border-slate-800 p-3 rounded-xl">
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">{parcela}x Cartão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cardFeesSettings[Number(parcela)]}
                  onChange={e => setCardFeesSettings({
                    ...cardFeesSettings,
                    [Number(parcela)]: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-1.5 bg-[#0E1726] border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 6: COBRANÇA & ALERTAS */}
      {/* ========================================================================= */}
      {financialTab === 'automacao' && (
        <div className="max-w-3xl bg-[#0E1726] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Regras de Encargos e Alertas</h3>
              <p className="text-xs text-slate-400">Configuração de multa por atraso e juros de mora mensais</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-xl">
              <label className="block text-xs font-bold text-slate-300 mb-1">Multa por Atraso (%)</label>
              <input
                type="number"
                step="0.1"
                value={fiadoSettings.lateFeeRate}
                onChange={e => setFiadoSettings({ ...fiadoSettings, lateFeeRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0E1726] border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Aplicada uma única vez após o vencimento.</p>
            </div>

            <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-xl">
              <label className="block text-xs font-bold text-slate-300 mb-1">Juros de Mora (Mensal %)</label>
              <input
                type="number"
                step="0.1"
                value={fiadoSettings.lateInterestRate}
                onChange={e => setFiadoSettings({ ...fiadoSettings, lateInterestRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0E1726] border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Calculado proporcionalmente por dia de atraso.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CENTRAL DE REGULARIZAÇÃO FINANCEIRA (REGULARIZAR PENDÊNCIAS) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!regularizacaoGroup}
        onClose={() => { setRegularizacaoGroup(null); setRegSelectedNotes([]); }}
        title={`Central de Regularização: ${regularizacaoGroup?.customerName || ''}`}
      >
        {regularizacaoGroup && (
          <div className="space-y-5 text-white max-w-2xl mx-auto">
            {/* Header do Cliente */}
            <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{regularizacaoGroup.customerName}</h3>
                  {regularizacaoGroup.nickname && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {regularizacaoGroup.nickname}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Tel: {regularizacaoGroup.whatsapp || regularizacaoGroup.phone || 'N/A'}</span>
                  <span>Doc: {regularizacaoGroup.cpf || regularizacaoGroup.cnpj || 'N/A'}</span>
                  {regularizacaoGroup.billingDay && (
                    <span className="text-blue-400 font-bold">Dia Fixo: {String(regularizacaoGroup.billingDay).padStart(2, '0')}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  regularizacaoGroup.overdueCategory === 'Em dia' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {regularizacaoGroup.overdueCategory}
                </span>
              </div>
            </div>

            {/* 4 Cards Resumo do Cliente */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-[#080D1A] border border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Notas Abertas</p>
                <p className="text-lg font-black text-white">{regularizacaoGroup.notes.length}</p>
              </div>
              <div className="bg-[#080D1A] border border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Original</p>
                <p className="text-lg font-black text-slate-300">{formatBRL(regularizacaoGroup.totalOriginal)}</p>
              </div>
              <div className="bg-[#080D1A] border border-slate-800 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Já Amortizado</p>
                <p className="text-lg font-black text-emerald-400">{formatBRL(regularizacaoGroup.totalPaid)}</p>
              </div>
              <div className="bg-[#080D1A] border border-rose-900/30 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-rose-400 uppercase">Total Atualizado</p>
                <p className="text-lg font-black text-rose-500">{formatBRL(regularizacaoGroup.totalUpdated)}</p>
              </div>
            </div>

            {/* Abas da Regularização */}
            <div className="flex bg-[#080D1A] p-1 rounded-xl border border-slate-800">
              {[
                { id: 'quitar', label: 'Receber / Quitar', icon: CheckCircle },
                { id: 'parcial', label: 'Amortização Parcial', icon: DollarSign },
                { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                { id: 'extrato', label: 'Extrato', icon: Printer }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setRegTab(t.id as any)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    regTab === t.id ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* ABA: RECEBER / QUITAR */}
            {regTab === 'quitar' && (
              <div className="space-y-4">
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#080D1A] max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase border-b border-slate-800">
                        <th className="p-2 text-center w-8">
                          <input
                            type="checkbox"
                            checked={regSelectedNotes.length === regularizacaoGroup.notes.length}
                            onChange={e => {
                              if (e.target.checked) setRegSelectedNotes(regularizacaoGroup.notes.map(n => String(n.sale.id)));
                              else setRegSelectedNotes([]);
                            }}
                          />
                        </th>
                        <th className="p-2">Nota</th>
                        <th className="p-2">Vencimento</th>
                        <th className="p-2 text-right">Saldo</th>
                        <th className="p-2 text-right">Atualizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {regularizacaoGroup.notes.map(n => {
                        const isSel = regSelectedNotes.includes(String(n.sale.id));
                        return (
                          <tr key={n.sale.id} className="hover:bg-slate-900/60">
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {
                                  if (isSel) setRegSelectedNotes(regSelectedNotes.filter(id => id !== String(n.sale.id)));
                                  else setRegSelectedNotes([...regSelectedNotes, String(n.sale.id)]);
                                }}
                              />
                            </td>
                            <td className="p-2 font-mono font-bold">#{String(n.sale.id).slice(-6).toUpperCase()}</td>
                            <td className="p-2">{formatDateSafe(n.sale.due_date)}</td>
                            <td className="p-2 text-right font-bold text-slate-300">{formatBRL(n.balance)}</td>
                            <td className="p-2 text-right font-black text-white">{formatBRL(n.updatedTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Forma de Recebimento</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Pix', 'Dinheiro', 'Débito', 'Crédito'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setRegPaymentMethod(m as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          regPaymentMethod === m 
                            ? 'bg-rose-600 border-rose-500 text-white shadow' 
                            : 'bg-[#080D1A] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total e Confirmação */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">Total a liquidar ({regSelectedNotes.length} notas):</p>
                    <p className="text-xl font-black text-emerald-400">
                      {formatBRL(
                        regularizacaoGroup.notes
                          .filter(n => regSelectedNotes.includes(String(n.sale.id)))
                          .reduce((sum, n) => sum + n.updatedTotal, 0)
                      )}
                    </p>
                  </div>
                  <button
                    disabled={isProcessingReg || regSelectedNotes.length === 0}
                    onClick={handleExecuteRegularizacaoSettlement}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40"
                  >
                    {isProcessingReg ? 'Processando...' : 'Confirmar Recebimento'}
                  </button>
                </div>
              </div>
            )}

            {/* ABA: AMORTIZAÇÃO PARCIAL */}
            {regTab === 'parcial' && (
              <div className="space-y-4">
                <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-xl space-y-3">
                  <p className="text-xs text-slate-300">
                    O valor pago será abatido sequencialmente das notas mais antigas para as mais recentes.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Valor a Amortizar (R$)</label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={regAmortizeAmount}
                      onChange={e => setRegAmortizeAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0E1726] border border-slate-700 rounded-xl text-white font-black text-lg focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">Forma de Pagamento</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Pix', 'Dinheiro', 'Débito', 'Crédito'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRegPaymentMethod(m as any)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            regPaymentMethod === m 
                              ? 'bg-rose-600 border-rose-500 text-white shadow' 
                              : 'bg-[#0E1726] border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={isProcessingReg || !regAmortizeAmount}
                  onClick={handleExecuteAmortization}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                >
                  {isProcessingReg ? 'Processando...' : 'Registrar Amortização'}
                </button>
              </div>
            )}

            {/* ABA: WHATSAPP */}
            {regTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-xl text-xs text-slate-300 space-y-2">
                  <p className="font-bold text-white">Visualização da Mensagem:</p>
                  <pre className="bg-[#0E1726] p-3 rounded-lg text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                    {`*KOMBAT MOTO PEÇAS*\n\nOlá, ${regularizacaoGroup.customerName}!\n\nIdentificamos os seguintes valores em aberto:\n` +
                      regularizacaoGroup.notes.map(n => `Nota: #${String(n.sale.id).slice(-6).toUpperCase()} | Vencimento: ${formatDateSafe(n.sale.due_date)} | Valor: ${formatBRL(n.updatedTotal)}`).join('\n') +
                      `\n\n*Total geral em aberto: ${formatBRL(regularizacaoGroup.totalUpdated)}*\n\nChave PIX: ${companyData.telefone}\nPara regularização, entre em contato conosco.`}
                  </pre>
                </div>
                <button
                  onClick={() => handleSendConsolidatedWhatsApp(regularizacaoGroup)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle size={16} /> Abrir WhatsApp e Enviar Cobrança
                </button>
              </div>
            )}

            {/* ABA: EXTRATO */}
            {regTab === 'extrato' && (
              <div className="space-y-4 text-center p-6 bg-[#080D1A] border border-slate-800 rounded-xl">
                <Printer size={36} className="text-rose-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Imprimir Extrato Completo de Pendências</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Gera extrato formatado para impressora térmica ou folha A4 com todas as notas e assinatura.
                </p>
                <button
                  onClick={() => handlePrintCustomerStatement(regularizacaoGroup)}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                >
                  Imprimir Extrato Agora
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: QUITAÇÃO EM LOTE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBatchSettleModalOpen}
        onClose={() => setIsBatchSettleModalOpen(false)}
        title={`Quitar ${selectedNoteIds.length} Notas Selecionadas`}
      >
        <div className="space-y-5 text-white max-w-md mx-auto">
          <div className="bg-[#080D1A] border border-slate-800 p-4 rounded-xl text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">Valor Total a Liquidar</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{formatBRL(selectedTotal)}</p>
            <p className="text-xs text-slate-400 mt-1">{selectedNoteIds.length} título(s) selecionado(s)</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Forma de Pagamento</label>
            <div className="grid grid-cols-4 gap-2">
              {['Pix', 'Dinheiro', 'Débito', 'Crédito'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBatchPaymentMethod(m as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    batchPaymentMethod === m 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow' 
                      : 'bg-[#080D1A] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Data do Recebimento</label>
            <input
              type="date"
              value={batchPaymentDate}
              onChange={e => setBatchPaymentDate(e.target.value)}
              className="w-full px-4 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            disabled={isProcessingBatch}
            onClick={handleExecuteBatchSettle}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
          >
            {isProcessingBatch ? 'Processando Quitação...' : 'Confirmar Baixa em Lote'}
          </button>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: PAGAMENTO PARCIAL INDIVIDUAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!partialModalSale}
        onClose={() => setPartialModalSale(null)}
        title={`Pagamento Parcial - Nota #${partialModalSale ? String(partialModalSale.id).slice(-6).toUpperCase() : ''}`}
      >
        {partialModalSale && (
          <div className="space-y-4 text-white max-w-sm mx-auto">
            <div className="bg-[#080D1A] border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <p><strong>Cliente:</strong> {partialModalSale.customer_name}</p>
              <p><strong>Total da Nota:</strong> {formatBRL(partialModalSale.total)}</p>
              <p><strong>Já Pago:</strong> {formatBRL(partialModalSale.paid_total || 0)}</p>
              <p className="text-rose-400 font-bold">
                <strong>Saldo Devedor:</strong> {formatBRL(Math.max(0, partialModalSale.total - (partialModalSale.paid_total || 0)))}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Valor do Pagamento Parcial (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={partialAmountInput}
                onChange={e => setPartialAmountInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#080D1A] border border-slate-700 rounded-xl text-white font-black text-lg focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-2">
                {['Pix', 'Dinheiro', 'Débito', 'Crédito'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPartialMethodInput(m as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      partialMethodInput === m 
                        ? 'bg-rose-600 border-rose-500 text-white shadow' 
                        : 'bg-[#080D1A] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={isProcessingPartial || !partialAmountInput}
              onClick={handleExecuteSinglePartial}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
            >
              {isProcessingPartial ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: ABERTURA DE CAIXA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title="Abrir Sessão de Caixa"
      >
        <form onSubmit={handleOpenCash} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Saldo Inicial em Dinheiro (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-rose-500"
              value={cashForm.openingBalance}
              onChange={e => setCashForm({ ...cashForm, openingBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Observações (Opcional)</label>
            <textarea
              className="w-full px-4 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 min-h-[70px] resize-none"
              value={cashForm.notes}
              onChange={e => setCashForm({ ...cashForm, notes: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg">
            Confirmar Abertura
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: SANGRIA / SUPRIMENTO */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Sangria / Suprimento de Caixa"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTransactionForm({ ...transactionForm, type: 'Suprimento' })}
              className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                transactionForm.type === 'Suprimento' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-[#080D1A] border-slate-800 text-slate-400'
              }`}
            >
              Suprimento (+)
            </button>
            <button
              type="button"
              onClick={() => setTransactionForm({ ...transactionForm, type: 'Sangria' })}
              className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                transactionForm.type === 'Sangria' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-[#080D1A] border-slate-800 text-slate-400'
              }`}
            >
              Sangria (-)
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Valor (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-rose-500"
              value={transactionForm.amount}
              onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Descrição / Justificativa</label>
            <input
              type="text" required placeholder="Ex: Troco inicial, Despesa de limpeza..."
              className="w-full px-4 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
              value={transactionForm.description}
              onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg">
            Registrar Movimentação
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: CADASTRAR / EDITAR CONTA A PAGAR (COM LEITURA DE BOLETO POR IA) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPayableModalOpen}
        onClose={() => {
          setIsPayableModalOpen(false);
          setEditingPayableId(null);
          setPayableForm({
            fornecedor: '',
            valor: '',
            due_date: new Date().toISOString().split('T')[0],
            linha_digitavel: '',
            codigo_pix: ''
          });
        }}
        title={editingPayableId ? "Editar Conta a Pagar" : "Cadastrar Conta a Pagar"}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-rose-500 transition-colors bg-[#080D1A] relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleUploadBoleto}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isParsingBoleto}
            />
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="p-2.5 bg-rose-500/10 rounded-full text-rose-400 font-bold">
                <Upload size={20} className={isParsingBoleto ? "animate-bounce" : ""} />
              </div>
              <p className="text-xs font-bold text-white">
                {isParsingBoleto ? "Analisando boleto com IA..." : "Enviar Foto do Boleto / PIX"}
              </p>
              <p className="text-[10px] text-slate-400">
                Preenchimento automático inteligente por foto ou PDF
              </p>
            </div>
          </div>

          <form onSubmit={handleAddPayable} className="space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Fornecedor / Beneficiário *</label>
              <input
                type="text"
                required
                placeholder="Ex: Distribuidora de Peças Ltda"
                className="w-full px-3 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-rose-500"
                value={payableForm.fornecedor}
                onChange={e => setPayableForm({ ...payableForm, fornecedor: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-rose-500"
                  value={payableForm.valor}
                  onChange={e => setPayableForm({ ...payableForm, valor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Vencimento *</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-rose-500"
                  value={payableForm.due_date}
                  onChange={e => setPayableForm({ ...payableForm, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Linha Digitável (Código de Barras)</label>
              <input
                type="text"
                placeholder="Ex: 34191.79001 01043.513184..."
                className="w-full px-3 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-[11px] font-mono focus:outline-none focus:border-rose-500"
                value={payableForm.linha_digitavel}
                onChange={e => setPayableForm({ ...payableForm, linha_digitavel: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">PIX Copia e Cola / Chave</label>
              <input
                type="text"
                placeholder="Código PIX EMV ou Chave"
                className="w-full px-3 py-2 bg-[#080D1A] border border-slate-700 rounded-xl text-white text-[11px] font-mono focus:outline-none focus:border-rose-500"
                value={payableForm.codigo_pix}
                onChange={e => setPayableForm({ ...payableForm, codigo_pix: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md mt-2"
            >
              {editingPayableId ? "Atualizar Conta" : "Cadastrar Conta"}
            </button>
          </form>
        </div>
      </Modal>

    </div>
  );
};

export default FinancialTab;
