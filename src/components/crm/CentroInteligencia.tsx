import React, { useEffect, useState } from 'react';
import { 
  Brain, Users, Sparkles, TrendingUp, AlertTriangle, FileText, 
  CheckCircle, Clock, ArrowRight, Activity, Calendar, Wrench, Package, Search
} from 'lucide-react';

interface VipClient {
  id: number;
  nome: string;
  telefone: string;
  modelo_moto: string;
  total_gasto: number;
  compras_count: number;
}

interface InactiveClient {
  id: number;
  nome: string;
  telefone: string;
  modelo_moto: string;
  ultima_compra: string | null;
}

interface AtRiskClient {
  id: number;
  nome: string;
  telefone: string;
  modelo_moto: string;
  total_gasto: number;
  ultima_compra: string;
}

interface HotQuote {
  id: number;
  customer_name: string;
  whatsapp: string;
  motorcycle_details: string;
  total_value: number;
  created_at: string;
}

interface TopProduct {
  description: string;
  total_sold: number;
  revenue: number;
}

interface TopService {
  description: string;
  count: number;
  revenue: number;
}

interface IntelligenceData {
  vips: VipClient[];
  inactives: InactiveClient[];
  atRisk: AtRiskClient[];
  hotQuotes: HotQuote[];
  topProducts: TopProduct[];
  topServices: TopService[];
}

interface AiLog {
  id: number;
  created_at: string;
  user_id: number;
  cliente_id: number | null;
  acao: string;
  origem: string;
  resumo: string;
  cliente_nome: string | null;
  usuario_nome: string | null;
}

interface CentroInteligenciaProps {
  formatBRL: (v: number) => string;
  onOpenCliente360: (id: number) => void;
}

export default function CentroInteligencia({
  formatBRL,
  onOpenCliente360
}: CentroInteligenciaProps) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchData = () => {
    setLoading(true);
    fetch('/api/ai/centro-inteligencia', { headers: getHeaders() })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar dados do Centro de Inteligência.');
        return res.json();
      })
      .then((data: IntelligenceData) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchLogs = () => {
    setLoadingLogs(true);
    fetch('/api/ai/logs', { headers: getHeaders() })
      .then(res => res.json())
      .then((logsData: AiLog[]) => {
        setLogs(logsData);
        setLoadingLogs(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingLogs(false);
      });
  };

  useEffect(() => {
    fetchData();
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="inline-block w-8 h-8 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
        <p className="text-sm text-zinc-400">Carregando painel de inteligência IA...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-zinc-900 border border-red-800 rounded-xl m-4 space-y-4">
        <div className="flex items-center space-x-2 text-red-500 font-bold">
          <AlertTriangle size={20} />
          <span>Erro no Centro de Inteligência</span>
        </div>
        <p className="text-zinc-300 text-sm">{error || 'Estatísticas não disponíveis.'}</p>
        <button onClick={fetchData} className="px-3 py-1.5 bg-red-700 text-white rounded text-xs">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 sm:p-4 text-zinc-200">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-red-950/40 via-zinc-950 to-zinc-950 border border-zinc-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20 shadow-lg">
            <Brain size={32} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <span>Centro de Inteligência IA Kombat</span>
              <span className="px-2 py-0.5 bg-red-600 text-zinc-950 text-[10px] uppercase font-black tracking-wider rounded-full">Pro</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Estatísticas avançadas, clientes em risco, orçamentos quentes e logs de auditoria da IA.</p>
          </div>
        </div>

        <button 
          onClick={() => { fetchData(); fetchLogs(); }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg text-xs font-semibold transition"
        >
          Atualizar Dados
        </button>
      </div>

      {/* Grid: 3 lists of clients (VIPs, Inactives, At-Risk) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Clientes VIP */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="flex items-center space-x-2">
                <Sparkles size={14} className="text-amber-500" />
                <span>Clientes VIP (Top 5)</span>
              </span>
              <span className="text-[10px] text-zinc-500 lowercase font-normal">maior faturamento</span>
            </h3>

            {data.vips.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center">Nenhum cliente VIP listado.</p>
            ) : (
              <div className="space-y-3">
                {data.vips.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => onOpenCliente360(v.id)}
                    className="p-3 bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-850 hover:border-red-900/40 rounded-lg flex justify-between items-center cursor-pointer transition"
                  >
                    <div>
                      <span className="font-bold text-white text-xs block hover:text-red-500 transition">{v.nome}</span>
                      <span className="text-[10px] text-zinc-400">{v.modelo_moto || 'Sem moto'} • {v.compras_count} compras</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-400 text-xs block">{formatBRL(v.total_gasto)}</span>
                      <span className="text-[9px] text-zinc-500">gasto total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Clientes Inativos */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="flex items-center space-x-2">
                <Clock size={14} className="text-zinc-500" />
                <span>Inativos &gt; 60 dias (Top 5)</span>
              </span>
              <span className="text-[10px] text-zinc-500 lowercase font-normal">chamar no whats</span>
            </h3>

            {data.inactives.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center">Nenhum inativo com compras registradas.</p>
            ) : (
              <div className="space-y-3">
                {data.inactives.map(i => (
                  <div 
                    key={i.id} 
                    onClick={() => onOpenCliente360(i.id)}
                    className="p-3 bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-850 hover:border-red-900/40 rounded-lg flex justify-between items-center cursor-pointer transition"
                  >
                    <div>
                      <span className="font-bold text-white text-xs block hover:text-red-500 transition">{i.nome}</span>
                      <span className="text-[10px] text-zinc-400">{i.modelo_moto || 'Sem moto'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-300 block">
                        {i.ultima_compra ? new Date(i.ultima_compra).toLocaleDateString('pt-BR') : 'Sem compras'}
                      </span>
                      <span className="text-[9px] text-zinc-500">última compra</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Clientes Em Risco */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="flex items-center space-x-2">
                <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                <span>Clientes em Risco (Top 5)</span>
              </span>
              <span className="text-[10px] text-zinc-500 lowercase font-normal">VIPs afastando-se</span>
            </h3>

            {data.atRisk.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center">Nenhum cliente em risco iminente.</p>
            ) : (
              <div className="space-y-3">
                {data.atRisk.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => onOpenCliente360(r.id)}
                    className="p-3 bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-850 hover:border-red-900/40 rounded-lg flex justify-between items-center cursor-pointer transition"
                  >
                    <div>
                      <span className="font-bold text-white text-xs block hover:text-red-500 transition">{r.nome}</span>
                      <span className="text-[10px] text-zinc-400">{r.modelo_moto || 'Sem moto'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-zinc-200 text-xs block">
                        {r.ultima_compra ? new Date(r.ultima_compra).toLocaleDateString('pt-BR') : 'N/D'}
                      </span>
                      <span className="text-[9px] text-red-400">{formatBRL(r.total_gasto)} gasto</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Stats list of Products, Services and Hot Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hot Quotes */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2 mb-4 border-b border-zinc-800 pb-2">
            <FileText size={14} className="text-red-500" />
            <span>Orçamentos Quentes Pendentes</span>
          </h3>

          {data.hotQuotes.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-6 text-center">Nenhum orçamento quente (&gt;R$200) pendente.</p>
          ) : (
            <div className="space-y-3">
              {data.hotQuotes.map(q => (
                <div key={q.id} className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-xs block">{q.customer_name}</span>
                    <span className="text-[10px] text-zinc-400">{q.motorcycle_details || 'Motos'} • {new Date(q.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-500 text-xs block">{formatBRL(q.total_value)}</span>
                    <span className="text-[9px] text-zinc-500">Pendente</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2 mb-4 border-b border-zinc-800 pb-2">
            <Package size={14} className="text-red-500" />
            <span>Produtos em Alta (Estoque Motopeças)</span>
          </h3>

          {data.topProducts.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-6 text-center">Sem dados de peças vendidas.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, idx) => (
                <div key={idx} className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg flex justify-between items-center">
                  <div className="flex-1 mr-2">
                    <span className="font-bold text-white text-xs block truncate">{p.description}</span>
                    <span className="text-[10px] text-zinc-400">{p.total_sold} unidades vendidas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-zinc-300 text-xs block">{formatBRL(p.revenue)}</span>
                    <span className="text-[9px] text-zinc-500">receita</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Services */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-2 mb-4 border-b border-zinc-800 pb-2">
            <Wrench size={14} className="text-red-500" />
            <span>Serviços mais Procurados (Oficina)</span>
          </h3>

          {data.topServices.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-6 text-center">Sem dados de serviços realizados.</p>
          ) : (
            <div className="space-y-3">
              {data.topServices.map((s, idx) => (
                <div key={idx} className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg flex justify-between items-center">
                  <div className="flex-1 mr-2">
                    <span className="font-bold text-white text-xs block truncate">{s.description}</span>
                    <span className="text-[10px] text-zinc-400">{s.count} manutenções</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-zinc-300 text-xs block">{formatBRL(s.revenue)}</span>
                    <span className="text-[9px] text-zinc-500">receita</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* AI Kombat Activity Logs */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
          <span className="flex items-center space-x-2">
            <Activity size={14} className="text-red-500 animate-pulse" />
            <span>Logs de Atividade & Auditoria da IA Kombat</span>
          </span>
          <span className="text-[10px] text-zinc-500 lowercase font-normal">últimos 20 acessos</span>
        </h3>

        {loadingLogs ? (
          <p className="text-xs text-zinc-500 italic text-center py-6">Carregando logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-6 text-center">Nenhuma requisição de IA efetuada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 font-bold uppercase">Data</th>
                  <th className="py-2.5 font-bold uppercase">Usuário</th>
                  <th className="py-2.5 font-bold uppercase">Cliente</th>
                  <th className="py-2.5 font-bold uppercase">Ação</th>
                  <th className="py-2.5 font-bold uppercase">Origem</th>
                  <th className="py-2.5 font-bold uppercase">Resumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-950/20 transition">
                    <td className="py-2.5 font-mono text-[10px] text-zinc-500">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 font-semibold text-zinc-300">
                      {log.usuario_nome || `Atendente #${log.user_id}`}
                    </td>
                    <td className="py-2.5">
                      {log.cliente_id ? (
                        <button 
                          onClick={() => onOpenCliente360(log.cliente_id!)}
                          className="font-bold text-red-500 hover:text-red-400 hover:underline transition text-left"
                        >
                          {log.cliente_nome || `Cliente #${log.cliente_id}`}
                        </button>
                      ) : (
                        <span className="text-zinc-500 font-mono italic">Global</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 bg-zinc-850 border border-zinc-800 text-zinc-300 rounded uppercase font-bold text-[10px]">
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.origem === 'Gemini' 
                          ? 'bg-green-950 text-green-400 border border-green-800/40' 
                          : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      }`}>
                        {log.origem}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-400 max-w-xs truncate italic" title={log.resumo}>
                      {log.resumo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
