import React from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, CreditCard, Calculator, Bell, Plus, ArrowUpCircle, X, 
  Package, Bike, TrendingUp, Truck, DollarSign, Percent, BarChart3,
  AlertTriangle, Calendar, ShieldCheck, Gavel, MessageCircle, Printer, FileText, CheckCircle 
} from 'lucide-react';
import Modal from './Modal';


interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
  type?: 'Peça' | 'Serviço';
  total: number;
}

interface Sale {
  id: string;
  customer_id?: number;
  customer_name: string;
  date: string;
  total: number;
  payment_method: string;
  payment_status: string;
  due_date?: string;
  paid_date?: string;
  paid_total?: number;
  items: SaleItem[];
  labor_value: number;
  service_description?: string;
  type: string;
}

interface Product {
  id: number;
  description: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
}

interface Customer {
  id: number;
  name: string;
  whatsapp?: string;
  credit_limit?: number;
}

interface FinancialTabProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  companyData: any;
  companyLogo: string | null;
  localApi: any;
  fetchData: () => void;
  formatBRL: (val: number) => string;
}

const FinancialTab: React.FC<FinancialTabProps> = ({
  sales,
  products,
  customers,
  companyData,
  companyLogo,
  localApi,
  fetchData,
  formatBRL
}) => {
  // --- Internal State (Migrated from App) ---
  const [financialTab, setFinancialTab] = React.useState<'caixa' | 'receber' | 'taxas' | 'automacao'>('caixa');
  
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

  const [cashSessions, setCashSessions] = React.useState<any[]>([]);
  const [activeSession, setActiveSession] = React.useState<any | null>(null);
  const [cashTransactions, setCashTransactions] = React.useState<any[]>([]);
  
  const [isCashModalOpen, setIsCashModalOpen] = React.useState(false);
  const [cashForm, setCashForm] = React.useState({ openingBalance: '', notes: '' });
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
  const [transactionForm, setTransactionForm] = React.useState({ type: 'Sangria' as 'Suprimento' | 'Sangria', amount: '', description: '' });

  // --- Data Loading (Financial Specific) ---
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
      console.error('Error loading financial data:', err);
    }
  }, [localApi]);

  React.useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // --- Handlers (Migrated from App) ---
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
      loadFinancialData();
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
      loadFinancialData();
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
      loadFinancialData();
      alert('Movimentação registrada!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao registrar movimentação.');
    }
  };

  const getCustomerScore = (customerId: number) => {
    const cSales = sales.filter(s => s.customer_id === customerId && s.payment_method === 'Fiado');
    if (cSales.length === 0) return 5.0;
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

    if (diffDays >= 30) return sale.total * 1.15;

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
          <strong>R$ ${sale.total.toFixed(2)}</strong> pagável em <strong>Andirá-PR</strong>.
        </p>
      </div>
    `;
    printWindow.document.write(`<html><head><title>Promissória - ${sale.customer_name}</title></head><body onload="window.print()">${content}</body></html>`);
    printWindow.document.close();
  };

  const sendBillingWhatsapp = (sale: Sale, type: 'reminder' | 'overdue' | 'thanks') => {
    let msg = '';
    const name = sale.customer_name.split(' ')[0];
    const customer = customers.find(c => c.id === Number(sale.customer_id));
    const cleanPhone = (customer?.whatsapp || '').replace(/\D/g, '') || '';
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



      {/* Financial Modals Migrated from App */}
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
    </div>

  );
};

export default FinancialTab;
