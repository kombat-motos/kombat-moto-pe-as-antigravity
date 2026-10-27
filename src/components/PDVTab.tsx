import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Barcode,
  History,
  Tag,
  Package,
  PlusCircle,
  User,
  Wrench,
  CreditCard,
  Percent,
  CheckCircle2,
  Layers,
  ArrowRight,
  X,
  ChevronRight,
  ChevronLeft,
  Banknote,
  Handshake,
  Calendar,
  ArrowLeftRight,
  MoreHorizontal,
  Printer,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Coins,
  QrCode,
  Edit2,
  Sun,
  Moon,
  LogOut,
  FileText,
  DollarSign,
  Settings,
  AlertCircle,
  Check
} from 'lucide-react';
import { searchSmartProducts } from '../utils/smartSearch';
import { calculateBillingDueDate, formatBillingDueDateBR } from '../utils/billingDate';

export interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
  type?: 'Peça' | 'Serviço' | 'Serviço Principal' | 'Adicional Interno';
  image_url?: string;
  sku?: string;
}

export interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  sale_price_credit?: number;
  sale_price_wholesale?: number;
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

export interface Customer {
  id: number;
  name: string;
  nickname?: string;
  cpf: string;
  cnpj?: string;
  whatsapp: string;
  address: string;
  neighborhood?: string;
  city?: string;
  credit_limit?: number;
  billing_day?: number;
  credit_block_reason?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  commission_rate: number;
  active: boolean;
}

export interface Sale {
  id: string;
  customer_id?: number;
  customer_name: string;
  items: SaleItem[];
  sale_items?: SaleItem[];
  labor_value: number;
  mechanic_id?: string;
  mechanic_name?: string;
  commission: number;
  total: number;
  payment_method: string;
  type: 'Balcão' | 'Oficina';
  date: string;
  payment_status: 'Pago' | 'Pendente';
  due_date?: string;
  paid_date?: string;
  charge_type?: 'vista' | 'credito_30_dias' | 'atacado' | 'fiado';
}

export interface PDVTabProps {
  pdvState: {
    form: {
      customer_id: string;
      mechanic_id: string;
      items: SaleItem[];
      payment_method: string;
      due_date: string;
      sale_condition: 'Vista' | 'Prazo';
      installments: number;
      discount: number;
      surcharge?: number;
      charge_type?: 'vista' | 'credito_30_dias' | 'atacado' | 'fiado';
    };
    searchProduct: string;
    selectedCategory: string;
  };
  pdvActions: {
    onAddProduct: (product: Product) => void;
    onRemoveItem: (productId?: number) => void;
    onQuantityChange: (index: number, newQuantity: number) => void;
    onPriceChange: (index: number, newPrice: number) => void;
    onChangeChargeType: (type: 'vista' | 'credito_30_dias' | 'atacado' | 'fiado') => void;
    onSearchChange: (val: string) => void;
    onSelectCategory: (category: string) => void;
    onOpenHistory: () => void;
    onOpenCheckout?: () => void;
    onDiscountChange: (discount: number) => void;
    onSurchargeChange?: (surcharge: number) => void;
    onCustomerChange: (customerId: string) => void;
    onMechanicChange: (mechanicId: string) => void;
    onAddCustomItem: (description: string) => void;
    onClearCart?: () => void;
    onFinalizeSale?: (saleData?: any) => Promise<void> | void;
    onCancelSale?: () => void;
    onPaymentMethodChange?: (method: string) => void;
    onInstallmentsChange?: (installments: number) => void;
    onDueDateChange?: (date: string) => void;
    onOpenCustomerModal?: () => void;
    onOpenOsModal?: () => void;
    onOpenQuotesTab?: () => void;
    onNavigateTab?: (tab: string) => void;
    onLogout?: () => void;
  };
  data: {
    products: Product[];
    sortedProducts: Product[];
    customers: Customer[];
    sortedCustomers: Customer[];
    mechanics: Mechanic[];
    todaySales: Sale[];
    totalToday: number;
    currentUser?: any;
    cardFeesSettings?: Record<number, number>;
    companyLogo?: string | null;
  };
  helpers: {
    formatBRL: (val: any) => string;
    getCustomerRemainingCredit: (customerId: number) => number;
    isCustomerReallyBlocked?: (c: any) => boolean;
    localApi?: any;
  };
}

const PDVTabComponent: React.FC<PDVTabProps> = ({
  pdvState,
  pdvActions,
  data,
  helpers,
}) => {
  const { form, searchProduct, selectedCategory } = pdvState;
  const {
    onAddProduct,
    onRemoveItem,
    onQuantityChange,
    onPriceChange,
    onChangeChargeType,
    onSearchChange,
    onSelectCategory,
    onOpenHistory,
    onOpenCheckout,
    onDiscountChange,
    onSurchargeChange,
    onCustomerChange,
    onMechanicChange,
    onAddCustomItem,
    onClearCart,
    onFinalizeSale,
    onCancelSale,
    onPaymentMethodChange,
    onInstallmentsChange,
    onDueDateChange,
    onOpenCustomerModal,
    onOpenOsModal,
    onOpenQuotesTab,
    onNavigateTab,
    onLogout,
  } = pdvActions;

  const {
    sortedProducts,
    customers,
    sortedCustomers,
    mechanics,
    todaySales,
    totalToday,
    currentUser,
    cardFeesSettings = { 1: 0, 2: 3.5, 3: 4.5, 4: 5.5, 5: 6.5, 6: 7.5, 10: 10.5, 12: 12.5 },
    companyLogo,
  } = data;

  const { formatBRL, getCustomerRemainingCredit, isCustomerReallyBlocked, localApi } = helpers;

  // Relógio em tempo real no rodapé
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentDateTime(`${day}/${month}/${year} ${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Alternância de tema escuro / claro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || !saved;
    }
    return true;
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Campo de pesquisa com debounce
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(searchProduct);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setLocalSearch(searchProduct);
  }, [searchProduct]);

  const handleSearchInputChange = (val: string) => {
    setLocalSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 180);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      onSearchChange(localSearch);
    }
  };

  // Foco automático no campo de busca ao montar a tela
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Modalidade de preço ativa: À VISTA | 30 DIAS | ATACADO | FIADO
  const activeChargeType = form.charge_type || 'vista';

  // Categorias extraídas do banco de dados com valores padrão da referência
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('TODAS');
    cats.add('OUTROS');
    cats.add('PEÇAS DE SUSPENSÃO');
    cats.add('PEÇAS ELÉTRICAS');
    cats.add('PNEUS E RELAÇÃO');
    cats.add('EQUIPAMENTOS (CAPACETES/LUVAS)');
    cats.add('PEÇAS DE FREIO');
    cats.add('ACESSÓRIOS');

    sortedProducts.forEach(p => {
      if (p.category && p.category.trim() !== '') {
        cats.add(p.category.trim().toUpperCase());
      }
    });
    return Array.from(cats);
  }, [sortedProducts]);

  // Rolagem suave das categorias com setas
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      categoriesScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Produtos filtrados por busca e categoria
  const filteredProducts = useMemo(() => {
    let result: Product[] = sortedProducts;

    const query = (searchProduct || '').trim();
    if (query) {
      if (query.length >= 2) {
        const smartResults = searchSmartProducts(sortedProducts as any, query, { limit: 120 });
        let matched = smartResults.map((r: any) => r.item as Product);

        // Fallback robusto e insensível a acentos caso smartSearch não pontue
        if (matched.length === 0) {
          const qNorm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const qWords = qNorm.split(/\s+/).filter(Boolean);
          matched = sortedProducts.filter(p => {
            const fullText = `${p.description || ''} ${p.brand || ''} ${p.sku || ''} ${p.barcode || ''} ${p.application || ''} ${p.category || ''}`
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            return qWords.every(word => fullText.includes(word));
          });
        }
        result = matched;
      } else {
        const qLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        result = sortedProducts.filter(p => {
          const desc = (p.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const sku = (p.sku || '').toLowerCase();
          const bar = (p.barcode || '');
          return desc.includes(qLower) || sku.includes(qLower) || bar.includes(qLower);
        });
      }
    }

    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'TODAS') {
      result = result.filter(
        p => (p.category || '').trim().toUpperCase() === selectedCategory.trim().toUpperCase()
      );
    }

    return result;
  }, [sortedProducts, searchProduct, selectedCategory]);

  // Limite de exibição para máxima fluidez visual
  const [displayLimit, setDisplayLimit] = useState(60);

  useEffect(() => {
    setDisplayLimit(60);
  }, [searchProduct, selectedCategory]);

  const visibleFilteredProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  // Preço de exibição conforme modalidade comercial selecionada
  const getDisplayPrice = useCallback((product: Product): number => {
    if (activeChargeType === 'credito_30_dias' && product.sale_price_credit) {
      return product.sale_price_credit;
    }
    if (activeChargeType === 'atacado' && product.sale_price_wholesale) {
      return product.sale_price_wholesale;
    }
    if (activeChargeType === 'fiado' && product.sale_price_credit) {
      return product.sale_price_credit;
    }
    return product.sale_price;
  }, [activeChargeType]);

  // Cálculos financeiros do carrinho
  const cartItemCount = useMemo(() => {
    return form.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  }, [form.items]);

  const cartBaseTotal = useMemo(() => {
    return form.items.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.quantity || 1)), 0);
  }, [form.items]);

  const currentDiscount = form.discount || 0;
  const currentSurcharge = form.surcharge || 0;

  // Cliente selecionado
  const selectedCustomer = useMemo(() => {
    if (!form.customer_id) return null;
    return customers.find(c => String(c.id) === String(form.customer_id)) || null;
  }, [form.customer_id, customers]);

  // Mecânico / Vendedor selecionado
  const selectedMechanic = useMemo(() => {
    if (!form.mechanic_id) return null;
    return mechanics.find(m => String(m.id) === String(form.mechanic_id)) || null;
  }, [form.mechanic_id, mechanics]);

  // Parcelamento e taxas de cartão
  const activeInstallments = form.installments || 1;
  const cartGrandTotal = useMemo(() => {
    const subtotalWithAdjustments = Math.max(0, cartBaseTotal - currentDiscount + currentSurcharge);
    if ((form.payment_method === 'Cartão Crédito' || (form.payment_method === 'Cartão' && form.sale_condition === 'Prazo')) && activeInstallments > 1) {
      const fee = cardFeesSettings[activeInstallments] || 0;
      const divisor = 1 - (fee / 100);
      return divisor > 0 ? (subtotalWithAdjustments / divisor) : subtotalWithAdjustments;
    }
    return subtotalWithAdjustments;
  }, [cartBaseTotal, currentDiscount, currentSurcharge, form.payment_method, form.sale_condition, activeInstallments, cardFeesSettings]);

  // Valor recebido e troco calculado na mesma tela
  const [paymentReceivedInput, setPaymentReceivedInput] = useState<string>('');

  useEffect(() => {
    if (!paymentReceivedInput || parseFloat(paymentReceivedInput.replace(',', '.')) === 0) {
      setPaymentReceivedInput(cartGrandTotal > 0 ? cartGrandTotal.toFixed(2) : '');
    }
  }, [cartGrandTotal]);

  const numericReceived = useMemo(() => {
    if (!paymentReceivedInput) return cartGrandTotal;
    const clean = parseFloat(paymentReceivedInput.toString().replace(',', '.'));
    return isNaN(clean) ? cartGrandTotal : clean;
  }, [paymentReceivedInput, cartGrandTotal]);

  const calculatedChange = useMemo(() => {
    if (form.payment_method === 'Dinheiro') {
      return Math.max(0, numericReceived - cartGrandTotal);
    }
    return 0;
  }, [form.payment_method, numericReceived, cartGrandTotal]);

  // Cálculo automático do vencimento do Fiado (usando dia fixo billing_day)
  const fiadoCalculatedDueDate = useMemo(() => {
    return calculateBillingDueDate(new Date(), selectedCustomer?.billing_day);
  }, [selectedCustomer?.billing_day]);

  // Total de itens vendidos hoje
  const totalItemsSoldToday = useMemo(() => {
    return todaySales.reduce((acc, s) => {
      const items = s.items || s.sale_items || [];
      return acc + items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }, 0);
  }, [todaySales]);

  // 8 Formas de Pagamento dispostas em 2 linhas x 4 colunas (idêntico à referência)
  const paymentMethods = [
    // Linha 1
    {
      id: 'Pix',
      name: 'PIX',
      shortcut: 'F1',
      bgClass: 'bg-[#10B981] hover:bg-[#059669]',
      borderClass: 'border-[#34D399]',
      icon: <QrCode size={18} className="stroke-[2.2]" />
    },
    {
      id: 'Dinheiro',
      name: 'DINHEIRO',
      shortcut: 'F2',
      bgClass: 'bg-[#0D9488] hover:bg-[#0F766E]',
      borderClass: 'border-[#2DD4BF]',
      icon: <Banknote size={18} className="stroke-[2.2]" />
    },
    {
      id: 'Cartão Débito',
      name: 'CARTÃO DÉBITO',
      shortcut: 'F3',
      bgClass: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
      borderClass: 'border-[#60A5FA]',
      icon: <CreditCard size={18} className="stroke-[2.2]" />
    },
    {
      id: 'Cartão Crédito',
      name: 'CARTÃO CRÉDITO',
      shortcut: 'F4',
      bgClass: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
      borderClass: 'border-[#A78BFA]',
      icon: <CreditCard size={18} className="stroke-[2.2]" />
    },
    // Linha 2
    {
      id: 'Fiado',
      name: 'FIADO',
      shortcut: 'F5',
      bgClass: 'bg-[#D97706] hover:bg-[#B45309]',
      borderClass: 'border-[#FBBF24]',
      icon: <Handshake size={18} className="stroke-[2.2]" />
    },
    {
      id: 'Crediário',
      name: 'CREDIÁRIO',
      shortcut: 'F6',
      bgClass: 'bg-[#EA580C] hover:bg-[#C2410C]',
      borderClass: 'border-[#FB923C]',
      icon: <Calendar size={18} className="stroke-[2.2]" />
    },
    {
      id: 'Transferência',
      name: 'TRANSFERÊNCIA',
      shortcut: 'F7',
      bgClass: 'bg-[#0284C7] hover:bg-[#0369A1]',
      borderClass: 'border-[#38BDF8]',
      icon: <ArrowLeftRight size={18} className="stroke-[2.2]" />
    },
    {
      id: 'Outras Formas',
      name: 'OUTRAS FORMAS',
      shortcut: 'F8',
      bgClass: 'bg-[#334155] hover:bg-[#1E293B]',
      borderClass: 'border-[#64748B]',
      icon: <MoreHorizontal size={18} className="stroke-[2.2]" />
    },
  ];

  const handleSelectPaymentMethod = (methodId: string) => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(methodId);
    }
    if (methodId === 'Fiado') {
      if (onDueDateChange) {
        onDueDateChange(fiadoCalculatedDueDate);
      }
    }
  };

  // Atalhos do Teclado (F1..F8, ESC, ENTER)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.key === 'F1') {
        e.preventDefault();
        handleSelectPaymentMethod('Pix');
      } else if (e.key === 'F2' && !e.shiftKey) {
        e.preventDefault();
        handleSelectPaymentMethod('Dinheiro');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleSelectPaymentMethod('Cartão Débito');
      } else if (e.key === 'F4' && !e.shiftKey) {
        e.preventDefault();
        handleSelectPaymentMethod('Cartão Crédito');
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleSelectPaymentMethod('Fiado');
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleSelectPaymentMethod('Crediário');
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleSelectPaymentMethod('Transferência');
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleSelectPaymentMethod('Outras Formas');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isCustomerModalOpen) setIsCustomerModalOpen(false);
        else if (isMechanicModalOpen) setIsMechanicModalOpen(false);
        else if (isDiscountModalOpen) setIsDiscountModalOpen(false);
        else if (isSurchargeModalOpen) setIsSurchargeModalOpen(false);
        else if (isSangriaModalOpen) setIsSangriaModalOpen(false);
        else if (onCancelSale) onCancelSale();
      } else if (e.key === 'Enter' && !isInputFocused) {
        e.preventDefault();
        handleFinalizeSaleClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomerReallyBlocked, selectedCustomer, form, cartGrandTotal, fiadoCalculatedDueDate]);

  // Estados dos modais auxiliares rápidos
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custModalSearch, setCustModalSearch] = useState('');
  const [isMechanicModalOpen, setIsMechanicModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountInputVal, setDiscountInputVal] = useState('');
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [surchargeInputVal, setSurchargeInputVal] = useState('');

  // Modal de Sangria / Suprimento
  const [isSangriaModalOpen, setIsSangriaModalOpen] = useState(false);
  const [sangriaForm, setSangriaForm] = useState({
    type: 'Sangria' as 'Sangria' | 'Suprimento',
    amount: '',
    description: ''
  });
  const [sangriaSubmitting, setSangriaSubmitting] = useState(false);

  const handleSangriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(sangriaForm.amount.replace(',', '.'));
    if (!amt || amt <= 0) {
      alert('Informe um valor válido.');
      return;
    }
    if (!sangriaForm.description.trim()) {
      alert('Informe o motivo ou descrição da movimentação.');
      return;
    }

    try {
      setSangriaSubmitting(true);
      if (localApi) {
        await localApi.post('cash_transactions', {
          type: sangriaForm.type,
          amount: amt,
          description: sangriaForm.description.trim(),
          date: new Date().toISOString()
        });
      }
      alert(`${sangriaForm.type} de ${formatBRL(amt)} registrada com sucesso!`);
      setIsSangriaModalOpen(false);
      setSangriaForm({ type: 'Sangria', amount: '', description: '' });
    } catch (err: any) {
      console.error('Erro na movimentação:', err);
      alert(err?.message || 'Erro ao registrar movimentação.');
    } finally {
      setSangriaSubmitting(false);
    }
  };

  // Finalização da Venda na mesma tela
  const [isFinalizing, setIsFinalizing] = useState(false);
  const handleFinalizeSaleClick = async () => {
    if (form.items.length === 0) {
      alert('Adicione pelo menos um item ao carrinho para finalizar a venda.');
      return;
    }

    // Validações rigorosas para venda Fiado
    if (form.payment_method === 'Fiado') {
      if (!form.customer_id) {
        alert('Selecione um cliente cadastrado para realizar uma venda fiada.');
        setIsCustomerModalOpen(true);
        return;
      }
      if (isCustomerReallyBlocked && selectedCustomer && isCustomerReallyBlocked(selectedCustomer)) {
        alert(`CRÉDITO BLOQUEADO\n\nEste cliente está com o crédito bloqueado.\nMotivo: ${selectedCustomer.credit_block_reason || 'Débito superior a 30 dias de atraso.'}`);
        return;
      }
      if (selectedCustomer && selectedCustomer.credit_limit) {
        const remaining = getCustomerRemainingCredit(selectedCustomer.id);
        if (cartGrandTotal > remaining) {
          const proceed = window.confirm(`Limite de crédito excedido!\nLimite Disponível: ${formatBRL(remaining)}\nEsta Venda: ${formatBRL(cartGrandTotal)}\n\nDeseja continuar mesmo assim?`);
          if (!proceed) return;
        }
      }
    }

    try {
      setIsFinalizing(true);
      if (onFinalizeSale) {
        await onFinalizeSale();
      } else if (onOpenCheckout) {
        onOpenCheckout();
      }
    } catch (err: any) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao finalizar venda: ' + (err.message || 'Verifique os dados e tente novamente.'));
    } finally {
      setIsFinalizing(false);
    }
  };

  // Clientes filtrados para o modal de busca
  const filteredCustomersModal = useMemo(() => {
    const q = custModalSearch.trim().toLowerCase();
    if (!q) return sortedCustomers.slice(0, 30);
    return sortedCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.cpf || '').includes(q) ||
      (c.nickname || '').toLowerCase().includes(q) ||
      (c.whatsapp || '').includes(q)
    ).slice(0, 40);
  }, [sortedCustomers, custModalSearch]);

  return (
    <div className="flex flex-col h-screen max-h-screen w-full bg-[#080D1A] text-slate-100 overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO SUPERIOR (KOMBAT MOTO PEÇAS + NAVEGAÇÃO + OPERADOR) */}
      {/* ========================================================================= */}
      <header className="h-14 bg-[#0B1324] border-b border-[#1E293B] px-4 flex items-center justify-between shrink-0 z-20 shadow-md">
        {/* Lado Esquerdo: Logotipo Oficial Kombat + Menu Horizontal */}
        <div className="flex items-center gap-6">
          {/* Logo Kombat com marca estilizada */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigateTab && onNavigateTab('pdv')}>
            {companyLogo ? (
              <img src={companyLogo} alt="Kombat Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF1A53] to-[#BE123C] flex items-center justify-center shadow-lg shadow-rose-900/40">
                <span className="text-white font-black text-lg italic tracking-tighter">K</span>
              </div>
            )}
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black uppercase tracking-wider text-white">
                Kombat <span className="text-[#FF1A53]">Moto Peças</span>
              </span>
              <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                Peças e Acessórios para sua Moto
              </span>
            </div>
          </div>

          {/* Menu Horizontal de Módulos */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide bg-[#FF1A53]/15 text-white border border-[#FF1A53]/50 flex items-center gap-2 shadow-sm transition-all"
            >
              <ShoppingCart size={14} className="text-[#FF1A53]" />
              PDV
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('orders')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-850/60 transition-all flex items-center gap-2"
            >
              <ShoppingCart size={14} />
              Vendas
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('customers')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-850/60 transition-all flex items-center gap-2"
            >
              <User size={14} />
              Clientes
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('inventory')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-850/60 transition-all flex items-center gap-2"
            >
              <Layers size={14} />
              Estoque
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('financial')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-850/60 transition-all flex items-center gap-2"
            >
              <DollarSign size={14} />
              Financeiro
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dashboard')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-850/60 transition-all flex items-center gap-2"
            >
              <Coins size={14} />
              Relatórios
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('settings')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-850/60 transition-all flex items-center gap-2"
            >
              <Settings size={14} />
              Configurações
            </button>
          </nav>
        </div>

        {/* Lado Direito: Alternância de Tema + Operador + Botão Sair */}
        <div className="flex items-center gap-3.5">
          {/* Alternância de Tema (Sol / Lua) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 bg-[#111C30] border border-[#22324D] rounded-full p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Alternar Modo Escuro / Claro"
          >
            <span className={`p-1 rounded-full ${!isDarkMode ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>
              <Sun size={13} />
            </span>
            <span className={`p-1 rounded-full ${isDarkMode ? 'bg-[#FF1A53] text-white' : 'text-slate-400'}`}>
              <Moon size={13} />
            </span>
          </button>

          {/* Operador Logado */}
          <div className="flex items-center gap-2.5 bg-[#111C30] border border-[#22324D] px-3 py-1 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <User size={14} />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-white">
                Operador: <span className="font-mono text-slate-300">{currentUser?.name || 'admin'}</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                Frente de Caixa
              </span>
            </div>
          </div>

          {/* Botão Sair */}
          <button
            type="button"
            onClick={onLogout}
            className="h-8 px-3 bg-[#111C30] hover:bg-red-950/40 border border-[#22324D] hover:border-red-700/60 text-slate-300 hover:text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL: DIVISÃO 63% ESQUERDA / 37% DIREITA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ======================================================================= */}
        {/* ÁREA ESQUERDA (63% DA LARGURA): BUSCA, PREÇO, CATEGORIAS E CATÁLOGO */}
        {/* ======================================================================= */}
        <section className="w-full lg:w-[63%] flex flex-col border-r border-[#1E293B] bg-[#0A0F1D] p-3.5 space-y-3 overflow-hidden">
          {/* Linha Superior: Barra de Pesquisa Ampla + Botões de Modalidades */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
            {/* Barra de Pesquisa Principal */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar produto, código, SKU, marca ou código de barras..."
                value={localSearch}
                onChange={e => handleSearchInputChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0E1726] border border-[#1F2E47] rounded-xl focus:border-[#FF1A53] focus:ring-1 focus:ring-[#FF1A53]/30 outline-none text-xs sm:text-sm text-slate-100 font-bold placeholder-slate-500 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400" title="Código de Barras">
                <Barcode size={18} />
              </div>
            </div>

            {/* Modalidades Comerciais: À VISTA | 30 DIAS | ATACADO | FIADO */}
            <div className="flex items-center gap-1 bg-[#0E1726] border border-[#1F2E47] p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => onChangeChargeType('vista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeChargeType === 'vista'
                    ? 'bg-[#FF1A53] text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                À VISTA
              </button>
              <button
                type="button"
                onClick={() => onChangeChargeType('credito_30_dias')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeChargeType === 'credito_30_dias'
                    ? 'bg-[#FF1A53] text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30 DIAS
              </button>
              <button
                type="button"
                onClick={() => onChangeChargeType('atacado')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeChargeType === 'atacado'
                    ? 'bg-[#FF1A53] text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ATACADO
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeChargeType('fiado');
                  handleSelectPaymentMethod('Fiado');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeChargeType === 'fiado'
                    ? 'bg-[#FF1A53] text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FIADO
              </button>
            </div>
          </div>

          {/* Barra de Categorias com Navegação Horizontal */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            <div
              ref={categoriesScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map(cat => {
                const isSelected = (selectedCategory === 'all' && cat === 'TODAS') || selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onSelectCategory(cat === 'TODAS' ? 'all' : cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF1A53] border-[#FF1A53] text-white shadow-md shadow-rose-950/40'
                        : 'bg-[#0E1726] border-[#1F2E47] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Seta para Rolagem das Categorias */}
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="p-1.5 bg-[#0E1726] hover:bg-[#1F2E47] text-slate-400 hover:text-white rounded-lg border border-[#1F2E47] shrink-0 transition-colors cursor-pointer"
              title="Mais categorias"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Catálogo de Produtos com Fotografias Reais (4 Colunas no Desktop) */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredProducts.length === 0 ? (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-slate-500 p-8 border border-dashed border-[#1E293B] rounded-2xl bg-[#0E1726]/40">
                <Package size={46} className="text-slate-700 mb-2 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-300">Nenhum produto encontrado</p>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Verifique a digitação ou altere o filtro de categoria selecionado.
                </p>
                {searchProduct && (
                  <button
                    type="button"
                    onClick={() => onAddCustomItem(searchProduct.toUpperCase())}
                    className="mt-4 px-4 py-2 bg-[#FF1A53]/15 text-[#FF1A53] hover:bg-[#FF1A53]/25 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-[#FF1A53]/40 cursor-pointer shadow-sm"
                  >
                    <PlusCircle size={15} /> Adicionar "{searchProduct}" como item avulso
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2">
                {visibleFilteredProducts.map(product => {
                  const displayPrice = getDisplayPrice(product);
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => onAddProduct(product)}
                      className="group relative flex flex-col bg-[#0E1726] border border-[#1F2E47] hover:border-[#FF1A53]/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-lg hover:shadow-rose-950/20 active:scale-[0.985]"
                    >
                      {/* Topo do Cartão: Marca e Estoque */}
                      <div className="p-2 pb-1 flex items-center justify-between gap-1 z-10">
                        {/* Etiqueta da Marca */}
                        <span className="px-2 py-0.5 bg-[#080D1A] border border-[#1F2E47] text-[8.5px] font-black text-rose-400 uppercase rounded tracking-wider truncate max-w-[55%]">
                          {product.brand || 'KOMBAT'}
                        </span>

                        {/* Indicador de Estoque */}
                        <span
                          className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded border shadow-sm ${
                            isOutOfStock
                              ? 'bg-red-950/80 border-red-800 text-red-400'
                              : 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'SEM ESTOQUE' : `ESTOQUE: ${product.stock}`}
                        </span>
                      </div>

                      {/* Fotografia Real Centralizada */}
                      <div className="h-28 w-full px-3 py-1 flex items-center justify-center overflow-hidden bg-[#0A0F1D]/50">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.description}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-md"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 group-hover:text-rose-400/80 transition-colors">
                            <Package size={32} className="stroke-[1.5]" />
                          </div>
                        )}
                      </div>

                      {/* Detalhes do Produto: Nome, SKU, Preço e Botão [+] */}
                      <div className="p-2.5 pt-1.5 flex flex-col justify-between flex-1 space-y-1.5 bg-[#0E1726]">
                        <div>
                          <h3
                            className="font-bold text-xs text-white line-clamp-2 leading-tight group-hover:text-[#FF1A53] transition-colors"
                            title={product.description}
                          >
                            {product.description}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            SKU: {product.sku || '---'}
                          </p>
                        </div>

                        {/* Linha de Preço e Botão Adicionar */}
                        <div className="pt-1.5 border-t border-[#1F2E47] flex items-center justify-between">
                          <span className="text-sm font-black text-[#FF1A53] font-mono tracking-tight">
                            {formatBRL(displayPrice)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddProduct(product);
                            }}
                            className="w-7 h-7 bg-[#FF1A53] hover:bg-[#E11D48] text-white rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-md shadow-rose-950/40 cursor-pointer"
                            title="Adicionar ao carrinho"
                          >
                            <Plus size={16} className="stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {displayLimit < filteredProducts.length && (
                  <div className="col-span-full py-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDisplayLimit(prev => Math.min(prev + 60, filteredProducts.length))}
                      className="px-4 py-2 bg-[#0E1726] hover:bg-[#1F2E47] text-slate-300 hover:text-white border border-[#1F2E47] rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Carregar mais produtos ({visibleFilteredProducts.length} de {filteredProducts.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* ÁREA DIREITA (37% DA LARGURA): VENDA ATUAL, CARRINHO, PAGAMENTO E AÇÕES */}
        {/* ======================================================================= */}
        <section className="w-full lg:w-[37%] flex flex-col bg-[#0B1324] overflow-hidden">
          {/* Cabeçalho da Venda: VENDA ATUAL, Contagem e Limpar */}
          <div className="p-3 border-b border-[#1E293B] bg-[#0E1726] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-[#FF1A53]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                VENDA ATUAL
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-[#080D1A] px-2.5 py-0.5 rounded-full border border-[#1F2E47]">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (form.items.length > 0) {
                    if (onClearCart) onClearCart();
                    else if (onCancelSale) onCancelSale();
                  }
                }}
                disabled={form.items.length === 0}
                className="px-2.5 py-1 bg-red-950/50 hover:bg-red-900/60 disabled:opacity-40 text-red-300 border border-red-800/60 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                title="Limpar Carrinho"
              >
                <Trash2 size={11} />
                Limpar
              </button>
            </div>
          </div>

          {/* Cards de Cliente e Mecânico / Vendedor Lado a Lado */}
          <div className="p-2.5 border-b border-[#1E293B] bg-[#0A0F1D] grid grid-cols-2 gap-2 shrink-0">
            {/* Bloco Cliente */}
            <div
              onClick={() => setIsCustomerModalOpen(true)}
              className="bg-[#0E1726] border border-[#1F2E47] hover:border-slate-600 p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[8.5px] uppercase font-black text-slate-400 block leading-none">
                    Cliente
                  </span>
                  <p className="text-xs font-bold text-white truncate mt-0.5">
                    {selectedCustomer ? selectedCustomer.name : 'Consumidor Final'}
                  </p>
                  <span className="text-[9px] text-slate-500 font-mono block leading-none truncate">
                    {selectedCustomer ? (selectedCustomer.cpf || selectedCustomer.whatsapp || 'Cadastrado') : 'CPF não informado'}
                  </span>
                </div>
              </div>
              <div className="p-1 text-slate-400 hover:text-white shrink-0">
                <Search size={13} />
              </div>
            </div>

            {/* Bloco Mecânico / Vendedor */}
            <div
              onClick={() => setIsMechanicModalOpen(true)}
              className="bg-[#0E1726] border border-[#1F2E47] hover:border-slate-600 p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Wrench size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[8.5px] uppercase font-black text-slate-400 block leading-none">
                    Mecânico / Vendedor
                  </span>
                  <p className="text-xs font-bold text-white truncate mt-0.5">
                    {selectedMechanic ? selectedMechanic.name : 'Nenhum (Sem Comissão)'}
                  </p>
                </div>
              </div>
              <div className="p-1 text-slate-400 hover:text-white shrink-0">
                <Search size={13} />
              </div>
            </div>
          </div>

          {/* Carrinho de Compras: Tabela Visual com Rolagem Dedicada */}
          <div className="flex-1 overflow-y-auto px-2.5 py-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent max-h-[170px] xl:max-h-[220px]">
            {form.items.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-slate-500 p-4 border border-dashed border-[#1E293B] rounded-xl bg-[#0E1726]/30">
                <ShoppingCart size={24} className="text-slate-600 mb-1" />
                <p className="text-xs font-bold text-slate-400">Carrinho vazio</p>
                <p className="text-[10px] text-slate-500 text-center">Clique em um produto à esquerda para adicionar.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Cabeçalho da Tabela */}
                <div className="grid grid-cols-12 text-[9px] font-black uppercase text-slate-400 px-2 py-1 tracking-wider border-b border-[#1E293B]">
                  <span className="col-span-5">PRODUTO</span>
                  <span className="col-span-2 text-center">QTD</span>
                  <span className="col-span-3 text-right">VALOR UNIT.</span>
                  <span className="col-span-2 text-right">TOTAL</span>
                </div>

                {/* Itens do Carrinho */}
                {form.items.map((item, idx) => {
                  const productRef = item.product_id ? sortedProducts.find(p => p.id === item.product_id) : null;
                  const itemTotal = (item.price || 0) * (item.quantity || 1);

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center gap-1.5 bg-[#0E1726] border border-[#1F2E47] p-1.5 rounded-xl text-xs hover:border-slate-700 transition-colors"
                    >
                      {/* Miniatura + Nome + SKU */}
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#080D1A] border border-[#1F2E47] flex items-center justify-center overflow-hidden shrink-0">
                          {productRef?.image_url ? (
                            <img src={productRef.image_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Package size={14} className="text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-[11px] truncate leading-tight" title={item.description}>
                            {item.description}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono block leading-none mt-0.5">
                            SKU: {productRef?.sku || '---'}
                          </span>
                        </div>
                      </div>

                      {/* Controle de Quantidade [-] QTD [+] */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center bg-[#080D1A] border border-[#1F2E47] rounded-lg overflow-hidden h-6">
                          <button
                            type="button"
                            onClick={() => onQuantityChange(idx, Math.max(1, (item.quantity || 1) - 1))}
                            className="px-1.5 h-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-5 text-center text-xs font-mono font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onQuantityChange(idx, (item.quantity || 1) + 1)}
                            className="px-1.5 h-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Valor Unitário Editável */}
                      <div className="col-span-3 flex items-center justify-end">
                        <div className="flex items-center bg-[#080D1A] border border-[#1F2E47] focus-within:border-[#FF1A53] focus-within:ring-1 focus-within:ring-[#FF1A53]/30 rounded-lg px-1.5 h-6 transition-all shadow-inner">
                          <span className="text-[9px] text-slate-500 mr-0.5 font-mono select-none">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price === 0 ? '' : item.price}
                            placeholder="0,00"
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              onPriceChange(idx, isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            className="w-16 bg-transparent outline-none text-right font-mono font-bold text-xs text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            title="Editar valor unitário"
                          />
                        </div>
                      </div>

                      {/* Total + Botão Excluir */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <span className="font-mono font-black text-xs text-[#FF1A53]">
                          {formatBRL(itemTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product_id)}
                          className="text-slate-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* RESUMO FINANCEIRO (SUBTOTAL, DESCONTO, ACRÉSCIMO E TOTAL GERAL) */}
          {/* ======================================================================= */}
          <div className="p-3 border-t border-[#1E293B] bg-[#0E1726] shrink-0">
            <div className="grid grid-cols-2 items-center gap-4">
              {/* Lado Esquerdo: Subtotal, Desconto e Acréscimo */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Coins size={13} className="text-slate-400" />
                    Subtotal ({cartItemCount} itens)
                  </span>
                  <span className="font-mono font-bold text-white">{formatBRL(cartBaseTotal)}</span>
                </div>

                {/* Desconto F4 */}
                <div className="flex items-center justify-between text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountInputVal(String(currentDiscount || ''));
                      setIsDiscountModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 font-bold hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Percent size={13} className="text-slate-400" />
                    Desconto <span className="text-[9px] bg-slate-800 px-1 py-0.2 rounded border border-slate-700">F4</span>
                    <Edit2 size={11} className="text-slate-500 hover:text-white" />
                  </button>
                  <span className="font-mono font-bold text-emerald-400">
                    - {formatBRL(currentDiscount)}
                  </span>
                </div>

                {/* Acréscimo */}
                <div className="flex items-center justify-between text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setSurchargeInputVal(String(currentSurcharge || ''));
                      setIsSurchargeModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 font-bold hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Plus size={13} className="text-slate-400" />
                    Acréscimo
                    <Edit2 size={11} className="text-slate-500 hover:text-white" />
                  </button>
                  <span className="font-mono font-bold text-amber-400">
                    + {formatBRL(currentSurcharge)}
                  </span>
                </div>
              </div>

              {/* Lado Direito: TOTAL GERAL em Destaque Vermelho Kombat */}
              <div className="flex flex-col items-end justify-center">
                <span className="text-xs uppercase font-black tracking-wider text-slate-300">
                  TOTAL GERAL
                </span>
                <span className="text-3xl font-black text-[#FF1A53] font-mono tracking-tight mt-0.5">
                  {formatBRL(cartGrandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SEÇÃO FIXA DE PAGAMENTO: 8 FORMAS DE PAGAMENTO NA MESMA TELA */}
          {/* ======================================================================= */}
          <div className="p-3 border-t border-[#1E293B] bg-[#0A0F1D] shrink-0 space-y-2.5">
            {/* Título com Círculo $ PAGAMENTO */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#FF1A53] flex items-center justify-center text-white font-black text-xs shadow-md shadow-rose-950/40">
                $
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                PAGAMENTO
              </h3>
            </div>

            {/* Linha Superior de Valores: Valor Recebido e Troco */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Valor Recebido */}
              <div className="bg-[#0E1726] border border-[#1F2E47] px-3 py-1.5 rounded-xl flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Valor recebido</span>
                <div className="flex items-center">
                  <span className="text-xs font-mono font-bold text-slate-500 mr-1">R$</span>
                  <input
                    type="text"
                    value={paymentReceivedInput}
                    onChange={e => setPaymentReceivedInput(e.target.value)}
                    placeholder={cartGrandTotal.toFixed(2)}
                    className="w-24 bg-transparent outline-none text-right font-mono font-black text-sm text-white"
                  />
                </div>
              </div>

              {/* Troco */}
              <div className="bg-[#0E1726] border border-[#1F2E47] px-3 py-1.5 rounded-xl flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Troco</span>
                <span className="font-mono font-black text-sm text-emerald-400">
                  {formatBRL(calculatedChange)}
                </span>
              </div>
            </div>

            {/* Grade de 8 Botões de Pagamento (2 Linhas x 4 Colunas) */}
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map(method => {
                const isSelected = form.payment_method === method.id ||
                  (method.id === 'Cartão Crédito' && form.payment_method === 'Cartão' && form.sale_condition === 'Prazo') ||
                  (method.id === 'Cartão Débito' && form.payment_method === 'Cartão' && form.sale_condition === 'Vista');

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handleSelectPaymentMethod(method.id)}
                    className={`${method.bgClass} ${isSelected ? 'ring-2 ring-white scale-[1.02] shadow-lg' : 'opacity-90 hover:opacity-100'} p-2 rounded-xl text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm relative overflow-hidden`}
                  >
                    <div className="flex items-center gap-1">
                      {method.icon}
                    </div>
                    <span className="text-[9.5px] font-black uppercase tracking-tight text-center leading-tight">
                      {method.name}
                    </span>
                    <span className="text-[8px] font-mono font-bold bg-black/25 px-1 py-0.2 rounded border border-white/20">
                      {method.shortcut}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Painel Contextual de Detalhes da Forma Selecionada */}
            {(form.payment_method === 'Cartão Crédito' || (form.payment_method === 'Cartão' && form.sale_condition === 'Prazo') || form.payment_method === 'Crediário') && (
              <div className="bg-[#0E1726] border border-[#1F2E47] p-2 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-purple-400" />
                  Parcelas:
                </span>
                <select
                  value={activeInstallments}
                  onChange={e => onInstallmentsChange && onInstallmentsChange(parseInt(e.target.value) || 1)}
                  className="bg-[#080D1A] border border-[#1F2E47] rounded-lg px-2 py-1 text-xs font-mono font-bold text-white outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(num => (
                    <option key={num} value={num}>
                      {num}x {num > 1 ? `de ${formatBRL(cartGrandTotal / num)}` : 'à vista'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.payment_method === 'Fiado' && (
              <div className="bg-amber-950/40 border border-amber-800/60 p-2 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Handshake size={13} />
                    Vencimento Fiado:
                  </span>
                  <span className="font-mono font-black text-white">
                    {formatBillingDueDateBR(fiadoCalculatedDueDate)}
                  </span>
                </div>
                {selectedCustomer?.billing_day && (
                  <p className="text-[10px] text-amber-200">
                    Baseado no dia fixo <span className="font-bold font-mono">#{selectedCustomer.billing_day}</span> do cliente.
                  </p>
                )}
                {!selectedCustomer && (
                  <p className="text-[10px] text-red-400 font-bold">
                    ⚠️ Atenção: selecione o cliente cadastrado para registrar a nota fiada.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* LINHA DE AÇÕES RÁPIDAS (DESCONTO, SANGRIA, HISTÓRICO, ORÇAMENTO, OS, CLIENTE) */}
          {/* ======================================================================= */}
          <div className="px-3 py-2 border-t border-[#1E293B] bg-[#0E1726] shrink-0">
            <div className="grid grid-cols-6 gap-1.5">
              {/* 1. Desconto */}
              <button
                type="button"
                onClick={() => {
                  setDiscountInputVal(String(currentDiscount || ''));
                  setIsDiscountModalOpen(true);
                }}
                className="p-1.5 bg-[#080D1A] hover:bg-[#1E293B] border border-[#1F2E47] hover:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                title="Desconto (F4)"
              >
                <Percent size={13} />
                <span className="text-[8.5px] font-black uppercase">Desconto</span>
                <span className="text-[7px] text-slate-500 font-mono">F4</span>
              </button>

              {/* 2. Sangria */}
              <button
                type="button"
                onClick={() => setIsSangriaModalOpen(true)}
                className="p-1.5 bg-[#080D1A] hover:bg-[#1E293B] border border-[#1F2E47] hover:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                title="Sangria ou Suprimento de Caixa"
              >
                <ArrowUpCircle size={13} />
                <span className="text-[8.5px] font-black uppercase">Sangria</span>
              </button>

              {/* 3. Histórico */}
              <button
                type="button"
                onClick={onOpenHistory}
                className="p-1.5 bg-[#080D1A] hover:bg-[#1E293B] border border-[#1F2E47] hover:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                title="Histórico de Vendas"
              >
                <History size={13} />
                <span className="text-[8.5px] font-black uppercase">Histórico</span>
                <span className="text-[7px] text-slate-500 font-mono">F2</span>
              </button>

              {/* 4. Orçamento */}
              <button
                type="button"
                onClick={() => onOpenQuotesTab && onOpenQuotesTab()}
                className="p-1.5 bg-[#080D1A] hover:bg-[#1E293B] border border-[#1F2E47] hover:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                title="Orçamentos"
              >
                <FileText size={13} />
                <span className="text-[8.5px] font-black uppercase">Orçamento</span>
              </button>

              {/* 5. OS */}
              <button
                type="button"
                onClick={() => onOpenOsModal && onOpenOsModal()}
                className="p-1.5 bg-[#080D1A] hover:bg-[#1E293B] border border-[#1F2E47] hover:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                title="Ordem de Serviço"
              >
                <Wrench size={13} />
                <span className="text-[8.5px] font-black uppercase">OS</span>
              </button>

              {/* 6. Cliente Novo */}
              <button
                type="button"
                onClick={() => onOpenCustomerModal && onOpenCustomerModal()}
                className="p-1.5 bg-[#080D1A] hover:bg-[#1E293B] border border-[#1F2E47] hover:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                title="Cadastrar Novo Cliente"
              >
                <User size={13} />
                <span className="text-[8.5px] font-black uppercase truncate">Cliente Novo</span>
                <span className="text-[7px] text-slate-500 font-mono">F3</span>
              </button>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* BOTÕES DE FINALIZAÇÃO: CANCELAR VENDA E FINALIZAR VENDA */}
          {/* ======================================================================= */}
          <div className="p-3 border-t border-[#1E293B] bg-[#0A0F1D] shrink-0 grid grid-cols-2 gap-2.5">
            {/* CANCELAR VENDA (ESC) */}
            <button
              type="button"
              onClick={() => {
                if (onCancelSale) onCancelSale();
                else if (onClearCart) onClearCart();
              }}
              className="py-3 px-4 bg-[#1E293B] hover:bg-[#334155] active:bg-[#0F172A] text-slate-300 hover:text-red-400 border border-[#334155] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              title="Cancelar Venda (ESC)"
            >
              <X size={15} />
              <span>CANCELAR VENDA</span>
            </button>

            {/* FINALIZAR VENDA (ENTER) */}
            <button
              type="button"
              disabled={isFinalizing || form.items.length === 0}
              onClick={handleFinalizeSaleClick}
              className="py-3 px-4 bg-[#FF1A53] hover:bg-[#E11D48] active:bg-[#BE123C] disabled:opacity-50 text-white rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/50 hover:shadow-rose-900/60 active:scale-[0.98] cursor-pointer"
              title="Finalizar Venda (ENTER)"
            >
              <CheckCircle2 size={18} className="stroke-[2.5]" />
              <span>{isFinalizing ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}</span>
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 3. RODAPÉ INFORMATIVO (DATA/HORA, OPERADOR, CAIXA, RESUMO DO DIA, ATALHOS) */}
      {/* ========================================================================= */}
      <footer className="h-9 bg-[#0B1324] border-t border-[#1E293B] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 z-20">
        {/* Lado Esquerdo: Indicadores Reais do Sistema */}
        <div className="flex items-center gap-4">
          {/* Data e Hora em Tempo Real */}
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Clock size={12} className="text-[#FF1A53]" />
            <span>{currentDateTime}</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* Operador */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <User size={12} />
            <span>Operador: <strong className="text-white">{currentUser?.name || 'admin'}</strong></span>
          </div>

          <span className="text-slate-700 hidden md:inline">•</span>

          {/* Nome do Caixa */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <span>Caixa: <strong className="text-white">Frente de Caixa</strong></span>
          </div>

          <span className="text-slate-700 hidden lg:inline">•</span>

          {/* Vendas Hoje */}
          <div className="hidden lg:flex items-center gap-1.5">
            <DollarSign size={12} className="text-emerald-400" />
            <span>Vendas hoje: <strong className="text-emerald-400">{formatBRL(totalToday)}</strong></span>
          </div>

          <span className="text-slate-700 hidden xl:inline">•</span>

          {/* Nº de Vendas */}
          <div className="hidden xl:flex items-center gap-1.5">
            <span>Nº de vendas: <strong className="text-white">{todaySales.length}</strong></span>
          </div>

          <span className="text-slate-700 hidden 2xl:inline">•</span>

          {/* Itens Vendidos */}
          <div className="hidden 2xl:flex items-center gap-1.5">
            <span>Itens vendidos: <strong className="text-white">{totalItemsSoldToday}</strong></span>
          </div>
        </div>

        {/* Lado Direito: Atalhos do Teclado */}
        <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-400 font-sans">
          <span><kbd className="bg-[#1E293B] text-slate-200 px-1.5 py-0.5 rounded border border-[#334155] font-bold">F1</kbd> PIX</span>
          <span><kbd className="bg-[#1E293B] text-slate-200 px-1.5 py-0.5 rounded border border-[#334155] font-bold">F2</kbd> Dinheiro</span>
          <span><kbd className="bg-[#1E293B] text-slate-200 px-1.5 py-0.5 rounded border border-[#334155] font-bold">F3</kbd> Débito</span>
          <span><kbd className="bg-[#1E293B] text-slate-200 px-1.5 py-0.5 rounded border border-[#334155] font-bold">F4</kbd> Crédito</span>
          <span><kbd className="bg-[#1E293B] text-slate-200 px-1.5 py-0.5 rounded border border-[#334155] font-bold">F5</kbd> Fiado</span>
          <span><kbd className="bg-[#1E293B] text-slate-200 px-1.5 py-0.5 rounded border border-[#334155] font-bold">ESC</kbd> Cancelar</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODAL RÁPIDO DE SELEÇÃO DE CLIENTE */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E1726] border border-[#1F2E47] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1F2E47] flex items-center justify-between bg-[#0B1324]">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#FF1A53]" />
                <h3 className="text-sm font-black uppercase text-white">Selecionar Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, CPF ou apelido..."
                  value={custModalSearch}
                  onChange={e => setCustModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#080D1A] border border-[#1F2E47] rounded-xl text-xs font-bold text-white outline-none focus:border-[#FF1A53]"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onCustomerChange('');
                    setIsCustomerModalOpen(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Usar Consumidor Final
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    if (onOpenCustomerModal) onOpenCustomerModal();
                  }}
                  className="px-3 py-1.5 bg-[#FF1A53]/20 hover:bg-[#FF1A53]/30 border border-[#FF1A53]/50 text-[#FF1A53] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Cadastrar Novo Cliente
                </button>
              </div>

              {/* Lista de Clientes */}
              <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
                {filteredCustomersModal.map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      onCustomerChange(String(cust.id));
                      setIsCustomerModalOpen(false);
                    }}
                    className="p-2.5 bg-[#080D1A] border border-[#1F2E47] hover:border-[#FF1A53] rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{cust.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        CPF: {cust.cpf || 'Não informado'} {cust.whatsapp ? `• ${cust.whatsapp}` : ''}
                      </p>
                      {cust.billing_day && (
                        <span className="text-[9px] text-amber-400 font-bold">
                          Dia de vencimento: #{cust.billing_day}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Limite: {formatBRL(cust.credit_limit || 0)}
                      </span>
                      <button
                        type="button"
                        className="mt-1 px-2.5 py-1 bg-[#FF1A53] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL RÁPIDO DE SELEÇÃO DE MECÂNICO */}
      {/* ========================================================================= */}
      {isMechanicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E1726] border border-[#1F2E47] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1F2E47] flex items-center justify-between bg-[#0B1324]">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-[#FF1A53]" />
                <h3 className="text-sm font-black uppercase text-white">Selecionar Mecânico / Vendedor</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMechanicModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onMechanicChange('');
                  setIsMechanicModalOpen(false);
                }}
                className="w-full p-2.5 bg-[#080D1A] border border-[#1F2E47] hover:border-slate-600 rounded-xl text-left text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Nenhum (Sem Comissão)</span>
                <Check size={14} className="text-slate-500" />
              </button>

              {mechanics.filter(m => m.active).map(mech => (
                <button
                  key={mech.id}
                  type="button"
                  onClick={() => {
                    onMechanicChange(String(mech.id));
                    setIsMechanicModalOpen(false);
                  }}
                  className="w-full p-2.5 bg-[#080D1A] border border-[#1F2E47] hover:border-[#FF1A53] rounded-xl text-left text-xs font-bold text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span>{mech.name}</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Comissão: {mech.commission_rate}%
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#FF1A53] text-white rounded-lg text-[10px] font-bold">
                    Selecionar
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DE DESCONTO */}
      {/* ========================================================================= */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E1726] border border-[#1F2E47] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1F2E47] flex items-center justify-between bg-[#0B1324]">
              <div className="flex items-center gap-2">
                <Percent size={18} className="text-[#FF1A53]" />
                <h3 className="text-sm font-black uppercase text-white">Aplicar Desconto (R$)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = Math.max(0, parseFloat(discountInputVal.replace(',', '.')) || 0);
                onDiscountChange(val);
                setIsDiscountModalOpen(false);
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Valor do Desconto em R$:
                </label>
                <div className="flex items-center bg-[#080D1A] border border-[#1F2E47] rounded-xl px-3 py-2">
                  <span className="text-slate-500 font-mono text-sm mr-1.5">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountInputVal}
                    onChange={e => setDiscountInputVal(e.target.value)}
                    placeholder="0,00"
                    autoFocus
                    className="w-full bg-transparent outline-none font-mono font-black text-lg text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDiscountChange(0);
                    setIsDiscountModalOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Zerar Desconto
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF1A53] hover:bg-[#E11D48] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-950/40 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE ACRÉSCIMO */}
      {/* ========================================================================= */}
      {isSurchargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E1726] border border-[#1F2E47] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1F2E47] flex items-center justify-between bg-[#0B1324]">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#FF1A53]" />
                <h3 className="text-sm font-black uppercase text-white">Adicionar Acréscimo (R$)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSurchargeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = Math.max(0, parseFloat(surchargeInputVal.replace(',', '.')) || 0);
                if (onSurchargeChange) onSurchargeChange(val);
                setIsSurchargeModalOpen(false);
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Valor do Acréscimo em R$:
                </label>
                <div className="flex items-center bg-[#080D1A] border border-[#1F2E47] rounded-xl px-3 py-2">
                  <span className="text-slate-500 font-mono text-sm mr-1.5">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={surchargeInputVal}
                    onChange={e => setSurchargeInputVal(e.target.value)}
                    placeholder="0,00"
                    autoFocus
                    className="w-full bg-transparent outline-none font-mono font-black text-lg text-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSurchargeChange) onSurchargeChange(0);
                    setIsSurchargeModalOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Zerar Acréscimo
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF1A53] hover:bg-[#E11D48] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-950/40 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL DE SANGRIA / SUPRIMENTO DIRETO NO PDV */}
      {/* ========================================================================= */}
      {isSangriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E1726] border border-[#1F2E47] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1F2E47] flex items-center justify-between bg-[#0B1324]">
              <div className="flex items-center gap-2">
                <ArrowUpCircle size={18} className="text-[#FF1A53]" />
                <h3 className="text-sm font-black uppercase text-white">Movimentação de Caixa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSangriaModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSangriaSubmit} className="p-4 space-y-4">
              {/* Seletor Tipo: Sangria vs Suprimento */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSangriaForm({ ...sangriaForm, type: 'Sangria' })}
                  className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                    sangriaForm.type === 'Sangria'
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                      : 'bg-[#080D1A] border-[#1F2E47] text-slate-400'
                  }`}
                >
                  Sangria (-)
                </button>
                <button
                  type="button"
                  onClick={() => setSangriaForm({ ...sangriaForm, type: 'Suprimento' })}
                  className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                    sangriaForm.type === 'Suprimento'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-[#080D1A] border-[#1F2E47] text-slate-400'
                  }`}
                >
                  Suprimento (+)
                </button>
              </div>

              {/* Valor */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Valor da Movimentação (R$):
                </label>
                <div className="flex items-center bg-[#080D1A] border border-[#1F2E47] rounded-xl px-3 py-2">
                  <span className="text-slate-500 font-mono text-sm mr-1.5">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={sangriaForm.amount}
                    onChange={e => setSangriaForm({ ...sangriaForm, amount: e.target.value })}
                    placeholder="0,00"
                    autoFocus
                    className="w-full bg-transparent outline-none font-mono font-black text-lg text-white"
                  />
                </div>
              </div>

              {/* Motivo / Descrição */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Motivo / Observação:
                </label>
                <input
                  type="text"
                  required
                  value={sangriaForm.description}
                  onChange={e => setSangriaForm({ ...sangriaForm, description: e.target.value })}
                  placeholder="Ex: Pagamento de frete / Reforço de troco"
                  className="w-full bg-[#080D1A] border border-[#1F2E47] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#FF1A53]"
                />
              </div>

              <button
                type="submit"
                disabled={sangriaSubmitting}
                className="w-full py-3 bg-[#FF1A53] hover:bg-[#E11D48] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-950/40 cursor-pointer"
              >
                {sangriaSubmitting ? 'Registrando...' : 'Confirmar Movimentação'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const PDVTab = React.memo(PDVTabComponent);
export default PDVTab;
