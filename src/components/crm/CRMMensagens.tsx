import React, { useState } from 'react';
import { BookOpen, Search, Plus, Trash2, Edit2, Copy, Send, X } from 'lucide-react';

interface TemplateMessage {
  id: number;
  category: string;
  title: string;
  content: string;
}

interface CRMMensagensProps {
  messages: TemplateMessage[];
  onAddMessage: (msg: Omit<TemplateMessage, 'id'>) => Promise<void>;
  onUpdateMessage: (id: number, msg: Partial<TemplateMessage>) => Promise<void>;
  onDeleteMessage: (id: number) => Promise<void>;
  onSendWhatsApp: (phone: string, text: string) => void;
}

const CATEGORIES = [
  'Saudação Geral', 'Solicitação de Cadastro', 'Orçamentos', 
  'Acompanhamento', 'Serviço Oficina', 'Marketing', 'Financeiro'
];

export default function CRMMensagens({
  messages,
  onAddMessage,
  onUpdateMessage,
  onDeleteMessage,
  onSendWhatsApp
}: CRMMensagensProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<TemplateMessage | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState('Saudação Geral');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [testPhone, setTestPhone] = useState('');

  const handleOpenAdd = () => {
    setEditingMsg(null);
    setFormCategory('Saudação Geral');
    setFormTitle('');
    setFormContent('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (msg: TemplateMessage) => {
    setEditingMsg(msg);
    setFormCategory(msg.category);
    setFormTitle(msg.title);
    setFormContent(msg.content);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) return alert('Por favor, preencha todos os campos.');

    const payload = {
      category: formCategory,
      title: formTitle,
      content: formContent
    };

    if (editingMsg) {
      await onUpdateMessage(editingMsg.id, payload);
    } else {
      await onAddMessage(payload);
    }
    setIsModalOpen(false);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Mensagem copiada para a área de transferência!');
  };

  const handleSendTestMsg = (text: string) => {
    const phone = prompt('Digite o número de WhatsApp de teste (com DDD):', testPhone);
    if (phone) {
      setTestPhone(phone);
      onSendWhatsApp(phone, text);
    }
  };

  const filteredMessages = messages.filter(m => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      (m.title || '').toLowerCase().includes(term) ||
      (m.content || '').toLowerCase().includes(term);
    
    if (selectedCategory) {
      return matchesSearch && m.category === selectedCategory;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search and Categories header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar modelos de respostas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 dark:shadow-none"
          >
            <Plus size={16} />
            <span>Adicionar Modelo</span>
          </button>
        </div>

        {/* Categories filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              selectedCategory === null 
                ? 'bg-rose-600 text-white shadow-md shadow-rose-100 dark:shadow-none' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Todas Categorias
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-100 dark:shadow-none' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid displaying templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMessages.map(msg => (
          <div 
            key={msg.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full dark:bg-slate-900 dark:text-slate-400">
                  {msg.category}
                </span>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenEdit(msg)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Deseja excluir este modelo de mensagem?')) onDeleteMessage(msg.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">{msg.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl italic border border-slate-100 dark:border-slate-800/50 leading-relaxed">
                {msg.content}
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 text-[10px]">
              <button
                onClick={() => handleCopyToClipboard(msg.content)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Copy size={12} />
                <span>Copiar</span>
              </button>
              
              <button
                onClick={() => handleSendTestMsg(msg.content)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-100 dark:shadow-none"
              >
                <Send size={12} />
                <span>Enviar Teste</span>
              </button>
            </div>
          </div>
        ))}
        {filteredMessages.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            Nenhum modelo de resposta encontrado.
          </div>
        )}
      </div>

      {/* Message Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                {editingMsg ? 'Editar Modelo' : 'Novo Modelo de Mensagem'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Categoria</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Título do Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confirmação de Entrada Oficina..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Texto da Mensagem</label>
                <textarea
                  required
                  placeholder="Escreva a mensagem. Use placeholders como [NOME], [MOTO], [TOTAL] para autopreenchimento..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all text-xs"
              >
                {editingMsg ? 'Salvar Alterações' : 'Salvar Novo Modelo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
