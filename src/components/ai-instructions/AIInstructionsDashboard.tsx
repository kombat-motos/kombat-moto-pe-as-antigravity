import React, { useState } from 'react';
import { BookOpen, Book, FlaskConical, MessageSquare } from 'lucide-react';
import AIInstructionList from './AIInstructionList';
import AIInstructionForm from './AIInstructionForm';
import AIDictionary from './AIDictionary';
import AIInstructionSimulator from './AIInstructionSimulator';

const AIInstructionsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'dictionary' | 'simulator'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setActiveTab('form');
  };

  const handleNew = () => {
    setEditingId(null);
    setActiveTab('form');
  };

  const handleBackToList = () => {
    setEditingId(null);
    setActiveTab('list');
  };

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Central de Instruções da IA</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o conhecimento e as regras de negócio utilizadas pela Ozzy IA.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'list' || activeTab === 'form' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={handleBackToList}
          >
            <BookOpen size={18} />
            Instruções
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'dictionary' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('dictionary')}
          >
            <Book size={18} />
            Dicionário
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'simulator' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('simulator')}
          >
            <FlaskConical size={18} />
            Simulador
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          {activeTab === 'list' && (
            <AIInstructionList onEdit={handleEdit} onNew={handleNew} />
          )}
          {activeTab === 'form' && (
            <AIInstructionForm id={editingId} onBack={handleBackToList} />
          )}
          {activeTab === 'dictionary' && (
            <AIDictionary />
          )}
          {activeTab === 'simulator' && (
            <AIInstructionSimulator />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInstructionsDashboard;
