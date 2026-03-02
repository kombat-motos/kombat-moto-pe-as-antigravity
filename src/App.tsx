import React, { useState, useEffect } from 'react';
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
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BillingAutomationBox from './components/BillingAutomationBox';
import VirtualCatalogModal from './components/VirtualCatalogModal';
import Auth from './components/Auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from './supabase';

// --- Types ---
interface Customer {
  id: number;
  name: string;
  cpf: string;
  cnpj?: string; // CNPJ is optional
  whatsapp: string;
  address: string;
  neighborhood: string;
  city?: string; // City is optional
  zip_code: string;
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
  image_url?: string;
  category?: string;
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

interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
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
  service_description?: string;
  status?: 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue';
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
  phone: string;
  contact_person?: string;
}

interface PurchaseOrderItem {
  description: string;
  quantity: number;
}

interface PurchaseOrder {
  id: string;
  distributor_id: string;
  distributor_name: string;
  items: PurchaseOrderItem[];
  date: string;
  status: 'Pendente' | 'Enviado' | 'Recebido';
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
      ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
      : 'text-slate-500 hover:bg-slate-100'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
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
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
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

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inventoryView, setInventoryView] = useState<'list' | 'grid'>('list');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Environment Check
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("ERRO CRÍTICO: Variáveis do Supabase faltando!");
    }
  }, []);

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(null);
  const [editingOS, setEditingOS] = useState<Sale | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form States
  const [customerForm, setCustomerForm] = useState({ name: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1 });
  const [productForm, setProductForm] = useState({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '' });
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
  const [pdvForm, setPdvForm] = useState<{
    customer_id: string;
    items: SaleItem[];
    payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
    due_date: string;
  }>({
    customer_id: '',
    items: [],
    payment_method: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForOS, setSelectedSaleForOS] = useState<Sale | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [fixedServices, setFixedServices] = useState<FixedService[]>([]);
  const [isMechanicModalOpen, setIsMechanicModalOpen] = useState(false);
  const [mechanicForm, setMechanicForm] = useState({ name: '' });
  const [isFixedServiceModalOpen, setIsFixedServiceModalOpen] = useState(false);
  const [fixedServiceForm, setFixedServiceForm] = useState({ name: '', payout: '' });
  const [isMechanicReportModalOpen, setIsMechanicReportModalOpen] = useState(false);
  const [selectedMechanicForReport, setSelectedMechanicForReport] = useState<Mechanic | null>(null);
  const [isFiadoModalOpen, setIsFiadoModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [selectedCustomerForPrint, setSelectedCustomerForPrint] = useState<{ customer: Customer; type: 'A4' | '80mm' } | null>(null);
  const [isManagementReportModalOpen, setIsManagementReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'customers' | 'inventory' | 'sales' | 'financial' | 'purchases' | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(localStorage.getItem('companyLogo'));
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
      autoNotification: true
    };
  });

  useEffect(() => {
    localStorage.setItem('fiadoSettings', JSON.stringify(fiadoSettings));
  }, [fiadoSettings]);

  // Financial State
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashForm, setCashForm] = useState({ openingBalance: '', notes: '' });
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ type: 'Sangria' as 'Suprimento' | 'Sangria', amount: '', description: '' });

  // Parts Order State
  const [distributors, setDistributors] = useState<Distributor[]>([
    { id: '1', name: 'Distribuidora MotoPeças', phone: '5511999999999', contact_person: 'Ricardo' },
    { id: '2', name: 'Central das Motos', phone: '5511888888888', contact_person: 'Ana' }
  ]);
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

  const handleAddDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const { error } = await supabase.from('distributors').insert([{
        id,
        name: distributorForm.name,
        phone: distributorForm.phone,
        contact_person: distributorForm.contact_person,
      }]);
      if (error) throw error;

      setIsDistributorModalOpen(false);
      setDistributorForm({ name: '', phone: '', contact_person: '' });
      alert(`Distribuidor cadastrado com sucesso!`);
      fetchData();
    } catch (error) {
      console.error('Error adding distributor:', error);
      alert('Erro ao salvar distribuidor.');
    }
  };

  const handleAddMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      const { error } = await supabase.from('mechanics').insert([{
        id,
        name: mechanicForm.name,
      }]);
      if (error) throw error;

      setIsMechanicModalOpen(false);
      setMechanicForm({ name: '' });
      alert(`Mecânico cadastrado com sucesso!`);
      fetchData();
    } catch (error) {
      console.error('Error adding mechanic:', error);
      alert('Erro ao salvar mecânico.');
    }
  };

  const handleAddFixedService = async (e: React.FormEvent) => {
    e.preventDefault();
    const payout = parseFloat(fixedServiceForm.payout.toString().replace(',', '.')) || 0;
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
      const { error } = await supabase.from('fixed_services').insert([{
        id,
        name: fixedServiceForm.name,
        payout,
      }]);
      if (error) throw error;

      setIsFixedServiceModalOpen(false);
      setFixedServiceForm({ name: '', payout: '' });
      alert(`Serviço adicionado à tabela!`);
      fetchData();
    } catch (error) {
      console.error('Error adding fixed service:', error);
      alert('Erro ao salvar serviço.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este pedido de peças?')) {
      try {
        const { error } = await supabase.from('purchase_orders').delete().eq('id', orderId);
        if (error) throw error;
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

  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Não foi possível verificar a sessão', error);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao sair', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: productsData },
        { data: customersData },
        { data: motorcyclesData },
        { data: salesData },
        { data: leadsData },
        { data: mechanicsData },
        { data: fixedServicesData },
        { data: distributorsData },
        { data: ordersData },
        { data: cashSessionsData },
        { data: cashTransactionsData }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('motorcycles').select('*'),
        supabase.from('sales').select('*, sale_items(*)'),
        supabase.from('leads').select('*'),
        supabase.from('mechanics').select('*'),
        supabase.from('fixed_services').select('*'),
        supabase.from('distributors').select('*'),
        supabase.from('purchase_orders').select('*, purchase_order_items(*)'),
        supabase.from('cash_sessions').select('*'),
        supabase.from('cash_transactions').select('*')
      ]);

      if (productsData) setProducts(productsData);
      if (customersData) setCustomers(customersData);
      if (motorcyclesData) setMotorcycles(motorcyclesData.map((m: any) => ({
        ...m,
        customer_id: m.customer_id,
        current_km: m.current_km
      })));
      if (salesData) setSales(salesData.map((s: any) => ({
        ...s,
        items: s.sale_items || [],
        customer_id: s.customer_id,
        mechanic_id: s.mechanic_id,
        payment_method: s.payment_method,
        payment_status: s.payment_status,
        due_date: s.due_date,
        paid_date: s.paid_date,
        service_description: s.service_description
      })));
      if (leadsData) setLeads(leadsData);
      if (mechanicsData) setMechanics(mechanicsData);
      if (fixedServicesData) setFixedServices(fixedServicesData);
      if (distributorsData) setDistributors(distributorsData.map((d: any) => ({
        ...d,
        contact_person: d.contact_person
      })));
      if (ordersData) setPurchaseOrders(ordersData.map((o: any) => ({
        ...o,
        items: o.purchase_order_items || [],
        distributor_id: o.distributor_id
      })));

      if (cashSessionsData) {
        const sessions = cashSessionsData.map((s: any) => ({
          id: s.id,
          openedAt: s.opened_at,
          closedAt: s.closed_at,
          openingBalance: s.opening_balance,
          closingBalance: s.closing_balance,
          expectedBalance: s.expected_balance,
          status: s.status,
          notes: s.notes
        }));
        setCashSessions(sessions);
        const active = sessions.find((s: any) => s.status === 'Aberto');
        if (active) setActiveSession(active);
      }

      if (cashTransactionsData) {
        setCashTransactions(cashTransactionsData.map((t: any) => ({
          id: t.id,
          sessionId: t.session_id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.date
        })));
      }

      // Generate basic stats if data available
      if (salesData) {
        const counterSales = salesData.filter((s: any) => s.type === 'Balcão');
        const serviceSales = salesData.filter((s: any) => s.type === 'Oficina');

        const avgCounter = counterSales.length > 0
          ? counterSales.reduce((acc: number, s: any) => acc + s.total, 0) / counterSales.length
          : 0;

        const avgService = serviceSales.length > 0
          ? serviceSales.reduce((acc: number, s: any) => acc + s.total, 0) / serviceSales.length
          : 0;

        // Calculate top products
        const productCounts: { [key: string]: number } = {};
        salesData.forEach((s: any) => {
          (s.sale_items || []).forEach((item: any) => {
            productCounts[item.description] = (productCounts[item.description] || 0) + item.quantity;
          });
        });

        const topProducts = Object.entries(productCounts)
          .map(([description, total_sold]) => ({ description, total_sold }))
          .sort((a, b) => b.total_sold - a.total_sold)
          .slice(0, 5);

        setStats({
          revenue: salesData.reduce((acc: number, s: any) => acc + s.total, 0),
          openServiceOrders: salesData.filter((s: any) => s.type === 'Oficina' && s.status !== 'Entregue').length,
          topProducts,
          avgTicketCounter: avgCounter,
          avgTicketService: avgService
        });
      }

    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDueDate = (saleId: string, newDate: string) => {
    setSales(sales.map(s => s.id === saleId ? { ...s, due_date: new Date(newDate).toISOString() } : s));
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
        const { error } = await supabase.from('leads').update({
          name: leadForm.name,
          company: leadForm.company,
          value: parseFloat(leadForm.value.toString().replace(',', '.')) || 0,
          priority: leadForm.priority,
          phone: leadForm.phone
        }).eq('id', editingLead.id);
        if (error) throw error;
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        const { error } = await supabase.from('leads').insert([{
          id,
          name: leadForm.name,
          company: leadForm.company,
          value: parseFloat(leadForm.value.toString().replace(',', '.')) || 0,
          priority: leadForm.priority,
          status: 'Prospecção',
          phone: leadForm.phone
        }]);
        if (error) throw error;
      }

      setIsLeadModalOpen(false);
      setEditingLead(null);
      setLeadForm({ name: '', company: '', value: '', priority: 'Média', phone: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding/updating lead:', error);
      alert('Erro ao salvar lead: ' + (error.message || 'Erro de conexão ou permissão.'));
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
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
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

  const handleRemoveOsItem = (productId?: number) => {
    setOsForm({
      ...osForm,
      items: osForm.items.filter(i => i.product_id !== productId)
    });
  };

  const handleCompleteSale = async () => {
    if (pdvForm.items.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    const total = pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const customer = pdvForm.customer_id ? customers.find(c => c.id === parseInt(pdvForm.customer_id)) : null;

    if (pdvForm.payment_method === 'Fiado') {
      if (!pdvForm.customer_id) {
        alert("Selecione um cliente cadastrado para realizar uma venda fiada.");
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
        alert(`Limite de crédito excedido! \nLimite: R$ ${customer.credit_limit?.toFixed(2)} \nDívida Atual: R$ ${currentDebt.toFixed(2)} \nEsta Venda: R$ ${total.toFixed(2)}`);
        return;
      }
    }

    const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newSale: Sale = {
      id: saleId,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Consumidor Final',
      items: pdvForm.items,
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
      // 1. Insert into sales
      const { error: saleError } = await supabase.from('sales').insert([{
        id: newSale.id,
        customer_id: newSale.customer_id,
        customer_name: newSale.customer_name,
        labor_value: newSale.labor_value,
        commission: newSale.commission,
        total: newSale.total,
        payment_method: newSale.payment_method,
        type: newSale.type,
        date: newSale.date,
        payment_status: newSale.payment_status,
        due_date: newSale.due_date,
        paid_date: newSale.paid_date
      }]);

      if (saleError) throw saleError;

      // 2. Insert into sale_items
      const saleItems = pdvForm.items.map(item => ({
        sale_id: saleId,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. Update stock and Local State
      for (const item of pdvForm.items) {
        if (item.product_id) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const newStock = product.stock - item.quantity;
            await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
          }
        }
      }

      setSales([newSale, ...sales]);
      setIsPdvModalOpen(false);
      setSelectedSaleForReceipt(newSale);
      setPdvForm({
        customer_id: '',
        items: [],
        payment_method: 'Pix',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      alert(`Venda ${newSale.id} concluída com sucesso!`);
      fetchData(); // Refresh all data to ensure consistency

    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao registrar movimentação.');
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

    const totalItems = osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const laborValue = parseFloat(osForm.labor_value.toString().replace(',', '.')) || 0;
    const total = totalItems + laborValue;
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
        alert(`Limite de crédito excedido! \nLimite: R$ ${customer.credit_limit?.toFixed(2)} \nDívida Atual: R$ ${currentDebt.toFixed(2)} \nEsta O.S.: R$ ${total.toFixed(2)}`);
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
      items: osForm.items,
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
      if (editingOS) {
        const { error: saleError } = await supabase.from('sales').update({
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
          status: newOS.status
        }).eq('id', editingOS.id);
        if (saleError) throw saleError;

        await supabase.from('sale_items').delete().eq('sale_id', osId);
      } else {
        const { error: saleError } = await supabase.from('sales').insert([{
          id: newOS.id,
          customer_id: newOS.customer_id,
          customer_name: newOS.customer_name,
          labor_value: newOS.labor_value,
          mechanic_id: newOS.mechanic_id,
          mechanic_name: newOS.mechanic_name,
          commission: newOS.commission,
          total: newOS.total,
          payment_method: newOS.payment_method,
          type: newOS.type,
          date: newOS.date,
          moto_details: newOS.moto_details,
          payment_status: newOS.payment_status,
          due_date: newOS.due_date,
          paid_date: newOS.paid_date,
          service_description: newOS.service_description,
          status: newOS.status
        }]);
        if (saleError) throw saleError;
      }

      // 2. Insert into sale_items
      if (osForm.items.length > 0) {
        const saleItems = osForm.items.map(item => ({
          sale_id: osId,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
        if (itemsError) throw itemsError;
      }

      // 3. Update stock with Reversal Logic
      const stockAdjustments = new Map<number, number>();
      if (editingOS) {
        editingOS.items.forEach(item => {
          if (item.product_id) {
            stockAdjustments.set(item.product_id, (stockAdjustments.get(item.product_id) || 0) + item.quantity);
          }
        });
      }
      osForm.items.forEach(item => {
        if (item.product_id) {
          stockAdjustments.set(item.product_id, (stockAdjustments.get(item.product_id) || 0) - item.quantity);
        }
      });

      for (const [productId, adjustment] of stockAdjustments) {
        if (adjustment !== 0) {
          const product = products.find(p => p.id === productId);
          if (product) {
            const newStock = product.stock + adjustment;
            await supabase.from('products').update({ stock: newStock }).eq('id', productId);
          }
        }
      }

      // 4. Update motorcycle KM
      if (motorcycle && osForm.km) {
        await supabase.from('motorcycles').update({ current_km: parseInt(osForm.km) || 0 }).eq('id', motorcycle.id);
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
      alert(`Ordem de Serviço ${newOS.id} criada com sucesso!`);
      fetchData();

    } catch (error) {
      console.error('Error completing O.S.:', error);
      alert('Erro ao salvar Ordem de Serviço no banco de dados.');
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Vendas de Hoje</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">R$ {totalToday.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-1">{todaySales.length} atendimentos realizados</p>

              <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Por Meio de Pagamento</p>
                {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => {
                  const amount = todaySales.filter(s => s.payment_method === method).reduce((acc, curr) => acc + curr.total, 0);
                  return (
                    <div key={method} className="flex justify-between text-sm">
                      <span className="text-slate-500">{method}</span>
                      <span className="font-bold text-slate-900">R$ {amount.toFixed(2)}</span>
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Últimas Movimentações</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar vendas..."
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none text-sm w-48"
                    value={salesSearchTerm}
                    onChange={e => setSalesSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {sales.filter(s => {
                  const search = (salesSearchTerm + globalSearchTerm).toLowerCase();
                  return (
                    s.customer_name.toLowerCase().includes(search) ||
                    s.id.toLowerCase().includes(search) ||
                    s.items.some(i => i.description.toLowerCase().includes(search))
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
                        <p className="font-bold text-slate-900">R$ {sale.total.toFixed(2)}</p>
                        <p className="text-xs text-rose-600 font-medium">{sale.payment_method}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600">
                        <span className="font-bold">Total:</span> R$ {sale.total.toFixed(2)}
                      </div>
                      <div className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600">
                        <span className="font-bold">Peças:</span> R$ {sale.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
                      </div>
                      {sale.type === 'Oficina' && (
                        <>
                          <div className="px-2 py-1 bg-amber-50 rounded text-[10px] text-amber-700">
                            <span className="font-bold">Comissão ({sale.mechanic_name}):</span> R$ {sale.commission.toFixed(2)}
                          </div>
                          <div className="px-2 py-1 bg-rose-50 rounded text-[10px] text-rose-700">
                            <span className="font-bold">Líquido Loja:</span> R$ {(sale.total - sale.commission).toFixed(2)}
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
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1"
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
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
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
            <div key={column} className="flex-shrink-0 w-80 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
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
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
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
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                      <span className="text-sm font-bold text-slate-900">R$ {lead.value.toFixed(2)}</span>
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
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none w-64"
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
            <div key={os.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
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
                  <p className="text-2xl font-black text-slate-900">R$ {os.total.toFixed(2)}</p>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      onClick={() => handleEditOS(os)}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 border border-slate-200"
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

              <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
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

    const handleMarkAsPaid = (saleId: string) => {
      setSales(sales.map(sale =>
        sale.id === saleId ? { ...sale, payment_status: 'Pago', paid_date: new Date().toISOString() } : sale
      ));
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Controle de Fiado">
        <div className="space-y-4">
          {pendingFiadoSales.length === 0 ? (
            <p className="text-slate-500 text-center">Nenhuma venda fiado pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendingFiadoSales.map(sale => (
                <div key={sale.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
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

  const renderMechanics = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Equipe e Serviços</h2>
          <p className="text-sm text-slate-500">Mecânicos e Tabela de Repasses Fixos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsFixedServiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <Settings size={18} />
            Tabela de Serviços
          </button>
          <button
            onClick={() => setIsMechanicModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
          >
            <Plus size={18} />
            Novo Mecânico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mechanics List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Mecânicos Cadastrados</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {mechanics.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">Regra: 50% em serviços variáveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMechanicForReport(m);
                      setIsMechanicReportModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Ver Relatório
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Excluir mecânico ${m.name}?`)) {
                        const { error } = await supabase.from('mechanics').delete().eq('id', m.id);
                        if (!error) fetchData();
                        else alert('Erro ao excluir mecânico.');
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Tabela de Repasses Fixos</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {fixedServices.map(fs => (
              <div key={fs.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-900">{fs.name}</p>
                  <p className="text-xs text-slate-500">Valor fixo para o mecânico</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-rose-600">R$ {fs.payout.toFixed(2)}</span>
                  <button
                    onClick={async () => {
                      if (confirm(`Excluir serviço ${fs.name}?`)) {
                        const { error } = await supabase.from('fixed_services').delete().eq('id', fs.id);
                        if (!error) fetchData();
                        else alert('Erro ao excluir serviço.');
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
      const { error } = await supabase.from('cash_sessions').insert([{
        id,
        opened_at: new Date().toISOString(),
        opening_balance: parseFloat(cashForm.openingBalance.toString().replace(',', '.')) || 0,
        status: 'Aberto',
        notes: cashForm.notes
      }]);
      if (error) throw error;

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
      const { error } = await supabase.from('cash_sessions').update({
        closed_at: new Date().toISOString(),
        closing_balance: parseFloat(closingBalance) || 0,
        expected_balance: expected,
        status: 'Fechado'
      }).eq('id', activeSession.id);

      if (error) throw error;

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
      const { error } = await supabase.from('cash_transactions').insert([{
        id,
        session_id: activeSession?.id,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount.toString().replace(',', '.')) || 0,
        description: transactionForm.description,
        date: new Date().toISOString()
      }]);
      if (error) throw error;

      setIsTransactionModalOpen(false);
      setTransactionForm({ type: 'Sangria', amount: '', description: '' });
      fetchData();
      alert('Movimentação registrada!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao registrar movimentação.');
    }
  };

  const handleAddOrderItem = (product: Product) => {
    const existing = orderForm.items.find(i => i.description === product.description);
    if (existing) {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.map(i => i.description === product.description ? { ...i, quantity: i.quantity + 1 } : i)
      });
    } else {
      setOrderForm({
        ...orderForm,
        items: [...orderForm.items, { description: product.description, quantity: 1 }]
      });
    }
    setOrderSearchProduct('');
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
    const distributor = distributors.find(d => d.id === order.distributor_id);
    if (!distributor) return;

    let message = `*PEDIDO DE PEÇAS - KOMBAT MOTO*\n`;
    message += `Data: ${new Date(order.date).toLocaleDateString('pt-BR')}\n`;
    message += `Pedido ID: ${order.id}\n\n`;
    message += `*ITENS:*\n`;
    order.items.forEach(item => {
      message += `- ${item.quantity}x ${item.description}\n`;
    });
    message += `\nFavor confirmar recebimento e informar previsão de entrega.`;

    window.open(`https://wa.me/${distributor.phone}?text=${encodeURIComponent(message)}`, '_blank');

    // Update status to Sent in database
    supabase.from('purchase_orders').update({ status: 'Enviado' }).eq('id', order.id).then(({ error }) => {
      if (!error) fetchData();
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const distributor = distributors.find(d => d.id === orderForm.distributor_id);
    if (!distributor || orderForm.items.length === 0) return;

    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newOrder: PurchaseOrder = {
      id: orderId,
      distributor_id: orderForm.distributor_id,
      distributor_name: distributor.name,
      items: orderForm.items,
      date: new Date().toISOString(),
      status: 'Pendente'
    };

    try {
      const { error: orderError } = await supabase.from('purchase_orders').insert([{
        id: newOrder.id,
        distributor_id: newOrder.distributor_id,
        date: newOrder.date,
        status: newOrder.status
      }]);
      if (orderError) throw orderError;

      const orderItems = orderForm.items.map(item => ({
        order_id: orderId,
        description: item.description,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase.from('purchase_order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      setPurchaseOrders([newOrder, ...purchaseOrders]);
      setIsOrderModalOpen(false);
      setOrderForm({ distributor_id: '', items: [] });
      fetchData();

      if (confirm('Pedido criado! Deseja enviar via WhatsApp agora?')) {
        handleSendOrderWhatsApp(newOrder);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Erro ao salvar pedido.');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { name, cpf, cnpj, whatsapp, address, neighborhood, city, zip_code, fine_rate, interest_rate } = customerForm;
      const dataToSave = {
        name,
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
        const { error } = await supabase.from('customers').update(dataToSave).eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert([dataToSave]);
        if (error) throw error;
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      setCustomerForm({ name: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1 });
      fetchData();
    } catch (error: any) {
      console.error('Error adding/updating customer:', error);
      alert('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido.'));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para salvar produtos.');
      return;
    }

    try {
      const productData = {
        description: productForm.description,
        sku: productForm.sku,
        barcode: productForm.barcode,
        purchase_price: parseFloat(productForm.purchase_price.toString().replace(',', '.')) || 0,
        sale_price: parseFloat(productForm.sale_price.toString().replace(',', '.')) || 0,
        stock: parseInt(productForm.stock.toString()) || 0,
        unit: productForm.unit,
        image_url: productForm.image_url,
        category: categorizeProduct(productForm.description)
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
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
        image_url: ''
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
      category: product.category || categorizeProduct(product.description)
    });
    setIsProductModalOpen(true);
  };

  const handleProductImageUpload = async (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageUrl = reader.result as string;

        // Optimistic update
        setProducts(products.map(p => p.id === productId ? { ...p, image_url: imageUrl } : p));

        // Update in database
        try {
          const { error } = await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId);
          if (error) throw error;
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
      // Optimistic update
      setProducts(products.map(p => p.id === productId ? { ...p, image_url: url } : p));

      // Update in database
      try {
        const { error } = await supabase.from('products').update({ image_url: url }).eq('id', productId);
        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error("Failed to update product image URL", error);
        alert("Erro ao salvar a URL da imagem.");
      }
    }
  };

  const handleAddMotorcycle = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === parseInt(motorcycleForm.customer_id));
    if (!customer) return;

    try {
      if (editingMotorcycle) {
        const { error } = await supabase.from('motorcycles').update({
          customer_id: parseInt(motorcycleForm.customer_id),
          plate: motorcycleForm.plate,
          model: motorcycleForm.model,
          current_km: parseInt(motorcycleForm.current_km.toString()) || 0
        }).eq('id', editingMotorcycle.id);
        if (error) throw error;
        alert('Moto atualizada!');
      } else {
        const { error } = await supabase.from('motorcycles').insert([{
          customer_id: parseInt(motorcycleForm.customer_id),
          plate: motorcycleForm.plate,
          model: motorcycleForm.model,
          current_km: parseInt(motorcycleForm.current_km.toString()) || 0
        }]);
        if (error) throw error;
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
        const { error } = await supabase.from('motorcycles').delete().eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        alert('Produto excluído com sucesso!');
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erro ao excluir produto.');
      }
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
        alert('Venda excluída com sucesso!');
        fetchData();
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Erro ao excluir venda.');
      }
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

  const handleDownloadExcel = () => {
    const data = products.map(p => ({
      ID: p.id,
      Descrição: p.description,
      SKU: p.sku,
      EAN: p.barcode,
      'Preço de Compra': p.purchase_price,
      'Preço de Venda': p.sale_price,
      Estoque: p.stock,
      Unidade: p.unit,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'produtos.xlsx');
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

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const newProducts = data.map((item: any, index: number) => ({
        id: item.ID || (baseId + index),
        description: item.Descrição || item.Description || item.description || '',
        sku: item.SKU || item.sku || '',
        barcode: item.EAN || item.Barcode || item.barcode || '',
        purchase_price: parseFloat(item['Preço de Compra'] || item.PurchasePrice || item.purchase_price || 0),
        sale_price: parseFloat(item['Preço de Venda'] || item.SalePrice || item.sale_price || 0),
        stock: parseInt(item.Estoque || item.Stock || item.stock || 0),
        unit: item.Unidade || item.Unit || item.unit || 'Unitário',
      }));

      setProducts(prev => [...prev, ...newProducts]);
      alert(`${newProducts.length} produtos importados com sucesso!`);
    };
    reader.readAsBinaryString(file);
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Faturamento Mensal"
          value={`R$ ${stats?.revenue.toFixed(2) || '0.00'}`}
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
          value={`R$ ${stats?.avgTicketCounter.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="bg-emerald-500"
          subtitle="Média por venda balcão"
        />
        <StatCard
          title="Ticket Médio (O.S.)"
          value={`R$ ${stats?.avgTicketService.toFixed(2) || '0.00'}`}
          icon={ClipboardList}
          color="bg-blue-500"
          subtitle="Média por ordem de serviço"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-rose-500" />
            Top 5 Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {stats?.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-sm font-bold text-slate-400 border border-slate-200">
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
          customers={customers}
          companyData={companyData}
          onUpdateDueDate={handleUpdateDueDate}
        />
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Clientes e Motos</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.filter(c => {
          const search = (customerSearchTerm + globalSearchTerm).toLowerCase();
          return (
            c.name.toLowerCase().includes(search) ||
            c.cpf.toLowerCase().includes(search) ||
            c.whatsapp.toLowerCase().includes(search) ||
            c.cnpj?.toLowerCase().includes(search) ||
            c.city?.toLowerCase().includes(search)
          );
        }).map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{c.name}</h4>
                <p className="text-sm text-slate-500">CPF: {c.cpf || 'Não informado'}</p>
                <p className="text-sm text-slate-500">Celular: {c.whatsapp}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Limite Total:</span>
                    <span className="text-xs font-bold text-slate-600">R$ {c.credit_limit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Disponível:</span>
                    <span className={`text-xs font-bold ${getCustomerRemainingCredit(c.id) > 0 ? 'text-rose-600' : 'text-rose-600'}`}>
                      R$ {getCustomerRemainingCredit(c.id).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
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
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                title="Editar Cliente"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => setSelectedCustomerForHistory(c)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                title="Histórico de Vendas"
              >
                <List size={20} />
              </button>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Motos Cadastradas</p>
              <div className="space-y-2">
                {motorcycles.filter(m => m.customer_id === c.id).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{m.model}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{m.plate}</p>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Estoque de Peças</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
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
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium cursor-pointer">
            <Package size={18} />
            Importar Produtos
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportProducts} />
          </label>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
          >
            <Printer size={18} />
            Exportar Produtos
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '' });
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SKU / EAN</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preços (C/V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.filter(p => {
                const search = (inventorySearchTerm + globalSearchTerm).toLowerCase();
                return (
                  p.description.toLowerCase().includes(search) ||
                  p.sku.toLowerCase().includes(search) ||
                  p.barcode?.toLowerCase().includes(search)
                );
              }).sort((a, b) => a.description.localeCompare(b.description)).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.description} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{p.description}</p>
                        <p className="text-xs text-slate-400">{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500 font-mono">{p.sku}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.barcode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400">C: R$ {p.purchase_price?.toFixed(2)}</p>
                    <p className="text-sm font-bold text-slate-900">V: R$ {p.sale_price.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.stock < 5 ? 'bg-rose-100 text-rose-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                      {p.stock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex items-center bg-slate-50 rounded-lg p-1 mr-2">
                        <label className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-all cursor-pointer" title="Upload de Foto">
                          <Upload size={14} />
                          <input type="file" accept="image/*,.jpg,.jpeg,.png,.gif,.webp" className="hidden" onChange={(e) => handleProductImageUpload(p.id, e)} />
                        </label>
                        <button
                          onClick={() => handleProductImageUrl(p.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all"
                          title="Inserir URL da Foto"
                        >
                          <Link size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleEditProduct(p)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Editar Produto"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir Produto"
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.filter(p => {
            const search = (inventorySearchTerm + globalSearchTerm).toLowerCase();
            return (
              p.description.toLowerCase().includes(search) ||
              p.sku.toLowerCase().includes(search) ||
              p.barcode?.toLowerCase().includes(search)
            );
          }).sort((a, b) => a.description.localeCompare(b.description)).map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
              <div className="h-48 bg-slate-50 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.description} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <ImageIcon size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-rose-600 cursor-pointer transition-all">
                    <Upload size={16} />
                    <input type="file" accept="image/*,.jpg,.jpeg,.png,.gif,.webp" className="hidden" onChange={(e) => handleProductImageUpload(p.id, e)} />
                  </label>
                  <button
                    onClick={() => handleProductImageUrl(p.id)}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-blue-600 transition-all"
                  >
                    <Link size={16} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${p.stock < 5 ? 'bg-rose-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    {p.stock} em estoque
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 line-clamp-1">{p.description}</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3 font-mono">{p.sku}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Preço de Venda</p>
                    <p className="text-lg font-black text-slate-900">R$ {p.sale_price.toFixed(2)}</p>
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
        </div>
      )}
    </div>
  );

  const renderFinancial = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySales = sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const productSales = monthlySales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + (i.price * i.quantity), 0), 0);
    const serviceSales = monthlySales.reduce((acc, s) => acc + s.labor_value, 0);
    const totalRevenue = productSales + serviceSales;

    return (
      <div className="space-y-8">
        {/* Cash Control Header */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
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

        {/* Monthly Summary Cards - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={20} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Venda de Produtos</p>
            </div>
            <h4 className="text-2xl font-black text-slate-900">R$ {productSales.toFixed(2)}</h4>
            <p className="text-xs text-slate-400 mt-1">Acumulado no mês</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Bike size={20} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Venda de Serviços</p>
            </div>
            <h4 className="text-2xl font-black text-slate-900">R$ {serviceSales.toFixed(2)}</h4>
            <p className="text-xs text-slate-400 mt-1">Mão de obra acumulada</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 bg-gradient-to-br from-rose-600 to-rose-700 text-white border-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 text-white rounded-lg">
                <TrendingUp size={20} />
              </div>
              <p className="text-sm font-bold text-white/70 uppercase tracking-wider">Faturamento Total</p>
            </div>
            <h4 className="text-2xl font-black">R$ {totalRevenue.toFixed(2)}</h4>
            <p className="text-xs text-white/50 mt-1">Total bruto mensal</p>
          </div>
        </div>

        {/* Detailed Reports & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods Chart Placeholder */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-500" />
              Meios de Pagamento (Mês)
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
                      <div
                        className={`h-full rounded-full ${method === 'Pix' ? 'bg-rose-500' :
                          method === 'Cartão' ? 'bg-blue-500' :
                            method === 'Dinheiro' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Cash Sessions */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-slate-500" />
              Histórico de Caixas
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {cashSessions.length === 0 ? (
                <p className="text-center text-slate-400 py-8 italic">Nenhum fechamento registrado.</p>
              ) : (
                cashSessions.map(session => (
                  <div key={session.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">{new Date(session.openedAt).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm font-bold text-slate-900">Sessão {session.id}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${session.status === 'Aberto' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                        {session.status.toUpperCase()}
                      </span>
                    </div>
                    {session.status === 'Fechado' && (
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Esperado</p>
                          <p className="text-sm font-bold text-slate-700">R$ {session.expectedBalance?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Informado</p>
                          <p className="text-sm font-bold text-rose-600">R$ {session.closingBalance?.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                placeholder="Ex: Kombat Peças e Serviços Ltda"
                value={companyData.razaoSocial}
                onChange={e => setCompanyData({ ...companyData, razaoSocial: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome Fantasia</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
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
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="00.000.000/0000-00"
              value={companyData.cnpj}
              onChange={e => setCompanyData({ ...companyData, cnpj: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Telefone / WhatsApp</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="(00) 00000-0000"
              value={companyData.telefone}
              onChange={e => setCompanyData({ ...companyData, telefone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">E-mail de Contato</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="contato@empresa.com"
              value={companyData.email}
              onChange={e => setCompanyData({ ...companyData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">CEP</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="00000-000"
              value={companyData.cep}
              onChange={e => setCompanyData({ ...companyData, cep: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Endereço Completo</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              placeholder="Rua, Número, Complemento"
              value={companyData.endereco}
              onChange={e => setCompanyData({ ...companyData, endereco: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Bairro</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              value={companyData.bairro}
              onChange={e => setCompanyData({ ...companyData, bairro: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cidade</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                value={companyData.cidade}
                onChange={e => setCompanyData({ ...companyData, cidade: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
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
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
                  className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  value={fiadoSettings.monthlyInterest}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, monthlyInterest: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-sm text-slate-500 font-medium">ao mês</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">Os juros serão aplicados automaticamente após o vencimento.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
                  className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
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
                  className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  value={fiadoSettings.notificationDaysAfter}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, notificationDaysAfter: parseInt(e.target.value) || 0 })}
                />
                <span className="text-sm text-slate-500 font-medium">dias depois</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
          <div className="w-32 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
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

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all text-left bg-slate-50/50"
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

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
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
            onClick={() => setIsOrderModalOpen(true)}
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Pedidos Recentes</h3>
        <div className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <p className="text-center text-slate-400 py-8 italic">Nenhum pedido de peças registrado ainda.</p>
          ) : (
            purchaseOrders.map(order => (
              <div key={order.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Pedido #{order.id}</p>
                  <p className="text-sm text-slate-500">Distribuidor: {order.distributor_name}</p>
                  <p className="text-xs text-slate-400">Data: {new Date(order.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${order.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : order.status === 'Enviado' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                    {order.status.toUpperCase()}
                  </span>
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
            ))
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
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200"><Printer size={20} /></button>
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
                {customers.map(c => {
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
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Relatório de Estoque e Valoração</h2>
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200"><Printer size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase">Total de Itens</p>
                <p className="text-2xl font-black text-amber-700">{products.reduce((acc, p) => acc + p.stock, 0)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase">Investimento Total</p>
                <p className="text-2xl font-black text-emerald-700">R$ {products.reduce((acc, p) => acc + (p.purchase_price * p.stock), 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Venda Estimada</p>
                <p className="text-2xl font-black text-indigo-700">R$ {products.reduce((acc, p) => acc + (p.sale_price * p.stock), 0).toFixed(2)}</p>
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
                {products.sort((a, b) => a.stock - b.stock).map(p => (
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
              <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-lg no-print hover:bg-slate-200"><Printer size={20} /></button>
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
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Resumo por Forma de Pagamento</h4>
              <div className="grid grid-cols-4 gap-4">
                {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => (
                  <div key={method} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
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
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Sidebar Trigger Area (Hover zone) */}
      <div
        className="fixed left-0 top-0 bottom-0 w-4 z-50"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 z-50 transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-rose-100 border border-slate-100">
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
            icon={Truck}
            label="Pedidos de Peças"
            active={activeTab === 'orders'}
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
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

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
              {activeTab === 'crm' && 'CRM de Vendas'}
              {activeTab === 'pdv' && 'Frente de Caixa (PDV)'}
              {activeTab === 'os' && 'Ordens de Serviço'}
              {activeTab === 'financial' && 'Gestão Financeira'}
              {activeTab === 'orders' && 'Pedidos de Peças'}
              {activeTab === 'mechanics' && 'Gestão de Mecânicos'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
            </h2>
            <p className="text-slate-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-64"
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img src="https://picsum.photos/seed/admin/100/100" alt="Admin Avatar" referrerPolicy="no-referrer" />
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
                {activeTab === 'crm' && renderCRM()}
                {activeTab === 'pdv' && renderPDV()}
                {activeTab === 'os' && renderOS()}
                {activeTab === 'financial' && renderFinancial()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'mechanics' && renderMechanics()}
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
                      <div key={sale.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
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
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                              <span>{item.quantity}x {item.description}</span>
                              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {sale.labor_value > 0 && (
                            <div className="flex justify-between text-[11px] text-amber-600 font-medium pt-1 border-t border-slate-200">
                              <span>Mão de Obra</span>
                              <span>R$ {sale.labor_value.toFixed(2)}</span>
                            </div>
                          )}
                          {sale.service_description && (
                            <div className="mt-2 p-2 bg-white rounded-lg border border-slate-100 italic text-[10px] text-slate-500">
                              {sale.service_description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
            setCustomerForm({ name: '', cpf: '', cnpj: '', whatsapp: '', address: '', neighborhood: '', city: '', zip_code: '', credit_limit: 0, fine_rate: 2, interest_rate: 1 });
          }}
          title={editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.name}
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input
                  type="text" required placeholder="000.000.000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.cpf}
                  onChange={e => setCustomerForm({ ...customerForm, cpf: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ (Opcional)</label>
                <input
                  type="text" placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.cnpj}
                  onChange={e => setCustomerForm({ ...customerForm, cnpj: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                <input
                  type="text" required placeholder="5511999999999"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.whatsapp}
                  onChange={e => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Limite de Crédito (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-rose-600"
                  value={customerForm.credit_limit}
                  onChange={e => setCustomerForm({ ...customerForm, credit_limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                <input
                  type="text" required placeholder="00000-000"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.zip_code}
                  onChange={e => setCustomerForm({ ...customerForm, zip_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.city}
                  onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.neighborhood}
                  onChange={e => setCustomerForm({ ...customerForm, neighborhood: e.target.value })}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={customerForm.address}
                  onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Multa por Atraso (%)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
                  value={customerForm.fine_rate}
                  onChange={e => setCustomerForm({ ...customerForm, fine_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Juros Mensais (%)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
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
            setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '' });
          }}
          title={editingProduct ? "Editar Produto" : "Adicionar Produto ao Estoque"}
        >
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Produto</label>
              <input
                type="text" required placeholder="Ex: Pneu Traseiro 90/90-18"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                value={productForm.description}
                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código Interno</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.sku}
                  onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras (EAN)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.barcode}
                  onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.unit}
                  onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                >
                  <option value="Unitário">Unitário</option>
                  <option value="Par">Par</option>
                  <option value="Kit">Kit</option>
                  <option value="Litro">Litro</option>
                  <option value="Conjunto">Conjunto</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Ex: Unitário, Par, Kit</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Inicial</label>
                <input
                  type="number" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.stock}
                  onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Compra (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.purchase_price}
                  onChange={e => setProductForm({ ...productForm, purchase_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={productForm.sale_price}
                  onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={productForm.image_url}
                  onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden aspect-video mt-6">
                {productForm.image_url ? (
                  <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
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
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                value={motorcycleForm.model}
                onChange={e => setMotorcycleForm({ ...motorcycleForm, model: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                <input
                  type="text" required placeholder="ABC-1234"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  value={motorcycleForm.plate}
                  onChange={e => setMotorcycleForm({ ...motorcycleForm, plate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual</label>
                <input
                  type="number" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
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
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          title="Novo Lead de Venda"
        >
          <form onSubmit={handleAddLead} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
              <input
                type="text" required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={leadForm.name}
                onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Frota</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={leadForm.company}
                onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={leadForm.value}
                  onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={leadForm.priority}
                  onChange={e => setLeadForm({ ...leadForm, priority: e.target.value })}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text" required placeholder="Ex: 11999999999"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={leadForm.phone}
                onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
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
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                  value={pdvForm.customer_id}
                  onChange={e => setPdvForm({ ...pdvForm, customer_id: e.target.value })}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {pdvForm.customer_id && (
                  <div className="mt-2 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crédito Disponível:</span>
                    <span className={`text-xs font-bold ${getCustomerRemainingCredit(parseInt(pdvForm.customer_id)) > 0 ? 'text-rose-600' : 'text-rose-600'}`}>
                      R$ {getCustomerRemainingCredit(parseInt(pdvForm.customer_id)).toFixed(2)}
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
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                    value={pdvSearchProduct}
                    onChange={e => setPdvSearchProduct(e.target.value)}
                  />
                </div>
                {pdvSearchProduct && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {products.filter(p => p.description.toLowerCase().includes(pdvSearchProduct.toLowerCase())).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddPdvItem(p)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-none"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.description}</p>
                          <p className="text-[10px] text-slate-500">Estoque: {p.stock} {p.unit}</p>
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
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handlePdvItemQuantityChange(idx, parseInt(e.target.value) || 1)}
                          className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded-md text-center text-slate-900"
                        />
                        x
                        <input
                          type="number"
                          step="0.01"
                          value={item.price.toFixed(2)}
                          onChange={e => handlePdvItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 px-1 py-0.5 bg-white border border-slate-200 rounded-md text-center text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemovePdvItem(item.product_id)}
                        className="p-1 text-rose-400 hover:text-rose-600"
                      >
                        <MinusCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Pix', 'Cartão', 'Dinheiro', 'Fiado'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPdvForm({ ...pdvForm, payment_method: method as any, due_date: method === 'Fiado' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : pdvForm.due_date })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${pdvForm.payment_method === method
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

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

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Total da Venda</span>
                  <span className="text-2xl font-black text-slate-900">
                    R$ {pdvForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCompleteSale}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!selectedCustomerForPrint}
          onClose={() => setSelectedCustomerForPrint(null)}
          title={selectedCustomerForPrint?.type === 'A4' ? "Relatório de Histórico (A4)" : "Recibo de Histórico (80mm)"}
          maxWidth={selectedCustomerForPrint?.type === 'A4' ? "max-w-6xl" : "max-w-lg"}
        >
          {selectedCustomerForPrint && (
            <div className={`bg-white p-8 rounded-2xl border border-slate-200 ${selectedCustomerForPrint.type === 'A4' ? 'print-landscape' : 'font-mono text-[10px] max-w-[300px] mx-auto'}`}>
              <div className={`text-center border-b-2 border-slate-900 pb-4 mb-4 ${selectedCustomerForPrint.type === '80mm' ? 'border-dashed' : ''}`}>
                <h3 className={`${selectedCustomerForPrint.type === 'A4' ? 'text-2xl' : 'text-sm'} font-black text-slate-900 uppercase`}>Histórico de Movimentação</h3>
                <p className="text-slate-500 font-bold">KOMBAT MOTO PEÇAS</p>
                <div className={`flex ${selectedCustomerForPrint.type === 'A4' ? 'justify-center gap-8' : 'flex-col items-center'} mt-2 text-[10px]`}>
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
                        <tr key={sale.id} className="border-b border-slate-100 text-[10px]">
                          <td className="py-2 px-1 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2 px-1">
                            <span className={`font-bold ${sale.type === 'Oficina' ? 'text-amber-600' : 'text-indigo-600'}`}>
                              {sale.type === 'Oficina' ? 'O.S.' : 'BALCÃO'}
                            </span>
                          </td>
                          <td className="py-2 px-1 font-mono">{sale.id}</td>
                          <td className="py-2 px-1">
                            <div className="max-w-md truncate">
                              {sale.items.map((item, idx) => (
                                <span key={idx} className="text-slate-500">
                                  {item.quantity}x {item.description}{idx < sale.items.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                              {sale.labor_value > 0 && <span className="text-amber-600 font-bold"> + Mão de Obra</span>}
                              {sale.service_description && (
                                <p className="text-[8px] text-slate-400 mt-0.5 italic">Obs: {sale.service_description}</p>
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
                    <div key={sale.id} className="border-b border-dashed border-slate-200 pb-2">
                      <div className="flex justify-between font-bold">
                        <span>{new Date(sale.date).toLocaleDateString('pt-BR')} - {sale.id}</span>
                        <span>R$ {sale.total.toFixed(2)}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 italic">
                        {sale.type === 'Oficina' ? 'Ordem de Serviço' : 'Venda Balcão'}
                      </p>
                      {sale.service_description && (
                        <p className="text-[8px] text-slate-400 italic mt-1 border-l border-slate-200 pl-2">
                          {sale.service_description}
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

              <div className={`mt-6 pt-4 border-t border-dashed border-slate-300 ${selectedCustomerForPrint.type === 'A4' ? 'grid grid-cols-2 gap-8' : 'space-y-4'} text-center no-print`}>
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
        >
          {selectedSaleForReceipt && (
            <div id="receipt-content" className="bg-white p-2 text-[13px] leading-tight text-black w-[80mm] mx-auto overflow-visible print:p-0 font-bold" style={{ fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif' }}>
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
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontWeight: 'bold' }}>
                  <thead>
                    <tr style={{ fontWeight: '900', borderBottom: '1.5px solid black' }}>
                      <th style={{ textAlign: 'left', width: '20%' }}>Código</th>
                      <th style={{ textAlign: 'left', width: '80%' }}>Item</th>
                    </tr>
                    <tr style={{ fontWeight: '900', borderBottom: '1.5px solid black' }}>
                      <th style={{ textAlign: 'left' }}>Quant.</th>
                      <th style={{ textAlign: 'left' }}>Preço Unit.</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSaleForReceipt.items || []).map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr>
                          <td style={{ paddingTop: '4px' }}>{item.product_id || '---'}</td>
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

                {(selectedSaleForReceipt.labor_value || 0) > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '4px', borderTop: '1px dotted black' }}>
                    <table style={{ width: '100%', fontSize: '10px', fontWeight: 'bold' }}>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'left' }}>MÃO DE OBRA / SERVIÇOS</td>
                          <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.labor_value || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>

              {/* Totals Section */}
              <table style={{ width: '100%', fontSize: '13px', fontWeight: '900' }}>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Subtotal:</td>
                    <td style={{ textAlign: 'right' }}>R$ {(selectedSaleForReceipt.total || 0).toFixed(2)}</td>
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
                  <tr style={{ fontWeight: '900', fontSize: '14px' }}>
                    <td style={{ textAlign: 'left' }}>TOTAL PAGO:</td>
                    <td style={{ textAlign: 'right' }}>R$ {selectedSaleForReceipt.payment_status === 'Pago' ? (selectedSaleForReceipt.total || 0).toFixed(2) : '0,00'}</td>
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={fixedServiceForm.name}
                  onChange={e => setFixedServiceForm({ ...fixedServiceForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repasse (R$)</label>
                <input
                  type="number" required step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={fixedServiceForm.payout}
                  onChange={e => setFixedServiceForm({ ...fixedServiceForm, payout: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all">
              Adicionar à Tabela
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6">
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.customer_id}
                  onChange={e => setOsForm({ ...osForm, customer_id: e.target.value, motorcycle_id: '' })}
                >
                  <option value="">Selecione o Cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
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
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                      value={osForm.km}
                      onChange={e => setOsForm({ ...osForm, km: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Peça / Produto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar no estoque..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={osSearchProduct}
                    onChange={e => setOsSearchProduct(e.target.value)}
                  />
                </div>
                {osSearchProduct && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {products.filter(p => p.description.toLowerCase().includes(osSearchProduct.toLowerCase())).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddOsItem(p)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-none"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.description}</p>
                          <p className="text-[10px] text-slate-500">Estoque: {p.stock} {p.unit}</p>
                        </div>
                        <span className="text-sm font-bold text-rose-600">R$ {p.sale_price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Serviço / Problema</label>
                <textarea
                  placeholder="Descreva o que será feito ou o problema relatado pelo cliente..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[100px] resize-none"
                  value={osForm.service_description}
                  onChange={e => setOsForm({ ...osForm, service_description: e.target.value })}
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {osForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.description}</p>
                      <p className="text-xs text-slate-500">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveOsItem(item.product_id)}
                        className="p-1 text-rose-400 hover:text-rose-600"
                      >
                        <MinusCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Mão de Obra (R$)</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.labor_value}
                  onChange={e => setOsForm({ ...osForm, labor_value: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mecânico Responsável</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.mechanic_id}
                  onChange={e => setOsForm({ ...osForm, mechanic_id: e.target.value })}
                >
                  <option value="">Selecione o Mecânico</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {osForm.mechanic_id && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Serviço Fixo (Tabela de Repasses)</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
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
                    {fixedServices.map(fs => (
                      <option key={fs.id} value={fs.id}>{fs.name} (Repasse: R$ {fs.payout.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              )}

              {(osForm.selected_fixed_services || []).length > 0 && (
                <div className="space-y-2">
                  <p className="block text-sm font-medium text-slate-700 mb-1">Serviços Fixos Selecionados:</p>
                  {osForm.selected_fixed_services.map((sfs, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{sfs.name}</p>
                        <p className="text-xs text-slate-500">{sfs.quantity}x Repasse: R$ {sfs.payout.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">Total Repasse: R$ {(sfs.payout * sfs.quantity).toFixed(2)}</span>
                        <button
                          onClick={() => setOsForm({
                            ...osForm,
                            selected_fixed_services: osForm.selected_fixed_services.filter(item => item.id !== sfs.id)
                          })}
                          className="p-1 text-rose-400 hover:text-rose-600"
                        >
                          <MinusCircle size={18} />
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
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'
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
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'
                        }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Total da O.S.</span>
                  <span className="text-2xl font-black text-slate-900">
                    R$ {(osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + parseFloat(osForm.labor_value || '0')).toFixed(2)}
                  </span>
                </div>
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
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4">Serviços Detalhados</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {sales.filter(s => s.mechanic_id === selectedMechanicForReport.id && s.type === 'Oficina').map(sale => (
                    <div key={sale.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-slate-800">O.S. #{sale.id} - {sale.customer_name}</p>
                        <span className="text-sm font-bold text-rose-600">R$ {sale.commission.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleString()}</p>
                      <div className="mt-2 text-xs text-slate-600">
                        {sale.items.length > 0 && (
                          <p>Peças/Produtos: {sale.items.map(item => `${item.description} (${item.quantity}x)`).join(', ')}</p>
                        )}
                        {sale.labor_value > 0 && (
                          <p>Mão de Obra: R$ {sale.labor_value.toFixed(2)}</p>
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
                        {selectedSaleForOS.items.map((item, index) => (
                          <tr key={`item-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border p-2 text-center">{item.quantity}</td>
                            <td className="border p-2">{item.description}</td>
                            <td className="border p-2 text-right">R$ {item.price.toFixed(2)}</td>
                            <td className="border p-2 text-right">R$ {(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))}
                        {selectedSaleForOS.labor_value > 0 && (
                          <tr className={(selectedSaleForOS.items.length) % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border p-2 text-center">1</td>
                            <td className="border p-2">Mão de Obra / Serviços Gerais</td>
                            <td className="border p-2 text-right">R$ {selectedSaleForOS.labor_value.toFixed(2)}</td>
                            <td className="border p-2 text-right">R$ {selectedSaleForOS.labor_value.toFixed(2)}</td>
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
                        <span>R$ {selectedSaleForOS.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50">
                        <span className="font-bold">Total Serviços:</span>
                        <span>R$ {selectedSaleForOS.labor_value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-200 text-base rounded-b-md">
                        <span className="font-bold">VALOR TOTAL GERAL:</span>
                        <span className="font-bold">R$ {selectedSaleForOS.total.toFixed(2)}</span>
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
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Catálogo Virtual"
        maxWidth="max-w-[98%]"
      >
        <VirtualCatalogModal products={products} />
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
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              value={cashForm.openingBalance}
              onChange={e => setCashForm({ ...cashForm, openingBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
            <textarea
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none min-h-[80px] resize-none"
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
              className={`py-3 rounded-xl font-bold border transition-all ${transactionForm.type === 'Suprimento' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200'}`}
            >
              Suprimento (+)
            </button>
            <button
              type="button"
              onClick={() => setTransactionForm({ ...transactionForm, type: 'Sangria' })}
              className={`py-3 rounded-xl font-bold border transition-all ${transactionForm.type === 'Sangria' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200'}`}
            >
              Sangria (-)
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={transactionForm.amount}
              onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Motivo</label>
            <input
              type="text" required placeholder="Ex: Troco inicial, Pagamento fornecedor..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
        onClose={() => setIsMechanicModalOpen(false)}
        title="Cadastrar Novo Mecânico"
      >
        <form onSubmit={handleAddMechanic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Mecânico</label>
            <input
              type="text" required placeholder="Ex: João Silva"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={mechanicForm.name}
              onChange={e => setMechanicForm({ name: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Cadastrar Mecânico
          </button>
        </form>
      </Modal>

      {/* Fixed Service Modal */}
      <Modal
        isOpen={isFixedServiceModalOpen}
        onClose={() => setIsFixedServiceModalOpen(false)}
        title="Adicionar Serviço à Tabela"
      >
        <form onSubmit={handleAddFixedService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
            <input
              type="text" required placeholder="Ex: Troca de Óleo"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={fixedServiceForm.name}
              onChange={e => setFixedServiceForm({ ...fixedServiceForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor de Repasse (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={fixedServiceForm.payout}
              onChange={e => setFixedServiceForm({ ...fixedServiceForm, payout: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Adicionar Serviço
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
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.name}
              onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Referência</label>
            <input
              type="text" required placeholder="Ex: Oficina Central"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.company}
              onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.value}
              onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
            <input
              type="text" required placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={leadForm.phone}
              onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
            <select
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
        onClose={() => setIsDistributorModalOpen(false)}
        title="Cadastrar Novo Distribuidor"
      >
        <form onSubmit={handleAddDistributor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Distribuidor</label>
            <input
              type="text" required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={distributorForm.name}
              onChange={e => setDistributorForm({ ...distributorForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (WhatsApp)</label>
            <input
              type="text" required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={distributorForm.phone}
              onChange={e => setDistributorForm({ ...distributorForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pessoa de Contato (Opcional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={distributorForm.contact_person}
              onChange={e => setDistributorForm({ ...distributorForm, contact_person: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Cadastrar Distribuidor
          </button>
        </form>
      </Modal>

      {/* Purchase Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Novo Pedido de Peças"
        maxWidth="max-w-[95%]"
      >
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Distribuidor</label>
            <select
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
              value={orderForm.distributor_id}
              onChange={e => setOrderForm({ ...orderForm, distributor_id: e.target.value })}
            >
              <option value="">Selecione um distribuidor</option>
              {distributors.map(d => (
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                value={orderSearchProduct}
                onChange={e => setOrderSearchProduct(e.target.value)}
              />
            </div>
            {orderSearchProduct && (
              <div className="absolute z-10 bg-white border border-slate-200 rounded-xl mt-2 w-full max-h-60 overflow-y-auto shadow-lg">
                {products.filter(p =>
                  p.description.toLowerCase().includes(orderSearchProduct.toLowerCase()) ||
                  p.sku.toLowerCase().includes(orderSearchProduct.toLowerCase())
                ).map(product => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => handleAddOrderItem(product)}
                    className="flex items-center justify-between w-full p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
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
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
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
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-sm"
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <p className="text-lg font-bold text-slate-900">Total de Itens:</p>
                <p className="text-lg font-bold text-rose-600">{orderForm.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">
            Criar Pedido
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isManagementReportModalOpen}
        onClose={() => {
          setIsManagementReportModalOpen(false);
          setSelectedReport(null);
        }}
        title="Visualizar Relatório Gerencial"
        maxWidth="max-w-6xl"
      >
        <div className="bg-white">
          {renderManagementReportContent()}
        </div>
      </Modal>
    </div>
  );
}
