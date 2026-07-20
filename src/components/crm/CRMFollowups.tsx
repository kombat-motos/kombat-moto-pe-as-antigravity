import React, { useEffect, useState } from 'react';
import { Clock, Search, Send, CheckCircle, RefreshCw } from 'lucide-react';

interface Reminder {
  type: string;
  title: string;
  description: string;
  whatsapp: string;
  name: string;
}

interface CRMFollowupsProps {
  onSendWhatsApp: (phone: string, text: string) => void;
}

export default function CRMFollowups({ onSendWhatsApp }: CRMFollowupsProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = () => {
    setLoading(true);
    fetch('/api/followups/reminders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setReminders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleReminderAction = (reminder: Reminder) => {
    let msg = "";
    if (reminder.type === 'sem_resposta_1d') {
      msg = `Olá, ${reminder.name}! Tudo bem? Passando para ver se ficou com alguma dúvida sobre o nosso contato anterior. Como podemos te ajudar hoje? 🏍️`;
    } else if (reminder.type === 'orcamento_no_return_2d') {
      msg = `Olá, ${reminder.name}! Passando para saber se conseguiu analisar o orçamento que te enviamos da Kombat Moto Peças. Ficamos no aguardo!`;
    } else if (reminder.type === 'oleo_30d') {
      msg = `Olá, ${reminder.name}! Tudo certo? Notamos que faz mais de 30 dias que você trocou o óleo da sua moto conosco. Para garantir a vida útil do motor, é bom dar uma checada! Quer agendar uma revisão? 🏍️`;
    } else if (reminder.type === 'servico_7d') {
      msg = `Olá, ${reminder.name}! Tudo bem? Passando para saber se ficou tudo certo com o serviço realizado em sua moto. Qualquer coisa, estamos à inteira disposição!`;
    } else if (reminder.type === 'peca_nao_comprada') {
      msg = `Olá, ${reminder.name}! Tudo bem? Você nos procurou esses dias procurando uma peça para sua moto. Conseguimos a peça em estoque, quer vir retirar ou prefere que a gente separe para você?`;
    } else {
      msg = `Olá, ${reminder.name}! Tudo bem? Passando para dar um alô e ver se está precisando de alguma peça ou revisão para sua moto hoje. Kombat Moto Peças agradece!`;
    }

    onSendWhatsApp(reminder.whatsapp, msg);
  };

  const filteredReminders = reminders.filter(r => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      r.name.toLowerCase().includes(term) ||
      r.title.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term);

    if (filterType !== 'todos') {
      return matchesSearch && r.type === filterType;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and filters */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar lembretes por nome ou descrição..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <button
            onClick={fetchReminders}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={14} />
            <span>Atualizar Fila</span>
          </button>
        </div>

        {/* Filter categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === 'todos' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Todos ({reminders.length})
          </button>
          <button
            onClick={() => setFilterType('sem_resposta_1d')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === 'sem_resposta_1d' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Aguardando Retorno ({reminders.filter(r => r.type === 'sem_resposta_1d').length})
          </button>
          <button
            onClick={() => setFilterType('orcamento_no_return_2d')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === 'orcamento_no_return_2d' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Orçamentos Pendentes ({reminders.filter(r => r.type === 'orcamento_no_return_2d').length})
          </button>
          <button
            onClick={() => setFilterType('oleo_30d')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === 'oleo_30d' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Troca de Óleo (&gt;30 dias) ({reminders.filter(r => r.type === 'oleo_30d').length})
          </button>
          <button
            onClick={() => setFilterType('servico_7d')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === 'servico_7d' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Pós-Serviço (7 dias) ({reminders.filter(r => r.type === 'servico_7d').length})
          </button>
          <button
            onClick={() => setFilterType('peca_nao_comprada')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === 'peca_nao_comprada' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Peça sem Fechamento ({reminders.filter(r => r.type === 'peca_nao_comprada').length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-5">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
            Nenhuma ação de follow-up necessária para este filtro. Excelente trabalho!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
            {filteredReminders.map((reminder, idx) => (
              <div 
                key={idx} 
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      reminder.type === 'sem_resposta_1d' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30' :
                      reminder.type === 'orcamento_no_return_2d' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30' :
                      reminder.type === 'oleo_30d' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-950/30'
                    }`}>
                      {reminder.type.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">{reminder.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{reminder.description}</p>
                </div>
                
                <button
                  onClick={() => handleReminderAction(reminder)}
                  className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 dark:shadow-none"
                >
                  <Send size={12} />
                  <span>Chamar WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
