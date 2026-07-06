import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Pencil, X, Check } from 'lucide-react';

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
}

interface BillingAutomationBoxProps {
  pendingSales: Sale[];
  customers: Customer[];
  onUpdateDueDate: (saleId: string, newDate: string) => void;
}

const BillingAutomationBox: React.FC<BillingAutomationBoxProps> = ({ pendingSales, customers, onUpdateDueDate }) => {
  const [editingSaleId, setEditingSaleId] = React.useState<string | null>(null);
  const [tempDueDate, setTempDueDate] = React.useState<string>('');

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
            const customerWhatsapp = getCustomerWhatsapp(sale.customer_id);
            const dueDate = sale.due_date ? new Date(sale.due_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

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
                
                // Rule: Fines and interest after 30 days
                if (diffDays > 30) {
                  const fine = sale.total * 0.02; // 2% fine
                  const monthlyInterest = 0.01; // 1% per month
                  const dailyInterest = monthlyInterest / 30;
                  const interest = sale.total * dailyInterest * diffDays;
                  totalWithCharges = sale.total + fine + interest;
                  chargesDescription = `(Inclui multa de 2% e juros de 1% a.m. por ${diffDays} dias de atraso)`;
                }
              }
            }

            return (
              <div key={sale.id} className="border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">{sale.customer_name}</p>
                  <p className="text-sm text-slate-500">
                    Valor Original: R$ {sale.total.toFixed(2)}
                    {totalWithCharges > sale.total && (
                      <span className="ml-2 text-rose-600 font-bold">
                        → Atualizado: R$ {totalWithCharges.toFixed(2)}
                      </span>
                    )}
                  </p>
                  {chargesDescription && <p className="text-[10px] text-rose-500 italic">{chargesDescription}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-400">Vencimento: {sale.due_date ? format(new Date(sale.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
                    {editingSaleId === sale.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="date"
                          className="text-xs border border-slate-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-emerald-500"
                          value={tempDueDate}
                          onChange={(e) => setTempDueDate(e.target.value)}
                        />
                        <button 
                          onClick={() => {
                            onUpdateDueDate(sale.id, tempDueDate);
                            setEditingSaleId(null);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => setEditingSaleId(null)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingSaleId(sale.id);
                          setTempDueDate(sale.due_date ? new Date(sale.due_date).toISOString().split('T')[0] : '');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Editar data de vencimento"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'on'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                    title="Envio Manual WhatsApp"
                  >
                    <MessageCircle size={16} />
                    Manual
                  </a>
                  {notificationType === 'before' && (
                    <a
                      href={generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'before'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Send size={16} />
                      2 dias antes
                    </a>
                  )}
                  {notificationType === 'on' && (
                    <a
                      href={generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'on'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <Send size={16} />
                      No Vencimento
                    </a>
                  )}
                  {notificationType === 'after' && (
                    <a
                      href={generateWhatsAppLink(customerWhatsapp, getNotificationMessage(sale, 'after'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Send size={16} />
                      Após Vencimento
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default BillingAutomationBox;
