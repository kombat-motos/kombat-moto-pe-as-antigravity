import React from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, CreditCard, Calculator, Bell, Plus, ArrowUpCircle, X, 
  Package, Bike, TrendingUp, Truck, DollarSign, Percent, BarChart3,
  AlertTriangle, Calendar, ShieldCheck, Gavel, MessageCircle, Printer, FileText, CheckCircle, Search,
  ArrowDownCircle, Trash2, Copy, Upload
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
  allSales: Sale[];
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
  allSales,
  products,
  customers,
  companyData,
  companyLogo,
  localApi,
  fetchData,
  formatBRL
}) => {
  const [financialTab, setFinancialTab] = React.useState<'caixa' | 'receber' | 'pagar' | 'fechamento' | 'taxas' | 'automacao'>('caixa');

  // --- Estados de Contas a Pagar ---
  const [accountsPayable, setAccountsPayable] = React.useState<any[]>([]);
  const [isPayableModalOpen, setIsPayableModalOpen] = React.useState(false);
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
  const [geminiApiKey, setGeminiApiKey] = React.useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);

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
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [accountsPayable, payableSearchTerm, payableStatusFilter, todayStr]);

  const loadAccountsPayable = React.useCallback(async () => {
    try {
      const data = await localApi.get('accounts_payable');
      if (Array.isArray(data)) {
        setAccountsPayable(data);
      }
    } catch (err) {
      console.error('Error loading accounts payable:', err);
    }
  }, [localApi]);

  React.useEffect(() => {
    loadAccountsPayable();
  }, [loadAccountsPayable]);

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
            alert(`Boleto de ${payload.fornecedor} no valor de ${formatBRL(payload.valor)} cadastrado automaticamente!`);
          } else {
            alert("Não foi possível extrair dados do boleto automaticamente. Por favor, insira os dados manualmente.");
          }
        } catch (err: any) {
          console.error("Error calling parse endpoint:", err);
          alert("Não foi possível ler o boleto automaticamente: " + err.message);
        } finally {
          setIsParsingBoleto(false);
        }
      };
    } catch (err: any) {
      console.error("File upload error:", err);
      alert("Erro ao ler arquivo: " + err.message);
      setIsParsingBoleto(false);
    }
  };

  const handleAddPayable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await localApi.post('accounts_payable', {
        ...payableForm,
        valor: parseFloat(payableForm.valor.replace(',', '.')) || 0
      });
      setIsPayableModalOpen(false);
      setPayableForm({
        fornecedor: '',
        valor: '',
        due_date: new Date().toISOString().split('T')[0],
        linha_digitavel: '',
        codigo_pix: ''
      });
      loadAccountsPayable();
      alert('Conta a pagar cadastrada com sucesso!');
    } catch (err: any) {
      alert('Erro ao cadastrar conta: ' + err.message);
    }
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
    if (!confirm('Confirmar exclusão desta conta?')) return;
    try {
      await localApi.delete('accounts_payable', id);
      loadAccountsPayable();
      alert('Conta excluída com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir conta: ' + err.message);
    }
  };

  // --- Estados do Fechamento de Cliente ---
  const [closingCustomerId, setClosingCustomerId] = React.useState<string>('');
  const [closingPeriodType, setClosingPeriodType] = React.useState<'day' | 'month'>('month');
  const [closingDate, setClosingDate] = React.useState<string>(() => new Date().toISOString().split('T')[0]);
  const [closingMonthYear, setClosingMonthYear] = React.useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [closingResult, setClosingResult] = React.useState<any>(null);
  
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
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredSales = React.useMemo(() => {
    return (allSales || [])
      .filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente')
      .filter(s => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          (s.customer_name || '').toLowerCase().includes(term) ||
          (s.id || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  }, [allSales, searchTerm]);

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
    const cSales = (allSales || []).filter(s => s.customer_id === customerId && s.payment_method === 'Fiado');
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
        <div style="position: absolute; top: 10px; right: 20px; font-size: 24px; font-weight: bold;">Nº ${String(sale.id).slice(-6).toUpperCase()}</div>
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

  // Lógica de cálculo do Fechamento do Cliente
  // SQL Equivalente (exemplo para base de conhecimento):
  // SELECT 
  //   CASE WHEN type = 'Serviço' OR product_id IS NULL THEN 'Serviço' ELSE 'Peça' END as category,
  //   SUM(price * quantity) as subtotal 
  // FROM sale_items 
  // JOIN sales ON sales.id = sale_items.sale_id 
  // WHERE sales.customer_id = ? AND strftime('%Y-%m', sales.date) = ?
  // GROUP BY category;
  const handleCalculateClosing = () => {
    if (!closingCustomerId) {
      alert("Selecione um cliente para o fechamento.");
      return;
    }

    const customerIdNum = parseInt(closingCustomerId);
    
    // Filtro as vendas do cliente
    let customerSales = (allSales || []).filter(s => s.customer_id === customerIdNum);

    // Filtro por período
    customerSales = customerSales.filter(s => {
      const saleDate = new Date(s.date);
      // Ajuste para fuso horário local
      const saleDateLocal = new Date(saleDate.getTime() - (saleDate.getTimezoneOffset() * 60000));
      
      if (closingPeriodType === 'day') {
        return saleDateLocal.toISOString().split('T')[0] === closingDate;
      } else {
        const [year, month] = closingMonthYear.split('-');
        return saleDateLocal.getFullYear() === parseInt(year) && (saleDateLocal.getMonth() + 1) === parseInt(month);
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
        if (item.type === 'Adicional Interno') {
          return;
        }

        const itemTotal = item.price * item.quantity;
        if (item.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS' || item.type === 'Serviço Principal') {
          hasLaborInItems = true;
        }

        if (item.type === 'Serviço' || item.type === 'Serviço Principal' || !item.product_id) {
          totalServicos += itemTotal;
          saleTotalServicos += itemTotal;
          servicosList.push({ ...item, date: sale.date, saleId: sale.id });
        } else {
          totalPecas += itemTotal;
          saleTotalPecas += itemTotal;
          pecasList.push({ ...item, date: sale.date, saleId: sale.id });
        }
      });

      // Compatibilidade com O.S. antigas que salvavam Mão de Obra fora do array de items
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

    setClosingResult({
      customerName: customers.find(c => c.id === customerIdNum)?.name,
      periodLabel: closingPeriodType === 'day' 
        ? new Date(closingDate + 'T00:00:00').toLocaleDateString('pt-BR') 
        : closingMonthYear.split('-').reverse().join('/'),
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

  return (
    <div className="space-y-8">
      {/* Secondary Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit no-print dark:bg-slate-800">
        {[
          { id: 'caixa', label: 'Fluxo de Caixa', icon: Wallet },
          { id: 'receber', label: 'Contas a Receber', icon: CreditCard },
          { id: 'pagar', label: 'Contas a Pagar', icon: ArrowDownCircle },
          { id: 'fechamento', label: 'Fechamento de Cliente', icon: FileText },
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
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 flex flex-col md:flex-row items-center justify-between gap-6 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${activeSession ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                <Wallet size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Status do Caixa</h3>
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
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 dark:bg-slate-800 dark:text-slate-100"
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
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Package size={20} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Venda de Produtos</p>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {productSales.toFixed(2)}</h4>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Bike size={20} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Serviços</p>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {serviceSales.toFixed(2)}</h4>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 bg-gradient-to-br from-rose-600 to-rose-700 text-white border-none dark:bg-slate-800 dark:border-slate-700">
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
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-400">
                  <Truck size={20} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Custo das Peças</p>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {productCosts.toFixed(2)}</h4>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign size={20} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Lucro Líquido (Peças)</p>
              </div>
              <h4 className="text-2xl font-black text-emerald-600">R$ {productProfit.toFixed(2)}</h4>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Percent size={20} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Margem de Lucro</p>
              </div>
              <h4 className="text-2xl font-black text-indigo-600">{profitMargin.toFixed(1)}%</h4>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-slate-100">
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
                      <span className="font-medium text-slate-600 dark:text-slate-400">{method}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
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
              { label: 'Vencidos', value: (allSales || []).filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente' && new Date(s.due_date!) < now).length, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
              { label: 'Vence Hoje', value: (allSales || []).filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente' && new Date(s.due_date!).toLocaleDateString() === now.toLocaleDateString()).length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Bell },
              { label: 'A Vencer', value: (allSales || []).filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pendente' && new Date(s.due_date!) > now).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
              { label: 'Total Recebido', value: `R$ ${(allSales || []).filter(s => s.payment_method === 'Fiado' && s.payment_status === 'Pago').reduce((acc, s) => acc + s.total, 0).toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ShieldCheck }
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

          <div className="bg-white rounded-3xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="p-6 border-b border-slate-400 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 dark:text-slate-100">
                <Gavel size={20} className="text-rose-500" />
                Listagem de Débitos Ativos
              </h3>
              <div className="relative group w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar devedor..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all w-full shadow-sm dark:bg-slate-900 dark:border-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest dark:bg-slate-900">
                    <th className="px-6 py-4">Cliente / Score</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Original</th>
                    <th className="px-6 py-4">Valor Atual</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredSales.map(sale => {
                    const isOverdue = new Date(sale.due_date!) < now;
                    const score = getCustomerScore(sale.customer_id || 0);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{sale.customer_name}</p>
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
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium dark:text-slate-400">R$ {sale.total.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">R$ {calculateOverdueDebt(sale).toFixed(2)}</p>
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
                            <button onClick={() => generatePromissoryNote(sale)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400" title="Nota Promissória">
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
              {filteredSales.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic font-medium">
                  {searchTerm ? `Nenhum débito encontrado para "${searchTerm}"` : "Nenhum fiado pendente. 🎉"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {financialTab === 'pagar' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Vencidos', value: `${statsPayable.overdueCount} (${formatBRL(statsPayable.overdueTotal)})`, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
              { label: 'Vence Hoje', value: `${statsPayable.dueTodayCount} (${formatBRL(statsPayable.dueTodayTotal)})`, color: 'text-amber-600', bg: 'bg-amber-50', icon: Bell },
              { label: 'A Vencer', value: `${statsPayable.upcomingCount} (${formatBRL(statsPayable.upcomingTotal)})`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
              { label: 'Total Pago', value: formatBRL(statsPayable.paidTotal), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ShieldCheck }
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

          <div className="bg-white rounded-3xl shadow-sm border border-slate-400 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="p-6 border-b border-slate-400 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center gap-4 w-full justify-between">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 dark:text-slate-100">
                  <ArrowDownCircle size={20} className="text-rose-500" />
                  Listagem de Contas a Pagar
                </h3>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Status Filters */}
                  <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-900">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${payableStatusFilter === f.id ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative group w-full md:w-48">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar fornecedor..."
                      className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all w-full shadow-sm dark:bg-slate-900 dark:border-slate-700"
                      value={payableSearchTerm}
                      onChange={(e) => setPayableSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => setIsPayableModalOpen(true)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all shadow-sm flex items-center gap-1.5 ml-auto md:ml-0"
                  >
                    <Plus size={14} /> Nova Conta
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest dark:bg-slate-900">
                    <th className="px-6 py-4">Fornecedor</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Pagamento / Copiar</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredAccountsPayable.map(item => {
                    const isOverdue = item.status !== 'Pago' && item.due_date < todayStr;
                    const isToday = item.status !== 'Pago' && item.due_date === todayStr;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group dark:hover:bg-slate-900/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.fornecedor}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`text-sm font-medium ${isOverdue ? 'text-rose-600 font-bold' : isToday ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                            {new Date(item.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatBRL(item.valor)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {item.linha_digitavel && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-medium font-mono max-w-[150px] truncate dark:bg-slate-950 dark:text-slate-400">
                                  Boleto: {item.linha_digitavel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.linha_digitavel);
                                    alert('Linha digitável copiada!');
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors dark:hover:bg-slate-800"
                                  title="Copiar Linha Digitável"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}
                            {item.codigo_pix && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600 font-medium font-mono max-w-[150px] truncate dark:bg-emerald-950/30">
                                  PIX: {item.codigo_pix}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.codigo_pix);
                                    alert('Chave/Código PIX copiado!');
                                  }}
                                  className="p-1 hover:bg-emerald-50 rounded text-emerald-500 hover:text-emerald-700 transition-colors dark:hover:bg-emerald-950/50"
                                  title="Copiar Código PIX"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}
                            {!item.linha_digitavel && !item.codigo_pix && (
                              <span className="text-[10px] text-slate-400 italic">Nenhum código cadastrado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'Pago' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                              : isOverdue 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                : isToday
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400'
                          }`}>
                            {item.status === 'Pago' ? 'Pago' : isOverdue ? 'Vencido' : isToday ? 'Vence Hoje' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            {item.status !== 'Pago' && (
                              <button
                                type="button"
                                onClick={() => handleLiquidatePayable(item.id)}
                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors dark:bg-emerald-950/30 dark:text-emerald-400"
                                title="Marcar como Pago"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePayable(item.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors dark:bg-rose-950/30 dark:text-rose-400"
                              title="Excluir Conta"
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
                <div className="p-12 text-center text-slate-400 italic font-medium">
                  Nenhuma conta a pagar encontrada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {financialTab === 'taxas' && (
        <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-500 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-slate-100">
            <Calculator size={24} className="text-blue-500" />
            Configuração de Repasse de Juros
          </h3>
          <p className="text-sm text-slate-500 mb-8 dark:text-slate-400">Defina as taxas cobradas pela sua operadora de cartão por parcela. Estes valores são usados na calculadora de vendas.</p>

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
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-400 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-blue-600 text-lg dark:bg-slate-900 dark:border-slate-700"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-400 dark:border-slate-700">
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
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-slate-100">
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
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-400 dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 dark:bg-slate-800"><MessageCircle size={20} /></div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${item.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.active ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 mb-6 dark:text-slate-100">Regras de Encargos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Multa por Atraso (%)</label>
                <input
                  type="number"
                  value={fiadoSettings.lateFeeRate}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, lateFeeRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Juros de Mora (Mensal %)</label>
                <input
                  type="number"
                  value={fiadoSettings.lateInterestRate}
                  onChange={e => setFiadoSettings({ ...fiadoSettings, lateInterestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {financialTab === 'fechamento' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-slate-100">
              <FileText size={24} className="text-indigo-500" />
              Calcular Fechamento do Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Cliente</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                  value={closingCustomerId}
                  onChange={e => { setClosingCustomerId(e.target.value); setClosingResult(null); }}
                >
                  <option value="">Selecione um cliente...</option>
                  {[...customers].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Tipo de Período</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                  value={closingPeriodType}
                  onChange={e => { setClosingPeriodType(e.target.value as any); setClosingResult(null); }}
                >
                  <option value="day">Por Dia</option>
                  <option value="month">Por Mês</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-100">Data do Período</label>
                {closingPeriodType === 'day' ? (
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                    value={closingDate}
                    onChange={e => { setClosingDate(e.target.value); setClosingResult(null); }}
                  />
                ) : (
                  <input
                    type="month"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
                    value={closingMonthYear}
                    onChange={e => { setClosingMonthYear(e.target.value); setClosingResult(null); }}
                  />
                )}
              </div>
            </div>

            <button
              onClick={handleCalculateClosing}
              className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              <Calculator size={20} /> Calcular Fechamento do Cliente
            </button>
          </div>

          {closingResult && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-200 dark:bg-slate-800">
              <div className="text-center mb-8 border-b border-slate-200 pb-6 dark:border-slate-700">
                <h2 className="text-2xl font-black text-slate-900 uppercase dark:text-slate-100">Resumo de Fechamento</h2>
                <p className="text-slate-500 text-lg dark:text-slate-400">{closingResult.customerName}</p>
                <p className="text-sm font-bold text-indigo-600 mt-1">Período: {closingResult.periodLabel}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Bloco Peças */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 dark:text-slate-100 dark:border-slate-700">
                    <Package size={20} className="text-blue-500" /> Peças e Acessórios
                  </h3>
                  {closingResult.pecasList.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Nenhuma peça no período.</p>
                  ) : (
                    <ul className="space-y-3">
                      {closingResult.pecasList.map((p: any, i: number) => (
                        <li key={i} className="flex justify-between text-sm bg-slate-50 p-2 rounded-lg dark:bg-slate-900">
                          <span>{p.quantity}x {p.description} <span className="text-[10px] text-slate-400 ml-1">({new Date(p.date).toLocaleDateString('pt-BR')})</span></span>
                          <span className="font-bold text-slate-700 dark:text-slate-100">{formatBRL(p.price * p.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="text-right pt-2">
                    <p className="text-xs uppercase font-bold text-slate-400">Subtotal Peças</p>
                    <p className="text-lg font-black text-blue-600">{formatBRL(closingResult.totalPecas)}</p>
                  </div>
                </div>

                {/* Bloco Serviços */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 dark:text-slate-100 dark:border-slate-700">
                    <Bike size={20} className="text-amber-500" /> Mão de Obra e Serviços
                  </h3>
                  {closingResult.servicosList.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Nenhum serviço no período.</p>
                  ) : (
                    <ul className="space-y-3">
                      {closingResult.servicosList.map((s: any, i: number) => (
                        <li key={i} className="flex justify-between text-sm bg-slate-50 p-2 rounded-lg dark:bg-slate-900">
                          <span>{s.quantity}x {s.description} <span className="text-[10px] text-slate-400 ml-1">({new Date(s.date).toLocaleDateString('pt-BR')})</span></span>
                          <span className="font-bold text-slate-700 dark:text-slate-100">{formatBRL(s.price * s.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="text-right pt-2">
                    <p className="text-xs uppercase font-bold text-slate-400">Subtotal Serviços</p>
                    <p className="text-lg font-black text-amber-600">{formatBRL(closingResult.totalServicos)}</p>
                  </div>
                </div>
              </div>

              {/* Resumo Final */}
              <div className="bg-slate-800 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-2 w-full md:w-1/2">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Total em Peças:</span>
                    <span>{formatBRL(closingResult.totalPecas)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Total em Serviços:</span>
                    <span>{formatBRL(closingResult.totalServicos)}</span>
                  </div>
                  {closingResult.descontos > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400 font-bold">
                      <span>(-) Descontos Aplicados:</span>
                      <span>{formatBRL(closingResult.descontos)}</span>
                    </div>
                  )}
                  {closingResult.acrescimos > 0 && (
                    <div className="flex justify-between text-sm text-rose-400 font-bold">
                      <span>(+) Acréscimos/Taxas:</span>
                      <span>{formatBRL(closingResult.acrescimos)}</span>
                    </div>
                  )}
                </div>
                <div className="text-right w-full md:w-1/2 md:border-l border-slate-600 md:pl-6">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-1">Valor Total Geral a Pagar</p>
                  <p className="text-4xl font-black text-white">{formatBRL(closingResult.totalLiquido)}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end no-print">
                <button onClick={handlePrintClosing} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 dark:bg-slate-800 dark:text-slate-100">
                  <Printer size={18} /> Imprimir Resumo
                </button>
              </div>
            </div>
          )}
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
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Saldo Inicial em Dinheiro (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={cashForm.openingBalance}
              onChange={e => setCashForm({ ...cashForm, openingBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Observações (Opcional)</label>
            <textarea
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none min-h-[80px] resize-none dark:bg-slate-900 dark:border-slate-700"
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
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Valor (R$)</label>
            <input
              type="number" step="0.01" required placeholder="0.00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={transactionForm.amount}
              onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-100">Descrição / Motivo</label>
            <input
              type="text" required placeholder="Ex: Troco inicial, Pagamento fornecedor..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none dark:bg-slate-900 dark:border-slate-700"
              value={transactionForm.description}
              onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">
            Registrar Movimentação
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isPayableModalOpen}
        onClose={() => setIsPayableModalOpen(false)}
        title="Cadastrar Conta a Pagar"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-rose-400 transition-colors bg-slate-50 dark:bg-slate-900 dark:border-slate-700 relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleUploadBoleto}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isParsingBoleto}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-rose-50 rounded-full text-rose-600 dark:bg-rose-950/30 font-bold">
                <Upload size={24} className={isParsingBoleto ? "animate-bounce" : ""} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-100">
                {isParsingBoleto ? "Analisando boleto..." : "Enviar Foto do Boleto / Pix"}
              </p>
              <p className="text-xs text-slate-400">
                Formatos aceitos: JPG, PNG, PDF. Leitura automática por IA.
              </p>
            </div>
          </div>

          {/* Configuração de Chave API */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <label className="block text-xs font-black text-slate-400 uppercase mb-1">
              Chave API do Gemini (Opcional)
            </label>
            <input
              type="password"
              placeholder="Cole sua chave API do Google AI Studio aqui..."
              value={geminiApiKey}
              onChange={e => {
                setGeminiApiKey(e.target.value);
                localStorage.setItem('gemini_api_key', e.target.value);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-rose-500/50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Caso a chave padrão do servidor esteja esgotada, insira sua chave para habilitar a leitura por IA. Salvo localmente de forma segura.
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-black uppercase tracking-wider">Ou Preencher Manualmente</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          <form onSubmit={handleAddPayable} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Fornecedor / Beneficiário *</label>
              <input
                type="text"
                required
                placeholder="Ex: Distribuidora de Peças Ltda"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none text-slate-800 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={payableForm.fornecedor}
                onChange={e => setPayableForm({ ...payableForm, fornecedor: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none text-slate-800 font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={payableForm.valor}
                  onChange={e => setPayableForm({ ...payableForm, valor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Vencimento *</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none text-slate-800 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={payableForm.due_date}
                  onChange={e => setPayableForm({ ...payableForm, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Linha Digitável (Código de Barras)</label>
              <input
                type="text"
                placeholder="Ex: 34191.79001 01043.513184..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none text-slate-800 font-mono text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={payableForm.linha_digitavel}
                onChange={e => setPayableForm({ ...payableForm, linha_digitavel: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">PIX Copia e Cola / Chave</label>
              <input
                type="text"
                placeholder="Código PIX EMV ou Chave de pagamento"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none text-slate-800 font-mono text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={payableForm.codigo_pix}
                onChange={e => setPayableForm({ ...payableForm, codigo_pix: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md mt-2"
            >
              Cadastrar Conta
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default FinancialTab;
