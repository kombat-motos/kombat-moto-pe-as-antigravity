// src/components/cobranca/ConfiguracoesCobrancaModal.tsx
// Modal de Configurações da Central: Régua Inteligente, Chave Pix e Modelos WhatsApp

import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Calendar, QrCode, MessageSquare, 
  Save, RefreshCw, CheckCircle, Sliders, Shield 
} from 'lucide-react';
import { CollectionSettingsV4, WhatsAppTemplate } from './types';
import { DEFAULT_WHATSAPP_TEMPLATES } from './defaultTemplates';

interface ConfiguracoesCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const ConfiguracoesCobrancaModal: React.FC<ConfiguracoesCobrancaModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [activeTab, setActiveTab] = useState<'regua' | 'pix' | 'modelos'>('regua');

  // Schedule settings
  const [reminderDays, setReminderDays] = useState(3);
  const [firstDays, setFirstDays] = useState(3);
  const [secondDays, setSecondDays] = useState(7);
  const [strongDays, setStrongDays] = useState(15);
  const [blockDays, setBlockDays] = useState(30);
  const [adminDays, setAdminDays] = useState(45);

  const [stagesActive, setStagesActive] = useState({
    reminder: true,
    due_day: true,
    first: true,
    second: true,
    strong: true,
    block: true,
    admin: true
  });

  // Pix and fees
  const [pixKey, setPixKey] = useState('12.802.931/0001-92');
  const [pixType, setPixType] = useState('CNPJ');
  const [defaultFine, setDefaultFine] = useState(2);
  const [defaultInterest, setDefaultInterest] = useState(1);

  // WhatsApp templates
  const [templates, setTemplates] = useState<Record<string, WhatsAppTemplate>>(DEFAULT_WHATSAPP_TEMPLATES);
  const [editingTemplateCode, setEditingTemplateCode] = useState<string>('MODELO_A');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      fetch('/api/collections/settings-v4', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data) {
            if (data.reminder_days !== undefined) setReminderDays(data.reminder_days);
            if (data.first_collection_days !== undefined) setFirstDays(data.first_collection_days);
            if (data.second_collection_days !== undefined) setSecondDays(data.second_collection_days);
            if (data.strong_collection_days !== undefined) setStrongDays(data.strong_collection_days);
            if (data.block_days !== undefined) setBlockDays(data.block_days);
            if (data.admin_days !== undefined) setAdminDays(data.admin_days);
            if (data.pix_key) setPixKey(data.pix_key);
            if (data.pix_type) setPixType(data.pix_type);
            if (data.default_fine !== undefined) setDefaultFine(data.default_fine);
            if (data.default_interest !== undefined) setDefaultInterest(data.default_interest);

            if (data.stages_config) {
              try {
                const parsed = typeof data.stages_config === 'string' ? JSON.parse(data.stages_config) : data.stages_config;
                setStagesActive(prev => ({ ...prev, ...parsed }));
              } catch (e) {}
            }

            if (data.whatsapp_templates) {
              try {
                const parsed = typeof data.whatsapp_templates === 'string' ? JSON.parse(data.whatsapp_templates) : data.whatsapp_templates;
                setTemplates(prev => ({ ...prev, ...parsed }));
              } catch (e) {}
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/collections/settings-v4', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reminder_days: reminderDays,
          first_collection_days: firstDays,
          second_collection_days: secondDays,
          strong_collection_days: strongDays,
          block_days: blockDays,
          admin_days: adminDays,
          default_fine: defaultFine,
          default_interest: defaultInterest,
          pix_key: pixKey,
          pix_type: pixType,
          stages_config: JSON.stringify(stagesActive),
          whatsapp_templates: JSON.stringify(templates)
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar configurações');

      alert('✅ Configurações da Central de Cobranças salvas com sucesso!');
      if (onSettingsSaved) onSettingsSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTmpl = templates[editingTemplateCode] || DEFAULT_WHATSAPP_TEMPLATES[editingTemplateCode];

  const handleUpdateTemplateText = (text: string) => {
    setTemplates(prev => ({
      ...prev,
      [editingTemplateCode]: {
        ...prev[editingTemplateCode],
        body: text
      }
    }));
  };

  const handleResetTemplate = (code: string) => {
    if (DEFAULT_WHATSAPP_TEMPLATES[code]) {
      setTemplates(prev => ({
        ...prev,
        [code]: { ...DEFAULT_WHATSAPP_TEMPLATES[code] }
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="font-black text-white text-base uppercase tracking-tight">Configurações da Central de Cobrança</h3>
              <p className="text-xs text-slate-400">Régua inteligente, parâmetros financeiros e modelos WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          {[
            { id: 'regua', label: 'Régua Inteligente', icon: Calendar },
            { id: 'pix', label: 'Chave Pix & Encargos', icon: QrCode },
            { id: 'modelos', label: 'Modelos WhatsApp', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
                  isActive 
                    ? 'border-rose-500 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* TAB 1: RÉGUA INTELIGENTE */}
          {activeTab === 'regua' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure os prazos da régua automática de cobrança da Kombat Moto Peças. Você pode ativar, desativar e calibrar cada etapa de acionamento.
              </p>

              <div className="space-y-2.5">
                {[
                  { key: 'reminder', label: 'Lembrete Antecipado', desc: 'Aviso cordial antes do vencimento', val: reminderDays, setVal: setReminderDays, unit: 'dias antes' },
                  { key: 'due_day', label: 'Aviso de Vencimento', desc: 'Mensagem no dia exato do vencimento', val: 0, setVal: null, unit: 'no dia' },
                  { key: 'first', label: 'Primeiro Lembrete de Atraso', desc: 'Primeira cobrança suave após vencido', val: firstDays, setVal: setFirstDays, unit: 'dias após' },
                  { key: 'second', label: 'Segunda Cobrança', desc: 'Segundo aviso de pendência financeira', val: secondDays, setVal: setSecondDays, unit: 'dias após' },
                  { key: 'strong', label: 'Cobrança Reforçada', desc: 'Notificação de alerta com juros contratuais', val: strongDays, setVal: setStrongDays, unit: 'dias após' },
                  { key: 'block', label: 'Revisão & Bloqueio de Crédito', desc: 'Suspensão de compras no fiado/crediário', val: blockDays, setVal: setBlockDays, unit: 'dias após' },
                  { key: 'admin', label: 'Análise Administrativa / Jurídica', desc: 'Encaminhamento para cobrança extrajudicial', val: adminDays, setVal: setAdminDays, unit: 'dias após' }
                ].map(stage => (
                  <div 
                    key={stage.key}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={(stagesActive as any)[stage.key]}
                        onChange={(e) => setStagesActive({ ...stagesActive, [stage.key]: e.target.checked })}
                        className="rounded border-slate-700 text-rose-600 focus:ring-rose-500/20"
                      />
                      <div>
                        <p className="font-bold text-white text-xs">{stage.label}</p>
                        <p className="text-[11px] text-slate-400">{stage.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {stage.setVal ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={stage.val}
                            onChange={(e) => stage.setVal!(parseInt(e.target.value) || 1)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white text-center font-bold"
                          />
                          <span className="text-xs text-slate-400 whitespace-nowrap">{stage.unit}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-800 rounded-lg">No Vencimento</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PIX & ENCARGOS */}
          {activeTab === 'pix' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Chave Pix da Kombat Moto Peças</h4>
                <p className="text-xs text-slate-400">
                  Esta chave é inserida automaticamente nas mensagens do WhatsApp e nos Demonstrativos em PDF.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Tipo de Chave:</label>
                    <select
                      value={pixType}
                      onChange={(e) => setPixType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="Celular">Celular</option>
                      <option value="Email">E-mail</option>
                      <option value="Chave Aleatória">Chave Aleatória</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Chave Pix:</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex: 12.802.931/0001-92"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Encargos Contratuais Padrão</h4>
                <p className="text-xs text-slate-400">
                  Percentuais aplicados ao simular juros e multa em notas em atraso:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Multa por Atraso (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={defaultFine}
                      onChange={(e) => setDefaultFine(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Juros ao Mês (% a.m.):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={defaultInterest}
                      onChange={(e) => setDefaultInterest(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODELOS WHATSAPP */}
          {activeTab === 'modelos' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { code: 'MODELO_A', label: 'Modelo A (Lembrete)' },
                  { code: 'MODELO_B', label: 'Modelo B (Individual)' },
                  { code: 'MODELO_C', label: 'Modelo C (Agrupada)' },
                  { code: 'MODELO_D', label: 'Modelo D (Atraso)' },
                  { code: 'MODELO_E', label: 'Modelo E (Acordo)' }
                ].map(t => (
                  <button
                    key={t.code}
                    onClick={() => setEditingTemplateCode(t.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      editingTemplateCode === t.code
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {currentTmpl && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{currentTmpl.title}</h4>
                      <p className="text-[11px] text-slate-400">{currentTmpl.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetTemplate(editingTemplateCode)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw size={12} /> Restaurar Padrão
                    </button>
                  </div>

                  <textarea
                    rows={9}
                    value={currentTmpl.body}
                    onChange={(e) => handleUpdateTemplateText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-rose-500"
                  />

                  <div className="text-[11px] text-slate-500">
                    <strong>Variáveis disponíveis:</strong> {'{cliente}'}, {'{numero}'}, {'{data}'}, {'{data_compra}'}, {'{vencimento}'}, {'{valor}'}, {'{dias_atraso}'}, {'{lista_notas}'}, {'{total_geral}'}, {'{valor_total}'}, {'{entrada}'}, {'{parcelas}'}.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all"
          >
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};
