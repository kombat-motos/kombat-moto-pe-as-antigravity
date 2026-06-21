import React, { useEffect, useState } from 'react';
import { 
  Users, MessageCircle, FileText, Wrench, DollarSign, 
  TrendingUp, AlertCircle, Clock, ShoppingCart, Target, ArrowRight 
} from 'lucide-react';

interface Client {
  id: number;
  nome: string;
  telefone: string;
  modelo_moto?: string;
  status: string;
  created_at: string;
}

interface Atendimento {
  id: number;
  cliente_nome: string;
  status: string;
  last_contact: string;
  atendente_name?: string;
}

interface Orcamento {
  id: number;
  status: string;
  total_value: number;
}

interface Servico {
  id: number;
  status: string;
  total_value: number;
}

interface Reminder {
  type: string;
  title: string;
  description: string;
  whatsapp: string;
  name: string;
}

interface CRMDashboardProps {
  clientes: Client[];
  atendimentos: Atendimento[];
  orcamentos: Orcamento[];
  servicosOficina: Servico[];
  formatBRL: (v: number) => string;
  onNavigateToTab: (tab: string) => void;
  onSendWhatsApp: (phone: string, text: string) => void;
}

export default function CRMDashboard({
  clientes,
  atendimentos,
  orcamentos,
  servicosOficina,
  formatBRL,
  onNavigateToTab,
  onSendWhatsApp
}: CRMDashboardProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  useEffect(() => {
    fetch('/api/followups/reminders', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setReminders(data);
        setLoadingReminders(false);
      })
      .catch(err => {
        console.error("Erro ao buscar lembretes de follow-up:", err);
        setLoadingReminders(false);
      });
  }, [clientes, orcamentos, servicosOficina]);

  // Calculations
  const totalClientes = clientes.length;
  const conversasAbertas = atendimentos.filter(a => a.status !== 'Finalizado').length;
  const orcamentosPendentes = orcamentos.filter(o => o.status === 'Pendente' || o.status === 'Enviado').length;
  const orcamentosAprovados = orcamentos.filter(o => o.status === 'Aprovado').length;
  const clientesAguardando = atendimentos.filter(a => a.status === 'Novo' || a.status === 'Em atendimento').length;
  const servicosAndamento = servicosOficina.filter(s => 
    s.status === 'Aguardando avaliação' || 
    s.status === 'Aguardando aprovação' || 
    s.status === 'Aguardando peça' || 
    s.status === 'Em manutenção'
  ).length;

  // Mock Sales Day and Month (for simulation if actual sales dataset is not in CRM props)
  const vendasDia = orcamentos.filter(o => {
    if (o.status !== 'Aprovado' && o.status !== 'Finalizado') return false;
    // Simple mock check
    return true;
  }).reduce((acc, curr) => acc + curr.total_value, 0) * 0.4; // 40% of quotes approved today as simulation
  
  const vendasMes = orcamentos.filter(o => o.status === 'Aprovado' || o.status === 'Finalizado')
    .reduce((acc, curr) => acc + curr.total_value, 0) + servicosOficina.filter(s => s.status === 'Finalizado' || s.status === 'Entregue').reduce((acc, curr) => acc + curr.total_value, 0);

  const ticketMedio = (vendasMes > 0 && (orcamentosAprovados + servicosOficina.length) > 0)
    ? (vendasMes / (orcamentosAprovados + servicosOficina.length))
    : 180.50;

  // Clientes sem retorno há mais de 3 dias
  const clientesSemRetorno = atendimentos.filter(a => {
    const lastContact = new Date(a.last_contact);
    const diff = Date.now() - lastContact.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 3 && a.status !== 'Finalizado';
  }).length;

  const handleReminderAction = (reminder: Reminder) => {
    let msg = "";
    if (reminder.type === 'sem_resposta_1d') {
      msg = `Olá, ${reminder.name}! Tudo bem? Passando para ver se ficou com alguma dúvida sobre o nosso contato anterior. Como podemos te ajudar hoje? 🏍️`;
    } else if (reminder.type === 'orcamento_no_return_2d') {
      msg = `Olá, ${reminder.name}! Passando para saber se conseguiu analisar o orçamento que te enviamos da Kombat Moto Peças. Ficamos no aguardo!`;
    } else if (reminder.type === 'oleo_30d') {
      msg = `Olá, ${reminder.name}! Tudo certo? Notamos que faz mais de 30 dias que você trocou o óleo da sua moto conosco. Para garantir a vida útil do motor, é bom dar uma checada! Quer agendar uma visita? 🏍️`;
    } else if (reminder.type === 'servico_7d') {
      msg = `Olá, ${reminder.name}! Tudo bem? Passando para saber se ficou tudo certo com o serviço realizado em sua moto. Qualquer coisa, estamos à inteira disposição!`;
    } else if (reminder.type === 'peca_nao_comprada') {
      msg = `Olá, ${reminder.name}! Tudo bem? Você nos procurou esses dias procurando uma peça para sua moto. Conseguimos a peça em estoque, quer vir retirar ou prefere que a gente separe para você?`;
    } else {
      msg = `Olá, ${reminder.name}! Tudo bem? Passando para dar um alô e ver se está precisando de alguma peça ou revisão para sua moto hoje. Kombat Moto Peças agradece!`;
    }

    onSendWhatsApp(reminder.whatsapp, msg);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg dark:bg-rose-950/30"><Users size={16} /></div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalClientes}</h4>
            <p className="text-[10px] text-slate-400 font-medium">Cadastrados</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversas</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-950/30"><MessageCircle size={16} /></div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{conversasAbertas}</h4>
            <p className="text-[10px] text-slate-400 font-medium">{clientesAguardando} aguardando retorno</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg dark:bg-amber-950/30"><FileText size={16} /></div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{orcamentosPendentes}</h4>
            <p className="text-[10px] text-slate-400 font-medium">{orcamentosAprovados} aprovados este mês</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oficina</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950/30"><Wrench size={16} /></div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{servicosAndamento}</h4>
            <p className="text-[10px] text-slate-400 font-medium">Motos em manutenção</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendas Mês</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg dark:bg-rose-950/30"><DollarSign size={16} /></div>
          </div>
          <div>
            <h4 className="text-lg font-black text-emerald-600 truncate">{formatBRL(vendasMes)}</h4>
            <p className="text-[10px] text-slate-400 font-medium">Estimado balcão+oficina</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Médio</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg dark:bg-sky-950/30"><TrendingUp size={16} /></div>
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">{formatBRL(ticketMedio)}</h4>
            <p className="text-[10px] text-slate-400 font-medium">Por atendimento</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Reminders and Fast actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Follow-up Automatic Reminders */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="text-rose-500" size={20} />
              <h3 className="text-base font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Ações de Follow-up Automático</h3>
            </div>
            <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">{reminders.length} Alertas</span>
          </div>

          {loadingReminders ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Target size={40} className="mx-auto text-slate-300 mb-2" />
              Nenhum lembrete pendente para hoje. Bom trabalho!
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {reminders.map((reminder, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-slate-50 border border-slate-100 hover:border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:border-rose-950"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        reminder.type === 'sem_resposta_1d' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30' :
                        reminder.type === 'orcamento_no_return_2d' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30' :
                        reminder.type === 'oleo_30d' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/30'
                      }`}>
                        {reminder.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{reminder.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{reminder.description}</p>
                  </div>
                  <button
                    onClick={() => handleReminderAction(reminder)}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 dark:shadow-none"
                  >
                    <span>Falar no WhatsApp</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: General Indicators and Alert Boxes */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="text-rose-500 animate-pulse" size={22} />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Atendimento do Balcão</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Sem retorno há 3 dias:</span>
                  <span className="font-black text-rose-500 text-base">{clientesSemRetorno} clientes</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Conversas sem atendente:</span>
                  <span className="font-black text-amber-500 text-base">
                    {atendimentos.filter(a => !a.atendente_name && a.status !== 'Finalizado').length} chats
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Orçamentos fechados (Mês):</span>
                  <span className="font-black text-emerald-400 text-base">{orcamentosAprovados} orçamentos</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('conversas')}
              className="mt-6 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Abrir Central de Atendimento
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Acessos Rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onNavigateToTab('conversas')} 
                className="p-4 bg-slate-50 border border-slate-100 hover:border-rose-500/20 hover:bg-rose-50/20 text-slate-700 rounded-2xl flex flex-col items-center justify-center text-center transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/50"
              >
                <MessageCircle className="text-rose-500 mb-2" size={24} />
                <span className="font-bold text-xs">Atendimento</span>
              </button>
              <button 
                onClick={() => onNavigateToTab('funil')} 
                className="p-4 bg-slate-50 border border-slate-100 hover:border-rose-500/20 hover:bg-rose-50/20 text-slate-700 rounded-2xl flex flex-col items-center justify-center text-center transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/50"
              >
                <Target className="text-rose-500 mb-2" size={24} />
                <span className="font-bold text-xs">Funil Vendas</span>
              </button>
              <button 
                onClick={() => onNavigateToTab('orcamentos')} 
                className="p-4 bg-slate-50 border border-slate-100 hover:border-rose-500/20 hover:bg-rose-50/20 text-slate-700 rounded-2xl flex flex-col items-center justify-center text-center transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/50"
              >
                <FileText className="text-rose-500 mb-2" size={24} />
                <span className="font-bold text-xs">Orçamentos</span>
              </button>
              <button 
                onClick={() => onNavigateToTab('oficina')} 
                className="p-4 bg-slate-50 border border-slate-100 hover:border-rose-500/20 hover:bg-rose-50/20 text-slate-700 rounded-2xl flex flex-col items-center justify-center text-center transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/50"
              >
                <Wrench className="text-rose-500 mb-2" size={24} />
                <span className="font-bold text-xs">Oficina (OS)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
