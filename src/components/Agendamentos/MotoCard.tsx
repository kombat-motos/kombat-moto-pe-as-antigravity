import React, { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Clock, Calendar, CheckCircle, Wrench, AlertTriangle, Truck, MapPin, Search, Phone } from 'lucide-react';

interface MotoCardProps {
  agendamento: any;
  onClick: () => void;
  onWhatsApp: (phone: string, msg: string) => void;
}

export const MotoCard: React.FC<MotoCardProps> = ({ agendamento, onClick, onWhatsApp }) => {
  const diffDays = useMemo(() => {
    if (!agendamento.data_entrada) return null;
    const end = agendamento.data_saida ? new Date(agendamento.data_saida) : new Date();
    const start = new Date(agendamento.data_entrada);
    return differenceInDays(end, start);
  }, [agendamento.data_entrada, agendamento.data_saida]);

  const getPatioStatus = (days: number | null) => {
    if (days === null) return null;
    if (days <= 2) return { color: 'bg-emerald-500', text: '0-2 dias' };
    if (days <= 5) return { color: 'bg-yellow-400', text: '3-5 dias' };
    if (days <= 10) return { color: 'bg-orange-500', text: '6-10 dias' };
    return { color: 'bg-rose-600', text: 'mais de 10 dias' };
  };

  const patio = getPatioStatus(diffDays);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'AGENDADA': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'AGUARDANDO BUSCA': 
      case 'SAINDO PARA BUSCAR': return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'RECEBIDA NA OFICINA': return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'AGUARDANDO SERVIÇO': 
      case 'AGUARDANDO AVALIAÇÃO': return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'EM SERVIÇO': return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'AGUARDANDO PEÇA': return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'PRONTA': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'PARA ENTREGAR': return 'bg-teal-50 text-teal-700 border-teal-300';
      case 'ENTREGUE / FINALIZADA': return 'bg-slate-800 text-white border-slate-900';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const isLate = agendamento.previsao_conclusao && new Date(agendamento.previsao_conclusao) < new Date() && !['PRONTA', 'ENTREGUE / FINALIZADA', 'CANCELADA'].includes(agendamento.status);

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 ${isLate ? 'border-rose-300' : 'border-slate-200'}`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getStatusStyle(agendamento.status)}`}>
              {agendamento.status}
            </span>
            {isLate && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertTriangle size={10} /> ATRASADO
              </span>
            )}
            {agendamento.prioridade === 'URGENTE' && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                URGENTE
              </span>
            )}
          </div>
          
          <h3 className="font-black text-slate-800 text-lg">
            {agendamento.moto_model || 'Moto não informada'} {agendamento.moto_plate ? `- ${agendamento.moto_plate}` : ''}
          </h3>
          <p className="text-sm font-medium text-slate-500">{agendamento.customer_name}</p>
        </div>
        
        {patio && (
          <div className="flex flex-col items-end">
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1">No Pátio</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${patio.color} shadow-sm border border-black/10`} />
              <span className={`text-xs font-bold ${diffDays !== null && diffDays > 10 ? 'text-rose-600' : 'text-slate-600'}`}>
                {diffDays} dias
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PEDIDO */}
      {agendamento.solicitacao_cliente && (
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1">
            <Wrench size={10} /> Pedido do Cliente
          </p>
          <p className="text-sm text-slate-700 line-clamp-2 leading-tight">
            {agendamento.solicitacao_cliente}
          </p>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar size={13} className={isLate ? 'text-rose-500' : ''} />
            <span className={isLate ? 'text-rose-600 font-bold' : ''}>
              {agendamento.data_agendamento.split('-').reverse().join('/')} 
              {agendamento.horario_agendamento ? ` às ${agendamento.horario_agendamento}` : ''}
            </span>
          </div>
          
          {agendamento.modo_chegada === 'KOMBAT_BUSCA' && agendamento.status === 'AGENDADA' && (
            <div className="flex items-center gap-1.5 text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-md">
              <Truck size={13} /> Buscar Moto
            </div>
          )}
        </div>

        {agendamento.whatsapp && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onWhatsApp(agendamento.whatsapp, `Olá ${agendamento.customer_name.split(' ')[0]}, referente ao seu agendamento na Kombat Moto Peças...`);
            }}
            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Phone size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
