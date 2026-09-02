import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, PlayCircle, Truck, Package, Wrench, XCircle, ArrowRight, Calendar } from 'lucide-react';

interface TimelineProps {
  agendamentoId: number;
}

export const AgendamentoTimeline: React.FC<TimelineProps> = ({ agendamentoId }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/agendamentos/${agendamentoId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (isMounted) setHistory([]);
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching history", err);
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (agendamentoId) {
      fetchHistory();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [agendamentoId]);

  if (loading) return <div className="text-center py-4 text-sm text-slate-500">Carregando histórico...</div>;
  if (!Array.isArray(history) || history.length === 0) return <div className="text-center py-4 text-sm text-slate-500">Nenhum histórico encontrado.</div>;

  const getIcon = (status: string) => {
    switch (status) {
      case 'AGENDADA': return <Calendar size={16} className="text-slate-500" />;
      case 'AGUARDANDO BUSCA': 
      case 'SAINDO PARA BUSCAR': return <Truck size={16} className="text-sky-500" />;
      case 'RECEBIDA NA OFICINA': return <Package size={16} className="text-purple-500" />;
      case 'EM SERVIÇO': return <Wrench size={16} className="text-blue-500" />;
      case 'AGUARDANDO PEÇA': return <Clock size={16} className="text-rose-500" />;
      case 'PRONTA': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'CANCELADA': return <XCircle size={16} className="text-red-500" />;
      default: return <PlayCircle size={16} className="text-slate-400" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return format(d, "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {Array.isArray(history) && history.map((item, index) => (
        <div key={item.id || index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 z-10`}>
              {getIcon(item.status_novo)}
            </div>
            {index !== history.length - 1 && <div className="w-px h-full bg-slate-200 -my-2" />}
          </div>
          <div className="pb-4">
            <p className="text-[10px] font-black uppercase text-slate-400">
              {formatDate(item.created_at || item.data_alteracao)} • {item.user_name || 'Sistema'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {item.status_anterior && (
                <>
                  <span className="text-xs text-slate-500 line-through">{item.status_anterior}</span>
                  <ArrowRight size={12} className="text-slate-300" />
                </>
              )}
              <span className="text-sm font-bold text-slate-800">{item.status_novo}</span>
            </div>
            {item.observacao && (
              <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {item.observacao}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
