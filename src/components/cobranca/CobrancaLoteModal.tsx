// src/components/cobranca/CobrancaLoteModal.tsx
// Envio de Cobranças em Lote Assistido - "COBRAR CLIENTES SELECIONADOS"

import React, { useState } from 'react';
import { 
  X, Send, CheckCircle, AlertTriangle, UserCheck, 
  Phone, ArrowRight, ShieldCheck, CheckSquare, Square, 
  ExternalLink, RefreshCw 
} from 'lucide-react';
import { CustomerDebtGroup, WhatsAppTemplate } from './types';
import { 
  buildWhatsAppMessage, 
  validateWhatsAppNumber, 
  createWhatsAppUrl, 
  formatCurrencyBRL 
} from './defaultTemplates';

interface CobrancaLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customersWithDebts: CustomerDebtGroup[];
  customTemplates?: Record<string, WhatsAppTemplate>;
  pixKey?: string;
  onBatchComplete?: () => void;
}

export const CobrancaLoteModal: React.FC<CobrancaLoteModalProps> = ({
  isOpen,
  onClose,
  customersWithDebts,
  customTemplates,
  pixKey,
  onBatchComplete
}) => {
  // Only include customers with overdue balance and positive debt
  const eligibleCustomers = customersWithDebts.filter(c => c.total_balance > 0);

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(() => 
    eligibleCustomers.map(c => c.customer_id)
  );

  // Queue state
  const [isQueueActive, setIsQueueActive] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [queueResults, setQueueResults] = useState<Record<number, 'ENVIADA' | 'FALHOU' | 'IGNORADA'>>({});
  const [currentOpened, setCurrentOpened] = useState(false);

  if (!isOpen) return null;

  const selectedCustomers = eligibleCustomers.filter(c => selectedCustomerIds.includes(c.customer_id));
  const totalBatchValue = selectedCustomers.reduce((acc, c) => acc + c.total_balance, 0);

  const toggleCustomer = (id: number) => {
    if (selectedCustomerIds.includes(id)) {
      setSelectedCustomerIds(selectedCustomerIds.filter(cId => cId !== id));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === eligibleCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(eligibleCustomers.map(c => c.customer_id));
    }
  };

  const startQueue = () => {
    if (selectedCustomers.length === 0) {
      alert('Selecione ao menos um cliente para a fila de envio.');
      return;
    }
    setIsQueueActive(true);
    setCurrentQueueIndex(0);
    setQueueResults({});
    setCurrentOpened(false);
  };

  const currentCustomer = selectedCustomers[currentQueueIndex];
  const currentValidation = currentCustomer ? validateWhatsAppNumber(currentCustomer.whatsapp || currentCustomer.phone) : { isValid: false, clean: '' };

  // Current message generated dynamically for current customer
  const currentNotes = currentCustomer ? (currentCustomer.notes || []).filter(n => n.status !== 'Pago') : [];
  const currentMessage = currentCustomer ? buildWhatsAppMessage(
    currentNotes.length > 1 ? 'C' : 'B',
    customTemplates,
    currentCustomer,
    currentNotes,
    { pixKey }
  ) : '';

  const handleOpenCurrentWhatsApp = () => {
    if (!currentValidation.isValid) {
      alert(`⚠️ Telefone inválido para ${currentCustomer.customer_name}.`);
      return;
    }
    const url = createWhatsAppUrl(currentValidation.clean, currentMessage, true);
    window.open(url, '_blank');
    setCurrentOpened(true);

    // Registra abertura
    fetch('/api/credit/collection-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        customer_id: currentCustomer.customer_id,
        credit_ids: currentNotes.map(n => n.id),
        action_type: 'ABERTA_WHATSAPP_LOTE',
        message: currentMessage,
        channel: 'WhatsApp Web',
        status: 'ABERTA_WHATSAPP',
        metadata: { batch_mode: true }
      })
    }).catch(console.error);
  };

  const handleAdvanceQueue = async (status: 'ENVIADA' | 'FALHOU' | 'IGNORADA') => {
    const custId = currentCustomer.customer_id;
    setQueueResults(prev => ({ ...prev, [custId]: status }));

    // Se confirmou envio, grava no backend
    if (status === 'ENVIADA') {
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/credit/collection-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            customer_id: custId,
            credit_ids: currentNotes.map(n => n.id),
            action_type: 'COBRANCA_LOTE_CONFIRMADA',
            message: currentMessage,
            channel: 'WhatsApp',
            status: 'ENVIADA',
            metadata: { batch_mode: true, customer_name: currentCustomer.customer_name }
          })
        });
      } catch (err) {
        console.error(err);
      }
    }

    setCurrentOpened(false);

    if (currentQueueIndex + 1 < selectedCustomers.length) {
      setCurrentQueueIndex(currentQueueIndex + 1);
    } else {
      // Completed queue
      alert('🎉 Fila de cobrança em lote finalizada com sucesso!');
      if (onBatchComplete) onBatchComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Send size={22} />
            </div>
            <div>
              <h3 className="font-black text-white text-base uppercase tracking-tight">Cobrança em Lote Assistida</h3>
              <p className="text-xs text-slate-400">Disparo com segurança: uma cobrança independente para cada cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Mode 1: Selection & Summary */}
        {!isQueueActive ? (
          <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
            {/* Summary card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total de Clientes Selecionados</span>
                <p className="text-xl font-black text-white">{selectedCustomers.length} cliente{selectedCustomers.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-400">Cada cliente receberá exclusivamente suas próprias notas e seu respectivo total.</p>
              </div>
              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-rose-400">Total a Cobrar no Lote</span>
                <p className="text-2xl font-black text-rose-400">{formatCurrencyBRL(totalBatchValue)}</p>
              </div>
            </div>

            {/* Selection control */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60"
              >
                {selectedCustomerIds.length === eligibleCustomers.length ? (
                  <>
                    <CheckSquare size={16} className="text-rose-400" />
                    Desmarcar Todos
                  </>
                ) : (
                  <>
                    <Square size={16} className="text-slate-400" />
                    Selecionar Todos ({eligibleCustomers.length})
                  </>
                )}
              </button>
              <span className="text-xs text-slate-500">
                {eligibleCustomers.length} clientes inadimplentes disponíveis
              </span>
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {eligibleCustomers.map(cust => {
                const isSelected = selectedCustomerIds.includes(cust.customer_id);
                const phoneCheck = validateWhatsAppNumber(cust.whatsapp || cust.phone);

                return (
                  <div
                    key={cust.customer_id}
                    onClick={() => toggleCustomer(cust.customer_id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/40 text-white'
                        : 'bg-slate-800/30 border-slate-700/40 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-rose-600 focus:ring-rose-500/20"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{cust.customer_name}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                            {cust.open_notes_count} nota{cust.open_notes_count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Phone size={12} className={phoneCheck.isValid ? 'text-emerald-400' : 'text-rose-400'} />
                          <span className={phoneCheck.isValid ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                            {cust.whatsapp || cust.phone || 'Sem telefone'}
                          </span>
                          {cust.has_overdue && (
                            <span className="text-[10px] text-rose-400 font-bold">
                              &bull; Maior atraso: {cust.max_overdue_days}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-rose-400">
                        {formatCurrencyBRL(cust.total_balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Content Mode 2: Assisted Queue Active */
          <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
            {/* Progress Header */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Fila de Disparo Assistido: Cliente {currentQueueIndex + 1} de {selectedCustomers.length}
                </span>
                <span className="text-xs font-black text-rose-400">
                  {Math.round(((currentQueueIndex) / selectedCustomers.length) * 100)}% concluído
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${((currentQueueIndex) / selectedCustomers.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Customer Card */}
            {currentCustomer && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white">{currentCustomer.customer_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Telefone WhatsApp: <strong className="text-emerald-400">{currentCustomer.whatsapp || currentCustomer.phone || 'Sem telefone'}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total a Cobrar</span>
                    <p className="text-2xl font-black text-rose-400">{formatCurrencyBRL(currentCustomer.total_balance)}</p>
                    <span className="text-[10px] text-slate-400">{currentNotes.length} nota(s) em aberto</span>
                  </div>
                </div>

                {/* Pre-filled Message Preview */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Mensagem que será enviada para este cliente:
                  </label>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto font-sans">
                    {currentMessage}
                  </div>
                </div>

                {/* Step Action */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-400">
                    {!currentOpened ? (
                      <span>Clique ao lado para abrir a conversa com a mensagem pronta no WhatsApp Web.</span>
                    ) : (
                      <span className="text-emerald-300 font-bold">Conversa aberta! Confirme se a mensagem foi enviada.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCurrentWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all shrink-0"
                  >
                    <ExternalLink size={16} />
                    Abrir WhatsApp Deste Cliente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs"
          >
            {isQueueActive ? 'Cancelar Lote' : 'Fechar'}
          </button>

          {!isQueueActive ? (
            <button
              type="button"
              disabled={selectedCustomers.length === 0}
              onClick={startQueue}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                selectedCustomers.length > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
              COBRAR CLIENTES SELECIONADOS ({selectedCustomers.length})
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdvanceQueue('IGNORADA')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Pular Cliente
              </button>

              <button
                type="button"
                onClick={() => handleAdvanceQueue('ENVIADA')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle size={16} />
                Confirmar Envio e Avançar
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
