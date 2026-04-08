import React, { useState, useEffect, useRef, useDeferredValue, useMemo } from 'react';
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
  Wallet,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Link,
  Upload,
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
  ShoppingBag
} from 'lucide-react';
import QuickEntryModule from './components/QuickEntryModule';
import { motion, AnimatePresence } from 'motion/react';
import BillingAutomationBox from './components/BillingAutomationBox';
import VirtualCatalogModal from './components/VirtualCatalogModal';
import Auth from './components/Auth';
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
}

interface FixedService {
  id: string;
  name: string;
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
  type?: 'Peça' | 'Serviço';
}

interface Sale {
  id: string;
  user_id?: string;
  customer_id?: number;
  customer_name: string;
  items: SaleItem[];
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
  type: 'Peça' | 'Serviço';
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
const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
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
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-white w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden`}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-400">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
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
            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all mt-4"
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
  const [inventoryView, setInventoryView] = useState<'list' | 'grid'>('list');
  const [customerViewMode, setCustomerViewMode] = useState<'list' | 'grid'>('grid');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [registeredServices, setRegisteredServices] = useState<RegisteredService[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

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
        if (!res.ok) throw new Error(data.error || 'Erro na operação');
        return data;
      } else {
        const text = await res.text();
        if (!res.ok) throw new Error(`Erro no servidor (${res.status}): A rota /api/${route} pode estar faltando ou o servidor precisa ser reiniciado.`);
        return text;
      }
    },
    put: async (route: string, id: any, body: any) => {
      const res = await fetch(`/api/${route}/${id}`, {
        method: 'PUT',
        headers: localApi.getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na operação');
      return data;
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
    delete: async (route: string, id: any) => {
      const res = await fetch(`/api/${route}/${id}`, { 
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
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  // Form States
  const [customerForm, setCustomerForm] = useState({ name: '', nickname: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1 });
  const [productForm, setProductForm] = useState({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '', image_url2: '', image_url3: '', image_url4: '', brand: '', location: '', application: '' });
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
    items: SaleItem[];
    payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
    due_date: string;
    sale_condition: 'Vista' | 'Prazo';
    installments: number;
  }>({
    customer_id: '',
    items: [],
    payment_method: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sale_condition: 'Vista',
    installments: 1
  });
  const [osForm, setOsForm] = useState<{
    customer_id: string;
    motorcycle_id: string;
    items: SaleItem[];
    selected_fixed_services: { id: string; name: string; payout: number; quantity: number }[];
    labor_value: string;
    mechanic_id: string;
    payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
    status: 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue';
    due_date: string;
    service_description: string;
    km: string;
  }>({
    customer_id: '',
    motorcycle_id: '',
    items: [],
    selected_fixed_services: [],
    labor_value: '0',
    mechanic_id: '',
    payment_method: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado',
    status: 'Aberto' as 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    service_description: '',
    km: ''
  });
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
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
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


  
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  async function fetchData() {
    if (isFetchingRef.current) return;
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) return;
    
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

      // Fetch each table independently to avoid one failing route blocking everything
      const productsData = await fetchTable('products').catch(() => []);
      const customersData = await fetchTable('customers').catch(() => []);
      const motorcyclesData = await fetchTable('motorcycles').catch(() => []);
      const salesData = await fetchTable('sales').catch(() => []);
      const leadsData = await fetchTable('leads').catch(() => []);
      const mechanicsData = await fetchTable('mechanics').catch(() => []);
      const fixedServicesData = await fetchTable('fixed_services').catch(() => []);
      const distributorsData = await fetchTable('distributors').catch(() => []);
      const ordersData = await fetchTable('purchase_orders').catch(() => []);
      const cashSessionsData = await fetchTable('cash_sessions').catch(() => []);
      const cashTransactionsData = await fetchTable('cash_transactions').catch(() => []);
      const quotesData = await fetchTable('quotes').catch(() => []);
      const servicesData = await fetchTable('registered_services').catch(() => []);
      const workshopPurchasesData = await fetchTable('workshop_purchases').catch(() => []);

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
      if (cashSessionsData) setCashSessions(cashSessionsData);
      if (cashTransactionsData) setCashTransactions(cashTransactionsData);
      if (quotesData) setQuotes(quotesData);
      if (servicesData) setRegisteredServices(servicesData);
      if (workshopPurchasesData) setWorkshopPurchases(workshopPurchasesData);

      if (Array.isArray(cashSessionsData)) {
        const sessions = cashSessionsData.map((s: any) => ({
          id: s.id, openedAt: s.opened_at, closedAt: s.closed_at,
          openingBalance: s.opening_balance, closingBalance: s.closing_balance,
          expectedBalance: s.expected_balance || 0, status: s.status, notes: s.notes
        }));
        setCashSessions(sessions);
        const active = sessions.find((s: any) => s.status === 'Aberto');
        if (active) setActiveSession(active);
      }

      if (Array.isArray(cashTransactionsData)) {
        setCashTransactions(cashTransactionsData.map((t: any) => ({
          id: t.id, sessionId: t.session_id, type: t.type, amount: t.amount,
          description: t.description, date: t.date
        })));
      }

      // Stats Simplificados
      if (Array.isArray(salesData)) {
        const rev = salesData.reduce((acc: number, s: any) => acc + (s.total || 0), 0);
        setStats({
          revenue: rev,
          openServiceOrders: salesData.filter((s: any) => s.type === 'Oficina' && s.status !== 'Entregue').length,
          topProducts: [],
          avgTicketCounter: 0,
          avgTicketService: 0
        });
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
      razaoSocial: '',
      nomeFantasia: 'Kombat Moto Peças',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('companyData', JSON.stringify(companyData));
  }, [companyData]);
  const [fiadoSettings, setFiadoSettings] = useState(() => {
    const saved = localStorage.getItem('fiadoSettings');
    return saved ? JSON.parse(saved) : {
      monthlyInterest: 2.5,
      notificationDaysBefore: 3,
      notificationDaysAfter: 5,
      autoNotification: true,
      lateFeeRate: 2, // 2% multa
      lateInterestRate: 1 // 1% juros ao mês
    };
  });

  useEffect(() => {
    localStorage.setItem('fiadoSettings', JSON.stringify(fiadoSettings));
  }, [fiadoSettings]);

  const [cardFeesSettings, setCardFeesSettings] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('cardFeesSettings');
    return saved ? JSON.parse(saved) : DEFAULT_CARD_FEES;
  });

  useEffect(() => {
    localStorage.setItem('cardFeesSettings', JSON.stringify(cardFeesSettings));
  }, [cardFeesSettings]);

  const [financialTab, setFinancialTab] = useState<'caixa' | 'receber' | 'taxas' | 'automacao'>('caixa');

  // Financial State
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashForm, setCashForm] = useState({ openingBalance: '', notes: '' });
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ type: 'Sangria' as 'Suprimento' | 'Sangria', amount: '', description: '' });

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
    fetchData();
    setAuthChecking(false);
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
    let total = itemsBaseTotal;
    let finalItems = [...pdvForm.items];

    if (pdvForm.sale_condition === 'Prazo') {
      const fee = cardFeesSettings[pdvForm.installments] || 0;
      const divisor = 1 - (fee / 100);
      total = divisor > 0 ? (itemsBaseTotal / divisor) : itemsBaseTotal;
      const diff = total - itemsBaseTotal;
      if (diff > 0) {
        finalItems.push({
          description: `TAXA DE PARCELAMENTO (${pdvForm.installments}x)`,
          quantity: 1,
          price: diff
        });
      }
    }

    const customer = pdvForm.customer_id ? customers.find(c => c.id === parseInt(pdvForm.customer_id)) : null;

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

    const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newSale: Sale = {
      id: saleId,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Consumidor Final',
      items: finalItems,
      labor_value: 0,
      commission: 0,
      total,
      payment_method: pdvForm.payment_method,
      type: 'Balcão',
      date: new Date().toISOString(),
      payment_status: pdvForm.payment_method === 'Fiado' ? 'Pendente' : 'Pago',
      due_date: pdvForm.payment_method === 'Fiado' ? pdvForm.due_date : undefined,
      paid_date: pdvForm.payment_method !== 'Fiado' ? new Date().toISOString() : undefined
    };

    try {
      // Send sale with items to the single transational endpoint
      await localApi.post('sales', {
        ...newSale,
        sale_items: finalItems
      });

      setSales([newSale, ...sales]);
      setIsPdvModalOpen(false);
      setSelectedSaleForReceipt(newSale);
      setPdvForm({
        customer_id: '',
        items: [],
        payment_method: 'Pix',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sale_condition: 'Vista',
        installments: 1
      });
      alert(`Venda ${newSale.id} concluída com sucesso!`);
      fetchData(); // Refresh to update all states (stock, cash, etc)
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

    setOsForm({
      customer_id: os.customer_id?.toString() || '',
      motorcycle_id: motorcycle?.id.toString() || '',
      items: os.items || [],
      selected_fixed_services: [],
      labor_value: os.labor_value.toString(),
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

    const totalItems = osForm.items.filter(i => i.product_id).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const laborValueFromItems = osForm.items.filter(i => !i.product_id).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const laborValueManual = parseFloat(osForm.labor_value.toString().replace(',', '.')) || 0;
    const laborValue = laborValueFromItems + laborValueManual;
    const totalBase = totalItems + laborValue;
    let total = totalBase;
    let finalItems = [...osForm.items];
    const customer = osForm.customer_id ? customers.find(c => c.id === parseInt(osForm.customer_id)) : null;
    const motorcycle = osForm.motorcycle_id ? motorcycles.find(m => m.id === parseInt(osForm.motorcycle_id)) : null;
    const mechanic = mechanics.find(m => m.id === osForm.mechanic_id);

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
        .filter(s => s.customer_id === customer.id && s.payment_status === 'Pendente')
        .reduce((acc, s) => acc + s.total, 0);

      if (currentDebt + total > (customer.credit_limit || 0)) {
        alert(`Limite de crédito excedido! \nLimite: ${formatBRL(customer.credit_limit)} \nDívida Atual: ${formatBRL(currentDebt)} \nEsta O.S.: ${formatBRL(total)}`);
        return;
      }
    }

    // Calculate Commission
    let commission = 0;
    if (mechanic) {
      (osForm.selected_fixed_services || []).forEach(sfs => {
        commission += sfs.payout * sfs.quantity;
      });

      if (laborValue > 0) {
        commission += laborValue * 0.5;
      }
    }

    const osId = editingOS ? editingOS.id : Math.random().toString(36).substr(2, 9).toUpperCase();
    const newOS: Sale = {
      id: osId,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Cliente O.S.',
      items: finalItems,
      labor_value: laborValue,
      mechanic_id: mechanic?.id,
      mechanic_name: mechanic?.name,
      commission,
      total,
      payment_method: osForm.payment_method,
      type: 'Oficina',
      date: editingOS ? editingOS.date : new Date().toISOString(),
      moto_details: motorcycle ? `${motorcycle.model} (${motorcycle.plate}) - KM: ${osForm.km}` : `KM: ${osForm.km}`,
      payment_status: osForm.payment_method === 'Fiado' ? 'Pendente' : 'Pago',
      due_date: osForm.payment_method === 'Fiado' ? osForm.due_date : undefined,
      paid_date: osForm.payment_method !== 'Fiado' ? new Date().toISOString() : undefined,
      service_description: osForm.service_description,
      status: osForm.status
    };

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
          sale_items: osForm.items,
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
          sale_items: osForm.items,
          motorcycle_id: motorcycle?.id,
          motorcycle_km: parseInt(osForm.km) || 0
        });
      }

      fetchData();
      setIsOsModalOpen(false);
      setEditingOS(null);
      setSelectedSaleForOS(newOS);
      setOsForm({
        customer_id: '',
        motorcycle_id: '',
        items: [],
        selected_fixed_services: [],
        labor_value: '0',
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

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Vendas de Hoje</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{formatBRL(totalToday)}</p>
              <p className="text-sm text-slate-500 mt-1">{todaySales.length} atendimentos realizados</p>

              <div className="mt-6 pt-6 border-t border-slate-400 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Por Meio de Pagamento</p>
                {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => {
                  const amount = todaySales.filter(s => s.payment_method === method).reduce((acc, curr) => acc + curr.total, 0);
                  return (
                    <div key={method} className="flex justify-between text-sm">
                      <span className="text-slate-500">{method}</span>
                      <span className="font-bold text-slate-900">{formatBRL(amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsPdvModalOpen(true)}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
            >
              <PlusCircle size={24} />
              Nova Venda / O.S.
            </button>
          </div>

          {/* Recent Sales List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden">
              <div className="p-6 border-b border-slate-400 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Últimas Movimentações</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar vendas..."
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none text-sm w-48"
                    value={salesSearchTerm}
                    onChange={e => setSalesSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-300 max-h-[600px] overflow-y-auto">
                {sales.filter(s => {
                  const search = (salesSearchTerm + globalSearchTerm).toLowerCase();
                  return (
                    (s.customer_name || '').toLowerCase().includes(search) ||
                    (s.id || '').toLowerCase().includes(search) ||
                    s.items.some(i => (i.description || '').toLowerCase().includes(search))
                  );
                }).map(sale => (
                  <div key={sale.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${sale.type === 'Oficina' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                          {sale.type === 'Oficina' ? 'ORDEM DE SERVIÇO' : 'VENDA BALCÃO'}
                        </span>
                        <h4 className="font-bold text-slate-900">{sale.customer_name}</h4>
                        <p className="text-xs text-slate-500">ID: {sale.id} • {new Date(sale.date).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatBRL(sale.total)}</p>
                        <p className="text-xs text-rose-600 font-medium">{sale.payment_method}</p>
                        {sale.payment_method === 'Fiado' && sale.total - (sale.paid_total || 0) > 0 && (
                          <p className="text-[9px] font-black text-amber-500 uppercase mt-0.5">Pend: {formatBRL(sale.total - (sale.paid_total || 0))}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="px-2 py-1 bg-slate-900 rounded text-[10px] text-white">
                        <span className="font-bold">TOTAL GERAL:</span> {formatBRL(sale.total)}
                      </div>
                      <div className="px-2 py-1 bg-blue-50 rounded text-[10px] text-blue-700">
                        <span className="font-bold">TOTAL PEÇAS:</span> {formatBRL(sale.total - (sale.labor_value || 0))}
                      </div>
                      <div className="px-2 py-1 bg-amber-50 rounded text-[10px] text-amber-700">
                        <span className="font-bold">TOTAL SERVIÇOS:</span> {formatBRL(sale.labor_value || 0)}
                      </div>
                      {sale.type === 'Oficina' && (
                        <>
                          <div className="px-2 py-1 bg-green-50 rounded text-[10px] text-green-700">
                            <span className="font-bold">Comissão ({sale.mechanic_name}):</span> {formatBRL(sale.commission)}
                          </div>
                        </>
                      )}
                    </div>

                    {sale.moto_details && (
                      <p className="text-xs text-slate-600 bg-slate-100 p-2 rounded-lg mt-2">
                        <Bike size={12} className="inline mr-1" /> {sale.moto_details}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Printer size={10} /> Ver Recibo Térmico
                      </button>
                      {sale.type === 'Oficina' && (
                        <button
                          onClick={() => setSelectedSaleForOS(sale)}
                          className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Printer size={10} /> Imprimir O.S.
                        </button>
                      )}
                      {sale.payment_method === 'Fiado' && sale.payment_status === 'Pendente' && (
                        <div className="flex-1 flex justify-center">
                          {payingSaleId === sale.id ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                className="w-24 px-2 py-1 bg-white border border-slate-400 rounded text-[10px] font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="Valor"
                                value={partialPaymentAmount}
                                onChange={(e) => setPartialPaymentAmount(e.target.value)}
                              />
                              <button
                                onClick={() => handlePartialPayment(sale, partialPaymentAmount)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 transition-all uppercase"
                              >
                                Baixar
                              </button>
                              <button
                                onClick={() => { setPayingSaleId(null); setPartialPaymentAmount(''); }}
                                className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold hover:bg-slate-200 transition-all"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setPayingSaleId(sale.id); setPartialPaymentAmount(''); }}
                              className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-1 border border-rose-100"
                            >
                              <DollarSign size={12} /> Registrar Pagamento
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-[10px] font-bold text-rose-300 hover:text-rose-600 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <Trash2 size={10} /> Excluir Venda
                      </button>
                    </div>
                  </div>
                ))}
                {sales.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                    Nenhuma venda registrada ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCRM = () => {
    const columns: Lead['status'][] = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];
    const filteredLeads = leads.filter(l => {
      const search = (searchTerm + globalSearchTerm).toLowerCase();
      return (
        l.name.toLowerCase().includes(search) ||
        l.company.toLowerCase().includes(search)
      );
    });

    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">CRM de Vendas</h2>
            <p className="text-sm text-slate-500">Gerencie seus leads e negociações</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar leads..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setEditingLead(null);
                setLeadForm({ name: '', company: '', value: '', priority: 'Média', phone: '' });
                setIsLeadModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
            >
              <Plus size={18} />
              Novo Lead
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-[600px]">
          {columns.map(column => (
            <div key={column} className="flex-shrink-0 w-80 bg-slate-50/50 rounded-2xl border border-slate-400 flex flex-col">
              <div className="p-4 border-b border-slate-400 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  {column}
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {filteredLeads.filter(l => l.status === column).length}
                  </span>
                </h3>
                <MoreVertical size={16} className="text-slate-400" />
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {filteredLeads.filter(l => l.status === column).map(lead => (
                  <motion.div
                    layoutId={lead.id}
                    key={lead.id}
                    className="bg-white p-4 rounded-xl border border-slate-400 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.priority === 'Alta' ? 'bg-rose-100 text-rose-600' :
                        lead.priority === 'Média' ? 'bg-amber-100 text-amber-600' :
                          'bg-rose-100 text-rose-600'
                        }`}>
                        {lead.priority}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Editar Lead"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsMessageModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Enviar Mensagem"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">{lead.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">{lead.company}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-400">
                      <span className="text-sm font-bold text-slate-900">{formatBRL(lead.value)}</span>
                      <select
                        className="text-[10px] bg-slate-50 border-none rounded-md p-1 focus:ring-0 cursor-pointer"
                        value={lead.status}
                        onChange={(e) => moveLead(lead.id, e.target.value as any)}
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOS = () => {
    const osSales = sales.filter(s => s.type === 'Oficina');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ordens de Serviço</h2>
            <p className="text-sm text-slate-500">Gerenciamento de manutenções e reparos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar O.S..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none w-64"
                value={salesSearchTerm}
                onChange={e => setSalesSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setEditingOS(null);
                setOsForm({
                  customer_id: '',
                  motorcycle_id: '',
                  items: [],
                  selected_fixed_services: [],
                  labor_value: '0',
                  mechanic_id: '',
                  payment_method: 'Pix',
                  status: 'Aberto',
                  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  service_description: '',
                  km: ''
                });
                setIsOsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all font-bold shadow-lg shadow-amber-100"
            >
              <PlusCircle size={20} />
              Nova O.S.
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {osSales.filter(os => {
            const search = (salesSearchTerm + globalSearchTerm).toLowerCase();
            return (
              os.customer_name.toLowerCase().includes(search) ||
              os.id.toLowerCase().includes(search) ||
              os.moto_details?.toLowerCase().includes(search) ||
              os.mechanic_name?.toLowerCase().includes(search)
            );
          }).map(os => (
            <div key={os.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-xl h-fit">
                    <Bike size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase">
                        O.S. #{os.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(os.date).toLocaleDateString()} às {new Date(os.date).toLocaleTimeString()}
                      </span>
                      {os.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${os.status === 'Aberto' ? 'bg-slate-100 text-slate-600' :
                          os.status === 'Em Andamento' ? 'bg-blue-100 text-blue-600' :
                            os.status === 'Pronto' ? 'bg-rose-100 text-rose-600' :
                              'bg-indigo-100 text-indigo-600'
                          }`}>
                          {os.status}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{os.customer_name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Bike size={14} /> {os.moto_details}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <div className="text-xs">
                        <p className="text-slate-400 uppercase font-bold text-[9px]">Mecânico</p>
                        <p className="font-medium text-slate-700">{os.mechanic_name || 'Não atribuído'}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-slate-400 uppercase font-bold text-[9px]">Pagamento</p>
                        <p className="font-medium text-slate-700">{os.payment_method}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total da O.S.</p>
                  <p className="text-2xl font-black text-slate-900">{formatBRL(os.total)}</p>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      onClick={() => handleEditOS(os)}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 border border-slate-400"
                    >
                      <Edit size={14} /> Editar O.S.
                    </button>
                    <button
                      onClick={() => setSelectedSaleForOS(os)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Printer size={14} /> Imprimir A4
                    </button>
                    <button
                      onClick={() => setSelectedSaleForReceipt(os)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Printer size={14} /> Recibo 80mm
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-400 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Peças</p>
                  <p className="font-bold text-slate-700">R$ {(os.total - os.labor_value).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Mão de Obra</p>
                  <p className="font-bold text-slate-700">R$ {os.labor_value.toFixed(2)}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-amber-500 uppercase">Comissão</p>
                  <p className="font-bold text-amber-700">R$ {os.commission.toFixed(2)}</p>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-rose-500 uppercase">Lucro Loja</p>
                  <p className="font-bold text-rose-700">R$ {(os.total - os.commission).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          {osSales.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-400 text-center">
              <Bike size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Nenhuma Ordem de Serviço encontrada</h3>
              <p className="text-sm text-slate-400 mt-1">Clique em "Nova O.S." para começar um atendimento na oficina.</p>
            </div>
          )}
        </div>
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
        sale.mechanic_id === mechanicId &&
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
            <p className="text-slate-500 text-center">Nenhuma venda fiado pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendingFiadoSales.map(sale => (
                <div key={sale.id} className="bg-slate-50 p-4 rounded-xl border border-slate-400 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Venda #{sale.id} - {sale.customer_name}</p>
                    <p className="text-sm text-slate-500">Total: R$ {sale.total.toFixed(2)}</p>
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
    } catch (err) {
      console.error('Error saving quote:', err);
      alert('Erro ao salvar orçamento.');
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
        details: `${purchaseData.quantity}x ${purchaseData.description}`,
        installments: purchaseData.installments
      };
      await localApi.post('workshop_purchases', payload);
      alert('Compra registrada com sucesso!');
      setActiveTab('dashboard');
      if (typeof fetchData === 'function') fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar compra:', error);
      alert('Erro ao salvar compra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderQuotes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Orçamentos Profissionais</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar orçamento..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
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
          q.customer_name.toLowerCase().includes(d_quoteSearchTerm.toLowerCase()) ||
          q.motorcycle_details?.toLowerCase().includes(d_quoteSearchTerm.toLowerCase())
        ).map((q) => (
          <div key={q.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${q.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' :
                q.status === 'Recusado' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                {q.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <FileText size={24} />
              </div>
              <div className="w-[calc(100%-60px)]">
                <h4 className="font-bold text-slate-900 uppercase text-sm truncate">{q.customer_name}</h4>
                <p className="text-xs text-slate-500">{new Date(q.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-medium truncate">
                <Bike size={12} className="inline mr-1 text-slate-400" />
                {q.motorcycle_details || 'Não informada'}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Geral:</span>
                <span className="font-black text-rose-600">R$ {q.total_value.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-400">
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
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-400">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">Nenhum orçamento cadastrado ainda.</p>
          </div>
        )}
      </div>

      {/* Quote Print View / High Resolution Layout */}
      {isPrintingQuote && (
        <div className="fixed inset-0 bg-white z-[999] overflow-y-auto p-8 print:p-0">
          <div className="max-w-4xl mx-auto bg-white shadow-2xl p-10 print:shadow-none print:p-0 border border-slate-400 relative">
            <div id="quote-capture-area" className="p-10 bg-white">
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
                    <p className="text-slate-500 font-bold text-sm">Oficina Mecânica Multimarcas & Acessórios</p>
                    <div className="mt-2 text-xs text-slate-400 font-medium">
                      <p>{companyData.endereco}, {companyData.bairro}</p>
                      <p>Andirá - PR | {companyData.cep}</p>
                      <p className="text-black font-bold">Contato: {companyData.telefone}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-black text-white px-4 py-2 rounded-lg font-black text-sm uppercase mb-2">Orçamento #{isPrintingQuote.id.slice(0, 8)}</div>
                  <p className="text-slate-400 text-xs font-bold uppercase">Data: {new Date(isPrintingQuote.created_at).toLocaleDateString('pt-BR')}</p>
                  <p className="text-rose-600 text-xs font-black uppercase">Válido por {isPrintingQuote.validity_days} dias</p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Cliente</p>
                  <p className="font-bold uppercase">{isPrintingQuote.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Motocicleta / Detalhes</p>
                  <p className="font-bold uppercase">{isPrintingQuote.motorcycle_details || '--'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="overflow-hidden">
                  <h3 className="text-xs font-black bg-black text-white px-3 py-1 inline-block uppercase mb-2 tracking-widest">Descrição de Peças e Acessórios</h3>
                  <table className="w-full text-left border-collapse table-fixed">
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
                        <tr key={idx} className="border-b border-slate-400 hover:bg-slate-50">
                          <td className="py-2 font-bold text-slate-800 text-[11px] align-top">{item.quantity}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] uppercase break-words pr-4">{item.description}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] text-right pr-2 align-top">R$ {item.price.toFixed(2)}</td>
                          <td className="py-2 font-black text-black text-[11px] text-right align-top">R$ {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      {isPrintingQuote.items.filter(i => i.type === 'Peça').length === 0 && (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-300 text-xs italic">Nenhuma peça relacionada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-hidden">
                  <h3 className="text-xs font-black bg-rose-600 text-white px-3 py-1 inline-block uppercase mb-2 tracking-widest">Serviços / Mão de Obra</h3>
                  <table className="w-full text-left border-collapse table-fixed">
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
                        <tr key={idx} className="border-b border-slate-400 hover:bg-slate-50">
                          <td className="py-2 font-bold text-slate-800 text-[11px] align-top">{item.quantity}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] uppercase break-words pr-4">{item.description}</td>
                          <td className="py-2 font-bold text-slate-800 text-[11px] text-right pr-2 align-top">R$ {item.price.toFixed(2)}</td>
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

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-400">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Observações Técnicas</p>
                    <p className="text-xs text-slate-700 leading-relaxed italic">{isPrintingQuote.observations || 'Nenhuma observação técnica.'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-400">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Termos de Garantia</p>
                    <p className="text-[10px] text-slate-600 leading-tight">{isPrintingQuote.warranty_terms}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-end space-y-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Total das Peças</p>
                    <p className="text-xl font-bold text-slate-900 border-b border-slate-400 pb-2">R$ {isPrintingQuote.items.filter(i => i.type === 'Peça').reduce((acc, i) => acc + i.total, 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Total dos Serviços</p>
                    <p className="text-xl font-bold text-slate-900 border-b border-slate-400 pb-2">R$ {isPrintingQuote.items.filter(i => i.type === 'Serviço').reduce((acc, i) => acc + i.total, 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-black text-white p-6 rounded-2xl text-right w-full">
                    <p className="text-xs font-black uppercase tracking-[0.2em] mb-2">Total Geral do Orçamento</p>
                    <p className="text-4xl font-black text-rose-500">R$ {isPrintingQuote.total_value.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-400 flex flex-col items-center">
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
              <button onClick={() => setIsPrintingQuote(null)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMechanics = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Equipe e Fornecedores</h2>
          <p className="text-sm text-slate-500">Mecânicos, Fornecedores e Repasses Fixos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingDistributor(null);
              setDistributorForm({ name: '', phone: '', contact_person: '' });
              setIsDistributorModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-400 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-400 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden">
          <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
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
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Regra: 50% em serviços variáveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMechanicForReport(m);
                      setIsMechanicReportModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-colors"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden">
          <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Settings size={18} className="text-amber-500" />
              Tabela de Repasses Fixos
            </h3>
          </div>
          <div className="divide-y divide-slate-300 max-h-[400px] overflow-y-auto">
            {sortedFixedServices.map(fs => (
              <div key={fs.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-900">{fs.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Repasse Fixo p/ Mecânico</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Valor Repasse</p>
                    <span className="font-black text-rose-600">R$ {fs.payout.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingFixedService(fs);
                        setFixedServiceForm({ name: fs.name, price: (fs as any).price?.toString() || '0', payout: fs.payout.toString() });
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-slate-400 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-rose-600" />
              Distribuidoras e Fornecedores
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 divide-y md:divide-y-0 max-h-[500px] overflow-y-auto">
            {sortedDistributors.map(d => (
              <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-400 hover:border-rose-500 transition-all group relative">
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
                      className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-200"
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
                      className="p-2 bg-white text-rose-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 uppercase text-sm truncate">{d.name}</h4>
                  <div className="flex items-center gap-2 text-slate-500">
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
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white border-2 border-dashed border-slate-300 rounded-3xl">
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
      </div>
    </div>
  );

  const handleWhatsApp = (item: any) => {
    const message = `Olá ${item.customer_name}, aqui é da Kombat Moto Peças. Sua ${item.model || 'moto'} (Placa ${item.plate || ''}) está com a revisão de ${item.current_km || 0} km próxima. Vamos agendar?`;
    window.open(`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      await localApi.post('cash_sessions', {
        id,
        opened_at: new Date().toISOString(),
        opening_balance: parseFloat(cashForm.openingBalance.toString().replace(',', '.')) || 0,
        status: 'Aberto',
        notes: cashForm.notes
      });

      setIsCashModalOpen(false);
      setCashForm({ openingBalance: '', notes: '' });
      fetchData();
      alert('Caixa aberto com sucesso!');
    } catch (error) {
      console.error('Error opening cash:', error);
      alert('Erro ao abrir caixa.');
    }
  };

  const handleCloseCash = async () => {
    if (!activeSession) return;
    const closingBalance = prompt("Informe o saldo final em dinheiro no caixa:");
    if (closingBalance === null) return;

    const sessionSales = sales.filter(s => s.date >= activeSession.openedAt && s.payment_method === 'Dinheiro');
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
      fetchData();
    } catch (error) {
      console.error('Error closing cash:', error);
      alert('Erro ao fechar caixa.');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      await localApi.post('cash_transactions', {
        id,
        session_id: activeSession?.id,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount.toString().replace(',', '.')) || 0,
        description: transactionForm.description,
        date: new Date().toISOString()
      });

      setIsTransactionModalOpen(false);
      setTransactionForm({ type: 'Sangria', amount: '', description: '' });
      fetchData();
      alert('Movimentação registrada!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao registrar movimentação.');
    }
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
      const { name, nickname, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, fine_rate, interest_rate } = customerForm;
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
        interest_rate: parseFloat((interest_rate || 0).toString().replace(',', '.')) || 0
      };

      if (editingCustomer) {
        await localApi.put('customers', editingCustomer.id, dataToSave);
      } else {
        await localApi.post('customers', dataToSave);
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      setCustomerForm({ name: '', nickname: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1 });
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para salvar produtos.');
      return;
    }

    try {
      let finalImageUrl = productForm.image_url;
      if (finalImageUrl && (finalImageUrl.startsWith('http') || finalImageUrl.startsWith('/images/'))) {
        const urlToShorten = finalImageUrl.startsWith('/') ? window.location.origin + finalImageUrl : finalImageUrl;
        finalImageUrl = await shortenUrl(urlToShorten);
      }

      const productData = {
        description: productForm.description,
        sku: productForm.sku,
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
        application: productForm.application
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
        brand: '',
        location: '',
        application: ''
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
      application: product.application || ''
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
      document.body.innerHTML = printContent.innerHTML;
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
              category: item.Categoria || item.Category || item.category || categorizeProduct(desc)
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
          onClick={() => setIsOsModalOpen(true)}
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
        <StatCard
          title="Faturamento Mensal"
          value={formatBRL(stats?.revenue)}
          icon={TrendingUp}
          color="bg-rose-500"
          subtitle="Vendas concluídas este mês"
        />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-rose-500" />
            Top 5 Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {stats?.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-sm font-bold text-slate-400 border border-slate-400">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-700">{p.description}</span>
                </div>
                <span className="text-sm font-bold text-rose-600">{p.total_sold} vendidos</span>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <p className="text-center text-slate-400 py-8">Nenhuma venda registrada ainda.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bike size={20} className="text-amber-500" />
            Próximas Revisões (CRM)
          </h3>
          <div className="space-y-4">
            {motorcycles.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">{m.customer_name}</p>
                  <p className="text-xs text-slate-500">{m.model} • {m.plate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                    {m.current_km} km
                  </span>
                  <button
                    onClick={() => handleWhatsApp(m)}
                    className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
        />
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Clientes e Motos</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl no-print">
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
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
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
            <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{c.name}</h4>
                  {c.nickname && <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">{c.nickname}</p>}
                  <p className="text-sm text-slate-500">CPF: {c.cpf || 'Não informado'}</p>
                  <p className="text-sm text-slate-500">Celular: {c.whatsapp || 'Não informado'}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Limite Total:</span>
                      <span className="text-xs font-bold text-slate-600">{formatBRL(c.credit_limit)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Saldo Disponível:</span>
                      <span className={`text-xs font-bold ${getCustomerRemainingCredit(c.id) > 0 ? 'text-rose-600' : 'text-rose-600'}`}>
                        {formatBRL(getCustomerRemainingCredit(c.id))}
                      </span>
                    </div>
                  </div>
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
                        interest_rate: c.interest_rate || 1
                      });
                      setIsCustomerModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Editar Cliente"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedCustomerForHistory(c)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Histórico de Vendas"
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-400">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">Motos Cadastradas</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {motorcycles.filter(m => m.customer_id === c.id).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm border border-slate-400">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{m.model}</p>
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
        <div className="bg-white rounded-3xl shadow-sm border border-slate-400 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-400">
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
                  <tr key={c.id} className="border-b border-slate-400 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.nickname && <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">{c.nickname}</p>}
                      <p className="text-[10px] text-slate-400">{motorcycles.filter(m => m.customer_id === c.id).length} moto(s) cadastrada(s)</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-bold">{c.whatsapp}</p>
                      <p className="text-[10px] text-slate-400 font-mono">CPF: {c.cpf || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Disponível</span>
                          <span className="text-rose-600">{formatBRL(getCustomerRemainingCredit(c.id))}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-600 rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, (getCustomerRemainingCredit(c.id) / (c.credit_limit || 1)) * 100))}%` }}
                          />
                        </div>
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
                          onClick={() => setSelectedCustomerForHistory(c)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
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
        <h2 className="text-2xl font-bold text-slate-900">Cadastro de Serviços</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar serviços..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-400">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Serviço</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Sugerido</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {sortedRegisteredServices.filter(s =>
              s.description.toLowerCase().includes(d_serviceSearchTerm.toLowerCase())
            ).map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{s.description}</td>
                <td className="px-6 py-4 text-rose-600 font-bold">R$ {s.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingService(s);
                        setServiceForm({ description: s.description, price: s.price.toString(), category: s.category || '' });
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
    </div>
  );

  const renderInventory = () => {
    const filtered = filteredInventoryProducts;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Estoque de Peças</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Sincronizar Estoque"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
                value={inventorySearchTerm}
                onChange={e => setInventorySearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
              <button
                onClick={() => setInventoryView('list')}
                className={`p-2 rounded-lg transition-all ${inventoryView === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Visualização em Lista"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setInventoryView('grid')}
                className={`p-2 rounded-lg transition-all ${inventoryView === 'grid' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Visualização em Cards"
              >
                <LayoutGrid size={20} />
              </button>
            </div>
            {selectedProductIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl shadow-sm"
              >
                <span className="text-sm font-black text-rose-600 uppercase tracking-widest">
                  {selectedProductIds.length} selecionado{selectedProductIds.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all font-bold text-xs uppercase"
                >
                  <Trash2 size={14} />
                  Excluir em Massa
                </button>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase"
                >
                  Cancelar
                </button>
              </motion.div>
            )}
            <div className="flex flex-col items-center">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium cursor-pointer">
                <Package size={18} />
                Importar Produtos
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportProducts} />
              </label>
              <a
                href="/api/export-template"
                className="text-[9px] text-blue-600 hover:underline font-bold uppercase mt-1"
              >
                Baixar Modelo
              </a>
            </div>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
            >
              <Printer size={18} />
              Exportar Produtos
            </button>
            <button
              onClick={() => setIsQuickInventoryOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-black shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95"
            >
              <ClipboardCheck size={20} />
              CONTAGEM RÁPIDA
            </button>
            <button
              onClick={() => setIsMassUpdateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-medium whitespace-nowrap"
            >
              <TrendingUp size={18} />
              Atualização em Massa
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '', brand: '', location: '', application: '' });
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium"
            >
              <Plus size={18} />
              Adicionar Produto
            </button>
          </div>
        </div>

        {inventoryView === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-400">
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-400 text-rose-600 focus:ring-rose-500"
                      checked={filtered.length > 0 && selectedProductIds.length === filtered.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds(filtered.map(p => p.id));
                        } else {
                          setSelectedProductIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">SKU / EAN</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">C / V (R$)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Estoque</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium">Buscando estoque...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-400 text-rose-600 focus:ring-rose-500"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleSelectProduct(p.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-400 cursor-pointer"
                            onClick={() => setSelectedProductDetail(p)}
                          >
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.description} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{p.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{p.unit}</span>
                              {p.brand && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">{p.brand}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-[11px] text-slate-500">
                        {p.sku || '-'} / {p.barcode || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[10px] text-slate-400">{formatBRL(p.purchase_price)}</p>
                        <p className="font-bold text-slate-900">{formatBRL(p.sale_price)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">
                          {p.stock} {p.unit === 'Unitário' ? 'un' : p.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-400 text-slate-400 font-medium">
                Nenhum produto encontrado.
              </div>
            ) : (
              <>
                {filtered.map((p) => (
                  <div key={p.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all group relative ${selectedProductIds.includes(p.id) ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-400'}`}>
                  <div className="absolute top-3 left-3 z-20">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer shadow-sm"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={() => toggleSelectProduct(p.id)}
                    />
                  </div>
                  <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.description}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => setSelectedProductDetail(p)}
                      />
                    ) : (
                      <ImageIcon size={48} className="text-slate-200" />
                    )}
                    <div className="absolute bottom-2 left-2">
                       <span className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                         {p.stock} em estoque
                       </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 uppercase leading-tight">{p.description}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mb-3">{p.sku}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Preço de Venda</p>
                        <p className="text-lg font-black text-slate-900">{formatBRL(p.sale_price)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderManualInventory = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-emerald-600 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Contagem Rápida iPhone</h2>
          <p className="opacity-80 font-bold">Bipe ou busque o produto para atualizar o estoque na hora.</p>
        </div>
        <ClipboardCheck className="absolute -right-4 -bottom-4 opacity-10" size={160} />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-300 shadow-sm space-y-6">
        <div className="relative">
          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Buscar/Bipar Produto</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input
              type="text"
              autoFocus
              placeholder="Nome, SKU ou Bipe o Código..."
              className="w-full pl-14 pr-4 py-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none text-xl transition-all font-bold placeholder:text-slate-300"
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
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-2xl shadow-2xl max-h-80 overflow-y-auto">
              {products.filter(p => 
                (p.description || '').toLowerCase().includes(quickInventorySearch.toLowerCase()) ||
                (p.sku || '').toLowerCase().includes(quickInventorySearch.toLowerCase()) ||
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
                  <span className="font-black text-slate-900 text-lg uppercase leading-none mb-1">{p.description}</span>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-tighter">
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
            className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-emerald-500 shadow-xl shadow-emerald-50"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-10">
              <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center relative group shrink-0">
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
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">ID: {selectedQuickProduct.id}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase leading-none">{selectedQuickProduct.description}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 font-bold text-sm uppercase">{selectedQuickProduct.brand || 'Sem Marca'}</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <p className="text-slate-400 font-bold text-sm uppercase">{selectedQuickProduct.location || 'Sem prateleira'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedQuickProduct(null)}
                className="p-4 bg-white border-2 border-slate-200 rounded-[1.5rem] hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all shadow-sm"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
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
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem]">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-6">
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

  // --- Advanced Finance Helpers ---
  const getCustomerScore = (customerId: number) => {
    const cSales = sales.filter(s => s.customer_id === customerId && s.payment_method === 'Fiado');
    if (cSales.length === 0) return 5.0; // Neutral score
    const onTime = cSales.filter(s => s.payment_status === 'Pago' && (!s.paid_date || !s.due_date || new Date(s.paid_date) <= new Date(s.due_date))).length;
    return parseFloat(((onTime / cSales.length) * 10).toFixed(1));
  };

  const calculateOverdueDebt = (sale: Sale) => {
    if (sale.payment_status === 'Pago' || !sale.due_date) return sale.total;
    const today = new Date();
    const dueDate = new Date(sale.due_date);
    if (today <= dueDate) return sale.total;

    const diffTime = Math.abs(today.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Regra dos 15% após o vencimento
    if (diffDays >= 30) {
      return sale.total * 1.15;
    }

    // Default fine and interest for minor delays
    const fine = sale.total * (fiadoSettings.lateFeeRate / 100);
    const interest = sale.total * (fiadoSettings.lateInterestRate / 100 / 30) * diffDays;
    return sale.total + fine + interest;
  };

  const generateCarne = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; border: 2px solid #333;">
        <div style="display: flex; justify-between; border-bottom: 2px solid #333; padding-bottom: 20px; align-items: center;">
          <img src="${companyLogo || ''}" style="max-height: 80px;" alt="Logo" />
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #e11d48;">KOMBAT MOTO PEÇAS</h2>
            <p style="margin: 5px 0;">${companyData.telefone}</p>
            <p style="margin: 0; font-size: 12px;">${companyData.endereco}, ${companyData.cidade}-PR</p>
          </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <h1 style="text-transform: uppercase; letter-spacing: 2px;">CARNÊ DE PAGAMENTO</h1>
          <p>Documento No: ${sale.id.slice(-8).toUpperCase()}</p>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
            <p><strong>BENEFICIÁRIO:</strong> ${companyData.razaoSocial || companyData.nomeFantasia}</p>
            <p><strong>CNPJ:</strong> ${companyData.cnpj}</p>
            <hr />
            <p><strong>PAGADOR:</strong> ${sale.customer_name}</p>
          </div>
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa;">
            <p><strong>VENCIMENTO:</strong> ${new Date(sale.due_date || '').toLocaleDateString('pt-BR')}</p>
            <p style="font-size: 1.2em; color: #e11d48;"><strong>VALOR: R$ ${sale.total.toFixed(2)}</strong></p>
          </div>
        </div>

        <p style="font-size: 12px; color: #666; font-style: italic;">
          * Após o vencimento, cobrar multa de ${fiadoSettings.lateFeeRate}% e juros de ${fiadoSettings.lateInterestRate}% ao mês.
          Local de pagamento: Kombat Moto Peças ou via PIX ${companyData.telefone}.
        </p>

        <div style="margin-top: 60px; border-top: 1px dashed #ccc; padding-top: 20px; text-align: center; color: #999;">
          Autenticação Mecânica / Canhoto de Controle
        </div>
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
        <div style="position: absolute; top: 10px; right: 20px; font-size: 24px; font-weight: bold;">Nº ${sale.id.slice(-6).toUpperCase()}</div>
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 40px; margin: 0;">NOTA PROMISSÓRIA</h1>
          <p style="font-size: 18px;">VENCIMENTO: ${new Date(sale.due_date || '').toLocaleDateString('pt-BR')}</p>
        </div>

        <p style="font-size: 20px; line-height: 2; text-align: justify;">
          Aos <strong>${new Date(sale.due_date || '').toLocaleDateString('pt-BR')}</strong> pagarei por esta via única de NOTA PROMISSÓRIA a 
          <strong>${companyData.razaoSocial || companyData.nomeFantasia}</strong>, CNPJ <strong>${companyData.cnpj}</strong>, ou à sua ordem, a quantia de 
          <strong>R$ ${sale.total.toFixed(2)}</strong> (Valor por extenso: ..........................................................................)
          pagável em <strong>Andirá-PR</strong>.
        </p>
        <p style="font-size: 14px; margin-top: 10px; font-style: italic;">
          * O não pagamento deste título até o vencimento acarretará em multa e encargos de mora, sendo que após 30 dias de atraso o valor total será reajustado em 15% de acordo com a política da empresa.
        </p>

        <div style="margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px;">
          <div>
            <p><strong>EMITENTE:</strong> ${sale.customer_name}</p>
            <p><strong>CPF/CNPJ:</strong> ....................................................</p>
            <p><strong>ENDEREÇO:</strong> ....................................................</p>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <div style="border-top: 2px solid #000; padding-top: 10px;">ASSINATURA DO EMITENTE</div>
          </div>
        </div>
      </div>
    `;

    printWindow.document.write(`<html><head><title>Promissória - ${sale.customer_name}</title></head><body onload="window.print()">${content}</body></html>`);
    printWindow.document.close();
  };

  const sendBillingWhatsapp = (sale: Sale, type: 'reminder' | 'overdue' | 'thanks') => {
    let msg = '';
    const name = sale.customer_name.split(' ')[0];
    const cleanPhone = sale.whatsapp?.replace(/\D/g, '') || '';

    if (type === 'reminder') {
      msg = `Olá ${name}! Passando para lembrar que sua parcela na Kombat Moto Peças vence em 2 dias (R$ ${sale.total.toFixed(2)}). Chave PIX: ${companyData.telefone}. Obrigado!`;
    } else if (type === 'overdue') {
      const debt = calculateOverdueDebt(sale);
      msg = `Olá ${name}, notamos um atraso de pagamento no valor de R$ ${sale.total.toFixed(2)}. Com encargos, o valor atual é R$ ${debt.toFixed(2)}. Podemos ajudar?`;
    } else {
      msg = `Obrigado pelo pagamento, ${name}! Seu saldo foi atualizado com sucesso. Kombat Moto Peças agradece a preferência! 🏍️`;
    }

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const renderFinancial = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySales = sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const productSales = monthlySales.reduce((acc, s) => acc + s.items.filter(i => i.product_id).reduce((sum, i) => sum + (i.price * i.quantity), 0), 0);
    const productCosts = monthlySales.reduce((acc, s) => acc + s.items.filter(i => i.product_id).reduce((sum, i) => {
      const product = products.find(p => p.id === i.product_id);
      return sum + ((product?.purchase_price || 0) * i.quantity);
    }, 0), 0);
    const productProfit = productSales - productCosts;
    const profitMargin = productSales > 0 ? (productProfit / productSales) * 100 : 0;
    const serviceSales = monthlySales.reduce((acc, s) => acc + (s.labor_value || 0), 0);
    const totalRevenue = productSales + serviceSales;

    return (
      <div className="space-y-8">
        {/* Secondary Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit no-print">
          {[
            { id: 'caixa', label: 'Fluxo de Caixa', icon: Wallet },
            { id: 'receber', label: 'Contas a Receber', icon: CreditCard },
            { id: 'taxas', label: 'Taxas de Cartão', icon: Calculator },
            { id: 'automacao', label: 'Cobrança & Alertas', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFinancialTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${financialTab === tab.id ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {financialTab === 'caixa' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Cash Control Header */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${activeSession ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Wallet size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Status do Caixa</h3>
                  <p className={`text-sm font-medium ${activeSession ? 'text-rose-600' : 'text-slate-500'}`}>
                    {activeSession ? `ABERTO (Início: ${new Date(activeSession.openedAt).toLocaleTimeString()})` : 'CAIXA FECHADO'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!activeSession ? (
                  <button
                    onClick={() => setIsCashModalOpen(true)}
                    className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2"
                  >
                    <Plus size={18} /> Abrir Caixa
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsTransactionModalOpen(true)}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <ArrowUpCircle size={18} /> Sangria/Suprimento
                    </button>
                    <button
                      onClick={handleCloseCash}
                      className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2"
                    >
                      <X size={18} /> Fechar Caixa
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Package size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Venda de Produtos</p>
                </div>
                <h4 className="text-2xl font-black text-slate-900">R$ {productSales.toFixed(2)}</h4>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Bike size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Serviços</p>
                </div>
                <h4 className="text-2xl font-black text-slate-900">R$ {serviceSales.toFixed(2)}</h4>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 bg-gradient-to-br from-rose-600 to-rose-700 text-white border-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 text-white rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                  <p className="text-sm font-bold text-white/70 uppercase tracking-wider">Líquido em Caixa</p>
                </div>
                <h4 className="text-2xl font-black">R$ {totalRevenue.toFixed(2)}</h4>
              </div>
            </div>

            {/* Métricas de Lucro em Peças */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                    <Truck size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Custo das Peças</p>
                </div>
                <h4 className="text-2xl font-black text-slate-900">R$ {productCosts.toFixed(2)}</h4>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lucro Líquido (Peças)</p>
                </div>
                <h4 className="text-2xl font-black text-emerald-600">R$ {productProfit.toFixed(2)}</h4>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Percent size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Margem de Lucro</p>
                </div>
                <h4 className="text-2xl font-black text-indigo-600">{profitMargin.toFixed(1)}%</h4>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" />
                Meios de Recebimento
              </h3>
              <div className="space-y-4">
                {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => {
                  const total = monthlySales.filter(s => s.payment_method === method).reduce((acc, s) => acc + s.total, 0);
                  const percentage = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0;
                  return (
                    <div key={method} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-600">{method}</span>
                        <span className="font-bold text-slate-900">R$ {total.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-indigo-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {financialTab === 'receber' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Vencidos', value: sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente' && new Date(s.due_date!) < now).length, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
                { label: 'Vence Hoje', value: sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente' && new Date(s.due_date!).toLocaleDateString() === now.toLocaleDateString()).length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Bell },
                { label: 'A Vencer', value: sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente' && new Date(s.due_date!) > now).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
                { label: 'Total Recebido', value: `R$ ${sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pago').reduce((acc, s) => acc + s.total, 0).toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ShieldCheck }
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} ${stat.color} p-4 rounded-2xl border border-current/10 flex items-center gap-4`}>
                  <div className="p-3 bg-white/50 rounded-xl"><stat.icon size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-70">{stat.label}</p>
                    <p className="text-xl font-black">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-400 overflow-hidden">
              <div className="p-6 border-b border-slate-400 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Gavel size={20} className="text-rose-500" />
                  Listagem de Débitos Ativos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Cliente / Score</th>
                      <th className="px-6 py-4">Vencimento</th>
                      <th className="px-6 py-4">Original</th>
                      <th className="px-6 py-4">Valor Atual</th>
                      <th className="px-6 py-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente').sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).map(sale => {
                      const isOverdue = new Date(sale.due_date!) < now;
                      const score = getCustomerScore(sale.customer_id || 0);
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-900">{sale.customer_name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${score > 7 ? 'bg-emerald-100 text-emerald-600' : score > 4 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                  Score: {score}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-sm font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                              {new Date(sale.due_date!).toLocaleDateString('pt-BR')}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">R$ {sale.total.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-slate-900">R$ {calculateOverdueDebt(sale).toFixed(2)}</p>
                            {isOverdue && <span className="text-[9px] text-rose-500 font-bold">+ Multa/Juros</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => sendBillingWhatsapp(sale, 'overdue')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Cobrar WhatsApp">
                                <MessageCircle size={16} />
                              </button>
                              <button onClick={() => generateCarne(sale)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Imprimir Carnê">
                                <Printer size={16} />
                              </button>
                              <button onClick={() => generatePromissoryNote(sale)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Nota Promissória">
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Confirmar recebimento deste débito?')) {
                                    try {
                                      await localApi.put('sales', sale.id, {
                                        ...sale,
                                        payment_status: 'Pago',
                                        paid_date: new Date().toISOString()
                                      });
                                      fetchData();
                                    } catch (err) {
                                      alert('Erro ao liquidar débito.');
                                    }
                                  }
                                }}
                                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                title="Liquidar Débito"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sales.filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente').length === 0 && (
                  <div className="p-12 text-center text-slate-400">Nenhum fiado pendente. 🎉</div>
                )}
              </div>
            </div>
          </div>
        )}

        {financialTab === 'taxas' && (
          <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calculator size={24} className="text-blue-500" />
              Configuração de Repasse de Juros
            </h3>
            <p className="text-sm text-slate-500 mb-8">Defina as taxas cobradas pela sua operadora de cartão por parcela. Estes valores são usados na calculadora de vendas.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Object.keys(cardFeesSettings).sort((a, b) => Number(a) - Number(b)).map(parcela => (
                <div key={parcela}>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{parcela}x Cartão (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={cardFeesSettings[Number(parcela)]}
                      onChange={e => {
                        const newFees = { ...cardFeesSettings, [Number(parcela)]: parseFloat(e.target.value) || 0 };
                        setCardFeesSettings(newFees);
                      }}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-400 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-blue-600 text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-400">
              <button
                onClick={() => {
                  localStorage.setItem('cardFeesSettings', JSON.stringify(cardFeesSettings));
                  alert('Taxas de cartão atualizadas com sucesso!');
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck size={20} /> Salvar Tabela de Taxas
              </button>
            </div>
          </div>
        )}

        {financialTab === 'automacao' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Bell size={24} className="text-emerald-500" />
                Régua de Cobrança e Automação
              </h3>

              <div className="space-y-6">
                {[
                  { title: 'Lembrete Preventivo', desc: 'Enviar mensagem 2 dias antes do vencimento via WhatsApp.', active: fiadoSettings.autoNotification },
                  { title: 'Aviso de Atraso I', desc: 'Enviar alerta após 1 dia de atraso com valor atualizado.', active: true },
                  { title: 'Notificação Jurídica', desc: 'Gerar aviso de protesto após 15 dias de inadimplência.', active: false },
                  { title: 'Obrigado pelo Pagamento', desc: 'Enviar agradecimento automático após liquidação do débito.', active: true }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-400">
                    <div className="flex gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><MessageCircle size={20} /></div>
                      <div>
                        <p className="font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${item.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.active ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Regras de Encargos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Multa por Atraso (%)</label>
                  <input
                    type="number"
                    value={fiadoSettings.lateFeeRate}
                    onChange={e => setFiadoSettings({ ...fiadoSettings, lateFeeRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Juros de Mora (Mensal %)</label>
                  <input
                    type="number"
                    value={fiadoSettings.lateInterestRate}
                    onChange={e => setFiadoSettings({ ...fiadoSettings, lateInterestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Cadastro da Empresa</h3>
            <p className="text-sm text-slate-500">Informações oficiais do seu negócio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Razão Social</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                placeholder="Ex: Kombat Peças e Serviços Ltda"
                value={companyData.razaoSocial}
                onChange={e => setCompanyData({ ...companyData, razaoSocial: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome Fantasia</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                placeholder="Ex: Kombat Moto Peças"
                value={companyData.nomeFantasia}
                onChange={e => setCompanyData({ ...companyData, nomeFantasia: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">CNPJ</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="00.000.000/0000-00"
              value={companyData.cnpj}
              onChange={e => setCompanyData({ ...companyData, cnpj: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Telefone / WhatsApp</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="(00) 00000-0000"
              value={companyData.telefone}
              onChange={e => setCompanyData({ ...companyData, telefone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">E-mail de Contato</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="contato@empresa.com"
              value={companyData.email}
              onChange={e => setCompanyData({ ...companyData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">CEP</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="00000-000"
              value={companyData.cep}
              onChange={e => setCompanyData({ ...companyData, cep: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Endereço Completo</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="Rua, Número, Complemento"
              value={companyData.endereco}
              onChange={e => setCompanyData({ ...companyData, endereco: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Bairro</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              value={companyData.bairro}
              onChange={e => setCompanyData({ ...companyData, bairro: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cidade</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                value={companyData.cidade}
                onChange={e => setCompanyData({ ...companyData, cidade: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
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
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Regras de Vendas Fiadas</h3>
            <p className="text-sm text-slate-500">Configure juros e notificações para cobranças</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Juros Mensais (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  className="w-32 px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  value={fiadoSettings.monthlyInterest}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, monthlyInterest: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-sm text-slate-500 font-medium">ao mês</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">Os juros serão aplicados automaticamente após o vencimento.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-400">
              <div>
                <p className="font-bold text-slate-900 text-sm">Notificações Automáticas</p>
                <p className="text-xs text-slate-500">Enviar lembretes via WhatsApp/E-mail</p>
              </div>
              <button
                onClick={() => setFiadoSettings({ ...fiadoSettings, autoNotification: !fiadoSettings.autoNotification })}
                className={`w-12 h-6 rounded-full transition-all relative ${fiadoSettings.autoNotification ? 'bg-rose-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${fiadoSettings.autoNotification ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Lembrete Antes do Vencimento</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-32 px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  value={fiadoSettings.notificationDaysBefore}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, notificationDaysBefore: parseInt(e.target.value) || 0 })}
                />
                <span className="text-sm text-slate-500 font-medium">dias antes</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cobrança Após o Vencimento</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-32 px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  value={fiadoSettings.notificationDaysAfter}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, notificationDaysAfter: parseInt(e.target.value) || 0 })}
                />
                <span className="text-sm text-slate-500 font-medium">dias depois</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <ImageIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Logo da Empresa</h3>
            <p className="text-sm text-slate-500">Personalize o visual do seu sistema e documentos</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="w-32 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-400 flex items-center justify-center overflow-hidden">
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

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Central de Relatórios Profissionais</h3>
            <p className="text-sm text-slate-500">Gere relatórios detalhados para impressão ou análise gerencial</p>
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
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-400 hover:border-rose-200 hover:shadow-md transition-all text-left bg-slate-50/50"
            >
              <div className={`p-3 rounded-xl ${rep.bg} ${rep.color}`}>
                <rep.icon size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{rep.label}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ver Detalhes</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Backup e Dados</h3>
            <p className="text-sm text-slate-500">Gerencie a segurança das suas informações</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm">
            Exportar Backup (JSON)
          </button>
          <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm">
            Limpar Cache do Sistema
          </button>
        </div>
      </div>
    </div>
  );
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Pedidos de Peças</h2>
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Pedidos Recentes</h3>
        <div className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <p className="text-center text-slate-400 py-8 italic">Nenhum pedido de peças registrado ainda.</p>
          ) : (
            purchaseOrders.map(order => {
              const statusClass = order.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 
                                order.status === 'Enviado' ? 'bg-blue-100 text-blue-600' : 
                                'bg-rose-100 text-rose-600';
              return (
                <div key={order.id} className="p-4 bg-slate-50 rounded-xl border border-slate-400 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Pedido #{order.id}</p>
                    <p className="text-sm text-slate-500">Distribuidor: {order.distributor_name}</p>
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
              <h2 className="text-2xl font-bold text-slate-900">Relatório Geral de Clientes</h2>
              <div className="flex gap-2 no-print">
                <button 
                  onClick={handleExportCustomersExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all font-bold text-xs"
                >
                  <FileText size={16} />
                  Exportar Excel
                </button>
                <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-slate-600">
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
          p.sku.toLowerCase().includes(inventoryReportSearchTerm.toLowerCase())
        ).sort((a, b) => a.description.localeCompare(b.description));

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Relatório de Estoque e Valoração</h2>
              <div className="flex items-center gap-4">
                <div className="relative no-print">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou SKU..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none w-64"
                    value={inventoryReportSearchTerm}
                    onChange={(e) => setInventoryReportSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200"><Printer size={20} /></button>
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
              <h2 className="text-2xl font-bold text-slate-900">Relatório de Performance de Vendas</h2>
              <div className="flex gap-2 no-print">
                <button 
                  onClick={handleExportSalesExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all font-bold text-xs"
                >
                  <FileText size={16} />
                  Exportar Excel
                </button>
                <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-slate-600">
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
                    <td>{s.id.slice(-6)}</td>
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
              <h2 className="text-2xl font-bold text-slate-900">Relatório Financeiro e Lucratividade</h2>
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200"><Printer size={20} /></button>
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
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400">
              <h4 className="font-bold text-slate-800 mb-2">Resumo por Forma de Pagamento</h4>
              <div className="grid grid-cols-4 gap-4">
                {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => (
                  <div key={method} className="bg-white p-3 rounded-xl border border-slate-400 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{method}</p>
                    <p className="text-lg font-black text-slate-800">R$ {sales.filter(s => s.payment_method === method).reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p>
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
              <h2 className="text-2xl font-bold text-slate-900">Relatório de Compras e Fornecedores</h2>
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200"><Printer size={20} /></button>
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
                    <td>#{o.id.slice(-4)}</td>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden notranslate" translate="no">
      {/* Sidebar Trigger Area (Hover zone) */}
      <div
        className="fixed left-0 top-0 bottom-0 w-4 z-50"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      <aside
        className={`fixed left-4 top-4 bottom-4 w-60 bg-white/80 backdrop-blur-xl border border-white/20 p-5 flex flex-col gap-6 z-50 transition-all duration-500 ease-in-out shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          }`}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-rose-100 border border-slate-400">
                <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <Bike size={24} />
              </div>
            )}
            <h1 className="font-bold text-xl text-slate-900 leading-tight">Kombat<br /><span className="text-rose-600">Moto Peças</span></h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Users}
            label="Clientes"
            active={activeTab === 'customers'}
            onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Package}
            label="Estoque"
            active={activeTab === 'inventory'}
            onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={ClipboardCheck}
            label="CONTAGEM RÁPIDA"
            active={activeTab === 'manual_inventory'}
            onClick={() => { setActiveTab('manual_inventory'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Settings}
            label="Serviços"
            active={activeTab === 'services'}
            onClick={() => { setActiveTab('services'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Truck}
            label="Pedidos de Peças"
            active={activeTab === 'orders'}
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={ShoppingCart}
            label="Entrada de Compras"
            active={activeTab === 'purchases'}
            onClick={() => { setActiveTab('purchases'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={FileText}
            label="Orçamentos"
            active={activeTab === 'quotes'}
            onClick={() => { setActiveTab('quotes'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Target}
            label="CRM / Vendas"
            active={activeTab === 'crm'}
            onClick={() => { setActiveTab('crm'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={ShoppingCart}
            label="PDV / Caixa"
            active={activeTab === 'pdv'}
            onClick={() => { setActiveTab('pdv'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Bike}
            label="Ordens de Serviço"
            active={activeTab === 'os'}
            onClick={() => { setActiveTab('os'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={DollarSign}
            label="Financeiro"
            active={activeTab === 'financial'}
            onClick={() => { setActiveTab('financial'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Users}
            label="Mecânicos"
            active={activeTab === 'mechanics'}
            onClick={() => { setActiveTab('mechanics'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={MessageCircle}
            label="Catálogo Virtual"
            active={isCatalogModalOpen}
            onClick={() => { setIsCatalogModalOpen(true); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={Settings}
            label="Configurações"
            active={activeTab === 'settings'}
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Suporte</p>
          <button className="w-full flex items-center gap-2 text-sm text-slate-600 hover:text-rose-600 transition-colors">
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
      <main className="flex-1 p-8 overflow-y-auto ml-0">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
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
            </h2>
            <p className="text-slate-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
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
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'manual_inventory' && renderManualInventory()}
                {activeTab === 'services' && renderServices()}
                {activeTab === 'crm' && renderCRM()}
                {activeTab === 'pdv' && renderPDV()}
                {activeTab === 'os' && renderOS()}
                {activeTab === 'financial' && renderFinancial()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'purchases' && (
                  <div key="purchases-module-wrapper" className="space-y-12 pb-20 notranslate" translate="no">
                    <QuickEntryModule onSave={handleSaveWorkshopPurchase} formatBRL={formatBRL} />
                    
                    {/* Compact Purchases Dashboard */}
                    <div className="max-w-4xl mx-auto space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <History size={20} className="text-slate-400" />
                          Histórico de Lançamentos
                        </h3>
                        <div className="text-sm font-medium text-slate-500">
                          Total em compras: <span className="font-black text-rose-600">{formatBRL(workshopPurchases.reduce((acc, p) => acc + (p.total_value || 0), 0))}</span>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {workshopPurchases.length === 0 ? (
                          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                            Nenhuma compra registrada ainda.
                          </div>
                        ) : (
                          workshopPurchases.slice(0, 10).map((purchase) => (
                            <div key={purchase.id} className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                  <ShoppingBag size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{purchase.description}</p>
                                  <p className="text-xs text-slate-400 font-medium">Lançado em {new Date(purchase.purchase_date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-900">{formatBRL(purchase.total_value)}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-300">Entrada Financeira</p>
                              </div>
                            </div>
                          ))
                        )}
                        {workshopPurchases.length > 10 && (
                          <p className="text-center text-xs text-slate-400 font-medium py-2">Mostrando as 10 compras mais recentes.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'mechanics' && renderMechanics()}
                {activeTab === 'quotes' && renderQuotes()}
                {activeTab === 'settings' && renderSettings()}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modals */}
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
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
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
                      <div key={sale.id} className="p-4 bg-slate-50 rounded-xl border border-slate-400">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${sale.type === 'Oficina' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                              }`}>
                              {sale.type === 'Oficina' ? 'ORDEM DE SERVIÇO' : 'VENDA BALCÃO'}
                            </span>
                            <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleDateString('pt-BR')} • {sale.id}</p>
                          </div>
                          <p className="font-bold text-slate-900">R$ {sale.total.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          {sale.items.filter(i => !i.description.includes('TAXA DE PARCELAMENTO') && !i.description.includes('AJUSTE DE TAXA/PRAZO') && !i.description.includes('TAXA DE CREDITO')).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                              <span>{item.quantity}x {item.description}</span>
                              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {sale.labor_value > 0 && (
                            <div className="flex justify-between text-[11px] text-amber-600 font-medium pt-1 border-t border-slate-400">
                              <span>Mão de Obra</span>
                              <span>R$ {sale.labor_value.toFixed(2)}</span>
                            </div>
                          )}
                          {sale.service_description && (
                            <div className="mt-2 p-2 bg-white rounded-lg border border-slate-400 italic text-[10px] text-slate-500">
                              {sale.service_description}
                            </div>
                          )}

                          {/* Partial Payment Section */}
                          <div className="mt-4 p-3 bg-white rounded-xl border border-slate-400 shadow-sm space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                              <span className="text-slate-400">Total: R$ {sale.total.toFixed(2)}</span>
                              <span className="text-emerald-500">Pago: R$ {(sale.paid_total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-t border-slate-400">
                              <span className="text-xs font-black uppercase text-slate-800">Saldo Restante:</span>
                              <span className={`text-sm font-black ${sale.total - (sale.paid_total || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                R$ {(sale.total - (sale.paid_total || 0)).toFixed(2)}
                              </span>
                            </div>

                            {sale.payment_method === 'Fiado' && sale.total - (sale.paid_total || 0) > 0 && (
                              <div className="pt-2">
                                {payingSaleId === sale.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-400 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
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
                                      className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-400">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Cliente / Razão Social</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900"
                  placeholder="Nome Completo do Cliente..."
                  value={quoteForm.customer_name}
                  onChange={e => setQuoteForm({ ...quoteForm, customer_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Motocicleta (Modelo/Placa/KM)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900"
                  placeholder="Ex: Honda CG 160 Titan - ABC-1234 - 15.000km"
                  value={quoteForm.motorcycle_details}
                  onChange={e => setQuoteForm({ ...quoteForm, motorcycle_details: e.target.value })}
                />
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
                      const desc = prompt('Descrição da Peça:');
                      const qty = Number(prompt('Quantidade:', '1'));
                      const val = Number(prompt('Valor Unitário:', '0'));
                      if (desc && qty && val) {
                        const newItem: QuoteItem = { description: desc, quantity: qty, price: val, total: qty * val, type: 'Peça' };
                        setQuoteForm(prev => ({
                          ...prev,
                          items: [...prev.items, newItem],
                          total_value: prev.total_value + (qty * val)
                        }));
                      }
                    }}
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-black uppercase hover:bg-slate-800 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Peça
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const desc = prompt('Descrição do Serviço:');
                      const val = Number(prompt('Valor do Serviço:', '0'));
                      if (desc && val) {
                        const newItem: QuoteItem = { description: desc, quantity: 1, price: val, total: val, type: 'Serviço' };
                        setQuoteForm(prev => ({
                          ...prev,
                          items: [...prev.items, newItem],
                          total_value: prev.total_value + val
                        }));
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-700 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Serviço
                  </button>
                </div>
              </div>

              <div className="border border-slate-400 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-center w-16">Qtd</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Descrição</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-24">Tipo</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right w-32">Valor Unit.</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right w-32">Subtotal</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 bg-white">
                    {quoteForm.items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-center font-bold text-slate-900 text-sm">{item.quantity}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 text-sm uppercase">{item.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${item.type === 'Peça' ? 'bg-black text-white' : 'bg-rose-100 text-rose-600'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-600 text-sm">R$ {item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">R$ {item.total.toFixed(2)}</td>
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
                  className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 min-h-[100px]"
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
                    className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900"
                    value={quoteForm.validity_days}
                    onChange={e => setQuoteForm({ ...quoteForm, validity_days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Termos de Garantia</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-slate-900"
                    value={quoteForm.warranty_terms}
                    onChange={e => setQuoteForm({ ...quoteForm, warranty_terms: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-400 space-y-4">
              <button
                type="button"
                onClick={() => setShowQuoteCalculator(!showQuoteCalculator)}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-400"
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
                  className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                value={stockSearchTerm}
                onChange={e => setStockSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto border border-slate-400 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 z-10">
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
                        (p.barcode || '').toLowerCase().includes(search)
                      );
                    })
                    .map(product => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-sm uppercase">{product.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-black text-slate-900 text-sm">R$ {product.sale_price.toFixed(2)}</p>
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
            setCustomerForm({ name: '', nickname: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1 });
          }}
          title={editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.name}
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apelido (Como é chamado)</label>
                <input
                  type="text"
                  placeholder="Ex: Dequinha, João do Pneu"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.nickname}
                  onChange={e => setCustomerForm({ ...customerForm, nickname: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF (Opcional)</label>
                <input
                  type="text" placeholder="000.000.000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.cpf}
                  onChange={e => setCustomerForm({ ...customerForm, cpf: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ (Opcional)</label>
                <input
                  type="text" placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.cnpj}
                  onChange={e => setCustomerForm({ ...customerForm, cnpj: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Celular (Opcional)</label>
                <input
                  type="text" placeholder="5511999999999"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.whatsapp}
                  onChange={e => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Limite de Crédito (R$)</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-rose-600"
                  value={customerForm.credit_limit}
                  onChange={e => setCustomerForm({ ...customerForm, credit_limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP (Opcional)</label>
                <input
                  type="text" placeholder="00000-000"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.zip_code}
                  onChange={e => setCustomerForm({ ...customerForm, zip_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.city}
                  onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.neighborhood}
                  onChange={e => setCustomerForm({ ...customerForm, neighborhood: e.target.value })}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.address}
                  onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Multa por Atraso (%)</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
                  value={customerForm.fine_rate}
                  onChange={e => setCustomerForm({ ...customerForm, fine_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Juros Mensais (%)</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
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
            setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '', image_url2: '', image_url3: '', image_url4: '', brand: '', location: '', application: '' });
          }}
          title={editingProduct ? "Editar Produto" : "Adicionar Produto ao Estoque"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Produto</label>
                <input
                  type="text" required placeholder="Ex: Pneu Traseiro 90/90-18"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <input
                  type="text" placeholder="Ex: Honda, Pirelli, Mobil"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.brand}
                  onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localização no Estoque</label>
                <input
                  type="text" placeholder="Ex: Prateleira A, Corredor 2"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.location}
                  onChange={e => setProductForm({ ...productForm, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código Interno</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.sku}
                  onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras (EAN)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.barcode}
                  onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Inicial</label>
                <input
                  type="number" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.stock}
                  onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Compra (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
                  value={productForm.purchase_price}
                  onChange={e => setProductForm({ ...productForm, purchase_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-rose-600"
                  value={productForm.sale_price}
                  onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aplicação das Peças</label>
              <textarea
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none h-24"
                placeholder="Ex: Honda CG 160 (2016-2023), Fan, Titan..."
                value={productForm.application}
                onChange={e => setProductForm({ ...productForm, application: e.target.value })}
              />
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-tight">Fotos do Produto (Principal + 3 Adicionais)</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'image_url', label: 'Capa' },
                  { key: 'image_url2', label: 'Foto 2' },
                  { key: 'image_url3', label: 'Foto 3' },
                  { key: 'image_url4', label: 'Foto 4' }
                ].map((photo, index) => (
                  <div key={photo.key} className="space-y-2">
                    <div className="relative aspect-square bg-slate-100 border-2 border-slate-200 rounded-2xl overflow-hidden group">
                      {(productForm as any)[photo.key] ? (
                        <img src={(productForm as any)[photo.key]} alt={photo.label} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon size={32} />
                          <span className="text-[10px] font-bold uppercase mt-1">{photo.label}</span>
                        </div>
                      )}
                      
                       <label className={`absolute inset-0 bg-black/40 ${!(productForm as any)[photo.key] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} flex items-center justify-center cursor-pointer transition-all`}>
                        <div className="flex flex-col items-center gap-1">
                          <Camera size={24} className="text-white" />
                          <span className="text-[10px] text-white font-bold uppercase">Capturar</span>
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
                          className="absolute top-1 right-1 p-1 bg-white/80 text-rose-600 rounded-full hover:bg-white shadow-md transition-all sm:opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="URL..."
                      className="w-full text-[10px] px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500"
                      value={(productForm as any)[photo.key]}
                      onChange={e => setProductForm({ ...productForm, [photo.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
              {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={isMotorcycleModalOpen}
          onClose={() => setIsMotorcycleModalOpen(false)}
          title="Cadastrar Moto para Cliente"
        >
          <form onSubmit={handleAddMotorcycle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo da Moto</label>
              <input
                type="text" required placeholder="Ex: Honda CG 160"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                value={motorcycleForm.model}
                onChange={e => setMotorcycleForm({ ...motorcycleForm, model: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                <input
                  type="text" required placeholder="ABC-1234"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={motorcycleForm.plate}
                  onChange={e => setMotorcycleForm({ ...motorcycleForm, plate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual</label>
                <input
                  type="number" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Distribuidor</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                  value={distributorForm.name}
                  onChange={e => setDistributorForm({ ...distributorForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (WhatsApp)</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                  value={distributorForm.phone}
                  onChange={e => setDistributorForm({ ...distributorForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pessoa de Contato (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={leadForm.name}
                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Frota</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={leadForm.company}
                  onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="text" required placeholder="Ex: 11999999999"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={leadForm.phone}
                  onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={leadForm.value}
                  onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
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
          isOpen={isPdvModalOpen}
          onClose={() => setIsPdvModalOpen(false)}
          title="Frente de Caixa - Nova Venda"
          maxWidth="max-w-[95%]"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
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
                {pdvForm.customer_id && (
                  <div className="mt-2 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crédito Disponível:</span>
                    <span className={`text-xs font-bold ${getCustomerRemainingCredit(parseInt(pdvForm.customer_id)) > 0 ? 'text-rose-600' : 'text-rose-600'}`}>
                      {formatBRL(getCustomerRemainingCredit(parseInt(pdvForm.customer_id)))}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Peça / Produto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar no estoque..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                    value={pdvSearchProduct}
                    onChange={e => setPdvSearchProduct(e.target.value)}
                  />
                </div>
                {pdvSearchProduct && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-400 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {sortedProducts.filter(p =>
                      (p.description || '').toLowerCase().includes(d_pdvSearchProduct.toLowerCase()) ||
                      (p.brand && (p.brand || '').toLowerCase().includes(d_pdvSearchProduct.toLowerCase())) ||
                      (p.sku || '').toLowerCase().includes(d_pdvSearchProduct.toLowerCase())
                    ).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddPdvItem(p)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center border-b border-slate-400 last:border-none"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.description}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-2">
                            Estoque: {p.stock} {p.unit}
                            {p.brand && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-tighter">
                                {p.brand}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-rose-600">R$ {p.sale_price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {pdvForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-400">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex items-center bg-white border border-slate-400 rounded-lg overflow-hidden h-7">
                          <button
                            type="button"
                            onClick={() => handlePdvItemQuantityChange(idx, Math.max(1, item.quantity - 1))}
                            className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                          >
                            <MinusCircle size={14} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handlePdvItemQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="w-10 h-full text-center text-slate-900 font-bold outline-none border-x border-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => handlePdvItemQuantityChange(idx, item.quantity + 1)}
                            className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                          >
                            <PlusCircle size={14} />
                          </button>
                        </div>
                        x
                        <input
                          type="number"
                          step="0.01"
                          value={item.price.toFixed(2)}
                          onChange={e => handlePdvItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 px-1 py-0.5 bg-white border border-slate-400 rounded-md text-center text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{formatBRL(item.price * item.quantity)}</span>
                      <button
                        onClick={() => handleRemovePdvItem(item.product_id)}
                        className="p-1 text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condição de Venda</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPdvForm({ ...pdvForm, sale_condition: 'Vista', installments: 1 })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${pdvForm.sale_condition === 'Vista'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                        : 'bg-white border-slate-400 text-slate-600 hover:border-rose-200'
                        }`}
                    >
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdvForm({ ...pdvForm, sale_condition: 'Prazo', payment_method: 'Cartão' })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${pdvForm.sale_condition === 'Prazo'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                        : 'bg-white border-slate-400 text-slate-600 hover:border-rose-200'
                        }`}
                    >
                      A Prazo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPdvForm({ ...pdvForm, payment_method: method as any, due_date: method === 'Fiado' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : pdvForm.due_date })}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${pdvForm.payment_method === method
                          ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                          : 'bg-white border-slate-400 text-slate-600 hover:border-rose-200'
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {pdvForm.sale_condition === 'Prazo' && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Número de Parcelas</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Object.keys(cardFeesSettings).map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPdvForm({ ...pdvForm, installments: Number(num) })}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${pdvForm.installments === Number(num)
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pdvForm.payment_method === 'Fiado' && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <label className="block text-sm font-bold text-rose-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                    value={pdvForm.due_date}
                    onChange={e => setPdvForm({ ...pdvForm, due_date: e.target.value })}
                  />
                  <p className="text-[10px] text-rose-600 mt-1 italic">* Multas e juros automáticos após 30 dias de atraso.</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-400 space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold uppercase">Valor da Compra (Base):</span>
                  <span className="font-bold text-slate-700">{formatBRL(pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0))}</span>
                </div>
                {pdvForm.sale_condition === 'Prazo' && (
                  <div className="flex justify-between items-center text-sm text-rose-500">
                    <span className="font-bold uppercase text-[10px]">Taxa de Parcelamento:</span>
                    <span className="font-bold">
                      {formatBRL(
                        (pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) / (1 - ((cardFeesSettings[pdvForm.installments] || 0) / 100))) -
                        pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t border-slate-400 mt-2">
                  <span className="text-slate-900 font-black text-lg">TOTAL FINAL</span>
                  <span className="text-3xl font-black text-rose-600">
                    {formatBRL(
                      (
                        pdvForm.sale_condition === 'Prazo'
                          ? (pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) / (1 - ((cardFeesSettings[pdvForm.installments] || 0) / 100)))
                          : pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
                      )
                    )}
                  </span>
                </div>
                {pdvForm.payment_method === 'Fiado' && (
                  <div className="flex justify-between items-center text-rose-500 mt-1">
                    <span className="font-black uppercase text-[10px]">Valor após 30 dias de atraso (+15%):</span>
                    <span className="font-bold">
                      {formatBRL(
                        (
                          pdvForm.sale_condition === 'Prazo'
                            ? (pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) / (1 - ((cardFeesSettings[pdvForm.installments] || 0) / 100)))
                            : pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
                        ) * 1.15
                      )}
                    </span>
                  </div>
                )}
                {pdvForm.sale_condition === 'Prazo' && (
                  <p className="text-right text-[10px] font-black text-slate-400 uppercase">
                    {pdvForm.installments}x de {formatBRL(
                      (pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) / (1 - ((cardFeesSettings[pdvForm.installments] || 0) / 100))) / pdvForm.installments
                    )}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowPdvCalculator(!showPdvCalculator)}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-400"
                >
                  <Calculator size={18} />
                  {showPdvCalculator ? 'Esconder Calculadora de Juros' : 'Abrir Calculadora de Juros/Taxas'}
                </button>
              </div>

              {showPdvCalculator && (
                <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
                  <VendaCalculator
                    initialCost={pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)}
                    cardFees={cardFeesSettings}
                    onApply={(newTotal) => {
                      const currentTotal = pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                      const diff = newTotal - currentTotal;
                      if (diff > 0) {
                        setPdvForm({
                          ...pdvForm,
                          items: [
                            ...pdvForm.items,
                            { description: 'AJUSTE DE TAXA/PRAZO CALCULADO', quantity: 1, price: diff }
                          ]
                        });
                        alert('Diferença de taxa/prazo aplicada com sucesso!');
                      }
                    }}
                  />
                </div>
              )}

              <button
                onClick={handleCompleteSale}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
              >
                Finalizar Venda
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          title={editingService ? "Editar Serviço" : "Cadastrar Novo Serviço"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Serviço</label>
              <input
                type="text"
                placeholder="Ex: Troca de Óleo, Limpeza de Carburador..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                value={serviceForm.description}
                onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço Sugerido (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none font-bold"
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
              />
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
            <div className={`bg-white p-8 rounded-2xl border border-slate-400 print-area ${selectedCustomerForPrint.type === 'A4' ? 'print-landscape' : 'font-bold text-[15px] w-[80mm] mx-auto overflow-visible print:p-0'}`} style={selectedCustomerForPrint.type === '80mm' ? { fontFamily: '"Arial Black", Gadget, sans-serif' } : {}}>
              <style>{selectedCustomerForPrint.type === '80mm' ? `
                @media print {
                  @page { margin: 0; size: 80mm auto; }
                  body { margin: 0; padding: 0; }
                  .no-print { display: none !important; }
                }
              ` : ''}</style>
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
                        <tr key={sale.id} className="border-b border-slate-400 text-[10px]">
                          <td className="py-2 px-1 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2 px-1">
                            <span className={`font-bold ${sale.type === 'Oficina' ? 'text-amber-600' : 'text-indigo-600'}`}>
                              {sale.type === 'Oficina' ? 'O.S.' : 'BALCÃO'}
                            </span>
                          </td>
                          <td className="py-2 px-1 font-mono">{sale.id}</td>
                          <td className="py-2 px-1">
                            <div className="flex flex-col gap-1 min-w-[300px]">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-slate-700 leading-tight">
                                  <span className="flex-1">{item.quantity}x {item.description}</span>
                                  <span className="text-[9px] text-slate-400 font-mono text-right ml-4">
                                    R$ {(item.quantity * item.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {sale.labor_value > 0 && (
                                <div className="flex justify-between items-center text-amber-700 font-bold border-t border-slate-200 mt-1 pt-1 leading-tight">
                                  <span className="flex-1">SERVIÇOS / MÃO DE OBRA</span>
                                  <span className="text-[9px] font-mono text-right ml-4">
                                    R$ {sale.labor_value.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {sale.service_description && (
                                <p className="text-[8px] text-slate-500 italic mt-1 bg-slate-50 p-1 rounded-sm">
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
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                        {sale.type === 'Oficina' ? 'Ordem de Serviço' : 'Venda Balcão'}
                      </p>
                      
                      {/* LISTA DE PRODUTOS NO RECIBO TÉRMICO */}
                      <div className="pl-1 space-y-1 mb-1">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[13px] text-slate-900 font-bold">
                            <span>{item.quantity}x {item.description.substring(0, 25)}..</span>
                            <span className="font-mono">R$ {(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                        {sale.labor_value > 0 && (
                          <div className="flex justify-between text-[13px] text-slate-900 font-bold border-t border-slate-400 pt-0.5 mt-1">
                            <span>MÃO DE OBRA / SERVIÇOS</span>
                            <span className="font-mono">R$ {sale.labor_value.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {sale.service_description && (
                        <p className="text-[11px] text-slate-700 italic bg-slate-50 p-1 border-l border-slate-400">
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
                  onClick={() => window.print()}
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
            <div id="receipt-content" className="bg-white p-4 text-[15px] leading-tight text-black w-[80mm] mx-auto overflow-visible print:p-0 font-bold" style={{ fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif' }}>
              <style>{`
                @media print {
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    background: white !important;
                    width: 80mm !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print { display: none !important; }
                  
                  #receipt-content {
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

              <div style={{ textAlign: 'center', marginBottom: '8px', fontWeight: 'bold' }}>
                <h4 style={{ fontWeight: '900', fontSize: '16px', margin: '0' }}>KOMBAT MOTO PECAS</h4>
                <p style={{ margin: '2px 0' }}>CNPJ: 12.802.931/0001-92</p>
                <p style={{ margin: '2px 0' }}>R PARANA, 342</p>
                <p style={{ margin: '2px 0' }}>CENTRO, Andirá / PR</p>
                <p style={{ margin: '2px 0' }}>Tel (43) 3538-4537</p>
                <p style={{ margin: '2px 0' }}>Email: kombatpecas@gmail.com</p>
              </div>

              <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>

              <table style={{ width: '100%', fontSize: '12px', fontWeight: 'bold' }}>
                <tbody>
                  <tr>
                    <td>Venda: {selectedSaleForReceipt.id}</td>
                    <td style={{ textAlign: 'center' }}>Data: {new Date(selectedSaleForReceipt.date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>Hora: {new Date(selectedSaleForReceipt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>

              {/* Customer Info */}
              <div style={{ padding: '4px 0' }}>
                <p style={{ fontWeight: 'bold' }}>Cliente: {selectedSaleForReceipt.customer_id || '---'} - {(selectedSaleForReceipt.customer_name || 'Consumidor Final').toUpperCase()}</p>
                {(() => {
                  const customer = customers.find(c => c.id === selectedSaleForReceipt.customer_id);
                  if (customer) {
                    return (
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        <p>TEL: {customer.whatsapp || '---'}</p>
                        <p>{customer.cpf ? `CPF: ${customer.cpf}` : (customer.cnpj ? `CNPJ: ${customer.cnpj}` : '')}</p>
                        <p>Endereço: {customer.address || ''} {customer.neighborhood ? ` - ${customer.neighborhood}` : ''}</p>
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
                <div style={{ padding: '4px 0' }}>
                  <p style={{ fontWeight: 'bold' }}>Observações:</p>
                  <p style={{ fontSize: '10px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selectedSaleForReceipt.service_description}</p>
                </div>
              )}
              {selectedSaleForReceipt.service_description && <div className="border-t border-dashed border-black my-1"></div>}

              {/* Items Table */}
              <div className="py-1">
                {(selectedSaleForReceipt.items || []).filter(i => i.product_id).length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '4px' }}>PEÇAS E PRODUTOS</p>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                      <tbody>
                        {(selectedSaleForReceipt.items || []).filter(i => i.product_id && !i.description.includes('TAXA DE PARCELAMENTO') && !i.description.includes('AJUSTE DE TAXA/PRAZO') && !i.description.includes('TAXA DE CREDITO')).map((item, idx) => (
                          <React.Fragment key={idx}>
                            <tr>
                              <td style={{ paddingTop: '4px', width: '20%' }}>{item.product_id || '---'}</td>
                              <td style={{ paddingTop: '4px', fontWeight: 'bold' }}>{(item.description || '').toUpperCase()}</td>
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

                {(selectedSaleForReceipt.items || []).filter(i => !i.product_id && !i.description.includes('TAXA DE PARCELAMENTO') && !i.description.includes('AJUSTE DE TAXA/PRAZO') && !i.description.includes('TAXA DE CREDITO')).length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '4px' }}>SERVIÇOS EXECUTADOS</p>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                      <tbody>
                        {(selectedSaleForReceipt.items || []).filter(i => !i.product_id && !i.description.includes('TAXA DE PARCELAMENTO') && !i.description.includes('AJUSTE DE TAXA/PRAZO') && !i.description.includes('TAXA DE CREDITO')).map((item, idx) => (
                          <React.Fragment key={idx}>
                            <tr>
                              <td style={{ paddingTop: '4px', width: '20%' }}>---</td>
                              <td style={{ paddingTop: '4px', fontWeight: 'bold' }}>{(item.description || '').toUpperCase()}</td>
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

                {(selectedSaleForReceipt.labor_value || 0) > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '4px', borderTop: '1px dotted black' }}>
                    <table style={{ width: '100%', fontSize: '10px', fontWeight: 'bold' }}>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'left' }}>MÃO DE OBRA / SERVIÇOS AVULSOS</td>
                          <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.labor_value || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>

              {/* Totals Section */}
              <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
              <table style={{ width: '100%', fontSize: '11px', fontWeight: 'bold' }}>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Total Peças:</td>
                    <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total - (selectedSaleForReceipt.labor_value || 0)).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Total Serviços:</td>
                    <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.labor_value || 0).toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px dotted black' }}>
                    <td style={{ textAlign: 'left', paddingTop: '4px', fontSize: '12px' }}>TOTAL GERAL:</td>
                    <td style={{ textAlign: 'right', paddingTop: '4px', fontSize: '12px' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Desconto:</td>
                    <td style={{ textAlign: 'right' }}>R$ 0,00</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment Info */}
              <div style={{ marginTop: '16px', paddingTop: '4px', borderTop: '1px dashed black' }}>
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

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>

              <table style={{ width: '100%' }}>
                <tbody>
                  <tr style={{ fontWeight: '900', fontSize: '16px' }}>
                    <td style={{ textAlign: 'left', textDecoration: 'underline' }}>TOTAL:</td>
                    <td style={{ textAlign: 'right', textDecoration: 'underline' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                  </tr>
                  {selectedSaleForReceipt.payment_method === 'Fiado' && (
                    <>
                      <tr style={{ fontSize: '11px', fontWeight: '900' }}>
                        <td colSpan={2} style={{ paddingTop: '8px', borderTop: '1px solid black' }}>REGRA DE PAGAMENTO (FIADO):</td>
                      </tr>
                      <tr style={{ fontSize: '13px', fontWeight: '900' }}>
                        <td style={{ textAlign: 'left' }}>VALOR NORMAL (ATÉ 30 DIAS):</td>
                        <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
                      </tr>
                      <tr style={{ fontSize: '13px', fontWeight: '900', color: 'red' }}>
                        <td style={{ textAlign: 'left' }}>VALOR APÓS 30 DIAS (+15%):</td>
                        <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total * 1.15).toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  <tr style={{ fontWeight: '900', fontSize: '14px', borderTop: '1px dashed black' }}>
                    <td style={{ textAlign: 'left', paddingTop: '4px' }}>TOTAL PAGO:</td>
                    <td style={{ textAlign: 'right', paddingTop: '4px' }}>R$ {selectedSaleForReceipt.payment_status === 'Pago' ? (selectedSaleForReceipt.total || 0).toFixed(2) : '0,00'}</td>
                  </tr>
                  {selectedSaleForReceipt.customer_id && (
                    <tr style={{ fontWeight: '900', fontSize: '14px', borderTop: '2.5px solid black' }}>
                      <td style={{ textAlign: 'left', paddingTop: '8px' }}>SALDO LIMITE:</td>
                      <td style={{ textAlign: 'right', paddingTop: '8px', color: 'red' }}>R$ {getCustomerRemainingCredit(selectedSaleForReceipt.customer_id).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
                <div style={{ borderTop: '2px solid black', width: '220px', margin: '0 auto' }}></div>
                <p style={{ fontSize: '11px', marginTop: '4px', fontWeight: '900' }}>ASSINATURA DO CLIENTE</p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '8px', borderTop: '1px dashed black' }}>
                <p style={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}>Esse cupom não é um documento fiscal</p>
              </div>
              <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
              <div style={{ height: '40px' }}></div> {/* Buffer for thermal cutter */}

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
          isOpen={isFixedServiceModalOpen}
          onClose={() => setIsFixedServiceModalOpen(false)}
          title="Configurar Tabela de Repasses"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            const newService = {
              id: Math.random().toString(36).substr(2, 9),
              name: fixedServiceForm.name,
              payout: parseFloat(fixedServiceForm.payout) || 0,
              customer_price: parseFloat(fixedServiceForm.customer_price) || 0
            };
            setFixedServices([...fixedServices, newService]);
            setFixedServiceForm({ name: '', payout: '' });
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
                <input
                  type="text" required placeholder="Ex: Troca de Pneu"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={fixedServiceForm.name}
                  onChange={e => setFixedServiceForm({ ...fixedServiceForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repasse (R$)</label>
                <input
                  type="number" required step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={fixedServiceForm.payout}
                  onChange={e => setFixedServiceForm({ ...fixedServiceForm, payout: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all">
              Adicionar à Tabela
            </button>
          </form>

          <div className="mt-6 border-t border-slate-400 pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase mb-4">Serviços Atuais</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fixedServices.map(fs => (
                <div key={fs.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-sm">
                  <span className="text-slate-700">{fs.name}</span>
                  <span className="font-bold text-rose-600">R$ {fs.payout.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isOsModalOpen}
          onClose={() => {
            setIsOsModalOpen(false);
            setEditingOS(null);
            setOsForm({
              customer_id: '',
              motorcycle_id: '',
              items: [],
              selected_fixed_services: [],
              labor_value: '0',
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
          maxWidth="max-w-[95%]"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.customer_id}
                  onChange={e => setOsForm({ ...osForm, customer_id: e.target.value, motorcycle_id: '' })}
                >
                  <option value="">Selecione o Cliente</option>
                  {sortedCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {osForm.customer_id && (
                  <div className="mt-2 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crédito Disponível:</span>
                    <span className={`text-xs font-bold ${getCustomerRemainingCredit(parseInt(osForm.customer_id)) > 0 ? 'text-rose-600' : 'text-rose-600'}`}>
                      R$ {getCustomerRemainingCredit(parseInt(osForm.customer_id)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {osForm.customer_id && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Moto do Cliente</label>
                    <select
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                      value={osForm.motorcycle_id}
                      onChange={e => setOsForm({ ...osForm, motorcycle_id: e.target.value })}
                    >
                      <option value="">Selecione a Moto</option>
                      {motorcycles.filter(m => m.customer_id === parseInt(osForm.customer_id)).map(m => <option key={m.id} value={m.id}>{m.model} ({m.plate})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual</label>
                    <input
                      type="number"
                      placeholder="000"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                      value={osForm.km}
                      onChange={e => setOsForm({ ...osForm, km: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Peça / Produto</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar no estoque..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                      value={osSearchProduct}
                      onChange={e => setOsSearchProduct(e.target.value)}
                    />
                  </div>
                  {osSearchProduct && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-400 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {sortedProducts.filter(p =>
                        (p.description || '').toLowerCase().includes(d_osSearchProduct.toLowerCase()) ||
                        (p.brand && (p.brand || '').toLowerCase().includes(d_osSearchProduct.toLowerCase())) ||
                        (p.sku || '').toLowerCase().includes(d_osSearchProduct.toLowerCase())
                      ).map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleAddOsItem(p)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center border-b border-slate-400 last:border-none"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{p.description}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-2">
                              Estoque: {p.stock} {p.unit}
                              {p.brand && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-tighter">
                                  {p.brand}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-rose-600">R$ {p.sale_price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Serviço Cadastrado</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar serviço..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                      value={osSearchService}
                      onChange={e => setOsSearchService(e.target.value)}
                    />
                  </div>
                  {osSearchService && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-400 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {sortedRegisteredServices.filter(s =>
                        (s.description || '').toLowerCase().includes(d_osSearchService.toLowerCase())
                      ).map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            const newServiceItem: SaleItem = {
                              description: s.description,
                              quantity: 1,
                              price: s.price,
                              type: 'Serviço'
                            };
                            setOsForm({
                              ...osForm,
                              items: [...osForm.items, newServiceItem]
                            });
                            setOsSearchService('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center border-b border-slate-400 last:border-none"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{s.description}</p>
                          </div>
                          <span className="text-sm font-bold text-blue-600">R$ {s.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Serviço / Problema</label>
                <textarea
                  placeholder="Descreva o que será feito ou o problema relatado pelo cliente..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[100px] resize-none"
                  value={osForm.service_description}
                  onChange={e => setOsForm({ ...osForm, service_description: e.target.value })}
                />
              </div>

              {/* Items List */}
              <div className="space-y-6">
                {/* Peças Section */}
                {osForm.items.filter(i => i.product_id).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2">Peças e Produtos</h5>
                    {osForm.items.map((item, idx) => item.product_id && (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-400">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center bg-white border border-slate-400 rounded-lg overflow-hidden h-7">
                              <button
                                type="button"
                                onClick={() => handleOsItemQuantityChange(idx, Math.max(1, item.quantity - 1))}
                                className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                              >
                                <MinusCircle size={14} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleOsItemQuantityChange(idx, parseInt(e.target.value) || 1)}
                                className="w-10 h-full text-center text-slate-900 font-bold outline-none border-x border-slate-400 no-spinners"
                              />
                              <button
                                type="button"
                                onClick={() => handleOsItemQuantityChange(idx, item.quantity + 1)}
                                className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                              >
                                <PlusCircle size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">x R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={e => handleOsItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-0.5 bg-white border border-slate-400 rounded-md text-slate-900 font-bold text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total do Item</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-slate-900">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={(item.price * item.quantity).toFixed(2)}
                                onChange={e => handleOsItemTotalChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-white border-2 border-slate-400 rounded-lg text-slate-900 font-black text-sm focus:border-rose-500 outline-none text-right"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveOsItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pr-4">
                      <p className="text-xs font-bold text-rose-600">Subtotal Peças: R$ {osForm.items.filter(i => i.product_id).reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Serviços Section */}
                {osForm.items.filter(i => !i.product_id).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2">Serviços Descriminados</h5>
                    {osForm.items.map((item, idx) => !item.product_id && (
                      <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/30 rounded-xl border border-amber-100">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center bg-white border border-slate-400 rounded-lg overflow-hidden h-7">
                              <button
                                type="button"
                                onClick={() => handleOsItemQuantityChange(idx, Math.max(1, item.quantity - 1))}
                                className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                              >
                                <MinusCircle size={14} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleOsItemQuantityChange(idx, parseInt(e.target.value) || 1)}
                                className="w-10 h-full text-center text-slate-900 font-bold outline-none border-x border-slate-400 no-spinners"
                              />
                              <button
                                type="button"
                                onClick={() => handleOsItemQuantityChange(idx, item.quantity + 1)}
                                className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                              >
                                <PlusCircle size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">x R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={e => handleOsItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-0.5 bg-white border border-slate-400 rounded-md text-slate-900 font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total do Item</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-slate-900">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={(item.price * item.quantity).toFixed(2)}
                                onChange={e => handleOsItemTotalChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-white border-2 border-slate-400 rounded-lg text-slate-900 font-black text-sm focus:border-amber-500 outline-none text-right"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveOsItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pr-4">
                      <p className="text-xs font-bold text-amber-600">Subtotal Serviços: R$ {osForm.items.filter(i => !i.product_id).reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Mão de Obra (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.labor_value}
                  onChange={e => setOsForm({ ...osForm, labor_value: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mecânico Responsável</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.mechanic_id}
                  onChange={e => setOsForm({ ...osForm, mechanic_id: e.target.value })}
                >
                  <option value="">Selecione o Mecânico</option>
                  {sortedMechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {osForm.mechanic_id && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Serviço Fixo (Tabela de Repasses)</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value=""
                    onChange={e => {
                      const selectedService = fixedServices.find(fs => fs.id === e.target.value);
                      if (selectedService) {
                        const existingService = osForm.selected_fixed_services.find(sfs => sfs.id === selectedService.id);
                        if (existingService) {
                          setOsForm({
                            ...osForm,
                            selected_fixed_services: osForm.selected_fixed_services.map(sfs =>
                              sfs.id === selectedService.id ? { ...sfs, quantity: sfs.quantity + 1 } : sfs
                            )
                          });
                        } else {
                          setOsForm({
                            ...osForm,
                            selected_fixed_services: [...osForm.selected_fixed_services, { ...selectedService, quantity: 1 }]
                          });
                        }
                      }
                    }}
                  >
                    <option value="">Selecione um Serviço Fixo</option>
                    {sortedFixedServices.map(fs => (
                      <option key={fs.id} value={fs.id}>{fs.name} (Repasse: {formatBRL(fs.payout)})</option>
                    ))}
                  </select>
                </div>
              )}

              {(osForm.selected_fixed_services || []).length > 0 && (
                <div className="space-y-2">
                  <p className="block text-sm font-medium text-slate-700 mb-1">Serviços Fixos Selecionados:</p>
                  {osForm.selected_fixed_services.map((sfs, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-400">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{sfs.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center bg-white border border-slate-400 rounded-lg overflow-hidden h-7">
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = Math.max(1, sfs.quantity - 1);
                                setOsForm({
                                  ...osForm,
                                  selected_fixed_services: osForm.selected_fixed_services.map((it, i) => i === idx ? { ...it, quantity: newQty } : it)
                                });
                              }}
                              className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                              <MinusCircle size={14} />
                            </button>
                            <span className="px-3 h-full flex items-center justify-center text-xs font-bold text-slate-900 border-x border-slate-400 min-w-[32px]">
                              {sfs.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOsForm({
                                  ...osForm,
                                  selected_fixed_services: osForm.selected_fixed_services.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it)
                                });
                              }}
                              className="px-2 h-full hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                              <PlusCircle size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500">x Repasse: {formatBRL(sfs.payout)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">Total Repasse: {formatBRL(sfs.payout * sfs.quantity)}</span>
                        <button
                          onClick={() => setOsForm({
                            ...osForm,
                            selected_fixed_services: osForm.selected_fixed_services.filter(item => item.id !== sfs.id)
                          })}
                          className="p-1 text-rose-400 hover:text-rose-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setOsForm({ ...osForm, payment_method: method as any, due_date: method === 'Fiado' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : osForm.due_date })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${osForm.payment_method === method
                        ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                        : 'bg-white border-slate-400 text-slate-600 hover:border-amber-200'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {osForm.payment_method === 'Fiado' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <label className="block text-sm font-bold text-amber-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={osForm.due_date}
                    onChange={e => setOsForm({ ...osForm, due_date: e.target.value })}
                  />
                  <p className="text-[10px] text-amber-600 mt-1 italic">* Multas e juros automáticos após 30 dias de atraso.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status da O.S.</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Aberto', 'Em Andamento', 'Pronto', 'Entregue'].map(statusOption => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setOsForm({ ...osForm, status: statusOption as any })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${osForm.status === statusOption
                        ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                        : 'bg-white border-slate-400 text-slate-600 hover:border-amber-200'
                        }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-400">
                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-400 flex flex-col gap-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">Total em Peças:</span>
                    <span className="font-bold text-slate-700">R$ {osForm.items.filter(i => i.product_id).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">Total em Serviços:</span>
                    <span className="font-bold text-slate-700">R$ {(osForm.items.filter(i => !i.product_id).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + (parseFloat((osForm.labor_value || '0').toString().replace(',', '.')) || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-400 mt-1">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-black uppercase text-sm">Valor Total da O.S.</span>
                      {osForm.payment_method === 'Fiado' && (
                        <div className="mt-1 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Valor Normal (Até 30 Dias)</span>
                          <span className="text-[10px] text-rose-500 font-black uppercase tracking-tighter">* Valor após 30 dias: {formatBRL((osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + (parseFloat((osForm.labor_value || '0').toString().replace(',', '.')) || 0)) * 1.15)}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-2xl font-black text-rose-600">
                      R$ {(osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + (parseFloat((osForm.labor_value || '0').toString().replace(',', '.')) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowOsCalculator(!showOsCalculator)}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-400"
                  >
                    <Calculator size={18} />
                    {showOsCalculator ? 'Esconder Calculadora de Venda' : 'Abrir Calculadora de Taxas/Prazo'}
                  </button>
                </div>

                {showOsCalculator && (
                  <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
                    <VendaCalculator
                      initialCost={osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + parseFloat(osForm.labor_value || '0')}
                      cardFees={cardFeesSettings}
                      onApply={(newTotal) => {
                        const currentTotal = osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + parseFloat(osForm.labor_value || '0');
                        const diff = newTotal - currentTotal;
                        if (diff > 0) {
                          const newLabor = parseFloat(osForm.labor_value || '0') + diff;
                          setOsForm({ ...osForm, labor_value: newLabor.toString() });
                          alert('Diferença aplicada na Mão de Obra!');
                        }
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={handleCompleteOS}
                  className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-lg hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                >
                  {editingOS ? "Salvar Alterações" : "Finalizar O.S."}
                </button>
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
              <p className="text-sm text-slate-600">Visão geral dos serviços e comissões de {selectedMechanicForReport.name}.</p>

              {/* Time Period Filters (Optional, for future enhancement) */}
              {/* <div className="flex gap-2 text-xs">
                <button className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">Hoje</button>
                <button className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">Semana</button>
                <button className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">Mês</button>
              </div> */}

              {/* Report Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Daily, Weekly, Monthly Totals */}
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Hoje</p>
                  <p className="text-xl font-bold text-slate-900">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'day').toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Semana</p>
                  <p className="text-xl font-bold text-slate-900">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'week').toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Quinzena</p>
                  <p className="text-xl font-bold text-slate-900">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'fortnight').toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Mês</p>
                  <p className="text-xl font-bold text-slate-900">R$ {calculateMechanicTotal(selectedMechanicForReport.id, 'month').toFixed(2)}</p>
                </div>
              </div>

              {/* Detailed Services List */}
              <div className="mt-6 border-t border-slate-400 pt-6">
                <h3 className="font-bold text-slate-900 mb-4">Serviços Detalhados</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {sales.filter(s => s.mechanic_id === selectedMechanicForReport.id && s.type === 'Oficina').map(sale => (
                    <div key={sale.id} className="p-3 bg-slate-50 rounded-xl border border-slate-400">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-slate-800">O.S. #{sale.id} - {sale.customer_name}</p>
                        <span className="text-sm font-bold text-rose-600">{formatBRL(sale.commission)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleString()}</p>
                      <div className="mt-2 text-xs text-slate-600">
                        {sale.items.length > 0 && (
                          <p>Peças/Produtos: {sale.items.map(item => `${item.description} (${item.quantity}x)`).join(', ')}</p>
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

        <AnimatePresence>
          {selectedSaleForOS && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
              >
                <div className="p-4 bg-slate-100 flex justify-between items-center rounded-t-lg">
                  <h2 className="text-lg font-bold text-slate-800">Ordem de Serviço A4</h2>
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
                      className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div id="os-printable-area" className="p-8 overflow-y-auto flex-grow font-sans text-sm text-slate-800">
                  {/* Header */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">KOMBAT MOTO PEÇAS</h1>
                      <p className="text-xs">Rua Paraná, 342, Centro | CEP: 86380-000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">Andirá-PR | (43) 3538-4537</p>
                      <h2 className="text-xl font-bold text-slate-900">ORDEM DE SERVIÇO</h2>
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
                    <h3 className="font-bold mb-2 text-center uppercase text-slate-600 text-xs">Descrição dos Produtos / Serviços</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border p-2 text-left w-16">QTD</th>
                          <th className="border p-2 text-left">DESCRIÇÃO</th>
                          <th className="border p-2 text-right w-32">VALOR UNIT.</th>
                          <th className="border p-2 text-right w-32">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSaleForOS?.items || []).map((item, index) => (
                          <tr key={`item-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border p-2 text-center">{item.quantity}</td>
                            <td className="border p-2">{item.description}</td>
                            <td className="border p-2 text-right">{formatBRL(item.price)}</td>
                            <td className="border p-2 text-right">{formatBRL(item.quantity * item.price)}</td>
                          </tr>
                        ))}
                        {(selectedSaleForOS?.labor_value || 0) > 0 && (
                          <tr className={((selectedSaleForOS?.items?.length || 0)) % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
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
                      <div className="flex justify-between p-2 bg-slate-50 rounded-t-md">
                        <span className="font-bold">Total Peças:</span>
                        <span>{formatBRL((selectedSaleForOS?.total || 0) - (selectedSaleForOS?.labor_value || 0))}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50">
                        <span className="font-bold">Total Serviços:</span>
                        <span>{formatBRL(selectedSaleForOS?.labor_value || 0)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-200 text-base rounded-b-md">
                        <span className="font-bold">VALOR TOTAL GERAL:</span>
                        <span className="font-bold">{formatBRL(selectedSaleForOS?.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-[10px] text-slate-500 mt-8 pt-4 border-t">
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
      {/* Virtual Catalog Modal */}
      <Modal isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)} title="Gerador de Catálogo WhatsApp">
        <VirtualCatalogModal products={products} shortenUrl={shortenUrl} />
      </Modal>

      {/* Financial Modals */}
      <Modal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title="Abrir Caixa"
      >
        <form onSubmit={handleOpenCash} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial em Dinheiro (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              value={cashForm.openingBalance}
              onChange={e => setCashForm({ ...cashForm, openingBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
            <textarea
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none min-h-[80px] resize-none"
              value={cashForm.notes}
              onChange={e => setCashForm({ ...cashForm, notes: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">
            Confirmar Abertura
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Sangria / Suprimento"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTransactionForm({ ...transactionForm, type: 'Suprimento' })}
              className={`py-3 rounded-xl font-bold border transition-all ${transactionForm.type === 'Suprimento' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-400 text-slate-600 hover:border-rose-200'}`}
            >
              Suprimento (+)
            </button>
            <button
              type="button"
              onClick={() => setTransactionForm({ ...transactionForm, type: 'Sangria' })}
              className={`py-3 rounded-xl font-bold border transition-all ${transactionForm.type === 'Sangria' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-400 text-slate-600 hover:border-rose-200'}`}
            >
              Sangria (-)
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={transactionForm.amount}
              onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Motivo</label>
            <input
              type="text" required placeholder="Ex: Troco inicial, Pagamento fornecedor..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={transactionForm.description}
              onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">
            Registrar Movimentação
          </button>
        </form>
      </Modal>

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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Mecânico</label>
            <input
              type="text" required placeholder="Ex: João Silva"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
              value={mechanicForm.name}
              onChange={e => setMechanicForm({ ...mechanicForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comissão Padrão (%)</label>
            <input
              type="number" required placeholder="50"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
            <input
              type="text" required placeholder="Ex: Troca de Óleo"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
              value={fixedServiceForm.name}
              onChange={e => setFixedServiceForm({ ...fixedServiceForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda (R$)</label>
              <input
                type="number" step="0.01" required placeholder="0.00"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-rose-600"
                value={fixedServiceForm.price}
                onChange={e => setFixedServiceForm({ ...fixedServiceForm, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Repasse Mecânico (R$)</label>
              <input
                type="number" step="0.01" required placeholder="0.00"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-indigo-600"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Contato</label>
            <input
              type="text" required placeholder="Ex: João da Silva"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.name}
              onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Referência</label>
            <input
              type="text" required placeholder="Ex: Oficina Central"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.company}
              onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.value}
              onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
            <input
              type="text" required placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.phone}
              onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
            <select
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
          <p className="text-sm text-slate-600">Escolha um canal para entrar em contato com o lead.</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Distribuidor</label>
            <input
              type="text" required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
              value={distributorForm.name}
              onChange={e => setDistributorForm({ ...distributorForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (WhatsApp)</label>
            <input
              type="text" required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
              value={distributorForm.phone}
              onChange={e => setDistributorForm({ ...distributorForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pessoa de Contato (Opcional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Distribuidor</label>
            <select
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por descrição ou SKU..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                value={orderSearchProduct}
                onChange={e => setOrderSearchProduct(e.target.value)}
              />
            </div>
            {orderSearchProduct && (
              <div className="absolute z-10 bg-white border border-slate-400 rounded-xl mt-2 w-full max-h-60 overflow-y-auto shadow-lg">
                {sortedProducts.filter(p =>
                  (p.description || '').toLowerCase().includes(orderSearchProduct.toLowerCase()) ||
                  (p.sku || '').toLowerCase().includes(orderSearchProduct.toLowerCase())
                ).map(product => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => handleAddOrderItem(product)}
                    className="flex items-center justify-between w-full p-3 hover:bg-slate-50 transition-colors border-b border-slate-400 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{product.description}</p>
                      <p className="text-xs text-slate-500">SKU: {product.sku} | Estoque: {product.stock}</p>
                    </div>
                    <PlusCircle size={20} className="text-rose-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {orderForm.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Itens do Pedido</h3>
              {orderForm.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-400">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.description}</p>
                    <p className="text-sm text-slate-500">Qtd: {item.quantity}</p>
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
                      className="w-16 px-2 py-1 bg-white border border-slate-400 rounded-lg text-center text-sm"
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-400">
                <p className="text-lg font-bold text-slate-900">Total de Itens:</p>
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
        <div className="bg-white">
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
              <div className="aspect-square bg-white rounded-3xl overflow-hidden border-2 border-slate-100 flex items-center justify-center shadow-inner relative group">
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
                    className="aspect-square bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 transition-all shadow-sm"
                  >
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900 uppercase">{selectedProductDetail.description}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProductDetail.brand && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                      Marca: {selectedProductDetail.brand}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase">
                    SKU: {selectedProductDetail.sku}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-400">
                <h5 className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Aplicação das Peças</h5>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedProductDetail.application || "Nenhuma especificação de aplicação cadastrada para este item."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Preço de Venda</p>
                  <p className="text-3xl font-black text-slate-900">{formatBRL(selectedProductDetail.sale_price)}</p>
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
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
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
            <div className="bg-slate-100 p-8 rounded-2xl flex items-center justify-center">
              <div className="bg-white" style={{ width: '63.5mm', height: '31mm', padding: '3mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px dashed #cbd5e1' }}>
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

            <div className="p-4 bg-slate-50 border border-slate-400 rounded-xl">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantidade de Etiquetas</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setLabelQuantity(Math.max(1, labelQuantity - 1))}
                  className="w-10 h-10 bg-white border border-slate-400 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold"
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="1"
                  max="21"
                  value={labelQuantity}
                  onChange={(e) => setLabelQuantity(Math.min(21, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 h-10 bg-white border border-slate-400 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  onClick={() => setLabelQuantity(Math.min(21, labelQuantity + 1))}
                  className="w-10 h-10 bg-white border border-slate-400 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold"
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
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
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
          setIsQuickInventoryOpen(false);
          setSelectedQuickProduct(null);
          setQuickInventorySearch('');
          setQuickInventoryStock('');
        }}
        title="Contagem de Estoque Express (Manual)"
      >
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Buscar / Bipar Produto</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                autoFocus
                placeholder="Nome, SKU ou Código de Barras..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg transition-all"
                value={quickInventorySearch}
                onChange={e => {
                  setQuickInventorySearch(e.target.value);
                  const val = e.target.value.trim();
                  if (val.length > 3) {
                    const found = products.find(p => 
                      (p.barcode === val) || 
                      (p.sku === val)
                    );
                    if (found) {
                      setSelectedQuickProduct(found);
                      setQuickInventoryStock(found.stock.toString());
                      setQuickInventorySearch('');
                    }
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const q = quickInventorySearch.toLowerCase();
                    const found = products.find(p => 
                      (p.description || '').toLowerCase().includes(q) ||
                      (p.sku || '').toLowerCase() === q ||
                      (p.barcode || '') === q
                    );
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
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                {products.filter(p => {
                  const search = quickInventorySearch.trim().toLowerCase();
                  if (!search) return false;
                  return (
                    (p.description || '').toLowerCase().includes(search) ||
                    (p.sku || '').toLowerCase().includes(search)
                  );
                }).slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedQuickProduct(p);
                      setQuickInventoryStock(p.stock.toString());
                      setQuickInventorySearch('');
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-emerald-50 flex flex-col border-b border-slate-100 last:border-none"
                  >
                    <span className="font-bold text-slate-900">{p.description}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-tighter">SKU: {p.sku || 'N/A'} | Local: {p.location || 'N/A'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedQuickProduct ? (
            <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">{selectedQuickProduct.description}</h3>
                  <p className="text-sm text-emerald-700 font-bold uppercase mt-1">
                    {selectedQuickProduct.brand} | {selectedQuickProduct.location || 'Sem prateleira'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedQuickProduct(null)}
                  className="p-1 px-3 bg-white border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-600 uppercase hover:bg-emerald-100"
                >
                  Mudar Peça
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
                    <span>Estoque Atual</span>
                    <span>{selectedQuickProduct.stock} {selectedQuickProduct.unit}</span>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      className="w-full py-8 text-center text-5xl font-black text-emerald-600 bg-white border-2 border-emerald-400 rounded-2xl shadow-xl outline-none no-spinners"
                      value={quickInventoryStock}
                      onChange={e => setQuickInventoryStock(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold uppercase">
                      Unidades
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[-5, -1, 1, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuickInventoryStock(s => (Math.max(0, (parseInt(s) || 0) + val)).toString())}
                        className={`py-4 rounded-xl font-black text-lg ${val > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} hover:scale-105 transition-all`}
                      >
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleUpdateStockQuick}
                    className="w-full py-6 mt-4 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Confirmar Contagem
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-400 font-medium">Use a busca acima ou bipe o <br /> código para começar a contar.</p>
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
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 font-bold bg-white"
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
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 font-bold bg-white"
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
                className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-4 font-black text-xl focus:ring-2 focus:ring-amber-500"
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
  );
}
