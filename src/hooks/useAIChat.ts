import { useState, useCallback } from 'react';
import { AIMessageType, AIContext } from '../types/ai';

const getAuthToken = () => {
  const tokenStr = localStorage.getItem('auth_token');
  if (tokenStr) {
    try {
      const parsed = JSON.parse(tokenStr);
      return parsed.token || tokenStr;
    } catch {
      return tokenStr; // It might not be JSON
    }
  }
  return null;
};

export function useAIChat(initialContext: AIContext) {
  const [messages, setMessages] = useState<AIMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [context, setContext] = useState<AIContext>(initialContext);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: AIMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const response = await fetch('/api/ai_assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          context
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (!conversationId) setConversationId(data.conversationId);
        
        const aiMessage: AIMessageType = {
          id: Date.now().toString() + '-ai',
          role: 'model',
          content: data.message,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMsg: AIMessageType = {
          id: Date.now().toString() + '-err',
          role: 'model',
          content: 'Desculpe, ocorreu um erro ao processar sua solicitação: ' + (data.message || 'Erro desconhecido'),
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMsg: AIMessageType = {
        id: Date.now().toString() + '-err2',
        role: 'model',
        content: 'Não foi possível conectar ao servidor da Ozzy IA no momento.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, context]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    context,
    setContext
  };
}
