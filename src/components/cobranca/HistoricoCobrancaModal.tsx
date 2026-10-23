// src/components/cobranca/HistoricoCobrancaModal.tsx
// Linha do tempo e auditoria completa de cobranças, acordos e pagamentos do cliente

import React, { useState, useEffect } from 'react';
import { 
  X, Clock, MessageSquare, DollarSign, Handshake, AlertTriangle, 
  CheckCircle, FileText, UserCheck, ShieldAlert 
} from 'lucide-react';
import { CustomerDebtGroup, CollectionHistoryItem } from './types';
import { formatDateBR, formatCurrencyBRL } from './defaultTemplates';

interface HistoricoCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDebtGroup | null;
}

export const HistoricoCobrancaModal: React.FC<HistoricoCobrancaModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [history, setHistory] = useState<CollectionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      fetch(`/api/collections/history/${customer.customer_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setHistory(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const getActionBadge = (item: CollectionHistoryItem) => {
    const act = (item.action_type || '').toUpperCase();
    const st = (item.status || '').toUpperCase();

    if (act.includes('PAGAMENTO')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
          <DollarSign size={10} /> Pagamento Recebido
        </span>
      );
    }
    if (act.includes('ACORDO')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
          <Handshake size={10} /> Acordo Firmado
        </span>
      );
    }
    if (act.includes('BLOQUEIO')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
          <ShieldAlert size={10} /> Bloqueio de Crédito
        </span>
      );
    }
    if (act.includes('LIBERACAO') || act.includes('DESBLOQUEIO')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
          <CheckCircle size={10} /> Crédito Liberado
        </span>
      );
    }

    if (st === 'ENVIADA') {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
          <CheckCircle size={10} /> Cobrança Enviada
        </span>
      );
    }
    if (st === 'ABERTA_WHATSAPP') {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
          <MessageSquare size={10} /> Aberta no WhatsApp
        </span>
      );
    }
    if (st === 'FALHOU') {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
          <AlertTriangle size={10} /> Tentativa Falhou
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
        <Clock size={10} /> {item.action_type || 'Ação'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Histórico &amp; Auditoria de Cobrança</h3>
              <p className="text-xs text-slate-400">Linha do tempo cronológica de contatos e movimentações</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Customer info */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-white text-sm">{customer.customer_name}</p>
              <p className="text-xs text-slate-400">WhatsApp: {customer.whatsapp || customer.phone || 'N/A'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Situação Cadastral</span>
              <p className={`text-xs font-black ${customer.credit_status.includes('BLOQUEADO') ? 'text-rose-400' : 'text-emerald-400'}`}>
                {customer.credit_status}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium">Carregando linha do tempo...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500">
              Nenhuma ação de cobrança ou histórico registrado para este cliente ainda.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
              {history.map(item => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-slate-600 group-hover:border-rose-500 transition-colors"></div>

                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 hover:border-slate-600 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {getActionBadge(item)}
                        {item.channel && (
                          <span className="text-[10px] text-slate-400">via {item.channel}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateBR(item.created_at)}
                      </span>
                    </div>

                    {item.message && (
                      <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 font-sans">
                        {item.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
};
