// src/components/cobranca/WhatsAppModal.tsx
// Modal Profissional de Envio e Confirmação de Cobrança WhatsApp

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Phone, AlertTriangle, CheckCircle, MessageCircle, 
  ExternalLink, Edit3, RefreshCw, FileText 
} from 'lucide-react';
import { CustomerDebtGroup, CreditNote, WhatsAppTemplate } from './types';
import { 
  DEFAULT_WHATSAPP_TEMPLATES, 
  buildWhatsAppMessage, 
  validateWhatsAppNumber, 
  createWhatsAppUrl, 
  formatCurrencyBRL 
} from './defaultTemplates';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDebtGroup | null;
  selectedNotes: CreditNote[];
  customTemplates?: Record<string, WhatsAppTemplate>;
  pixKey?: string;
  initialTemplateCode?: 'A' | 'B' | 'C' | 'D' | 'E';
  onCollectionLogged?: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  customer,
  selectedNotes,
  customTemplates,
  pixKey,
  initialTemplateCode = 'C',
  onCollectionLogged
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'A' | 'B' | 'C' | 'D' | 'E'>(initialTemplateCode);
  const [messageText, setMessageText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [openedInWhatsApp, setOpenedInWhatsApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      // Se tiver mais de uma nota, o padrão ideal é o Modelo C
      const code = (selectedNotes.length > 1 ? 'C' : (initialTemplateCode || 'B')) as 'A' | 'B' | 'C' | 'D' | 'E';
      setSelectedTemplate(code);
      const generated = buildWhatsAppMessage(code, customTemplates, customer, selectedNotes, { pixKey });
      setMessageText(generated);
      setOpenedInWhatsApp(false);
      setIsEditing(false);
    }
  }, [isOpen, customer, selectedNotes, initialTemplateCode, customTemplates, pixKey]);

  if (!isOpen || !customer) return null;

  const phoneValidation = validateWhatsAppNumber(customer.whatsapp || customer.phone);
  const totalPendente = selectedNotes.reduce((acc, n) => acc + (n.balance > 0 ? n.balance : n.original_value), 0);

  const handleTemplateChange = (code: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setSelectedTemplate(code);
    const generated = buildWhatsAppMessage(code, customTemplates, customer, selectedNotes, { pixKey });
    setMessageText(generated);
  };

  const handleOpenWhatsApp = (preferWeb: boolean) => {
    if (!phoneValidation.isValid) {
      alert(`⚠️ Atenção: ${phoneValidation.error}`);
      return;
    }

    const url = createWhatsAppUrl(phoneValidation.clean, messageText, preferWeb);
    window.open(url, '_blank');
    setOpenedInWhatsApp(true);

    // Registra no histórico que o operador abriu a conversa (mas AINDA NÃO ENVIOU)
    fetch('/api/credit/collection-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        customer_id: customer.customer_id,
        credit_ids: selectedNotes.map(n => n.id),
        action_type: 'ABERTA_WHATSAPP',
        message: messageText,
        channel: preferWeb ? 'WhatsApp Web' : 'WhatsApp App',
        status: 'ABERTA_WHATSAPP',
        metadata: {
          template: selectedTemplate,
          total: totalPendente,
          notes_count: selectedNotes.length
        }
      })
    }).catch(console.error);
  };

  const handleConfirmSent = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/credit/collection-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          credit_ids: selectedNotes.map(n => n.id),
          action_type: 'COBRANCA_ENVIADA',
          message: messageText,
          channel: 'WhatsApp',
          status: 'ENVIADA',
          metadata: {
            template: selectedTemplate,
            total: totalPendente,
            notes_count: selectedNotes.length,
            confirmed_by_operator: true
          }
        })
      });

      if (!res.ok) throw new Error('Falha ao registrar envio');

      alert('✅ Cobrança confirmada como ENVIADA com sucesso no histórico do cliente!');
      if (onCollectionLogged) onCollectionLogged();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao registrar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!confirm('Deseja registrar que o envio não foi realizado ou falhou?')) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/credit/collection-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          credit_ids: selectedNotes.map(n => n.id),
          action_type: 'COBRANCA_FALHA',
          message: messageText,
          channel: 'WhatsApp',
          status: 'FALHOU',
          metadata: {
            reason: 'Cancelado pelo operador ou número indisponível'
          }
        })
      });

      alert('Registro de envio cancelado/falho gravado.');
      if (onCollectionLogged) onCollectionLogged();
      onClose();
    } catch (err: any) {
      console.error(err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Enviar Cobrança via WhatsApp</h3>
              <p className="text-xs text-slate-400">Prévia, edição e confirmação real de disparo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Customer & Debt Banner */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{customer.customer_name}</span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {customer.cpf || 'Sem CPF'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone size={14} className={phoneValidation.isValid ? 'text-emerald-400' : 'text-rose-400'} />
                <span className={`text-xs font-semibold ${phoneValidation.isValid ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {customer.whatsapp || customer.phone || 'Sem telefone'}
                </span>
                {!phoneValidation.isValid && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                    {phoneValidation.error}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total a Cobrar ({selectedNotes.length} nota{selectedNotes.length > 1 ? 's' : ''})
              </span>
              <p className="text-xl font-black text-rose-400">
                {formatCurrencyBRL(totalPendente)}
              </p>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Selecione o Modelo de Mensagem:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { code: 'A', label: 'Mod. A: Lembrete', desc: 'Pré-vencimento' },
                { code: 'B', label: 'Mod. B: Individual', desc: '1 Nota Vencida' },
                { code: 'C', label: 'Mod. C: Agrupada', desc: 'Múltiplas Notas' },
                { code: 'D', label: 'Mod. D: Atraso', desc: 'Cobrança Geral' },
                { code: 'E', label: 'Mod. E: Acordo', desc: 'Resumo Acordo' }
              ].map(t => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => handleTemplateChange(t.code as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTemplate === t.code
                      ? 'bg-rose-600/20 border-rose-500 text-white shadow-sm ring-1 ring-rose-500/50'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{t.label}</p>
                  <p className="text-[10px] opacity-70 truncate">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Edit3 size={14} className="text-slate-400" />
                Texto da Mensagem (Editável antes do envio):
              </label>
              <button
                type="button"
                onClick={() => handleTemplateChange(selectedTemplate)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                title="Restaurar texto original deste modelo"
              >
                <RefreshCw size={12} />
                Restaurar Modelo
              </button>
            </div>

            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-sans text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all leading-relaxed"
              placeholder="Digite a mensagem de cobrança..."
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * Você pode personalizar qualquer frase antes de abrir a conversa.
            </p>
          </div>

          {/* Status Tracker and Confirmation Alert */}
          {openedInWhatsApp && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3"
            >
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <p className="font-bold">A conversa do WhatsApp foi aberta no seu navegador/aplicativo.</p>
                <p className="mt-0.5 text-amber-300/80">
                  Para garantir a integridade dos relatórios, confirme abaixo se você <strong>efetivamente enviou a mensagem</strong> ao cliente.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!openedInWhatsApp ? (
              <>
                <button
                  type="button"
                  disabled={!phoneValidation.isValid}
                  onClick={() => handleOpenWhatsApp(true)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    phoneValidation.isValid
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink size={16} />
                  Abrir WhatsApp Web
                </button>
                <button
                  type="button"
                  disabled={!phoneValidation.isValid}
                  onClick={() => handleOpenWhatsApp(false)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    phoneValidation.isValid
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                  App / Celular
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleMarkFailed}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Não Enviou / Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSent}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition-all"
                >
                  <CheckCircle size={16} />
                  Confirmar Envio Realizado
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
