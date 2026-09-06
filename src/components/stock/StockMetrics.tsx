import React, { useMemo } from 'react';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  ImageOff, 
  Barcode, 
  MapPinOff 
} from 'lucide-react';
import { Product, QuickFilterType } from './types';

interface StockMetricsProps {
  products: Product[];
  formatBRL: (val: number) => string;
  activeQuickFilter: QuickFilterType;
  onSelectQuickFilter: (filter: QuickFilterType) => void;
}

export const StockMetrics: React.FC<StockMetricsProps> = ({
  products,
  formatBRL,
  activeQuickFilter,
  onSelectQuickFilter
}) => {
  const metrics = useMemo(() => {
    let totalItems = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalCostValue = 0;
    let noImage = 0;
    let noEan = 0;
    let noLocation = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchase_price) || 0;

      if (stock > 2) {
        inStock++;
      } else if (stock >= 1 && stock <= 2) {
        lowStock++;
      } else {
        outOfStock++;
      }

      if (stock > 0 && cost > 0) {
        totalCostValue += stock * cost;
      }

      if (!p.image_url || !p.image_url.trim()) {
        noImage++;
      }

      if (!p.barcode || !p.barcode.trim()) {
        noEan++;
      }

      if (!p.location || !p.location.trim()) {
        noLocation++;
      }
    }

    return {
      totalItems,
      inStock: inStock + lowStock, // Total com estoque positivo
      lowStock, // 1 ou 2 unidades
      outOfStock, // <= 0
      totalCostValue,
      noImage,
      noEan,
      noLocation
    };
  }, [products]);

  const cards: Array<{
    id: QuickFilterType;
    label: string;
    sublabel: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    activeBorder: string;
  }> = [
    {
      id: 'ALL',
      label: 'TOTAL PRODUTOS',
      sublabel: 'Catálogo Geral',
      value: metrics.totalItems,
      icon: <Package size={20} />,
      color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
      activeBorder: 'border-slate-800 dark:border-slate-200 ring-2 ring-slate-400/20'
    },
    {
      id: 'IN_STOCK',
      label: 'COM ESTOQUE',
      sublabel: 'Disponíveis para venda',
      value: metrics.inStock,
      icon: <CheckCircle2 size={20} />,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
      activeBorder: 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20'
    },
    {
      id: 'LOW_STOCK',
      label: 'ESTOQUE BAIXO',
      sublabel: '1 a 2 unidades',
      value: metrics.lowStock,
      icon: <AlertTriangle size={20} />,
      color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
      activeBorder: 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20'
    },
    {
      id: 'OUT_OF_STOCK',
      label: 'SEM ESTOQUE',
      sublabel: 'Zerado ou negativo',
      value: metrics.outOfStock,
      icon: <XCircle size={20} />,
      color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300',
      activeBorder: 'border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/20'
    },
    {
      id: 'ALL', // Filtro neutro, apenas métrica financeira
      label: 'VALOR DO ESTOQUE A CUSTO',
      sublabel: 'Custo total (qtd × compra)',
      value: formatBRL(metrics.totalCostValue),
      icon: <DollarSign size={20} />,
      color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
      activeBorder: 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20'
    },
    {
      id: 'NO_IMAGE',
      label: 'SEM IMAGEM',
      sublabel: 'Pendentes de foto',
      value: metrics.noImage,
      icon: <ImageOff size={20} />,
      color: 'text-slate-600 bg-slate-50 dark:bg-slate-800/60 dark:text-slate-300',
      activeBorder: 'border-slate-500 dark:border-slate-400 ring-2 ring-slate-400/20'
    },
    {
      id: 'NO_EAN',
      label: 'SEM EAN / BARRAS',
      sublabel: 'Pendentes de código',
      value: metrics.noEan,
      icon: <Barcode size={20} />,
      color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300',
      activeBorder: 'border-purple-600 dark:border-purple-400 ring-2 ring-purple-500/20'
    },
    {
      id: 'NO_LOCATION',
      label: 'SEM LOCALIZAÇÃO',
      sublabel: 'Sem prateleira/gaveta',
      value: metrics.noLocation,
      icon: <MapPinOff size={20} />,
      color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-300',
      activeBorder: 'border-orange-600 dark:border-orange-400 ring-2 ring-orange-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {cards.map((card, idx) => {
        const isSelected = activeQuickFilter === card.id && card.id !== 'ALL';
        const isAllSelected = activeQuickFilter === 'ALL' && idx === 0;
        const active = isSelected || isAllSelected;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuickFilter(card.id)}
            className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-slate-900 ${
              active 
                ? `${card.activeBorder} shadow-sm bg-slate-50/50 dark:bg-slate-800/80` 
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
            title={`Filtrar por ${card.label}`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className={`p-1.5 rounded-xl ${card.color}`}>
                {card.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate text-right">
                {card.label}
              </span>
            </div>

            <div className="mt-auto">
              <div className={`text-base font-black tracking-tight ${typeof card.value === 'string' ? 'text-xs sm:text-sm font-black' : 'text-lg'} text-slate-900 dark:text-slate-100 truncate`}>
                {card.value}
              </div>
              <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 truncate">
                {card.sublabel}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
