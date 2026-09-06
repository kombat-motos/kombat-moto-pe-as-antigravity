import React, { useState, useMemo, useCallback } from 'react';
import { Product, QuickFilterType, SortField, SortDirection } from './stock/types';
import { StockMetrics } from './stock/StockMetrics';
import { StockToolbar, AdvancedFiltersState } from './stock/StockToolbar';
import { StockListView } from './stock/StockListView';
import { StockCardView } from './stock/StockCardView';
import { ProductDetailsDrawer } from './stock/ProductDetailsDrawer';

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
  isQuickInventoryOpen?: boolean;
  setIsQuickInventoryOpen: (val: boolean) => void;
  isMassUpdateModalOpen?: boolean;
  setIsMassUpdateModalOpen: (val: boolean) => void;
  isMassCreditUpdateModalOpen?: boolean;
  setIsMassCreditUpdateModalOpen: (val: boolean) => void;
  isMassWholesaleUpdateModalOpen?: boolean;
  setIsMassWholesaleUpdateModalOpen?: (val: boolean) => void;
  handleEditProduct: (product: Product) => void;
  handleCloneProduct: (product: Product) => void;
  handleDeleteProduct: (id: number) => void;
  onAddProduct: () => void;
  setSelectedProductDetail?: (product: Product | null) => void;
  setLabelPreviewProduct?: (product: Product | null) => void;
  formatBRL: (val: number) => string;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
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
  setIsMassCreditUpdateModalOpen,
  setIsMassWholesaleUpdateModalOpen,
  handleEditProduct,
  handleCloneProduct,
  handleDeleteProduct,
  onAddProduct,
  setSelectedProductDetail,
  setLabelPreviewProduct,
  formatBRL
}) => {
  // ── Estados Locais de Filtro e Ordenação ──
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterType>('ALL');
  const [sortField, setSortField] = useState<SortField>('description');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Ficha Completa do Produto (Drawer)
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);

  // Filtros Avançados
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    brand: '',
    category: '',
    location: '',
    distributor: '',
    minPrice: '',
    maxPrice: ''
  });

  const handleResetAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      brand: '',
      category: '',
      location: '',
      distributor: '',
      minPrice: '',
      maxPrice: ''
    });
  }, []);

  // ── Listas Únicas para os Seletores dos Filtros Avançados ──
  const { availableBrands, availableCategories, availableLocations, availableDistributors } = useMemo(() => {
    const brandsSet = new Set<string>();
    const categoriesSet = new Set<string>();
    const locationsSet = new Set<string>();
    const distributorsSet = new Set<string>();

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (p.brand && p.brand.trim()) brandsSet.add(p.brand.trim());
      if (p.category && p.category.trim()) categoriesSet.add(p.category.trim());
      if (p.location && p.location.trim()) locationsSet.add(p.location.trim());
      if (p.distributor && p.distributor.trim()) distributorsSet.add(p.distributor.trim());
    }

    return {
      availableBrands: Array.from(brandsSet).sort(),
      availableCategories: Array.from(categoriesSet).sort(),
      availableLocations: Array.from(locationsSet).sort(),
      availableDistributors: Array.from(distributorsSet).sort()
    };
  }, [products]);

  // ── Filtragem de Produtos ──
  const filteredProducts = useMemo(() => {
    const term = (inventorySearchTerm.trim() || globalSearchTerm.trim()).toLowerCase();
    const adv = advancedFilters;
    const minP = adv.minPrice ? parseFloat(adv.minPrice.replace(',', '.')) : null;
    const maxP = adv.maxPrice ? parseFloat(adv.maxPrice.replace(',', '.')) : null;

    return products.filter(p => {
      // 1. Busca Geral (nome, sku, barcode, alt_code, brand, category, application, location, distributor)
      if (term) {
        const descMatch = (p.description || '').toLowerCase().includes(term);
        const skuMatch = (p.sku || '').toLowerCase().includes(term);
        const barcodeMatch = (p.barcode || '').toLowerCase().includes(term);
        const altCodeMatch = (p.alt_code || '').toLowerCase().includes(term);
        const brandMatch = (p.brand || '').toLowerCase().includes(term);
        const catMatch = (p.category || '').toLowerCase().includes(term);
        const appMatch = (p.application || '').toLowerCase().includes(term);
        const locMatch = (p.location || '').toLowerCase().includes(term);
        const distMatch = (p.distributor || '').toLowerCase().includes(term);

        if (!descMatch && !skuMatch && !barcodeMatch && !altCodeMatch && !brandMatch && !catMatch && !appMatch && !locMatch && !distMatch) {
          return false;
        }
      }

      // 2. Filtro Rápido
      const stock = Number(p.stock) || 0;
      switch (activeQuickFilter) {
        case 'IN_STOCK':
          if (stock <= 0) return false;
          break;
        case 'LOW_STOCK':
          if (stock < 1 || stock > 2) return false;
          break;
        case 'OUT_OF_STOCK':
          if (stock > 0) return false;
          break;
        case 'NO_IMAGE':
          if (p.image_url && p.image_url.trim()) return false;
          break;
        case 'NO_EAN':
          if (p.barcode && p.barcode.trim()) return false;
          break;
        case 'NO_LOCATION':
          if (p.location && p.location.trim()) return false;
          break;
        case 'ALL':
        default:
          break;
      }

      // 3. Filtros Avançados
      if (adv.brand && (p.brand || '').toLowerCase() !== adv.brand.toLowerCase()) {
        return false;
      }
      if (adv.category && (p.category || '').toLowerCase() !== adv.category.toLowerCase()) {
        return false;
      }
      if (adv.location && (p.location || '').toLowerCase() !== adv.location.toLowerCase()) {
        return false;
      }
      if (adv.distributor && (p.distributor || '').toLowerCase() !== adv.distributor.toLowerCase()) {
        return false;
      }
      if (minP !== null && !isNaN(minP) && Number(p.sale_price) < minP) {
        return false;
      }
      if (maxP !== null && !isNaN(maxP) && Number(p.sale_price) > maxP) {
        return false;
      }

      return true;
    });
  }, [products, inventorySearchTerm, globalSearchTerm, activeQuickFilter, advancedFilters]);

  // ── Ordenação Dinâmica ──
  const sortedAndFilteredProducts = useMemo(() => {
    const list = [...filteredProducts];

    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'sku':
          comparison = (a.sku || '').localeCompare(b.sku || '');
          break;
        case 'brand':
          comparison = (a.brand || '').localeCompare(b.brand || '');
          break;
        case 'location':
          comparison = (a.location || '').localeCompare(b.location || '');
          break;
        case 'stock':
          comparison = (Number(a.stock) || 0) - (Number(b.stock) || 0);
          break;
        case 'sale_price':
          comparison = (Number(a.sale_price) || 0) - (Number(b.sale_price) || 0);
          break;
        default:
          comparison = (a.description || '').localeCompare(b.description || '');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredProducts, sortField, sortDirection]);

  // Alternar campo de ordenação
  const handleSortChange = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Selecionar / desselecionar todos os itens visíveis na tela
  const handleSelectAllVisible = useCallback((select: boolean) => {
    if (select) {
      const visibleIds = sortedAndFilteredProducts.map(p => p.id);
      setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...visibleIds])));
    } else {
      const visibleIdsSet = new Set(sortedAndFilteredProducts.map(p => p.id));
      setSelectedProductIds(selectedProductIds.filter(id => !visibleIdsSet.has(id)));
    }
  }, [sortedAndFilteredProducts, selectedProductIds, setSelectedProductIds]);

  const handleOpenProductDetail = useCallback((p: Product) => {
    if (setSelectedProductDetail) {
      setSelectedProductDetail(p);
    } else {
      setDrawerProduct(p);
    }
  }, [setSelectedProductDetail]);

  return (
    <div className="space-y-4 notranslate" translate="no">
      {/* ── 1. Indicadores do Estoque (Metrics) ── */}
      <StockMetrics
        products={products}
        formatBRL={formatBRL}
        activeQuickFilter={activeQuickFilter}
        onSelectQuickFilter={setActiveQuickFilter}
      />

      {/* ── 2. Toolbar Profissional (Busca, Filtros, Alternador e Ações) ── */}
      <StockToolbar
        searchTerm={inventorySearchTerm}
        onSearchTermChange={setInventorySearchTerm}
        activeQuickFilter={activeQuickFilter}
        onSelectQuickFilter={setActiveQuickFilter}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        onResetAdvancedFilters={handleResetAdvancedFilters}
        availableBrands={availableBrands}
        availableCategories={availableCategories}
        availableLocations={availableLocations}
        availableDistributors={availableDistributors}
        viewMode={inventoryView}
        onViewModeChange={setInventoryView}
        loading={loading}
        onRefresh={fetchData}
        onImportExcel={handleImportProducts}
        onExportExcel={handleDownloadExcel}
        onOpenQuickInventory={() => setIsQuickInventoryOpen(true)}
        onOpenMassPriceUpdate={() => setIsMassUpdateModalOpen(true)}
        onOpenMassCreditUpdate={() => setIsMassCreditUpdateModalOpen(true)}
        onOpenMassWholesaleUpdate={setIsMassWholesaleUpdateModalOpen ? () => setIsMassWholesaleUpdateModalOpen(true) : undefined}
        onAddNewProduct={onAddProduct}
        selectedProductIds={selectedProductIds}
        onClearSelection={() => setSelectedProductIds([])}
        onBulkDelete={handleBulkDelete}
        totalFiltered={sortedAndFilteredProducts.length}
      />

      {/* ── 3. Visualização em Lista ou Cards ── */}
      {inventoryView === 'list' ? (
        <StockListView
          products={sortedAndFilteredProducts}
          selectedProductIds={selectedProductIds}
          onToggleSelectProduct={toggleSelectProduct}
          onSelectAllVisible={handleSelectAllVisible}
          onOpenProductDetail={handleOpenProductDetail}
          onEditProduct={handleEditProduct}
          onCloneProduct={handleCloneProduct}
          onDeleteProduct={handleDeleteProduct}
          formatBRL={formatBRL}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      ) : (
        <StockCardView
          products={sortedAndFilteredProducts}
          selectedProductIds={selectedProductIds}
          onToggleSelectProduct={toggleSelectProduct}
          onOpenProductDetail={handleOpenProductDetail}
          onEditProduct={handleEditProduct}
          onCloneProduct={handleCloneProduct}
          onDeleteProduct={handleDeleteProduct}
          formatBRL={formatBRL}
        />
      )}

      {/* ── 4. Ficha Completa do Produto (Drawer Horizontal 85-90% de Largura) se gerenciado localmente ── */}
      {!setSelectedProductDetail && drawerProduct && (
        <ProductDetailsDrawer
          product={drawerProduct}
          onClose={() => setDrawerProduct(null)}
          onEditProduct={handleEditProduct}
          onCloneProduct={handleCloneProduct}
          onPrintLabel={p => {
            if (setLabelPreviewProduct) {
              setLabelPreviewProduct(p);
            }
          }}
          formatBRL={formatBRL}
        />
      )}
    </div>
  );
};

export default InventoryTab;
