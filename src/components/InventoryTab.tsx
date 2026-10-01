import React, { useState, useMemo, useCallback, useRef, useEffect, useDeferredValue } from 'react';
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

/**
 * Normaliza o texto removendo acentos (ex: relação -> relacao, guidão -> guidao)
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Normaliza e substitui caracteres não-alfanuméricos por espaço para busca exata de tokens/palavras
 */
function normalizeForTokens(text: string | null | undefined): string {
  if (!text) return '';
  return normalizeText(text)
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Extrai somente dígitos numéricos (ideal para correspondência direta de SKU ou código de barras)
 */
function extractDigits(text: string | null | undefined): string {
  if (!text) return '';
  return text.toString().replace(/\D/g, '');
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
  // ── Estados Locais de Busca e Filtro (Zero Latência e Ultra Rápido) ──
  const [searchTerm, setSearchTerm] = useState(inventorySearchTerm || '');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const lastSyncedTermRef = useRef(inventorySearchTerm || '');

  // Sincronização externa se inventorySearchTerm for alterado por fora (ex: limpar filtros globais)
  useEffect(() => {
    if (inventorySearchTerm !== lastSyncedTermRef.current) {
      lastSyncedTermRef.current = inventorySearchTerm || '';
      setSearchTerm(inventorySearchTerm || '');
    }
  }, [inventorySearchTerm]);

  // Sincroniza de forma assíncrona/suave com o App após 400ms de inatividade do usuário,
  // evitando que o App re-renderize 12.000 linhas durante a digitação/deleção.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (setInventorySearchTerm && deferredSearchTerm !== lastSyncedTermRef.current) {
        lastSyncedTermRef.current = deferredSearchTerm;
        setInventorySearchTerm(deferredSearchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [deferredSearchTerm, setInventorySearchTerm]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchTerm(val);
  }, []);

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

  // ── Índice Otimizado Pré-Normalizado para Busca Instantânea sem Travar ──
  const searchableProducts = useMemo(() => {
    return products.map(p => {
      const desc = normalizeForTokens(p.description);
      const sku = normalizeForTokens(p.sku);
      const cleanSku = extractDigits(p.sku);
      const barcode = normalizeForTokens(p.barcode);
      const cleanBarcode = extractDigits(p.barcode);
      const brand = normalizeForTokens(p.brand);
      const category = normalizeForTokens(p.category);
      const app = normalizeForTokens(p.application);
      const loc = normalizeForTokens(p.location);
      const dist = normalizeForTokens(p.distributor);
      const altCode = normalizeForTokens(p.alt_code);

      // Composite contendo todos os dados do produto para busca por qualquer palavra
      const composite = `${desc} ${sku} ${cleanSku} ${barcode} ${cleanBarcode} ${altCode} ${brand} ${category} ${app} ${loc} ${dist}`;

      return {
        product: p,
        normalizedDesc: desc,
        normalizedSku: sku,
        cleanSku,
        normalizedBarcode: barcode,
        cleanBarcode,
        normalizedBrand: brand,
        normalizedCategory: category,
        normalizedApp: app,
        normalizedLoc: loc,
        normalizedDist: dist,
        normalizedAltCode: altCode,
        composite
      };
    });
  }, [products]);

  // ── Filtragem Inteligente de Produtos (Qualquer Palavra Digitada, Qualquer Ordem, Sem Acentos) ──
  const filteredProducts = useMemo(() => {
    const rawTerm = (deferredSearchTerm.trim() || globalSearchTerm.trim());
    const adv = advancedFilters;
    const minP = adv.minPrice ? parseFloat(adv.minPrice.replace(',', '.')) : null;
    const maxP = adv.maxPrice ? parseFloat(adv.maxPrice.replace(',', '.')) : null;

    // Se não houver termo de busca, aplica apenas filtros rápidos e avançados
    if (!rawTerm) {
      return products.filter(p => {
        // Filtro Rápido
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

        // Filtros Avançados
        if (adv.brand && (p.brand || '').toLowerCase() !== adv.brand.toLowerCase()) return false;
        if (adv.category && (p.category || '').toLowerCase() !== adv.category.toLowerCase()) return false;
        if (adv.location && (p.location || '').toLowerCase() !== adv.location.toLowerCase()) return false;
        if (adv.distributor && (p.distributor || '').toLowerCase() !== adv.distributor.toLowerCase()) return false;
        if (minP !== null && !isNaN(minP) && Number(p.sale_price) < minP) return false;
        if (maxP !== null && !isNaN(maxP) && Number(p.sale_price) > maxP) return false;

        return true;
      });
    }

    // Busca multi-palavra inteligente
    const normalizedQuery = normalizeForTokens(rawTerm);
    const cleanQueryDigits = extractDigits(rawTerm);
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);

    interface ScoredMatch {
      product: Product;
      score: number;
      matchCount: number;
    }

    const matchesAllTokens: ScoredMatch[] = [];
    const partialMatches: ScoredMatch[] = [];

    for (let i = 0; i < searchableProducts.length; i++) {
      const item = searchableProducts[i];
      const p = item.product;

      // 1. Filtro Rápido
      const stock = Number(p.stock) || 0;
      switch (activeQuickFilter) {
        case 'IN_STOCK':
          if (stock <= 0) continue;
          break;
        case 'LOW_STOCK':
          if (stock < 1 || stock > 2) continue;
          break;
        case 'OUT_OF_STOCK':
          if (stock > 0) continue;
          break;
        case 'NO_IMAGE':
          if (p.image_url && p.image_url.trim()) continue;
          break;
        case 'NO_EAN':
          if (p.barcode && p.barcode.trim()) continue;
          break;
        case 'NO_LOCATION':
          if (p.location && p.location.trim()) continue;
          break;
        case 'ALL':
        default:
          break;
      }

      // 2. Filtros Avançados
      if (adv.brand && (p.brand || '').toLowerCase() !== adv.brand.toLowerCase()) continue;
      if (adv.category && (p.category || '').toLowerCase() !== adv.category.toLowerCase()) continue;
      if (adv.location && (p.location || '').toLowerCase() !== adv.location.toLowerCase()) continue;
      if (adv.distributor && (p.distributor || '').toLowerCase() !== adv.distributor.toLowerCase()) continue;
      if (minP !== null && !isNaN(minP) && Number(p.sale_price) < minP) continue;
      if (maxP !== null && !isNaN(maxP) && Number(p.sale_price) > maxP) continue;

      // 3. Verificação de todas as palavras digitadas (qualquer palavra do produto)
      let matchCount = 0;
      let score = 0;

      for (let t = 0; t < queryTokens.length; t++) {
        const token = queryTokens[t];
        const tokenStem = (token.endsWith('s') && token.length > 3) ? token.slice(0, -1) : '';

        const inComposite = item.composite.includes(token) || (tokenStem ? item.composite.includes(tokenStem) : false);

        if (inComposite) {
          matchCount++;
          // Pontuação de relevância de acordo com onde a palavra aparece
          if (item.normalizedDesc.includes(token)) score += 30;
          if (item.normalizedSku.includes(token) || (cleanQueryDigits && item.cleanSku.includes(cleanQueryDigits))) score += 40;
          if (item.normalizedBarcode.includes(token) || (cleanQueryDigits && item.cleanBarcode.includes(cleanQueryDigits))) score += 50;
          if (item.normalizedBrand.includes(token)) score += 25;
          if (item.normalizedApp.includes(token)) score += 20;
          if (item.normalizedLoc.includes(token)) score += 15;
          if (item.normalizedAltCode.includes(token)) score += 30;
        }
      }

      if (matchCount === 0) continue;

      // Bônus de relevância para aproximação máxima
      if (item.normalizedDesc.includes(normalizedQuery)) score += 100; // Frase exata inteira
      if (queryTokens.length > 0 && item.normalizedDesc.startsWith(queryTokens[0])) score += 60; // Começa com a 1ª palavra
      if (cleanQueryDigits && cleanQueryDigits.length >= 3 && item.cleanSku === cleanQueryDigits) score += 200; // SKU idêntico
      if (cleanQueryDigits && cleanQueryDigits.length >= 4 && item.cleanBarcode === cleanQueryDigits) score += 300; // EAN idêntico

      if (matchCount === queryTokens.length) {
        matchesAllTokens.push({ product: p, score, matchCount });
      } else {
        partialMatches.push({ product: p, score, matchCount });
      }
    }

    // Se temos produtos com todas as palavras digitadas, exibe-os ordenados por relevância
    if (matchesAllTokens.length > 0) {
      matchesAllTokens.sort((a, b) => b.score - a.score);
      return matchesAllTokens.map(m => m.product);
    }

    // Fallback inteligente: se nenhuma tiver todas as palavras (ex: usuário digitou 3 palavras e uma teve erro de digitação),
    // mostra os produtos que têm mais palavras correspondentes!
    partialMatches.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return b.score - a.score;
    });

    return partialMatches.map(m => m.product);
  }, [searchableProducts, products, deferredSearchTerm, globalSearchTerm, activeQuickFilter, advancedFilters]);

  // ── Ordenação Dinâmica (Preserva Relevância de Busca Quando Relevante) ──
  const sortedAndFilteredProducts = useMemo(() => {
    const list = [...filteredProducts];
    const isSearching = Boolean(deferredSearchTerm.trim() || globalSearchTerm.trim());

    // Se estiver pesquisando e a ordenação for a padrão (descrição asc),
    // mantemos a ordem de relevância da pesquisa para encontrar o produto mais rápido!
    if (isSearching && sortField === 'description' && sortDirection === 'asc') {
      return list;
    }

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
  }, [filteredProducts, sortField, sortDirection, deferredSearchTerm, globalSearchTerm]);

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
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchChange}
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

export default React.memo(InventoryTab);
