import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Pencil, X, Check, Printer } from 'lucide-react';

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

const BillingAutomationBox: React.FC<BillingAutomationBoxProps> = ({ pendingSales, customers, companyData, onUpdateDueDate }) => {
  const [editingSaleId, setEditingSaleId] = React.useState<string | null>(null);
  const [tempDueDate, setTempDueDate] = React.useState<string>('');
  const [editingChargesId, setEditingChargesId] = React.useState<string | null>(null);
  const [tempRates, setTempRates] = React.useState({ fine: 2, interest: 1 });
  const [selectedPromissory, setSelectedPromissory] = React.useState<any>(null);

  const handlePrintPromissory = (sale: any) => {
    setSelectedPromissory(sale);
    setTimeout(() => {
      const content = document.getElementById('promissory-note-print');
      if (content) {
        const win = window.open('', '', 'height=600,width=800');
        win?.document.write('<html><head><title>Nota Promissória</title>');
        win?.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } }</style>');
        win?.document.write('</head><body style="margin:0;padding:20px;font-family:sans-serif;">');
        win?.document.write(content.innerHTML);
        win?.document.write('</body></html>');
        win?.document.close();
        win?.focus();
        setTimeout(() => {
          win?.print();
          win?.close();
        }, 250);
      }
    }, 100);
  };

  const getCustomerWhatsapp = (customerId?: number) => {
    if (!customerId) return '';
    const customer = customers.find(c => c.id === customerId);
    return customer?.whatsapp || '';
  };

  const generateWhatsAppLink = (phoneNumber: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };

  const getNotificationMessage = (sale: Sale, type: 'before' | 'on' | 'after') => {
    const customerName = sale.customer_name;
    const total = sale.total.toFixed(2);
    const dueDate = sale.due_date ? format(new Date(sale.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';

    let message = `Olá ${customerName},\n`;

    switch (type) {
      case 'before':
        message += `Este é um lembrete amigável de que sua fatura no valor de R$ ${total} vence em ${dueDate}.`;
        break;
      case 'on':
        message += `Sua fatura no valor de R$ ${total} vence hoje, ${dueDate}.`;
        break;
      case 'after':
        message += `Sua fatura no valor de R$ ${total} venceu em ${dueDate}. Por favor, regularize o pagamento o mais breve possível.`;
        break;
    }
    message += `\n\nObrigado!\nKombat Moto Peças`;
    return message;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-2xl shadow-md col-span-2"
    >
      <h2 className="text-xl font-bold text-slate-800 mb-4">Automação de Cobrança</h2>

      {pendingSales.length === 0 ? (
        <p className="text-slate-500">Nenhuma cobrança pendente no momento.</p>
      ) : (
        <div className="space-y-4">
          {pendingSales.map(sale => {
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
              <div key={sale.id} className="border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-rose-200 transition-colors group">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800">{sale.customer_name}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">#{sale.id}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <div>
                      <p className="text-xs text-slate-400">Valor Original</p>
                      <p className="font-medium text-slate-700">R$ {sale.total.toFixed(2)}</p>
                    </div>
                    {totalWithCharges > sale.total && (
                      <div>
                        <p className="text-xs text-rose-400">Total com Encargos</p>
                        <p className="font-bold text-rose-600">R$ {totalWithCharges.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="relative group/rates">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
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
                            className="w-12 text-[10px] border border-slate-200 rounded px-1"
                            value={tempRates.fine}
                            onChange={(e) => setTempRates({ ...tempRates, fine: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-[10px]">%</span>
                          <input
                            type="number"
                            className="w-12 text-[10px] border border-slate-200 rounded px-1"
                            value={tempRates.interest}
                            onChange={(e) => setTempRates({ ...tempRates, interest: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-[10px]">%</span>
                          <button onClick={() => setEditingChargesId(null)} className="p-0.5 text-emerald-600"><Check size={12} /></button>
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-500">{fineRate}% M. / {interestRate}% J.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1">
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
                      onClick={() => handlePrintPromissory(sale)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs rounded-lg hover:bg-amber-200 transition-colors font-bold border border-amber-200"
                    >
                      <Printer size={14} />
                      Promissória
                    </button>
                    <a
                      href={generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, notificationType || 'on'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs rounded-lg transition-colors font-bold ${notificationType === 'after' ? 'bg-rose-500 hover:bg-rose-600' :
                        notificationType === 'on' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500 hover:bg-slate-600'
                        }`}
                    >
                      <Send size={14} />
                      Cobrar Agora
                    </a>
                  </div>

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
        {selectedPromissory && (
          <div style={{
            width: '100%',
            maxWidth: '18cm',
            padding: '1.5cm',
            backgroundColor: '#fffbe6',
            border: '2px solid #5d4037',
            borderRadius: '8px',
            color: '#2d2d2d',
            fontFamily: 'serif',
            position: 'relative',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #5d4037', paddingBottom: '10px', marginBottom: '20px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>NOTA PROMISSÓRIA</h1>
              <div style={{ border: '2px solid #5d4037', padding: '5px 15px', fontWeight: 'bold' }}>
                VENCIMENTO: {selectedPromissory.due_date ? format(new Date(selectedPromissory.due_date), 'dd/MM/yyyy') : '___/___/_____'}
              </div>
            </div>

            <div style={{ fontSize: '18px', lineHeight: '1.8', textAlign: 'justify' }}>
              No dia <strong>{selectedPromissory.due_date ? format(new Date(selectedPromissory.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '__________________'}</strong>,
              pagarei(emos) por esta via única de NOTA PROMISSÓRIA a <strong>{companyData.nomeFantasia.toUpperCase()}</strong> ou à sua ordem, a quantia de
              <strong> R$ {selectedPromissory.total.toFixed(2)}</strong> (<em>{valorPorExtenso(selectedPromissory.total)}</em>),
              em moeda corrente deste país.
            </div>

            <div style={{ marginTop: '40px', padding: '15px', border: '1px solid #dcdcdc' }}>
              <div style={{ marginBottom: '10px' }}><strong>EMITENTE:</strong> {selectedPromissory.customer_name.toUpperCase()}</div>
              <div style={{ marginBottom: '10px' }}><strong>CPF/CNPJ:</strong> {customers.find(c => c.id === selectedPromissory.customer_id)?.cpf || '____________________'}</div>
              <div style={{ marginBottom: '10px' }}><strong>ENDEREÇO:</strong> {customers.find(c => c.id === selectedPromissory.customer_id)?.address || '________________________________________________'}</div>
            </div>

            <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '300px', borderTop: '1px solid #000', marginBottom: '5px' }}></div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>ASSINATURA DO EMITENTE</div>
            </div>

            <div style={{ position: 'absolute', bottom: '10px', right: '20px', fontSize: '10px', color: '#888' }}>
              ID: {selectedPromissory.id} - Emitido em {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BillingAutomationBox;
