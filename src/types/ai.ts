export interface AIMessageType {
  id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
  metadata?: any;
}

export interface AIConversation {
  id: string;
  title: string;
  module: string;
  messages: AIMessageType[];
}

export interface AIContext {
  modulo: string;
  pagina: string;
  filtros?: any;
  registroSelecionado?: any;
}
