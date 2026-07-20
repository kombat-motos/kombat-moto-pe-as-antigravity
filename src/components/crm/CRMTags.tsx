import React, { useState } from 'react';
import { Tag, Plus, Trash2, X } from 'lucide-react';

interface TagType {
  id: number;
  name: string;
  color: string;
}

interface ClientTag {
  cliente_id: number;
  tag_id: number;
}

interface CRMTagsProps {
  tags: TagType[];
  clientTags: ClientTag[];
  onAddTag: (tag: { name: string; color: string }) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
}

const PRESET_COLORS = [
  'bg-red-100 text-red-800 border-red-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-lime-100 text-lime-800 border-lime-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-slate-100 text-slate-800 border-slate-200'
];

export default function CRMTags({
  tags,
  clientTags,
  onAddTag,
  onDeleteTag
}: CRMTagsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return alert('Por favor, digite o nome da etiqueta.');

    await onAddTag({ name: tagName, color: tagColor });
    setTagName('');
    setIsModalOpen(false);
  };

  const getTagStats = (tagId: number) => {
    return clientTags.filter(ct => ct.tag_id === tagId).length;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Gerenciador de Etiquetas</h2>
          <p className="text-[10px] text-slate-400">Organize seus clientes no funil de atendimento por tags</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 dark:shadow-none"
        >
          <Plus size={16} />
          <span>Nova Etiqueta</span>
        </button>
      </div>

      {/* Grid displays tags */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tags.map(t => {
          const count = getTagStats(t.id);
          return (
            <div 
              key={t.id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between gap-4 hover:shadow-sm transition-all"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${t.color}`}>
                  {t.name}
                </span>
                <p className="text-[10px] text-slate-400 font-medium">{count} cliente(s) associado(s)</p>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Deseja excluir a etiqueta ${t.name}?`)) onDeleteTag(t.id);
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Excluir Etiqueta"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Add Tag */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-sm w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Nova Etiqueta</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Nome da Etiqueta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Orçamento Quente..."
                  value={tagName}
                  onChange={e => setTagName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-2">Cor da Etiqueta</label>
                <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagColor(c)}
                      className={`p-2 rounded-lg text-[9px] font-black uppercase border truncate ${c} ${
                        tagColor === c ? 'ring-2 ring-rose-500 ring-offset-2' : ''
                      }`}
                    >
                      Cor
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview tag */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="block font-bold text-slate-400 uppercase mb-2">Prévia da Etiqueta</label>
                <span className={`inline-block text-[10px] font-black uppercase px-3 py-1 rounded-full border ${tagColor}`}>
                  {tagName || 'Nova Etiqueta'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                Salvar Etiqueta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
