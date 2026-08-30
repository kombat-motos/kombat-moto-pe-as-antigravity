import React from 'react';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Pencil, X, Check, Printer, FileText, DollarSign, Search, AlertTriangle } from 'lucide-react';

interface Sale {
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
  payment_method: 'Pix' | 'Cartão' | 'Dinheiro' | 'Fiado';
  type: 'Balcão' | 'Oficina';
  date: string;
  moto_details?: string;
  payment_status: 'Pago' | 'Pendente';
  due_date?: string;
  paid_date?: string;
  paid_total?: number;
}

interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: number;
  name: string;
  cpf: string;
  whatsapp: string;
  address: string;
  neighborhood: string;
  zip_code: string;
  credit_limit: number;
  fine_rate?: number;
  interest_rate?: number;
  city?: string;
}

interface CompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface BillingAutomationBoxProps {
  pendingSales: Sale[];
  customers: Customer[];
  companyData: CompanyData;
  onUpdateDueDate: (saleId: string, newDate: string) => void;
  onPartialPayment: (sale: any, amount: string) => void;
  payingSaleId: string | null;
  setPayingSaleId: (id: string | null) => void;
  partialPaymentAmount: string;
  setPartialPaymentAmount: (val: string) => void;
  onPrintReceipt: (sale: any) => void;
}

// Função para converter número em extenso (Português)
function valorPorExtenso(valor: number): string {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezena10 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenouve"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converter(n: number): string {
    if (n === 100) return "cem";
    let res = "";
    if (n >= 100) {
      res += centenas[Math.floor(n / 100)];
      n %= 100;
      if (n > 0) res += " e ";
    }
    if (n >= 20) {
      res += dezenas[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) res += " e " + unidades[n];
    } else if (n >= 10) {
      res += dezena10[n - 10];
    } else if (n > 0) {
      res += unidades[n];
    }
    return res;
  }

  if (valor === 0) return "zero reais";

  let parteInteira = Math.floor(valor);
  let centavos = Math.round((valor - parteInteira) * 100);

  let extenso = "";

  if (parteInteira >= 1000) {
    let milhar = Math.floor(parteInteira / 1000);
    extenso += (milhar === 1 ? "" : converter(milhar)) + " mil";
    parteInteira %= 1000;
    if (parteInteira > 0) extenso += (parteInteira < 100 || parteInteira % 100 === 0 ? " e " : ", ") + converter(parteInteira);
  } else {
    extenso += converter(parteInteira);
  }

  extenso += parteInteira === 1 ? " real" : " reais";

  if (centavos > 0) {
    extenso += " e " + converter(centavos) + (centavos === 1 ? " centavo" : " centavos");
  }

  return extenso.toUpperCase();
}

const BillingAutomationBox: React.FC<BillingAutomationBoxProps> = ({ 
  pendingSales, 
  customers, 
  companyData, 
  onUpdateDueDate,
  onPartialPayment,
  payingSaleId,
  setPayingSaleId,
  partialPaymentAmount,
  setPartialPaymentAmount,
  onPrintReceipt
}) => {
  const [editingSaleId, setEditingSaleId] = React.useState<string | null>(null);
  const [tempDueDate, setTempDueDate] = React.useState<string>('');
  const [editingChargesId, setEditingChargesId] = React.useState<string | null>(null);
  const [tempRates, setTempRates] = React.useState({ fine: 2, interest: 1 });
  const [selectedPromissory, setSelectedPromissory] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterOverdue, setFilterOverdue] = React.useState(false);

  const filteredSales = React.useMemo(() => {
    let list = Array.isArray(pendingSales) ? pendingSales : [];
    
    if (filterOverdue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      list = list.filter(sale => {
        if (!sale.due_date) return false;
        const dueDate = new Date(sale.due_date);
        return differenceInDays(dueDate, today) < 0;
      });
    }

    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(sale => 
      (sale.customer_name || '').toLowerCase().includes(term) ||
      (sale.id || '').toLowerCase().includes(term)
    );
  }, [pendingSales, searchTerm, filterOverdue]);

  const handlePrintPromissory = async (sale: any, totalWithCharges: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credit', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Erro ao buscar parcelas');
      
      const allCredits = await res.json();
      let saleCredits = allCredits.filter((c: any) => c.sale_id === sale.id);

      if (saleCredits.length === 0) {
        alert("Erro: Nenhuma parcela financeira foi encontrada para esta venda.\n\nIsso pode ocorrer se a venda é muito antiga (antes da atualização do sistema) ou se a modalidade Fiado não foi processada corretamente.\n\nPara resolver: Abra a venda no PDV/OS, certifique-se de que a forma de pagamento é 'Fiado' e clique em Salvar novamente.");
        return;
      }
      
      saleCredits.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      
      setSelectedPromissory({ ...sale, totalWithCharges, credits: saleCredits });
      
      setTimeout(() => {
        const content = document.getElementById('promissory-note-print');
        if (content) {
          const win = window.open('', '', 'height=800,width=800');
          win?.document.write('<html><head><title>Imprimir / Salvar em PDF</title>');
          win?.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } } @page { size: A4 portrait; margin: 6mm; } .promissory-page { width: 100%; display: flex; flex-direction: column; gap: 2mm; align-items: stretch; } .promissory-note { width: 100%; height: 88mm; max-height: 88mm; box-sizing: border-box; padding: 4mm; margin: 0; overflow: hidden; break-inside: avoid; page-break-inside: avoid; border-bottom: 1px dashed #000; } .promissory-note * { box-sizing: border-box; } .promissory-note p { margin: 1mm 0; line-height: 1.25; } .promissory-note .section { margin: 2mm 0; padding: 0; } .promissory-note .issuer-data { margin-top: 2mm; padding: 2mm; line-height: 1.2; min-height: 0; height: auto; border: 1px solid #333; } .promissory-note .signature { margin-top: 3mm; padding-top: 0; text-align: center; } .promissory-note .legal-footer { margin-top: 2mm; padding-top: 1mm; line-height: 1.1; text-align: center; font-size: 7px; font-weight: bold; }</style>');
          win?.document.write('</head><body style="margin:0;padding:0;font-family: Arial, sans-serif;">');
          win?.document.write(content.innerHTML);
          win?.document.write('</body></html>');
          win?.document.close();
          win?.focus();
          setTimeout(() => {
            win?.print();
            win?.close();
          }, 500);
        }
      }, 300);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar promissória.');
    }
  };

  const getCustomerWhatsapp = (customerId?: number) => {
    if (!customerId) return '';
    const customer = customers.find(c => c.id === customerId);
    return customer?.whatsapp || '';
  };

  const generateWhatsAppLink = (phoneNumber: string, message: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Se não tiver número, não gera link para não bugar o WhatsApp Web com "phone=55"
    if (!cleanNumber || cleanNumber.length < 10) return '';

    const encodedMessage = encodeURIComponent(message);
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      return `https://wa.me/${finalNumber}?text=${encodedMessage}`;
    }
    
    return `https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodedMessage}`;
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string, link: string) => {
    e.preventDefault();
    if (!link) {
      alert('⚠️ OPA! Este cliente não possui um número de celular válido cadastrado. Por favor, edite o cadastro do cliente e adicione um WhatsApp (com DDD).');
      return;
    }
    window.open(link, '_blank');
  };

  const generateDigitalReceipt = (sale: Sale, type: 'before' | 'on' | 'after', totalWithCharges: number) => {
    const customerName = sale.customer_name.split(' ')[0].toUpperCase();
    const docId = sale.id.substring(0, 8).toUpperCase();
    const paid = sale.paid_total || 0;
    const original = sale.total;
    const charges = totalWithCharges - (original - paid);
    const dueDate = sale.due_date ? format(new Date(sale.due_date), 'dd/MM/yyyy') : 'N/A';

    const itemsList = (sale?.items || sale?.sale_items || [])
      .filter((item: any) => item.type !== 'Adicional Interno')
      .map((item: any) => `${item.quantity}x ${(item.description || '').substring(0, 20)}.. R$ ${(item.quantity * item.price).toFixed(2)}`)
      .join('\n');
    const labor = sale.labor_value > 0 ? `SERVIÇOS.. R$ ${sale.labor_value.toFixed(2)}\n` : '';

    let headerMsg = '';
    switch(type) {
      case 'before': headerMsg = '*🔔 LEMBRETE DE VENCIMENTO*'; break;
      case 'on':     headerMsg = '*💰 VENCIMENTO HOJE*'; break;
      case 'after':  headerMsg = '*⚠️ COBRANÇA EM ATRASO*'; break;
    }

    return `${headerMsg}\n` +
      `*ID:* #${docId}\n` +
      `*CLIENTE:* ${customerName}\n` +
      `*VENCIMENTO:* ${dueDate}\n\n` +
      `*--- DETALHES DA CONTA ---*\n` +
      `${itemsList}\n` +
      `${labor}` +
      `------------------------------------\n` +
      `*VALOR ORIGINAL:* R$ ${original.toFixed(2)}\n` +
      `*VALOR JÁ PAGO:* - R$ ${paid.toFixed(2)}\n` +
      `*ENCARGOS (ATRASO):* + R$ ${charges.toFixed(2)}\n` +
      `------------------------------------\n` +
      `*TOTAL A PAGAR: R$ ${totalWithCharges.toFixed(2)}*\n` +
      `------------------------------------\n\n` +
      `*Kombat Moto Peças*`;
  };

  const getNotificationMessage = (sale: Sale, type: 'before' | 'on' | 'after', totalWithCharges: number) => {
    return generateDigitalReceipt(sale, type, totalWithCharges);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-2xl shadow-md col-span-2"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">Automação de Cobrança</h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterOverdue(!filterOverdue)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              filterOverdue 
                ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-rose-300'
            }`}
          >
            <AlertTriangle size={18} className={filterOverdue ? 'animate-pulse' : 'text-rose-500'} />
            {filterOverdue ? 'Mostrando Atrasados' : 'Ver Atrasados'}
            {filterOverdue && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                {filteredSales.length}
              </span>
            )}
          </button>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar cliente na cobrança..."
              className="block w-full md:w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {pendingSales.length === 0 ? (
        <p className="text-slate-500">Nenhuma cobrança pendente no momento.</p>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">Nenhum cliente encontrado para "{searchTerm}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSales.map(sale => {
            const customer = customers.find(c => c.id === sale.customer_id);
            const customerWhatsapp = getCustomerWhatsapp(sale.customer_id);
            const dueDate = sale.due_date ? new Date(sale.due_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const fineRate = customer?.fine_rate ?? 2;
            const interestRate = customer?.interest_rate ?? 1;

            let notificationType: 'before' | 'on' | 'after' | null = null;
            let totalWithCharges = sale.total;
            let chargesDescription = '';

            if (dueDate) {
              const diffTime = today.getTime() - dueDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === -2) {
                notificationType = 'before';
              } else if (diffDays === 0) {
                notificationType = 'on';
              } else if (diffDays > 0) {
                notificationType = 'after';

                const fine = sale.total * (fineRate / 100);
                const monthlyInterest = interestRate / 100;
                const dailyInterest = monthlyInterest / 30;
                const interest = sale.total * dailyInterest * diffDays;
                totalWithCharges = sale.total + fine + interest;
                chargesDescription = `(Multa ${fineRate}% + Juros ${interestRate}% a.m.)`;
              }
            }

            return (
              <div key={sale.id} className="border border-slate-400 p-4 rounded-xl flex items-center justify-between hover:border-rose-200 transition-colors group">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800">{sale.customer_name}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">#{sale.id}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black">Valor Original</p>
                      <p className="font-bold text-slate-700 text-xs">R$ {sale.total.toFixed(2)}</p>
                    </div>
                    {sale.paid_total > 0 && (
                      <div>
                        <p className="text-[10px] text-emerald-500 uppercase font-black">Já Pago</p>
                        <p className="font-bold text-emerald-600 text-xs">R$ {sale.paid_total.toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-rose-500 uppercase font-black">Pendente</p>
                      <p className="font-bold text-rose-600 text-sm">R$ {(sale.total - (sale.paid_total || 0)).toFixed(2)}</p>
                    </div>
                    
                    {totalWithCharges > (sale.total - (sale.paid_total || 0)) && (
                      <div className="bg-rose-50 px-2 py-1 rounded border border-rose-100">
                        <p className="text-[9px] text-rose-400 font-bold uppercase">Com Encargos</p>
                        <p className="font-black text-rose-700 text-xs text-center">R$ {totalWithCharges.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {/* RÉGUA DE COBRANÇA - ÁREA MARCADA COM X */}
                    <div className="flex items-center gap-1.5 px-4 h-12 border-x border-slate-400 ml-4 group/regua">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Lembrete</span>
                        <button
                          onClick={(e) => handleWhatsAppClick(e, customerWhatsapp, generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'before', totalWithCharges)))}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            notificationType === 'before' ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500 ring-offset-1' : 'bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-400'
                          }`}
                          title="Disparar Lembrete (Pré-vencimento)"
                        >
                          <MessageCircle size={14} />
                        </button>
                      </div>

                      <div className="w-4 h-[1px] bg-slate-100 mt-3"></div>

                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Vencimento</span>
                        <button
                          onClick={(e) => handleWhatsAppClick(e, customerWhatsapp, generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'on', totalWithCharges)))}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            notificationType === 'on' ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500 ring-offset-1' : 'bg-slate-50 text-slate-300 hover:bg-emerald-50 hover:text-emerald-400'
                          }`}
                          title="Disparar Notificação (Hoje)"
                        >
                          <Check size={14} />
                        </button>
                      </div>

                      <div className="w-4 h-[1px] bg-slate-100 mt-3"></div>

                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Crítica</span>
                        <button
                          onClick={(e) => handleWhatsAppClick(e, customerWhatsapp, generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'after', totalWithCharges)))}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            notificationType === 'after' ? 'bg-rose-100 text-rose-600 ring-4 ring-rose-500/20 ring-offset-1' : 'bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-400'
                          }`}
                          title="Disparar Cobrança (Atraso)"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                      <div className="w-4 h-[1px] bg-slate-100 mt-3"></div>

                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Envio PDF</span>
                        <button
                          onClick={(e) => {
                            const thermalMsg = generateDigitalReceipt(sale, notificationType || 'after', totalWithCharges);
                            handlePrintPromissory(sale, totalWithCharges);
                            handleWhatsAppClick(e, customerWhatsapp, generateWhatsAppLink(customerWhatsapp, thermalMsg));
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-slate-800 text-white hover:scale-110 shadow-lg`}
                          title="Gerar PDF e Notinha p/ WhatsApp"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                      
                      <div className="w-4 h-[1px] bg-slate-100 mt-3"></div>

                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Recibo</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPrintReceipt) {
                              onPrintReceipt(sale);
                            }
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-sky-100 text-sky-600 hover:bg-sky-200 hover:scale-110 shadow-sm`}
                          title="Imprimir Recibo Térmico"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </div>

                    {/* AVISO DE DIAS FALTANTES - ÁREA MARCADA COM X */}
                    <div className="flex-1 flex justify-center px-4">
                      {dueDate && (
                        <div className={`flex flex-col items-center px-4 py-1.5 rounded-xl border transition-all ${
                          differenceInDays(dueDate, today) < 0 
                            ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' 
                            : differenceInDays(dueDate, today) <= 3
                            ? 'bg-amber-50 border-amber-100 text-amber-600'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider mb-0.5">Prazo</span>
                          <span className="text-sm font-black flex items-center gap-1">
                            {differenceInDays(dueDate, today) === 0 ? (
                              "VENCE HOJE"
                            ) : differenceInDays(dueDate, today) < 0 ? (
                              `ATRASADO ${Math.abs(differenceInDays(dueDate, today))} DIAS`
                            ) : (
                              `FALTAM ${differenceInDays(dueDate, today)} DIAS`
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative group/rates ml-auto">
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        Taxas
                        <button
                          onClick={() => {
                            setEditingChargesId(sale.id);
                            setTempRates({ fine: fineRate, interest: interestRate });
                          }}
                          className="opacity-0 group-hover/rates:opacity-100 p-0.5 hover:bg-slate-100 rounded transition-all"
                        >
                          <Pencil size={10} />
                        </button>
                      </p>
                      {editingChargesId === sale.id ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            type="number"
                            className="w-12 text-[10px] border border-slate-400 rounded px-1"
                            value={tempRates.fine}
                            onChange={(e) => setTempRates({ ...tempRates, fine: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-[10px]">%</span>
                          <input
                            type="number"
                            className="w-12 text-[10px] border border-slate-400 rounded px-1"
                            value={tempRates.interest}
                            onChange={(e) => setTempRates({ ...tempRates, interest: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-[10px]">%</span>
                          <button onClick={() => setEditingChargesId(null)} className="p-0.5 text-emerald-600"><Check size={12} /></button>
                        </div>
                      ) : (
                        <p className="text-[9px] font-black text-slate-500 uppercase">{fineRate}% M. / {interestRate}% J.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-400 flex items-center gap-1">
                      Vencimento: <strong>{sale.due_date ? format(new Date(sale.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</strong>
                      <button
                        onClick={() => {
                          setEditingSaleId(sale.id);
                          setTempDueDate(sale.due_date ? new Date(sale.due_date).toISOString().split('T')[0] : '');
                        }}
                        className="p-0.5 hover:bg-white rounded"
                      >
                        <Pencil size={10} />
                      </button>
                    </p>
                    {notificationType === 'after' && (
                      <span className="text-[10px] font-bold text-rose-600 animate-pulse uppercase">
                        ⚠️ EM ATRASO
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintPromissory(sale, totalWithCharges)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-900 transition-colors font-bold shadow-sm"
                    >
                      <Printer size={14} />
                      Nota de Cobrança (PDF)
                    </button>
                    <button
                      onClick={(e) => handleWhatsAppClick(e, customerWhatsapp, generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, notificationType || 'on', totalWithCharges)))}
                      className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs rounded-lg transition-colors font-bold ${notificationType === 'after' ? 'bg-rose-500 hover:bg-rose-600' :
                        notificationType === 'on' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500 hover:bg-slate-600'
                        }`}
                    >
                      <Send size={14} />
                      Cobrar Agora
                    </button>
                  </div>

                  {payingSaleId === sale.id ? (
                    <div className="flex gap-2 items-center bg-white p-1 rounded-lg border border-emerald-100 shadow-sm">
                      <input
                        type="text"
                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-400 rounded text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Valor Pago"
                        value={partialPaymentAmount}
                        onChange={(e) => setPartialPaymentAmount(e.target.value)}
                      />
                      <button
                        onClick={() => onPartialPayment(sale, partialPaymentAmount)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 transition-all uppercase"
                      >
                        Baixar
                      </button>
                      <button
                        onClick={() => { setPayingSaleId(null); setPartialPaymentAmount(''); }}
                        className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setPayingSaleId(sale.id); setPartialPaymentAmount(''); }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 border border-emerald-100 w-full"
                    >
                      <Check size={14} /> Registrar Pagamento
                    </button>
                  )}

                  {editingSaleId === sale.id && (
                    <div className="flex items-center gap-2 p-1 bg-white border border-rose-100 rounded-lg shadow-sm">
                      <input
                        type="date"
                        className="text-xs border-none outline-none"
                        value={tempDueDate}
                        onChange={(e) => setTempDueDate(e.target.value)}
                      />
                      <button onClick={() => { onUpdateDueDate(sale.id, tempDueDate); setEditingSaleId(null); }} className="text-emerald-600"><Check size={16} /></button>
                      <button onClick={() => setEditingSaleId(null)} className="text-rose-600"><X size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template da Nota Promissória (Invisível no Normal, Visível no Print) */}
      <div id="promissory-note-print" style={{ display: 'none' }}>
        {selectedPromissory && selectedPromissory.credits && (
          <div className="promissory-page">
            {selectedPromissory.credits.map((credit: any, index: number) => {
              const parcelValue = credit.original_value;
              return (
                <div key={credit.id || index} className="promissory-note" style={{ position: 'relative' }}>
                  
                  {/* First row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '2px', marginBottom: '4px' }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>NOTA PROMISSÓRIA</h1>
                      <div style={{ fontSize: '8px', marginTop: '2px', fontWeight: 'bold' }}>Nº {credit.identifier || `VENDA-${selectedPromissory.id.substring(0, 8).toUpperCase()}-${String(credit.parcel_number).padStart(2, '0')}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '8px', marginBottom: '2px' }}>Parcela <strong>{credit.parcel_number}</strong> de <strong>{credit.total_parcels}</strong></div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
                        VENCIMENTO: {credit.due_date ? format(new Date(credit.due_date), 'dd/MM/yyyy') : '___/___/_____'}
                      </div>
                    </div>
                  </div>

                  {/* Second row */}
                  <div className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ccc', paddingBottom: '2px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px' }}>
                      R$ {parcelValue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '8px', fontStyle: 'italic', flex: 1, textAlign: 'left' }}>
                      ({valorPorExtenso(parcelValue)})
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="section" style={{ fontSize: '8px', textAlign: 'justify' }}>
                    <p>
                      Ao(s) <strong>{credit.due_date ? format(new Date(credit.due_date), 'dd') : '___'}</strong> dias do mês de <strong>{credit.due_date ? format(new Date(credit.due_date), 'MMMM', { locale: ptBR }) : '________________'}</strong> do ano de <strong>{credit.due_date ? format(new Date(credit.due_date), 'yyyy') : '_______'}</strong>, pagarei por esta única via de NOTA PROMISSÓRIA a <strong>KOMBAT MOTO PEÇAS</strong> ou à sua ordem, a quantia acima estipulada em moeda corrente deste país.
                    </p>
                  </div>

                  {/* Issuer data */}
                  <div className="issuer-data" style={{ fontSize: '8px' }}>
                    <div style={{ marginBottom: '1px' }}><strong>EMITENTE:</strong> {selectedPromissory.customer_name.toUpperCase()}</div>
                    <div style={{ marginBottom: '1px' }}><strong>CPF/CNPJ:</strong> {customers.find(c => c.id === selectedPromissory.customer_id)?.cpf || '____________________'}</div>
                    <div style={{ marginBottom: '0' }}><strong>ENDEREÇO:</strong> {customers.find(c => c.id === selectedPromissory.customer_id)?.address || '________________________________________________'}</div>
                  </div>

                  {/* Local and date */}
                  <div style={{ fontSize: '8px', marginTop: '4px', textAlign: 'right' }}>
                    Emitido em: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                  </div>

                  {/* Signature */}
                  <div className="signature" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '60%', borderTop: '1px solid #000', marginBottom: '2px' }}></div>
                    <div style={{ fontSize: '8px', fontWeight: 'bold' }}>ASSINATURA DO EMITENTE</div>
                  </div>

                  {/* Legal Footer */}
                  <div className="legal-footer" style={{ borderTop: '1px dashed #ccc' }}>
                    ATENÇÃO: APÓS 90 DIAS DE ATRASO, ESTE TÍTULO PODERÁ SER ENCAMINHADO PARA PROTESTO, COBRANÇA E EXECUÇÃO JUDICIAL.
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BillingAutomationBox;
