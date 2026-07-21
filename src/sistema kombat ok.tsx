import React, { useState, useEffect, useRef, useDeferredValue, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Bike,
  Package,
  Search,
  Plus,
  MessageCircle,
  TrendingUp,
  X,
  Trash2,
  Pencil,
  Target,
  MoreVertical,
  Send,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
  Printer,
  Settings,
  Settings2,
  Sparkles,
  Wrench,
  Wallet,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Link,
  Upload,
  Download,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Truck,
  ClipboardList,
  Building2,
  Edit,
  Copy,
  FileText,
  Calculator,
  AlertTriangle,
  Gavel,
  Bell,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Ban,
  CheckCircle,
  Percent,
  Barcode,
  History,
  Scan,
  ClipboardCheck,
  Camera,
  RefreshCw,
  ShoppingBag,
  User,
  Minus,
  AlertCircle,
  ExternalLink,
  BrainCircuit
} from 'lucide-react';
import PurchasesTab from './components/PurchasesTab';
import InventoryTab from './components/InventoryTab';
import FinancialTab from './components/FinancialTab';
import CRMTab from './components/CRMTab';
import OSTab from './components/OSTab';
import AIInstructionsDashboard from './components/ai-instructions/AIInstructionsDashboard';
import { motion, AnimatePresence } from 'motion/react';
import BillingAutomationBox from './components/BillingAutomationBox';
import VirtualCatalogModal from './components/VirtualCatalogModal';
import ProfessionalCatalog from './components/ProfessionalCatalog';
import Auth from './components/Auth';
import Modal from './components/Modal';
import { ThemeToggle } from './components/ThemeToggle';
import Cliente360Modal from './components/crm/Cliente360Modal';
import AIAssistant from './components/ai/AIAssistant';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

// --- Types ---
interface Customer {
  id: number;
  name: string;
  nickname?: string;
  cpf?: string;
  cnpj?: string; // CNPJ is optional
  whatsapp?: string;
  address?: string;
  neighborhood?: string;
  city?: string; // City is optional
  zip_code?: string;
  credit_limit: number;
  fine_rate?: number;
  interest_rate?: number;
  image_url?: string;
}

interface Motorcycle {
  id: number;
  customer_id: number;
  customer_name: string;
  plate: string;
  model: string;
  current_km: number;
}

interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  category?: string;
  brand?: string;
  location?: string;
  image_url?: string;
  image_url2?: string;
  image_url3?: string;
  image_url4?: string;
  application?: string;
  distributor?: string;
  alt_code?: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  priority: 'Baixa' | 'Média' | 'Alta';
  status: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechado';
  phone: string;
}

interface Mechanic {
  id: string;
  name: string;
  commission_rate: number;
  active: boolean;
}

interface FixedService {
  id: string;
  name: string;
  price: number;
  payout: number;
}

interface RegisteredService {
  id: string;
  description: string;
  price: number;
  category?: string;
}

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
}

interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  type: 'Peça' | 'Serviço' | 'Serviço Principal' | 'Adicional Interno';
}

interface Quote {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_id?: number;
  motorcycle_details?: string;
  total_value: number;
  observations?: string;
  warranty_terms?: string;
  validity_days: number;
  created_at: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  items: QuoteItem[];
}

interface Stats {
  revenue: number;
  openServiceOrders: number;
  topProducts: { description: string; total_sold: number }[];
  avgTicketCounter: number;
  avgTicketService: number;
}

interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  status: 'Aberto' | 'Fechado';
  notes?: string;
}

interface CashTransaction {
  id: string;
  sessionId?: string;
  type: 'Suprimento' | 'Sangria';
  amount: number;
  description: string;
  date: string;
}

interface Distributor {
  id: string;
  name: string;
  whatsapp?: string;
  phone?: string;
  contact?: string;
  contact_person?: string;
}

interface PurchaseOrderItem {
  description: string;
  quantity: number;
  price?: number;
}

interface PurchaseOrder {
  id: string;
  distributor_id: string;
  distributor_name: string;
  items: PurchaseOrderItem[];
  date: string;
  status: string;
}

// --- Utils ---
const formatBRL = (value: any) => {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0).replace(',', '.'));
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(isNaN(num) ? 0 : num);
};

const getSaleFinancials = (sale: Sale) => {
  const items = sale.items || sale.sale_items || [];
  
  const serviceItems = items.filter(i => 
    i.type === 'Serviço' || 
    i.type === 'Serviço Principal' || 
    i.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS'
  );
  
  let laborTotal = serviceItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  if (laborTotal === 0 && (sale.labor_value || 0) > 0) {
    laborTotal = sale.labor_value;
  }
  
  const internalItems = items.filter(i => i.type === 'Adicional Interno');
  const internalServicesTotal = internalItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  
  const partsItems = items.filter(i => 
    (i.product_id || i.type === 'Peça' || (!i.type && i.product_id)) && 
    i.type !== 'Serviço' && 
    i.type !== 'Serviço Principal' && 
    i.type !== 'Adicional Interno' &&
    !i.description.includes('TAXA DE PARCELAMENTO') && 
    !i.description.includes('AJUSTE DE TAXA/PRAZO') && 
    !i.description.includes('TAXA DE CREDITO')
  );
  
  let partsTotal = partsItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  if (items.length === 0) {
    partsTotal = Math.max(0, sale.total - laborTotal);
  }
  
  const commission = (sale.commission !== undefined && sale.commission !== null && sale.commission > 0)
    ? sale.commission
    : (sale.mechanic_id ? (laborTotal * 0.50) : 0);
  
  return {
    laborTotal,
    partsTotal,
    internalServicesTotal,
    commission
  };
};

const loadHtml5Qrcode = () => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).Html5Qrcode) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o leitor de código de barras."));
    document.body.appendChild(script);
  });
};

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (err) {
    console.error('AudioContext error:', err);
  }
};

const localApi = {
  get: async (route: string) => {
    const res = await fetch(`/api/${route}`);
    if (!res.ok) throw new Error(`Erro ao buscar ${route}`);
    return res.json();
  },
  post: async (route: string, data: any) => {
    const res = await fetch(`/api/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ao criar ${route}`);
    return res.json();
  },
  put: async (endpoint: string, idOrData: any, data?: any) => {
    let url = `/api/${endpoint}`;
    let bodyData = data;
    if (data === undefined) {
      bodyData = idOrData;
    } else {
      url += `/${idOrData}`;
    }
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    if (!res.ok) throw new Error(`Erro ao atualizar ${endpoint}`);
    return res.json();
  },
  delete: async (endpoint: string, id?: any) => {
    const url = id ? `/api/${endpoint}/${id}` : `/api/${endpoint}`;
    const res = await fetch(url, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Erro ao excluir ${endpoint}`);
    return res.json();
  }
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 notranslate ${active
      ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 translate-x-1'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
  >
    <Icon size={18} className={active ? 'animate-pulse' : ''} />
    <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 flex items-start justify-between dark:bg-slate-800 dark:border-slate-700">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);




const DEFAULT_CARD_FEES: Record<number, number> = {
  1: 3.05, 2: 4.3, 3: 5.25, 4: 6.20, 5: 7.15, 6: 8.01,
  7: 8.90, 8: 9.85, 9: 10.80, 10: 11.75, 11: 12.70, 12: 13.65
};

const VendaCalculator = ({ initialCost, onApply, cardFees }: { initialCost: number, onApply?: (price: number) => void, cardFees: Record<number, number> }) => {
  const [cost, setCost] = useState(initialCost);
  const [type, setType] = useState<'Cartão' | 'Fiado'>('Cartão');
  const [installments, setInstallments] = useState(1);
  const [fiadoTax, setFiadoTax] = useState(10);

  useEffect(() => {
    setCost(initialCost);
  }, [initialCost]);

  const cardFee = cardFees[installments] || 0;
  const taxRate = type === 'Fiado' ? (fiadoTax / 100) : (cardFee / 100);
  const divisor = 1 - taxRate;
  const finalPrice = divisor > 0 ? (cost / divisor) : 0;
  const installmentValue = finalPrice / installments;
  const markupValue = finalPrice - cost;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <div style="font-family: monospace; width: 300px; padding: 20px;">
        <h2 style="text-align: center; border-bottom: 2px solid black;">KOMBAT MOTO PEÇAS</h2>
        <p style="text-align: center;">COMPROVANTE DE PRECIFICAÇÃO</p>
        <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
        <hr />
        ${type === 'Fiado' ? `
          <p>Valor Original: ${formatBRL(cost)}</p>
          <p>Taxa de Prazo (${fiadoTax}%): ${formatBRL(markupValue)}</p>
          <p style="font-size: 1.25em; font-weight: bold;">TOTAL: ${formatBRL(finalPrice)}</p>
        ` : `
          <p style="font-size: 1.25em; font-weight: bold;">VALOR TOTAL: ${formatBRL(finalPrice)}</p>
          <p>Parcelamento: ${installments}x de ${formatBRL(installmentValue)}</p>
        `}
        <hr />
        <p style="text-align: center; font-size: 0.8em;">Impresso em: ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    printWindow.document.write(`<html><head><title>Comprovante</title></head><body onload="window.print();window.close();">${content}</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={20} className="text-rose-500" />
          <h3 className="font-black uppercase text-xs tracking-[0.2em]">Calculadora de Vendas</h3>
        </div>
        <button onClick={handlePrint} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all" title="Gerar Comprovante">
          <Printer size={18} className="text-rose-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Valor Líquido (Quanto quer receber)</label>
          <input
            type="number"
            value={cost}
            onChange={e => setCost(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black focus:outline-none focus:border-rose-500 transition-all text-white"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-slate-400 mb-2">Forma de Pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setType('Cartão'); setInstallments(1); }}
              className={`py-3 rounded-xl font-black uppercase text-xs transition-all border ${type === 'Cartão' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              Cartão
            </button>
            <button
              onClick={() => { setType('Fiado'); setInstallments(1); }}
              className={`py-3 rounded-xl font-black uppercase text-xs transition-all border ${type === 'Fiado' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              Fiado (30 Dias)
            </button>
          </div>
        </div>

        {type === 'Fiado' && (
          <div>
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Taxa de Prazo FIXA (%)</label>
            <input
              type="number"
              value={fiadoTax}
              onChange={e => setFiadoTax(Number(e.target.value))}
              className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-base font-black text-amber-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        )}

        {type === 'Cartão' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Object.keys(cardFees).map(n => (
              <button
                key={n}
                onClick={() => setInstallments(Number(n))}
                className={`py-2 rounded-xl text-xs font-black transition-all border ${installments === Number(n) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
              >
                {n}x
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div className="bg-rose-600 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase font-black text-rose-200 tracking-tighter">Valor Total a Cobrar</p>
            <p className="text-3xl font-black">{formatBRL(finalPrice)}</p>
          </div>
          {type === 'Cartão' && installments > 1 && (
            <div className="text-right">
              <p className="text-[10px] uppercase font-black text-rose-200 tracking-tighter">Parcelas</p>
              <p className="font-black">{installments}x {formatBRL(installmentValue)}</p>
            </div>
          )}
        </div>

        {type === 'Fiado' && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Detalhamento Fiado ({fiadoTax}% Taxa)</p>
            <p className="text-xs font-bold text-slate-300">Valor Base: {formatBRL(cost)} + Taxa de Prazo: {formatBRL(markupValue)}</p>
          </div>
        )}

        {onApply && (
          <button
            onClick={() => onApply(finalPrice)}
            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all mt-4 dark:bg-slate-800"
          >
            Aplicar este Preço Final
          </button>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>({ id: 'local-user', email: 'admin@sistema.local' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  const userRole = user?.role || 'Administrador';

  const hasAccess = (allowedRoles: string[]) => {
    return allowedRoles.includes(userRole);
  };

  // Enforce role-based access control (RBAC) on activeTab
  React.useEffect(() => {
    if (!user) return;
    if (userRole === 'Atendente' && !['customers', 'quotes', 'crm'].includes(activeTab)) {
      setActiveTab('crm');
    } else if (userRole === 'Mecânico' && !['dashboard', 'os'].includes(activeTab)) {
      setActiveTab('os');
    } else if (userRole === 'Financeiro' && !['dashboard', 'financial'].includes(activeTab)) {
      setActiveTab('financial');
    }
  }, [userRole, activeTab, user]);

  const [inventoryView, setInventoryView] = useState<'list' | 'grid'>('list');
  const [customerViewMode, setCustomerViewMode] = useState<'list' | 'grid'>('grid');
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueStartDate, setRevenueStartDate] = useState(() => {
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const year = firstDay.getFullYear();
    const month = String(firstDay.getMonth() + 1).padStart(2, '0');
    const day = String(firstDay.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [revenueEndDate, setRevenueEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const year = lastDay.getFullYear();
    const month = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [financialSales, setFinancialSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [registeredServices, setRegisteredServices] = useState<RegisteredService[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const isCatalogPublicView = useMemo(() => {
    return new URLSearchParams(window.location.search).get('view') === 'catalog';
  }, []);

  const [initialSku, setInitialSku] = useState(() => {
    return new URLSearchParams(window.location.search).get('sku');
  });

  const toggleSelectProduct = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    if (confirm(`Excluir ${selectedProductIds.length} produtos selecionados?`)) {
      try {
        setLoading(true);
        for (const id of selectedProductIds) {
          await localApi.delete('products', id);
        }
        setSelectedProductIds([]);
        fetchData();
        alert('Produtos excluídos com sucesso!');
      } catch (error) {
        console.error('Erro na exclusão em massa:', error);
        alert('Ocorreu um erro ao excluir alguns produtos.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMassUpdate = async () => {
    try {
      const val = parseFloat(massUpdateForm.value.replace(',', '.'));
      if (isNaN(val) || val <= 0) return alert('Insira um valor maior que zero válido.');
      
      const confirmMsg = selectedProductIds.length > 0 
        ? `Você vai alterar os preços de ${selectedProductIds.length} PRODUTOS SELECIONADOS. Tem certeza?`
        : `Você vai alterar os preços de TODOS OS PRODUTOS DO SISTEMA. Tem certeza absoluta?`;
        
      if (!confirm(confirmMsg)) return;

      setLoading(true);
      await localApi.post('products/mass-update', {
        ...massUpdateForm,
        value: val,
        productIds: selectedProductIds.length > 0 ? selectedProductIds : []
      });
      setIsMassUpdateModalOpen(false);
      setMassUpdateForm({ type: 'percent', action: 'increase', value: '' });
      setSelectedProductIds([]);
      fetchData();
      alert('Preços atualizados com sucesso!');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao atualizar preços em massa');
    } finally {
      setLoading(false);
    }
  };

  const localApi = {
    getHeaders: () => {
      const token = localStorage.getItem('token');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    },
    get: async (route: string) => {
      const res = await fetch(`/api/${route}`, {
        headers: localApi.getHeaders()
      });
      if (!res.ok) throw new Error(`Erro ao buscar ${route}`);
      return res.json();
    },
    post: async (route: string, body: any) => {
      const res = await fetch(`/api/${route}`, {
        method: 'POST',
        headers: localApi.getHeaders(),
        body: JSON.stringify(body),
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          const errorMsg = data.error || data.message || 'Erro na operação';
          const details = data.details ? `\n\nDetalhes: ${data.details}` : '';
          throw new Error(errorMsg + details);
        }
        return data;
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(`Erro no servidor (${res.status}): A rota /api/${route} pode estar faltando ou o servidor precisa ser reiniciado.\n${text.substring(0, 100)}`);
        return text;
      }
    },
    put: async (route: string, id: any, body: any) => {
      const res = await fetch(`/api/${route}/${id}`, {
        method: 'PUT',
        headers: localApi.getHeaders(),
        body: JSON.stringify(body),
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.error || data.message || (typeof data === 'object' ? JSON.stringify(data) : 'Erro na operação');
          throw new Error(errMsg);
        }
        return data;
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(`Erro no servidor (${res.status}): A rota /api/${route}/${id} pode estar faltando ou o servidor precisa ser reiniciado.`);
        return text;
      }
    },
    patch: async (route: string, id: any, actionOrBody: any, body?: any) => {
      // Compatibility with action-style or body-style patches
      const isAction = typeof actionOrBody === 'string';
      const url = isAction ? `/api/${route}/${id}/${actionOrBody}` : `/api/${route}/${id}`;
      const res = await fetch(url, { 
        method: 'PATCH',
        headers: localApi.getHeaders(),
        body: isAction ? (body ? JSON.stringify(body) : undefined) : JSON.stringify(actionOrBody)
      });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro na operação');
        return data;
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(`Erro no servidor (${res.status}): ${text || 'Erro desconhecido'}`);
        return text;
      }
    },
    delete: async (route: string, id?: any) => {
      const url = id ? `/api/${route}/${id}` : `/api/${route}`;
      const res = await fetch(url, { 
        method: 'DELETE',
        headers: localApi.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na operação');
      return data;
    },
    upload: async (fileName: string, fileContent: string) => {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: localApi.getHeaders(),
        body: JSON.stringify({ fileName, fileContent })
      });
      return res.json();
    }
  };

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMassUpdateModalOpen, setIsMassUpdateModalOpen] = useState(false);
  const [massUpdateForm, setMassUpdateForm] = useState<{type: 'percent'|'fixed', action: 'increase'|'decrease', value: string}>({ type: 'percent', action: 'increase', value: '' });
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(null);
  const [editingService, setEditingService] = useState<RegisteredService | null>(null);
  const [editingOS, setEditingOS] = useState<Sale | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [editingFixedService, setEditingFixedService] = useState<FixedService | null>(null);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [labelPreviewProduct, setLabelPreviewProduct] = useState<Product | null>(null);
  const [showPdvCalculator, setShowPdvCalculator] = useState(false);
  const [showQuoteCalculator, setShowQuoteCalculator] = useState(false);
  const [showOsCalculator, setShowOsCalculator] = useState(false);
  const [labelQuantity, setLabelQuantity] = useState(1);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Client 360 State
  const [activeCliente360Id, setActiveCliente360Id] = useState<number | null>(null);

  // Quotes States
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteForm, setQuoteForm] = useState<Omit<Quote, 'id' | 'created_at'>>({
    customer_name: '',
    customer_id: undefined,
    motorcycle_details: '',
    total_value: 0,
    observations: '',
    warranty_terms: 'Garantia de 90 dias conforme CDC sobre os itens relacionados.',
    validity_days: 7,
    status: 'Pendente',
    items: []
  });
  const [isPrintingQuote, setIsPrintingQuote] = useState<Quote | null>(null);
  const [isStockSelectorOpen, setIsStockSelectorOpen] = useState(false);
  const [activeQuoteManualType, setActiveQuoteManualType] = useState<'Peça' | 'Serviço' | null>(null);
  const [manualQuoteItem, setManualQuoteItem] = useState({ description: '', quantity: '1', price: '' });
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [quoteCustomerSearch, setQuoteCustomerSearch] = useState('');

  // Form States
  const [customerForm, setCustomerForm] = useState({ 
    name: '', nickname: '', cpf: '', cnpj: '', whatsapp: '', address: '', 
    neighborhood: '', city: '', zip_code: '', credit_limit: 0, 
    fine_rate: 2, interest_rate: 1, image_url: '' 
  });
  const [productForm, setProductForm] = useState({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '', image_url2: '', image_url3: '', image_url4: '', brand: '', location: '', application: '', distributor: '', alt_code: '' });
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isLookingUpPlate, setIsLookingUpPlate] = useState(false);
  const [serviceForm, setServiceForm] = useState({ description: '', price: '', category: '' });
  const [motorcycleForm, setMotorcycleForm] = useState({ customer_id: '', plate: '', model: '', current_km: '' });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', company: '', value: '', priority: 'Média', phone: '' });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState<Sale[]>([]);
  const [isPdvModalOpen, setIsPdvModalOpen] = useState(false);
  const [isOsModalOpen, setIsOsModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [pdvForm, setPdvForm] = useState<{
    customer_id: string;
    mechanic_id: string;
    items: SaleItem[];
    payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
    due_date: string;
    sale_condition: 'Vista' | 'Prazo';
    installments: number;
    discount: number;
  }>({
    customer_id: '',
    mechanic_id: '',
    items: [],
    payment_method: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sale_condition: 'Vista',
    installments: 1,
    discount: 0
  });
  const [selectedPdvCategory, setSelectedPdvCategory] = useState<string>('all');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPaymentReceived, setCheckoutPaymentReceived] = useState<string>('');
  const [isPdvHistoryOpen, setIsPdvHistoryOpen] = useState(false);
  const [historyDate, setHistoryDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [historyCustomerSearch, setHistoryCustomerSearch] = useState('');
  const [osForm, setOsForm] = useState<{
    customer_id: string;
    motorcycle_id: string;
    motorcycle_plate: string;
    items: SaleItem[];
    selected_fixed_services: { id: string; name: string; price: number; payout: number; quantity: number }[];
    labor_value: string;
    principal_service_desc: string;
    internal_services: { description: string; price: number }[];
    mechanic_id: string;
    payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
    status: 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue';
    due_date: string;
    service_description: string;
    km: string;
  }>({
    customer_id: '',
    motorcycle_id: '',
    motorcycle_plate: '',
    items: [],
    selected_fixed_services: [],
    labor_value: '0',
    principal_service_desc: '',
    internal_services: [],
    mechanic_id: '',
    payment_method: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado',
    status: 'Aberto' as 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    service_description: '',
    km: ''
  });
  const [newInternalServiceDesc, setNewInternalServiceDesc] = useState('');
  const [newInternalServicePrice, setNewInternalServicePrice] = useState('');
  const [mechanicSummaryPeriod, setMechanicSummaryPeriod] = useState<'Hoje' | 'Semana' | 'Mês' | 'Todos'>('Hoje');
  const [pdvSearchProduct, setPdvSearchProduct] = useState('');
  const [osSearchProduct, setOsSearchProduct] = useState('');
  const [osSearchService, setOsSearchService] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForOS, setSelectedSaleForOS] = useState<Sale | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [fixedServices, setFixedServices] = useState<FixedService[]>([]);
  const [isMechanicModalOpen, setIsMechanicModalOpen] = useState(false);
  const [mechanicForm, setMechanicForm] = useState({ name: '', commissionRate: '' });
  const [isFixedServiceModalOpen, setIsFixedServiceModalOpen] = useState(false);
  const [fixedServiceForm, setFixedServiceForm] = useState({ name: '', price: '', payout: '' });
  const [isMechanicReportModalOpen, setIsMechanicReportModalOpen] = useState(false);
  const [selectedMechanicForReport, setSelectedMechanicForReport] = useState<Mechanic | null>(null);
  const [isFiadoModalOpen, setIsFiadoModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [isQuickInventoryOpen, setIsQuickInventoryOpen] = useState(false);
  const [quickInventorySearch, setQuickInventorySearch] = useState('');
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<Product | null>(null);
  const [quickInventoryStock, setQuickInventoryStock] = useState<string>('');
  const [countedItems, setCountedItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const html5QrCodeRef = useRef<any>(null);
  const isScanningRef = useRef(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [quoteCustomerSearchTerm, setQuoteCustomerSearchTerm] = useState('');
  
  const fetchFinancialSales = useCallback(async (currentGeneralSales?: any[]) => {
    try {
      const res = await fetch(`/api/sales?startDate=${revenueStartDate}&endDate=${revenueEndDate}`);
      if (!res.ok) throw new Error('Erro ao buscar faturamento');
      const salesData = await res.json();
      if (Array.isArray(salesData)) {
        const mappedSales = salesData.map((s: any) => ({ ...s, items: s.sale_items || [] }));
        setFinancialSales(mappedSales);
        
        // Stats Robustos
        const rev = mappedSales.reduce((acc: number, s: any) => acc + (s.total || 0), 0);
        
        const productCounts: Record<string, number> = {};
        mappedSales.forEach((sale: any) => {
          const items = sale.items || [];
          items.forEach((item: any) => {
            if (item.type === 'Peça' || !item.type) {
              const desc = item.description || 'Produto s/ nome';
              productCounts[desc] = (productCounts[desc] || 0) + (item.quantity || 0);
            }
          });
        });
        
        const topProducts = Object.entries(productCounts)
          .map(([description, total_sold]) => ({ description, total_sold }))
          .sort((a, b) => b.total_sold - a.total_sold)
          .slice(0, 5);

        const counterSales = mappedSales.filter((s: any) => s.type === 'Balcão');
        const serviceSales = mappedSales.filter((s: any) => s.type === 'Oficina');
        
        const avgCounter = counterSales.length > 0 
          ? counterSales.reduce((acc, s) => acc + (s.total || 0), 0) / counterSales.length 
          : 0;
        const avgService = serviceSales.length > 0 
          ? serviceSales.reduce((acc, s) => acc + (s.total || 0), 0) / serviceSales.length 
          : 0;

        const generalSales = currentGeneralSales || sales || [];
        const openServiceOrdersCount = generalSales.filter((s: any) => s.type === 'Oficina' && s.status !== 'Entregue').length;

        setStats({
          revenue: rev,
          openServiceOrders: openServiceOrdersCount,
          topProducts,
          avgTicketCounter: avgCounter,
          avgTicketService: avgService
        });
      }
    } catch (error) {
      console.error('Erro ao buscar vendas do faturamento:', error);
    }
  }, [revenueStartDate, revenueEndDate, sales]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchFinancialSales();
  }, [revenueStartDate, revenueEndDate]);
  
  const d_globalSearchTerm = useDeferredValue(globalSearchTerm);
  const d_inventorySearchTerm = useDeferredValue(inventorySearchTerm);
  const d_customerSearchTerm = useDeferredValue(customerSearchTerm);
  const d_searchTerm = useDeferredValue(searchTerm);
  const d_quoteSearchTerm = useDeferredValue(quoteSearchTerm);
  const d_stockSearchTerm = useDeferredValue(stockSearchTerm);
  const d_pdvSearchProduct = useDeferredValue(pdvSearchProduct);
  const d_osSearchProduct = useDeferredValue(osSearchProduct);
  const d_osSearchService = useDeferredValue(osSearchService);
  const d_serviceSearchTerm = useDeferredValue(serviceSearchTerm);
  const d_quoteCustomerSearch = useDeferredValue(quoteCustomerSearchTerm);


  
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  async function fetchData(force = false) {
    if (isFetchingRef.current) return;
    const now = Date.now();
    if (!force && (now - lastFetchTimeRef.current < 1000)) return;
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setLoading(true);
    console.time('⏱️ Carregamento Total');
    
    try {
      const fetchTable = async (route: string) => {
        const res = await fetch(`/api/${route}`);
        if (!res.ok) throw new Error(`Erro ao buscar ${route}`);
        return res.json();
      };

      // ── Todas as requisições em PARALELO (Promise.all) ────────────────────
      // Antes: sequencial (~14 round-trips encadeados)
      // Agora: simultâneo (tempo = a requisição mais lenta, não a soma delas)
      const [
        productsData,
        customersData,
        motorcyclesData,
        salesData,
        leadsData,
        mechanicsData,
        fixedServicesData,
        distributorsData,
        ordersData,
        cashSessionsData,
        cashTransactionsData,
        quotesData,
        servicesData,
        workshopPurchasesData,
      ] = await Promise.all([
        fetchTable('products').catch(() => []),
        fetchTable('customers').catch(() => []),
        fetchTable('motorcycles').catch(() => []),
        fetchTable('sales').catch(() => []),
        fetchTable('leads').catch(() => []),
        fetchTable('mechanics').catch(() => []),
        fetchTable('fixed_services').catch(() => []),
        fetchTable('distributors').catch(() => []),
        fetchTable('purchase_orders').catch(() => []),
        fetchTable('cash_sessions').catch(() => []),
        fetchTable('cash_transactions').catch(() => []),
        fetchTable('quotes').catch(() => []),
        fetchTable('registered_services').catch(() => []),
        fetchTable('workshop_purchases').catch(() => []),
      ]);

      if (productsData) setProducts(productsData);
      if (customersData) setCustomers(customersData);
      if (motorcyclesData) setMotorcycles(motorcyclesData);
      if (salesData) {
        setSales(salesData.map((s: any) => ({ ...s, items: s.sale_items || [] })));
      }
      if (leadsData) setLeads(leadsData);
      if (mechanicsData) setMechanics(mechanicsData);
      if (fixedServicesData) setFixedServices(fixedServicesData);
      if (distributorsData) {
        setDistributors(distributorsData.map((d: any) => ({
          ...d,
          phone: d.whatsapp || d.phone,
          contact_person: d.contact || d.contact_person
        })));
      }
      if (ordersData) setPurchaseOrders(ordersData);
      if (quotesData) setQuotes(quotesData);
      if (servicesData) setRegisteredServices(servicesData);
      if (workshopPurchasesData) setWorkshopPurchases(workshopPurchasesData);

      // Sync settings from localStorage
      const savedFees = localStorage.getItem('cardFeesSettings');
      if (savedFees) setCardFeesSettings(JSON.parse(savedFees));

      // Stats Robustos
      if (Array.isArray(salesData)) {
        fetchFinancialSales(salesData);
      }

      // LIBERA A UI AQUI
      setLoading(false);
      console.timeEnd('⏱️ Carregamento Total');

      // --- Background: Resolução de Fotos (Não bloqueia o usuário) ---
      // Movido para useEffect separado para maior eficiência
    } catch (error) {
      console.error('Erro no Servidor:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };


  // Barcode quick search direct add (hybrid search/barcode scanner support)
  useEffect(() => {
    if (pdvSearchProduct) {
      const query = pdvSearchProduct.trim();
      const match = products.find(p => p.barcode === query || p.sku === query);
      if (match) {
        handleAddPdvItem(match);
        setPdvSearchProduct('');
      }
    }
  }, [pdvSearchProduct, products]);

  // Global Keyboard Shortcuts (F2: Pagar, F4: Desconto, ESC: Cancelar cupom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'pdv') return;

      if (e.key === 'F2') {
        e.preventDefault();
        if (pdvForm.items.length > 0) {
          setIsCheckoutModalOpen(true);
        } else {
          alert('Adicione itens ao carrinho primeiro!');
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        const discInput = document.getElementById('pdv-discount-input');
        if (discInput) {
          discInput.focus();
          (discInput as HTMLInputElement).select();
        }
      } else if (e.key === 'Escape') {
        if (isCheckoutModalOpen) {
          setIsCheckoutModalOpen(false);
          return;
        }
        if (isPdvHistoryOpen) {
          setIsPdvHistoryOpen(false);
          return;
        }
        
        e.preventDefault();
        if (pdvForm.items.length > 0) {
          const proceed = window.confirm('Deseja realmente cancelar este cupom e esvaziar o carrinho?');
          if (proceed) {
            setPdvForm({
              customer_id: '',
              mechanic_id: '',
              items: [],
              payment_method: 'Pix',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              sale_condition: 'Vista',
              installments: 1,
              discount: 0
            });
            setCheckoutPaymentReceived('');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, pdvForm, isCheckoutModalOpen, isPdvHistoryOpen]);

  // Resolução de imagens em background via hook para evitar corridas
  useEffect(() => {
    if (!loading && products.length > 0) {
      const needsResolution = products.some(p => 
        (p.image_url && p.image_url.startsWith('/s/')) || 
        (p.image_url2 && p.image_url2.startsWith('/s/')) ||
        (p.image_url3 && p.image_url3.startsWith('/s/')) ||
        (p.image_url4 && p.image_url4.startsWith('/s/'))
      );

      if (needsResolution) {
        const timer = setTimeout(async () => {
          try {
            const codes = products.reduce((acc: string[], p) => {
              [p.image_url, p.image_url2, p.image_url3, p.image_url4].forEach(url => {
                if (url && url.startsWith('/s/') && !url.includes('blob')) acc.push(url.split('/s/')[1]);
              });
              return acc;
            }, []);
            
            const unique = Array.from(new Set(codes));
            if (unique.length > 0) {
              const res = await fetch(`/api/short_links?codes=${unique.join(',')}`);
              const links = await res.json();
              if (links && links.length > 0) {
                const map: Record<string, string> = {};
                links.forEach((l: any) => { map[l.code] = l.url; });
                
                const resolved = products.map(p => ({
                  ...p,
                  image_url: (p.image_url?.startsWith('/s/') ? map[p.image_url.split('/s/')[1]] : p.image_url) || p.image_url,
                  image_url2: (p.image_url2?.startsWith('/s/') ? map[p.image_url2.split('/s/')[1]] : p.image_url2) || p.image_url2,
                  image_url3: (p.image_url3?.startsWith('/s/') ? map[p.image_url3.split('/s/')[1]] : p.image_url3) || p.image_url3,
                  image_url4: (p.image_url4?.startsWith('/s/') ? map[p.image_url4.split('/s/')[1]] : p.image_url4) || p.image_url4,
                }));
                setProducts(resolved);
              }
            }
          } catch (err) {
            console.warn('Silent image load error:', err);
          }
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [products, loading]);

  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [selectedCustomerForPrint, setSelectedCustomerForPrint] = useState<{ customer: Customer; type: 'A4' | '80mm' } | null>(null);
  const [isManagementReportModalOpen, setIsManagementReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'customers' | 'inventory' | 'sales' | 'financial' | 'purchases' | null>(null);
  const [inventoryReportSearchTerm, setInventoryReportSearchTerm] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(localStorage.getItem('companyLogo'));
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>('');
  const [payingSaleId, setPayingSaleId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState(() => {
    const saved = localStorage.getItem('companyData');
    return saved ? JSON.parse(saved) : {
      razaoSocial: 'Kombat comercio de auto peças ltda',
      nomeFantasia: 'Kombat Moto Peças',
      cnpj: '12.802.931/0001-92',
      telefone: '433538-4537',
      email: 'kombatpecas@gmail.com',
      endereco: 'Rua: Paraná, 342',
      bairro: 'Centro',
      cidade: 'Andirá',
      estado: 'Pr',
      cep: '86380-000'
    };
  });

  useEffect(() => {
    localStorage.setItem('companyData', JSON.stringify(companyData));
  }, [companyData]);

  // --- Settings & Financial Props (Read-only for App, Managed by FinancialTab) ---
  const [cardFeesSettings, setCardFeesSettings] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('cardFeesSettings');
    const DEFAULT_CARD_FEES = {
      1: 3.05, 2: 4.3, 3: 5.25, 4: 6.20, 5: 7.15, 6: 8.01,
      7: 8.90, 8: 9.85, 9: 10.80, 10: 11.75, 11: 12.70, 12: 13.65
    };
    return saved ? JSON.parse(saved) : DEFAULT_CARD_FEES;
  });

  // Parts Order State
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<{
    distributor_id: string;
    items: PurchaseOrderItem[];
  }>({
    distributor_id: '',
    items: []
  });
  const [orderSearchProduct, setOrderSearchProduct] = useState('');

  // Distributor States
  const [isDistributorModalOpen, setIsDistributorModalOpen] = useState(false);
  const [distributorForm, setDistributorForm] = useState({ name: '', phone: '', contact_person: '' });

  // Workshop Purchases History State
  const [workshopPurchases, setWorkshopPurchases] = useState<any[]>([]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  }, [products]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [customers]);

  const sortedRegisteredServices = useMemo(() => {
    return [...registeredServices].sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  }, [registeredServices]);

  const sortedFixedServices = useMemo(() => {
    return [...fixedServices].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [fixedServices]);

  const sortedMechanics = useMemo(() => {
    return [...mechanics].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [mechanics]);

  const sortedDistributors = useMemo(() => {
    return [...distributors].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [distributors]);

  const filteredInventoryProducts = useMemo(() => {
    const search = (d_inventorySearchTerm.trim() || d_globalSearchTerm.trim()).toLowerCase();
    return sortedProducts.filter(p => {
      if (!search) return true;
      return (
        (p.description || '').toLowerCase().includes(search) ||
        (p.sku || '').toLowerCase().includes(search) ||
        (p.alt_code || '').toLowerCase().includes(search) ||
        (p.location && (p.location || '').toLowerCase().includes(search)) ||
        (p.barcode || '').toLowerCase().includes(search) ||
        (p.brand && (p.brand || '').toLowerCase().includes(search))
      );
    });
  }, [sortedProducts, d_inventorySearchTerm, d_globalSearchTerm]);

  const handleAddDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: distributorForm.name,
        phone: distributorForm.phone,
        contact_person: distributorForm.contact_person,
      };

      if (editingDistributor) {
        await localApi.put('distributors', editingDistributor.id, payload);
        alert(`Distribuidor atualizado com sucesso!`);
      } else {
        await localApi.post('distributors', payload);
        alert(`Distribuidor cadastrado com sucesso!`);
      }

      setIsDistributorModalOpen(false);
      setEditingDistributor(null);
      setDistributorForm({ name: '', phone: '', contact_person: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving distributor:', error);
      alert('Erro ao salvar distribuidor.');
    }
  };

  const handleAddMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: mechanicForm.name,
        commission_rate: parseFloat(mechanicForm.commissionRate) || 0,
        active: true
      };

      if (editingMechanic) {
        await localApi.put('mechanics', editingMechanic.id, payload);
        alert(`Mecânico atualizado com sucesso!`);
      } else {
        await localApi.post('mechanics', payload);
        alert(`Mecânico cadastrado com sucesso!`);
      }

      setIsMechanicModalOpen(false);
      setEditingMechanic(null);
      setMechanicForm({ name: '', commissionRate: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving mechanic:', error);
      alert('Erro ao salvar mecânico.');
    }
  };

  const handleAddFixedService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: fixedServiceForm.name,
        price: parseFloat(fixedServiceForm.price) || 0,
        payout: parseFloat(fixedServiceForm.payout) || 0,
      };

      if (editingFixedService) {
        await localApi.put('fixed_services', editingFixedService.id, payload);
        alert(`Serviço atualizado com sucesso!`);
      } else {
        await localApi.post('fixed_services', payload);
        alert(`Serviço adicionado à tabela!`);
      }

      setIsFixedServiceModalOpen(false);
      setEditingFixedService(null);
      setFixedServiceForm({ name: '', price: '', payout: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving fixed service:', error);
      alert('Erro ao salvar serviço.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este pedido de peças?')) {
      try {
        await localApi.delete('purchase_orders', orderId);
        alert('Pedido de peças deletado com sucesso!');
        fetchData();
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Erro ao deletar pedido.');
      }
    }
  };

  // Function to categorize products based on description
  const categorizeProduct = (description: string): string => {
    const lowerDescription = description.toLowerCase();
    if (lowerDescription.includes('motor') || lowerDescription.includes('cilindro') || lowerDescription.includes('pistão') || lowerDescription.includes('virabrequim')) {
      return 'Peças de Motor';
    } else if (lowerDescription.includes('capacete') || lowerDescription.includes('luva') || lowerDescription.includes('jaqueta') || lowerDescription.includes('bota')) {
      return 'Equipamentos (Capacetes/Luvas)';
    } else if (lowerDescription.includes('pneu') || lowerDescription.includes('relação') || lowerDescription.includes('corrente') || lowerDescription.includes('coroa') || lowerDescription.includes('pinhao')) {
      return 'Pneus e Relação';
    } else if (lowerDescription.includes('escapamento') || lowerDescription.includes('retrovisor') || lowerDescription.includes('manopla') || lowerDescription.includes('guidao') || lowerDescription.includes('carenagem')) {
      return 'Acessórios e Estética';
    } else if (lowerDescription.includes('suspensão') || lowerDescription.includes('amortecedor') || lowerDescription.includes('garfo') || lowerDescription.includes('bucha') || lowerDescription.includes('rolamento')) {
      return 'Peças de Suspensão';
    } else if (lowerDescription.includes('freio') || lowerDescription.includes('pastilha') || lowerDescription.includes('disco') || lowerDescription.includes('burrinho') || lowerDescription.includes('flexível')) {
      return 'Peças de Freio';
    } else if (lowerDescription.includes('elétrica') || lowerDescription.includes('bateria') || lowerDescription.includes('vela') || lowerDescription.includes('cabo') || lowerDescription.includes('chicote') || lowerDescription.includes('farol')) {
      return 'Peças Elétricas';
    } else if (lowerDescription.includes('ferramenta') || lowerDescription.includes('chave') || lowerDescription.includes('alicate') || lowerDescription.includes('martelo') || lowerDescription.includes('kit reparo')) {
      return 'Ferramentas';
    } else if (lowerDescription.includes('serviço') || lowerDescription.includes('revisão') || lowerDescription.includes('manutenção') || lowerDescription.includes('instalação')) {
      return 'Serviços de Oficina';
    } else {
      return 'Outros';
    }
  };

  const shortenUrl = async (url: string): Promise<string> => {
    // Determine if it's "heavy" (Base64 is always heavy, URLs over 200 chars are heavy)
    const isHeavy = url.startsWith('data:') || url.length > 200;

    // If not heavy and not already a short link, don't shorten for storage
    if (!isHeavy && !url.includes('/s/')) return url;

    // If it's already a short link, return as is
    if (url.includes('/s/')) return url;

    try {
      // Create new short code
      const code = Math.random().toString(36).substring(2, 8);
      
      // Use a direct fetch to avoid localApi's automatic .json() move on potential HTML error
      const res = await fetch('/api/short_links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, url })
      });
      
      if (!res.ok) return url; // If route is missing (404), just use original URL
      
      return `/s/${code}`;
    } catch (error) {
      console.error('Error shortening URL:', error);
      return url;
    }
  };

  useEffect(() => {
    // Handle URL Redirection for Shortened Links
    const handleRedirect = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/s/')) {
        const code = path.split('/s/')[1];
        if (code) {
          try {
            const res = await fetch(`/api/short_links/${code}`);
            if (res.ok) {
              window.location.href = res.url;
              return;
            }
          } catch (err) {
            console.error('Redirection error:', err);
          }
        }
      }
    };
    handleRedirect();

    // Check user authentication status on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      }
      fetchData();
      setAuthChecking(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Erro ao sair', error);
    }
  };




  const handleUpdateDueDate = async (saleId: string, newDate: string) => {
    try {
      await localApi.patch('sales', saleId, 'due-date', { due_date: new Date(newDate).toISOString() });
      setSales(sales.map(s => s.id === saleId ? { ...s, due_date: new Date(newDate).toISOString() } : s));
    } catch (err: any) {
      alert('Erro ao atualizar vencimento: ' + err.message);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCompanyLogo(base64String);
        localStorage.setItem('companyLogo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDelete = () => {
    if (window.confirm('Deseja realmente remover o logo da empresa?')) {
      setCompanyLogo(null);
      localStorage.removeItem('companyLogo');
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await localApi.put('leads', editingLead.id, {
          name: leadForm.name,
          company: leadForm.company,
          value: parseFloat(leadForm.value.toString().replace(',', '.')) || 0,
          priority: leadForm.priority,
          phone: leadForm.phone
        });
      } else {
        await localApi.post('leads', {
          name: leadForm.name,
          company: leadForm.company,
          value: parseFloat(leadForm.value.toString().replace(',', '.')) || 0,
          priority: leadForm.priority,
          status: 'Prospecção',
          phone: leadForm.phone
        });
      }

      setIsLeadModalOpen(false);
      setEditingLead(null);
      setLeadForm({ name: '', company: '', value: '', priority: 'Média', phone: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding/updating lead:', error);
      alert('Erro ao salvar lead: ' + (error.message || 'Erro no servidor'));
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      company: lead.company,
      value: lead.value.toString(),
      priority: lead.priority,
      phone: lead.phone
    });
    setIsLeadModalOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      await localApi.delete('leads', id);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      alert('Erro ao excluir lead: ' + (error.message || 'Erro de conexão ou permissão.'));
    }
  };

  const moveLead = (leadId: string, newStatus: Lead['status']) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleAddPdvItem = (product: Product) => {
    const existing = pdvForm.items.find(i => i.product_id === product.id);
    if (existing) {
      setPdvForm({
        ...pdvForm,
        items: pdvForm.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      });
    } else {
      setPdvForm({
        ...pdvForm,
        items: [...pdvForm.items, { product_id: product.id, description: product.description, quantity: 1, price: product.sale_price }]
      });
    }
    setPdvSearchProduct('');
  };

  const handleRemovePdvItem = (productId?: number) => {
    setPdvForm({
      ...pdvForm,
      items: pdvForm.items.filter(i => i.product_id !== productId)
    });
  };

  const handlePdvItemPriceChange = (index: number, newPrice: number) => {
    setPdvForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], price: newPrice };
      return { ...prev, items: newItems };
    });
  };

  const handlePdvItemQuantityChange = (index: number, newQuantity: number) => {
    setPdvForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], quantity: newQuantity };
      return { ...prev, items: newItems };
    });
  };

  const handleAddOsItem = (product: Product) => {
    const existing = osForm.items.find(i => i.product_id === product.id);
    if (existing) {
      setOsForm({
        ...osForm,
        items: osForm.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      });
    } else {
      setOsForm({
        ...osForm,
        items: [...osForm.items, { product_id: product.id, description: product.description, quantity: 1, price: product.sale_price }]
      });
    }
    setOsSearchProduct('');
  };

  const handleUpdateStockQuick = async () => {
    if (!selectedQuickProduct) return;
    const newStock = parseInt(quickInventoryStock) || 0;
    
    try {
      await localApi.put('products', selectedQuickProduct.id, {
        ...selectedQuickProduct,
        stock: newStock
      });
      
      alert(`Estoque de "${selectedQuickProduct.description}" atualizado para ${newStock}!`);
      setSelectedQuickProduct(null);
      setQuickInventorySearch('');
      setQuickInventoryStock('');
      fetchData();
      
      // Auto-focus the search input for the next item (done via ref if possible, but alert might steal focus)
    } catch (error: any) {
      console.error('Erro ao atualizar estoque:', error);
      alert('Erro ao atualizar estoque: ' + (error.message || 'Verifique sua conexão.'));
    }
  };

  const addOrIncrementCountedProduct = (product: Product) => {
    setCountedItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1
        };
        return updated;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    playBeep();
  };

  const startScanner = async () => {
    try {
      await loadHtml5Qrcode();
      setIsCameraActive(true);
      
      // Wait for React to render the DOM node in the next tick
      setTimeout(async () => {
        try {
          const container = document.getElementById("camera-preview-container");
          if (!container) {
            throw new Error("Container da câmera não encontrado no DOM.");
          }

          if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new (window as any).Html5Qrcode("camera-preview-container");
          }
          
          await html5QrCodeRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (width: number, height: number) => {
                return { width: Math.min(width * 0.8, 280), height: Math.min(height * 0.5, 160) };
              },
              aspectRatio: 1.0
            },
            async (decodedText: string) => {
              if (isScanningRef.current) return;
              isScanningRef.current = true;
              
              playBeep();
              
              try {
                let found = products.find(p => 
                  p.barcode === decodedText || 
                  p.sku === decodedText || 
                  p.alt_code === decodedText
                );
                
                if (!found) {
                  const res = await fetch(`/api/products/barcode/${encodeURIComponent(decodedText)}`, {
                    headers: localApi.getHeaders()
                  });
                  if (res.ok) {
                    found = await res.json();
                  }
                }
                
                if (found) {
                  addOrIncrementCountedProduct(found);
                } else {
                  alert(`Produto com código "${decodedText}" não encontrado.`);
                }
              } catch (err) {
                console.error("Erro ao buscar produto por código:", err);
              } finally {
                setTimeout(() => {
                  isScanningRef.current = false;
                }, 1200);
              }
            },
            () => {}
          );
        } catch (innerErr: any) {
          console.error("Erro interno ao iniciar scanner:", innerErr);
          alert("Não foi possível acessar a câmera. Verifique as permissões de acesso.");
          setIsCameraActive(false);
        }
      }, 150);
    } catch (err: any) {
      console.error("Erro ao carregar script do scanner:", err);
      alert("Não foi possível carregar o leitor de código de barras.");
      setIsCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Erro ao parar câmera:", err);
      }
    }
    setIsCameraActive(false);
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      await stopScanner();
    } else {
      await startScanner();
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      const container = document.getElementById("camera-preview-container");
      if (container) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeName === 'VIDEO') {
                const video = node as HTMLVideoElement;
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
                video.setAttribute('muted', 'true');
                video.muted = true;
                video.play().catch(e => console.log("Video auto play failed or already playing:", e));
              }
            });
          });
        });
        observer.observe(container, { childList: true, subtree: true });
        return () => observer.disconnect();
      }
    }
  }, [isCameraActive]);

  const handleSaveBulkInventory = async () => {
    if (countedItems.length === 0) return;
    
    try {
      const payload = countedItems.map(item => ({
        id: item.product.id,
        stock: item.quantity
      }));
      
      await localApi.put('products', 'bulk-stock-update', { items: payload });
      
      alert('Estoque atualizado com sucesso!');
      await stopScanner();
      setIsQuickInventoryOpen(false);
      setCountedItems([]);
      setModalSearchTerm('');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao atualizar estoque:', error);
      alert('Erro ao atualizar estoque: ' + (error.message || 'Verifique sua conexão.'));
    }
  };

  const handleOsItemPriceChange = (index: number, newPrice: number) => {
    setOsForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], price: newPrice };
      return { ...prev, items: newItems };
    });
  };

  const handleOsItemTotalChange = (index: number, newTotal: number) => {
    setOsForm(prev => {
      const newItems = [...prev.items];
      const qty = newItems[index].quantity || 1;
      newItems[index] = { ...newItems[index], price: newTotal / qty };
      return { ...prev, items: newItems };
    });
  };

  const handleOsItemQuantityChange = (index: number, newQuantity: number) => {
    setOsForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], quantity: newQuantity };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveOsItem = (index: number) => {
    setOsForm({
      ...osForm,
      items: osForm.items.filter((_, i) => i !== index)
    });
  };

  const handleCompleteSale = async () => {
    if (pdvForm.items.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    const itemsBaseTotal = pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const subtotalWithDiscount = Math.max(0, itemsBaseTotal - (pdvForm.discount || 0));
    let total = subtotalWithDiscount;
    let finalItems = [...pdvForm.items];

    if (pdvForm.sale_condition === 'Prazo') {
      const fee = cardFeesSettings[pdvForm.installments] || 0;
      const divisor = 1 - (fee / 100);
      total = divisor > 0 ? (subtotalWithDiscount / divisor) : subtotalWithDiscount;
      const diff = total - subtotalWithDiscount;
      if (diff > 0) {
        finalItems.push({
          description: `TAXA DE PARCELAMENTO (${pdvForm.installments}x)`,
          quantity: 1,
          price: diff
        });
      }
    }

    const customer = pdvForm.customer_id ? customers.find(c => c.id === parseInt(pdvForm.customer_id)) : null;
    const mechanic = pdvForm.mechanic_id ? mechanics.find(m => String(m.id) === String(pdvForm.mechanic_id)) : null;

    if (pdvForm.payment_method === 'Fiado') {
      if (!pdvForm.customer_id) {
        alert("Selecione um cliente para realizar uma venda fiada.");
        return;
      }

      if (!customer) {
        alert("Cliente não encontrado.");
        return;
      }

      try {
        const currentDebt = (sales || [])
          .filter(s => s && s.customer_id === customer.id && s.payment_status === 'Pendente')
          .reduce((acc, s) => acc + (s.total || 0), 0);

        if (currentDebt + total > (customer.credit_limit || 0)) {
          const proceed = window.confirm(`Limite de crédito excedido! \nLimite: ${formatBRL(customer.credit_limit)} \nDívida Atual: ${formatBRL(currentDebt)} \nEsta Venda: ${formatBRL(total)} \n\nDeseja continuar mesmo assim?`);
          if (!proceed) return;
        }
      } catch (err) {
        console.warn("Aviso: Não foi possível calcular a dívida exata, mas permitindo venda.", err);
      }
    }

    // Calculate Mechanic Commission for Balcão
    let commission = 0;
    if (mechanic) {
      const rate = (mechanic.commission_rate || 50) / 100;
      const serviceItems = finalItems.filter(i => 
        i.type === 'Serviço' || 
        i.type === 'Serviço Principal' || 
        i.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS'
      );
      const laborTotal = serviceItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      commission = laborTotal * rate;
    }

    const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newSale: Sale = {
      id: saleId,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Consumidor Final',
      items: finalItems,
      labor_value: 0,
      mechanic_id: mechanic?.id,
      mechanic_name: mechanic?.name,
      commission,
      total,
      payment_method: pdvForm.payment_method,
      type: 'Balcão',
      date: new Date().toISOString(),
      payment_status: pdvForm.payment_method === 'Fiado' ? 'Pendente' : 'Pago',
      due_date: pdvForm.payment_method === 'Fiado' ? pdvForm.due_date : undefined,
      paid_date: pdvForm.payment_method !== 'Fiado' ? new Date().toISOString() : undefined
    };

    try {
      setLoading(true);
      // Send sale with items to the single transactional endpoint
      await localApi.post('sales', {
        ...newSale,
        sale_items: finalItems
      });

      setSales([newSale, ...sales]);
      setIsCheckoutModalOpen(false);
      setSelectedSaleForReceipt(newSale);
      setPdvForm({
        customer_id: '',
        mechanic_id: '',
        items: [],
        payment_method: 'Pix',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_condition: 'Vista',
        installments: 1,
        discount: 0
      });
      setCheckoutPaymentReceived('');
      alert(`Venda ${newSale.id} concluída com sucesso!`);
      fetchData(true); // Refresh to update all states (stock, cash, etc)
      return;
    } catch (error: any) {
      console.error('Error saving sale:', error);
      alert('Erro ao salvar venda: ' + (error.message || 'Erro no servidor'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditOS = (os: Sale) => {
    setEditingOS(os);

    // Find motorcycle from details if possible
    const plateMatch = os.moto_details?.match(/\((.*?)\)/);
    const plate = plateMatch ? plateMatch[1] : '';
    const motorcycle = motorcycles.find(m => m.plate === plate);
    const kmMatch = os.moto_details?.match(/KM: (.*)/);
    const km = kmMatch ? kmMatch[1] : '';

    const principalServiceItem = os.items?.find(i => i.type === 'Serviço Principal');
    const legacyLaborItem = os.items?.find(i => i.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS');
    const internalServiceItems = os.items?.filter(i => i.type === 'Adicional Interno') || [];

    const filteredItems = os.items?.filter(i => 
      i.type !== 'Serviço Principal' && 
      i.type !== 'Adicional Interno' && 
      i.description !== 'MÃO DE OBRA / SERVIÇOS AVULSOS'
    ) || [];

    let laborVal = '0';
    if (principalServiceItem) {
      laborVal = principalServiceItem.price.toString();
    } else if (legacyLaborItem) {
      laborVal = legacyLaborItem.price.toString();
    } else if (os.labor_value > 0) {
      laborVal = os.labor_value.toString();
    }

    const principalDesc = principalServiceItem ? principalServiceItem.description : '';

    setOsForm({
      customer_id: os.customer_id?.toString() || '',
      motorcycle_id: motorcycle?.id.toString() || '',
      motorcycle_plate: plate || '',
      items: filteredItems,
      selected_fixed_services: [],
      labor_value: laborVal,
      principal_service_desc: principalDesc,
      internal_services: internalServiceItems.map(it => ({ description: it.description, price: it.price })),
      mechanic_id: os.mechanic_id || '',
      payment_method: os.payment_method as any,
      status: os.status as any || 'Aberto',
      due_date: os.due_date ? os.due_date.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      service_description: os.service_description || '',
      km: km
    });
    setIsOsModalOpen(true);
  };

  const handleCompleteOS = async () => {
    if (osForm.items.length === 0 && parseFloat(osForm.labor_value.toString().replace(',', '.')) === 0) {
      alert("Adicione pelo menos um item ou valor de mão de obra.");
      return;
    }

    const totalItems = osForm.items.filter(i => i.product_id || i.type === 'Peça').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const laborValueFromItems = osForm.items.filter(i => !i.product_id && i.type !== 'Peça').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const laborValueManual = parseFloat(osForm.labor_value.toString().replace(',', '.')) || 0;
    const laborValue = laborValueFromItems + laborValueManual;
    const fixedServicesTotal = (osForm.selected_fixed_services || []).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const totalBase = totalItems + laborValue + fixedServicesTotal;
    let total = totalBase;
    
    const fixedServiceItems: SaleItem[] = (osForm.selected_fixed_services || []).map(sfs => ({
      description: sfs.name,
      quantity: sfs.quantity,
      price: sfs.price,
      type: 'Serviço'
    }));
    
    let finalItems = [...osForm.items, ...fixedServiceItems];
    
    if (laborValueManual > 0) {
      finalItems.push({
        description: osForm.principal_service_desc.trim() || 'MÃO DE OBRA / SERVIÇOS AVULSOS',
        quantity: 1,
        price: laborValueManual,
        type: 'Serviço Principal'
      });
    }

    if (osForm.mechanic_id && osForm.internal_services && osForm.internal_services.length > 0) {
      osForm.internal_services.forEach(it => {
        finalItems.push({
          description: it.description,
          quantity: 1,
          price: it.price,
          type: 'Adicional Interno'
        });
      });
    }

    const customer = osForm.customer_id ? customers.find(c => c.id === parseInt(osForm.customer_id)) : null;
    const motorcycle = osForm.motorcycle_id ? motorcycles.find(m => String(m.id) === String(osForm.motorcycle_id)) : null;
    const mechanic = mechanics.find(m => String(m.id) === String(osForm.mechanic_id));

    if (osForm.payment_method === 'Fiado') {
      if (!osForm.customer_id) {
        alert("Selecione um cliente cadastrado para realizar uma O.S. fiada.");
        return;
      }

      if (!customer) {
        alert("Cliente não encontrado.");
        return;
      }

      const currentDebt = sales
        .filter(s => s.customer_id === customer.id && s.payment_status === 'Pendente' && (!editingOS || s.id !== editingOS.id))
        .reduce((acc, s) => acc + s.total, 0);

      // Se for edição e o total não aumentou, não precisa bloquear
      const isEditingAndNotIncreasingDebt = editingOS && total <= editingOS.total;

      if (!isEditingAndNotIncreasingDebt && (currentDebt + total > (customer.credit_limit || 0))) {
        const proceed = window.confirm(`Limite de crédito excedido!\nLimite: ${formatBRL(customer.credit_limit)}\nDívida Atual: ${formatBRL(currentDebt)}\nEsta O.S.: ${formatBRL(total)}\n\nDeseja salvar a O.S. mesmo assim?`);
        if (!proceed) return;
      }
    }

    // Calculate Commission
    let commission = 0;
    if (mechanic) {
      const rate = (mechanic.commission_rate || 50) / 100;
      
      (osForm.selected_fixed_services || []).forEach(sfs => {
        commission += sfs.payout * sfs.quantity;
      });

      const serviceItemsExcludingFixed = osForm.items.filter(i => 
        i.type === 'Serviço' || 
        i.type === 'Serviço Principal' || 
        i.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS'
      );
      const laborTotalFromItems = serviceItemsExcludingFixed.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      commission += laborTotalFromItems * rate;

      if (laborValueManual > 0) {
        commission += laborValueManual * rate;
      }
    }

    const osId = editingOS ? editingOS.id : Math.random().toString(36).substr(2, 9).toUpperCase();
    const motoDetailsStr = motorcycle 
      ? `${motorcycle.model} (${osForm.motorcycle_plate || motorcycle.plate}) - KM: ${osForm.km}`
      : `Placa: ${osForm.motorcycle_plate || 'N/A'} - KM: ${osForm.km || '0'}`;

    const newOS: Sale = {
      id: osId,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Cliente O.S.',
      items: finalItems,
      labor_value: laborValueManual,
      mechanic_id: mechanic?.id,
      mechanic_name: mechanic?.name,
      commission,
      total,
      payment_method: osForm.payment_method,
      type: 'Oficina',
      date: editingOS ? editingOS.date : new Date().toISOString(),
      moto_details: motoDetailsStr,
      payment_status: osForm.payment_method === 'Fiado' ? 'Pendente' : 'Pago',
      due_date: osForm.payment_method === 'Fiado' ? osForm.due_date : undefined,
      paid_date: osForm.payment_method !== 'Fiado' ? new Date().toISOString() : undefined,
      service_description: osForm.service_description,
      status: osForm.status
    };

    // Update motorcycle plate/km if modified
    if (motorcycle && (motorcycle.plate !== osForm.motorcycle_plate || motorcycle.current_km !== osForm.km)) {
      try {
        await localApi.put('motorcycles', motorcycle.id, {
          ...motorcycle,
          plate: osForm.motorcycle_plate || motorcycle.plate,
          current_km: osForm.km || motorcycle.current_km
        });
      } catch (err) {
        console.error('Failed to update motorcycle details', err);
      }
    }

    try {
      setLoading(true);
      if (editingOS) {
        await localApi.put('sales', editingOS.id, {
          customer_id: newOS.customer_id,
          customer_name: newOS.customer_name,
          labor_value: newOS.labor_value,
          mechanic_id: newOS.mechanic_id,
          mechanic_name: newOS.mechanic_name,
          commission: newOS.commission,
          total: newOS.total,
          payment_method: newOS.payment_method,
          moto_details: newOS.moto_details,
          payment_status: newOS.payment_status,
          due_date: newOS.due_date,
          paid_date: newOS.paid_date,
          service_description: newOS.service_description,
          status: newOS.status,
          sale_items: finalItems,
          motorcycle_id: motorcycle?.id,
          motorcycle_km: parseInt(osForm.km) || 0
        });
      } else {
        await localApi.post('sales', {
          id: newOS.id,
          customer_id: newOS.customer_id,
          customer_name: newOS.customer_name,
          labor_value: newOS.labor_value,
          mechanic_id: newOS.mechanic_id,
          mechanic_name: newOS.mechanic_name,
          commission: newOS.commission,
          total: total,
          payment_method: newOS.payment_method,
          type: newOS.type,
          date: newOS.date,
          moto_details: newOS.moto_details,
          payment_status: newOS.payment_status,
          due_date: newOS.due_date,
          paid_date: newOS.paid_date,
          service_description: newOS.service_description,
          status: newOS.status,
          sale_items: finalItems,
          motorcycle_id: motorcycle?.id,
          motorcycle_km: parseInt(osForm.km) || 0
        });
      }

      fetchData(true);
      setIsOsModalOpen(false);
      setEditingOS(null);
      setSelectedSaleForOS(newOS);
      setOsForm({
        customer_id: '',
        motorcycle_id: '',
        motorcycle_plate: '',
        items: [],
        selected_fixed_services: [],
        labor_value: '0',
        principal_service_desc: '',
        internal_services: [],
        mechanic_id: '',
        payment_method: 'Pix',
        status: 'Aberto',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        service_description: '',
        km: ''
      });
      alert(`Ordem de Serviço ${newOS.id} salva com sucesso!`);
    } catch (error: any) {
      console.error('Error completing O.S.:', error);
      alert('Erro ao salvar Ordem de Serviço: ' + (error.message || 'Erro no servidor'));
    } finally {
      setLoading(false);
    }
  };

  const renderPDV = () => {
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
    const totalToday = todaySales.reduce((acc, curr) => acc + curr.total, 0);

    const historySales = sales.filter(s => {
      const d = new Date(s.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const matchesDate = `${year}-${month}-${day}` === historyDate;
      const matchesSearch = historyCustomerSearch.trim() === '' || 
        (s.customer_name || '').toLowerCase().includes(historyCustomerSearch.toLowerCase());
      return matchesDate && matchesSearch;
    });
    const totalHistorySales = historySales.reduce((acc, curr) => acc + curr.total, 0);

    const categories = (() => {
      const list = new Set(products.map(p => p.category).filter(Boolean));
      return ['all', ...Array.from(list)];
    })();

    const filteredProducts = sortedProducts.filter(p => {
      const query = pdvSearchProduct.toLowerCase();
      const matchesSearch = 
        (p.description || '').toLowerCase().includes(query) ||
        (p.brand || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query) ||
        (p.barcode || '').toLowerCase().includes(query) ||
        (p.alt_code || '').toLowerCase().includes(query);

      const matchesCategory = selectedPdvCategory === 'all' || p.category === selectedPdvCategory;
      return matchesSearch && matchesCategory;
    });

    const cartTotal = pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const cartGrandTotal = Math.max(0, cartTotal - (pdvForm.discount || 0));

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] -mt-4 -mx-6 bg-slate-900 text-slate-100 overflow-hidden select-none">
        {/* PDV Header / Top Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/10 text-rose-500 rounded-lg">
              <ShoppingCart size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-rose-500">Kombat Moto Peças - Frente de Caixa</h2>
              <p className="text-[10px] text-slate-400 font-bold">Operação ativa • Vendas de Hoje: <span className="text-emerald-500">{formatBRL(totalToday)}</span> ({todaySales.length} atendimentos)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPdvHistoryOpen(true)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black uppercase hover:bg-slate-700 transition-all flex items-center gap-2 text-slate-200"
            >
              <History size={14} />
              Histórico de Hoje
            </button>
            <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-slate-100 px-1 py-0.5 rounded font-sans font-bold">F2</kbd> Pagar</span>
              <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-slate-100 px-1 py-0.5 rounded font-sans font-bold">F4</kbd> Desconto</span>
              <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-slate-100 px-1 py-0.5 rounded font-sans font-bold">ESC</kbd> Cancelar</span>
            </div>
          </div>
        </div>

        {/* PDV Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
          {/* LEFT SIDE (~60%): PRODUCT CATALOG */}
          <div className="lg:col-span-3 flex flex-col border-r border-slate-800 overflow-hidden bg-slate-900/50 p-4 space-y-4">
            {/* Search and Category filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome, código, marca ou bipe o código de barras..."
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none text-sm text-slate-100 font-bold transition-all placeholder-slate-500"
                  value={pdvSearchProduct}
                  onChange={e => setPdvSearchProduct(e.target.value)}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <Barcode className="text-slate-500" size={18} />
                </div>
              </div>

              {/* Horizontally scrollable Category selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <button
                  onClick={() => setSelectedPdvCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap border ${selectedPdvCategory === 'all'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                >
                  Todas
                </button>
                {categories.filter(c => c !== 'all').map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPdvCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap border ${selectedPdvCategory === cat
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <Package size={48} className="text-slate-700 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-bold">Nenhum produto encontrado</p>
                  <p className="text-xs text-slate-600 mt-1">Experimente mudar o filtro de categoria ou a busca</p>
                  {pdvSearchProduct && (
                    <button
                      onClick={() => {
                        setPdvForm({ ...pdvForm, items: [...pdvForm.items, { product_id: undefined, description: pdvSearchProduct.toUpperCase(), quantity: 1, price: 0, type: 'Peça' }] });
                        setPdvSearchProduct('');
                      }}
                      className="mt-4 px-4 py-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-rose-500/20"
                    >
                      <PlusCircle size={14} /> Adicionar "{pdvSearchProduct}" avulso ao carrinho
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                  {filteredProducts.map(product => {
                    const isLowStock = product.stock <= 2;
                    const isOutOfStock = product.stock <= 0;
                    return (
                      <div
                        key={product.id}
                        onClick={() => !isOutOfStock && handleAddPdvItem(product)}
                        className={`group relative flex flex-col bg-slate-950 border rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${isOutOfStock
                          ? 'opacity-40 border-slate-850 cursor-not-allowed'
                          : 'border-slate-800 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/20'
                          }`}
                      >
                        {/* Image / Icon Box */}
                        <div className="aspect-video w-full bg-slate-900 flex items-center justify-center relative overflow-hidden border-b border-slate-900">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.description}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-600 group-hover:text-rose-500/60 transition-colors">
                              <Package size={28} className="stroke-[1.5]" />
                            </div>
                          )}

                          {/* Brand Tag */}
                          {product.brand && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[8px] font-black text-rose-400 uppercase rounded">
                              {product.brand}
                            </span>
                          )}

                          {/* Stock Tag */}
                          <span className={`absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black uppercase rounded shadow-sm ${isOutOfStock
                            ? 'bg-red-950 border border-red-800 text-red-400'
                            : isLowStock
                              ? 'bg-amber-950 border border-amber-800 text-amber-400'
                              : 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                            }`}>
                            Estoque: {product.stock}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-slate-200 line-clamp-2 group-hover:text-white transition-colors">
                              {product.description}
                            </h4>
                            <p className="text-[9px] text-slate-500 font-mono">SKU: {product.sku}</p>
                          </div>

                          <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Preço</span>
                            <span className="text-sm font-black text-rose-500 group-hover:text-rose-400 transition-colors">
                              {formatBRL(product.sale_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (~40%): SHOPPING CART */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden bg-slate-950">
            {/* Vínculo Vendedor e Cliente */}
            <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">Cliente da Venda</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500/20 text-slate-100"
                    value={pdvForm.customer_id}
                    onChange={e => setPdvForm({ ...pdvForm, customer_id: e.target.value })}
                  >
                    <option value="">Consumidor Final</option>
                    {sortedCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.nickname ? ` (${c.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">Mecânico / Vendedor</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500/20 text-slate-100"
                    value={pdvForm.mechanic_id}
                    onChange={e => setPdvForm({ ...pdvForm, mechanic_id: e.target.value })}
                  >
                    <option value="">Nenhum (Sem Comissão)</option>
                    {mechanics.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {pdvForm.customer_id && (
                <div className="flex justify-between items-center text-[10px] bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg text-rose-400">
                  <span className="font-bold uppercase tracking-wider">Crédito Disponível:</span>
                  <span className="font-black text-xs">
                    {formatBRL(getCustomerRemainingCredit(parseInt(pdvForm.customer_id)))}
                  </span>
                </div>
              )}
            </div>

            {/* Shopping Cart List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {pdvForm.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                  <ShoppingCart size={40} className="stroke-[1.5] mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Carrinho Vazio</p>
                  <p className="text-[10px] text-slate-700 mt-0.5">Selecione produtos no catálogo à esquerda</p>
                </div>
              ) : (
                pdvForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl animate-in fade-in duration-200">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-200 truncate">{item.description}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Quantity adjusters */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden h-6.5">
                          <button
                            type="button"
                            onClick={() => handlePdvItemQuantityChange(idx, Math.max(1, item.quantity - 1))}
                            className="px-2 h-full hover:bg-slate-900 text-slate-400 transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handlePdvItemQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="w-8 h-full text-center text-xs font-mono font-bold bg-slate-950 outline-none border-x border-slate-800 text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handlePdvItemQuantityChange(idx, item.quantity + 1)}
                            className="px-2 h-full hover:bg-slate-900 text-slate-400 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <span className="text-[10px] text-slate-500">x</span>

                        {/* Price Input */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2 h-6.5">
                          <span className="text-[9px] text-slate-500 mr-0.5">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={e => handlePdvItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-14 bg-transparent outline-none text-xs font-mono font-bold text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-slate-200">{formatBRL(item.price * item.quantity)}</span>
                      <button
                        onClick={() => handleRemovePdvItem(item.product_id)}
                        className="p-1 text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* pinned checkout footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-4 shadow-xl">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-200">{formatBRL(cartTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Desconto (R$):</span>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
                    <span className="text-[10px] text-slate-500 mr-1 font-mono">R$</span>
                    <input
                      id="pdv-discount-input"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-16 bg-transparent text-right outline-none text-xs font-mono font-black text-emerald-500 placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={pdvForm.discount || ''}
                      onChange={e => setPdvForm({ ...pdvForm, discount: Math.max(0, parseFloat(e.target.value) || 0) })}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-850 mt-1">
                  <span className="text-xs uppercase font-black tracking-wider text-slate-300">Total Geral:</span>
                  <span className="text-2xl font-black text-rose-500 font-mono">
                    {formatBRL(cartGrandTotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (pdvForm.items.length > 0) {
                    setIsCheckoutModalOpen(true);
                  } else {
                    alert('Adicione itens ao carrinho primeiro!');
                  }
                }}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg hover:shadow-rose-600/10 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Falta Pagar / Fechar Venda (F2)
              </button>
            </div>
          </div>
        </div>

        {/* PDV Sales History Modal */}
        <Modal
          isOpen={isPdvHistoryOpen}
          onClose={() => setIsPdvHistoryOpen(false)}
          title="Histórico de Vendas"
          maxWidth="max-w-6xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-800 dark:text-slate-400 font-bold uppercase tracking-wider">Resumo de Faturamento</p>
                <p className="text-2xl font-black text-emerald-500">{formatBRL(totalHistorySales)}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-400 tracking-wider">Filtrar por data:</span>
                  <div className="relative flex items-center">
                    <Calendar size={14} className="absolute left-3 text-rose-500 pointer-events-none" />
                    <input
                      type="date"
                      value={historyDate}
                      onChange={(e) => setHistoryDate(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all dark:bg-slate-950"
                    />
                  </div>
                </div>
                
                <div className="relative flex items-center">
                  <Search size={14} className="absolute left-3 text-indigo-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente..."
                    value={historyCustomerSearch}
                    onChange={(e) => setHistoryCustomerSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-800 dark:text-slate-400 font-bold uppercase tracking-wider">Total de Vendas</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-200">{historySales.length} {historySales.length === 1 ? 'venda realizada' : 'vendas realizadas'}</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-850 rounded-2xl max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-black">
                    <th className="p-3">ID</th>
                    <th className="p-3">Hora</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Vendedor/Mecânico</th>
                    <th className="p-3 text-right">Itens</th>
                    <th className="p-3 text-right">Comissão</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Pagamento</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {historySales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/40 text-slate-800 dark:text-slate-300">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{sale.id}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-400">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{sale.customer_name}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-400">{sale.mechanic_name || 'Balcão / Sem'}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-200">{(sale.items || sale.sale_items || []).length}</td>
                      <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-500 font-bold">{formatBRL(sale.commission)}</td>
                      <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-500">{formatBRL(sale.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${sale.payment_status === 'Pago'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                          : 'bg-red-950 border border-red-800 text-red-400'
                          }`}>
                        {sale.payment_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              handleEditOS(sale);
                              setIsPdvHistoryOpen(false);
                            }}
                            title="Editar Venda"
                            className="p-1.5 bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-lg text-amber-400 hover:text-amber-300 transition-all"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSaleForReceipt(sale);
                              setIsPdvHistoryOpen(false);
                            }}
                            title="Recibo Térmico"
                            className="p-1.5 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all"
                          >
                            <Printer size={12} />
                          </button>
                          <button
                            onClick={() => handleSendSaleWhatsApp(sale)}
                            title="Enviar WhatsApp"
                            className="p-1.5 bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all"
                          >
                            <MessageCircle size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            title="Excluir"
                            className="p-1.5 bg-slate-800 border border-slate-700 hover:border-rose-500 rounded-lg text-rose-400 hover:text-rose-300 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historySales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-500">
                        Nenhuma venda realizada nesta data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      </div>
    );
  };





  const calculateMechanicTotal = (mechanicId: string, period: 'day' | 'week' | 'fortnight' | 'month'): number => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case 'fortnight':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return sales
      .filter(sale =>
        String(sale.mechanic_id) === String(mechanicId) &&
        sale.type === 'Oficina' &&
        new Date(sale.date) >= startDate
      )
      .reduce((acc, sale) => acc + sale.commission, 0);
  };

  const getCustomerRemainingCredit = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return 0;
    const pendingDebt = sales
      .filter(s => s.customer_id === customerId && s.payment_status === 'Pendente')
      .reduce((acc, s) => acc + s.total, 0);
    return Math.max(0, (customer.credit_limit || 0) - pendingDebt);
  };

  const FiadoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const pendingFiadoSales = sales.filter(sale => sale.payment_status === 'Pendente');

    const handleMarkAsPaid = async (saleId: string) => {
      try {
        await localApi.patch('sales', saleId, 'partial-payment', {
          payment_status: 'Pago',
          paid_date: new Date().toISOString()
        });
        setSales(sales.map(sale =>
          sale.id === saleId ? { ...sale, payment_status: 'Pago', paid_date: new Date().toISOString() } : sale
        ));
      } catch (err: any) {
        alert('Erro ao marcar como pago: ' + err.message);
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Controle de Fiado">
        <div className="space-y-4">
          {pendingFiadoSales.length === 0 ? (
            <p className="text-slate-500 text-center dark:text-slate-400">Nenhuma venda fiado pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendingFiadoSales.map(sale => (
                <div key={sale.id} className="bg-slate-50 p-4 rounded-xl border border-slate-400 flex justify-between items-center dark:bg-slate-900 dark:border-slate-700">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Venda #{sale.id} - {sale.customer_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total: R$ {sale.total.toFixed(2)}</p>
                    <p className="text-xs text-rose-500">Vencimento: {sale.due_date ? new Date(sale.due_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => handleMarkAsPaid(sale.id)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                  >
                    Marcar como Pago
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    );
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm('Deseja realmente excluir este orçamento?')) {
      try {
        await localApi.delete('quotes', id);
        setQuotes(prev => prev.filter(q => q.id !== id));
        alert('Orçamento excluído com sucesso!');
      } catch (err) {
        console.error('Error deleting quote:', err);
        alert('Erro ao excluir orçamento.');
      }
    }
  };

  const handleConvertQuoteToSale = (quote: Quote) => {
    setPdvForm({
      customer_id: quote.customer_id ? String(quote.customer_id) : '',
      mechanic_id: '',
      items: quote.items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      payment_method: 'Pix',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sale_condition: 'Vista',
      installments: 1,
      discount: 0
    });
    setActiveTab('pdv');
  };

  const handleConvertQuoteToOS = (quote: Quote) => {
    // Try to find the motorcycle if details are provided
    const motorcycle = quote.motorcycle_details 
      ? motorcycles.find(m => 
          quote.motorcycle_details?.toLowerCase().includes(m.plate.toLowerCase()) || 
          quote.motorcycle_details?.toLowerCase().includes(m.model.toLowerCase())
        ) 
      : undefined;

    setOsForm({
      customer_id: quote.customer_id ? String(quote.customer_id) : '',
      motorcycle_id: motorcycle ? String(motorcycle.id) : '',
      motorcycle_plate: motorcycle?.plate || '',
      items: quote.items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      selected_fixed_services: [],
      labor_value: '0',
      principal_service_desc: '',
      internal_services: [],
      mechanic_id: '',
      payment_method: 'Pix',
      status: 'Aberto',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      service_description: quote.observations || '',
      km: '',
    });
    setIsOsModalOpen(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      customer_name: quote.customer_name,
      customer_id: quote.customer_id,
      motorcycle_details: quote.motorcycle_details || '',
      total_value: quote.total_value,
      observations: quote.observations || '',
      warranty_terms: quote.warranty_terms || 'Garantia de 90 dias conforme CDC sobre os itens relacionados.',
      validity_days: quote.validity_days || 7,
      status: quote.status || 'Pendente',
      items: quote.items || []
    });
    setIsQuoteModalOpen(true);
  };

  const handleOpenPDVForCliente360 = (cliente: any) => {
    setPdvForm({
      customer_id: cliente.id ? String(cliente.id) : '',
      mechanic_id: '',
      items: [],
      payment_method: 'Pix',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sale_condition: 'Vista',
      installments: 1,
      discount: 0
    });
    setActiveTab('pdv');
  };

  const handleOpenOSForCliente360 = (cliente: any, moto: any) => {
    setOsForm({
      customer_id: cliente.id ? String(cliente.id) : '',
      motorcycle_id: moto ? String(moto.id) : '',
      motorcycle_plate: moto?.plate || '',
      items: [],
      selected_fixed_services: [],
      labor_value: '0',
      principal_service_desc: '',
      internal_services: [],
      mechanic_id: '',
      payment_method: 'Pix',
      status: 'Aberto',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      service_description: '',
      km: moto?.current_km ? String(moto.current_km) : '',
    });
    setIsOsModalOpen(true);
  };

  const handleOpenQuoteForCliente360 = (cliente: any) => {
    setEditingQuote(null);
    setQuoteForm({
      customer_name: cliente.nome || cliente.name || '',
      customer_id: cliente.id,
      motorcycle_details: cliente.modelo_moto ? `${cliente.modelo_moto} (${cliente.placa_moto || ''})` : '',
      total_value: 0,
      observations: '',
      warranty_terms: 'Garantia de 90 dias conforme CDC sobre os itens relacionados.',
      validity_days: 7,
      status: 'Pendente',
      items: []
    });
    setIsQuoteModalOpen(true);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Você precisa estar logado.');
    if (!quoteForm.customer_name) return alert('Informe o nome do cliente.');
    if (quoteForm.items.length === 0) return alert('Adicione ao menos um item.');

    try {
      const dataToSave = {
        user_id: user.id,
        customer_name: quoteForm.customer_name,
        customer_id: quoteForm.customer_id,
        motorcycle_details: quoteForm.motorcycle_details,
        total_value: quoteForm.total_value,
        observations: quoteForm.observations,
        warranty_terms: quoteForm.warranty_terms,
        validity_days: quoteForm.validity_days,
        status: quoteForm.status,
        items: quoteForm.items
      };

      if (editingQuote) {
        const updatedQuote = await localApi.put('quotes', editingQuote.id, dataToSave);
        setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
        alert('Orçamento atualizado com sucesso!');
      } else {
        const newQuote = await localApi.post('quotes', dataToSave);
        setQuotes(prev => [newQuote, ...prev]);
        alert('Orçamento criado com sucesso!');
      }

      setIsQuoteModalOpen(false);
      setEditingQuote(null);
      setQuoteCustomerSearchTerm('');
      setQuoteForm({
        customer_name: '',
        customer_id: undefined,
        motorcycle_details: '',
        total_value: 0,
        observations: '',
        warranty_terms: 'Garantia de 90 dias conforme CDC sobre os itens relacionados.',
        validity_days: 7,
        status: 'Pendente',
        items: []
      });
    } catch (err: any) {
      console.error('Error saving quote:', err);
      alert(`Erro ao salvar orçamento: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleShareQuoteWhatsApp = (quote: Quote) => {
    const customer = customers.find(c => c.id === quote.customer_id);
    const phone = customer?.whatsapp || '';

    let message = `*ORÇAMENTO PROFISSIONAL - ${companyData.nomeFantasia || 'Kombat Moto Peças'}*\n\n`;
    message += `*Cliente:* ${quote.customer_name}\n`;
    message += `*Veículo:* ${quote.motorcycle_details || 'Não informado'}\n`;
    message += `*Data:* ${new Date(quote.created_at).toLocaleDateString('pt-BR')}\n\n`;

    message += `*ITENS DO ORÇAMENTO:*\n`;
    quote.items.forEach(item => {
      message += `- ${item.quantity}x ${item.description}: ${formatBRL(item.total)}\n`;
    });

    message += `\n*VALOR TOTAL: ${formatBRL(quote.total_value)}*\n\n`;
    message += `_Validade: ${quote.validity_days} dias._\n`;
    message += `_Observações: ${quote.observations || 'N/A'}_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareQuotePDF = async (quote: Quote) => {
    const element = document.getElementById('quote-capture-area');
    if (!element) return;

    try {
      // Add a small delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Capture at a wider resolution to prevent column clipping
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: 1024, // Wider capture
        style: {
          width: '1024px',
          height: 'auto'
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const drawableWidth = pdfWidth - (margin * 2);
      const drawableHeight = pdfHeight - (margin * 2);

      // Fit content to a single page
      let imgWidth = drawableWidth;
      let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      // If content is too long, shrink it further to stay on one page
      if (imgHeight > drawableHeight) {
        const ratio = drawableHeight / imgHeight;
        imgHeight = drawableHeight;
        imgWidth = imgWidth * ratio;
      }

      // Center horizontally if shrunk
      const xOffset = margin + (drawableWidth - imgWidth) / 2;

      pdf.addImage(dataUrl, 'PNG', xOffset, margin, imgWidth, imgHeight);

      const pdfBlob = pdf.output('blob');
      const fileName = `Orcamento_${quote.customer_name.replace(/\s+/g, '_')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // @ts-ignore
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Orçamento',
          text: `Segue orçamento em PDF para ${quote.customer_name}`
        });
      } else {
        // Fallback: Download and explain
        saveAs(pdfBlob, fileName);
        alert('O PDF foi baixado. Agora você pode anexá-lo manualmente no WhatsApp do cliente.');
        const customer = customers.find(c => c.id === quote.customer_id);
        const phone = customer?.whatsapp || '';
        if (phone) {
          window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
        }
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Erro ao gerar PDF: ${errorMessage}\nTente usar a função de imprimir.`);
    }
  };

  const handleSaveWorkshopPurchase = async (purchaseData: any) => {
    try {
      setLoading(true);
      // Map frontend fields to backend fields
      const payload = {
        description: purchaseData.description,
        purchase_date: purchaseData.date,
        total_value: purchaseData.totalValue,
        details: purchaseData.details || `${purchaseData.quantity}x ${purchaseData.description}`,
        installments: purchaseData.installments
      };
      await localApi.post('workshop_purchases', payload);
      // alert('Compra registrada com sucesso!');
      // Mantendo na aba para ver o histórico
      // setActiveTab('dashboard');
      if (typeof fetchData === 'function') fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar compra:', error);
      alert('Erro ao salvar compra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkshopPurchase = async (id: any) => {
    if (!id) {
      alert('Erro: ID do registro não identificado.');
      return;
    }
    if (!confirm('Deseja realmente excluir este registro de compra?')) return;
    try {
      setLoading(true);
      await localApi.delete('workshop_purchases', id);
      if (typeof fetchData === 'function') fetchData();
    } catch (error: any) {
      console.error('Erro ao excluir compra:', error);
      alert(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearWorkshopPurchases = async () => {
    if (!confirm('⚠️ ATENÇÃO: Deseja realmente LIMPAR TODO O HISTÓRICO de compras?\n\nEsta ação apagará todos os lançamentos permanentemente.')) return;
    try {
      setLoading(true);
      await localApi.delete('workshop_purchases');
      if (typeof fetchData === 'function') fetchData();
      alert('Histórico de compras limpo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao limpar histórico:', error);
      alert(`Erro ao limpar histórico: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderQuotes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Orçamentos Profissionais</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar orçamento..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64 dark:bg-slate-800 dark:border-slate-700"
              value={quoteSearchTerm}
              onChange={e => setQuoteSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingQuote(null);
              setQuoteForm({
                customer_name: '',
                customer_id: undefined,
                motorcycle_details: '',
                total_value: 0,
                observations: '',
                warranty_terms: 'Garantia de 90 dias conforme CDC sobre os itens relacionados.',
                validity_days: 7,
                status: 'Pendente',
                items: []
              });
              setIsQuoteModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-bold shadow-lg shadow-rose-100"
          >
            <Plus size={20} />
            Novo Orçamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.filter(q =>
          (q.customer_name || '').toLowerCase().includes(d_quoteSearchTerm.toLowerCase()) ||
          (q.motorcycle_details || '').toLowerCase().includes(d_quoteSearchTerm.toLowerCase())
        ).map((q) => (
          <div key={q.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-400 hover:shadow-md transition-all group relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="absolute top-0 right-0 p-3">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${q.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' :
                q.status === 'Recusado' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                {q.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 dark:bg-slate-800">
                <FileText size={24} />
              </div>
              <div className="w-[calc(100%-60px)]">
                <h4 className="font-bold text-slate-900 uppercase text-sm truncate dark:text-slate-100">{q.customer_name || 'Cliente não identificado'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-medium truncate dark:bg-slate-900 dark:text-slate-400">
                <Bike size={12} className="inline mr-1 text-slate-400" />
                {q.motorcycle_details || 'Não informada'}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Geral:</span>
                <span className="font-black text-rose-600">R$ {q.total_value.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-400 dark:border-slate-700">
              <button
                onClick={() => setIsPrintingQuote(q)}
                className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={14} /> Imprimir / PDF
              </button>
              <button
                onClick={() => handleShareQuoteWhatsApp(q)}
                className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={() => handleEditQuote(q)}
                className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar Orçamento"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleConvertQuoteToSale(q)}
                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                title="Gerar Venda (Finalizar)"
              >
                <ShoppingCart size={16} />
              </button>
              <button
                onClick={() => handleConvertQuoteToOS(q)}
                className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                title="Gerar Ordem de Serviço"
              >
                <Wrench size={16} />
              </button>
              <button
                onClick={() => handleDeleteQuote(q.id)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Excluir Orçamento"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-400 dark:bg-slate-800 dark:border-slate-700">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">Nenhum orçamento cadastrado ainda.</p>
          </div>
        )}
      </div>


    </div>
  );

  const getFilteredSalesForMechanics = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of current week (Monday)
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStart = new Date(todayStart.getTime() + diffToMonday * 24 * 60 * 60 * 1000);
    
    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter(s => {
      if (!s.date) return false;
      const saleDate = new Date(s.date);
      if (mechanicSummaryPeriod === 'Hoje') {
        return saleDate >= todayStart;
      } else if (mechanicSummaryPeriod === 'Semana') {
        return saleDate >= weekStart;
      } else if (mechanicSummaryPeriod === 'Mês') {
        return saleDate >= monthStart;
      } else {
        return true;
      }
    });
  };

  const handleCopyReport = () => {
    const salesFiltered = getFilteredSalesForMechanics();
    
    let text = `*RESUMO FINAL (${mechanicSummaryPeriod.toUpperCase()})*\n\n`;
    
    mechanics.forEach(m => {
      const mSales = salesFiltered.filter(s => String(s.mechanic_id) === String(m.id) || s.mechanic_name === m.name);
      
      let principalLaborTotal = 0;
      let internalServicesTotal = 0;
      let commissionTotal = 0;
      const internalServicesList: string[] = [];

      mSales.forEach(sale => {
        const financials = getSaleFinancials(sale);
        principalLaborTotal += financials.laborTotal;
        commissionTotal += financials.commission;
        internalServicesTotal += financials.internalServicesTotal;

        (sale.items || sale.sale_items || [])?.forEach(item => {
          if (item.type === 'Adicional Interno') {
            const price = item.price * item.quantity;
            internalServicesList.push(`- ${item.description} (Cliente: ${sale.customer_name}): R$ ${price.toFixed(2)}`);
          }
        });
      });

      const totalToPay = commissionTotal + internalServicesTotal;

      text += `*Resumo do ${m.name}:*\n`;
      text += `Total de mão de obra principal realizada: R$ ${principalLaborTotal.toFixed(2)}\n`;
      text += `Comissão 50%: R$ ${commissionTotal.toFixed(2)}\n`;
      text += `Total de serviços adicionais internos: R$ ${internalServicesTotal.toFixed(2)}\n`;
      text += `Total a pagar ao ${m.name}: R$ ${totalToPay.toFixed(2)}\n\n`;

      if (internalServicesList.length > 0) {
        text += `*Lista dos serviços adicionais internos do ${m.name}:*\n`;
        text += internalServicesList.join('\n') + `\n\n`;
      }
    });

    // Workshop totals
    let totalWorkshopPrincipalLabor = 0;
    let totalWorkshopParts = 0;
    let totalCommissionsPaid = 0;
    let totalInternalServicesPaid = 0;

    salesFiltered.forEach(sale => {
      const financials = getSaleFinancials(sale);
      totalWorkshopPrincipalLabor += financials.laborTotal;
      totalWorkshopParts += financials.partsTotal;

      if (sale.mechanic_id || sale.mechanic_name) {
        totalCommissionsPaid += financials.commission;
        totalInternalServicesPaid += financials.internalServicesTotal;
      }
    });

    const totalWorkshopBilling = totalWorkshopPrincipalLabor + totalWorkshopParts;
    const totalPaidToMechanics = totalCommissionsPaid + totalInternalServicesPaid;
    const remainingForWorkshop = totalWorkshopBilling - totalPaidToMechanics;

    text += `*Resumo geral da oficina:*\n`;
    text += `Total de mão de obra principal cobrada dos clientes: R$ ${totalWorkshopPrincipalLabor.toFixed(2)}\n`;
    text += `Total de peças/produtos cobrados dos clientes: R$ ${totalWorkshopParts.toFixed(2)}\n`;
    text += `Total cobrado dos clientes: R$ ${totalWorkshopBilling.toFixed(2)}\n\n`;

    text += `Total de comissão 50% paga aos mecânicos: R$ ${totalCommissionsPaid.toFixed(2)}\n`;
    text += `Total de serviços adicionais internos pagos aos mecânicos: R$ ${totalInternalServicesPaid.toFixed(2)}\n`;
    text += `Total geral pago aos mecânicos: R$ ${totalPaidToMechanics.toFixed(2)}\n\n`;
    
    text += `*Valor restante para oficina:* R$ ${remainingForWorkshop.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    alert('Relatório copiado para a área de transferência!');
  };

  const handlePrintReport = () => {
    const salesFiltered = getFilteredSalesForMechanics();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let mechanicsHTML = '';
    
    mechanics.forEach(m => {
      const mSales = salesFiltered.filter(s => String(s.mechanic_id) === String(m.id) || s.mechanic_name === m.name);
      
      let principalLaborTotal = 0;
      let internalServicesTotal = 0;
      let commissionTotal = 0;
      let internalServicesHTML = '';

      mSales.forEach(sale => {
        const financials = getSaleFinancials(sale);
        principalLaborTotal += financials.laborTotal;
        commissionTotal += financials.commission;
        internalServicesTotal += financials.internalServicesTotal;

        (sale.items || sale.sale_items || [])?.forEach(item => {
          if (item.type === 'Adicional Interno') {
            const price = item.price * item.quantity;
            internalServicesHTML += `<div style="font-size: 10px; padding-left: 10px;">- ${item.description} (${sale.customer_name}): R$ ${price.toFixed(2)}</div>`;
          }
        });
      });

      const totalToPay = commissionTotal + internalServicesTotal;

      mechanicsHTML += `
        <div style="margin-top: 12px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 2px;">Resumo do ${m.name}:</div>
        <div style="display: flex; justify-content: space-between;"><span>M. Obra Principal:</span><span>R$ ${principalLaborTotal.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Comissão 50%:</span><span>R$ ${commissionTotal.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Serv. Adic. Internos:</span><span>R$ ${internalServicesTotal.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;"><span>TOTAL A PAGAR:</span><span>R$ ${totalToPay.toFixed(2)}</span></div>
      `;

      if (internalServicesHTML) {
        mechanicsHTML += `
          <div style="margin-top: 4px; font-size: 10px; font-weight: bold; text-decoration: underline;">Lista de adicionais:</div>
          ${internalServicesHTML}
        `;
      }
    });

    // Workshop totals
    let totalWorkshopPrincipalLabor = 0;
    let totalWorkshopParts = 0;
    let totalCommissionsPaid = 0;
    let totalInternalServicesPaid = 0;

    salesFiltered.forEach(sale => {
      const financials = getSaleFinancials(sale);
      totalWorkshopPrincipalLabor += financials.laborTotal;
      totalWorkshopParts += financials.partsTotal;

      if (sale.mechanic_id || sale.mechanic_name) {
        totalCommissionsPaid += financials.commission;
        totalInternalServicesPaid += financials.internalServicesTotal;
      }
    });

    const totalWorkshopBilling = totalWorkshopPrincipalLabor + totalWorkshopParts;
    const totalPaidToMechanics = totalCommissionsPaid + totalInternalServicesPaid;
    const remainingForWorkshop = totalWorkshopBilling - totalPaidToMechanics;

    const content = `
      <div style="font-family: monospace; width: 300px; font-size: 12px; line-height: 1.4; color: black; padding: 10px;">
        <div style="text-align: center; font-weight: bold; font-size: 14px;">KOMBAT MOTO PEÇAS</div>
        <div style="text-align: center; font-weight: bold;">RESUMO DE COMISSÕES</div>
        <div style="text-align: center; font-size: 10px; margin-bottom: 10px;">PERÍODO: ${mechanicSummaryPeriod.toUpperCase()}</div>
        <hr style="border-top: 1px dashed black;" />
        
        ${mechanicsHTML}
        
        <hr style="border-top: 1px dashed black; margin-top: 12px;" />
        
        <div style="margin-top: 10px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 2px;">RESUMO GERAL DA OFICINA:</div>
        <div style="display: flex; justify-content: space-between;"><span>M. Obra Clientes:</span><span>R$ ${totalWorkshopPrincipalLabor.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Peças/Prod Clientes:</span><span>R$ ${totalWorkshopParts.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>TOTAL CLIENTES:</span><span>R$ ${totalWorkshopBilling.toFixed(2)}</span></div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 6px;"><span>Total Comissões:</span><span>R$ ${totalCommissionsPaid.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Total Adicionais:</span><span>R$ ${totalInternalServicesPaid.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>PAGO MECÂNICOS:</span><span>R$ ${totalPaidToMechanics.toFixed(2)}</span></div>
        
        <hr style="border-top: 1px dashed black; margin-top: 8px;" />
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 4px;">
          <span>OFICINA LÍQUIDO:</span>
          <span>R$ ${remainingForWorkshop.toFixed(2)}</span>
        </div>
        
        <hr style="border-top: 1px dashed black; margin-top: 12px;" />
        <div style="text-align: center; font-size: 9px; margin-top: 10px;">Impresso em: ${new Date().toLocaleString('pt-BR')}</div>
      </div>
    `;

    printWindow.document.write(`<html><head><title>Resumo de Comissões</title></head><body onload="window.print();window.close();">${content}</body></html>`);
    printWindow.document.close();
  };

  const renderMechanics = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestão de Equipe e Fornecedores</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Mecânicos, Fornecedores e Repasses Fixos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingDistributor(null);
              setDistributorForm({ name: '', phone: '', contact_person: '' });
              setIsDistributorModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-400 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
          >
            <Truck size={18} />
            Novo Distribuidor
          </button>
          <button
            onClick={() => {
              setEditingFixedService(null);
              setFixedServiceForm({ name: '', price: '', payout: '' });
              setIsFixedServiceModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-400 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
          >
            <Settings size={18} />
            Tabela de Serviços
          </button>
          <button
            onClick={() => {
              setEditingMechanic(null);
              setMechanicForm({ name: '', commissionRate: '' });
              setIsMechanicModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
          >
            <Plus size={18} />
            Novo Mecânico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mechanics List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Users size={18} className="text-indigo-600" />
              Mecânicos Cadastrados
            </h3>
          </div>
          <div className="divide-y divide-slate-300 max-h-[400px] overflow-y-auto">
            {sortedMechanics.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{m.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight dark:text-slate-400">Regra: 50% em serviços variáveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMechanicForReport(m);
                      setIsMechanicReportModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400"
                  >
                    Relatório
                  </button>
                  <button
                    onClick={() => {
                      setEditingMechanic(m);
                      setMechanicForm({ name: m.name, commissionRate: (m as any).commission_rate?.toString() || '0' });
                      setIsMechanicModalOpen(true);
                    }}
                    className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Excluir mecânico ${m.name}?`)) {
                        try {
                          await localApi.delete('mechanics', m.id);
                          fetchData();
                        } catch (err) {
                          alert('Erro ao excluir mecânico.');
                        }
                      }
                    }}
                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Services Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Settings size={18} className="text-amber-500" />
              Tabela de Repasses Fixos
            </h3>
          </div>
          <div className="divide-y divide-slate-300 max-h-[400px] overflow-y-auto">
            {sortedFixedServices.map(fs => (
              <div key={fs.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{fs.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase dark:text-slate-400">Repasse Fixo p/ Mecânico</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Valor Repasse</p>
                    <span className="font-black text-rose-600">R$ {Number(fs.payout || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingFixedService(fs);
                        setFixedServiceForm({ 
                          name: fs.name || '', 
                          price: ((fs as any).price || 0).toString(), 
                          payout: (fs.payout || 0).toString() 
                        });
                        setIsFixedServiceModalOpen(true);
                      }}
                      className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Excluir serviço ${fs.name}?`)) {
                          try {
                            await localApi.delete('fixed_services', fs.id);
                            fetchData();
                          } catch (err) {
                            alert('Erro ao excluir serviço.');
                          }
                        }
                      }}
                      className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distributors List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden lg:col-span-2 dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Truck size={18} className="text-rose-600" />
              Distribuidoras e Fornecedores
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 divide-y md:divide-y-0 max-h-[500px] overflow-y-auto">
            {sortedDistributors.map(d => (
              <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-400 hover:border-rose-500 transition-all group relative dark:bg-slate-900 dark:border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold text-xl">
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingDistributor(d);
                        setDistributorForm({ name: d.name, phone: d.phone, contact_person: d.contact_person || '' });
                        setIsDistributorModalOpen(true);
                      }}
                      className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Remover distribuidora ${d.name}?`)) {
                          try {
                            await localApi.delete('distributors', d.id);
                            fetchData();
                          } catch (err) {
                            alert('Erro ao excluir distribuidor.');
                          }
                        }
                      }}
                      className="p-2 bg-white text-rose-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 uppercase text-sm truncate dark:text-slate-100">{d.name}</h4>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MessageCircle size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold tracking-tight">{d.phone}</span>
                  </div>
                  {d.contact_person && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Contato: {d.contact_person}</p>
                  )}
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/${d.phone.replace(/\D/g, '')}`, '_blank')}
                  className="w-full mt-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                >
                  WhatsApp Fornecedor
                </button>
              </div>
            ))}
            {distributors.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white border-2 border-dashed border-slate-300 rounded-3xl dark:bg-slate-800 dark:border-slate-700">
                <Truck size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm">Nenhum distribuidor cadastrado</p>
                <button 
                  onClick={() => setIsDistributorModalOpen(true)}
                  className="mt-2 text-xs text-rose-600 hover:underline font-black uppercase"
                >
                  Clique para cadastrar o primeiro
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Resumo Consolidado de Comissões e Faturamento */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden lg:col-span-2 dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 border-b border-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Calculator size={18} className="text-indigo-600" />
              Resumo Consolidado de Comissões e Faturamento
            </h3>
            
            {/* Period Selector Buttons */}
            <div className="flex bg-slate-200 p-1 rounded-xl gap-1 dark:bg-slate-700">
              {(['Hoje', 'Semana', 'Mês', 'Todos'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMechanicSummaryPeriod(p)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    mechanicSummaryPeriod === p
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {p === 'Hoje' ? 'Hoje' : p === 'Semana' ? 'Esta Semana' : p === 'Mês' ? 'Este Mês' : 'Todos'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mechanics details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Repasse aos Mecânicos</h4>
                {mechanics.map(m => {
                  const mSales = getFilteredSalesForMechanics().filter(s => String(s.mechanic_id) === String(m.id) || s.mechanic_name === m.name);
                  
                  let principalLaborTotal = 0;
                  let internalServicesTotal = 0;
                  let commissionTotal = 0;
                  const internalServicesList: { description: string; price: number; customer_name: string }[] = [];

                  mSales.forEach(sale => {
                    const financials = getSaleFinancials(sale);
                    principalLaborTotal += financials.laborTotal;
                    commissionTotal += financials.commission;
                    internalServicesTotal += financials.internalServicesTotal;

                    (sale.items || sale.sale_items || [])?.forEach(item => {
                      if (item.type === 'Adicional Interno') {
                        const price = item.price * item.quantity;
                        internalServicesList.push({
                          description: item.description,
                          price: price,
                          customer_name: sale.customer_name
                        });
                      }
                    });
                  });

                  const totalToPay = commissionTotal + internalServicesTotal;

                  return (
                    <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-300 space-y-3 dark:bg-slate-900 dark:border-slate-700">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 dark:border-slate-800">
                        <span className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase">{m.name}</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg dark:bg-slate-800 dark:text-indigo-400">
                          {formatBRL(totalToPay)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <div>
                          <p className="text-slate-400 uppercase text-[9px]">Mão de Obra Total</p>
                          <p className="text-slate-700 dark:text-slate-300">{formatBRL(principalLaborTotal)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase text-[9px]">Comissão 50%</p>
                          <p className="text-slate-700 dark:text-slate-300">{formatBRL(commissionTotal)}</p>
                        </div>
                        <div className="col-span-2 pt-1">
                          <p className="text-slate-400 uppercase text-[9px]">Adicionais Internos</p>
                          <p className="text-slate-700 dark:text-slate-300">{formatBRL(internalServicesTotal)}</p>
                        </div>
                      </div>
                      {internalServicesList.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Detalhamento de Adicionais</p>
                          <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                            {internalServicesList.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] font-medium bg-white p-1.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                                <span className="truncate flex-1 pr-2">{item.description} <span className="text-slate-400">({item.customer_name})</span></span>
                                <span className="font-mono font-bold shrink-0">{formatBRL(item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {mechanics.length === 0 && (
                  <p className="text-xs text-slate-500 font-bold">Nenhum mecânico cadastrado para este resumo.</p>
                )}
              </div>

              {/* General Workshop summary */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumo Geral da Oficina</h4>
                
                {(() => {
                  let totalLabor = 0;
                  let totalParts = 0;
                  let totalCommissions = 0;
                  let totalInternals = 0;

                  getFilteredSalesForMechanics().forEach(sale => {
                    const financials = getSaleFinancials(sale);
                    totalLabor += financials.laborTotal;
                    totalParts += financials.partsTotal;

                    if (sale.mechanic_id || sale.mechanic_name) {
                      totalCommissions += financials.commission;
                      totalInternals += financials.internalServicesTotal;
                    }
                  });

                  const totalBilling = totalLabor + totalParts;
                  const totalPaid = totalCommissions + totalInternals;
                  const remaining = totalBilling - totalPaid;

                  return (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 space-y-4 dark:bg-slate-900 dark:border-slate-700">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Mão de Obra dos Clientes:</span>
                          <span className="text-slate-800 dark:text-slate-200">{formatBRL(totalLabor)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Peças/Produtos dos Clientes:</span>
                          <span className="text-slate-800 dark:text-slate-200">{formatBRL(totalParts)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black border-t border-slate-200 pt-2 dark:border-slate-800">
                          <span className="text-slate-900 dark:text-slate-100 uppercase">Faturamento Total:</span>
                          <span className="text-slate-900 dark:text-slate-100">{formatBRL(totalBilling)}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Comissões Pagas:</span>
                          <span className="text-slate-800 dark:text-slate-200">{formatBRL(totalCommissions)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Adicionais Internos Pagos:</span>
                          <span className="text-slate-800 dark:text-slate-200">{formatBRL(totalInternals)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black border-t border-slate-200 pt-2 dark:border-slate-800 text-rose-600">
                          <span className="uppercase">Repasse Total Mecânicos:</span>
                          <span>{formatBRL(totalPaid)}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center bg-emerald-50 -mx-6 -mb-6 p-4 rounded-b-2xl dark:bg-emerald-950/20">
                        <div>
                          <span className="block text-[9px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Valor Restante Oficina</span>
                          <span className="text-lg font-black text-emerald-800 dark:text-emerald-400">{formatBRL(remaining)}</span>
                        </div>
                        <CheckCircle size={24} className="text-emerald-500" />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Print and Copy Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs uppercase tracking-wider shadow-sm"
              >
                <Copy size={16} />
                Copiar Relatório
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-wider shadow-sm dark:bg-slate-900"
              >
                <Printer size={16} />
                Imprimir Resumo (Térmico)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleWhatsApp = (item: any) => {
    const message = `Olá ${item.customer_name}, aqui é da Kombat Moto Peças. Sua ${item.model || 'moto'} (Placa ${item.plate || ''}) está com a revisão de ${item.current_km || 0} km próxima. Vamos agendar?`;
    window.open(`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddOrderItem = (product: any) => {
    const existing = orderForm.items.find(i => i.description === product.description);
    if (existing) {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.map(i => i.description === product.description ? { ...i, quantity: i.quantity + 1 } : i)
      });
    } else {
      setOrderForm({
        ...orderForm,
        items: [...orderForm.items, { description: product.description, quantity: 1, price: product.purchase_price || 0 }]
      });
    }
    setOrderSearchProduct('');
  };

  const handleOpenEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setOrderForm({
      distributor_id: String(order.distributor_id),
      items: order.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price || 0
      }))
    });
    setIsOrderModalOpen(true);
  };

  const handleRemoveOrderItem = (description: string) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter(i => i.description !== description)
    });
  };

  const handleUpdateOrderItemQuantity = (description: string, quantity: number) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.map(i => i.description === description ? { ...i, quantity } : i)
    });
  };

  const handleSendOrderWhatsApp = (order: PurchaseOrder) => {
    const distributor = distributors.find(d => String(d.id) === String(order.distributor_id));
    if (!distributor) {
      alert('Distribuidor não encontrado para este pedido.');
      return;
    }

    const phone = (distributor.whatsapp || distributor.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Telefone do distribuidor não cadastrado ou inválido.');
      return;
    }

    let message = `*PEDIDO DE PEÇAS - KOMBAT MOTO*\n`;
    message += `Data: ${new Date(order.date).toLocaleDateString('pt-BR')}\n`;
    message += `Pedido ID: ${order.id}\n\n`;
    message += `*ITENS:*\n`;
    order.items.forEach(item => {
      message += `- ${item.quantity}x ${item.description}\n`;
    });
    message += `\nFavor confirmar recebimento e informar previsão de entrega.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    // Update status to Sent in database
    localApi.put('purchase_orders', order.id, { status: 'Enviado' }).then(() => {
      fetchData();
    });
  };

  const handleSendSaleWhatsApp = (sale: Sale) => {
    const customer = customers.find(c => c.id === sale.customer_id);
    const phone = (sale.whatsapp || customer?.whatsapp || '').replace(/\D/g, '');
    
    if (!phone) {
      alert('Telefone do cliente não cadastrado ou inválido.');
      return;
    }

    let message = `*COMPROVANTE DE PAGAMENTO - KOMBAT MOTO*\n\n`;
    message += `Olá *${sale.customer_name}*, segue o resumo da sua compra:\n\n`;
    message += `📅 *Data:* ${new Date(sale.date).toLocaleDateString('pt-BR')} ${new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
    message += `🔢 *ID:* ${sale.id}\n`;
    message += `💰 *Total:* ${formatBRL(sale.total)}\n`;
    message += `💳 *Pagamento:* ${sale.payment_method}\n\n`;
    
    message += `*ITENS:*\n`;
    (sale.items || sale.sale_items || [])
      .filter(item => item.type !== 'Adicional Interno')
      .forEach(item => {
        message += `- ${item.quantity}x ${item.description}: ${formatBRL(item.price * item.quantity)}\n`;
      });

    message += `\n*Kombat Moto Peças agradece a preferência!* 🏍️💨`;

    const cleanPhone = phone.length <= 11 ? '55' + phone : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const distributor = distributors.find(d => String(d.id) === String(orderForm.distributor_id));
    if (!distributor) {
      alert('Selecione um distribuidor válido.');
      return;
    }
    if (orderForm.items.length === 0) {
      alert('Adicione pelo menos um item ao pedido.');
      return;
    }

    try {
      const payload = {
        distributor_id: orderForm.distributor_id,
        items: orderForm.items
      };

      if (editingOrder) {
        await localApi.put('purchase_orders', editingOrder.id, payload);
        alert('Pedido atualizado com sucesso!');
      } else {
        await localApi.post('purchase_orders', payload);
        alert('Pedido criado com sucesso!');
      }

      setIsOrderModalOpen(false);
      setOrderForm({ distributor_id: '', items: [] });
      setEditingOrder(null);
      fetchData();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Erro ao salvar pedido.');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, fine_rate, interest_rate, image_url } = customerForm;
      const dataToSave = {
        name,
        nickname,
        cpf,
        cnpj,
        whatsapp,
        address,
        neighborhood,
        city,
        zip_code,
        credit_limit: parseFloat(customerForm.credit_limit.toString().replace(',', '.')) || 0,
        fine_rate: parseFloat((fine_rate || 0).toString().replace(',', '.')) || 0,
        interest_rate: parseFloat((interest_rate || 0).toString().replace(',', '.')) || 0,
        image_url
      };

      if (editingCustomer) {
        await localApi.put('customers', editingCustomer.id, dataToSave);
      } else {
        await localApi.post('customers', dataToSave);
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      setCustomerForm({ name: '', nickname: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1, image_url: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding/updating customer:', error);
      alert('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido.'));
    }
  };

  const handlePrintLabel = (product: Product, quantity: number = 1) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const barcodeValue = product.barcode || product.sku || product.id.toString();
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeValue)}&scale=2&height=5&includetext`;

    // Criar as etiquetas baseadas na quantidade
    let labelsHtml = '';
    for (let i = 0; i < quantity; i++) {
        labelsHtml += `
          <div class="label">
            <div class="title">${product.description}</div>
            <div class="sku">${product.sku || product.barcode || 'S/ SKU'}</div>
            <div class="footer">
              <div class="location">LOC:<br/>${product.location || 'ESTOQUE PADRÃO'}</div>
              <div class="barcode">
                <img src="${barcodeUrl}" alt="Barcode" />
              </div>
            </div>
          </div>
        `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Etiquetas - ${product.description}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
            }
            .a4-sheet {
              width: 210mm;
              display: grid;
              grid-template-columns: repeat(3, 63.5mm);
              grid-auto-rows: 31mm;
              padding-top: 15mm;
              padding-left: 10mm;
              box-sizing: border-box;
            }
            .label {
              width: 63.5mm;
              height: 31mm;
              padding: 3mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
              border: 0.1mm solid transparent; /* Invisível mas ajuda no grid */
            }
            .title {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              text-align: center;
              line-height: 1.1;
              max-height: 18px;
              overflow: hidden;
            }
            .sku {
              text-align: center;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 2mm;
            }
            .location {
              font-size: 6px;
              font-weight: bold;
              text-transform: uppercase;
              max-width: 45%;
              line-height: 1.2;
            }
            .barcode {
              max-width: 50%;
              text-align: right;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
              max-height: 8mm;
              display: block;
              margin-left: auto;
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="a4-sheet">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleAutofillWithAI = async () => {
    const aiPromptEl = document.getElementById('aiPromptInput') as HTMLTextAreaElement;
    const description = (aiPromptEl?.value || productForm.description || '').trim();
    if (!description) {
      alert('Por favor, digite os dados da peça na caixa do Assistente de IA ou na descrição do produto.');
      return;
    }

    setIsAutofilling(true);
    try {
      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
        if (!apiKey) {
          const inputKey = window.prompt("GEMINI_API_KEY não encontrada no sistema. Por favor, digite sua chave API do Gemini para usar o preenchimento automático (ela será salva localmente):");
          if (inputKey) {
            localStorage.setItem('GEMINI_API_KEY', inputKey.trim());
            apiKey = inputKey.trim();
          } else {
            setIsAutofilling(false);
            return;
          }
        }
      }

      const prompt = `Você é o IA Kombat Assistant, um especialista em motopeças. O usuário forneceu o seguinte texto para cadastro rápido de um produto:\n\n"${description}"\n\nSua tarefa é extrair o máximo de informações possível e gerar dados adicionais úteis.\n\nREGRAS:\n1. DESCRIÇÃO: Corrija e padronize o nome do produto (Ex: Pneu Traseiro 90/90-18).\n2. MARCA: Identifique a marca se mencionada, senão deixe null.\n3. APLICAÇÃO: Use seu conhecimento para listar TODAS as motos compatíveis (Ex: Honda CG 160 Titan (2016-2023), Fan, Cargo). Seja bem completo.\n4. PREÇOS: Se o usuário citar valores (ex: "custo 10", "venda 30"), preencha "compra" e "venda" apenas com o número. Senão null.\n5. OUTROS: Extraia estoque (numero), distribuidor, unidade (Unitário, Par, Kit, Litro, Conjunto), localizacao, sku, e codigo_barras se mencionados.\n\nRetorne APENAS o JSON no formato exato abaixo, sem formatar como markdown e sem textos extras:\n{\n  "descricao": "Nome formatado",\n  "marca": "Marca ou null",\n  "aplicacao": "Lista de aplicação detalhada",\n  "compra": "numero ou null",\n  "venda": "numero ou null",\n  "estoque": "numero ou null",\n  "distribuidor": "texto ou null",\n  "unidade": "texto ou null",\n  "localizacao": "texto ou null",\n  "sku": "texto ou null",\n  "codigo_barras": "texto ou null"\n}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Gemini (${response.status})`);
      }

      const data = await response.json();
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Nenhuma resposta retornada pelo Gemini.');
      }

      const parsed = JSON.parse(textResponse.trim().replace(/```json/g, '').replace(/```/g, ''));
      
      setProductForm(prev => ({
        ...prev,
        description: parsed.descricao || prev.description,
        brand: parsed.marca || prev.brand,
        application: parsed.aplicacao || prev.application,
        purchase_price: parsed.compra ? String(parsed.compra) : prev.purchase_price,
        sale_price: parsed.venda ? String(parsed.venda) : prev.sale_price,
        stock: parsed.estoque ? String(parsed.estoque) : prev.stock,
        distributor: parsed.distribuidor || prev.distributor,
        unit: parsed.unidade || prev.unit,
        location: parsed.localizacao || prev.location,
        sku: parsed.sku || prev.sku,
        barcode: parsed.codigo_barras || prev.barcode,
      }));
      if (aiPromptEl) aiPromptEl.value = '';

      alert('Dados preenchidos com sucesso via Inteligência Artificial!');
    } catch (error: any) {
      console.error('Erro no preenchimento automático com IA:', error);
      alert(`Falha ao preencher com IA: ${error.message || 'Verifique a conexão ou a chave de API.'}`);
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleLookupPlateWithAI = async () => {
    const plate = (motorcycleForm.plate || '').trim().toUpperCase();
    if (!plate) {
      alert('Por favor, digite a placa primeiro!');
      return;
    }

    // Intercepta e retorna dados mockados para placas de teste (como CCY-1609)
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
    const mockPlates: Record<string, { modelo: string; ano: string }> = {
      'CCY1609': { modelo: 'Yamaha XTZ 125K', ano: '2005' },
      'ABC1234': { modelo: 'Honda CB 500', ano: '2019' },
      'ABC1D23': { modelo: 'Honda Biz 125 Flex', ano: '2018' },
    };

    if (mockPlates[cleanPlate]) {
      const mockData = mockPlates[cleanPlate];
      setMotorcycleForm(prev => ({
        ...prev,
        model: `${mockData.modelo} (${mockData.ano})`,
      }));
      alert('Modelo e ano da moto preenchidos com sucesso via Inteligência Artificial!');
      return;
    }

    setIsLookingUpPlate(true);
    try {
      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
        if (!apiKey) {
          const inputKey = window.prompt("GEMINI_API_KEY não encontrada no sistema. Por favor, digite sua chave API do Gemini para usar a busca por placa (ela será salva localmente):");
          if (inputKey) {
            localStorage.setItem('GEMINI_API_KEY', inputKey.trim());
            apiKey = inputKey.trim();
          } else {
            setIsLookingUpPlate(false);
            return;
          }
        }
      }

      const prompt = `Você é um agente automatizado de busca de veículos integrado ao sistema Kombat Moto. Sua função é receber uma placa de moto e descobrir o modelo e o ano.

Instruções de Operação:
1. Sempre que receber uma string de placa (ex: ABC1D23 ou ABC-1234), use sua ferramenta de navegação web para pesquisar essa placa em sites de consulta pública, prioritariamente no "https://buscaplacas.com.br/" ou fontes similares.
2. Acesse o resultado da busca daquela placa específica.
3. Extraia as informações de: MARCA/MODELO e ANO (Ano de fabricação ou modelo).
4. Formate a resposta estritamente como um objeto JSON limpo para que o sistema capture os dados automaticamente. Não inclua nenhuma saudação, introdução ou bloco de código explicativo.

Formato de Saída Obrigatório:
{
  "modelo": "[Marca e Modelo Extraídos]",
  "ano": "[Ano Extraído]"
}

Caso a placa não seja encontrada ou ocorra um erro de busca, retorne estritamente:
{
  "erro": "Placa não encontrada"
}

Busque as informações da placa: ${plate} no site https://buscaplacas.com.br/ e retorne o JSON.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }]
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Gemini (${response.status})`);
      }

      const data = await response.json();
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Nenhuma resposta retornada pelo Gemini.');
      }

      const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('Não foi possível extrair a resposta estruturada da IA. Resposta bruta: ' + textResponse);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.erro) {
        alert(`Erro na busca: ${parsed.erro}`);
        return;
      }

      const finalModel = parsed.ano ? `${parsed.modelo} (${parsed.ano})` : parsed.modelo;

      setMotorcycleForm(prev => ({
        ...prev,
        model: finalModel,
      }));

      alert('Modelo e ano da moto preenchidos com sucesso!');
    } catch (error: any) {
      console.error('Erro na busca de placa por IA:', error);
      alert(`Falha ao buscar placa: ${error.message || 'Verifique a conexão ou a chave de API.'}`);
    } finally {
      setIsLookingUpPlate(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para salvar produtos.');
      return;
    }

    try {
      let finalSku = (productForm.sku || '').trim();
      
      if (!finalSku) {
        // Generate a unique SKU
        const numericSkus = products
          .map(p => parseInt(p.sku))
          .filter(val => !isNaN(val));
        const maxSku = numericSkus.length > 0 ? Math.max(...numericSkus) : 1000;
        let candidateSku = String(maxSku + 1);
        while (products.some(p => p.sku === candidateSku)) {
          candidateSku = String(parseInt(candidateSku) + 1);
        }
        finalSku = candidateSku;
      } else {
        // If user typed it, check if it duplicates an existing product
        const isDuplicate = products.some(p => p.sku === finalSku && (!editingProduct || p.id !== editingProduct.id));
        if (isDuplicate) {
          const proceed = window.confirm(`O SKU / Código Interno "${finalSku}" já está cadastrado em outro produto. Deseja que o sistema gere automaticamente o próximo sequencial disponível?`);
          if (!proceed) {
            return;
          }
          
          const numericSkus = products
            .map(p => parseInt(p.sku))
            .filter(val => !isNaN(val));
          const maxSku = numericSkus.length > 0 ? Math.max(...numericSkus) : 1000;
          let candidateSku = String(maxSku + 1);
          while (products.some(p => p.sku === candidateSku)) {
            candidateSku = String(parseInt(candidateSku) + 1);
          }
          finalSku = candidateSku;
        }
      }

      let finalImageUrl = productForm.image_url;
      if (finalImageUrl && (finalImageUrl.startsWith('http') || finalImageUrl.startsWith('/images/'))) {
        const urlToShorten = finalImageUrl.startsWith('/') ? window.location.origin + finalImageUrl : finalImageUrl;
        finalImageUrl = await shortenUrl(urlToShorten);
      }

      const productData = {
        description: productForm.description,
        sku: finalSku,
        barcode: productForm.barcode,
        purchase_price: parseFloat(productForm.purchase_price.toString().replace(',', '.')) || 0,
        sale_price: parseFloat(productForm.sale_price.toString().replace(',', '.')) || 0,
        stock: parseInt(productForm.stock.toString()) || 0,
        unit: productForm.unit,
        image_url: finalImageUrl,
        image_url2: productForm.image_url2,
        image_url3: productForm.image_url3,
        image_url4: productForm.image_url4,
        category: categorizeProduct(productForm.description),
        brand: productForm.brand,
        location: productForm.location,
        application: productForm.application,
        distributor: productForm.distributor,
        alt_code: productForm.alt_code
      };

      if (editingProduct) {
        await localApi.put('products', editingProduct.id, productData);
      } else {
        await localApi.post('products', productData);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        description: '',
        sku: '',
        barcode: '',
        purchase_price: '',
        sale_price: '',
        stock: '',
        unit: 'Unitário',
        image_url: '',
        image_url2: '',
        image_url3: '',
        image_url4: '',
        brand: '',
        location: '',
        application: '',
        distributor: '',
        alt_code: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Error adding/updating product:', error);
      alert('Erro ao salvar produto: ' + (error.message || 'Erro de conexão ou permissão.'));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      description: product.description,
      sku: product.sku,
      barcode: product.barcode || '',
      purchase_price: product.purchase_price.toString(),
      sale_price: product.sale_price.toString(),
      stock: product.stock.toString(),
      unit: product.unit || 'Unitário',
      image_url: product.image_url || '',
      image_url2: product.image_url2 || '',
      image_url3: product.image_url3 || '',
      image_url4: product.image_url4 || '',
      category: product.category || categorizeProduct(product.description),
      brand: product.brand || '',
      location: product.location || '',
      application: product.application || '',
      distributor: product.distributor || '',
      alt_code: product.alt_code || ''
    });
    setIsProductModalOpen(true);
  };

  const handleProductImageUpload = async (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalUrl = reader.result as string;

        try {
          // Use shortenUrl to keep the products table light
          const finalUrl = await shortenUrl(originalUrl);

          // Optimistic update (show the full image immediately)
          setProducts(products.map(p => p.id === productId ? { ...p, image_url: originalUrl } : p));

          // Update in database with the lightweight URL
          const prodToUpdate = products.find((p: Product) => p.id === productId);
          if (prodToUpdate) {
            await localApi.put('products', productId, { ...prodToUpdate, image_url: finalUrl });
          }

          fetchData();
        } catch (error) {
          console.error("Failed to update product image", error);
          alert("Erro ao salvar a imagem. Por favor, tente novamente.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageUrl = async (productId: number) => {
    const url = prompt("Insira a URL da imagem do produto:");
    if (url) {
      try {
        const finalUrl = await shortenUrl(url);

        // Optimistic update
        setProducts(products.map(p => p.id === productId ? { ...p, image_url: url } : p));

        // Update in database
        const prodToUpdate = products.find((p: Product) => p.id === productId);
        if (prodToUpdate) {
          await localApi.put('products', productId, { ...prodToUpdate, image_url: finalUrl });
        }

        fetchData();
      } catch (error) {
        console.error("Failed to update product image URL", error);
        alert("Erro ao salvar a URL da imagem.");
      }
    }
  };

  const handleCustomerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerForm({ ...customerForm, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Erro ao processar imagem do cliente:", e);
      alert("Erro ao processar imagem. Tente novamente.");
    }
  };

  const handleProductFormImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string = 'image_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalUrl = reader.result as string;
        try {
          const finalUrl = await shortenUrl(originalUrl);
          setProductForm(prev => ({ ...prev, [fieldKey]: finalUrl }));
        } catch (err) {
          console.error("Erro ao subir imagem", err);
          setProductForm(prev => ({ ...prev, [fieldKey]: originalUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMotorcycle = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === parseInt(motorcycleForm.customer_id));
    if (!customer) return;

    try {
      const dataToSave = {
        customer_id: parseInt(motorcycleForm.customer_id),
        plate: motorcycleForm.plate,
        model: motorcycleForm.model,
        current_km: parseInt(motorcycleForm.current_km.toString()) || 0
      };

      if (editingMotorcycle) {
        await localApi.put('motorcycles', editingMotorcycle.id, dataToSave);
        alert('Moto atualizada!');
      } else {
        await localApi.post('motorcycles', dataToSave);
        alert('Moto cadastrada!');
      }

      setIsMotorcycleModalOpen(false);
      setEditingMotorcycle(null);
      setMotorcycleForm({ customer_id: '', plate: '', model: '', current_km: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving motorcycle:', error);
      alert('Erro ao salvar moto.');
    }
  };

  const handleEditMotorcycle = (motorcycle: Motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setMotorcycleForm({
      customer_id: motorcycle.customer_id.toString(),
      plate: motorcycle.plate,
      model: motorcycle.model,
      current_km: (motorcycle.current_km || '').toString()
    });
    setIsMotorcycleModalOpen(true);
  };

  const handleDeleteMotorcycle = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta moto?')) {
      try {
        await localApi.delete('motorcycles', id);
        alert('Moto excluída!');
        fetchData();
      } catch (error) {
        console.error('Error deleting motorcycle:', error);
        alert('Erro ao excluir moto.');
      }
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await localApi.delete('products', id);
        alert('Produto excluído com sucesso!');
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erro ao excluir produto.');
      }
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    if (confirm(`Deseja duplicar o produto "${product.description}"?`)) {
      try {
        const { id, ...productData } = product;

        // Ensure image_url is also optimized during duplication if it wasn't already
        let finalImageUrl = productData.image_url;
        if (finalImageUrl && (finalImageUrl.startsWith('http') || finalImageUrl.startsWith('/images/'))) {
          finalImageUrl = await shortenUrl(finalImageUrl);
        }

        const duplicateData = {
          ...productData,
          image_url: finalImageUrl,
          description: `${product.description} (Cópia)`,
          sku: `${product.sku}-copy`,
          barcode: '', // Clear barcode as it should be unique
          application: product.application || ''
        };
        await localApi.post('products', duplicateData);
        alert('Produto duplicado com sucesso!');
        fetchData();
      } catch (error) {
        console.error('Error duplicating product:', error);
        alert('Erro ao duplicar produto.');
      }
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta venda? O estoque dos produtos será devolvido automaticamente. Esta ação não pode ser desfeita.')) {
      try {
        await localApi.delete('sales', id);
        alert('Venda excluída e estoque devolvido com sucesso!');
        fetchData();
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Erro ao excluir venda.');
      }
    }
  };

  const handlePartialPayment = async (sale: Sale, amountStr: string) => {
    if (!amountStr) return;
    // Converte vírgula para ponto e limpa caracteres não numéricos exceto o ponto
    const cleanedAmount = amountStr.replace(',', '.');
    const amount = Number(cleanedAmount);

    if (isNaN(amount) || amount <= 0) {
      return alert('Por favor, informe um valor válido (ex: 100,00)');
    }
    
    const currentPaid = Number(sale.paid_total || 0);
    const newPaidTotal = currentPaid + amount;
    const isFullyPaid = newPaidTotal >= sale.total;

    try {
      await localApi.patch('sales', sale.id, 'partial-payment', {
        paid_total: newPaidTotal,
        payment_status: isFullyPaid ? 'Pago' : 'Pendente',
        paid_date: isFullyPaid ? new Date().toISOString() : sale.paid_date
      });
      
      setSales(prev => prev.map(s => s.id === sale.id ? { 
        ...s, 
        paid_total: newPaidTotal, 
        payment_status: isFullyPaid ? 'Pago' : 'Pendente',
        paid_date: isFullyPaid ? new Date().toISOString() : s.paid_date
      } : s));
      
      setPayingSaleId(null);
      setPartialPaymentAmount('');
      fetchData(); // Sincroniza dados globais
      alert('Pagamento registrado com sucesso!');
    } catch (err: any) {
      console.error('Error registering partial payment:', err);
      alert(`Erro ao registrar pagamento: ${err.message || 'Verifique a conexão com o servidor local.'}`);
    }
  };

  const handlePrintOS = () => {
    const printContent = document.getElementById('os-printable-area');
    const originalContents = document.body.innerHTML;
    if (printContent) {
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // To re-attach event listeners
    }
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // To re-attach event listeners
    }
  };

  const handlePrintMechanicReport = () => {
    const printContent = document.getElementById('mechanic-report-thermal-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handlePrintCustomerHistory = () => {
    const printContent = document.getElementById('customer-history-print-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const downloadExcel = (wb: XLSX.WorkBook, filename: string) => {
    try {
      const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const url = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
      
      alert('Iniciando o download do arquivo: ' + filename + '\n\nSe ele baixar com um nome estranho, tente clicar nele e escolher "Abrir no Excel".');
      
      const a = document.createElement('a');
      const event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      
      a.href = url;
      a.download = filename;
      a.dispatchEvent(event);
    } catch (error) {
      console.error('Erro ao baixar excel:', error);
      alert('Erro ao gerar o arquivo Excel. Por favor, tente novamente.');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Falha no download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estoque_kombat_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro ao exportar produtos. Certifique-se de estar logado.');
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/export-template';
  };

  const handleExportCustomersExcel = () => {
    const data = customers.map(c => {
      const cSales = sales.filter(s => s.customer_id === c.id);
      const totalSpent = cSales.reduce((acc, s) => acc + s.total, 0);
      return {
        'Nome': c.name,
        'Apelido': c.nickname || '',
        'CPF/CNPJ': c.cpf || c.cnpj || '',
        'WhatsApp': c.whatsapp || '',
        'Endereço': c.address || '',
        'Bairro': c.neighborhood || '',
        'Cidade': c.city || '',
        'CEP': c.zip_code || '',
        'Limite de Crédito': c.credit_limit,
        'Total de Compras': cSales.length,
        'Total Gasto': totalSpent
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    downloadExcel(wb, `clientes_kombat_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSalesExcel = () => {
    const data = sales.map(s => ({
      'Data': new Date(s.date).toLocaleDateString(),
      'ID Venda': s.id,
      'Cliente': s.customer_name,
      'Tipo': s.type,
      'Método Pagamento': s.payment_method,
      'Status': s.payment_status,
      'Valor Total': s.total,
      'Mão de Obra': s.labor_value,
      'Peças': s.total - s.labor_value,
      'Descrição Serviço': s.service_description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
    downloadExcel(wb, `vendas_kombat_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportCustomers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const baseId = Date.now();
      const newCustomers = data.map((item: any, index: number) => ({
        id: item.ID || (baseId + index),
        name: item.Nome || item.Name || item.name || '',
        cpf: item.CPF || item.cpf || '',
        whatsapp: item.Whatsapp || item.WhatsApp || item.Celular || item.whatsapp || '',
        address: item.Endereço || item.Address || item.address || '',
        neighborhood: item.Bairro || item.Neighborhood || item.neighborhood || '',
        zip_code: item.CEP || item.ZipCode || item.zip_code || '',
      }));

      setCustomers(prev => [...prev, ...newCustomers]);
      alert(`${newCustomers.length} clientes importados com sucesso!`);
    };
    reader.readAsBinaryString(file);
  };

  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data.length) {
          alert('Planilha vazia ou em formato inválido.');
          return;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const item of (data as any[])) {
          try {
            const desc = item.Descrição || item.Description || item.description || '';
            if (!desc) continue;

            const skuRaw = String(item.SKU || item.sku || '').trim();
            const barcodeRaw = String(item.EAN || item.Barcode || item.barcode || '').trim();
            
            const prod = {
              description: desc,
              sku: skuRaw === '' || skuRaw === 'undefined' || skuRaw === 'null' ? null : skuRaw,
              barcode: barcodeRaw === '' || barcodeRaw === 'undefined' || barcodeRaw === 'null' ? null : barcodeRaw,
              purchase_price: parseFloat(String(item['Preço de Compra'] || item.PurchasePrice || item.purchase_price || 0).replace(',', '.')),
              sale_price: parseFloat(String(item['Preço de Venda'] || item.SalePrice || item.sale_price || 0).replace(',', '.')),
              stock: parseInt(item.Estoque || item.Stock || item.stock || 0),
              unit: item.Unidade || item.Unit || item.unit || 'Unitário',
              image_url: item.Imagem || item.Image || item.image_url || '',
              brand: item.Marca || item.Brand || item.brand || '',
              location: item.Localização || item.Location || item.location || '',
              application: item.Aplicação || item.Application || item.application || '',
              category: item.Categoria || item.Category || item.category || categorizeProduct(desc),
              distributor: item.Distribuidor || item.Distributor || item.distributor || '',
              alt_code: item.Alternativo || item.AltCode || item.alt_code || ''
            };

            await localApi.post('products', prod);
            importedCount++;
          } catch (err) {
            errorCount++;
            console.warn('Erro ao importar item individual:', err);
          }
        }

        alert(`Processamento concluído: ${importedCount} produtos importados.${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
        fetchData();
      } catch (error: any) {
        console.error('Erro na importação:', error);
        alert('Erro ao processar planilha: ' + (error.message || 'Verifique o formato.'));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        products,
        customers,
        motorcycles,
        sales,
        leads,
        mechanics,
        fixedServices,
        distributors,
        purchaseOrders,
        workshopPurchases,
        registeredServices,
        quotes,
        companyData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_kombat_moto_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Backup exportado com sucesso! Arquivo JSON salvo.');
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      alert('Falha ao gerar backup.');
    }
  };

  const handleClearCache = () => {
    if (confirm('Limpar o cache removerá configurações locais (como logo e dados da empresa no navegador). Dados do servidor continuam salvos. Deseja continuar?')) {
      const token = localStorage.getItem('token');
      const companyData = localStorage.getItem('companyData');
      const companyLogo = localStorage.getItem('companyLogo');
      
      localStorage.clear();
      
      if (token) localStorage.setItem('token', token);
      if (companyData) localStorage.setItem('companyData', companyData);
      if (companyLogo) localStorage.setItem('companyLogo', companyLogo);
      
      alert('Cache limpo! Recarregando...');
      window.location.reload();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Atalhos Rápidos no Topo do Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
        <button
          onClick={() => setIsPdvModalOpen(true)}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all font-black text-[10px] tracking-widest uppercase"
        >
          <ShoppingCart size={20} />
          <span>Venda PDV</span>
        </button>
        <button
          onClick={() => {
            setEditingOS(null);
            setOsForm({
              customer_id: '',
              motorcycle_id: '',
              motorcycle_plate: '',
              items: [],
              selected_fixed_services: [],
              labor_value: '0',
              principal_service_desc: '',
              internal_services: [],
              mechanic_id: '',
              payment_method: 'Pix',
              status: 'Aberto',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              service_description: '',
              km: ''
            });
            setOsSearchProduct('');
            setIsOsModalOpen(true);
          }}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-100 hover:bg-amber-700 hover:scale-[1.02] active:scale-95 transition-all font-black text-[10px] tracking-widest uppercase"
        >
          <Bike size={20} />
          <span>Nova O.S.</span>
        </button>
        <button
          onClick={() => setIsQuickInventoryOpen(true)}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all font-black text-[10px] tracking-widest uppercase border-b-4 border-indigo-800"
        >
          <ClipboardCheck size={20} />
          <span>Contagem Rápida</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-start justify-between w-full">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1 dark:text-slate-400">Faturamento no Período</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatBRL(stats?.revenue)}</h3>
              <p className="text-xs text-slate-400 mt-1">Período customizado</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2 w-full">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Início</label>
                <input
                  type="date"
                  value={revenueStartDate}
                  onChange={(e) => setRevenueStartDate(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Fim</label>
                <input
                  type="date"
                  value={revenueEndDate}
                  onChange={(e) => setRevenueEndDate(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        </div>
        <StatCard
          title="Motos em Aberto"
          value={stats?.openServiceOrders || 0}
          icon={Bike}
          color="bg-amber-500"
          subtitle="Revisões pendentes"
        />
        <StatCard
          title="Ticket Médio (Venda)"
          value={formatBRL(stats?.avgTicketCounter)}
          icon={DollarSign}
          color="bg-emerald-500"
          subtitle="Média por venda balcão"
        />
        <StatCard
          title="Ticket Médio (O.S.)"
          value={formatBRL(stats?.avgTicketService)}
          icon={ClipboardList}
          color="bg-blue-500"
          subtitle="Média por ordem de serviço"
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <BillingAutomationBox
          pendingSales={sales.filter(s => s.payment_status === 'Pendente')}
          customers={sortedCustomers}
          companyData={companyData}
          onUpdateDueDate={handleUpdateDueDate}
          onPartialPayment={handlePartialPayment}
          payingSaleId={payingSaleId}
          setPayingSaleId={setPayingSaleId}
          partialPaymentAmount={partialPaymentAmount}
          setPartialPaymentAmount={setPartialPaymentAmount}
          onPrintReceipt={setSelectedSaleForReceipt}
        />
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clientes e Motos</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl no-print dark:bg-slate-800">
            <button
              onClick={() => setCustomerViewMode('list')}
              className={`p-2 rounded-lg transition-all ${customerViewMode === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setCustomerViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${customerViewMode === 'grid' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
              title="Visualização em Cards"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64 dark:bg-slate-800 dark:border-slate-700"
              value={customerSearchTerm}
              onChange={e => setCustomerSearchTerm(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium cursor-pointer">
            <Package size={18} />
            Importar Clientes
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportCustomers} />
          </label>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setCustomerForm({
                name: '',
                cpf: '',
                cnpj: '',
                whatsapp: '',
                address: '',
                neighborhood: '',
                city: '',
                zip_code: '',
                credit_limit: 0,
                fine_rate: 2,
                interest_rate: 1
              });
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium"
          >
            <Plus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      {customerViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCustomers.filter(c => {
            const search = (customerSearchTerm || globalSearchTerm).toLowerCase();
            return (
              (c.name || '').toLowerCase().includes(search) ||
              (c.nickname || '').toLowerCase().includes(search) ||
              (c.cpf || '').toLowerCase().includes(search) ||
              (c.whatsapp || '').toLowerCase().includes(search) ||
              (c.cnpj || '').toLowerCase().includes(search) ||
              (c.city || '').toLowerCase().includes(search)
            );
          }).map(c => (
            <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-lg leading-tight dark:text-slate-100">{c.name}</h4>
                  {c.nickname && <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">{c.nickname}</p>}
                  <p className="text-sm text-slate-500 dark:text-slate-400">CPF: {c.cpf || 'Não informado'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Celular: {c.whatsapp || 'Não informado'}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Limite Total:</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatBRL(c.credit_limit)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Saldo Disponível:</span>
                      <span className={`text-xs font-bold ${getCustomerRemainingCredit(c.id) > 0 ? 'text-rose-600' : 'text-rose-600'}`}>
                        {formatBRL(getCustomerRemainingCredit(c.id))}
                      </span>
                    </div>
                    {sales.some(s => s.customer_id === c.id && s.payment_status === 'Pendente' && s.due_date && new Date(s.due_date) < new Date()) && (
                      <div className="flex items-center gap-1 mt-1 px-2 py-1 bg-rose-100 text-rose-700 rounded w-fit border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                        <AlertTriangle size={12} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Conta Vencida</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-24 h-24 bg-slate-100 border border-slate-400 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center dark:bg-slate-800 dark:border-slate-700">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setEditingMotorcycle(null);
                      setMotorcycleForm({ customer_id: c.id.toString(), plate: '', model: '', current_km: '' });
                      setIsMotorcycleModalOpen(true);
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Adicionar Moto"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingCustomer(c);
                      setCustomerForm({
                        name: c.name,
                        nickname: c.nickname || '',
                        cpf: c.cpf,
                        cnpj: c.cnpj || '',
                        whatsapp: c.whatsapp,
                        address: c.address,
                        neighborhood: c.neighborhood,
                        city: c.city || '',
                        zip_code: c.zip_code,
                        credit_limit: c.credit_limit || 0,
                        fine_rate: c.fine_rate || 2,
                        interest_rate: c.interest_rate || 1,
                        image_url: c.image_url || ''
                      });
                      setIsCustomerModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Editar Cliente"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setActiveCliente360Id(c.id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Histórico de Vendas"
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-400 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">Motos Cadastradas</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {motorcycles.filter(m => m.customer_id === c.id).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate dark:text-slate-100">{m.model}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-black tracking-widest uppercase">{m.plate}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditMotorcycle(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Editar Moto"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMotorcycle(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Moto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {motorcycles.filter(m => m.customer_id === c.id).length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">Nenhuma moto cadastrada</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-400 dark:border-slate-700">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contato / CPF</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financeiro</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedCustomers.filter(c => {
                  const search = (customerSearchTerm || globalSearchTerm).toLowerCase();
                  return (
                    (c.name || '').toLowerCase().includes(search) ||
                    (c.nickname || '').toLowerCase().includes(search) ||
                    (c.cpf || '').toLowerCase().includes(search) ||
                    (c.whatsapp || '').toLowerCase().includes(search) ||
                    (c.cnpj || '').toLowerCase().includes(search) ||
                    (c.city || '').toLowerCase().includes(search)
                  );
                }).map(c => (
                  <tr key={c.id} className="border-b border-slate-400 hover:bg-slate-50/50 transition-colors dark:border-slate-700">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                      {c.nickname && <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">{c.nickname}</p>}
                      <p className="text-[10px] text-slate-400">{motorcycles.filter(m => m.customer_id === c.id).length} moto(s) cadastrada(s)</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-bold dark:text-slate-100">{c.whatsapp}</p>
                      <p className="text-[10px] text-slate-400 font-mono">CPF: {c.cpf || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Disponível</span>
                          <span className="text-rose-600">{formatBRL(getCustomerRemainingCredit(c.id))}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                          <div
                            className="h-full bg-rose-600 rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, (getCustomerRemainingCredit(c.id) / (c.credit_limit || 1)) * 100))}%` }}
                          />
                        </div>
                        {sales.some(s => s.customer_id === c.id && s.payment_status === 'Pendente' && s.due_date && new Date(s.due_date) < new Date()) && (
                          <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded w-fit border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                            <AlertTriangle size={10} className="shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Conta Vencida</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMotorcycle(null);
                            setMotorcycleForm({ customer_id: c.id.toString(), plate: '', model: '', current_km: '' });
                            setIsMotorcycleModalOpen(true);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Nova Moto"
                        >
                          <Bike size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setCustomerForm({
                              name: c.name,
                              nickname: c.nickname || '',
                              cpf: c.cpf,
                              cnpj: c.cnpj || '',
                              whatsapp: c.whatsapp,
                              address: c.address,
                              neighborhood: c.neighborhood,
                              city: c.city || '',
                              zip_code: c.zip_code,
                              credit_limit: c.credit_limit || 0,
                              fine_rate: c.fine_rate || 2,
                              interest_rate: c.interest_rate || 1
                            });
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setActiveCliente360Id(c.id)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Histórico Cliente 360°"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const handleSaveService = async () => {
    const data = {
      description: serviceForm.description,
      price: parseFloat(serviceForm.price.replace(',', '.')) || 0,
      category: serviceForm.category
    };

    try {
      if (editingService) {
        await localApi.put('registered_services', editingService.id, data);
      } else {
        await localApi.post('registered_services', data);
      }
      fetchData();
      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({ description: '', price: '', category: '' });
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço.');
    }
  };

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cadastro de Serviços</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar serviços..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64 dark:bg-slate-800 dark:border-slate-700"
              value={serviceSearchTerm}
              onChange={e => setServiceSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setServiceForm({ description: '', price: '', category: '' });
              setIsServiceModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium"
          >
            <Plus size={18} />
            Novo Serviço
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-400 dark:bg-slate-900 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Serviço</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Sugerido</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {sortedRegisteredServices.filter(s =>
              (s.description || '').toLowerCase().includes(d_serviceSearchTerm.toLowerCase())
            ).map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{s.description || 'Sem Descrição'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase dark:bg-slate-800 dark:text-slate-400">
                    {s.category || 'Geral'}
                  </span>
                </td>
                <td className="px-6 py-4 text-rose-600 font-bold">R$ {(s.price || 0).toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingService(s);
                        setServiceForm({ description: s.description || '', price: (s.price || 0).toString(), category: s.category || '' });
                        setIsServiceModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Excluir serviço "${s.description}"?`)) {
                          try {
                            await localApi.delete('registered_services', s.id);
                            fetchData();
                          } catch (error) {
                            console.error('Erro ao excluir serviço:', error);
                            alert('Erro ao excluir serviço.');
                          }
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabela de Repasses Fixos - Unificando na aba de Serviços */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Settings size={18} className="text-amber-500" />
              Tabela de Repasses Fixos (Mecânicos)
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 dark:text-slate-400">Valores fixos pagos aos mecânicos por serviço</p>
          </div>
          <button
            onClick={() => {
              setEditingFixedService(null);
              setFixedServiceForm({ name: '', price: '', payout: '' });
              setIsFixedServiceModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-xs font-bold"
          >
            <Plus size={14} /> Novo Repasse Fixo
          </button>
        </div>
        <div className="divide-y divide-slate-300 max-h-[400px] overflow-y-auto">
          {sortedFixedServices.map(fs => (
            <div key={fs.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{fs.name || 'Sem Nome'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter dark:text-slate-400">Repasse p/ Mecânico: <span className="text-rose-600">R$ {Number(fs.payout || 0).toFixed(2)}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingFixedService(fs);
                    setFixedServiceForm({ name: fs.name || '', price: ((fs as any).price || 0).toString(), payout: (fs.payout || 0).toString() });
                    setIsFixedServiceModalOpen(true);
                  }}
                  className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Excluir repasse fixo "${fs.name}"?`)) {
                      try {
                        await localApi.delete('fixed_services', fs.id);
                        fetchData();
                      } catch (err) {
                        alert('Erro ao excluir repasse fixo.');
                      }
                    }
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {sortedFixedServices.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm italic">Nenhum repasse fixo cadastrado.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderManualInventory = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-emerald-600 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Contagem Rápida iPhone</h2>
          <p className="opacity-80 font-bold">Bipe ou busque o produto para atualizar o estoque na hora.</p>
        </div>
        <ClipboardCheck className="absolute -right-4 -bottom-4 opacity-10" size={160} />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-300 shadow-sm space-y-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="relative">
          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Buscar/Bipar Produto</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input
              type="text"
              autoFocus
              placeholder="Nome, SKU ou Bipe o Código..."
              className="w-full pl-14 pr-4 py-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none text-xl transition-all font-bold placeholder:text-slate-300 dark:bg-slate-900 dark:border-slate-700"
              value={quickInventorySearch}
              onChange={e => {
                setQuickInventorySearch(e.target.value);
                const val = e.target.value.trim();
                // Auto selection for barcodes
                if (val.length > 3) {
                  const found = products.find(p => (p.barcode === val) || (p.sku === val));
                  if (found) {
                    setSelectedQuickProduct(found);
                    setQuickInventoryStock(found.stock.toString());
                    setQuickInventorySearch('');
                  }
                }
              }}
            />
          </div>

          {quickInventorySearch && !selectedQuickProduct && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-2xl shadow-2xl max-h-80 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
              {products.filter(p => 
                (p.description || '').toLowerCase().includes(quickInventorySearch.toLowerCase()) ||
                (p.sku || '').toLowerCase().includes(quickInventorySearch.toLowerCase()) ||
                (p.alt_code || '').toLowerCase().includes(quickInventorySearch.toLowerCase()) ||
                (p.barcode || '').toLowerCase().includes(quickInventorySearch.toLowerCase())
              ).slice(0, 15).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedQuickProduct(p);
                    setQuickInventoryStock(p.stock.toString());
                    setQuickInventorySearch('');
                  }}
                  className="w-full text-left px-6 py-5 hover:bg-emerald-50 flex flex-col border-b border-slate-100 last:border-none transition-colors"
                >
                  <span className="font-black text-slate-900 text-lg uppercase leading-none mb-1 dark:text-slate-100">{p.description}</span>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-tighter dark:text-slate-400">
                    <span>SKU: {p.sku || '--'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span>Loc: {p.location || 'Sem prateleira'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-emerald-600">Estoque: {p.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedQuickProduct ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-emerald-500 shadow-xl shadow-emerald-50 dark:bg-slate-900"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-10">
              <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center relative group shrink-0 dark:bg-slate-800 dark:border-slate-700">
                {selectedQuickProduct.image_url ? (
                  <img src={selectedQuickProduct.image_url} alt="Produto" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon size={48} className="text-slate-200" />
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                  <Camera size={32} className="text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={(e) => handleProductImageUpload(selectedQuickProduct.id, e)}
                  />
                </label>
                {/* Mobile camera trigger always visible on small screens */}
                <label className="absolute bottom-2 right-2 bg-emerald-600 text-white p-2 rounded-full sm:hidden shadow-lg border-2 border-white">
                   <Camera size={16} />
                   <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={(e) => handleProductImageUpload(selectedQuickProduct.id, e)}
                  />
                </label>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Ajustando Estoque</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-slate-800 dark:text-slate-400">ID: {selectedQuickProduct.id}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase leading-none dark:text-slate-100">{selectedQuickProduct.description}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 font-bold text-sm uppercase dark:text-slate-400">{selectedQuickProduct.brand || 'Sem Marca'}</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <p className="text-slate-400 font-bold text-sm uppercase">{selectedQuickProduct.location || 'Sem prateleira'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedQuickProduct(null)}
                className="p-4 bg-white border-2 border-slate-200 rounded-[1.5rem] hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-700"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <label className="block text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quantidade Contada</label>
                <div className="relative flex items-center justify-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full py-6 text-center text-7xl font-black text-emerald-600 bg-transparent outline-none no-spinners"
                    value={quickInventoryStock}
                    onChange={e => setQuickInventoryStock(e.target.value)}
                  />
                  <span className="absolute right-0 bottom-4 text-slate-300 font-black uppercase text-xs tracking-tighter">Unidades</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[-10, -1, 1, 10].map(val => (
                  <button
                    key={val}
                    onClick={() => setQuickInventoryStock(s => (Math.max(0, (parseInt(s) || 0) + val)).toString())}
                    className={`h-20 rounded-3xl font-black text-2xl shadow-sm transition-all active:scale-90 ${
                      val > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>

              <button
                onClick={handleUpdateStockQuick}
                className="w-full py-8 bg-emerald-600 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-tighter flex items-center justify-center gap-3"
              >
                <CheckCircle size={32} />
                Confirmar Estoque
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem] dark:bg-slate-900">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-6 dark:bg-slate-800">
              <Scan size={48} />
            </div>
            <p className="text-slate-400 font-bold text-center uppercase tracking-widest text-xs">
              Aguardando Leitura de Código <br /> ou Busca por Peça...
            </p>
          </div>
        )}
      </div>
    </div>
  );




  const renderSettings = () => (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cadastro da Empresa</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Informações oficiais do seu negócio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Razão Social</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                placeholder="Ex: Kombat Peças e Serviços Ltda"
                value={companyData.razaoSocial}
                onChange={e => setCompanyData({ ...companyData, razaoSocial: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Nome Fantasia</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                placeholder="Ex: Kombat Moto Peças"
                value={companyData.nomeFantasia}
                onChange={e => setCompanyData({ ...companyData, nomeFantasia: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">CNPJ</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              placeholder="00.000.000/0000-00"
              value={companyData.cnpj}
              onChange={e => setCompanyData({ ...companyData, cnpj: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Telefone / WhatsApp</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              placeholder="(00) 00000-0000"
              value={companyData.telefone}
              onChange={e => setCompanyData({ ...companyData, telefone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">E-mail de Contato</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              placeholder="contato@empresa.com"
              value={companyData.email}
              onChange={e => setCompanyData({ ...companyData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">CEP</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              placeholder="00000-000"
              value={companyData.cep}
              onChange={e => setCompanyData({ ...companyData, cep: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Endereço Completo</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              placeholder="Rua, Número, Complemento"
              value={companyData.endereco}
              onChange={e => setCompanyData({ ...companyData, endereco: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Bairro</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={companyData.bairro}
              onChange={e => setCompanyData({ ...companyData, bairro: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Cidade</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                value={companyData.cidade}
                onChange={e => setCompanyData({ ...companyData, cidade: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Estado</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                placeholder="UF"
                value={companyData.estado}
                onChange={e => setCompanyData({ ...companyData, estado: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Alterações salvas automaticamente
        </div>
      </div>


      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <ImageIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Logo da Empresa</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Personalize o visual do seu sistema e documentos</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="w-32 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-400 flex items-center justify-center overflow-hidden dark:bg-slate-900 dark:border-slate-700">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon size={40} className="text-slate-300" />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <label className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all text-sm cursor-pointer flex items-center gap-2">
                <Upload size={16} />
                {companyLogo ? 'Trocar Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {companyLogo && (
                <button
                  onClick={handleLogoDelete}
                  className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Remover
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">Suporta JPG, PNG ou GIF. Tamanho ideal: 512x512px.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Central de Relatórios Profissionais</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gere relatórios detalhados para impressão ou análise gerencial</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 'customers', label: 'Relatório de Clientes', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { id: 'inventory', label: 'Relatório de Estoque', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
            { id: 'sales', label: 'Relatório de Vendas', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { id: 'financial', label: 'Relatório Financeiro', icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'purchases', label: 'Relatório de Compras', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((rep) => (
            <button
              key={rep.id}
              onClick={() => {
                setSelectedReport(rep.id as any);
                setIsManagementReportModalOpen(true);
              }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-400 hover:border-rose-200 hover:shadow-md transition-all text-left bg-slate-50/50 dark:border-slate-700"
            >
              <div className={`p-3 rounded-xl ${rep.bg} ${rep.color}`}>
                <rep.icon size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm dark:text-slate-100">{rep.label}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider dark:text-slate-400">Ver Detalhes</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Backup e Dados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a segurança das suas informações</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExportBackup}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm flex items-center gap-2 dark:bg-slate-800 dark:text-slate-100"
          >
            <Download size={18} />
            Exportar Backup (JSON)
          </button>
          <button 
            onClick={handleClearCache}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm dark:bg-slate-800 dark:text-slate-100"
          >
            Limpar Cache do Sistema
          </button>
        </div>
      </div>
    </div>
  );
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pedidos de Peças</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingOrder(null);
              setOrderForm({ distributor_id: '', items: [] });
              setIsOrderModalOpen(true);
            }}
            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2"
          >
            <Plus size={18} /> Novo Pedido
          </button>
          <button
            onClick={() => setIsDistributorModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus size={18} /> Cadastrar Distribuidor
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 mb-4 dark:text-slate-100">Pedidos Recentes</h3>
        <div className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <p className="text-center text-slate-400 py-8 italic">Nenhum pedido de peças registrado ainda.</p>
          ) : (
            purchaseOrders.map(order => {
              const statusClass = order.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 
                                order.status === 'Enviado' ? 'bg-blue-100 text-blue-600' : 
                                'bg-rose-100 text-rose-600';
              return (
                <div key={order.id} className="p-4 bg-slate-50 rounded-xl border border-slate-400 flex items-center justify-between dark:bg-slate-900 dark:border-slate-700">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Pedido #{order.id}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Distribuidor: {order.distributor_name}</p>
                    <p className="text-xs text-slate-400">Data: {new Date(order.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusClass}`}>
                      {(order.status || 'Pendente').toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleOpenEditOrder(order)}
                      className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                      title="Editar Pedido"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
                      title="Deletar Pedido"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleSendOrderWhatsApp(order)}
                      className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
                      title="Enviar via WhatsApp"
                    >
                      <Send size={18} />
                    </button>
                    <button
                      onClick={() => setPurchaseOrders(purchaseOrders.map(o => o.id === order.id ? { ...o, status: 'Recebido' } : o))}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Marcar como Recebido"
                    >
                      <ClipboardList size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderManagementReportContent = () => {
    switch (selectedReport) {
      case 'customers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatório Geral de Clientes</h2>
              <div className="flex gap-2 no-print">
                <button 
                  onClick={handleExportCustomersExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all font-bold text-xs"
                >
                  <FileText size={16} />
                  Exportar Excel
                </button>
                <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Printer size={20} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase">Total Cadastrados</p>
                <p className="text-2xl font-black text-blue-700">{customers.length}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Clientes Ativos</p>
                <p className="text-2xl font-black text-emerald-700">{new Set(sales.map(s => s.customer_id)).size}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-[10px] font-bold text-rose-500 uppercase">Total em Aberto (Fiado)</p>
                <p className="text-2xl font-black text-rose-700">
                  R$ {sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente').reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="py-2">Nome</th>
                  <th>WhatsApp</th>
                  <th>Compras</th>
                  <th>Total Gasto</th>
                </tr>
              </thead>
              <tbody>
                {customers.sort((a, b) => a.name.localeCompare(b.name)).map(c => {
                  const cSales = sales.filter(s => s.customer_id === c.id);
                  const totalSpent = cSales.reduce((acc, s) => acc + s.total, 0);
                  return (
                    <tr key={c.id} className="border-b">
                      <td className="py-3 font-bold">{c.name}</td>
                      <td>{c.whatsapp}</td>
                      <td>{cSales.length}</td>
                      <td className="font-bold">R$ {totalSpent.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'inventory':
        const filteredInventory = products.filter(p =>
          p.description.toLowerCase().includes(inventoryReportSearchTerm.toLowerCase()) ||
          (p.sku || '').toLowerCase().includes(inventoryReportSearchTerm.toLowerCase()) ||
          (p.alt_code || '').toLowerCase().includes(inventoryReportSearchTerm.toLowerCase())
        ).sort((a, b) => a.description.localeCompare(b.description));

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatório de Estoque e Valoração</h2>
              <div className="flex items-center gap-4">
                <div className="relative no-print">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou SKU..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none w-64 dark:bg-slate-900 dark:border-slate-700"
                    value={inventoryReportSearchTerm}
                    onChange={(e) => setInventoryReportSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200 dark:bg-slate-800"><Printer size={20} /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 font-sans">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase">Total de Itens</p>
                <p className="text-2xl font-black text-amber-700">{filteredInventory.reduce((acc, p) => acc + p.stock, 0)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Investimento Total</p>
                <p className="text-2xl font-black text-emerald-700">R$ {filteredInventory.reduce((acc, p) => acc + (p.purchase_price * p.stock), 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Venda Estimada</p>
                <p className="text-2xl font-black text-indigo-700">R$ {filteredInventory.reduce((acc, p) => acc + (p.sale_price * p.stock), 0).toFixed(2)}</p>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="py-2">Descrição</th>
                  <th>SKU</th>
                  <th>Estoque</th>
                  <th>Custo Unit.</th>
                  <th>Valor Venda</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="py-3 font-bold">{p.description}</td>
                    <td>{p.sku}</td>
                    <td className={p.stock < 5 ? 'text-rose-600 font-bold' : ''}>{p.stock}</td>
                    <td>R$ {p.purchase_price.toFixed(2)}</td>
                    <td className="font-bold">R$ {p.sale_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'sales':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatório de Performance de Vendas</h2>
              <div className="flex gap-2 no-print">
                <button 
                  onClick={handleExportSalesExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all font-bold text-xs"
                >
                  <FileText size={16} />
                  Exportar Excel
                </button>
                <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Printer size={20} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Vendas Totais</p>
                <p className="text-xl font-black text-emerald-700">R$ {sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase">Ticket Médio</p>
                <p className="text-xl font-black text-blue-700">R$ {(sales.reduce((acc, s) => acc + s.total, 0) / (sales.length || 1)).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase">Vendas Oficina</p>
                <p className="text-xl font-black text-amber-700">R$ {sales.filter(s => s.type === 'Oficina').reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100">
                <p className="text-[10px] font-bold text-pink-500 uppercase">Vendas Balcão</p>
                <p className="text-xl font-black text-pink-700">R$ {sales.filter(s => s.type === 'Balcão').reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="py-2">Data</th>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Metodo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="py-3">{new Date(s.date).toLocaleDateString()}</td>
                    <td>{String(s.id).slice(-6)}</td>
                    <td className="font-bold">{s.customer_name}</td>
                    <td>{s.type}</td>
                    <td>{s.payment_method}</td>
                    <td className="font-bold">R$ {s.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'financial':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatório Financeiro e Lucratividade</h2>
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200 dark:bg-slate-800"><Printer size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Receita Bruta</p>
                <p className="text-2xl font-black text-emerald-700">R$ {sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-[10px] font-bold text-rose-500 uppercase">Custo de Mercadoria (Estimado)</p>
                <p className="text-2xl font-black text-rose-700">
                  R$ {sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => {
                    const prod = products.find(p => p.id === i.product_id);
                    return sum + ((prod?.purchase_price || 0) * i.quantity);
                  }, 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Lucro Bruto Estimado</p>
                <p className="text-2xl font-black text-indigo-700">
                  R$ {(sales.reduce((acc, s) => acc + s.total, 0) - sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => {
                    const prod = products.find(p => p.id === i.product_id);
                    return sum + ((prod?.purchase_price || 0) * i.quantity);
                  }, 0), 0)).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 mb-2 dark:text-slate-100">Resumo por Forma de Pagamento</h4>
              <div className="grid grid-cols-4 gap-4">
                {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => (
                  <div key={method} className="bg-white p-3 rounded-xl border border-slate-400 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{method}</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">R$ {sales.filter(s => s.payment_method === method).reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'purchases':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatório de Compras e Fornecedores</h2>
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200 dark:bg-slate-800"><Printer size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Total de Pedidos</p>
                <p className="text-2xl font-black text-indigo-700">{purchaseOrders.length}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Pedidos Recebidos</p>
                <p className="text-2xl font-black text-emerald-700">{purchaseOrders.filter(o => o.status === 'Recebido').length}</p>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="py-2">Data</th>
                  <th>ID</th>
                  <th>Distribuidor</th>
                  <th>Itens</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(o => (
                  <tr key={o.id} className="border-b">
                    <td className="py-3">{new Date(o.date).toLocaleDateString()}</td>
                    <td>#{String(o.id).slice(-4)}</td>
                    <td className="font-bold">{o.distributor_name}</td>
                    <td>{o.items.length} itens</td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${o.status === 'Recebido' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isCatalogPublicView) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-800">
        <ProfessionalCatalog 
          isOpen={true} 
          onClose={() => {}} 
          products={products}
          initialSearch={initialSku || ''}
        />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <>
      <div className={`min-h-screen bg-slate-50 flex relative overflow-hidden notranslate main-layout-root ${isPrintingQuote ? 'no-print' : ''}`} translate="no">
      {/* Sidebar Trigger Area (Hover zone) */}
      <div
        className="fixed left-0 top-0 bottom-0 w-4 z-50"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      <aside
        className={`fixed left-4 top-4 bottom-4 w-60 bg-white/80 backdrop-blur-xl border border-white/20 p-5 flex flex-col gap-6 z-50 transition-all duration-500 ease-in-out shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] no-print ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          }`}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-rose-100 border border-slate-400 dark:border-slate-700">
                <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <Bike size={24} />
              </div>
            )}
            <h1 className="font-bold text-xl text-slate-900 leading-tight dark:text-slate-100">Kombat<br /><span className="text-rose-600">Moto Peças</span></h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {hasAccess(['Administrador', 'Mecânico', 'Financeiro']) && (
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador', 'Atendente']) && (
            <SidebarItem
              icon={Users}
              label="Clientes"
              active={activeTab === 'customers'}
              onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={Package}
              label="Estoque"
              active={activeTab === 'inventory'}
              onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={ClipboardCheck}
              label="CONTAGEM RÁPIDA"
              active={activeTab === 'manual_inventory'}
              onClick={() => { setActiveTab('manual_inventory'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={Wrench}
              label="Serviços"
              active={activeTab === 'services'}
              onClick={() => { setActiveTab('services'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={Truck}
              label="Pedidos de Peças"
              active={activeTab === 'orders'}
              onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={ShoppingCart}
              label="Entrada de Compras"
              active={activeTab === 'purchases'}
              onClick={() => { setActiveTab('purchases'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador', 'Atendente']) && (
            <SidebarItem
              icon={FileText}
              label="Orçamentos"
              active={activeTab === 'quotes'}
              onClick={() => { setActiveTab('quotes'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador', 'Atendente']) && (
            <SidebarItem
              icon={Target}
              label="CRM / Vendas"
              active={activeTab === 'crm'}
              onClick={() => { setActiveTab('crm'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={ShoppingCart}
              label="PDV / Caixa"
              active={activeTab === 'pdv'}
              onClick={() => { setActiveTab('pdv'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador', 'Mecânico']) && (
            <SidebarItem
              icon={Bike}
              label="Ordens de Serviço"
              active={activeTab === 'os'}
              onClick={() => { setActiveTab('os'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador', 'Financeiro']) && (
            <SidebarItem
              icon={DollarSign}
              label="Financeiro"
              active={activeTab === 'financial'}
              onClick={() => { setActiveTab('financial'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={Users}
              label="Mecânicos"
              active={activeTab === 'mechanics'}
              onClick={() => { setActiveTab('mechanics'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador', 'Atendente']) && (
            <SidebarItem
              icon={MessageCircle}
              label="Catálogo Komat"
              active={isCatalogModalOpen}
              onClick={() => { setIsCatalogModalOpen(true); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={BrainCircuit}
              label="Instruções da IA"
              active={activeTab === 'ai_instructions'}
              onClick={() => { setActiveTab('ai_instructions'); setIsSidebarOpen(false); }}
            />
          )}
          {hasAccess(['Administrador']) && (
            <SidebarItem
              icon={Settings}
              label="Configurações"
              active={activeTab === 'settings'}
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            />
          )}
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Suporte</p>
          <button className="w-full flex items-center gap-2 text-sm text-slate-600 hover:text-rose-600 transition-colors dark:text-slate-400">
            <MessageCircle size={16} />
            Ajuda do Sistema
          </button>
        </div>
      </aside>

      {/* Overlay when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-all"
            onMouseEnter={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto ml-0 no-print">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {activeTab === 'dashboard' && 'Bem-vindo de volta!'}
              {activeTab === 'customers' && 'Gestão de Clientes'}
              {activeTab === 'inventory' && 'Controle de Estoque'}
              {activeTab === 'manual_inventory' && 'Contagem Rápida (Estoque)'}
              {activeTab === 'services' && 'Cadastro de Serviços'}
              {activeTab === 'crm' && 'CRM de Vendas'}
              {activeTab === 'pdv' && 'Frente de Caixa (PDV)'}
              {activeTab === 'os' && 'Ordens de Serviço'}
              {activeTab === 'financial' && 'Gestão Financeira'}
              {activeTab === 'orders' && 'Pedidos de Peças'}
              {activeTab === 'purchases' && 'Entrada de Compras (Oficina)'}
              {activeTab === 'mechanics' && 'Gestão de Mecânicos'}
              {activeTab === 'quotes' && 'Orçamentos Profissionais'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
              {activeTab === 'ai_instructions' && 'Central de Instruções da IA'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">SISTEMA ATUALIZADO V2.1</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'inventory' && (
                  <InventoryTab
                    products={products}
                    inventorySearchTerm={inventorySearchTerm}
                    setInventorySearchTerm={setInventorySearchTerm}
                    globalSearchTerm={globalSearchTerm}
                    inventoryView={inventoryView}
                    setInventoryView={setInventoryView}
                    loading={loading}
                    fetchData={fetchData}
                    selectedProductIds={selectedProductIds}
                    toggleSelectProduct={toggleSelectProduct}
                    setSelectedProductIds={setSelectedProductIds}
                    handleBulkDelete={handleBulkDelete}
                    handleImportProducts={handleImportProducts}
                    handleDownloadExcel={handleDownloadExcel}
                    setIsQuickInventoryOpen={setIsQuickInventoryOpen}
                    setIsMassUpdateModalOpen={setIsMassUpdateModalOpen}
                    handleEditProduct={handleEditProduct}
                    handleDeleteProduct={handleDeleteProduct}
                    onAddProduct={() => {
                      setEditingProduct(null);
                      setProductForm({ 
                        description: '', sku: '', barcode: '', purchase_price: '', 
                        sale_price: '', stock: '', unit: 'Unitário', brand: '', 
                        location: '', application: '' 
                      });
                      setIsProductModalOpen(true);
                    }}
                    setSelectedProductDetail={setSelectedProductDetail}
                    formatBRL={formatBRL}
                  />
                )}
                {activeTab === 'manual_inventory' && renderManualInventory()}
                {activeTab === 'services' && renderServices()}
                {activeTab === 'crm' && (
                  <CRMTab
                    currentUser={user}
                    formatBRL={formatBRL}
                    products={products}
                    mechanics={mechanics}
                    onTriggerPDV={handleConvertQuoteToSale}
                    onTriggerOS={handleConvertQuoteToOS}
                    onOpenCliente360={(id) => setActiveCliente360Id(id)}
                  />
                )}
                {activeTab === 'pdv' && renderPDV()}
                {activeTab === 'os' && (
                  <OSTab
                    sales={sales}
                    products={products}
                    salesSearchTerm={salesSearchTerm}
                    globalSearchTerm={globalSearchTerm}
                    setSalesSearchTerm={setSalesSearchTerm}
                    setEditingOS={setEditingOS}
                    setOsForm={setOsForm}
                    setIsOsModalOpen={setIsOsModalOpen}
                    formatBRL={formatBRL}
                    handleEditOS={handleEditOS}
                    setSelectedSaleForOS={setSelectedSaleForOS}
                    setSelectedSaleForReceipt={setSelectedSaleForReceipt}
                    handleSendSaleWhatsApp={handleSendSaleWhatsApp}
                  />
                )}
                {activeTab === 'financial' && (
                  <FinancialTab
                    sales={financialSales}
                    allSales={sales}
                    products={products}
                    customers={customers}
                    companyData={companyData}
                    companyLogo={companyLogo}
                    localApi={localApi}
                    fetchData={fetchData}
                    formatBRL={formatBRL}
                  />
                )}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'purchases' && (
                  <PurchasesTab 
                    onSave={handleSaveWorkshopPurchase} 
                    onDelete={handleDeleteWorkshopPurchase}
                    onClearHistory={handleClearWorkshopPurchases}
                    formatBRL={formatBRL} 
                    workshopPurchases={workshopPurchases} 
                  />
                )}
                {activeTab === 'mechanics' && renderMechanics()}
                {activeTab === 'quotes' && renderQuotes()}
                {activeTab === 'settings' && renderSettings()}
                {activeTab === 'ai_instructions' && <AIInstructionsDashboard />}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modals */}
        {activeCliente360Id !== null && (
          <Cliente360Modal
            clienteId={activeCliente360Id}
            onClose={() => setActiveCliente360Id(null)}
            formatBRL={formatBRL}
            onTriggerPDV={handleOpenPDVForCliente360}
            onTriggerOS={handleOpenOSForCliente360}
            onTriggerQuote={handleOpenQuoteForCliente360}
          />
        )}

        <Modal
          isOpen={!!selectedCustomerForHistory}
          onClose={() => setSelectedCustomerForHistory(null)}
          title={`Histórico: ${selectedCustomerForHistory?.name}`}
        >
          <div className="space-y-6">
            {selectedCustomerForHistory && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-500 uppercase">Total Comprado</p>
                    <p className="text-xl font-black text-rose-700">
                      R$ {sales.filter(s => s.customer_id === selectedCustomerForHistory.id).reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Atendimentos</p>
                    <p className="text-xl font-black text-indigo-700">
                      {sales.filter(s => s.customer_id === selectedCustomerForHistory.id).length}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedCustomerForPrint({ customer: selectedCustomerForHistory, type: 'A4' })}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm dark:bg-slate-800 dark:text-slate-100"
                  >
                    <Printer size={16} /> Relatório A4
                  </button>
                  <button
                    onClick={() => setSelectedCustomerForPrint({ customer: selectedCustomerForHistory, type: '80mm' })}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all text-sm"
                  >
                    <Printer size={16} /> Recibo 80mm
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {sales.filter(s => s.customer_id === selectedCustomerForHistory.id).length === 0 ? (
                    <p className="text-center text-slate-400 py-8 italic">Nenhuma movimentação encontrada para este cliente.</p>
                  ) : (
                    sales.filter(s => s.customer_id === selectedCustomerForHistory.id).map(sale => (
                      <div key={sale.id} className="p-4 bg-slate-50 rounded-xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${sale.type === 'Oficina' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                              }`}>
                              {sale.type === 'Oficina' ? 'ORDEM DE SERVIÇO' : 'VENDA BALCÃO'}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(sale.date).toLocaleDateString('pt-BR')} • {sale.id}</p>
                          </div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">R$ {sale.total.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          {(sale.items || sale.sale_items || []).filter(i => !i.description.includes('TAXA DE PARCELAMENTO') && !i.description.includes('AJUSTE DE TAXA/PRAZO') && !i.description.includes('TAXA DE CREDITO')).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                              <span>{item.quantity}x {item.description}</span>
                              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {sale.labor_value > 0 && (
                            <div className="flex justify-between text-[11px] text-amber-600 font-medium pt-1 border-t border-slate-400 dark:border-slate-700">
                              <span>Mão de Obra</span>
                              <span>R$ {sale.labor_value.toFixed(2)}</span>
                            </div>
                          )}
                          {sale.service_description && (
                            <div className="mt-2 p-2 bg-white rounded-lg border border-slate-400 italic text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              {sale.service_description}
                            </div>
                          )}

                          {/* Partial Payment Section */}
                          <div className="mt-4 p-3 bg-white rounded-xl border border-slate-400 shadow-sm space-y-2 dark:bg-slate-800 dark:border-slate-700">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className="text-slate-400">Total: R$ {sale.total.toFixed(2)}</span>
                              <span className="text-emerald-500">Pago: R$ {(sale.paid_total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-t border-slate-400 dark:border-slate-700">
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">Saldo Restante:</span>
                              <span className={`text-sm font-black ${sale.total - (sale.paid_total || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                R$ {(sale.total - (sale.paid_total || 0)).toFixed(2)}
                              </span>
                              {sale.payment_status === 'Pago' && (
                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase">PAGO</span>
                              )}
                            </div>

                            {sale.payment_method === 'Fiado' && sale.total - (sale.paid_total || 0) > 0 && (
                              <div className="pt-2">
                                {payingSaleId === sale.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-400 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20 dark:bg-slate-900 dark:border-slate-700"
                                      placeholder="Quanto pago?"
                                      value={partialPaymentAmount}
                                      onChange={(e) => setPartialPaymentAmount(e.target.value)}
                                    />
                                    <button
                                      onClick={() => handlePartialPayment(sale, partialPaymentAmount)}
                                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      onClick={() => { setPayingSaleId(null); setPartialPaymentAmount(''); }}
                                      className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all dark:bg-slate-800 dark:text-slate-400"
                                    >
                                      X
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setPayingSaleId(sale.id); setPartialPaymentAmount(''); }}
                                    className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                  >
                                    <DollarSign size={14} /> Registrar Pagamento Parcial
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Orçamento Modal */}
        <Modal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setEditingQuote(null);
          }}
          title={editingQuote ? "Editar Orçamento Profissional" : "Novo Orçamento Profissional"}
          maxWidth="max-w-5xl"
        >
          <form onSubmit={handleCreateQuote} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
              <div className="relative">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Cliente / Razão Social</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                    placeholder="Pesquisar ou digitar nome do cliente..."
                    value={quoteForm.customer_name}
                    onChange={e => {
                      setQuoteForm({ ...quoteForm, customer_name: e.target.value, customer_id: undefined });
                      setQuoteCustomerSearchTerm(e.target.value);
                    }}
                    onFocus={() => {
                      if (quoteForm.customer_name) setQuoteCustomerSearchTerm(quoteForm.customer_name);
                    }}
                  />
                </div>
                {quoteCustomerSearchTerm && (
                  <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-400 rounded-xl shadow-2xl max-h-48 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                    {sortedCustomers.filter(c => 
                      c.name.toLowerCase().includes(d_quoteCustomerSearch.toLowerCase()) ||
                      (c.nickname && c.nickname.toLowerCase().includes(d_quoteCustomerSearch.toLowerCase()))
                    ).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const customerMotos = motorcycles.filter(m => m.customer_id === c.id);
                          setQuoteForm({ 
                            ...quoteForm, 
                            customer_name: c.name, 
                            customer_id: c.id,
                            // Só preenche automático se tiver EXATAMENTE uma moto
                            motorcycle_details: customerMotos.length === 1 ? `${customerMotos[0].model} (${customerMotos[0].plate})` : ''
                          });
                          setQuoteCustomerSearchTerm('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-rose-50 flex justify-between items-center border-b border-slate-100 last:border-none transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 uppercase dark:text-slate-100">{c.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter dark:text-slate-400">
                            {c.nickname ? `${c.nickname} | ` : ''}{c.whatsapp}
                          </p>
                        </div>
                        <Plus size={14} className="text-rose-500" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQuoteCustomerSearchTerm('')}
                      className="w-full py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors dark:bg-slate-900"
                    >
                      Manter apenas texto digitado
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Motocicleta</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm dark:border-slate-700"
                  placeholder="Ex: Honda CG 160 (ABC-1234)"
                  value={quoteForm.motorcycle_details}
                  onChange={e => setQuoteForm({ ...quoteForm, motorcycle_details: e.target.value })}
                />
                
                {/* Lista de seleção rápida de motos do cliente */}
                {quoteForm.customer_id && motorcycles.filter(m => m.customer_id === parseInt(quoteForm.customer_id)).length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motos Cadastradas (Clique para selecionar)</p>
                    <div className="grid grid-cols-1 gap-1">
                      {motorcycles.filter(m => m.customer_id === parseInt(quoteForm.customer_id)).map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setQuoteForm({ ...quoteForm, motorcycle_details: `${m.model} (${m.plate})` })}
                          className={`text-left p-2 rounded-lg text-xs font-bold transition-all border ${quoteForm.motorcycle_details.includes(m.plate) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {m.model} <span className="opacity-60 ml-1">({m.plate})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Itens do Orçamento (Peças e Serviços)</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStockSelectorOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all flex items-center gap-1"
                  >
                    <Package size={14} /> Add do Estoque
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualQuoteItem({ description: '', quantity: '1', price: '' });
                      setActiveQuoteManualType('Peça');
                    }}
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-black uppercase hover:bg-slate-800 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Peça
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualQuoteItem({ description: '', quantity: '1', price: '' });
                      setActiveQuoteManualType('Serviço');
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-700 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Serviço
                  </button>
                </div>
              </div>

              {activeQuoteManualType && (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest dark:text-slate-400">Novo Item Manual: {activeQuoteManualType}</span>
                    <button onClick={() => setActiveQuoteManualType(null)} className="text-slate-400 hover:text-rose-500"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Nome da Peça/Serviço"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:border-rose-500 outline-none dark:bg-slate-800 dark:border-slate-700"
                        value={manualQuoteItem.description}
                        onChange={e => setManualQuoteItem({...manualQuoteItem, description: e.target.value})}
                        autoFocus
                      />
                    </div>
                    {activeQuoteManualType === 'Peça' && (
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qtd"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:border-rose-500 outline-none dark:bg-slate-800 dark:border-slate-700"
                          value={manualQuoteItem.quantity}
                          onChange={e => setManualQuoteItem({...manualQuoteItem, quantity: e.target.value})}
                        />
                      </div>
                    )}
                    <div className={activeQuoteManualType === 'Peça' ? 'col-span-3' : 'col-span-5'}>
                      <input
                        type="number"
                        placeholder="Preço R$"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:border-rose-500 outline-none dark:bg-slate-800 dark:border-slate-700"
                        value={manualQuoteItem.price}
                        onChange={e => setManualQuoteItem({...manualQuoteItem, price: e.target.value})}
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => {
                          const qty = Number(manualQuoteItem.quantity) || 1;
                          const val = Number(manualQuoteItem.price) || 0;
                          if (manualQuoteItem.description && val > 0) {
                            const newItem: QuoteItem = { 
                              description: manualQuoteItem.description.toUpperCase(), 
                              quantity: qty, 
                              price: val, 
                              total: qty * val, 
                              type: activeQuoteManualType 
                            };
                            setQuoteForm(prev => ({
                              ...prev,
                              items: [...prev.items, newItem],
                              total_value: prev.total_value + (qty * val)
                            }));
                            setActiveQuoteManualType(null);
                            setManualQuoteItem({ description: '', quantity: '1', price: '' });
                          } else {
                            alert("Preencha a descrição e o valor.");
                          }
                        }}
                        className="w-full h-full bg-rose-600 text-white rounded-lg flex items-center justify-center hover:bg-rose-700 transition-all"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-slate-400 rounded-2xl overflow-hidden dark:border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-center w-16">Qtd</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Descrição</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-24">Tipo</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right w-32">Valor Unit.</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right w-32">Subtotal</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 bg-white dark:bg-slate-800">
                    {quoteForm.items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-center font-bold text-slate-900 text-sm dark:text-slate-100">{item.quantity}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 text-sm uppercase dark:text-slate-100">{item.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${item.type === 'Peça' ? 'bg-black text-white' : 'bg-rose-100 text-rose-600'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-600 text-sm dark:text-slate-400">R$ {item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 text-sm dark:text-slate-100">R$ {item.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...quoteForm.items];
                              newItems.splice(idx, 1);
                              setQuoteForm({
                                ...quoteForm,
                                items: newItems,
                                total_value: quoteForm.total_value - item.total
                              });
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {quoteForm.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-300 text-xs italic">Nenhum item adicionado ao orçamento.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Total do Orçamento:</td>
                      <td className="px-6 py-4 text-right text-xl font-black text-rose-500">R$ {quoteForm.total_value.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Observações Técnicas</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 min-h-[100px] dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                  placeholder="Detalhes sobre o estado da moto, recomendações, etc..."
                  value={quoteForm.observations}
                  onChange={e => setQuoteForm({ ...quoteForm, observations: e.target.value })}
                ></textarea>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Validade (Dias)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                    value={quoteForm.validity_days}
                    onChange={e => setQuoteForm({ ...quoteForm, validity_days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Termos de Garantia</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                    value={quoteForm.warranty_terms}
                    onChange={e => setQuoteForm({ ...quoteForm, warranty_terms: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-400 space-y-4 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowQuoteCalculator(!showQuoteCalculator)}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              >
                <Calculator size={18} />
                {showQuoteCalculator ? 'Esconder Calculadora de Juros' : 'Abrir Calculadora de Juros/Taxas'}
              </button>

              {showQuoteCalculator && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <VendaCalculator
                    initialCost={quoteForm.items.reduce((acc, curr) => acc + curr.total, 0)}
                    cardFees={cardFeesSettings}
                    onApply={(newTotal) => {
                      const currentTotal = quoteForm.items.reduce((acc, curr) => acc + curr.total, 0);
                      const diff = newTotal - currentTotal;
                      if (diff > 0) {
                        setQuoteForm({
                          ...quoteForm,
                          items: [
                            ...quoteForm.items,
                            { description: 'AJUSTE DE TAXA/PRAZO CALCULADO', quantity: 1, price: diff, total: diff, type: 'Serviço' }
                          ],
                          total_value: newTotal
                        });
                        alert('Diferença aplicada ao orçamento!');
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-slate-100"
                >
                  Salvar Orçamento
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Stock Selector Modal for Quotes */}
        <Modal
          isOpen={isStockSelectorOpen}
          onClose={() => setIsStockSelectorOpen(false)}
          title="Selecionar Peça do Estoque"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar no estoque..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium dark:bg-slate-900 dark:border-slate-700"
                value={stockSearchTerm}
                onChange={e => setStockSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto border border-slate-400 rounded-2xl dark:border-slate-700">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 z-10 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produto / SKU</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Preço de Venda</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Disponível</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {sortedProducts
                    .filter(p => {
                      const search = d_stockSearchTerm.toLowerCase();
                      return (
                        (p.description || '').toLowerCase().includes(search) ||
                        (p.sku || '').toLowerCase().includes(search) ||
                        (p.alt_code || '').toLowerCase().includes(search) ||
                        (p.barcode || '').toLowerCase().includes(search)
                      );
                    })
                    .map(product => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-sm uppercase dark:text-slate-100">{product.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono dark:text-slate-400">{product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-black text-slate-900 text-sm dark:text-slate-100">R$ {product.sale_price.toFixed(2)}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${product.stock > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {product.stock} {product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newItem: QuoteItem = {
                                description: product.description,
                                quantity: 1,
                                price: product.sale_price,
                                total: product.sale_price,
                                type: 'Peça'
                              };
                              setQuoteForm(prev => ({
                                ...prev,
                                items: [...prev.items, newItem],
                                total_value: prev.total_value + product.sale_price
                              }));
                              setIsStockSelectorOpen(false);
                              setStockSearchTerm('');
                            }}
                            className="p-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                          >
                            <Plus size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {sortedProducts.filter(p => {
                    const search = d_stockSearchTerm.toLowerCase();
                    return (
                      (p.description || '').toLowerCase().includes(search) ||
                      (p.sku || '').toLowerCase().includes(search)
                    );
                  }).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs italic">Nenhum produto encontrado.</td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
            setCustomerForm({ name: '', nickname: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1, image_url: '' });
          }}
          title={editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 bg-slate-100 border-2 border-slate-200 rounded-[2rem] overflow-hidden group shadow-inner flex items-center justify-center dark:bg-slate-800 dark:border-slate-700">
                {customerForm.image_url ? (
                  <img src={customerForm.image_url} alt="Foto do Cliente" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase">Foto do Cliente</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleCustomerImageUpload} 
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Toque para capturar foto</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome Completo</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.name}
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Apelido (Como é chamado)</label>
                <input
                  type="text"
                  placeholder="Ex: Dequinha, João do Pneu"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.nickname}
                  onChange={e => setCustomerForm({ ...customerForm, nickname: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">CPF (Opcional)</label>
                <input
                  type="text" placeholder="000.000.000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.cpf}
                  onChange={e => setCustomerForm({ ...customerForm, cpf: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">CNPJ (Opcional)</label>
                <input
                  type="text" placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.cnpj}
                  onChange={e => setCustomerForm({ ...customerForm, cnpj: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Celular (Opcional)</label>
                <input
                  type="text" placeholder="5511999999999"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.whatsapp}
                  onChange={e => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Limite de Crédito (R$)</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-rose-600 dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.credit_limit}
                  onChange={e => setCustomerForm({ ...customerForm, credit_limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">CEP (Opcional)</label>
                <input
                  type="text" placeholder="00000-000"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.zip_code}
                  onChange={e => setCustomerForm({ ...customerForm, zip_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Cidade (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.city}
                  onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Bairro (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.neighborhood}
                  onChange={e => setCustomerForm({ ...customerForm, neighborhood: e.target.value })}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Endereço (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={customerForm.address}
                  onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Multa por Atraso (%)</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  value={customerForm.fine_rate}
                  onChange={e => setCustomerForm({ ...customerForm, fine_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Juros Mensais (%)</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  value={customerForm.interest_rate}
                  onChange={e => setCustomerForm({ ...customerForm, interest_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
              {editingCustomer ? "Atualizar Cliente" : "Salvar Cliente"}
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
            setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '', image_url2: '', image_url3: '', image_url4: '', brand: '', location: '', application: '', distributor: '', alt_code: '' });
          }}
          title={editingProduct ? "Editar Produto" : "Adicionar Produto ao Estoque"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Coluna da Esquerda - Dados do Produto */}
            <div className="md:col-span-3 space-y-3">
              {/* Linha 1: Descrição do Produto | Marca */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Descrição do Produto</label>
                  </div>
                  <input
                    type="text" required autoFocus tabIndex={1} placeholder="Ex: Pneu Traseiro 90/90-18"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Marca</label>
                  <input
                    type="text" tabIndex={2} placeholder="Ex: Honda, Pirelli"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.brand}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>
              </div>

              {/* Linha 2: Distribuidor | Código Alternativo (Similar) | Localização no Estoque */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Distribuidor</label>
                  <input
                    type="text" tabIndex={3} placeholder="Ex: Distribuidora X"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.distributor}
                    onChange={e => setProductForm({ ...productForm, distributor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Cod. Alternativo</label>
                  <input
                    type="text" tabIndex={4} placeholder="Ex: Similar X"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.alt_code}
                    onChange={e => setProductForm({ ...productForm, alt_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Localização</label>
                  <input
                    type="text" tabIndex={5} placeholder="Ex: Prateleira A"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.location}
                    onChange={e => setProductForm({ ...productForm, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Linha 3: SKU / Código Interno | Código de Barras (EAN) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">SKU / Código Interno (Vazio para autogerar)</label>
                  <input
                    type="text" tabIndex={6} placeholder="Autogerado se vazio"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Código de Barras (EAN)</label>
                  <input
                    type="text" tabIndex={7} placeholder="Ex: EAN"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.barcode}
                    onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                  />
                </div>
              </div>

              {/* Linha 4: Unidade de Medida | Estoque Inicial | Preço Compra (R$) | Preço Venda (R$) */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Unidade</label>
                  <select
                    tabIndex={8}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.unit}
                    onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                  >
                    <option value="Unitário">Unitário</option>
                    <option value="Par">Par</option>
                    <option value="Kit">Kit</option>
                    <option value="Litro">Litro</option>
                    <option value="Conjunto">Conjunto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Est. Inicial</label>
                  <input
                    type="number" required tabIndex={9}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Compra (R$)</label>
                  <input
                    type="number" step="0.01" required tabIndex={10}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={productForm.purchase_price}
                    onChange={e => setProductForm({ ...productForm, purchase_price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Venda (R$)</label>
                  <input
                    type="number" step="0.01" required tabIndex={11}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-rose-600 dark:bg-slate-900 dark:border-slate-700"
                    value={productForm.sale_price}
                    onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })}
                  />
                </div>
              </div>

              {/* Linha 5: Aplicação das Peças */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">Aplicação das Peças</label>
                <textarea
                  tabIndex={12}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-400 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none h-12 dark:bg-slate-900 dark:border-slate-700"
                  placeholder="Ex: Honda CG 160 (2016-2023), Fan, Titan..."
                  value={productForm.application}
                  onChange={e => setProductForm({ ...productForm, application: e.target.value })}
                />
              </div>

              {/* Painel IA Kombat Assistant para Cadastros Rápidos */}
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2 relative overflow-hidden shadow-inner mt-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-red-600/10 text-red-500 rounded-md">
                    <Sparkles size={14} className={isAutofilling ? "animate-spin" : "animate-pulse"} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">IA Kombat Assistant</h4>
                    <p className="text-[10px] text-zinc-400">Cole informações desorganizadas e deixe a IA extrair tudo (preços, estoque, marcas, etc).</p>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    id="aiPromptInput"
                    className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-700 rounded-lg focus:ring-1 focus:ring-red-500 outline-none resize-none h-16 text-zinc-200 placeholder-zinc-600"
                    placeholder="Ex: Pneu traseiro 90/90-18 pirelli custa 90 vender por 150 estoque 10 prat A"
                  />
                  <button 
                    type="button"
                    onClick={handleAutofillWithAI}
                    disabled={isAutofilling}
                    className="absolute right-2 bottom-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    {isAutofilling ? "Gerando..." : "Autopreencher com IA"}
                  </button>
                </div>
              </div>
            </div>

            {/* Coluna da Direita - Fotos e Ação */}
            <div className="md:col-span-2 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-tight dark:text-slate-100">Fotos do Produto</label>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'image_url', label: 'Capa' },
                    { key: 'image_url2', label: 'Foto 2' },
                    { key: 'image_url3', label: 'Foto 3' },
                    { key: 'image_url4', label: 'Foto 4' }
                  ].map((photo) => (
                    <div key={photo.key} className="space-y-1">
                      <div className="relative aspect-square bg-slate-100 border border-slate-350 rounded-xl overflow-hidden group dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center">
                        {(productForm as any)[photo.key] ? (
                          <img src={(productForm as any)[photo.key]} alt={photo.label} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon size={20} />
                            <span className="text-[9px] font-bold uppercase mt-0.5">{photo.label}</span>
                          </div>
                        )}
                        
                        <label className={`absolute inset-0 bg-black/40 ${!(productForm as any)[photo.key] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} flex items-center justify-center cursor-pointer transition-all`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <Camera size={16} className="text-white" />
                            <span className="text-[8px] text-white font-bold uppercase">Capturar</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            onChange={(e) => handleProductFormImageUpload(e, photo.key)}
                          />
                        </label>
                        
                        {(productForm as any)[photo.key] && (
                          <button 
                            type="button"
                            onClick={() => setProductForm({ ...productForm, [photo.key]: '' })}
                            className="absolute top-1 right-1 p-0.5 bg-white/80 text-rose-600 rounded-full hover:bg-white shadow-sm transition-all dark:bg-slate-800"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="URL..."
                        className="w-full text-[9px] px-1.5 py-0.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-rose-500 dark:bg-slate-800 dark:border-slate-700"
                        value={(productForm as any)[photo.key]}
                        onChange={e => setProductForm({ ...productForm, [photo.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" tabIndex={13} className="w-full py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-100/50 dark:shadow-none mt-2">
                {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isMotorcycleModalOpen}
          onClose={() => setIsMotorcycleModalOpen(false)}
          title="Cadastrar Moto para Cliente"
        >
          <form onSubmit={handleAddMotorcycle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Modelo da Moto</label>
              <input
                type="text" required placeholder="Ex: Honda CG 160"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                value={motorcycleForm.model}
                onChange={e => setMotorcycleForm({ ...motorcycleForm, model: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Placa</label>
                <div className="flex items-center">
                  <input
                    type="text" required placeholder="ABC-1234"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-400 border-r-0 rounded-l-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 uppercase h-[42px]"
                    value={motorcycleForm.plate}
                    onChange={e => setMotorcycleForm({ ...motorcycleForm, plate: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleLookupPlateWithAI}
                    disabled={isLookingUpPlate}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-r-xl flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap h-[42px] disabled:opacity-50"
                  >
                    <Sparkles size={12} className={isLookingUpPlate ? "animate-spin" : ""} />
                    {isLookingUpPlate ? "Buscando..." : "Buscar IA"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">KM Atual</label>
                <input
                  type="number" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={motorcycleForm.current_km}
                  onChange={e => setMotorcycleForm({ ...motorcycleForm, current_km: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
              Salvar Moto
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={isDistributorModalOpen}
          onClose={() => {
            setIsDistributorModalOpen(false);
            setEditingDistributor(null);
            setDistributorForm({ name: '', phone: '', contact_person: '' });
          }}
          title={editingDistributor ? "Editar Distribuidor" : "Cadastrar Novo Distribuidor"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddDistributor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome do Distribuidor</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
                  value={distributorForm.name}
                  onChange={e => setDistributorForm({ ...distributorForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Telefone (WhatsApp)</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
                  value={distributorForm.phone}
                  onChange={e => setDistributorForm({ ...distributorForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Pessoa de Contato (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  value={distributorForm.contact_person}
                  onChange={e => setDistributorForm({ ...distributorForm, contact_person: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              {editingDistributor ? "Salvar Alterações" : "Cadastrar Distribuidor"}
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          title="Novo Lead de Venda"
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddLead} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome do Cliente</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={leadForm.name}
                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Empresa / Frota</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={leadForm.company}
                  onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">WhatsApp</label>
                <input
                  type="text" required placeholder="Ex: 11999999999"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={leadForm.phone}
                  onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Valor Estimado (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={leadForm.value}
                  onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Prioridade</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:bg-slate-900 dark:border-slate-700"
                  value={leadForm.priority}
                  onChange={e => setLeadForm({ ...leadForm, priority: e.target.value })}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              Criar Lead
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          title="Enviar Resumo ao Cliente"
        >
          {selectedLead && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap dark:text-slate-400">
                  {`Olá ${selectedLead.name}, aqui é da Kombat Moto Peças.\n\nEstamos processando sua solicitação para ${selectedLead.company}.\nValor estimado: R$ ${selectedLead.value.toFixed(2)}\nStatus atual: ${selectedLead.status}\n\nPodemos prosseguir com a negociação?`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const msg = `Olá ${selectedLead.name}, aqui é da Kombat Moto Peças.\n\nEstamos processando sua solicitação para ${selectedLead.company}.\nValor estimado: R$ ${selectedLead.value.toFixed(2)}\nStatus atual: ${selectedLead.status}\n\nPodemos prosseguir com a negociação?`;
                    window.open(`https://wa.me/${selectedLead.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    const msg = `Olá ${selectedLead.name}, aqui é da Kombat Moto Peças.\n\nEstamos processando sua solicitação para ${selectedLead.company}.\nValor estimado: R$ ${selectedLead.value.toFixed(2)}\nStatus atual: ${selectedLead.status}\n\nPodemos prosseguir com a negociação?`;
                    window.location.href = `mailto:?subject=Resumo de Negociação - Kombat Moto Peças&body=${encodeURIComponent(msg)}`;
                  }}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  E-mail
                </button>
              </div>
            </div>
          )}
        </Modal>
        <Modal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          title="Finalizar Recebimento - Caixa PDV"
          maxWidth="max-w-4xl"
        >
          {(() => {
            const itemsBaseTotal = pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
            const subtotalWithDiscount = Math.max(0, itemsBaseTotal - (pdvForm.discount || 0));
            let total = subtotalWithDiscount;
            
            if (pdvForm.sale_condition === 'Prazo') {
              const fee = cardFeesSettings[pdvForm.installments] || 0;
              const divisor = 1 - (fee / 100);
              total = divisor > 0 ? (subtotalWithDiscount / divisor) : subtotalWithDiscount;
            }

            const paymentReceivedNum = parseFloat(checkoutPaymentReceived.replace(',', '.')) || 0;
            const change = Math.max(0, paymentReceivedNum - total);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Summary of Venda */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider">Resumo do Cupom</h3>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      <div className="flex justify-between py-2.5 text-sm">
                        <span className="text-slate-500">Itens no carrinho:</span>
                        <span className="font-bold text-slate-950 dark:text-slate-100">{pdvForm.items.length} itens</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-sm">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-bold text-slate-950 dark:text-slate-100">{formatBRL(itemsBaseTotal)}</span>
                      </div>
                      {pdvForm.discount > 0 && (
                        <div className="flex justify-between py-2.5 text-sm text-emerald-600">
                          <span>Desconto Aplicado:</span>
                          <span className="font-bold">-{formatBRL(pdvForm.discount)}</span>
                        </div>
                      )}
                      {pdvForm.sale_condition === 'Prazo' && (
                        <div className="flex justify-between py-2.5 text-sm text-rose-500">
                          <span>Taxa de Parcelamento ({pdvForm.installments}x):</span>
                          <span className="font-bold">
                            +{formatBRL(total - subtotalWithDiscount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-xs uppercase font-black text-slate-400 tracking-wider block mb-1">Total a Pagar</span>
                    <span className="text-4xl font-black text-rose-600 block">{formatBRL(total)}</span>
                  </div>
                </div>

                {/* Right Side: Payment Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-black text-slate-400 mb-2 tracking-wider">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Pix', label: 'PIX / Transferência' },
                        { id: 'Cartão', label: 'Cartão (Deb/Cred)' },
                        { id: 'Dinheiro', label: 'Dinheiro' },
                        { id: 'Fiado', label: 'A Prazo / Fiado' },
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            setPdvForm({ 
                              ...pdvForm, 
                              payment_method: method.id as any,
                              due_date: method.id === 'Fiado' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : pdvForm.due_date
                            });
                          }}
                          className={`py-3 px-4 rounded-xl text-xs font-black border transition-all text-center flex items-center justify-center ${pdvForm.payment_method === method.id
                            ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                            : 'bg-white border-slate-400 text-slate-700 hover:border-rose-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500'
                            }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional inputs */}
                  {pdvForm.payment_method === 'Dinheiro' && (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl dark:bg-emerald-950/20 dark:border-emerald-900/30 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase font-black text-emerald-700 dark:text-emerald-400 mb-1.5">Valor Recebido</label>
                          <input
                            type="text"
                            placeholder="R$ 0,00"
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:border-emerald-800 dark:text-slate-100"
                            value={checkoutPaymentReceived}
                            onChange={e => setCheckoutPaymentReceived(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-black text-emerald-700 dark:text-emerald-400 mb-1.5">Troco</label>
                          <span className="block text-2xl font-black text-emerald-600 mt-1">
                            {formatBRL(change)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {pdvForm.payment_method === 'Fiado' && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl dark:bg-amber-950/20 dark:border-amber-900/30 animate-in fade-in duration-200">
                      <label className="block text-xs uppercase font-black text-amber-700 dark:text-amber-400 mb-1.5">Data de Vencimento</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-slate-950 dark:bg-slate-800 dark:border-amber-800 dark:text-slate-100"
                        value={pdvForm.due_date}
                        onChange={e => setPdvForm({ ...pdvForm, due_date: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-black text-slate-400 mb-1.5">Condição</label>
                      <select
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-400 rounded-xl font-bold outline-none dark:bg-slate-900 dark:border-slate-700 text-slate-950 dark:text-slate-100"
                        value={pdvForm.sale_condition}
                        onChange={e => setPdvForm({ ...pdvForm, sale_condition: e.target.value as any })}
                      >
                        <option value="Vista">À Vista</option>
                        <option value="Prazo">A Prazo</option>
                      </select>
                    </div>

                    {pdvForm.sale_condition === 'Prazo' && (
                      <div>
                        <label className="block text-xs uppercase font-black text-slate-400 mb-1.5">Parcelas</label>
                        <select
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-400 rounded-xl font-bold outline-none dark:bg-slate-900 dark:border-slate-700 text-slate-950 dark:text-slate-100"
                          value={pdvForm.installments}
                          onChange={e => setPdvForm({ ...pdvForm, installments: parseInt(e.target.value) || 1 })}
                        >
                          {Object.keys(cardFeesSettings).map(num => (
                            <option key={num} value={num}>{num}x</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCompleteSale}
                    className="w-full mt-4 py-4 bg-rose-600 text-white rounded-2xl font-black text-lg hover:bg-rose-700 transition-all shadow-lg hover:shadow-rose-600/20 active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    Confirmar e Emitir Cupom
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>

        <Modal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          title={editingService ? "Editar Serviço" : "Cadastrar Novo Serviço"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Descrição do Serviço</label>
              <input
                type="text"
                placeholder="Ex: Troca de Óleo, Limpeza de Carburador..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                value={serviceForm.description}
                onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Preço Sugerido (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Categoria (Opcional)</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                value={serviceForm.category}
                onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
              >
                <option value="">Geral</option>
                <option value="Mecânica">Mecânica</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Revisão">Revisão</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <button
              onClick={handleSaveService}
              className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 mt-4"
            >
              {editingService ? "Salvar Alterações" : "Cadastrar Serviço"}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={!!selectedCustomerForPrint}
          onClose={() => setSelectedCustomerForPrint(null)}
          title={selectedCustomerForPrint?.type === 'A4' ? "Relatório de Histórico (A4)" : "Recibo de Histórico (80mm)"}
          maxWidth={selectedCustomerForPrint?.type === 'A4' ? "max-w-6xl" : "max-w-lg"}
        >
          {selectedCustomerForPrint && (
            <div id="customer-history-print-content" className={`bg-white p-8 rounded-2xl border border-slate-400 print-area ${selectedCustomerForPrint.type === 'A4' ? 'print-landscape print-a4' : 'print-receipt font-bold text-[15px] w-[80mm] mx-auto overflow-visible print:p-0'}`} style={selectedCustomerForPrint.type === '80mm' ? { fontFamily: '"Arial Black", Gadget, sans-serif' } : {}}>
              <style>{selectedCustomerForPrint.type === '80mm' ? `
                @media print {
                  @page { margin: 0; size: 80mm auto; }
                  body { margin: 0; padding: 0; page: receipt-page !important; }
                  .no-print { display: none !important; }
                  #customer-history-print-content { page: receipt-page !important; }
                }
              ` : `
                @media print {
                  @page { size: A4; margin: 5mm; }
                  body { page: a4-page !important; }
                  #customer-history-print-content { page: a4-page !important; }
                }
              `}</style>
              <div className={`text-center border-b-2 border-slate-900 pb-4 mb-4 ${selectedCustomerForPrint.type === '80mm' ? 'border-dashed' : ''}`}>
                <h3 className={`${selectedCustomerForPrint.type === 'A4' ? 'text-2xl' : 'text-[18px]'} font-black text-slate-900 uppercase`}>Histórico de Movimentação</h3>
                <p className={`${selectedCustomerForPrint.type === 'A4' ? 'text-lg' : 'text-[16px]'} font-black text-slate-900`}>KOMBAT MOTO PEÇAS</p>
                <div className={`flex ${selectedCustomerForPrint.type === 'A4' ? 'justify-center gap-8' : 'flex-col items-center'} mt-2 ${selectedCustomerForPrint.type === '80mm' ? 'text-[13px]' : 'text-[10px]'}`}>
                  <p><strong>Cliente:</strong> {selectedCustomerForPrint.customer.name}</p>
                  <p><strong>Emissão:</strong> {new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {selectedCustomerForPrint.type === 'A4' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-[10px] uppercase font-black">
                        <th className="py-2 px-1">Data</th>
                        <th className="py-2 px-1">Tipo</th>
                        <th className="py-2 px-1">ID</th>
                        <th className="py-2 px-1">Itens / Serviços</th>
                        <th className="py-2 px-1 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.filter(s => s.customer_id === selectedCustomerForPrint.customer.id).map(sale => (
                        <tr key={sale.id} className="border-b border-slate-400 text-[10px] dark:border-slate-700">
                          <td className="py-2 px-1 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2 px-1">
                            <span className={`font-bold ${sale.type === 'Oficina' ? 'text-amber-600' : 'text-indigo-600'}`}>
                              {sale.type === 'Oficina' ? 'O.S.' : 'BALCÃO'}
                            </span>
                          </td>
                          <td className="py-2 px-1 font-mono">{sale.id}</td>
                          <td className="py-2 px-1">
                            <div className="flex flex-col gap-1 min-w-[300px]">
                              {(sale.items || sale.sale_items || []).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-slate-700 leading-tight dark:text-slate-100">
                                  <span className="flex-1">{item.quantity}x {item.description}</span>
                                  <span className="text-[9px] text-slate-400 font-mono text-right ml-4">
                                    R$ {(item.quantity * item.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {sale.labor_value > 0 && (
                                <div className="flex justify-between items-center text-amber-700 font-bold border-t border-slate-200 mt-1 pt-1 leading-tight dark:border-slate-700">
                                  <span className="flex-1">SERVIÇOS / MÃO DE OBRA</span>
                                  <span className="text-[9px] font-mono text-right ml-4">
                                    R$ {sale.labor_value.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {sale.service_description && (
                                <p className="text-[8px] text-slate-500 italic mt-1 bg-slate-50 p-1 rounded-sm dark:bg-slate-900 dark:text-slate-400">
                                  Obs: {sale.service_description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1 text-right font-black">R$ {sale.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black">
                        <td colSpan={4} className="py-3 px-4 text-right uppercase">Total Acumulado:</td>
                        <td className="py-3 px-4 text-right">
                          R$ {sales.filter(s => s.customer_id === selectedCustomerForPrint.customer.id).reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales.filter(s => s.customer_id === selectedCustomerForPrint.customer.id).map(sale => (
                    <div key={sale.id} className="border-b border-dashed border-slate-900 pb-2 mb-2">
                      <div className="flex justify-between font-black text-[14px]">
                        <span>{new Date(sale.date).toLocaleDateString('pt-BR')} - {sale.id.substring(0,8).toUpperCase()}</span>
                        <span>R$ {sale.total.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1 dark:text-slate-400">
                        {sale.type === 'Oficina' ? 'Ordem de Serviço' : 'Venda Balcão'}
                      </p>
                      
                      {/* LISTA DE PRODUTOS NO RECIBO TÉRMICO */}
                      <div className="pl-1 space-y-1 mb-1">
                        {(sale.items || sale.sale_items || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[13px] text-slate-900 font-bold dark:text-slate-100">
                            <span>{item.quantity}x {item.description.substring(0, 25)}..</span>
                            <span className="font-mono">R$ {(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                        {sale.labor_value > 0 && (
                          <div className="flex justify-between text-[13px] text-slate-900 font-bold border-t border-slate-400 pt-0.5 mt-1 dark:text-slate-100 dark:border-slate-700">
                            <span>MÃO DE OBRA / SERVIÇOS</span>
                            <span className="font-mono">R$ {sale.labor_value.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {sale.service_description && (
                        <p className="text-[11px] text-slate-700 italic bg-slate-50 p-1 border-l border-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                          OBS: {sale.service_description}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-black text-sm">
                    <span>TOTAL ACUMULADO:</span>
                    <span>R$ {sales.filter(s => s.customer_id === selectedCustomerForPrint.customer.id).reduce((acc, s) => acc + s.total, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className={`mt-6 pt-4 border-t border-dashed border-slate-400 ${selectedCustomerForPrint.type === 'A4' ? 'grid grid-cols-2 gap-8' : 'space-y-4'} text-center no-print`}>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[9px] font-bold text-rose-500 uppercase">Saldo de Crédito Atual</p>
                  <p className="text-xl font-black text-rose-700">R$ {getCustomerRemainingCredit(selectedCustomerForPrint.customer.id).toFixed(2)}</p>
                </div>
                <button
                  onClick={handlePrintCustomerHistory}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={!!selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          title="Recibo de Venda"
          maxWidth="max-w-lg"
        >
          {selectedSaleForReceipt && (
            <div id="receipt-content" className="bg-white p-4 text-[15px] leading-tight text-black w-[80mm] mx-auto overflow-visible print:p-0 font-bold dark:bg-slate-800 print-receipt" style={{ fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif' }}>
              <style>{`
                @media print {
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                  html, body {
                    page: receipt-page !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    background: white !important;
                    width: 80mm !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color: black !important;
                  }
                  .no-print { display: none !important; }
                  
                  #receipt-content {
                    page: receipt-page !important;
                    width: 72mm !important;
                    margin: 0 auto !important;
                    padding: 0 !important;
                    display: block !important;
                    background: white !important;
                    height: auto !important;
                    overflow: visible !important;
                    color: black !important;
                  }
                  #receipt-content * {
                    color: black !important;
                  }
                }
              `}</style>

              {/* ================================================== */}
              {/* CLIENT RECEIPT */}
              {/* ================================================== */}
              <div className="client-receipt">
                <div style={{ textAlign: 'center', marginBottom: '4px', fontWeight: 'bold' }}>
                  <h4 style={{ fontWeight: '900', fontSize: '15px', margin: '0' }}>KOMBAT MOTO PECAS</h4>
                  <p style={{ margin: '0', fontSize: '11px' }}>CNPJ: 12.802.931/0001-92</p>
                  <p style={{ margin: '0', fontSize: '11px' }}>R PARANA, 342 - CENTRO, Andirá / PR</p>
                  <p style={{ margin: '0', fontSize: '11px' }}>Tel (43) 3538-4537 | Email: kombatpecas@gmail.com</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '900', textDecoration: 'underline' }}>RECIBO DO CLIENTE</p>
                </div>

                <div style={{ borderTop: '1px dashed black', margin: '2px 0' }}></div>

                <table style={{ width: '100%', fontSize: '12px', fontWeight: 'bold' }}>
                  <tbody>
                    <tr>
                      <td>Venda: {selectedSaleForReceipt.id}</td>
                      <td style={{ textAlign: 'center' }}>Data: {new Date(selectedSaleForReceipt.date).toLocaleDateString('pt-BR')}</td>
                      <td style={{ textAlign: 'right' }}>Hora: {new Date(selectedSaleForReceipt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed black', margin: '2px 0' }}></div>

                {/* Customer Info */}
                <div style={{ padding: '2px 0' }}>
                  <p style={{ fontWeight: 'bold' }}>Cliente: {selectedSaleForReceipt.customer_id || '---'} - {(selectedSaleForReceipt.customer_name || 'Consumidor Final').toUpperCase()}</p>
                  {(() => {
                    const customer = customers.find(c => c.id === selectedSaleForReceipt.customer_id);
                    if (customer) {
                      return (
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          <p>TEL: {customer.whatsapp || '---'} | {customer.cpf ? `CPF: ${customer.cpf}` : (customer.cnpj ? `CNPJ: ${customer.cnpj}` : '')}</p>
                          <p>End: {customer.address || ''} {customer.neighborhood ? ` - ${customer.neighborhood}` : ''}</p>
                          <p>Cidade: {customer.city || 'Andirá'} / PR</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="border-t border-dashed border-black my-1"></div>

                {/* Vehicle Info */}
                <div style={{ padding: '4px 0', fontSize: '12px', fontWeight: 'bold' }}>
                  {selectedSaleForReceipt.moto_details ? (
                    <div>
                      <p style={{ fontWeight: '900' }}>Placa: {selectedSaleForReceipt.moto_details.match(/\((.*?)\)/)?.[1] || '-'}</p>
                      <p>Veículo: {selectedSaleForReceipt.moto_details.split('(')[0] || '-'}</p>
                    </div>
                  ) : (
                    <p>Veículo: Não informado</p>
                  )}
                  <p>KM Atual: {selectedSaleForReceipt.km || selectedSaleForReceipt.moto_details?.split('KM: ')?.[1] || '-'}</p>
                </div>
                <div className="border-t border-dashed border-black my-1"></div>

                {/* Observations */}
                {selectedSaleForReceipt.service_description && (
                  <div style={{ padding: '2px 0' }}>
                    <p style={{ fontWeight: 'bold' }}>Observações:</p>
                    <p style={{ fontSize: '10px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selectedSaleForReceipt.service_description}</p>
                  </div>
                )}
                {selectedSaleForReceipt.service_description && <div className="border-t border-dashed border-black my-1"></div>}

                {/* Items Section */}
                <div className="py-1">
                  {/* Filter items for client (exclude Adicional Interno) */}
                  {(() => {
                    const clientItems = (selectedSaleForReceipt.items || selectedSaleForReceipt.sale_items || []).filter(i => i.type !== 'Adicional Interno');
                    const principalService = clientItems.find(i => i.type === 'Serviço Principal') || {
                      description: 'MÃO DE OBRA / SERVIÇOS AVULSOS',
                      price: selectedSaleForReceipt.labor_value || 0,
                      quantity: 1
                    };
                    const partsItems = clientItems.filter(i => (i.product_id || i.type === 'Peça') && !i.description.includes('TAXA DE PARCELAMENTO') && !i.description.includes('AJUSTE DE TAXA/PRAZO') && !i.description.includes('TAXA DE CREDITO'));
                    const otherServices = clientItems.filter(i => !i.product_id && i.type === 'Serviço' && i.type !== 'Serviço Principal');
                    const feesItems = clientItems.filter(i => i.description.includes('TAXA DE PARCELAMENTO') || i.description.includes('AJUSTE DE TAXA/PRAZO') || i.description.includes('TAXA DE CREDITO'));

                    const totalParts = partsItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                    const totalLabor = principalService.price + otherServices.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                    const totalFeesVal = feesItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

                    return (
                      <>
                        {/* Principal Service */}
                        {principalService.price > 0 && (
                          <div style={{ marginBottom: '4px' }}>
                            <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '4px' }}>SERVIÇO REALIZADO</p>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                              <tbody>
                                <tr>
                                  <td style={{ paddingTop: '2px' }}>- Serviço principal: {principalService.description.toUpperCase()}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px dotted black' }}>
                                  <td style={{ textAlign: 'right', fontWeight: '900' }}>
                                    Valor da mão de obra: R$ {principalService.price.toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Other Services */}
                        {otherServices.length > 0 && (
                          <div style={{ marginBottom: '4px', marginTop: '4px' }}>
                            <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '4px' }}>OUTROS SERVIÇOS</p>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                              <tbody>
                                {otherServices.map((item, idx) => (
                                  <React.Fragment key={idx}>
                                    <tr>
                                      <td style={{ paddingTop: '2px', fontWeight: 'bold' }}>{(item.description || '').toUpperCase()}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px dotted black' }}>
                                      <td style={{ textAlign: 'left', paddingLeft: '8px' }}>{item.quantity}</td>
                                      <td style={{ textAlign: 'left' }}>x R$ {(item.price || 0).toFixed(2)} =</td>
                                      <td style={{ textAlign: 'right', fontWeight: '900' }}>R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                    </tr>
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Parts & Products */}
                        {partsItems.length > 0 && (
                          <div style={{ marginBottom: '4px', marginTop: '4px' }}>
                            <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '4px' }}>PEÇAS E PRODUTOS</p>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                              <tbody>
                                {partsItems.map((item, idx) => (
                                  <React.Fragment key={idx}>
                                    <tr>
                                      <td style={{ paddingTop: '2px', width: '20%' }}>{item.product_id || '---'}</td>
                                      <td style={{ paddingTop: '2px', fontWeight: 'bold' }}>{(item.description || '').toUpperCase()}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px dotted black' }}>
                                      <td style={{ textAlign: 'left', paddingLeft: '8px' }}>{item.quantity}</td>
                                      <td style={{ textAlign: 'left' }}>x R$ {(item.price || 0).toFixed(2)} =</td>
                                      <td style={{ textAlign: 'right', fontWeight: '900' }}>R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                    </tr>
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Fees / Adjustments */}
                        {feesItems.length > 0 && (
                          <div style={{ marginBottom: '4px', marginTop: '4px' }}>
                            <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '4px' }}>TAXAS / AJUSTES</p>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                              <tbody>
                                {feesItems.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px dotted black' }}>
                                    <td style={{ paddingTop: '2px', fontWeight: 'bold' }}>{(item.description || '').toUpperCase()}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '900' }}>R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>

                        {/* Totals table */}
                        <table style={{ width: '100%', fontSize: '11px', fontWeight: 'bold' }}>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'left' }}>Total de mão de obra:</td>
                              <td style={{ textAlign: 'right' }}>R$ {totalLabor.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{ textAlign: 'left' }}>Total de peças/produtos:</td>
                              <td style={{ textAlign: 'right' }}>R$ {(totalParts + totalFeesVal).toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderTop: '1.5px solid black', fontWeight: '900', fontSize: '16px' }}>
                              <td style={{ textAlign: 'left', paddingTop: '4px', textDecoration: 'underline' }}>TOTAL A PAGAR:</td>
                              <td style={{ textAlign: 'right', paddingTop: '4px', textDecoration: 'underline' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    );
                  })()}
                </div>

                {/* Payment Info */}
                <div style={{ marginTop: '6px', paddingTop: '2px', borderTop: '1px dashed black' }}>
                  <table style={{ width: '100%', fontSize: '11px', fontWeight: '900', borderBottom: '1.5px solid black', marginBottom: '4px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Vencimento</th>
                        <th style={{ textAlign: 'center' }}>Forma Pagto</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '12px' }}>
                      <tr>
                        <td style={{ textAlign: 'left' }}>{selectedSaleForReceipt.due_date ? new Date(selectedSaleForReceipt.due_date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</td>
                        <td style={{ textAlign: 'center' }}>{(selectedSaleForReceipt.payment_method === 'Fiado' ? 'CREDITO KOMBAT' : (selectedSaleForReceipt.payment_method || '')).toUpperCase()}</td>
                        <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {selectedSaleForReceipt.payment_method === 'Fiado' && (
                  <table style={{ width: '100%', marginTop: '4px' }}>
                    <tbody>
                      <tr style={{ fontSize: '11px', fontWeight: '900' }}>
                        <td colSpan={2} style={{ paddingTop: '4px', borderTop: '1.5px solid black' }}>REGRA DE PAGAMENTO (FIADO):</td>
                      </tr>
                      <tr style={{ fontSize: '13px', fontWeight: '900' }}>
                        <td style={{ textAlign: 'left' }}>VALOR NORMAL (ATÉ 30 DIAS):</td>
                        <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                      </tr>
                      <tr style={{ fontSize: '13px', fontWeight: '900', color: 'red' }}>
                        <td style={{ textAlign: 'left' }}>VALOR APÓS 30 DIAS (+15%):</td>
                        <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total * 1.15).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <table style={{ width: '100%', marginTop: '4px' }}>
                  <tbody>
                    <tr style={{ fontWeight: '900', fontSize: '14px', borderTop: '1px dashed black' }}>
                      <td style={{ textAlign: 'left', paddingTop: '2px' }}>TOTAL PAGO:</td>
                      <td style={{ textAlign: 'right', paddingTop: '2px' }}>R$ {(selectedSaleForReceipt.paid_total || (selectedSaleForReceipt.payment_status === 'Pago' ? (selectedSaleForReceipt.total || 0) : 0)).toFixed(2)}</td>
                    </tr>
                    {selectedSaleForReceipt.payment_method === 'Fiado' && (
                      <tr style={{ fontWeight: '900', fontSize: '14px', color: 'red' }}>
                        <td style={{ textAlign: 'left', paddingTop: '2px' }}>RESTANTE DEVIDO:</td>
                        <td style={{ textAlign: 'right', paddingTop: '2px' }}>R$ {(selectedSaleForReceipt.total - (selectedSaleForReceipt.paid_total || 0)).toFixed(2)}</td>
                      </tr>
                    )}
                    {selectedSaleForReceipt.customer_id && (
                      <tr style={{ fontWeight: '900', fontSize: '14px', borderTop: '2.5px solid black' }}>
                        <td style={{ textAlign: 'left', paddingTop: '4px' }}>SALDO LIMITE:</td>
                        <td style={{ textAlign: 'right', paddingTop: '4px', color: 'red' }}>R$ {getCustomerRemainingCredit(selectedSaleForReceipt.customer_id).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '10px' }}>
                  <div style={{ borderTop: '2px solid black', width: '200px', margin: '0 auto' }}></div>
                  <p style={{ fontSize: '11px', marginTop: '2px', fontWeight: '900' }}>ASSINATURA DO CLIENTE</p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '8px', borderTop: '1px dashed black' }}>
                  <p style={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}>Esse cupom não é um documento fiscal</p>
                </div>
                <div style={{ borderTop: '1px dashed black', margin: '2px 0' }}></div>
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '900' }}>Obrigado pela preferência!<br />Kombat Moto Peças</div>
              </div>

              {/* ================================================== */}
              {/* DUAL DIVISION & INTERNAL OFFICE RECEIPT */}
              {/* ================================================== */}
              {selectedSaleForReceipt.mechanic_id && (
                <div className="internal-receipt" style={{ marginTop: '30px', borderTop: '3px dashed black', paddingTop: '30px' }}>
                  {/* print-only divider to separate sheets if printing on continuous roll */}
                  <div className="text-center font-black text-lg no-print" style={{ margin: '15px 0', borderBottom: '1px dashed #666', borderTop: '1px dashed #666', padding: '5px 0' }}>
                    ====================================
                  </div>
                  
                  <div style={{ textAlign: 'center', marginBottom: '4px', fontWeight: 'bold' }}>
                    <h4 style={{ fontWeight: '900', fontSize: '14px', margin: '0' }}>KOMBAT MOTO PEÇAS</h4>
                    <p style={{ margin: '0', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>RECIBO INTERNO DA OFICINA</p>
                    <p style={{ margin: '0', fontSize: '10px', fontWeight: '900' }}>CONTROLE INTERNO DE COMISSÕES</p>
                  </div>

                  <div style={{ borderTop: '1px dashed black', margin: '2px 0' }}></div>

                  <table style={{ width: '100%', fontSize: '12px', fontWeight: 'bold' }}>
                    <tbody>
                      <tr>
                        <td>Venda: {selectedSaleForReceipt.id}</td>
                        <td style={{ textAlign: 'right' }}>Data: {new Date(selectedSaleForReceipt.date).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ borderTop: '1px dashed black', margin: '2px 0' }}></div>

                  {/* Internal Info */}
                  <div style={{ fontSize: '12px', padding: '2px 0' }}>
                    <p>Cliente: {(selectedSaleForReceipt.customer_name || 'Consumidor Final').toUpperCase()}</p>
                    <p>Moto: {selectedSaleForReceipt.moto_details ? selectedSaleForReceipt.moto_details.split('(')[0] : 'Não informado'}</p>
                    <p style={{ fontWeight: '900', fontSize: '13px', marginTop: '2px' }}>Mecânico responsável: {selectedSaleForReceipt.mechanic_name?.toUpperCase()}</p>
                  </div>

                  <div style={{ borderTop: '1px dashed black', margin: '2px 0' }}></div>

                  {/* Calculations & Commission Details */}
                  {(() => {
                    const financials = getSaleFinancials(selectedSaleForReceipt);
                    const internalServices = (selectedSaleForReceipt.items || selectedSaleForReceipt.sale_items || [])?.filter(i => i.type === 'Adicional Interno') || [];
                    const totalAdicionais = financials.internalServicesTotal;
                    // Total pay to mechanic: commission + internal services
                    const totalPagarMecanico = financials.commission + totalAdicionais;
                    const sobraOficina = selectedSaleForReceipt.total - totalPagarMecanico;

                    return (
                      <>
                        <table style={{ width: '100%', fontSize: '12px', fontWeight: 'bold' }}>
                          <tbody>
                            <tr>
                              <td>Mão de obra principal cobrada do cliente:</td>
                              <td style={{ textAlign: 'right' }}>R$ {financials.laborTotal.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px dotted black' }}>
                              <td style={{ color: '#000', fontWeight: '900' }}>Comissão 50% sobre mão de obra principal:</td>
                              <td style={{ textAlign: 'right', fontWeight: '900' }}>R$ {financials.commission.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Internal Services List */}
                        {internalServices.length > 0 ? (
                          <div style={{ marginTop: '6px' }}>
                            <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '2px' }}>SERVIÇOS ADICIONAIS INTERNOS</p>
                            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                              <tbody>
                                {internalServices.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px dotted black' }}>
                                    <td>- {item.description.toUpperCase()}</td>
                                    <td style={{ textAlign: 'right' }}>R$ {item.price.toFixed(2)}</td>
                                  </tr>
                                ))}
                                <tr style={{ fontWeight: '900' }}>
                                  <td style={{ paddingTop: '2px' }}>Total de serviços adicionais internos:</td>
                                  <td style={{ textAlign: 'right', paddingTop: '2px' }}>R$ {totalAdicionais.toFixed(2)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ marginTop: '4px', fontSize: '11px', fontStyle: 'italic' }}>
                            Sem serviços adicionais internos.
                          </div>
                        )}

                        <div style={{ borderTop: '1.5px solid black', margin: '6px 0' }}></div>

                        {/* TOTAL TO MECHANIC */}
                        <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '4px', border: '1px solid black' }}>
                          <p style={{ fontSize: '11px', fontWeight: '900', margin: '0' }}>TOTAL A PAGAR AO MECÂNICO:</p>
                          <p style={{ fontSize: '10px', margin: '0 0 4px 0' }}>Comissão 50% + serviços adicionais internos</p>
                          <p style={{ fontSize: '18px', fontWeight: '900', margin: '0', textAlign: 'right', textDecoration: 'underline' }}>
                            R$ {totalPagarMecanico.toFixed(2)}
                          </p>
                        </div>

                        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

                        {/* FINANCIAL SUMMARY */}
                        <p style={{ fontSize: '11px', fontWeight: '900', margin: '0 0 2px 0' }}>Resumo financeiro interno:</p>
                        <table style={{ width: '100%', fontSize: '12px', fontWeight: 'bold' }}>
                          <tbody>
                            <tr>
                              <td>Total cobrado do cliente:</td>
                              <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Total pago ao mecânico:</td>
                              <td style={{ textAlign: 'right' }}>R$ {totalPagarMecanico.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderTop: '1.5px solid black', fontWeight: '900', fontSize: '13px' }}>
                              <td>Valor restante para oficina:</td>
                              <td style={{ textAlign: 'right' }}>R$ {sobraOficina.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ borderTop: '1px dashed black', margin: '6px 0' }}></div>

                        <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', textAlign: 'center', margin: '0' }}>
                          Observação interna:<br />
                          Os serviços adicionais são valores internos para pagamento do mecânico e não foram cobrados do cliente.
                        </p>
                      </>
                    );
                  })()}
                  
                  <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
                </div>
              )}
              
              <div style={{ height: '30px' }}></div> {/* Buffer for thermal cutter */}

              <button
                onClick={handlePrintReceipt}
                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 no-print"
              >
                <Printer size={18} />
                Imprimir Recibo (80mm)
              </button>
            </div>
          )}
        </Modal>


        <Modal
          isOpen={isOsModalOpen}
          onClose={() => {
            setIsOsModalOpen(false);
            setEditingOS(null);
            setOsForm({
              customer_id: '',
              motorcycle_id: '',
              motorcycle_plate: '',
              items: [],
              selected_fixed_services: [],
              labor_value: '0',
              principal_service_desc: '',
              internal_services: [],
              mechanic_id: '',
              payment_method: 'Pix',
              status: 'Aberto',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              service_description: '',
              km: ''
            });
            setOsSearchProduct('');
          }}
          title={editingOS ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          fullScreen={true}
          bodyClassName="p-0 flex flex-col bg-slate-50 dark:bg-slate-900 h-full w-full"
        >
          <div className="flex flex-col h-full w-full overflow-hidden p-4 lg:p-6 gap-6 bg-slate-50 dark:bg-slate-900">
            {/* LINHA 1: Top Bar (Grid 6 colunas) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0 dark:bg-slate-800 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Cliente */}
                <div className="col-span-1 md:col-span-1 lg:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Users size={12}/> Cliente</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={osForm.customer_id}
                    onChange={e => {
                      const cid = e.target.value;
                      if (!cid) {
                        setOsForm({ ...osForm, customer_id: '', motorcycle_id: '', motorcycle_plate: '', km: '' });
                        return;
                      }
                      const customerMotos = motorcycles.filter(m => m.customer_id === parseInt(cid));
                      if (customerMotos.length > 0) {
                        setOsForm({ ...osForm, customer_id: cid, motorcycle_id: customerMotos[0].id.toString(), motorcycle_plate: customerMotos[0].plate, km: customerMotos[0].current_km || '' });
                      } else {
                        setOsForm({ ...osForm, customer_id: cid, motorcycle_id: '', motorcycle_plate: '', km: '' });
                      }
                    }}
                  >
                    <option value="">Selecione o Cliente...</option>
                    {sortedCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {osForm.customer_id && (
                    <div className="mt-1 flex justify-between items-center px-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Crédito:</span>
                      <span className={`text-[11px] font-black ${getCustomerRemainingCredit(parseInt(osForm.customer_id)) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {getCustomerRemainingCredit(parseInt(osForm.customer_id)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Moto */}
                <div className="col-span-1 md:col-span-1 lg:col-span-1 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Bike size={12}/> Moto</label>
                  {(() => {
                    const customerMotos = osForm.customer_id ? motorcycles.filter(m => m.customer_id === parseInt(osForm.customer_id)) : [];
                    if (customerMotos.length > 0 && osForm.motorcycle_id !== 'manual') {
                      return (
                        <select
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={osForm.motorcycle_id}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'manual') {
                              setOsForm({ ...osForm, motorcycle_id: 'manual', motorcycle_plate: '' });
                            } else {
                              const moto = customerMotos.find(m => m.id.toString() === val);
                              if (moto) {
                                setOsForm({ ...osForm, motorcycle_id: val, motorcycle_plate: moto.plate, km: moto.current_km || '' });
                              }
                            }
                          }}
                        >
                          {customerMotos.map(moto => (
                            <option key={moto.id} value={moto.id.toString()}>
                              {moto.model || moto.brand} ({moto.plate})
                            </option>
                          ))}
                          <option value="manual">+ Placa Manual</option>
                        </select>
                      );
                    } else {
                      return (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="ABC-1234"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 uppercase focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 pr-10"
                            value={osForm.motorcycle_plate || ''}
                            onChange={e => setOsForm({ ...osForm, motorcycle_plate: e.target.value.toUpperCase() })}
                          />
                          {customerMotos.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (customerMotos.length > 0) {
                                  setOsForm({
                                    ...osForm,
                                    motorcycle_id: customerMotos[0].id.toString(),
                                    motorcycle_plate: customerMotos[0].plate,
                                    km: customerMotos[0].current_km || ''
                                  });
                                }
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-600 hover:text-rose-700"
                            >
                              Voltar
                            </button>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* 3. KM */}
                <div className="col-span-1 md:col-span-1 lg:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Settings size={12}/> KM Atual</label>
                  <input
                    type="number"
                    placeholder="00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all no-spinners dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={osForm.km || ''}
                    onChange={e => setOsForm({ ...osForm, km: e.target.value })}
                  />
                </div>

                {/* 4. Mecânico */}
                <div className="col-span-1 md:col-span-1 lg:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Wrench size={12}/> Mecânico</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={osForm.mechanic_id}
                    onChange={e => setOsForm({ ...osForm, mechanic_id: e.target.value })}
                  >
                    <option value="">Geral / Nenhum</option>
                    {sortedMechanics.filter(Boolean).map(m => <option key={m.id} value={m.id}>{m.name || 'Mecânico'}</option>)}
                  </select>
                </div>

                {/* 5. Status */}
                <div className="col-span-1 md:col-span-1 lg:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={osForm.status}
                    onChange={e => setOsForm({ ...osForm, status: e.target.value as any })}
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Pronto">Pronto</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>

                {/* 6. Pagamento & Data Vencimento */}
                <div className="col-span-1 md:col-span-1 lg:col-span-1 relative z-50">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pagamento</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={osForm.payment_method}
                    onChange={e => setOsForm({ ...osForm, payment_method: e.target.value as any })}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Fiado">Fiado</option>
                  </select>
                  {osForm.payment_method === 'Fiado' && (
                    <div className="absolute left-0 top-[100%] mt-2 w-full bg-white p-3 border border-slate-200 shadow-2xl rounded-xl z-50 dark:bg-slate-800 dark:border-slate-700">
                      <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Data Limite</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                        value={osForm.due_date || ''}
                        onChange={e => setOsForm({ ...osForm, due_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LINHA 2 e 3: Área Central (Busca + Listas vs Direita) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              
              {/* Painel Esquerdo (75% e rolável internamente) */}
              <div className="flex-1 lg:flex-[3] flex flex-col gap-4 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 p-4">
                {/* LINHA 2: Busca */}
                <div className="relative shrink-0 z-20">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 bg-rose-100 p-1.5 rounded-lg">
                      <Search size={16} strokeWidth={3} />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Buscar peça/serviço ou digite para adicionar item avulso..."
                      className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      value={osSearchProduct}
                      onChange={e => setOsSearchProduct(e.target.value)}
                    />
                    {osSearchProduct && (
                      <button onClick={() => setOsSearchProduct('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full p-1 transition-colors dark:bg-slate-800">
                        <X size={14} strokeWidth={3}/>
                      </button>
                    )}
                  </div>
                  {osSearchProduct && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[40vh] overflow-y-auto z-50 divide-y divide-slate-100 flex flex-col dark:bg-slate-800 dark:border-slate-700">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Produtos Encontrados */}
                        {sortedProducts.filter(p =>
                          p && ((p.description || '').toLowerCase().includes(osSearchProduct.toLowerCase()) ||
                            ((p.brand || '').toLowerCase().includes(osSearchProduct.toLowerCase())) ||
                            ((p.alt_code || '').toLowerCase().includes(osSearchProduct.toLowerCase())))
                        ).map(p => (
                          <button
                            key={`prod-${p.id}`}
                            onClick={() => { handleAddOsItem(p); setOsSearchProduct(''); }}
                            className="w-full text-left px-5 py-3.5 hover:bg-rose-50 flex justify-between items-center transition-colors group"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-rose-700 dark:text-slate-100">{p.description}</p>
                              <div className="flex gap-2 mt-1.5">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 dark:text-slate-400"><Package size={10}/> Estoque: {p.stock}</span>
                                {p.brand && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold dark:bg-slate-800 dark:text-slate-400">{p.brand}</span>}
                              </div>
                            </div>
                            <span className="text-sm font-black text-rose-600">R$ {(p.sale_price || 0).toFixed(2)}</span>
                          </button>
                        ))}

                        {/* Serviços Encontrados */}
                        {sortedRegisteredServices.filter(s =>
                          s && (s.description || '').toLowerCase().includes(osSearchProduct.toLowerCase())
                        ).map(s => (
                          <button
                            key={`serv-${s.id}`}
                            onClick={() => {
                              setOsForm({ ...osForm, items: [...osForm.items, { description: s.description, quantity: 1, price: s.price, type: 'Serviço' }] });
                              setOsSearchProduct('');
                            }}
                            className="w-full text-left px-5 py-3.5 hover:bg-amber-50 flex justify-between items-center transition-colors group"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700 dark:text-slate-100">{s.description}</p>
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1.5 inline-flex items-center gap-1"><Wrench size={10}/> Serviço Cadastrado</span>
                            </div>
                            <span className="text-sm font-black text-amber-600">R$ {(s.price || 0).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>

                      {/* Adicionar Avulso */}
                      <div className="p-3 bg-slate-50 sticky bottom-0 border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:border-slate-700">
                        <button
                          onClick={() => {
                            setOsForm({ ...osForm, items: [...osForm.items, { description: osSearchProduct.toUpperCase(), quantity: 1, price: 0, type: 'Peça' }] });
                            setOsSearchProduct('');
                          }}
                          className="w-full py-3 bg-white border-2 border-rose-200 text-xs font-black text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-400 transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm dark:bg-slate-800"
                        >
                          <PlusCircle size={16} /> Adicionar "{osSearchProduct}" como item avulso
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Listas de Peças e Serviços */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-2">
                  {/* Tabela Peças */}
                  {osForm.items.filter(i => i.product_id || i.type === 'Peça').length > 0 && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 dark:text-slate-400"><Package size={14}/> Peças e Acessórios</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {osForm.items.map((item, idx) => (item.product_id || item.type === 'Peça') && (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-white transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate dark:text-slate-100" title={item.description}>{item.description}</p>
                              {!item.product_id && <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-flex items-center gap-1"><AlertCircle size={10}/> Item Avulso</span>}
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                <button type="button" onClick={() => handleOsItemQuantityChange(idx, Math.max(1, item.quantity - 1))} className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-600 rounded-md transition-all"><Minus size={14} strokeWidth={3}/></button>
                                <input type="number" min="1" value={item.quantity} onChange={e => handleOsItemQuantityChange(idx, parseInt(e.target.value) || 1)} className="w-10 text-center text-xs font-black text-slate-700 outline-none no-spinners bg-transparent dark:text-slate-100" />
                                <button type="button" onClick={() => handleOsItemQuantityChange(idx, item.quantity + 1)} className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-600 rounded-md transition-all"><Plus size={14} strokeWidth={3}/></button>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">R$</span>
                                <input type="number" step="0.01" value={item.price} onChange={e => handleOsItemPriceChange(idx, parseFloat(e.target.value) || 0)} className={`w-20 px-2 py-1.5 rounded-lg text-xs font-bold outline-none text-right transition-all border ${!item.product_id ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-4 focus:ring-rose-500/10' : 'border-slate-200 bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'}`} />
                              </div>

                              <div className="w-20 text-right">
                                <span className="text-sm font-black text-slate-800 dark:text-slate-100">R$ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>

                              <button onClick={() => handleRemoveOsItem(idx)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabela Serviços */}
                  {(osForm.items.filter(i => !i.product_id && i.type === 'Serviço').length > 0 || (osForm.selected_fixed_services || []).length > 0) && (
                    <div className="bg-amber-50/30 rounded-xl border border-amber-200 overflow-hidden dark:bg-slate-900">
                      <div className="bg-amber-100/50 px-4 py-2.5 border-b border-amber-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5"><Wrench size={14}/> Mão de Obra e Serviços</span>
                      </div>
                      <div className="divide-y divide-amber-100/50">
                        {/* Serviços Adicionados do Search */}
                        {osForm.items.map((item, idx) => (!item.product_id && item.type === 'Serviço') && (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-white/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate dark:text-slate-100" title={item.description}>{item.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center bg-white rounded-lg p-0.5 border border-amber-200">
                                <button type="button" onClick={() => handleOsItemQuantityChange(idx, Math.max(1, item.quantity - 1))} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-all"><Minus size={14} strokeWidth={3}/></button>
                                <input type="number" min="1" value={item.quantity} onChange={e => handleOsItemQuantityChange(idx, parseInt(e.target.value) || 1)} className="w-10 text-center text-xs font-black text-amber-900 outline-none no-spinners bg-transparent" />
                                <button type="button" onClick={() => handleOsItemQuantityChange(idx, item.quantity + 1)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-all"><Plus size={14} strokeWidth={3}/></button>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-amber-600/60 font-bold">R$</span>
                                <input type="number" step="0.01" value={item.price} onChange={e => handleOsItemPriceChange(idx, parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 text-right transition-all dark:bg-slate-800" />
                              </div>

                              <div className="w-20 text-right">
                                <span className="text-sm font-black text-amber-700">R$ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>

                              <button onClick={() => handleRemoveOsItem(idx)} className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        ))}

                        {/* Serviços Fixos Repasse */}
                        {(osForm.selected_fixed_services || []).map((sfs, idx) => (
                          <div key={`sfs-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-indigo-900 truncate" title={sfs.name}>{sfs.name}</p>
                              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1 inline-block">Terceirizado / Repasse</span>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center bg-white rounded-lg p-0.5 border border-indigo-200 dark:bg-slate-800">
                                <button type="button" onClick={() => setOsForm({ ...osForm, selected_fixed_services: osForm.selected_fixed_services.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it) })} className="p-1.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-all"><Minus size={14} strokeWidth={3}/></button>
                                <span className="w-10 flex items-center justify-center text-xs font-black text-indigo-900">{sfs.quantity}</span>
                                <button type="button" onClick={() => setOsForm({ ...osForm, selected_fixed_services: osForm.selected_fixed_services.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it) })} className="p-1.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-all"><Plus size={14} strokeWidth={3}/></button>
                              </div>
                              
                              <div className="flex items-center gap-1 w-20 justify-end">
                                <span className="text-[10px] text-indigo-400/60 font-bold">R$</span>
                                <span className="text-xs font-bold text-indigo-900">{sfs.price.toFixed(2)}</span>
                              </div>

                              <div className="w-20 text-right">
                                <span className="text-sm font-black text-indigo-700">R$ {(sfs.price * sfs.quantity).toFixed(2)}</span>
                              </div>

                              <button onClick={() => setOsForm({ ...osForm, selected_fixed_services: osForm.selected_fixed_services.filter(item => item.id !== sfs.id) })} className="p-2 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Painel Direito (Fixo, Resumo e Observações, 25%) */}
              <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4 h-full">
                
                {/* Serviço Principal Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shrink-0 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1"><Wrench size={12}/> Serviço Principal</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição</label>
                      <input 
                        type="text"
                        placeholder="Ex: Conserto de Motor"
                        value={osForm.principal_service_desc}
                        onChange={e => setOsForm({ ...osForm, principal_service_desc: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-rose-400 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor da Mão de Obra</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input 
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={osForm.labor_value}
                          onChange={e => setOsForm({ ...osForm, labor_value: e.target.value })}
                          className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-rose-700 focus:bg-white focus:border-rose-400 outline-none transition-all dark:bg-slate-900 dark:text-rose-400 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Repasses e Adicionais (Condicional) */}
                {osForm.mechanic_id && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0 dark:bg-slate-800 dark:border-slate-700">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><ExternalLink size={12}/> Repasses & Adicionais do Mecânico</label>
                    <div className="space-y-3">
                      <select
                        className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all"
                        value=""
                        onChange={e => {
                          const selectedService = fixedServices.find(fs => String(fs.id) === String(e.target.value));
                          if (selectedService) {
                            const existingService = osForm.selected_fixed_services.find(sfs => sfs.id === selectedService.id);
                            if (existingService) {
                              setOsForm({ ...osForm, selected_fixed_services: osForm.selected_fixed_services.map(sfs => sfs.id === selectedService.id ? { ...sfs, quantity: sfs.quantity + 1 } : sfs) });
                            } else {
                              setOsForm({ ...osForm, selected_fixed_services: [...osForm.selected_fixed_services, { ...selectedService, quantity: 1 }] });
                            }
                          }
                        }}
                      >
                        <option value="">+ Selecione Repasse Terceirizado</option>
                        {sortedFixedServices.filter(fs => fs && fs.id).map(fs => (
                          <option key={fs.id} value={fs.id}>{fs.name || 'Serviço'} (R$ {formatBRL(fs.payout)})</option>
                        ))}
                      </select>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                        <input 
                          type="text"
                          placeholder="Descrição de adicional avulso..."
                          value={newInternalServiceDesc}
                          onChange={e => setNewInternalServiceDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-rose-400 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                        />
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input 
                              type="text"
                              inputMode="decimal"
                              placeholder="Valor"
                              value={newInternalServicePrice}
                              onChange={e => setNewInternalServicePrice(e.target.value)}
                              className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:bg-white focus:border-rose-400 outline-none transition-all dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newInternalServiceDesc.trim()) {
                                alert("Insira uma descrição para o serviço adicional.");
                                return;
                              }
                              const priceStr = String(newInternalServicePrice || '').trim();
                              const val = parseFloat(priceStr.replace(',', '.')) || 0;
                              if (val <= 0) {
                                alert("Insira um valor maior que zero.");
                                return;
                              }
                              setOsForm({
                                ...osForm,
                                internal_services: [
                                  ...(osForm.internal_services || []),
                                  { description: newInternalServiceDesc.trim(), price: val }
                                ]
                              });
                              setNewInternalServiceDesc('');
                              setNewInternalServicePrice('');
                            }}
                            className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center uppercase tracking-widest"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Lista de Internos com max-height pequeno */}
                      {osForm.internal_services && osForm.internal_services.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
                          {osForm.internal_services.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg text-xs font-bold text-indigo-900 dark:bg-slate-900 dark:text-slate-100">
                              <span className="truncate flex-1 pr-2" title={item.description}>{item.description}</span>
                              <span className="shrink-0 font-mono mr-2">R$ {item.price.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => setOsForm({
                                  ...osForm,
                                  internal_services: osForm.internal_services.filter((_, i) => i !== idx)
                                })}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observações - Flex-1 (rolagem permitida aqui internamente) */}
                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[100px] shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 shrink-0 dark:bg-slate-900 dark:border-slate-700">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 dark:text-slate-400"><FileText size={12}/> Observações</span>
                  </div>
                  <textarea
                    placeholder="Relatos, detalhes..."
                    className="flex-1 w-full p-4 text-xs font-medium text-slate-700 bg-transparent resize-none outline-none focus:bg-slate-50/50 transition-colors dark:text-slate-100 custom-scrollbar"
                    value={osForm.service_description}
                    onChange={e => setOsForm({ ...osForm, service_description: e.target.value })}
                  />
                </div>

                {/* Resumo Financeiro Premium (Fixo na parte inferior) */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white shrink-0 shadow-2xl relative overflow-hidden flex flex-col">
                  {/* Decorative blob */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="space-y-2.5 relative z-10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Subtotal Peças</span>
                      <span className="font-bold text-slate-100">R$ {osForm.items.filter(i => i.product_id || i.type === 'Peça').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Subtotal Serviços</span>
                      <span className="font-bold text-slate-100">R$ {(
                        osForm.items.filter(i => !i.product_id && i.type === 'Serviço').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + 
                        (osForm.selected_fixed_services || []).reduce((acc, sfs) => acc + (sfs.price * sfs.quantity), 0)
                      ).toFixed(2)}</span>
                    </div>
                    
                    {/* Mão de Obra Principal */}
                    <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-800">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Mão de Obra</span>
                      <span className="font-bold text-slate-100">R$ {parseFloat(osForm.labor_value || '0').toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 relative z-10 shrink-0 flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1">Total Geral</p>
                      <p className="text-4xl font-black tracking-tight text-white">
                        <span className="text-xl text-slate-400 mr-1">R$</span>
                        {(
                          osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + 
                          (osForm.selected_fixed_services || []).reduce((acc, sfs) => acc + (sfs.price * sfs.quantity), 0) +
                          (parseFloat((osForm.labor_value || '0').toString().replace(',', '.')) || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={handleCompleteOS}
                      className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-lg hover:bg-rose-700 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] active:scale-[0.98] uppercase tracking-wider"
                    >
                      {editingOS ? "Salvar Alterações" : "FINALIZAR O.S."}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Mechanic Report Modal */}
        <Modal
          isOpen={isMechanicReportModalOpen}
          onClose={() => setIsMechanicReportModalOpen(false)}
          title={selectedMechanicForReport ? `Relatório de ${selectedMechanicForReport.name}` : "Relatório do Mecânico"}
        >
          {selectedMechanicForReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <p className="text-sm text-slate-600 dark:text-slate-400">Visão geral dos serviços e comissões de {selectedMechanicForReport.name}.</p>
                <button
                  onClick={handlePrintMechanicReport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all text-xs font-bold shadow-sm"
                >
                  <Printer size={14} />
                  Imprimir Térmico
                </button>
              </div>

              {/* Time Period Filters (Optional, for future enhancement) */}
              {/* <div className="flex gap-2 text-xs">
                <button className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">Hoje</button>
                <button className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Semana</button>
                <button className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Mês</button>
              </div> */}

              {/* Report Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Daily, Weekly, Monthly Totals */}
                <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Hoje</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'day').toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Semana</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'week').toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Quinzena</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'fortnight').toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Mês</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'month').toFixed(2)}</p>
                </div>
              </div>

              {/* Detailed Services List */}
              <div className="mt-6 border-t border-slate-400 pt-6 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 mb-4 dark:text-slate-100">Serviços Detalhados</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {sales.filter(s => s.mechanic_id === selectedMechanicForReport.id && s.type === 'Oficina').map(sale => (
                    <div key={sale.id} className="p-3 bg-slate-50 rounded-xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-slate-800 dark:text-slate-100">O.S. #{sale.id} - {sale.customer_name}</p>
                        <span className="text-sm font-bold text-rose-600">{formatBRL(sale.commission)}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(sale.date).toLocaleString()}</p>
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {(sale.items || sale.sale_items || []).length > 0 && (
                          <p>Peças/Produtos: {(sale.items || sale.sale_items || []).map(item => `${item.description} (${item.quantity}x)`).join(', ')}</p>
                        )}
                        {sale.labor_value > 0 && (
                          <p>Mão de Obra: {formatBRL(sale.labor_value)}</p>
                        )}
                        {(sale.selected_fixed_services || []).length > 0 && (
                          <p>Serviços Fixos: {sale.selected_fixed_services.map(sfs => `${sfs.name} (${sfs.quantity}x)`).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Thermal Print Content for Mechanic Report */}
        <div className="hidden">
          <div id="mechanic-report-thermal-content" className="bg-white p-4 text-[15px] leading-tight text-black w-[80mm] mx-auto overflow-visible print:p-0 font-bold dark:bg-slate-800 print-receipt" style={{ fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif' }}>
            <style>{`
              @media print {
                @page {
                  margin: 0;
                  size: 80mm auto;
                }
                html, body {
                  page: receipt-page !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  height: auto !important;
                  background: white !important;
                  width: 80mm !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #mechanic-report-thermal-content {
                  page: receipt-page !important;
                  width: 76mm !important;
                  margin: 0 auto !important;
                  padding: 2mm !important;
                  display: block !important;
                  background: white !important;
                  height: auto !important;
                  overflow: visible !important;
                }
              }
            `}</style>

            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontWeight: '900', fontSize: '18px', margin: '0' }}>KOMBAT MOTO PECAS</h4>
              <p style={{ margin: '4px 0', fontSize: '14px', textTransform: 'uppercase' }}>Relatório de Mecânico</p>
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '6px 0' }}></div>

            <div style={{ padding: '4px 0' }}>
              <p style={{ fontSize: '16px', fontWeight: '900' }}>MECÂNICO: {selectedMechanicForReport?.name.toUpperCase()}</p>
              <p>Data Impressão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '6px 0' }}></div>

            <div style={{ padding: '4px 0' }}>
              <p style={{ fontSize: '14px', marginBottom: '4px' }}>RESUMO DE COMISSÕES:</p>
              <table style={{ width: '100%', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td>TOTAL HOJE:</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(calculateMechanicTotal(selectedMechanicForReport?.id || '', 'day'))}</td>
                  </tr>
                  <tr>
                    <td>TOTAL SEMANA:</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(calculateMechanicTotal(selectedMechanicForReport?.id || '', 'week'))}</td>
                  </tr>
                  <tr>
                    <td>TOTAL QUINZENA:</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(calculateMechanicTotal(selectedMechanicForReport?.id || '', 'fortnight'))}</td>
                  </tr>
                  <tr>
                    <td>TOTAL MÊS:</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(calculateMechanicTotal(selectedMechanicForReport?.id || '', 'month'))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '6px 0' }}></div>

            <div style={{ padding: '4px 0' }}>
              <p style={{ fontSize: '14px', marginBottom: '6px', textAlign: 'center' }}>SERVIÇOS DETALHADOS (OFICINA)</p>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid black' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '4px' }}>DATA/OS</th>
                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>COMISSÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMechanicForReport && sales
                    .filter(s => s.mechanic_id === selectedMechanicForReport.id && s.type === 'Oficina')
                    .map(sale => (
                      <tr key={sale.id} style={{ borderBottom: '1px dashed #eee' }}>
                        <td style={{ padding: '4px 0' }}>
                          <div>#{sale.id}</div>
                          <div style={{ fontSize: '9px', color: '#666' }}>{new Date(sale.date).toLocaleDateString('pt-BR')}</div>
                          <div style={{ fontSize: '10px' }}>{sale.customer_name.substring(0, 15)}</div>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>
                          {formatBRL(sale.commission)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '2px solid black', margin: '15px 0 5px 0' }}></div>
            <p style={{ textAlign: 'center', fontSize: '10px' }}>*** FIM DO RELATÓRIO ***</p>
          </div>
        </div>

        <AnimatePresence>
          {selectedSaleForOS && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col dark:bg-slate-800"
              >
                <div className="p-4 bg-slate-100 flex justify-between items-center rounded-t-lg dark:bg-slate-800">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ordem de Serviço A4</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintOS}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Printer size={16} />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setSelectedSaleForOS(null)}
                      className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors dark:text-slate-400"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div id="os-printable-area" className="p-8 overflow-y-auto flex-grow font-sans text-sm text-slate-800 dark:text-slate-100">
                  {/* Header */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">KOMBAT MOTO PEÇAS</h1>
                      <p className="text-xs">Rua Paraná, 342, Centro | CEP: 86380-000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">Andirá-PR | (43) 3538-4537</p>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">ORDEM DE SERVIÇO</h2>
                      <p className="font-mono text-xl text-rose-600">Nº {selectedSaleForOS.id}</p>
                    </div>
                  </div>

                  {/* Customer and Vehicle Data */}
                  <table className="w-full text-xs border-collapse my-4">
                    <tbody>
                      <tr>
                        <td className="border p-2 w-1/2"><span className="font-bold">Cliente:</span> {selectedSaleForOS.customer_name}</td>
                        <td className="border p-2 w-1/2"><span className="font-bold">Celular:</span> {customers.find(c => c.id === selectedSaleForOS.customer_id)?.whatsapp || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><span className="font-bold">Moto/Modelo:</span> {selectedSaleForOS.moto_details?.split('(')[0] || '---'}</td>
                        <td className="border p-2"><span className="font-bold">Placa:</span> {selectedSaleForOS.moto_details?.match(/\((.*?)\)/)?.[1] || motorcycles.find(m => m.id === selectedSaleForOS.motorcycle_id)?.plate || '---'}</td>
                      </tr>
                      <tr>
                        <td className="border p-2">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">KM:</span>
                            <span className="inline-block min-w-[80px] border-b border-black">
                              {selectedSaleForOS.km || selectedSaleForOS.moto_details?.split('KM: ')?.[1] || motorcycles.find(m => m.id === selectedSaleForOS.motorcycle_id)?.current_km || ''}
                            </span>
                          </div>
                        </td>
                        <td className="border p-2"><span className="font-bold">Data de Entrada:</span> {new Date(selectedSaleForOS.date).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td className="border p-2" colSpan={2}><span className="font-bold">Previsão de Entrega:</span> {new Date(selectedSaleForOS.delivery_date || selectedSaleForOS.date).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Checklist */}
                  <table className="w-full text-xs border-collapse my-4">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left" colSpan={2}><h3 className="font-bold">Checklist de Entrada</h3></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 w-1/2 h-8"></td>
                        <td className="border p-2 w-1/2 h-8"></td>
                      </tr>
                      <tr>
                        <td className="border p-2 h-8"></td>
                        <td className="border p-2 h-8"></td>
                      </tr>
                      <tr>
                        <td className="border p-2 h-8" colSpan={2}>[ ] Nível de Combustível: _________________</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Services and Products */}
                  <div className="my-4">
                    <h3 className="font-bold mb-2 text-center uppercase text-slate-600 text-xs dark:text-slate-400">Descrição dos Produtos / Serviços</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          <th className="border p-2 text-left w-16">QTD</th>
                          <th className="border p-2 text-left">DESCRIÇÃO</th>
                          <th className="border p-2 text-right w-32">VALOR UNIT.</th>
                          <th className="border p-2 text-right w-32">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSaleForOS?.items || selectedSaleForOS?.sale_items || []).filter(item => item.type !== 'Adicional Interno').map((item, index) => (
                          <tr key={`item-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border p-2 text-center">{item.quantity}</td>
                            <td className="border p-2">{item.description}</td>
                            <td className="border p-2 text-right">{formatBRL(item.price)}</td>
                            <td className="border p-2 text-right">{formatBRL(item.quantity * item.price)}</td>
                          </tr>
                        ))}
                        {(selectedSaleForOS?.labor_value || 0) > 0 && !(selectedSaleForOS?.items || selectedSaleForOS?.sale_items || []).some(i => i.type === 'Serviço Principal') && (
                          <tr className={((selectedSaleForOS?.items || selectedSaleForOS?.sale_items || []).length) % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border p-2 text-center">1</td>
                            <td className="border p-2">Mão de Obra / Serviços Gerais</td>
                            <td className="border p-2 text-right">{formatBRL(selectedSaleForOS?.labor_value || 0)}</td>
                            <td className="border p-2 text-right">{formatBRL(selectedSaleForOS?.labor_value || 0)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end my-4">
                    <div className="w-1/3 text-xs">
                      {(() => {
                        const financials = selectedSaleForOS ? getSaleFinancials(selectedSaleForOS) : { partsTotal: 0, laborTotal: 0 };
                        return (
                          <>
                            <div className="flex justify-between p-2 bg-slate-50 rounded-t-md dark:bg-slate-900">
                              <span className="font-bold">Total Peças:</span>
                              <span>{formatBRL(financials.partsTotal)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900">
                              <span className="font-bold">Total Serviços:</span>
                              <span>{formatBRL(financials.laborTotal)}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex justify-between p-2 bg-slate-200 text-base rounded-b-md dark:bg-slate-700">
                        <span className="font-bold">VALOR TOTAL GERAL:</span>
                        <span className="font-bold">{formatBRL(selectedSaleForOS?.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-[10px] text-slate-500 mt-8 pt-4 border-t dark:text-slate-400">
                    <p>Garantia de 90 dias para serviços. Peças conforme fabricante. Não nos responsabilizamos por objetos deixados no veículo.</p>
                    <div className="mt-12">
                      <p>_________________________________________</p>
                      <p>Assinatura do Cliente</p>
                    </div>
                    <p className="mt-4">Impresso em: {new Date().toLocaleString()}</p>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
      <FiadoModal isOpen={isFiadoModalOpen} onClose={() => setIsFiadoModalOpen(false)} />
      {/* Professional Catalog */}
      <AnimatePresence>
        {isCatalogModalOpen && (
          <ProfessionalCatalog 
            products={products} 
            onClose={() => setIsCatalogModalOpen(false)} 
          />
        )}
      </AnimatePresence>




      {/* Mechanic Registration Modal */}
      <Modal
        isOpen={isMechanicModalOpen}
        onClose={() => {
          setIsMechanicModalOpen(false);
          setEditingMechanic(null);
          setMechanicForm({ name: '', commissionRate: '' });
        }}
        title={editingMechanic ? "Editar Mecânico" : "Cadastrar Novo Mecânico"}
      >
        <form onSubmit={handleAddMechanic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome do Mecânico</label>
            <input
              type="text" required placeholder="Ex: João Silva"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
              value={mechanicForm.name}
              onChange={e => setMechanicForm({ ...mechanicForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Comissão Padrão (%)</label>
            <input
              type="number" required placeholder="50"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
              value={mechanicForm.commissionRate}
              onChange={e => setMechanicForm({ ...mechanicForm, commissionRate: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            {editingMechanic ? "Salvar Alterações" : "Cadastrar Mecânico"}
          </button>
        </form>
      </Modal>

      {/* Fixed Service Modal */}
      <Modal
        isOpen={isFixedServiceModalOpen}
        onClose={() => {
          setIsFixedServiceModalOpen(false);
          setEditingFixedService(null);
          setFixedServiceForm({ name: '', price: '', payout: '' });
        }}
        title={editingFixedService ? "Editar Serviço na Tabela" : "Adicionar Serviço à Tabela"}
      >
        <form onSubmit={handleAddFixedService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome do Serviço</label>
            <input
              type="text" required placeholder="Ex: Troca de Óleo"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
              value={fixedServiceForm.name}
              onChange={e => setFixedServiceForm({ ...fixedServiceForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Preço Venda (R$)</label>
              <input
                type="number" step="0.01" required placeholder="0.00"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-rose-600 dark:bg-slate-900 dark:border-slate-700"
                value={fixedServiceForm.price}
                onChange={e => setFixedServiceForm({ ...fixedServiceForm, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Repasse Mecânico (R$)</label>
              <input
                type="number" step="0.01" required placeholder="0.00"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-indigo-600 dark:bg-slate-900 dark:border-slate-700"
                value={fixedServiceForm.payout}
                onChange={e => setFixedServiceForm({ ...fixedServiceForm, payout: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            {editingFixedService ? "Salvar Alterações" : "Adicionar à Tabela"}
          </button>
        </form>
      </Modal>

      {/* Lead Registration Modal */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
          setLeadForm({ name: '', company: '', value: '', priority: 'Média', phone: '' });
        }}
        title={editingLead ? "Editar Lead" : "Cadastrar Novo Lead (CRM)"}
      >
        <form onSubmit={handleAddLead} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome do Contato</label>
            <input
              type="text" required placeholder="Ex: João da Silva"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={leadForm.name}
              onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Empresa / Referência</label>
            <input
              type="text" required placeholder="Ex: Oficina Central"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={leadForm.company}
              onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Valor Estimado (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={leadForm.value}
              onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Telefone / WhatsApp</label>
            <input
              type="text" required placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={leadForm.phone}
              onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Prioridade</label>
            <select
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={leadForm.priority}
              onChange={e => setLeadForm({ ...leadForm, priority: e.target.value as any })}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            {editingLead ? "Salvar Alterações" : "Criar Lead"}
          </button>
        </form>
      </Modal>

      {/* CRM Message Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={selectedLead ? `Mensagem para ${selectedLead.name}` : "Enviar Mensagem"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Escolha um canal para entrar em contato com o lead.</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                const msg = encodeURIComponent(`Olá ${selectedLead?.name}, tudo bem? Aqui é da Kombat Moto Peças...`);
                window.open(`https://wa.me/${selectedLead?.phone}?text=${msg}`, '_blank');
                setIsMessageModalOpen(false);
              }}
              className="flex flex-col items-center gap-3 p-6 bg-rose-50 text-rose-700 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100"
            >
              <MessageCircle size={32} />
              <span className="font-bold">WhatsApp</span>
            </button>
            <button
              onClick={() => {
                window.location.href = `tel:${selectedLead?.phone}`;
                setIsMessageModalOpen(false);
              }}
              className="flex flex-col items-center gap-3 p-6 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
            >
              <Users size={32} />
              <span className="font-bold">Ligar</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Distributor Registration Modal */}
      <Modal
        isOpen={isDistributorModalOpen}
        onClose={() => {
          setIsDistributorModalOpen(false);
          setEditingDistributor(null);
          setDistributorForm({ name: '', phone: '', contact_person: '' });
        }}
        title={editingDistributor ? "Editar Distribuidor" : "Cadastrar Novo Distribuidor"}
      >
        <form onSubmit={handleAddDistributor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Nome do Distribuidor</label>
            <input
              type="text" required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
              value={distributorForm.name}
              onChange={e => setDistributorForm({ ...distributorForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Telefone (WhatsApp)</label>
            <input
              type="text" required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
              value={distributorForm.phone}
              onChange={e => setDistributorForm({ ...distributorForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Pessoa de Contato (Opcional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold dark:bg-slate-900 dark:border-slate-700"
              value={distributorForm.contact_person}
              onChange={e => setDistributorForm({ ...distributorForm, contact_person: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            {editingDistributor ? "Salvar Alterações" : "Cadastrar Distribuidor"}
          </button>
        </form>
      </Modal>

      {/* Purchase Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
          setOrderForm({ distributor_id: '', items: [] });
        }}
        title="Novo Pedido de Peças"
        maxWidth="max-w-[95%]"
      >
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Distribuidor</label>
            <select
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={orderForm.distributor_id}
              onChange={e => setOrderForm({ ...orderForm, distributor_id: e.target.value })}
            >
              <option value="">Selecione um distribuidor</option>
              {sortedDistributors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Buscar Produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por descrição ou SKU..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                value={orderSearchProduct}
                onChange={e => setOrderSearchProduct(e.target.value)}
              />
            </div>
            {orderSearchProduct && (
              <div className="absolute z-10 bg-white border border-slate-400 rounded-xl mt-2 w-full max-h-60 overflow-y-auto shadow-lg dark:bg-slate-800 dark:border-slate-700">
                {sortedProducts.filter(p =>
                  (p.description || '').toLowerCase().includes(orderSearchProduct.toLowerCase()) ||
                  (p.alt_code || '').toLowerCase().includes(orderSearchProduct.toLowerCase()) ||
                  (p.sku || '').toLowerCase().includes(orderSearchProduct.toLowerCase())
                ).map(product => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => handleAddOrderItem(product)}
                    className="flex items-center justify-between w-full p-3 hover:bg-slate-50 transition-colors border-b border-slate-400 last:border-b-0 dark:border-slate-700"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{product.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {product.sku} | Estoque: {product.stock}</p>
                    </div>
                    <PlusCircle size={20} className="text-rose-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {orderForm.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Itens do Pedido</h3>
              {orderForm.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{item.description}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Qtd: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveOrderItem(item.description)}
                      className="p-1 text-rose-500 hover:bg-rose-100 rounded-full"
                    >
                      <MinusCircle size={20} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleUpdateOrderItemQuantity(item.description, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 bg-white border border-slate-400 rounded-lg text-center text-sm dark:bg-slate-800 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOrderItem({ id: 0, description: item.description, sku: '', barcode: '', purchase_price: 0, sale_price: 0, stock: 0, unit: '' })}
                      className="p-1 text-rose-500 hover:bg-rose-100 rounded-full"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t border-slate-400 dark:border-slate-700">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Total de Itens:</p>
                <p className="text-lg font-bold text-rose-600">{orderForm.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">
            {editingOrder ? "Atualizar Pedido" : "Criar Pedido"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isManagementReportModalOpen}
        onClose={() => {
          setIsManagementReportModalOpen(false);
          setSelectedReport(null);
          setInventoryReportSearchTerm('');
        }}
        title="Visualizar Relatório Gerencial"
        maxWidth="max-w-6xl"
      >
        <div className="bg-white dark:bg-slate-800">
          {renderManagementReportContent()}
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        title="Detalhes do Produto"
        maxWidth="max-w-3xl"
      >
        {selectedProductDetail && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-3xl overflow-hidden border-2 border-slate-100 flex items-center justify-center shadow-inner relative group dark:bg-slate-800">
                <img 
                  src={selectedProductDetail.image_url || 'https://via.placeholder.com/400?text=Sem+Imagem'} 
                  id="main-detail-image"
                  alt={selectedProductDetail.description} 
                  className="w-full h-full object-contain p-4" 
                />
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {[
                  selectedProductDetail.image_url,
                  selectedProductDetail.image_url2,
                  selectedProductDetail.image_url3,
                  selectedProductDetail.image_url4
                ].filter(Boolean).map((url, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      const mainImg = document.getElementById('main-detail-image') as HTMLImageElement;
                      if (mainImg) mainImg.src = url || '';
                    }}
                    className="aspect-square bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-700"
                  >
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900 uppercase dark:text-slate-100">{selectedProductDetail.description}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProductDetail.brand && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase dark:bg-slate-800 dark:text-slate-400">
                      Marca: {selectedProductDetail.brand}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase">
                    SKU: {selectedProductDetail.sku}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                <h5 className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Aplicação das Peças</h5>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap dark:text-slate-100">
                  {selectedProductDetail.application || "Nenhuma especificação de aplicação cadastrada para este item."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Preço de Venda</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{formatBRL(selectedProductDetail.sale_price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Disponibilidade</p>
                  <p className={`text-xl font-black ${selectedProductDetail.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedProductDetail.stock} {selectedProductDetail.unit}(s)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
                <button
                  onClick={() => {
                    setLabelPreviewProduct(selectedProductDetail);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  Etiqueta
                </button>
                <button
                  onClick={() => {
                    handleEditProduct(selectedProductDetail);
                    setSelectedProductDetail(null);
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Pencil size={20} />
                  Editar
                </button>
                <button
                  onClick={() => setSelectedProductDetail(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-slate-400"
                >
                  <X size={20} />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!labelPreviewProduct}
        onClose={() => setLabelPreviewProduct(null)}
        title="Prévia de Impressão da Etiqueta"
        maxWidth="max-w-md"
      >
        {labelPreviewProduct && (
          <div className="space-y-6">
            <div className="bg-slate-100 p-8 rounded-2xl flex items-center justify-center dark:bg-slate-800">
              <div className="bg-white dark:bg-slate-800" style={{ width: '63.5mm', height: '31mm', padding: '3mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, maxHeight: '18px', overflow: 'hidden', color: '#000' }}>
                  {labelPreviewProduct.description}
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 900, letterSpacing: '0.5px', color: '#000' }}>
                  {labelPreviewProduct.sku || labelPreviewProduct.barcode || 'S/ SKU'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2mm' }}>
                  <div style={{ fontSize: '6px', fontWeight: 'bold', textTransform: 'uppercase', maxWidth: '45%', lineHeight: 1.2, color: '#000' }}>
                    LOC:<br />{labelPreviewProduct.location || 'ESTOQUE PADRÃO'}
                  </div>
                  <div style={{ maxWidth: '50%', textAlign: 'right' }}>
                    <img 
                      src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(labelPreviewProduct.barcode || labelPreviewProduct.sku || labelPreviewProduct.id.toString())}&scale=2&height=5&includetext`} 
                      alt="Barcode" 
                      style={{ maxWidth: '100%', height: 'auto', maxHeight: '8mm', display: 'block', marginLeft: 'auto' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
              <p className="font-bold mb-1">Avisos de Impressão:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>O layout acima é uma prévia do conteúdo da etiqueta de <strong>63,5mm x 31mm</strong>.</li>
                <li>Ao clicar em imprimir, uma nova guia será aberta pronta para enviar à impressora.</li>
                <li>Lembre-se de configurar a impressão para <strong>Tamanho A4</strong> e <strong>Margens zeradas / Sem margem</strong>.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-400 rounded-xl dark:bg-slate-900 dark:border-slate-700">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantidade de Etiquetas</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setLabelQuantity(Math.max(1, labelQuantity - 1))}
                  className="w-10 h-10 bg-white border border-slate-400 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="1"
                  max="21"
                  value={labelQuantity}
                  onChange={(e) => setLabelQuantity(Math.min(21, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 h-10 bg-white border border-slate-400 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                />
                <button 
                  onClick={() => setLabelQuantity(Math.min(21, labelQuantity + 1))}
                  className="w-10 h-10 bg-white border border-slate-400 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Máximo 21 etiquetas por folha (3 colunas x 7 linhas).</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  handlePrintLabel(labelPreviewProduct, labelQuantity);
                }}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Confirmar Impressão
              </button>
              <button
                onClick={() => setLabelPreviewProduct(null)}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all dark:bg-slate-700 dark:text-slate-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Inventory Modal */}
      <Modal
        isOpen={isQuickInventoryOpen}
        onClose={() => {
          stopScanner();
          setIsQuickInventoryOpen(false);
          setCountedItems([]);
          setModalSearchTerm('');
        }}
        title="Contagem de Estoque Express (Manual)"
      >
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight dark:text-slate-100 font-bold">Buscar / Bipar Produto</label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Nome, SKU ou Código de Barras..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg transition-all dark:bg-slate-900 dark:border-slate-700 font-bold placeholder:text-slate-300"
                  value={modalSearchTerm}
                  onChange={e => {
                    setModalSearchTerm(e.target.value);
                    const val = e.target.value.trim();
                    if (val.length > 3) {
                      const found = products.find(p => 
                        (p.barcode === val) || 
                        (p.alt_code === val) || 
                        (p.sku === val)
                      );
                      if (found) {
                        addOrIncrementCountedProduct(found);
                        setModalSearchTerm('');
                      }
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const q = modalSearchTerm.trim().toLowerCase();
                      const found = products.find(p => 
                        (p.description || '').toLowerCase().includes(q) ||
                        (p.sku || '').toLowerCase() === q ||
                        (p.alt_code || '').toLowerCase() === q ||
                        (p.barcode || '') === q
                      );
                      if (found) {
                        addOrIncrementCountedProduct(found);
                        setModalSearchTerm('');
                      }
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={toggleCamera}
                className={`p-4 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  isCameraActive 
                    ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400'
                } hover:scale-105 active:scale-95 cursor-pointer`}
                title="Ativar Câmera"
              >
                <Camera size={24} />
              </button>
            </div>
            
            {modalSearchTerm && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-2xl shadow-2xl max-h-60 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                {products.filter(p => {
                  const search = modalSearchTerm.trim().toLowerCase();
                  if (!search) return false;
                  return (
                    (p.description || '').toLowerCase().includes(search) ||
                    (p.sku || '').toLowerCase().includes(search) ||
                    (p.alt_code || '').toLowerCase().includes(search)
                  );
                }).slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addOrIncrementCountedProduct(p);
                      setModalSearchTerm('');
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-emerald-50 flex flex-col border-b border-slate-100 last:border-none dark:hover:bg-slate-700"
                  >
                    <span className="font-bold text-slate-900 dark:text-slate-100">{p.description}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-tighter dark:text-slate-400">SKU: {p.sku || 'N/A'} | Local: {p.location || 'N/A'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isCameraActive && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-400 bg-black">
              <div id="camera-preview-container" className="w-full aspect-video"></div>
              <div className="absolute top-2 right-2 z-10">
                <button
                  type="button"
                  onClick={stopScanner}
                  className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-white">
                Aponte para o código de barras
              </div>
            </div>
          )}

          {countedItems.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Itens Contados</h4>
              {countedItems.map((item, idx) => {
                const itemTotal = item.product.sale_price * item.quantity;
                return (
                  <div 
                    key={item.product.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-800 dark:border-slate-700 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-900 truncate dark:text-slate-100 uppercase text-sm">
                        {item.product.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        SKU: {item.product.sku || 'N/A'} | Preço: {formatBRL(item.product.sale_price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-right">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1 dark:bg-slate-800 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setCountedItems(prev => {
                              const updated = [...prev];
                              if (updated[idx].quantity > 1) {
                                updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
                                return updated;
                              } else {
                                return updated.filter((_, i) => i !== idx);
                              }
                            });
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors dark:text-slate-400 dark:hover:bg-rose-950 cursor-pointer"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-black text-slate-800 dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCountedItems(prev => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
                              return updated;
                            });
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors dark:text-slate-400 dark:hover:bg-emerald-950 cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right min-w-[75px]">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">Subtotal</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {formatBRL(itemTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCountedItems(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remover Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !isCameraActive && (
              <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-700">
                <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-medium">Use a busca acima ou bipe o <br /> código para começar a contar.</p>
              </div>
            )
          )}

          {countedItems.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Itens Contados</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {countedItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor Acumulado</p>
                  <p className="text-xl font-black text-emerald-600">
                    {formatBRL(countedItems.reduce((acc, item) => acc + (item.product.sale_price * item.quantity), 0))}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSaveBulkInventory}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
              >
                <ClipboardCheck size={22} />
                Confirmar e Atualizar Estoque
              </button>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isMassUpdateModalOpen} onClose={() => setIsMassUpdateModalOpen(false)} title="Atualização de Preços em Massa">
        <div className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-800 text-sm mb-1 uppercase">Atenção Especial</h4>
            <p className="text-xs text-amber-700">
              {selectedProductIds.length > 0 
                ? `Esta ação vai atualizar o preço de VENDA dos ${selectedProductIds.length} produtos que você selecionou agora.`
                : `Você NÃO selecionou nenhum produto, então esta ação vai atualizar o preço de TODOS (${products.length}) os produtos do seu estoque que pertencem a você.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Ação</label>
              <select
                value={massUpdateForm.action}
                onChange={e => setMassUpdateForm({...massUpdateForm, action: e.target.value as 'increase'|'decrease'})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 font-bold bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="increase">AUMENTAR (Subir preços)</option>
                <option value="decrease">DIMINUIR (Baixar preços)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Tipo de Reajuste</label>
              <select
                value={massUpdateForm.type}
                onChange={e => setMassUpdateForm({...massUpdateForm, type: e.target.value as 'percent'|'fixed'})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 font-bold bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="percent">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
              {massUpdateForm.type === 'percent' ? 'Qual a porcentagem (%) ?' : 'Qual o valor (R$) ?'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {massUpdateForm.type === 'percent' ? '%' : 'R$'}
              </span>
              <input
                type="number"
                value={massUpdateForm.value}
                onChange={e => setMassUpdateForm({...massUpdateForm, value: e.target.value})}
                placeholder="Exemplo: 10"
                className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-4 font-black text-xl focus:ring-2 focus:ring-amber-500 dark:border-slate-700"
              />
            </div>
          </div>

          <button
            onClick={handleMassUpdate}
            className="w-full py-4 bg-amber-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            CONFIRMAR {massUpdateForm.action === 'increase' ? 'AUMENTO' : 'REDUÇÃO'} EM MASSA
          </button>
        </div>
      </Modal>
      </div>

      {/* Quote Print View / High Resolution Layout */}
      {isPrintingQuote && (
        <div className="fixed inset-0 bg-white z-[999] overflow-y-auto p-8 print:relative print:p-0 print:overflow-visible print:z-0 dark:bg-slate-800 print-quote-wrapper print-a4">
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 10mm !important;
              }
              body {
                page: a4-page !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
              /* Force text colors in print for dark mode fixes */
              #quote-capture-area .dark\:text-slate-100,
              #quote-capture-area .dark\:text-slate-400,
              #quote-capture-area .text-slate-800,
              #quote-capture-area .text-slate-700,
              #quote-capture-area .text-slate-500,
              #quote-capture-area .text-slate-400 {
                color: black !important;
              }
              #quote-capture-area .text-slate-400 {
                color: #333 !important; /* Slightly lighter for subheaders */
              }
              #quote-capture-area .bg-slate-900.text-white p,
              #quote-capture-area .bg-black.text-white p,
              #quote-capture-area h3.bg-black.text-white,
              #quote-capture-area h3.bg-rose-600.text-white {
                color: white !important;
              }
              /* Hide EVERYTHING by default during print */
              .main-layout-root {
                display: none !important;
              }
              
              /* Reset the inset wrapper properties on print */
              .print-quote-wrapper {
                page: a4-page !important;
                position: static !important;
                height: auto !important;
                min-height: 0 !important;
                width: 100% !important;
                top: auto !important;
                bottom: auto !important;
                left: auto !important;
                right: auto !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Show ONLY the print modal and its contents */
              .print-modal-container {
                position: static !important;
                width: 100% !important;
                height: auto !important;
                z-index: 9999 !important;
                background: white !important;
                visibility: visible !important;
              }
              .print-modal-container * {
                visibility: visible !important;
              }
              .print-modal-container .no-print,
              .print-modal-container .no-print *,
              .print-modal-container button,
              .print-modal-container .no-print button {
                display: none !important;
                visibility: hidden !important;
              }

              .max-w-4xl {
                max-width: none !important;
                width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              table {
                width: 100% !important;
                table-layout: fixed !important;
              }
              .overflow-hidden {
                overflow: visible !important;
              }

              /* Compress layout for single A4 page */
              #quote-capture-area {
                padding: 0px !important;
              }
              #quote-capture-area .border-b-4 {
                padding-bottom: 4px !important;
                margin-bottom: 6px !important;
                border-bottom-width: 2px !important;
              }
              #quote-capture-area .w-24.h-24 {
                width: 48px !important;
                height: 48px !important;
              }
              #quote-capture-area h1.text-3xl {
                font-size: 16px !important;
              }
              #quote-capture-area .text-slate-500.font-bold.text-sm {
                font-size: 10px !important;
              }
              #quote-capture-area .mt-2.text-xs {
                margin-top: 2px !important;
                font-size: 9px !important;
              }
              #quote-capture-area .bg-slate-900.text-white.p-4 {
                padding: 6px !important;
                margin-bottom: 6px !important;
                border-radius: 6px !important;
                gap: 8px !important;
              }
              #quote-capture-area .bg-slate-900.text-white.p-4 p {
                font-size: 10px !important;
              }
              #quote-capture-area .space-y-6 {
                margin-top: 2px !important;
                margin-bottom: 2px !important;
              }
              #quote-capture-area .space-y-6 > * + * {
                margin-top: 4px !important;
              }
              #quote-capture-area h3 {
                margin-bottom: 2px !important;
                font-size: 9.5px !important;
                padding: 2px 6px !important;
              }
              #quote-capture-area td,
              #quote-capture-area th {
                padding-top: 2px !important;
                padding-bottom: 2px !important;
                font-size: 9.5px !important;
              }
              #quote-capture-area .mt-8.grid {
                margin-top: 4px !important;
                gap: 6px !important;
              }
              #quote-capture-area .space-y-4 > * + * {
                margin-top: 4px !important;
              }
              #quote-capture-area .p-4.rounded-xl {
                padding: 6px !important;
                border-radius: 6px !important;
              }
              #quote-capture-area .p-4.rounded-xl p {
                font-size: 9.5px !important;
                line-height: 1.2 !important;
              }
              #quote-capture-area .bg-black.text-white.p-6 {
                padding: 6px !important;
                border-radius: 8px !important;
              }
              #quote-capture-area p.text-4xl {
                font-size: 18px !important;
              }
              #quote-capture-area .mt-12.pt-6 {
                margin-top: 6px !important;
                padding-top: 4px !important;
              }
              #quote-capture-area .w-64 {
                width: 150px !important;
                margin-bottom: 2px !important;
              }
            }
          `}</style>
          <div className="max-w-4xl mx-auto bg-white shadow-2xl p-10 print:shadow-none print:p-0 border border-slate-400 relative print-modal-container dark:bg-slate-800 dark:border-slate-700">
            <div id="quote-capture-area" className="p-10 bg-white print:p-0 dark:bg-slate-800 print:text-black">
              <div className="flex justify-between items-start border-b-4 border-rose-600 pb-6 mb-6">
                <div className="flex gap-6 items-center">
                  <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center overflow-hidden">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Bike size={48} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-black tracking-tighter uppercase">{companyData.nomeFantasia || 'Kombat Moto Peças'}</h1>
                    <p className="text-slate-500 font-bold text-sm dark:text-slate-400">Oficina Mecânica Multimarcas & Acessórios</p>
                    <div className="mt-2 text-xs text-slate-400 font-medium">
                      <p>{companyData.endereco}, {companyData.bairro}</p>
                      <p>Andirá - PR | {companyData.cep}</p>
                      <p className="text-black font-bold">Contato: {companyData.telefone}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-black text-white px-4 py-2 rounded-lg font-black text-sm uppercase mb-2">Orçamento #{String(isPrintingQuote.id).slice(0, 8)}</div>
                  <p className="text-slate-400 text-xs font-bold uppercase">Data: {new Date(isPrintingQuote.created_at).toLocaleDateString('pt-BR')}</p>
                  <p className="text-rose-600 text-xs font-black uppercase">Válido por {isPrintingQuote.validity_days} dias</p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 flex flex-col md:flex-row justify-between gap-4 avoid-break">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Cliente</p>
                  <p className="font-bold uppercase">{isPrintingQuote.customer_name || 'Cliente não identificado'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Motocicleta / Detalhes</p>
                  <p className="font-bold uppercase">{isPrintingQuote.motorcycle_details || '--'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="overflow-hidden print:overflow-visible">
                  <h3 className="text-xs font-black bg-black text-white px-3 py-1 inline-block uppercase mb-2 tracking-widest">Descrição de Peças e Acessórios</h3>
                  <table className="w-full text-left border-collapse table-fixed print:table-auto">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400 w-[40px]">Qtd</th>
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400">Descrição do Item</th>
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400 text-right w-[100px]">Valor Unit.</th>
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400 text-right w-[100px]">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isPrintingQuote.items.filter(i => i.type === 'Peça').map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-400 hover:bg-slate-50 dark:border-slate-700">
                          <td className="py-2 font-bold text-slate-800 text-[11px] align-top dark:text-slate-100">{item.quantity}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] uppercase break-words pr-4 dark:text-slate-100">{item.description}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] text-right pr-2 align-top dark:text-slate-100">R$ {item.price.toFixed(2)}</td>
                          <td className="py-2 font-black text-black text-[11px] text-right align-top">R$ {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      {isPrintingQuote.items.filter(i => i.type === 'Peça').length === 0 && (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-300 text-xs italic">Nenhuma peça relacionada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-hidden print:overflow-visible">
                  <h3 className="text-xs font-black bg-rose-600 text-white px-3 py-1 inline-block uppercase mb-2 tracking-widest">Serviços / Mão de Obra</h3>
                  <table className="w-full text-left border-collapse table-fixed print:table-auto">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400 w-[40px]">Qtd</th>
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400">Descrição do Serviço</th>
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400 text-right w-[100px]">Valor Unit.</th>
                        <th className="py-2 text-[10px] font-black uppercase text-slate-400 text-right w-[100px]">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isPrintingQuote.items.filter(i => i.type === 'Serviço').map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-400 hover:bg-slate-50 dark:border-slate-700">
                          <td className="py-2 font-bold text-slate-800 text-[11px] align-top dark:text-slate-100">{item.quantity}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] uppercase break-words pr-4 dark:text-slate-100">{item.description}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] text-right pr-2 align-top dark:text-slate-100">R$ {item.price.toFixed(2)}</td>
                          <td className="py-2 font-black text-rose-600 text-[11px] text-right align-top">R$ {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      {isPrintingQuote.items.filter(i => i.type === 'Serviço').length === 0 && (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-300 text-xs italic">Nenhum serviço relacionado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 avoid-break">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Observações Técnicas</p>
                    <p className="text-xs text-slate-700 leading-relaxed italic dark:text-slate-100">{isPrintingQuote.observations || 'Nenhuma observação técnica.'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Termos de Garantia</p>
                    <p className="text-[10px] text-slate-600 leading-tight dark:text-slate-400">{isPrintingQuote.warranty_terms}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-end space-y-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Total das Peças</p>
                    <p className="text-xl font-bold text-slate-900 border-b border-slate-400 pb-2 dark:text-slate-100 dark:border-slate-700">R$ {isPrintingQuote.items.filter(i => i.type === 'Peça').reduce((acc, i) => acc + i.total, 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Total dos Serviços</p>
                    <p className="text-xl font-bold text-slate-900 border-b border-slate-400 pb-2 dark:text-slate-100 dark:border-slate-700">R$ {isPrintingQuote.items.filter(i => i.type === 'Serviço').reduce((acc, i) => acc + i.total, 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-black text-white p-6 rounded-2xl text-right w-full">
                    <p className="text-xs font-black uppercase tracking-[0.2em] mb-2">Total Geral do Orçamento</p>
                    <p className="text-4xl font-black text-rose-500">R$ {isPrintingQuote.total_value.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-400 flex flex-col items-center avoid-break dark:border-slate-700">
                <div className="w-64 border-b border-slate-900 mb-2"></div>
                <p className="text-xs font-black uppercase text-black tracking-widest">{isPrintingQuote.customer_name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold text-center">Autorização de Execução / Cliente</p>
              </div>
            </div> {/* End of quote-capture-area */}

            <div className="mt-8 flex justify-center gap-4 no-print flex-wrap pb-10">
              <button onClick={() => window.print()} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center gap-2">
                <Printer size={20} /> Imprimir Orçamento
              </button>
              <button onClick={() => handleShareQuotePDF(isPrintingQuote!)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
                <FileText size={20} /> Enviar PDF WhatsApp
              </button>
              <button onClick={() => handleShareQuoteWhatsApp(isPrintingQuote!)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2">
                <MessageCircle size={20} /> Enviar Texto WhatsApp
              </button>
              <button onClick={() => setIsPrintingQuote(null)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all dark:bg-slate-800 dark:text-slate-400">
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
      <AIAssistant />
    </>
  );
}
