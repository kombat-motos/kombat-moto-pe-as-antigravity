import React, { useState, useEffect } from 'react';
import { 
  BarChart3, LayoutDashboard, MessageCircle, Target, FileText, 
  Wrench, BookOpen, Tag, Clock, Users, ShieldAlert 
} from 'lucide-react';

// Subcomponents
import CRMDashboard from './crm/CRMDashboard';
import CRMConversas from './crm/CRMConversas';
import CRMFunil from './crm/CRMFunil';
import CRMOrcamentos from './crm/CRMOrcamentos';
import CRMOficina from './crm/CRMOficina';
import CRMMensagens from './crm/CRMMensagens';
import CRMTags from './crm/CRMTags';
import CRMRelatorios from './crm/CRMRelatorios';
import CRMUsuarios from './crm/CRMUsuarios';
import CRMFollowups from './crm/CRMFollowups';

interface Lead {
  id: string;
  name: string;
  phone: string;
  company: string;
  interest?: string;
  value: number;
  priority: 'Baixa' | 'Média' | 'Alta';
  status: 'Novo' | 'Em atendimento' | 'Aguardando cliente' | 'Orçamento enviado' | 'Negociação' | 'Aprovado' | 'Venda concluída' | 'Perdido' | 'Pós-venda';
}

interface Product {
  id: number;
  description: string;
  sale_price: number;
  stock: number;
}

interface Mechanic {
  id: string;
  name: string;
  commission_rate: number;
}

interface CRMTabProps {
  currentUser: { id: number; username: string; role: 'Administrador' | 'Atendente' | 'Mecânico' | 'Financeiro' };
  formatBRL: (v: number) => string;
  products: Product[];
  mechanics: Mechanic[];
  onTriggerPDV: (quote: any) => void;
  onTriggerOS: (quote: any) => void;
}

type SubTab = 'dashboard' | 'conversas' | 'funil' | 'orcamentos' | 'oficina' | 'mensagens' | 'tags' | 'relatorios' | 'usuarios' | 'followups';

export default function CRMTab({
  currentUser,
  formatBRL,
  products,
  mechanics,
  onTriggerPDV,
  onTriggerOS
}: CRMTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');

  // Datasets states
  const [clientes, setClientes] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);
  const [tags, setTags] = useState([]);
  const [clientTags, setClientTags] = useState([]);
  const [quickMessages, setQuickMessages] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [services, setServices] = useState([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Fetch headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Fetch all CRM data
  useEffect(() => {
    fetchClientes();
    fetchAtendimentos();
    fetchTags();
    fetchClientTags();
    fetchQuickMessages();
    fetchOrcamentos();
    fetchServices();
    fetchLeads();
  }, [activeSubTab]);

  const fetchClientes = () => {
    fetch('/api/clientes', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error(err));
  };

  const fetchAtendimentos = () => {
    fetch('/api/atendimentos', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setAtendimentos(data))
      .catch(err => console.error(err));
  };

  const fetchTags = () => {
    fetch('/api/tags', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setTags(data))
      .catch(err => console.error(err));
  };

  const fetchClientTags = () => {
    fetch('/api/cliente_tags', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setClientTags(data))
      .catch(err => console.error(err));
  };

  const fetchQuickMessages = () => {
    fetch('/api/mensagens_prontas', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setQuickMessages(data))
      .catch(err => console.error(err));
  };

  const fetchOrcamentos = () => {
    fetch('/api/orcamentos', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setOrcamentos(data))
      .catch(err => console.error(err));
  };

  const fetchServices = () => {
    fetch('/api/servicos_oficina', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error(err));
  };

  const fetchLeads = () => {
    fetch('/api/leads', { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setLeads(data))
      .catch(err => console.error(err));
  };

  // WhatsApp Sanitizing Link Opener
  const handleSendWhatsApp = (phone: string, text: string) => {
    if (!phone) return alert('Cliente sem número de telefone cadastrado.');
    // Sanitizing number
    let cleanPhone = phone.replace(/\D/g, ''); // Removes spaces, brackets, hyphens
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = '55' + cleanPhone; // prepend 55
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // CLIENTS TAGS ACTIONS
  const handleAddClientTag = async (clienteId: number, tagId: number) => {
    try {
      await fetch('/api/cliente_tags', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ cliente_id: clienteId, tag_id: tagId })
      });
      fetchClientTags();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveClientTag = async (clienteId: number, tagId: number) => {
    try {
      await fetch(`/api/cliente_tags/${clienteId}/${tagId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchClientTags();
    } catch (e) {
      console.error(e);
    }
  };

  // LEADS ACTIONS
  const handleAddLead = async (payload: any) => {
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLead = async (id: string, payload: any) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  // QUOTES ACTIONS
  const handleAddQuote = async (payload: any) => {
    try {
      await fetch('/api/orcamentos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchOrcamentos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQuote = async (id: number, payload: any) => {
    try {
      await fetch(`/api/orcamentos/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchOrcamentos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQuote = async (id: number) => {
    try {
      await fetch(`/api/orcamentos/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchOrcamentos();
    } catch (e) {
      console.error(e);
    }
  };

  // WORKSHOP SERVICES ACTIONS
  const handleAddService = async (payload: any) => {
    try {
      await fetch('/api/servicos_oficina', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateService = async (id: number, payload: any) => {
    try {
      await fetch(`/api/servicos_oficina/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (id: number) => {
    try {
      await fetch(`/api/servicos_oficina/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  // QUICK MESSAGES ACTIONS
  const handleAddMessage = async (payload: any) => {
    try {
      await fetch('/api/mensagens_prontas', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchQuickMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMessage = async (id: number, payload: any) => {
    try {
      await fetch(`/api/mensagens_prontas/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchQuickMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await fetch(`/api/mensagens_prontas/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchQuickMessages();
    } catch (e) {
      console.error(e);
    }
  };

  // TAGS ACTIONS
  const handleAddTag = async (payload: any) => {
    try {
      await fetch('/api/tags', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      fetchTags();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchTags();
    } catch (e) {
      console.error(e);
    }
  };

  // Submenu configuration
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'conversas', label: 'Conversas WA', icon: MessageCircle },
    { id: 'funil', label: 'Funil Vendas', icon: Target },
    { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
    { id: 'oficina', label: 'Oficina Kanban', icon: Wrench },
    { id: 'mensagens', label: 'Biblioteca', icon: BookOpen },
    { id: 'tags', label: 'Etiquetas', icon: Tag },
    { id: 'followups', label: 'Follow-ups', icon: Clock },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'usuarios', label: 'Usuários/Acesso', icon: Users, roleRestrict: 'Administrador' }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Horizontal Submenu Bar */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider scrollbar-none">
        {menuItems.map(item => {
          if (item.roleRestrict && currentUser.role !== item.roleRestrict) return null;
          const Icon = item.icon;
          const active = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as SubTab)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                active 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-100 dark:shadow-none' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Views rendering */}
      <div className="flex-1 min-h-[500px]">
        {activeSubTab === 'dashboard' && (
          <CRMDashboard
            clientes={clientes}
            atendimentos={atendimentos}
            orcamentos={orcamentos}
            servicosOficina={services}
            formatBRL={formatBRL}
            onNavigateToTab={(tab: any) => setActiveSubTab(tab)}
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}
        {activeSubTab === 'conversas' && (
          <CRMConversas
            clientes={clientes}
            tags={tags}
            clientTags={clientTags}
            quickMessages={quickMessages}
            onAddClientTag={handleAddClientTag}
            onRemoveClientTag={handleRemoveClientTag}
            onSendWhatsApp={handleSendWhatsApp}
            fetchClientTags={fetchClientTags}
          />
        )}
        {activeSubTab === 'funil' && (
          <CRMFunil
            leads={leads}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onSendWhatsApp={handleSendWhatsApp}
            formatBRL={formatBRL}
          />
        )}
        {activeSubTab === 'orcamentos' && (
          <CRMOrcamentos
            orcamentos={orcamentos}
            products={products}
            formatBRL={formatBRL}
            onAddQuote={handleAddQuote}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            onSendWhatsApp={handleSendWhatsApp}
            onConvertToSale={onTriggerPDV}
            onConvertToOS={onTriggerOS}
          />
        )}
        {activeSubTab === 'oficina' && (
          <CRMOficina
            services={services}
            products={products}
            mechanics={mechanics}
            formatBRL={formatBRL}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}
        {activeSubTab === 'mensagens' && (
          <CRMMensagens
            messages={quickMessages}
            onAddMessage={handleAddMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}
        {activeSubTab === 'tags' && (
          <CRMTags
            tags={tags}
            clientTags={clientTags}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
          />
        )}
        {activeSubTab === 'followups' && (
          <CRMFollowups
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}
        {activeSubTab === 'relatorios' && (
          <CRMRelatorios
            orcamentos={orcamentos}
            services={services}
            atendimentos={atendimentos}
            leads={leads}
            formatBRL={formatBRL}
          />
        )}
        {activeSubTab === 'usuarios' && (
          <CRMUsuarios
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}
