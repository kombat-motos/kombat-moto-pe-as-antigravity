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
  Bell,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BillingAutomationBox from './components/BillingAutomationBox';
import GestaoFinanceira from './components/GestaoFinanceira';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- Types ---
interface Customer {
  id: number;
  name: string;
  cpf: string;
  whatsapp: string;
  address: string;
  neighborhood: string;
  zip_code: string;
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
}

interface Stats {
  revenue: number;
  openServiceOrders: number;
  topProducts: { description: string; total_sold: number }[];
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
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

const Modal = ({ isOpen, onClose, title, children }: any) => (
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
          className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryView, setInventoryView] = useState<'list' | 'grid'>('list');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Alertas Financeiros
  const [alertasFinanceiros, setAlertasFinanceiros] = useState<any[]>([]);
  const [showAlertaPopup, setShowAlertaPopup] = useState(false);
  const [showNotificacoes, setShowNotificacoes] = useState(false);

  const fetchAlertas = async () => {
    try {
      const res = await fetch('/api/contas-pagar');
      const data = await res.json();
      const pendentes = data.filter((c: any) => c.status !== 'pago');
      setAlertasFinanceiros(pendentes);
      
      const hasProximos = pendentes.some((c: any) => {
        const diff = Math.ceil((new Date(c.data_vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return diff <= 2 && diff >= 0;
      });
      if (hasProximos) setShowAlertaPopup(true);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form States
  const [customerForm, setCustomerForm] = useState({ name: '', cpf: '', whatsapp: '', address: '', neighborhood: '', zip_code: '' });
  const [productForm, setProductForm] = useState({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '' });
  const [motorcycleForm, setMotorcycleForm] = useState({ customer_id: '', plate: '', model: '', current_km: '' });

  const [leads, setLeads] = useState<Lead[]>([
    { id: '1', name: 'João Silva', company: 'Logística Express', value: 1500, priority: 'Alta', status: 'Prospecção', phone: '11999999999' },
    { id: '2', name: 'Maria Oliveira', company: 'Moto Táxi Central', value: 2800, priority: 'Média', status: 'Qualificação', phone: '11888888888' },
    { id: '3', name: 'Pedro Santos', company: 'Oficina do Pedro', value: 450, priority: 'Baixa', status: 'Proposta', phone: '11777777777' },
  ]);
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
  }>({
    customer_id: '',
    motorcycle_id: '',
    items: [],
    selected_fixed_services: [],
    labor_value: '0',
    mechanic_id: '',
    payment_method: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado',
    status: 'Aberto' as 'Aberto' | 'Em Andamento' | 'Pronto' | 'Entregue',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [pdvSearchProduct, setPdvSearchProduct] = useState('');
  const [osSearchProduct, setOsSearchProduct] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForOS, setSelectedSaleForOS] = useState<Sale | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([
    { id: '1', name: 'João' },
    { id: '2', name: 'Marcos' }
  ]);
  const [fixedServices, setFixedServices] = useState<FixedService[]>([
    { id: '1', name: 'Troca de Pneu', payout: 10 },
    { id: '2', name: 'Troca de Kit Relação', payout: 10 },
    { id: '3', name: 'Remendo de Pneu', payout: 10 }
  ]);
  const [isMechanicModalOpen, setIsMechanicModalOpen] = useState(false);
  const [mechanicForm, setMechanicForm] = useState({ name: '' });
  const [isFixedServiceModalOpen, setIsFixedServiceModalOpen] = useState(false);
  const [fixedServiceForm, setFixedServiceForm] = useState({ name: '', payout: '' });
  const [isMechanicReportModalOpen, setIsMechanicReportModalOpen] = useState(false);
  const [selectedMechanicForReport, setSelectedMechanicForReport] = useState<Mechanic | null>(null);
  const [isFiadoModalOpen, setIsFiadoModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateDueDate = (saleId: string, newDate: string) => {
    setSales(sales.map(s => s.id === saleId ? { ...s, due_date: new Date(newDate).toISOString() } : s));
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      name: leadForm.name,
      company: leadForm.company,
      value: parseFloat(leadForm.value) || 0,
      priority: leadForm.priority as any,
      status: 'Prospecção',
      phone: leadForm.phone
    };
    setLeads([...leads, newLead]);
    setIsLeadModalOpen(false);
    setLeadForm({ name: '', company: '', value: '', priority: 'Média', phone: '' });
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
    const customer = customers.find(c => c.id === parseInt(pdvForm.customer_id));

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
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
      due_date: pdvForm.payment_method === 'Fiado' ? new Date(pdvForm.due_date).toISOString() : undefined,
      paid_date: pdvForm.payment_method !== 'Fiado' ? new Date().toISOString() : undefined
    };

    // Update stock
    for (const item of pdvForm.items) {
      if (item.product_id) {
        setProducts(products.map(p => 
          p.id === item.product_id ? { ...p, stock: p.stock - item.quantity } : p
        ));
      }
    }

    setSales([newSale, ...sales]);
    setIsPdvModalOpen(false);
    setSelectedSaleForReceipt(newSale);
    setPdvForm({
      customer_id: '',
      items: [],
      payment_method: 'Pix'
    });
    fetchData();
    alert(`Venda ${newSale.id} concluída com sucesso!`);
  };

  const handleCompleteOS = async () => {
    if (osForm.items.length === 0 && parseFloat(osForm.labor_value) === 0) {
      alert("Adicione pelo menos um item ou valor de mão de obra.");
      return;
    }

    const totalItems = osForm.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const laborValue = parseFloat(osForm.labor_value);
    const total = totalItems + laborValue;
    const customer = customers.find(c => c.id === parseInt(osForm.customer_id));
    const motorcycle = motorcycles.find(m => m.id === parseInt(osForm.motorcycle_id));
    const mechanic = mechanics.find(m => m.id === osForm.mechanic_id);

    // Calculate Commission
    let commission = 0;
    if (mechanic) {
      // Calculate commission from selected fixed services
      (osForm.selected_fixed_services || []).forEach(sfs => {
        commission += sfs.payout * sfs.quantity;
      });

      // Additionally, apply 50% commission on labor_value if present
      if (laborValue > 0) {
        commission += laborValue * 0.5;
      }
    }

    const newOS: Sale = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
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
      date: new Date().toISOString(),
      moto_details: motorcycle ? `${motorcycle.model} (${motorcycle.plate})` : 'Moto não informada',
      payment_status: osForm.payment_method === 'Fiado' ? 'Pendente' : 'Pago',
      due_date: osForm.payment_method === 'Fiado' ? new Date(osForm.due_date).toISOString() : undefined,
      paid_date: osForm.payment_method !== 'Fiado' ? new Date().toISOString() : undefined
    };

    // Update stock
    for (const item of osForm.items) {
      if (item.product_id) {
        setProducts(products.map(p => 
          p.id === item.product_id ? { ...p, stock: p.stock - item.quantity } : p
        ));
      }
    }

    setSales([newOS, ...sales]);
    setIsOsModalOpen(false);
    setSelectedSaleForOS(newOS);
    setOsForm({
      customer_id: '',
      motorcycle_id: '',
      items: [],
      labor_value: '0',
      mechanic_id: '',
      payment_method: 'Pix',
      status: 'Aberto'
    });
    fetchData();
    alert(`Ordem de Serviço ${newOS.id} criada com sucesso!`);
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
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
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
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
            >
              <PlusCircle size={24} />
              Nova Venda / O.S.
            </button>
          </div>

          {/* Recent Sales List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Últimas Movimentações</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {sales.map(sale => (
                  <div key={sale.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${
                          sale.type === 'Oficina' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                          {sale.type === 'Oficina' ? 'ORDEM DE SERVIÇO' : 'VENDA BALCÃO'}
                        </span>
                        <h4 className="font-bold text-slate-900">{sale.customer_name}</h4>
                        <p className="text-xs text-slate-500">ID: {sale.id} • {new Date(sale.date).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">R$ {sale.total.toFixed(2)}</p>
                        <p className="text-xs text-emerald-600 font-medium">{sale.payment_method}</p>
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
                          <div className="px-2 py-1 bg-emerald-50 rounded text-[10px] text-emerald-700">
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
                    <button 
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="mt-3 text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Printer size={10} /> Ver Recibo Térmico
                    </button>
                    {sale.type === 'Oficina' && (
                      <button 
                        onClick={() => setSelectedSaleForOS(sale)}
                        className="mt-3 ml-4 text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <Printer size={10} /> Imprimir O.S.
                      </button>
                    )}
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
    const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
              onClick={() => setIsLeadModalOpen(true)}
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lead.priority === 'Alta' ? 'bg-rose-100 text-rose-600' :
                        lead.priority === 'Média' ? 'bg-amber-100 text-amber-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {lead.priority}
                      </span>
                      <div className="flex gap-1">
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
          <button 
            onClick={() => setIsOsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all font-bold shadow-lg shadow-amber-100"
          >
            <PlusCircle size={20} />
            Nova O.S.
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {osSales.map(os => (
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
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase">Lucro Loja</p>
                  <p className="font-bold text-emerald-700">R$ {(os.total - os.commission).toFixed(2)}</p>
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
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
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
                    onClick={() => setMechanics(mechanics.filter(mech => mech.id !== m.id))}
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
                  <span className="font-bold text-emerald-600">R$ {fs.payout.toFixed(2)}</span>
                  <button 
                    onClick={() => setFixedServices(fixedServices.filter(s => s.id !== fs.id))}
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

  const fetchData = () => {
    setLoading(true);
    // Simulate fetching data
    setStats({
      revenue: 12540.50,
      openServiceOrders: 8,
      topProducts: [
        { description: 'Pneu Traseiro 90/90-18', total_sold: 45 },
        { description: 'Óleo Mobil 20W50', total_sold: 112 },
        { description: 'Kit Relação CG 160', total_sold: 32 },
        { description: 'Vela de Ignição', total_sold: 89 },
        { description: 'Lona de Freio', total_sold: 76 },
      ]
    });
    setCustomers([
      { id: 1, name: 'Thiago Farias', cpf: '123.456.789-00', whatsapp: '5543999999999', address: 'Rua Principal, 123', neighborhood: 'Centro', zip_code: '86360-000' },
      { id: 2, name: 'José Almeida', cpf: '987.654.321-00', whatsapp: '5543988888888', address: 'Av. Brasil, 456', neighborhood: 'Vila Nova', zip_code: '86360-000' },
    ]);
    setMotorcycles([
      { id: 1, customer_id: 1, customer_name: 'Thiago Farias', plate: 'ABC-1234', model: 'Honda CG 160', current_km: 15000 },
      { id: 2, customer_id: 2, customer_name: 'José Almeida', plate: 'XYZ-5678', model: 'Yamaha Fazer 250', current_km: 22000 },
    ]);
    setProducts([
      { id: 1, description: 'Pneu Traseiro 90/90-18', sku: 'PN-909018', barcode: '7890123456789', purchase_price: 80, sale_price: 120, stock: 15, unit: 'Unitário' },
      { id: 2, description: 'Óleo Mobil 20W50', sku: 'OL-MOB2050', barcode: '7890123456790', purchase_price: 25, sale_price: 40, stock: 50, unit: 'Litro' },
    ]);
    setLoading(false);
  };

  const handleWhatsApp = (item: any) => {
    const message = `Olá ${item.customer_name}, aqui é da Kombat Moto Peças. Sua ${item.model || 'moto'} (Placa ${item.plate || ''}) está com a revisão de ${item.current_km || 0} km próxima. Vamos agendar?`;
    window.open(`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const maxId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) : 0;
    const newCustomer = { 
      id: maxId + 1, 
      ...customerForm 
    };
    setCustomers([...customers, newCustomer]);
    setIsCustomerModalOpen(false);
    setCustomerForm({ name: '', cpf: '', whatsapp: '', address: '', neighborhood: '', zip_code: '' });
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { 
        ...p, 
        ...productForm, 
        purchase_price: parseFloat(productForm.purchase_price) || 0,
        sale_price: parseFloat(productForm.sale_price) || 0,
        stock: parseInt(productForm.stock) || 0
      } : p));
    } else {
      const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
      const newProduct = {
        id: maxId + 1,
        ...productForm,
        purchase_price: parseFloat(productForm.purchase_price) || 0,
        sale_price: parseFloat(productForm.sale_price) || 0,
        stock: parseInt(productForm.stock) || 0
      };
      setProducts([...products, newProduct]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário', image_url: '' });
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
      image_url: product.image_url || ''
    });
    setIsProductModalOpen(true);
  };

  const handleProductImageUpload = (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProducts(products.map(p => p.id === productId ? { ...p, image_url: reader.result as string } : p));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageUrl = (productId: number) => {
    const url = prompt("Insira a URL da imagem do produto:");
    if (url) {
      setProducts(products.map(p => p.id === productId ? { ...p, image_url: url } : p));
    }
  };

  const handleAddMotorcycle = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === parseInt(motorcycleForm.customer_id));
    if (!customer) return;

    const maxId = motorcycles.length > 0 ? Math.max(...motorcycles.map(m => m.id)) : 0;
    const newMotorcycle = {
      id: maxId + 1,
      customer_id: parseInt(motorcycleForm.customer_id),
      customer_name: customer.name,
      plate: motorcycleForm.plate,
      model: motorcycleForm.model,
      current_km: parseInt(motorcycleForm.current_km) || 0
    };
    setMotorcycles([...motorcycles, newMotorcycle]);
    setIsMotorcycleModalOpen(false);
    setMotorcycleForm({ customer_id: '', plate: '', model: '', current_km: '' });
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(products.filter(p => p.id !== id));
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
          color="bg-emerald-500"
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
          title="Giro de Estoque" 
          value={products.length} 
          icon={Package} 
          color="bg-indigo-500"
          subtitle="Produtos cadastrados"
        />
        <StatCard 
          title="Fiado Pendente" 
          value={`R$ ${sales.filter(s => s.payment_status === 'Pendente').reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}`} 
          icon={Wallet} 
          color="bg-rose-500"
          subtitle="Vendas a receber"
          onClick={() => setIsFiadoModalOpen(true)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
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
                <span className="text-sm font-bold text-emerald-600">{p.total_sold} vendidos</span>
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
            {motorcycles.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
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
                    className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
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
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium cursor-pointer">
            <Package size={18} />
            Importar Clientes
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportCustomers} />
          </label>
          <button 
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
          >
            <Plus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{c.name}</h4>
                <p className="text-sm text-slate-500">CPF: {c.cpf || 'Não informado'}</p>
                <p className="text-sm text-slate-500">Celular: {c.whatsapp}</p>
              </div>
              <button 
                onClick={() => {
                  setMotorcycleForm({ ...motorcycleForm, customer_id: c.id.toString() });
                  setIsMotorcycleModalOpen(true);
                }}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Adicionar Moto"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Motos Cadastradas</p>
              <div className="space-y-2">
                {motorcycles.filter(m => m.customer_id === c.id).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                    <span className="font-medium text-slate-700">{m.model}</span>
                    <span className="text-slate-400 font-mono">{m.plate}</span>
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
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setInventoryView('list')}
              className={`p-2 rounded-lg transition-all ${inventoryView === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setInventoryView('grid')}
              className={`p-2 rounded-lg transition-all ${inventoryView === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
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
              {products.map((p) => (
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
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      p.stock < 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.stock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex items-center bg-slate-50 rounded-lg p-1 mr-2">
                        <label className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded transition-all cursor-pointer" title="Upload de Foto">
                          <Upload size={14} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(p.id, e)} />
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
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
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
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.description} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <ImageIcon size={64} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-emerald-600 cursor-pointer transition-all">
                    <Upload size={16} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(p.id, e)} />
                  </label>
                  <button 
                    onClick={() => handleProductImageUrl(p.id)}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-blue-600 transition-all"
                  >
                    <Link size={16} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    p.stock < 5 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
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
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Bike size={24} />
          </div>
          <h1 className="font-bold text-xl text-slate-900 leading-tight">Kombat<br/><span className="text-emerald-600">Moto Peças</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Clientes" 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')} 
          />
          <SidebarItem 
            icon={Package} 
            label="Estoque" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarItem 
            icon={Target} 
            label="CRM / Vendas" 
            active={activeTab === 'crm'} 
            onClick={() => setActiveTab('crm')} 
          />
          <SidebarItem 
            icon={ShoppingCart} 
            label="PDV / Caixa" 
            active={activeTab === 'pdv'} 
            onClick={() => setActiveTab('pdv')} 
          />
          <SidebarItem 
            icon={Bike} 
            label="Ordens de Serviço" 
            active={activeTab === 'os'} 
            onClick={() => setActiveTab('os')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Mecânicos" 
            active={activeTab === 'mechanics'} 
            onClick={() => setActiveTab('mechanics')} 
          />
          <SidebarItem 
            icon={Wallet} 
            label="Gestão Financeira" 
            active={activeTab === 'financeiro'} 
            onClick={() => setActiveTab('financeiro')} 
          />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Suporte</p>
          <button className="w-full flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors">
            <MessageCircle size={16} />
            Ajuda do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Bem-vindo de volta!'}
              {activeTab === 'customers' && 'Gestão de Clientes'}
              {activeTab === 'inventory' && 'Controle de Estoque'}
              {activeTab === 'crm' && 'CRM de Vendas'}
              {activeTab === 'pdv' && 'Frente de Caixa (PDV)'}
              {activeTab === 'os' && 'Ordens de Serviço'}
              {activeTab === 'mechanics' && 'Gestão de Mecânicos'}
              {activeTab === 'financeiro' && 'Gestão Financeira'}
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
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-64"
              />
            </div>
            
            {/* Bell Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotificacoes(!showNotificacoes)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-full relative">
                <Bell size={20} />
                {alertasFinanceiros.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {alertasFinanceiros.length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotificacoes && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Notificações</h3>
                      <button onClick={() => setShowNotificacoes(false)}><X size={16}/></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {alertasFinanceiros.length === 0 ? (
                        <p className="p-4 text-center text-slate-500 text-sm">Sem notificações.</p>
                      ) : (
                        alertasFinanceiros.map(alerta => {
                          const diff = Math.ceil((new Date(alerta.data_vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                          let color = 'bg-slate-100 text-slate-600';
                          let label = 'Em breve';
                          if (diff < 0) { color = 'bg-slate-800 text-white'; label = 'Vencido'; }
                          else if (diff === 0) { color = 'bg-rose-500 text-white animate-pulse'; label = 'Vence hoje'; }
                          else if (diff === 1) { color = 'bg-orange-500 text-white'; label = 'Vence amanhã'; }
                          else if (diff <= 2) { color = 'bg-amber-400 text-slate-900'; label = `Vence em ${diff} dias`; }
                          
                          return (
                            <div key={alerta.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => { setActiveTab('financeiro'); setShowNotificacoes(false); }}>
                              <p className="font-bold text-sm line-clamp-1">{alerta.descricao}</p>
                              <div className="flex justify-between items-center mt-2">
                                <p className="font-bold text-rose-600 text-sm">R$ {alerta.valor.toFixed(2)}</p>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${color}`}>{label}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'crm' && renderCRM()}
                {activeTab === 'pdv' && renderPDV()}
                {activeTab === 'os' && renderOS()}
                {activeTab === 'mechanics' && renderMechanics()}
                {activeTab === 'financeiro' && <GestaoFinanceira />}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Alerta Inicial de Boletos Vencendo */}
        <AnimatePresence>
          {showAlertaPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAlertaPopup(false)}></div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border-t-8 border-rose-500">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Atenção!</h3>
                <p className="text-slate-600 mb-6">Existem boletos próximos do vencimento ou vencidos. Deseja verificá-los agora?</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setShowAlertaPopup(false); setActiveTab('financeiro'); }} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors">
                    Ver Boletos
                  </button>
                  <button onClick={() => setShowAlertaPopup(false)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <Modal 
          isOpen={isCustomerModalOpen} 
          onClose={() => setIsCustomerModalOpen(false)} 
          title="Cadastrar Novo Cliente"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={customerForm.name}
                onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input 
                  type="text" required placeholder="000.000.000-00"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={customerForm.cpf}
                  onChange={e => setCustomerForm({...customerForm, cpf: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                <input 
                  type="text" required placeholder="5511999999999"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={customerForm.whatsapp}
                  onChange={e => setCustomerForm({...customerForm, whatsapp: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={customerForm.neighborhood}
                onChange={e => setCustomerForm({...customerForm, neighborhood: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
              <input 
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={customerForm.address}
                onChange={e => setCustomerForm({...customerForm, address: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
              Salvar Cliente
            </button>
          </form>
        </Modal>

        <Modal 
          isOpen={isProductModalOpen} 
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
            setProductForm({ description: '', sku: '', barcode: '', purchase_price: '', sale_price: '', stock: '', unit: 'Unitário' });
          }} 
          title={editingProduct ? "Editar Produto" : "Adicionar Produto ao Estoque"}
        >
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Produto</label>
              <input 
                type="text" required placeholder="Ex: Pneu Traseiro 90/90-18"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={productForm.description}
                onChange={e => setProductForm({...productForm, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código Interno</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={productForm.sku}
                  onChange={e => setProductForm({...productForm, sku: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras (EAN)</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={productForm.barcode}
                  onChange={e => setProductForm({...productForm, barcode: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={productForm.unit}
                  onChange={e => setProductForm({...productForm, unit: e.target.value})}
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={productForm.stock}
                  onChange={e => setProductForm({...productForm, stock: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Compra (R$)</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={productForm.purchase_price}
                  onChange={e => setProductForm({...productForm, purchase_price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda (R$)</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={productForm.sale_price}
                  onChange={e => setProductForm({...productForm, sale_price: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={productForm.image_url}
                  onChange={e => setProductForm({...productForm, image_url: e.target.value})}
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
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
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
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={motorcycleForm.model}
                onChange={e => setMotorcycleForm({...motorcycleForm, model: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                <input 
                  type="text" required placeholder="ABC-1234"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={motorcycleForm.plate}
                  onChange={e => setMotorcycleForm({...motorcycleForm, plate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual</label>
                <input 
                  type="number" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  value={motorcycleForm.current_km}
                  onChange={e => setMotorcycleForm({...motorcycleForm, current_km: e.target.value})}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
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
                onChange={e => setLeadForm({...leadForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Frota</label>
              <input 
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={leadForm.company}
                onChange={e => setLeadForm({...leadForm, company: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={leadForm.value}
                  onChange={e => setLeadForm({...leadForm, value: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={leadForm.priority}
                  onChange={e => setLeadForm({...leadForm, priority: e.target.value})}
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
                onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
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
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
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
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={pdvForm.customer_id}
                  onChange={e => setPdvForm({...pdvForm, customer_id: e.target.value})}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Peça / Produto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar no estoque..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
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
                        <span className="text-sm font-bold text-emerald-600">R$ {p.sale_price.toFixed(2)}</span>
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
                      <p className="text-xs text-slate-500">{item.quantity}x R$ {item.price.toFixed(2)}</p>
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
                      onClick={() => setPdvForm({...pdvForm, payment_method: method as any})}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        pdvForm.payment_method === method 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {pdvForm.payment_method === 'Fiado' && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <label className="block text-sm font-bold text-emerald-700 mb-1">Data de Vencimento</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={pdvForm.due_date}
                    onChange={e => setPdvForm({...pdvForm, due_date: e.target.value})}
                  />
                  <p className="text-[10px] text-emerald-600 mt-1 italic">* Multas e juros automáticos após 30 dias de atraso.</p>
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
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <Modal 
          isOpen={!!selectedSaleForReceipt} 
          onClose={() => setSelectedSaleForReceipt(null)} 
          title="Recibo de Venda"
        >
          {selectedSaleForReceipt && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-sm">
              <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                <h4 className="font-bold text-lg">KOMBAT MOTO PEÇAS</h4>
                <p className="text-xs">Andirá - PR</p>
                <p className="text-xs">Data: {new Date(selectedSaleForReceipt.date).toLocaleString()}</p>
                <p className="text-xs">ID: {selectedSaleForReceipt.id}</p>
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-xs font-bold">CLIENTE: {selectedSaleForReceipt.customer_name}</p>
                {selectedSaleForReceipt.moto_details && <p className="text-xs">MOTO: {selectedSaleForReceipt.moto_details}</p>}
                <p className="text-xs">TIPO: {selectedSaleForReceipt.type}</p>
              </div>

              <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span>DESCRIÇÃO</span>
                  <span>QTD x VALOR</span>
                </div>
                {selectedSaleForReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[150px]">{item.description}</span>
                    <span>{item.quantity} x {item.price.toFixed(2)}</span>
                  </div>
                ))}
                {selectedSaleForReceipt.labor_value > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>MÃO DE OBRA / SERVIÇOS</span>
                    <span>{selectedSaleForReceipt.labor_value.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-right space-y-1">
                <p className="text-lg font-black">TOTAL: R$ {selectedSaleForReceipt.total.toFixed(2)}</p>
                <p className="text-xs font-bold">PAGAMENTO: {selectedSaleForReceipt.payment_method}</p>
                {selectedSaleForReceipt.type === 'Oficina' && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[10px] text-slate-500 italic">
                    <p>Mecânico: {selectedSaleForReceipt.mechanic_name}</p>
                    <p>Comissão: R$ {selectedSaleForReceipt.commission.toFixed(2)}</p>
                    <p>Líquido Loja: R$ {(selectedSaleForReceipt.total - selectedSaleForReceipt.commission).toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-[10px]">
                <p>Obrigado pela preferência!</p>
                <p>Kombat Moto - A força da sua moto.</p>
              </div>

              <button 
                onClick={() => window.print()}
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
                  <span className="font-bold text-emerald-600">R$ {fs.payout.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        <Modal 
          isOpen={isOsModalOpen} 
          onClose={() => {
            setIsOsModalOpen(false);
            setOsForm({
              customer_id: '',
              motorcycle_id: '',
              items: [],
              selected_fixed_services: [],
              labor_value: '0',
              mechanic_id: '',
              payment_method: 'Pix',
              status: 'Aberto'
            });
            setOsSearchProduct('');
          }} 
          title="Nova Ordem de Serviço"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.customer_id}
                  onChange={e => setOsForm({...osForm, customer_id: e.target.value, motorcycle_id: ''})}
                >
                  <option value="">Selecione o Cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {osForm.customer_id && ( 
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moto do Cliente</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={osForm.motorcycle_id}
                    onChange={e => setOsForm({...osForm, motorcycle_id: e.target.value})}
                  >
                    <option value="">Selecione a Moto</option>
                    {motorcycles.filter(m => m.customer_id === parseInt(osForm.customer_id)).map(m => <option key={m.id} value={m.id}>{m.model} ({m.plate})</option>)}
                  </select>
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
                        <span className="text-sm font-bold text-emerald-600">R$ {p.sale_price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                  onChange={e => setOsForm({...osForm, labor_value: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mecânico Responsável</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                  value={osForm.mechanic_id}
                  onChange={e => setOsForm({...osForm, mechanic_id: e.target.value})}
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
                      onClick={() => setOsForm({...osForm, payment_method: method as any})}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        osForm.payment_method === method 
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
                    onChange={e => setOsForm({...osForm, due_date: e.target.value})}
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
                      onClick={() => setOsForm({...osForm, status: statusOption as any})}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        osForm.status === statusOption 
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
                  Finalizar O.S.
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
                        <span className="text-sm font-bold text-emerald-600">R$ {sale.commission.toFixed(2)}</span>
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
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
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
                      <p className="font-mono text-xl text-emerald-600">Nº {selectedSaleForOS.id}</p>
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
                        <td className="border p-2"><span className="font-bold">Moto/Modelo:</span> {selectedSaleForOS.moto_details}</td>
                        <td className="border p-2"><span className="font-bold">Placa:</span> {motorcycles.find(m => m.id === selectedSaleForOS.motorcycle_id)?.plate || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><span className="font-bold">KM:</span> {motorcycles.find(m => m.id === selectedSaleForOS.motorcycle_id)?.current_km || 'N/A'}</td>
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
                        <td className="border p-2 w-1/2">[ ] Espelhos</td>
                        <td className="border p-2 w-1/2">[ ] Setas</td>
                      </tr>
                      <tr>
                        <td className="border p-2">[ ] Riscos</td>
                        <td className="border p-2">[ ] Amassados</td>
                      </tr>
                      <tr>
                        <td className="border p-2" colSpan={2}>[ ] Nível de Combustível: ____</td>
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
    </div>
  );
}
