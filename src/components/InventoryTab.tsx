import React, { useMemo } from 'react';
import { 
  Search, 
  List, 
  LayoutGrid, 
  Trash2, 
  Pencil, 
  Plus, 
  Package, 
  Printer, 
  ClipboardCheck, 
  TrendingUp, 
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface Product {
  id: number;
  description: string;
  sku: string;
  barcode: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  brand?: string;
  location?: string;
  image_url?: string;
}

interface InventoryTabProps {
  products: Product[];
  inventorySearchTerm: string;
  setInventorySearchTerm: (term: string) => void;
  globalSearchTerm: string;
  inventoryView: 'list' | 'grid';
  setInventoryView: (view: 'list' | 'grid') => void;
  loading: boolean;
  fetchData: () => void;
  selectedProductIds: number[];
  toggleSelectProduct: (id: number) => void;
  setSelectedProductIds: (ids: number[]) => void;
  handleBulkDelete: () => void;
  handleImportProducts: (e: any) => void;
  handleDownloadExcel: () => void;
  setIsQuickInventoryOpen: (open: boolean) => void;
  setIsMassUpdateModalOpen: (open: boolean) => void;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (id: number) => void;
  onAddProduct: () => void;
  setSelectedProductDetail: (product: Product | null) => void;
  formatBRL: (val: number) => string;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  inventorySearchTerm,
  setInventorySearchTerm,
  globalSearchTerm,
  inventoryView,
  setInventoryView,
  loading,
  fetchData,
  selectedProductIds,
  toggleSelectProduct,
  setSelectedProductIds,
  handleBulkDelete,
  handleImportProducts,
  handleDownloadExcel,
  setIsQuickInventoryOpen,
  setIsMassUpdateModalOpen,
  handleEditProduct,
  handleDeleteProduct,
  onAddProduct,
  setSelectedProductDetail,
  formatBRL
}) => {

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (a.description || '').localeCompare(b.description || ''));
  }, [products]);

  const filtered = useMemo(() => {
    const search = (inventorySearchTerm.trim() || globalSearchTerm.trim()).toLowerCase();
    return sortedProducts.filter(p => {
      if (!search) return true;
      return (
        (p.description || '').toLowerCase().includes(search) ||
        (p.sku || '').toLowerCase().includes(search) ||
        (p.location && (p.location || '').toLowerCase().includes(search)) ||
        (p.barcode || '').toLowerCase().includes(search) ||
        (p.brand && (p.brand || '').toLowerCase().includes(search))
      );
    });
  }, [sortedProducts, inventorySearchTerm, globalSearchTerm]);

  return (
    <div className="space-y-6 notranslate" translate="no">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Estoque de Peças</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Sincronizar Estoque"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-full sm:w-64"
              value={inventorySearchTerm}
              onChange={e => setInventorySearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setInventoryView('list')}
              className={`p-2 rounded-lg transition-all ${inventoryView === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setInventoryView('grid')}
              className={`p-2 rounded-lg transition-all ${inventoryView === 'grid' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Cards"
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium cursor-pointer text-sm whitespace-nowrap">
              <Package size={18} />
              Importar
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportProducts} />
            </label>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium text-sm whitespace-nowrap"
            >
              <Printer size={18} />
              Exportar
            </button>
          </div>

          <button
            onClick={() => setIsQuickInventoryOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-black shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95 text-sm whitespace-nowrap"
          >
            <ClipboardCheck size={20} />
            CONTAGEM RÁPIDA
          </button>
          
          <button
            onClick={() => setIsMassUpdateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-medium text-sm whitespace-nowrap"
          >
            <TrendingUp size={18} />
            Preços em Massa
          </button>
          
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Produto
          </button>
        </div>
      </div>

      {selectedProductIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl shadow-sm"
        >
          <span className="text-sm font-black text-rose-600 uppercase tracking-widest">
            {selectedProductIds.length} selecionado{selectedProductIds.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all font-bold text-xs uppercase"
          >
            <Trash2 size={14} />
            Excluir Selecionados
          </button>
          <button
            onClick={() => setSelectedProductIds([])}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase"
          >
            Limpar Seleção
          </button>
        </motion.div>
      )}

      {inventoryView === 'list' ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      checked={filtered.length > 0 && selectedProductIds.length === filtered.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds(filtered.map(p => p.id));
                        } else {
                          setSelectedProductIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SKU / EAN</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preços (C/V)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estoque</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium">Buscando estoque...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-6 py-4 text-slate-400">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleSelectProduct(p.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => setSelectedProductDetail(p)}
                          >
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.description} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{p.description}</p>
                            <div className="flex items-center gap-2">
                              {p.brand && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-tighter">
                                  {p.brand}
                                </span>
                              )}
                              {p.location && (
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{p.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-[11px] text-slate-500">
                        {p.sku || '-'} <br/> {p.barcode || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[10px] text-slate-300 line-through">{formatBRL(p.purchase_price)}</p>
                        <p className="font-black text-slate-900">{formatBRL(p.sale_price)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-tighter ${p.stock <= 2 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {p.stock} Un
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remover"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-medium">
              Nenhum produto encontrado.
            </div>
          ) : (
            filtered.map((p) => (
              <div 
                key={p.id} 
                className={`bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group relative ${selectedProductIds.includes(p.id) ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200'}`}
              >
                <div className="absolute top-4 left-4 z-20">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer shadow-sm"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleSelectProduct(p.id)}
                  />
                </div>
                
                <div 
                  className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedProductDetail(p)}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.description}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon size={48} className="text-slate-200" />
                  )}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${p.stock <= 2 ? 'bg-rose-600 text-white' : 'bg-white text-slate-600'}`}>
                      {p.stock} Un
                    </span>
                    {p.location && (
                       <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                         {p.location}
                       </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="min-h-[2.5rem] mb-2">
                    <h3 className="text-sm font-black text-slate-900 line-clamp-2 uppercase leading-tight tracking-tight">{p.description}</h3>
                    {p.brand && <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{p.brand}</p>}
                  </div>
                  
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-[9px] text-slate-300 uppercase font-black tracking-tighter line-through">{formatBRL(p.purchase_price)}</p>
                      <p className="text-xl font-black text-slate-900 leading-none">{formatBRL(p.sale_price)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditProduct(p)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-100"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2.5 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-100"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
