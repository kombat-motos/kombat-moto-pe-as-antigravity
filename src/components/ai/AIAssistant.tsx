import React, { useState, useEffect } from 'react';
import { Bot, X, Send, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentModule, setCurrentModule] = useState('geral');
  
  // Track context based on URL or generic state
  useEffect(() => {
    // In a real router, we'd use useLocation. Here we can use a basic interval or event listener if needed,
    // or rely on the parent components to pass context. For now, we'll auto-detect via window.location 
    // or default to 'dashboard' since it's an SPA without strict URL paths in some modes.
    const urlParams = new URLSearchParams(window.location.search);
    const mod = urlParams.get('tab') || 'dashboard';
    setCurrentModule(mod);
  }, []);

  const { messages, isLoading, sendMessage, clearChat, setContext } = useAIChat({
    modulo: currentModule,
    pagina: 'principal'
  });

  // Update context when module changes
  useEffect(() => {
    setContext({ modulo: currentModule, pagina: 'principal' });
  }, [currentModule, setContext]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-red-700 transition-colors z-50 group"
      >
        <Bot size={24} className="group-hover:animate-pulse" />
        <span className="font-medium hidden md:block">Ozzy IA</span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-red-100"
          >
            {/* Header */}
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Ozzy IA</h3>
                  <p className="text-xs text-red-100 opacity-90">Assistente Inteligente Kombat</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearChat}
                  className="p-2 hover:bg-red-700 rounded-lg transition-colors text-white/80 hover:text-white"
                  title="Limpar Conversa"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-700 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                  <Bot size={48} className="text-red-200" />
                  <p className="text-center text-sm px-4">
                    Olá! Sou o Ozzy, seu assistente de IA. Pergunte-me sobre clientes, estoque, contas ou serviços.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <button onClick={() => sendMessage('Quais contas estão atrasadas?')} className="bg-white border border-slate-200 text-slate-600 text-xs py-1 px-3 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                      Contas Atrasadas?
                    </button>
                    <button onClick={() => sendMessage('Quais produtos estão acabando?')} className="bg-white border border-slate-200 text-slate-600 text-xs py-1 px-3 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                      Estoque Baixo?
                    </button>
                  </div>
                </div>
              )}
              
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-red-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-red-500" />
                    <span className="text-xs">Ozzy está analisando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Pergunte ao Ozzy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
