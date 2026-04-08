import React from 'react';
import { Search, PlusCircle, Bike, Edit, Printer } from 'lucide-react';

interface SaleItem {
  product_id?: number;
  description: string;
  quantity: number;
  price: number;
  type?: 'Peça' | 'Serviço';
  total: number;
}

interface Sale {
  id: string;
  customer_id?: number;
  customer_name: string;
  date: string;
  total: number;
  payment_method: string;
  payment_status: string;
  due_date?: string;
  paid_date?: string;
  items: SaleItem[];
  labor_value: number;
  commission: number;
  mechanic_name?: string;
  moto_details?: string;
  status?: string;
  type: string;
}

interface OSTabProps {
  sales: Sale[];
  salesSearchTerm: string;
  globalSearchTerm: string;
  setSalesSearchTerm: (s: string) => void;
  setEditingOS: (os: Sale | null) => void;
  setOsForm: (f: any) => void;
  setIsOsModalOpen: (open: boolean) => void;
  formatBRL: (v: number) => string;
  handleEditOS: (os: Sale) => void;
  setSelectedSaleForOS: (os: Sale) => void;
  setSelectedSaleForReceipt: (os: Sale) => void;
}

const OSTab: React.FC<OSTabProps> = ({
  sales,
  salesSearchTerm,
  globalSearchTerm,
  setSalesSearchTerm,
  setEditingOS,
  setOsForm,
  setIsOsModalOpen,
  formatBRL,
  handleEditOS,
  setSelectedSaleForOS,
  setSelectedSaleForReceipt
}) => {
  const osSales = sales.filter(s => s.type === 'Oficina');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ordens de Serviço</h2>
          <p className="text-sm text-slate-500">Gerenciamento de manutenções e reparos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar O.S..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none w-64"
              value={salesSearchTerm}
              onChange={e => setSalesSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingOS(null);
              setOsForm({
                customer_id: '',
                motorcycle_id: '',
                items: [],
                selected_fixed_services: [],
                labor_value: '0',
                mechanic_id: '',
                payment_method: 'Pix',
                status: 'Aberto',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                service_description: '',
                km: ''
              });
              setIsOsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all font-bold shadow-lg shadow-amber-100"
          >
            <PlusCircle size={20} />
            Nova O.S.
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {osSales.filter(os => {
          const search = (salesSearchTerm + globalSearchTerm).toLowerCase();
          return (
            os.customer_name.toLowerCase().includes(search) ||
            os.id.toLowerCase().includes(search) ||
            os.moto_details?.toLowerCase().includes(search) ||
            os.mechanic_name?.toLowerCase().includes(search)
          );
        }).map(os => (
          <div key={os.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-400 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl h-fit">
                  <Bike size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase">
                      O.S. #{os.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(os.date).toLocaleDateString()} às {new Date(os.date).toLocaleTimeString()}
                    </span>
                    {os.status && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${os.status === 'Aberto' ? 'bg-slate-100 text-slate-600' :
                        os.status === 'Em Andamento' ? 'bg-blue-100 text-blue-600' :
                          os.status === 'Pronto' ? 'bg-rose-100 text-rose-600' :
                            'bg-indigo-100 text-indigo-600'
                        }`}>
                        {os.status}
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{os.customer_name}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Bike size={14} /> {os.moto_details}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <div className="text-xs">
                      <p className="text-slate-400 uppercase font-bold text-[9px]">Mecânico</p>
                      <p className="font-medium text-slate-700">{os.mechanic_name || 'Não atribuído'}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-400 uppercase font-bold text-[9px]">Pagamento</p>
                      <p className="font-medium text-slate-700">{os.payment_method}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total da O.S.</p>
                <p className="text-2xl font-black text-slate-900">{formatBRL(os.total)}</p>
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => handleEditOS(os)}
                    className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 border border-slate-400"
                  >
                    <Edit size={14} /> Editar O.S.
                  </button>
                  <button
                    onClick={() => setSelectedSaleForOS(os)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Printer size={14} /> Imprimir A4
                  </button>
                  <button
                    onClick={() => setSelectedSaleForReceipt(os)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Printer size={14} /> Recibo 80mm
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-400 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Peças</p>
                <p className="font-bold text-slate-700">R$ {(os.total - os.labor_value).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Mão de Obra</p>
                <p className="font-bold text-slate-700">R$ {os.labor_value.toFixed(2)}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-amber-500 uppercase">Comissão</p>
                <p className="font-bold text-amber-700">R$ {os.commission.toFixed(2)}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-rose-500 uppercase">Lucro Loja</p>
                <p className="font-bold text-rose-700">R$ {(os.total - os.commission).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
        {osSales.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-400 text-center">
            <Bike size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Nenhuma Ordem de Serviço encontrada</h3>
            <p className="text-sm text-slate-400 mt-1">Clique em "Nova O.S." para começar um atendimento na oficina.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OSTab;
