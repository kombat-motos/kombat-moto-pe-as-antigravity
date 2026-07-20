import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Search, Send, User, Bike, MapPin, 
  Calendar, Clock, Tag, BookOpen, Plus, X 
} from 'lucide-react';

interface Client {
  id: number;
  nome: string;
  telefone: string;
  modelo_moto?: string;
  ano_moto?: string;
  placa_moto?: string;
  observacoes?: string;
  status: string;
}

interface Message {
  id: number;
  sender: 'cliente' | 'atendente';
  message: string;
  created_at: string;
}

interface Atendimento {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_moto?: string;
  status: string;
  atendente_name?: string;
  observacoes?: string;
  last_contact: string;
}

interface TagType {
  id: number;
  name: string;
  color: string;
}

interface ClientTag {
  cliente_id: number;
  tag_id: number;
  tag_name: string;
  tag_color: string;
}

interface TemplateMessage {
  id: number;
  category: string;
  title: string;
  content: string;
}

interface CRMConversasProps {
  clientes: Client[];
  tags: TagType[];
  clientTags: ClientTag[];
  quickMessages: TemplateMessage[];
  onAddClientTag: (clientId: number, tagId: number) => void;
  onRemoveClientTag: (clientId: number, tagId: number) => void;
  onSendWhatsApp: (phone: string, text: string) => void;
  fetchClientTags: () => void;
}

export default function CRMConversas({
  clientes,
  tags,
  clientTags,
  quickMessages,
  onAddClientTag,
  onRemoveClientTag,
  onSendWhatsApp,
  fetchClientTags
}: CRMConversasProps) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<number | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [chatAttendant, setChatAttendant] = useState('');
  const [chatStatus, setChatStatus] = useState('Novo');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  useEffect(() => {
    fetchAtendimentos();
  }, [clientes]);

  useEffect(() => {
    if (selectedAtendimento) {
      fetchMessages(selectedAtendimento.id);
      setInternalNote(selectedAtendimento.observacoes || '');
      setChatAttendant(selectedAtendimento.atendente_name || '');
      setChatStatus(selectedAtendimento.status || 'Novo');
    }
  }, [selectedAtendimento]);

  const fetchAtendimentos = () => {
    fetch('/api/atendimentos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setAtendimentos(data);
        if (data.length > 0 && !selectedAtendimento) {
          setSelectedAtendimento(data[0]);
        }
      })
      .catch(err => console.error("Erro ao buscar atendimentos:", err));
  };

  const fetchMessages = (atendimentoId: number) => {
    fetch(`/api/conversas/${atendimentoId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error("Erro ao buscar mensagens:", err));
  };

  const handleSendMessage = (textToSend = inputText) => {
    if (!selectedAtendimento || !textToSend.trim()) return;

    const body = {
      atendimento_id: selectedAtendimento.id,
      sender: 'atendente',
      message: textToSend
    };

    fetch('/api/conversas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(() => {
        setInputText('');
        fetchMessages(selectedAtendimento.id);
        fetchAtendimentos();
        
        // Open WhatsApp Web Link with sanitized number
        onSendWhatsApp(selectedAtendimento.cliente_telefone, textToSend);
      })
      .catch(err => console.error("Erro ao enviar mensagem:", err));
  };

  const handleSaveNotesAndStatus = () => {
    if (!selectedAtendimento) return;

    fetch(`/api/atendimentos/${selectedAtendimento.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        status: chatStatus,
        atendente_name: chatAttendant,
        observacoes: internalNote
      })
    })
      .then(res => res.json())
      .then(() => {
        alert('Dados do atendimento salvos com sucesso!');
        fetchAtendimentos();
      })
      .catch(err => console.error(err));
  };

  const handleSelectTemplate = (template: TemplateMessage) => {
    let replacedText = template.content;
    if (selectedAtendimento) {
      replacedText = replacedText
        .replace(/\[NOME\]/g, selectedAtendimento.cliente_nome)
        .replace(/\[MOTO\]/g, selectedAtendimento.cliente_moto || 'Moto')
        .replace(/\[DESCRIÇÃO\]/g, 'Revisão Kombat')
        .replace(/\[VALOR\]/g, '120,00')
        .replace(/\[TOTAL\]/g, '120,00');
    }
    setInputText(replacedText);
    setShowTemplatesModal(false);
  };

  const handleOpenChatForClient = (cliente: Client) => {
    fetch('/api/atendimentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        cliente_id: cliente.id,
        status: 'Novo'
      })
    })
      .then(res => res.json())
      .then(data => {
        fetchAtendimentos();
        // Set selected atendimento
        const found = atendimentos.find(a => a.id === data.id);
        if (found) {
          setSelectedAtendimento(found);
        } else {
          setSelectedAtendimento({
            id: data.id,
            cliente_id: cliente.id,
            cliente_nome: cliente.nome,
            cliente_telefone: cliente.telefone,
            cliente_moto: cliente.modelo_moto,
            status: 'Novo',
            last_contact: new Date().toISOString()
          });
        }
      })
      .catch(err => console.error(err));
  };

  // Filter clients to show search list
  const filteredAtendimentos = atendimentos.filter(a => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      a.cliente_nome.toLowerCase().includes(term) ||
      a.cliente_telefone.includes(term) ||
      (a.cliente_moto || '').toLowerCase().includes(term);

    if (selectedTagFilter) {
      const hasTag = clientTags.some(ct => ct.cliente_id === a.cliente_id && ct.tag_id === selectedTagFilter);
      return matchesSearch && hasTag;
    }
    return matchesSearch;
  });

  const getClientTagsList = (clientId: number) => {
    return clientTags.filter(ct => ct.cliente_id === clientId);
  };

  return (
    <div className="flex bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[620px] dark:bg-slate-800 dark:border-slate-700 animate-fadeIn">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/10">
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar cliente ou moto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Tags horizontal list filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
            <button
              onClick={() => setSelectedTagFilter(null)}
              className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                selectedTagFilter === null 
                  ? 'bg-rose-600 text-white' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Todos
            </button>
            {tags.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTagFilter(t.id)}
                className={`px-2.5 py-1 rounded-full font-bold border transition-all whitespace-nowrap ${
                  selectedTagFilter === t.id 
                    ? 'bg-rose-600 text-white border-rose-600' 
                    : `${t.color} border-transparent`
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
          {filteredAtendimentos.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAtendimento(a)}
              className={`w-full p-4 flex gap-3 text-left transition-all ${
                selectedAtendimento?.id === a.id 
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-l-4 border-rose-600' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
              }`}
            >
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate uppercase">{a.cliente_nome}</h4>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {new Date(a.last_contact).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <Bike size={10} />
                  {a.cliente_moto || 'Moto não informada'}
                </p>
                {/* Tags associated */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {getClientTagsList(a.cliente_id).slice(0, 2).map((ct, idx) => (
                    <span key={idx} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${ct.tag_color}`}>
                      {ct.tag_name}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
          {filteredAtendimentos.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma conversa aberta encontrada.
            </div>
          )}
        </div>

        {/* Quick Open Chat from Customers List */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Iniciar Novo Chat</p>
          <select 
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const cli = clientes.find(c => c.id === parseInt(val));
                if (cli) handleOpenChatForClient(cli);
                e.target.value = "";
              }
            }}
            className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="">Selecione um cliente...</option>
            {clientes.filter(c => !atendimentos.some(a => a.cliente_id === c.id)).map(c => (
              <option key={c.id} value={c.id}>{c.nome} - {c.telefone}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Window */}
      {selectedAtendimento ? (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/40">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center dark:bg-rose-950/30">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase">{selectedAtendimento.cliente_nome}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">WhatsApp: {selectedAtendimento.cliente_telefone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300">
              <Clock size={12} />
              <span>Último contato: {new Date(selectedAtendimento.last_contact).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Conversation History Simulator */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map(m => (
              <div 
                key={m.id} 
                className={`flex ${m.sender === 'atendente' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] p-3 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                    m.sender === 'atendente' 
                      ? 'bg-rose-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <span className={`block text-[8px] text-right mt-1.5 ${m.sender === 'atendente' ? 'text-rose-100' : 'text-slate-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <MessageCircle size={32} className="text-slate-300 mb-2" />
                Histórico de envio de mensagens vazio.<br />
                Escreva abaixo para simular o atendimento no balcão.
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all dark:bg-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold text-xs"
                title="Modelos de Mensagem Rápida"
              >
                <BookOpen size={16} />
                <span>Mensagens Rápidas</span>
              </button>
            </div>

            <div className="flex items-end gap-3">
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Digite a mensagem para o cliente..."
                rows={2}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none dark:bg-slate-900 dark:border-slate-800"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl shadow-lg shadow-rose-100 dark:shadow-none transition-all flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/20">
          <MessageCircle size={48} className="text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">Central de Atendimento</h4>
          <p className="text-xs">Selecione uma conversa ao lado para iniciar a organização.</p>
        </div>
      )}

      {/* Right Drawer: Client Profile & Internal CRM Settings */}
      {selectedAtendimento && (
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 flex flex-col h-full bg-white dark:bg-slate-800 p-5 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-3">CRM / Dados de Ficha</h3>
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex gap-2.5 items-start text-xs">
                <User size={16} className="text-rose-500 mt-0.5" />
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100 uppercase">{selectedAtendimento.cliente_nome}</p>
                  <p className="text-[10px] text-slate-500">{selectedAtendimento.cliente_telefone}</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start text-xs border-t border-slate-200 dark:border-slate-800 pt-2.5">
                <Bike size={16} className="text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{selectedAtendimento.cliente_moto || 'Moto não cadastrada'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CRM Internal notes & configs */}
          <div className="space-y-4 pt-1">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Status & Notas Internas</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Status Atendimento</label>
                <select
                  value={chatStatus}
                  onChange={e => setChatStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
                >
                  <option value="Novo">Novo Lead</option>
                  <option value="Em atendimento">Em atendimento</option>
                  <option value="Aguardando cliente">Aguardando cliente</option>
                  <option value="Finalizado">Finalizado (Concluído)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Atendente Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do atendente..."
                  value={chatAttendant}
                  onChange={e => setChatAttendant(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Anotações Internas (Balcão)</label>
                <textarea
                  placeholder="Ex: Cliente procurando pneu traseiro CG 160..."
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                onClick={handleSaveNotesAndStatus}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
              >
                Salvar Informações
              </button>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3 pt-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag size={14} />
              <span>Etiquetas do Cliente</span>
            </h3>
            
            {/* Active Tags */}
            <div className="flex flex-wrap gap-1.5">
              {getClientTagsList(selectedAtendimento.cliente_id).map((ct, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${ct.tag_color}`}
                >
                  <span>{ct.tag_name}</span>
                  <button 
                    onClick={() => {
                      onRemoveClientTag(selectedAtendimento.cliente_id, ct.tag_id);
                    }}
                    className="p-0.5 hover:bg-black/10 rounded-full"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {getClientTagsList(selectedAtendimento.cliente_id).length === 0 && (
                <p className="text-[10px] text-slate-400 italic">Nenhuma etiqueta adicionada.</p>
              )}
            </div>

            {/* Add Tag Select */}
            <div>
              <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Adicionar Nova Etiqueta</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    onAddClientTag(selectedAtendimento.cliente_id, parseInt(val));
                    e.target.value = "";
                  }
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Selecione para adicionar...</option>
                {tags.filter(t => !getClientTagsList(selectedAtendimento.cliente_id).some(ct => ct.tag_id === t.id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Modelos de Resposta Rápida</h3>
              <button 
                onClick={() => setShowTemplatesModal(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {quickMessages.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-rose-50/20 border border-slate-100 hover:border-rose-300 rounded-2xl transition-all space-y-1.5 dark:bg-slate-900/30 dark:border-slate-800"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-rose-600">{t.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full dark:bg-slate-800">{t.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic">{t.content}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
