import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldAlert, AlertTriangle, Clock, Search, Send, FileText, CheckCircle, Phone, MessageCircle, Check, Printer } from 'lucide-react';

export default function CentralCobranca({ 
  customers, 
  credits,
  onPrintReceipt,
  fetchCredits
}: any) {
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const stats = useMemo(() => {
    let aReceber = 0;
    let venceHoje = 0;
    let vence3Dias = 0;
    let vencidos = 0;
    let atrasados30 = 0;
    let bloqueados = customers.filter((c: any) => c.credit_status?.includes('BLOQUEADO')).length;

    const today = new Date();
    today.setHours(0,0,0,0);

    credits.forEach((c: any) => {
      if (c.status === 'Aberto' || c.status === 'Pendente') {
        const saldo = c.original_value - (c.paid_value || 0);
        aReceber += saldo;
        
        const [year, month, day] = c.due_date.split('T')[0].split('-').map(Number);
        const due = new Date(year, month - 1, day);
        const diff = differenceInDays(due, today);

        if (diff === 0) venceHoje += saldo;
        else if (diff > 0 && diff <= 3) vence3Dias += saldo;
        else if (diff < 0) {
          vencidos += saldo;
          if (diff <= -30) atrasados30 += saldo;
        }
      }
    });

    return { aReceber, venceHoje, vence3Dias, vencidos, atrasados30, bloqueados };
  }, [credits, customers]);

  const filteredCredits = useMemo(() => {
    let list = credits.filter((c: any) => c.status === 'Aberto' || c.status === 'Pendente');
    const today = new Date();
    today.setHours(0,0,0,0);

    // Apply specific filter
    if (filter === 'A vencer') {
      list = list.filter((c: any) => {
        const [y, m, d] = c.due_date.split('T')[0].split('-').map(Number);
        return differenceInDays(new Date(y, m - 1, d), today) > 0;
      });
    } else if (filter === 'Vence hoje') {
      list = list.filter((c: any) => {
        const [y, m, d] = c.due_date.split('T')[0].split('-').map(Number);
        return differenceInDays(new Date(y, m - 1, d), today) === 0;
      });
    } else if (filter === 'Vencidos') {
      list = list.filter((c: any) => {
        const [y, m, d] = c.due_date.split('T')[0].split('-').map(Number);
        return differenceInDays(new Date(y, m - 1, d), today) < 0;
      });
    } else if (filter === '+30 dias atraso') {
      list = list.filter((c: any) => {
        const [y, m, d] = c.due_date.split('T')[0].split('-').map(Number);
        return differenceInDays(new Date(y, m - 1, d), today) <= -30;
      });
    }

    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((c: any) => {
      const customer = customers.find((cust: any) => cust.id === c.customer_id);
      return customer?.name.toLowerCase().includes(term) || (c.identifier || '').toLowerCase().includes(term);
    });
  }, [credits, filter, searchTerm, customers]);

  const getCustomerWhatsapp = (customerId?: number) => {
    if (!customerId) return '';
    const customer = customers.find((c:any) => c.id === customerId);
    return customer?.whatsapp || '';
  };

  const generateWhatsAppLink = (phoneNumber: string, message: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 10) return '';
    const encodedMessage = encodeURIComponent(message);
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    return `https://wa.me/${finalNumber}?text=${encodedMessage}`;
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string, message: string) => {
    e.preventDefault();
    const link = generateWhatsAppLink(phone, message);
    if (!link) {
      alert('⚠️ OPA! Este cliente não possui um número de celular válido cadastrado.');
      return;
    }
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-600" size={28} />
            Central de Cobrança
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Controle de inadimplência, automação de réguas e bloqueio de crédito.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400">Total a Receber</p>
          <p className="text-lg font-black text-slate-700">R$ {stats.aReceber.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-[10px] uppercase font-black text-amber-600">Vence Hoje</p>
          <p className="text-lg font-black text-amber-700">R$ {stats.venceHoje.toFixed(2)}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
          <p className="text-[10px] uppercase font-black text-rose-600">Vencidos</p>
          <p className="text-lg font-black text-rose-700">R$ {stats.vencidos.toFixed(2)}</p>
        </div>
        <div className="bg-rose-100 p-4 rounded-xl border border-rose-300 shadow-sm">
          <p className="text-[10px] uppercase font-black text-rose-800">+30 Dias Atraso</p>
          <p className="text-lg font-black text-rose-900">R$ {stats.atrasados30.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-900 shadow-sm">
          <p className="text-[10px] uppercase font-black text-slate-400">Créditos Bloqueados</p>
          <p className="text-lg font-black text-white">{stats.bloqueados} clientes</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
           <div className="flex gap-2 flex-wrap">
             {['Todos', 'A vencer', 'Vence hoje', 'Vencidos', '+30 dias atraso'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                   filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                 }`}
               >
                 {f}
               </button>
             ))}
           </div>
           
           <div className="relative group w-full md:w-80">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
               <Search size={18} />
             </div>
             <input
               type="text"
               placeholder="Buscar cliente..."
               className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
         </div>

         {filteredCredits.length === 0 ? (
           <div className="text-center py-12 text-slate-400 font-medium">Nenhum crédito encontrado para este filtro.</div>
         ) : (
           <div className="space-y-4">
             {filteredCredits.map((credit: any) => {
               const customer = customers.find((c:any) => c.id === credit.customer_id);
               const customerWhatsapp = getCustomerWhatsapp(credit.customer_id);
               const dueDate = new Date(credit.due_date);
               const today = new Date();
               today.setHours(0,0,0,0);
               const diffDays = differenceInDays(dueDate, today);
               const saldo = credit.original_value - (credit.paid_value || 0);

               const isOverdue = diffDays < 0;
               const isDueToday = diffDays === 0;

               let message = `Olá ${customer?.name.split(' ')[0]}, lembramos que sua fatura/nota ${credit.identifier} no valor de R$ ${saldo.toFixed(2)} `;
               if (isOverdue) message += `venceu há ${Math.abs(diffDays)} dias. Por favor, regularize.`;
               else if (isDueToday) message += `vence HOJE.`;
               else message += `vence em ${diffDays} dias.`;

               return (
                 <div key={credit.id} className="border border-slate-300 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between hover:border-slate-400 transition-colors gap-4">
                   <div className="flex-1">
                     <div className="flex items-center gap-2">
                       <p className="font-bold text-slate-800">{customer?.name}</p>
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{credit.identifier || `#${credit.id}`}</span>
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                       <div>
                         <p className="text-[10px] text-slate-400 uppercase font-black">Valor Original</p>
                         <p className="font-bold text-slate-700 text-sm">R$ {credit.original_value.toFixed(2)}</p>
                       </div>
                       {credit.paid_value > 0 && (
                         <div>
                           <p className="text-[10px] text-emerald-500 uppercase font-black">Já Pago</p>
                           <p className="font-bold text-emerald-600 text-sm">R$ {credit.paid_value.toFixed(2)}</p>
                         </div>
                       )}
                       <div>
                         <p className="text-[10px] text-rose-500 uppercase font-black">Pendente</p>
                         <p className="font-bold text-rose-600 text-sm">R$ {saldo.toFixed(2)}</p>
                       </div>
                     </div>
                   </div>

                   <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                     <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${
                       isOverdue ? 'bg-rose-50 border-rose-200 text-rose-600' : 
                       isDueToday ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                       'bg-emerald-50 border-emerald-200 text-emerald-600'
                     }`}>
                       <span className="text-[10px] font-black uppercase tracking-wider mb-0.5">Vencimento</span>
                       <span className="text-sm font-black text-center whitespace-nowrap">
                         {format(dueDate, 'dd/MM/yyyy')}
                       </span>
                       <span className="text-[9px] font-bold mt-0.5 whitespace-nowrap">
                         {isDueToday ? "VENCE HOJE" : isOverdue ? `ATRASADO ${Math.abs(diffDays)}D` : `FALTAM ${diffDays}D`}
                       </span>
                     </div>

                     <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => handleWhatsAppClick(e, customerWhatsapp, message)}
                          className={`flex items-center justify-center gap-2 px-3 py-2 text-white text-xs rounded-lg font-bold shadow-sm ${
                            isOverdue ? 'bg-rose-500 hover:bg-rose-600' : isDueToday ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-500 hover:bg-slate-600'
                          }`}
                        >
                          <Send size={14} /> WhatsApp
                        </button>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         )}
      </div>
    </div>
  );
}
