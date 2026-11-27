import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Tag,
  DollarSign,
  Package,
  Wrench,
  Image as ImageIcon,
  Truck,
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  Upload,
  ArrowRight,
  Calculator,
  Sliders,
  Eye,
  Check,
  Edit2,
  PlusCircle
} from 'lucide-react';
import { Product } from '../stock/types';

export interface ProductVariant {
  id?: number;
  sku: string;
  barcode: string;
  original_code?: string;
  alt_code?: string;
  purchase_price: number | string;
  sale_price: number | string;
  sale_price_credit: number | string;
  sale_price_wholesale: number | string;
  stock: number | string;
  min_stock: number | string;
  location?: string;
  sector?: string;
  shelf?: string;
  image_url?: string;
  status: 'Ativo' | 'Inativo';
  attribute_combination: Record<string, string>;
}

export interface ProductApplication {
  id?: number;
  brand: string;
  model: string;
  engine_cc?: string;
  year_start?: string;
  year_end?: string;
  version?: string;
  notes?: string;
}

export interface ProductSupplier {
  id?: number;
  supplier_name: string;
  supplier_code?: string;
  lead_time_days?: number | string;
  last_cost?: number | string;
}

export interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  reason?: string;
  reference_id?: string;
  username?: string;
  created_at: string;
}

interface ProductRegistrationModalERPProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onProductSaved: (savedProduct: any) => void;
  formatBRL: (val: number) => string;
  existingProducts?: Product[];
  onResetToNewProduct?: () => void;
}

type TabType =
  | 'geral'
  | 'identificacao'
  | 'variacoes'
  | 'precos'
  | 'estoque'
  | 'aplicacoes'
  | 'fotos'
  | 'fornecedores'
  | 'fiscal'
  | 'historico';

const STANDARD_ATTRIBUTES = [
  'Cor',
  'Tamanho',
  'Medida',
  'Modelo',
  'Voltagem',
  'Dentição',
  'Sobremedida',
  'Lado',
  'Acabamento'
];

export const ProductRegistrationModalERP: React.FC<ProductRegistrationModalERPProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onProductSaved,
  formatBRL,
  existingProducts = [],
  onResetToNewProduct
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFullMode, setIsFullMode] = useState(true);

  // Estado para Modal de Variação Individual (Adicionar / Editar)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<{
    attribute_combination: Record<string, string>;
    sku: string;
    barcode: string;
    purchase_price: string | number;
    sale_price: string | number;
    sale_price_credit: string | number;
    sale_price_wholesale: string | number;
    stock: string | number;
    min_stock: string | number;
    location: string;
    status: 'Ativo' | 'Inativo';
  }>({
    attribute_combination: {},
    sku: '',
    barcode: '',
    purchase_price: '',
    sale_price: '',
    sale_price_credit: '',
    sale_price_wholesale: '',
    stock: '0',
    min_stock: '0',
    location: '',
    status: 'Ativo'
  });
  const [newVariantCustomKey, setNewVariantCustomKey] = useState('');
  const [newVariantCustomVal, setNewVariantCustomVal] = useState('');

  // Form State Principal
  const [productType, setProductType] = useState<'simples' | 'com_variacoes'>('simples');
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    description: '',
    brand: '',
    category: '',
    unit: 'Unitário',
    sku: '',
    barcode: '',
    alt_code: '',
    distributor: '',
    location: '',
    sector: '',
    shelf: '',
    purchase_price: '' as string | number,
    sale_price: '' as string | number,
    sale_price_credit: '' as string | number,
    sale_price_wholesale: '' as string | number,
    stock: '' as string | number,
    min_stock: '0' as string | number,
    application: '',
    image_url: '',
    image_url2: '',
    image_url3: '',
    image_url4: '',
    ncm: '',
    cest: '',
    cfop: '5102',
    origin: '0',
    icms_cst: '102',
    status: 'Ativo'
  });

  // Atributos para o gerador de matriz de variações
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([
    { name: 'Cor', values: [] },
    { name: 'Tamanho', values: [] }
  ]);
  const [newAttrInput, setNewAttrInput] = useState<{ [key: string]: string }>({});

  // Variações Geradas
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Aplicações Estruturadas
  const [applications, setApplications] = useState<ProductApplication[]>([]);
  const [newApp, setNewApp] = useState<ProductApplication>({
    brand: 'Honda',
    model: '',
    engine_cc: '',
    year_start: '',
    year_end: '',
    version: '',
    notes: ''
  });

  // Fornecedores
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [newSupplier, setNewSupplier] = useState<ProductSupplier>({
    supplier_name: '',
    supplier_code: '',
    lead_time_days: '',
    last_cost: ''
  });

  // Histórico de Movimentações (carregado do backend)
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Ozzy AI Assistant State
  const [ozzyPrompt, setOzzyPrompt] = useState('');
  const [isOzzyAnalyzing, setIsOzzyAnalyzing] = useState(false);
  const [ozzyMessage, setOzzyMessage] = useState<string | null>(null);

  // Edição em Lote de Variações
  const [batchPrice, setBatchPrice] = useState('');
  const [batchMinStock, setBatchMinStock] = useState('');
  const [batchLocation, setBatchLocation] = useState('');

  // Inicialização ao Abrir ou Mudar de Produto
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setFormData({
        id: productToEdit.id,
        description: productToEdit.description || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category || '',
        unit: productToEdit.unit || 'Unitário',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        alt_code: productToEdit.alt_code || '',
        distributor: productToEdit.distributor || '',
        location: productToEdit.location || '',
        sector: (productToEdit as any).sector || '',
        shelf: (productToEdit as any).shelf || '',
        purchase_price: productToEdit.purchase_price ?? '',
        sale_price: productToEdit.sale_price ?? '',
        sale_price_credit: productToEdit.sale_price_credit ?? '',
        sale_price_wholesale: productToEdit.sale_price_wholesale ?? '',
        stock: productToEdit.stock ?? '',
        min_stock: (productToEdit as any).min_stock ?? '0',
        application: productToEdit.application || '',
        image_url: productToEdit.image_url || '',
        image_url2: productToEdit.image_url2 || '',
        image_url3: productToEdit.image_url3 || '',
        image_url4: productToEdit.image_url4 || '',
        ncm: (productToEdit as any).ncm || '',
        cest: (productToEdit as any).cest || '',
        cfop: (productToEdit as any).cfop || '5102',
        origin: (productToEdit as any).origin || '0',
        icms_cst: (productToEdit as any).icms_cst || '102',
        status: (productToEdit as any).status || 'Ativo'
      });

      // Carregar detalhes completos (variações, aplicações, fornecedores, histórico)
      loadProductFullDetails(productToEdit.id);
    } else {
      // Novo Produto
      resetForm();
    }
    setHasUnsavedChanges(false);
  }, [isOpen, productToEdit]);

  const resetForm = () => {
    setFormData({
      id: undefined,
      description: '',
      brand: '',
      category: '',
      unit: 'Unitário',
      sku: '',
      barcode: '',
      alt_code: '',
      distributor: '',
      location: '',
      sector: '',
      shelf: '',
      purchase_price: '',
      sale_price: '',
      sale_price_credit: '',
      sale_price_wholesale: '',
      stock: '',
      min_stock: '0',
      application: '',
      image_url: '',
      image_url2: '',
      image_url3: '',
      image_url4: '',
      ncm: '',
      cest: '',
      cfop: '5102',
      origin: '0',
      icms_cst: '102',
      status: 'Ativo'
    });
    setProductType('simples');
    setVariants([]);
    setApplications([]);
    setSuppliers([]);
    setMovements([]);
    setOzzyPrompt('');
    setOzzyMessage(null);
    setHasUnsavedChanges(false);
  };

  const loadProductFullDetails = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${productId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.variants && data.variants.length > 0) {
          setProductType('com_variacoes');
          const parsedVariants = data.variants.map((v: any) => ({
            ...v,
            attribute_combination: typeof v.attribute_combination === 'string'
              ? JSON.parse(v.attribute_combination || '{}')
              : (v.attribute_combination || {})
          }));
          setVariants(parsedVariants);

          // Sincronizar atributos existentes para visualização nos cards superiores
          const discoveredAttrs: Record<string, Set<string>> = {};
          parsedVariants.forEach((pv: any) => {
            if (pv.attribute_combination && typeof pv.attribute_combination === 'object') {
              Object.entries(pv.attribute_combination).forEach(([k, val]) => {
                if (!discoveredAttrs[k]) discoveredAttrs[k] = new Set();
                if (val && typeof val === 'string' && val.trim()) {
                  discoveredAttrs[k].add(val.trim());
                }
              });
            }
          });

          setAttributes(prev => {
            const next = [...prev];
            Object.entries(discoveredAttrs).forEach(([k, valSet]) => {
              const existingIdx = next.findIndex(a => a.name.toLowerCase() === k.toLowerCase());
              const valList = Array.from(valSet);
              if (existingIdx >= 0) {
                const merged = Array.from(new Set([...next[existingIdx].values, ...valList]));
                next[existingIdx] = { ...next[existingIdx], values: merged };
              } else {
                next.push({ name: k, values: valList });
              }
            });
            return next;
          });
        } else {
          setProductType('simples');
          setVariants([]);
        }
        setApplications(data.applications || []);
        setSuppliers(data.suppliers || []);
        setMovements(data.movements || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar detalhes completos:', e);
    }
  };

  // Atalhos de teclado (Ctrl+S, Ctrl+Enter, Esc)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAttemptClose();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave(false);
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSave(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, variants, applications, suppliers, productType, hasUnsavedChanges]);

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Existem alterações não salvas no cadastro. Deseja realmente sair e descartar as mudanças?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Cálculo da Margem e Markup em tempo real
  const cost = Number(formData.purchase_price) || 0;
  const price = Number(formData.sale_price) || 0;
  const profitMargin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0';
  const markup = cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : '0';

  // Total do Estoque
  const totalStock = useMemo(() => {
    if (productType === 'com_variacoes' && variants.length > 0) {
      return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }
    return Number(formData.stock) || 0;
  }, [productType, variants, formData.stock]);

  // Gerador Automático de Matriz de Variações
  const handleGenerateVariantMatrix = () => {
    const activeAttrs = attributes.filter(a => a.values.length > 0);
    if (activeAttrs.length === 0) {
      alert('Adicione pelo menos um valor a um atributo (Ex: Cores: Preto, Azul).');
      return;
    }

    const cartesianProduct = (arr: { name: string; values: string[] }[]) => {
      return arr.reduce((acc, curr) => {
        const res: Record<string, string>[] = [];
        acc.forEach(a => {
          curr.values.forEach(v => {
            res.push({ ...a, [curr.name]: v });
          });
        });
        return res;
      }, [{}] as Record<string, string>[]);
    };

    const combinations = cartesianProduct(activeAttrs);

    // Gerar SKU base
    const baseSku = formData.sku || (formData.description ? formData.description.substring(0, 3).toUpperCase() : 'VAR');

    const newVariantsList: ProductVariant[] = combinations.map((comb, index) => {
      // Verifica se já existe variação equivalente
      const existing = variants.find(v => {
        return Object.entries(comb).every(([k, val]) => v.attribute_combination[k] === val);
      });

      if (existing) return existing;

      const attrSuffix = Object.values(comb).join('-').toUpperCase().replace(/\s+/g, '');
      const uniqueSku = `${baseSku}-${attrSuffix}-${index + 1}`;

      return {
        sku: uniqueSku,
        barcode: '',
        original_code: '',
        alt_code: '',
        purchase_price: formData.purchase_price,
        sale_price: formData.sale_price,
        sale_price_credit: formData.sale_price_credit,
        sale_price_wholesale: formData.sale_price_wholesale,
        stock: 0,
        min_stock: formData.min_stock || 0,
        location: formData.location,
        sector: formData.sector,
        shelf: formData.shelf,
        image_url: formData.image_url,
        status: 'Ativo',
        attribute_combination: comb
      };
    });

    setVariants(newVariantsList);
    setHasUnsavedChanges(true);
  };

  // Adicionar valor ao atributo
  const handleAddAttributeValue = (attrName: string) => {
    const val = (newAttrInput[attrName] || '').trim();
    if (!val) return;

    setAttributes(prev =>
      prev.map(a => {
        if (a.name === attrName && !a.values.includes(val)) {
          return { ...a, values: [...a.values, val] };
        }
        return a;
      })
    );

    setNewAttrInput({ ...newAttrInput, [attrName]: '' });
    setHasUnsavedChanges(true);
  };

  // Remover valor do atributo
  const handleRemoveAttributeValue = (attrName: string, valToRemove: string) => {
    setAttributes(prev =>
      prev.map(a => {
        if (a.name === attrName) {
          return { ...a, values: a.values.filter(v => v !== valToRemove) };
        }
        return a;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Adicionar Novo Atributo Customizado
  const [customAttrName, setCustomAttrName] = useState('');
  const handleAddCustomAttribute = () => {
    const trimmed = customAttrName.trim();
    if (!trimmed) return;
    if (attributes.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Este atributo já existe.');
      return;
    }
    setAttributes([...attributes, { name: trimmed, values: [] }]);
    setCustomAttrName('');
    setHasUnsavedChanges(true);
  };

  // Aplicação em lote nas variações
  const handleApplyBatchEdit = () => {
    if (!batchPrice && !batchMinStock && !batchLocation) {
      alert('Preencha ao menos um campo para aplicar em lote.');
      return;
    }

    setVariants(prev =>
      prev.map(v => ({
        ...v,
        sale_price: batchPrice !== '' ? Number(batchPrice) : v.sale_price,
        min_stock: batchMinStock !== '' ? Number(batchMinStock) : v.min_stock,
        location: batchLocation !== '' ? batchLocation : v.location
      }))
    );
    setHasUnsavedChanges(true);
    alert('Edição em lote aplicada às variações!');
  };

  // Cadastrar Próximo Produto (Novo) sem sobrescrever o já cadastrado
  const handleCadastrarProximoProduto = async () => {
    if (formData.description.trim() && hasUnsavedChanges) {
      const confirmSave = window.confirm(
        'Deseja SALVAR o produto atual antes de cadastrar o próximo?\n\n' +
        '• Clique em OK para Gravar este produto e abrir a tela limpa para o novo produto.\n' +
        '• Clique em Cancelar para abrir a tela limpa imediatamente sem gravar.'
      );
      if (confirmSave) {
        await handleSave(true);
        return;
      }
    }
    resetForm();
    if (onResetToNewProduct) {
      onResetToNewProduct();
    }
    setActiveTab('geral');
  };

  // Abrir Modal para Adicionar Nova Variação Individual
  const handleOpenAddVariantModal = () => {
    setEditingVariantIndex(null);
    const baseAttrs: Record<string, string> = {};
    attributes.forEach(a => {
      baseAttrs[a.name] = '';
    });
    // Se tiver marca do produto e MARCA não estiver preenchida, sugerir
    if (formData.brand && !baseAttrs['MARCA'] && !baseAttrs['Marca']) {
      baseAttrs['MARCA'] = formData.brand;
    }

    const nextCount = variants.length + 1;
    const baseSku = formData.sku || (formData.description ? formData.description.substring(0, 3).toUpperCase() : 'VAR');

    setVariantForm({
      attribute_combination: baseAttrs,
      sku: `${baseSku}-${nextCount}`,
      barcode: '',
      purchase_price: formData.purchase_price ?? '',
      sale_price: formData.sale_price ?? '',
      sale_price_credit: formData.sale_price_credit ?? '',
      sale_price_wholesale: formData.sale_price_wholesale ?? '',
      stock: '0',
      min_stock: formData.min_stock || '0',
      location: formData.location || '',
      status: 'Ativo'
    });
    setNewVariantCustomKey('');
    setNewVariantCustomVal('');
    setIsVariantModalOpen(true);
  };

  // Abrir Modal para Editar Variação Existente
  const handleEditVariant = (idx: number) => {
    const v = variants[idx];
    if (!v) return;
    setEditingVariantIndex(idx);
    setVariantForm({
      attribute_combination: { ...(v.attribute_combination || {}) },
      sku: v.sku || '',
      barcode: v.barcode || '',
      purchase_price: v.purchase_price ?? '',
      sale_price: v.sale_price ?? '',
      sale_price_credit: v.sale_price_credit ?? '',
      sale_price_wholesale: v.sale_price_wholesale ?? '',
      stock: v.stock ?? '0',
      min_stock: v.min_stock ?? '0',
      location: v.location || '',
      status: v.status || 'Ativo'
    });
    setNewVariantCustomKey('');
    setNewVariantCustomVal('');
    setIsVariantModalOpen(true);
  };

  // Salvar Variação Individual
  const handleSaveVariantForm = () => {
    const cleanAttrs: Record<string, string> = {};
    Object.entries(variantForm.attribute_combination).forEach(([k, val]) => {
      if (val && typeof val === 'string' && val.trim()) {
        cleanAttrs[k.trim()] = val.trim();
      }
    });

    if (Object.keys(cleanAttrs).length === 0 && !variantForm.sku.trim()) {
      alert('Por favor, informe ao menos um atributo (ex: Cor ou Marca) ou o SKU da variação.');
      return;
    }

    const savedVariant: ProductVariant = {
      ...variantForm,
      attribute_combination: cleanAttrs,
      sku: variantForm.sku.trim() || `VAR-${Date.now().toString().slice(-4)}`
    };

    if (editingVariantIndex !== null) {
      setVariants(prev => prev.map((item, i) => (i === editingVariantIndex ? { ...item, ...savedVariant } : item)));
    } else {
      setVariants(prev => [...prev, savedVariant]);
      setProductType('com_variacoes');
    }

    // Sincronizar com os chips de atributos
    setAttributes(prev => {
      const next = [...prev];
      Object.entries(cleanAttrs).forEach(([attrName, attrVal]) => {
        const found = next.find(a => a.name.toLowerCase() === attrName.toLowerCase());
        if (found) {
          if (!found.values.includes(attrVal)) {
            found.values = [...found.values, attrVal];
          }
        } else {
          next.push({ name: attrName, values: [attrVal] });
        }
      });
      return next;
    });

    setHasUnsavedChanges(true);
    setIsVariantModalOpen(false);
  };

  // Assistente de IA Ozzy Virtual para interpretação inteligente
  const handleOzzyInterpret = () => {
    if (!ozzyPrompt.trim()) return;

    setIsOzzyAnalyzing(true);
    setOzzyMessage(null);

    try {
      const text = ozzyPrompt.toLowerCase();

      // Exemplo: "Manete esportivo Titan 160, preto 10 unidades, vermelho 5, azul 3 e prata 2. Custo 25 reais, venda à vista 45 reais."
      let detectedDesc = '';
      let detectedCost = '';
      let detectedSale = '';

      // Extração de preços
      const costMatch = text.match(/custo\s*(?:de|é|:)?\s*([0-9.,]+)/i) || text.match(/compra\s*(?:de|é|:)?\s*([0-9.,]+)/i);
      if (costMatch) detectedCost = costMatch[1].replace(',', '.');

      const saleMatch = text.match(/venda\s*(?:à vista|vista|de|é|:)?\s*([0-9.,]+)/i);
      if (saleMatch) detectedSale = saleMatch[1].replace(',', '.');

      // Descrição inicial antes das vírgulas de variações
      const firstPart = ozzyPrompt.split(',')[0].trim();
      detectedDesc = firstPart;

      // Detecta cores e quantidades
      const colorKeywords = ['preto', 'vermelho', 'azul', 'prata', 'dourado', 'branco', 'verde', 'amarelo', 'cinza'];
      const detectedVariants: ProductVariant[] = [];

      for (const color of colorKeywords) {
        if (text.includes(color)) {
          // Procura quantidade perto da cor: ex "preto 10", "preto 10 unidades", "10 pretas"
          const qtyRegex = new RegExp(`(?:${color}\\s*([0-9]+))|(?:([0-9]+)\\s*${color})`, 'i');
          const m = text.match(qtyRegex);
          const qty = m ? (m[1] || m[2]) : '0';

          detectedVariants.push({
            sku: `${detectedDesc.substring(0, 4).toUpperCase()}-${color.toUpperCase()}`,
            barcode: '',
            purchase_price: detectedCost || formData.purchase_price,
            sale_price: detectedSale || formData.sale_price,
            sale_price_credit: detectedSale ? Number(detectedSale) * 1.15 : formData.sale_price_credit,
            sale_price_wholesale: detectedSale ? Number(detectedSale) * 0.9 : formData.sale_price_wholesale,
            stock: qty,
            min_stock: '2',
            status: 'Ativo',
            attribute_combination: { Cor: color.charAt(0).toUpperCase() + color.slice(1) }
          });
        }
      }

      setFormData(prev => ({
        ...prev,
        description: detectedDesc || prev.description,
        purchase_price: detectedCost || prev.purchase_price,
        sale_price: detectedSale || prev.sale_price,
        sale_price_credit: detectedSale ? (Number(detectedSale) * 1.15).toFixed(2) : prev.sale_price_credit,
        sale_price_wholesale: detectedSale ? (Number(detectedSale) * 0.9).toFixed(2) : prev.sale_price_wholesale
      }));

      if (detectedVariants.length > 0) {
        setProductType('com_variacoes');
        setVariants(detectedVariants);
        setOzzyMessage(`Interpretação concluída com sucesso! Detectei ${detectedVariants.length} variações com estoque e preços configurados. Revise abaixo antes de salvar.`);
      } else {
        setOzzyMessage('Informações principais preenchidas. Revise os campos e complete os dados desejados.');
      }

      setHasUnsavedChanges(true);
    } catch (e: any) {
      setOzzyMessage(`Erro na interpretação: ${e.message}`);
    } finally {
      setIsOzzyAnalyzing(false);
    }
  };

  // Salvar Produto Completo
  const handleSave = async (andCreateNext = false) => {
    if (!formData.description.trim()) {
      setActiveTab('geral');
      alert('Por favor, informe a descrição do produto.');
      return;
    }

    if (productType === 'com_variacoes' && variants.length === 0) {
      setActiveTab('variacoes');
      alert('Você selecionou "Produto com Variações", mas ainda não gerou nenhuma variação.');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        product: {
          ...formData,
          has_variants: productType === 'com_variacoes' ? 1 : 0
        },
        variants: productType === 'com_variacoes' ? variants : [],
        applications,
        suppliers
      };

      const res = await fetch('/api/products/erp-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar produto no ERP');
      }

      const resData = await res.json();
      setHasUnsavedChanges(false);

      if (onProductSaved) {
        onProductSaved({ ...formData, id: resData.id, has_variants: payload.product.has_variants, variants });
      }

      if (andCreateNext) {
        resetForm();
        if (onResetToNewProduct) {
          onResetToNewProduct();
        }
        setActiveTab('geral');
        alert('Produto gravado com sucesso! Tela limpa pronta para cadastrar o próximo produto.');
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Falha ao salvar produto ERP:', err);
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div
        className={`relative flex flex-col bg-[#0b101b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 text-slate-100 ${
          isFullscreen ? 'w-screen h-screen rounded-none' : 'w-[96vw] h-[94dvh] max-w-[1920px]'
        }`}
      >
        {/* ========================================================= */}
        {/* CABEÇALHO FIXO                                            */}
        {/* ========================================================= */}
        <header className="flex-none px-6 py-3.5 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center font-black text-white shadow-lg shadow-rose-950/50">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wide text-white">
                  {formData.id ? 'EDITAR PRODUTO ERP' : 'NOVO CADASTRO DE PRODUTO'}
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  KOMBAT ERP 2.0
                </span>
                {formData.status === 'Ativo' ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ATIVO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                    INATIVO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {formData.description || 'Preencha os dados e variações da peça ou acessório'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Cadastrar Próximo Produto */}
            <button
              type="button"
              onClick={handleCadastrarProximoProduto}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-950/40 transition-all cursor-pointer border border-blue-500/50"
              title="Salvar produto atual e cadastrar o próximo produto em tela limpa sem sobrescrever"
            >
              <PlusCircle size={14} />
              + Cadastrar Próximo Produto
            </button>

            {/* Seletor Rápido vs Completo */}
            <button
              type="button"
              onClick={() => setIsFullMode(!isFullMode)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders size={13} className="text-rose-500" />
              {isFullMode ? 'Modo Completo' : 'Modo Rápido'}
            </button>

            {/* Maximizar / Restaurar */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title={isFullscreen ? 'Restaurar janela' : 'Maximizar'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={handleAttemptClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* CORPO EM TRÊS COLUNAS                                     */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden">
          {/* ------------------------------------------------------- */}
          {/* COLUNA ESQUERDA: NAVEGAÇÃO DE ABAS                       */}
          {/* ------------------------------------------------------- */}
          <nav className="w-56 flex-none bg-[#090e1a] border-r border-slate-800/80 p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-3 py-1">
              Seções do Cadastro
            </div>

            {[
              { id: 'geral', label: 'Dados Gerais', icon: Package, badge: formData.description ? 'OK' : 'Pendente' },
              { id: 'identificacao', label: 'Códigos & SKU', icon: Tag, badge: formData.sku ? 'OK' : null },
              { id: 'variacoes', label: 'Variações & Grade', icon: Layers, badge: productType === 'com_variacoes' ? `${variants.length} var.` : null },
              { id: 'precos', label: 'Preços & Margem', icon: DollarSign, badge: formData.sale_price ? 'OK' : null },
              { id: 'estoque', label: 'Estoque & Local', icon: Sliders, badge: totalStock > 0 ? `${totalStock} un.` : null },
              { id: 'aplicacoes', label: 'Aplicações (Motos)', icon: Wrench, badge: applications.length > 0 ? `${applications.length}` : null },
              { id: 'fotos', label: 'Galeria & Fotos', icon: ImageIcon, badge: formData.image_url ? '1+' : null },
              { id: 'fornecedores', label: 'Fornecedores', icon: Truck, badge: suppliers.length > 0 ? `${suppliers.length}` : null },
              { id: 'fiscal', label: 'Dados Fiscais', icon: FileText, badge: formData.ncm ? 'OK' : null },
              { id: 'historico', label: 'Histórico', icon: History, badge: movements.length > 0 ? `${movements.length}` : null }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Tipo de Produto (Simples vs Variação) */}
            <div className="mt-auto pt-4 border-t border-slate-800/80">
              <label className="text-[10px] font-bold text-slate-400 block mb-2 px-1 uppercase tracking-wider">
                Tipo de Produto
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setProductType('simples');
                    setHasUnsavedChanges(true);
                  }}
                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    productType === 'simples'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Simples
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductType('com_variacoes');
                    setActiveTab('variacoes');
                    setHasUnsavedChanges(true);
                  }}
                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    productType === 'com_variacoes'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Variações
                </button>
              </div>
            </div>
          </nav>

          {/* ------------------------------------------------------- */}
          {/* COLUNA CENTRAL: FORMULÁRIO DE EDIÇÃO                     */}
          {/* ------------------------------------------------------- */}
          <main className="flex-1 bg-[#0b101b] p-6 overflow-y-auto">
            {/* ABA: DADOS GERAIS */}
            {activeTab === 'geral' && (
              <div className="space-y-5 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Package size={18} className="text-rose-500" />
                      Dados Gerais do Produto
                    </h2>
                    <p className="text-xs text-slate-400">Informações principais visíveis em todo o sistema</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Descrição do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pneu Dianteiro 80/100-18 Mandrake Pirelli"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.description}
                      onChange={e => {
                        setFormData({ ...formData, description: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Marca / Fabricante</label>
                    <input
                      type="text"
                      placeholder="Ex: Honda, Pirelli, Pro Tork"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.brand}
                      onChange={e => {
                        setFormData({ ...formData, brand: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Categoria</label>
                    <input
                      type="text"
                      placeholder="Ex: Pneus, Freios, Motor"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.category}
                      onChange={e => {
                        setFormData({ ...formData, category: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Unidade de Medida</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.unit}
                      onChange={e => {
                        setFormData({ ...formData, unit: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <option value="Unitário">Unitário (UN)</option>
                      <option value="Par">Par (PR)</option>
                      <option value="Jogo">Jogo (JG)</option>
                      <option value="Kit">Kit (KT)</option>
                      <option value="Litro">Litro (L)</option>
                      <option value="Metro">Metro (MT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Status Comercial</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.status}
                      onChange={e => {
                        setFormData({ ...formData, status: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <option value="Ativo">Ativo (Permite Vendas)</option>
                      <option value="Inativo">Inativo (Bloqueado)</option>
                    </select>
                  </div>
                </div>

                {/* Aplicação Textual Livre (compatibilidade com histórico) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Aplicação Textual Resumida
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: CG 125 83 a 99 / CG 150 Titan / Fan 125 2005 em diante"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                    value={formData.application}
                    onChange={e => {
                      setFormData({ ...formData, application: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Você também pode vincular motos e anos específicos com precisão na aba{' '}
                    <strong className="text-rose-400 cursor-pointer" onClick={() => setActiveTab('aplicacoes')}>
                      Aplicações (Motos)
                    </strong>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* ABA: IDENTIFICAÇÃO E CÓDIGOS */}
            {activeTab === 'identificacao' && (
              <div className="space-y-5 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Tag size={18} className="text-rose-500" />
                      Identificação & Códigos de Busca
                    </h2>
                    <p className="text-xs text-slate-400">
                      Códigos utilizados para bipagem rápida no leitor de código de barras e busca no PDV
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Código Interno / SKU
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: PNE-00123"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.sku}
                      onChange={e => {
                        setFormData({ ...formData, sku: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Deixe em branco para o sistema gerar automaticamente o próximo sequencial único.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Código de Barras (EAN-13)
                    </label>
                    <input
                      type="text"
                      placeholder="Bipe com o leitor ou digite o EAN real"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.barcode}
                      onChange={e => {
                        setFormData({ ...formData, barcode: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Não invente códigos fictícios. Utilize o código de barras original impresso na embalagem.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Código Original do Fabricante (OEM) / Similar
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 51400-KRM-861, 909018-PIRELLI"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.alt_code}
                      onChange={e => {
                        setFormData({ ...formData, alt_code: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Distribuidor Principal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Total Peças, Motociclo, BR Parts"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.distributor}
                      onChange={e => {
                        setFormData({ ...formData, distributor: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: VARIAÇÕES E GRADE */}
            {activeTab === 'variacoes' && (
              <div className="space-y-6 max-w-5xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers size={18} className="text-rose-500" />
                      Grade de Variações Comerciais
                    </h2>
                    <p className="text-xs text-slate-400">
                      Combine atributos (Ex: Cor, Tamanho, Lado, Medida) para gerar opções com estoque e preços individuais
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateVariantMatrix}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    Gerar / Atualizar Matriz
                  </button>
                </div>

                {/* Construtor de Atributos */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Atributos Personalizáveis
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Novo atributo (Ex: Voltagem)"
                        className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white outline-none"
                        value={customAttrName}
                        onChange={e => setCustomAttrName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCustomAttribute()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomAttribute}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attributes.map(attr => (
                      <div key={attr.name} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-rose-400">{attr.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {attr.values.length} {attr.values.length === 1 ? 'opção' : 'opções'}
                          </span>
                        </div>

                        {/* Chips dos valores */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[30px]">
                          {attr.values.map(val => (
                            <span
                              key={val}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                            >
                              {val}
                              <button
                                type="button"
                                onClick={() => handleRemoveAttributeValue(attr.name, val)}
                                className="hover:text-rose-400 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          {attr.values.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">Nenhum valor adicionado</span>
                          )}
                        </div>

                        {/* Input para adicionar valor */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder={`Adicionar ${attr.name} (Enter)...`}
                            className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-rose-500"
                            value={newAttrInput[attr.name] || ''}
                            onChange={e => setNewAttrInput({ ...newAttrInput, [attr.name]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleAddAttributeValue(attr.name)}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAttributeValue(attr.name)}
                            className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edição em Lote para as Variações */}
                {variants.length > 0 && (
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Sliders size={13} className="text-rose-500" />
                        Edição em Lote:
                      </span>
                      <input
                        type="number"
                        placeholder="Preço Venda (R$)"
                        className="w-32 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                        value={batchPrice}
                        onChange={e => setBatchPrice(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Estoque Mín."
                        className="w-28 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                        value={batchMinStock}
                        onChange={e => setBatchMinStock(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Localização"
                        className="w-32 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                        value={batchLocation}
                        onChange={e => setBatchLocation(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleApplyBatchEdit}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs rounded-lg border border-slate-700 cursor-pointer"
                      >
                        Aplicar a Todas
                      </button>
                    </div>

                    {/* BOTÕES DE ADICIONAR VARIAÇÃO E NOVO PRODUTO SOLICITADOS NA CAIXA VERMELHA */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenAddVariantModal}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all border border-emerald-500/50"
                        title="Adicionar nova variação com cores, marcas e dados individuais sem alterar as existentes"
                      >
                        <Plus size={14} /> + Adicionar Nova Variação
                      </button>
                      <button
                        type="button"
                        onClick={handleCadastrarProximoProduto}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer transition-all border border-blue-500/50"
                        title="Gravar este produto e cadastrar o próximo produto com outra marca sem sobrescrever o atual"
                      >
                        <PlusCircle size={14} /> + Cadastrar Próximo Produto
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabela de Variações Geradas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Variações Cadastradas ({variants.length})
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Estoque Total Combinado: <strong className="text-white">{totalStock} un.</strong>
                    </span>
                  </div>

                  {variants.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-3">
                      <div>
                        Nenhuma variação gerada ainda. Adicione atributos acima ou cadastre variações e marcas individualmente.
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleOpenAddVariantModal}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all"
                        >
                          <Plus size={14} /> + Adicionar Nova Variação Manual
                        </button>
                        <button
                          type="button"
                          onClick={handleCadastrarProximoProduto}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer transition-all"
                        >
                          <PlusCircle size={14} /> + Cadastrar Próximo Produto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Variação / Atributos</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">EAN / Código</th>
                            <th className="py-2.5 px-3">Custo (R$)</th>
                            <th className="py-2.5 px-3">Venda à Vista (R$)</th>
                            <th className="py-2.5 px-3">Estoque</th>
                            <th className="py-2.5 px-3">Est. Mín.</th>
                            <th className="py-2.5 px-3">Local</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                          {variants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2 px-3 font-semibold text-white">
                                <div className="flex flex-wrap items-center gap-1">
                                  {Object.entries(v.attribute_combination).map(([attr, val]) => (
                                    <span
                                      key={attr}
                                      onClick={() => handleEditVariant(idx)}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 cursor-pointer border border-slate-700 transition-colors"
                                      title="Clique para editar este atributo"
                                    >
                                      <strong>{attr}:</strong> {val}
                                    </span>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => handleEditVariant(idx)}
                                    className="p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer ml-1"
                                    title="Editar atributos desta variação (Cor, Marca, etc.)"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                                  value={v.sku}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  placeholder="EAN"
                                  className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                                  value={v.barcode}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, barcode: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-right"
                                  value={v.purchase_price}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, purchase_price: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-bold text-right text-rose-400"
                                  value={v.sale_price}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, sale_price: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-bold text-center"
                                  value={v.stock}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center"
                                  value={v.min_stock}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, min_stock: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  placeholder="Ex: A1"
                                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                  value={v.location || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setVariants(prev => prev.map((item, i) => (i === idx ? { ...item, location: val } : item)));
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVariants(prev =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, status: item.status === 'Ativo' ? 'Inativo' : 'Ativo' } : item
                                      )
                                    );
                                    setHasUnsavedChanges(true);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                    v.status === 'Ativo'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {v.status}
                                </button>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEditVariant(idx)}
                                    className="p-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                                    title="Editar detalhes completos da variação"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVariants(prev => prev.filter((_, i) => i !== idx));
                                      setHasUnsavedChanges(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Remover variação"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA: PREÇOS & CALCULADORA */}
            {activeTab === 'precos' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <DollarSign size={18} className="text-rose-500" />
                      Preços & Margem de Lucro
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tabelas de preços para diferentes modalidades de vendas da Kombat Moto Peças
                    </p>
                  </div>
                </div>

                {/* Calculadora Inteligente */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Preço de Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.purchase_price}
                      onChange={e => {
                        const costVal = e.target.value;
                        setFormData({ ...formData, purchase_price: costVal });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-400 mb-1.5">Preço à Vista (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-rose-500/50 rounded-xl text-sm text-rose-300 font-bold focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.sale_price}
                      onChange={e => {
                        const pVal = e.target.value;
                        setFormData({ ...formData, sale_price: pVal });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Preço 30 Dias (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.sale_price_credit}
                      onChange={e => {
                        setFormData({ ...formData, sale_price_credit: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Preço Atacado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.sale_price_wholesale}
                      onChange={e => {
                        setFormData({ ...formData, sale_price_wholesale: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                {/* Resumo de Lucratividade */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Lucro Bruto Unitário</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {formatBRL(Math.max(0, price - cost))}
                      </div>
                    </div>
                    <DollarSign size={24} className="text-emerald-500/50" />
                  </div>

                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Margem de Lucro</span>
                      <div className="text-base font-bold text-rose-400 font-mono">{profitMargin}%</div>
                    </div>
                    <Calculator size={24} className="text-rose-500/50" />
                  </div>

                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Markup sobre Custo</span>
                      <div className="text-base font-bold text-indigo-400 font-mono">{markup}%</div>
                    </div>
                    <Sliders size={24} className="text-indigo-500/50" />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: ESTOQUE E LOCALIZAÇÃO */}
            {activeTab === 'estoque' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sliders size={18} className="text-rose-500" />
                      Estoque & Localização Física
                    </h2>
                    <p className="text-xs text-slate-400">
                      Organização de gavetas, prateleiras e alertas de reposição no depósito
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Estoque Atual (Unidades)
                    </label>
                    <input
                      type="number"
                      disabled={productType === 'com_variacoes'}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono font-bold disabled:opacity-50"
                      value={totalStock}
                      onChange={e => {
                        setFormData({ ...formData, stock: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                    {productType === 'com_variacoes' && (
                      <p className="text-[11px] text-amber-400 mt-1">
                        O estoque total é calculado automaticamente pela soma das variações.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Estoque Mínimo de Alerta
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 5"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-mono"
                      value={formData.min_stock}
                      onChange={e => {
                        setFormData({ ...formData, min_stock: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      O sistema avisará quando o estoque atingir ou ficar abaixo deste valor.
                    </p>
                  </div>
                </div>

                {/* Localização Física no Depósito */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Localização Geral</label>
                    <input
                      type="text"
                      placeholder="Ex: Corredor B, Gaveteiro 04"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.location}
                      onChange={e => {
                        setFormData({ ...formData, location: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Setor</label>
                    <input
                      type="text"
                      placeholder="Ex: Oficina, Balcão, Mezanino"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.sector}
                      onChange={e => {
                        setFormData({ ...formData, sector: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Prateleira / Gaveta</label>
                    <input
                      type="text"
                      placeholder="Ex: P-02, G-12"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all font-medium"
                      value={formData.shelf}
                      onChange={e => {
                        setFormData({ ...formData, shelf: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: APLICAÇÕES ESTRUTURADAS (MOTOS) */}
            {activeTab === 'aplicacoes' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Wrench size={18} className="text-rose-500" />
                      Aplicações em Motocicletas
                    </h2>
                    <p className="text-xs text-slate-400">
                      Cadastre os modelos, cilindradas e anos compatíveis para pesquisa inteligente no PDV e OS
                    </p>
                  </div>
                </div>

                {/* Formulário de Adicionar Aplicação */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Vincular Nova Motocicleta
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Montadora</label>
                      <select
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        value={newApp.brand}
                        onChange={e => setNewApp({ ...newApp, brand: e.target.value })}
                      >
                        <option value="Honda">Honda</option>
                        <option value="Yamaha">Yamaha</option>
                        <option value="Suzuki">Suzuki</option>
                        <option value="Kawasaki">Kawasaki</option>
                        <option value="BMW">BMW</option>
                        <option value="Dafra">Dafra</option>
                        <option value="Haojue">Haojue</option>
                        <option value="Outras">Outras</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Modelo *</label>
                      <input
                        type="text"
                        placeholder="Ex: CG 160 Titan"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        value={newApp.model}
                        onChange={e => setNewApp({ ...newApp, model: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Cilindrada (cc)</label>
                      <input
                        type="text"
                        placeholder="Ex: 160"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        value={newApp.engine_cc}
                        onChange={e => setNewApp({ ...newApp, engine_cc: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Ano Inicial</label>
                        <input
                          type="text"
                          placeholder="2016"
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          value={newApp.year_start}
                          onChange={e => setNewApp({ ...newApp, year_start: e.target.value })}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Ano Final</label>
                        <input
                          type="text"
                          placeholder="2024"
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          value={newApp.year_end}
                          onChange={e => setNewApp({ ...newApp, year_end: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <input
                      type="text"
                      placeholder="Observações complementares (Ex: Apenas modelo com freio a disco)"
                      className="flex-1 mr-3 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      value={newApp.notes}
                      onChange={e => setNewApp({ ...newApp, notes: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newApp.model.trim()) {
                          alert('Informe o modelo da moto.');
                          return;
                        }
                        setApplications([...applications, { ...newApp }]);
                        setNewApp({ brand: 'Honda', model: '', engine_cc: '', year_start: '', year_end: '', notes: '' });
                        setHasUnsavedChanges(true);
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Adicionar Aplicação
                    </button>
                  </div>
                </div>

                {/* Lista de Aplicações Vinculadas */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">
                    Aplicações Registradas ({applications.length})
                  </span>

                  {applications.length === 0 ? (
                    <div className="p-6 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                      Nenhuma aplicação estruturada vinculada a este produto.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/40">
                      {applications.map((app, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-900/40">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[11px]">
                                {app.brand}
                              </span>
                              <strong className="text-sm text-white">{app.model}</strong>
                              {app.engine_cc && (
                                <span className="text-xs text-slate-400">({app.engine_cc}cc)</span>
                              )}
                              {(app.year_start || app.year_end) && (
                                <span className="text-xs text-slate-400 font-mono">
                                  {app.year_start || '...'} até {app.year_end || 'Atual'}
                                </span>
                              )}
                            </div>
                            {app.notes && <p className="text-[11px] text-slate-400 mt-0.5">{app.notes}</p>}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setApplications(applications.filter((_, i) => i !== idx));
                              setHasUnsavedChanges(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA: FOTOS & GALERIA */}
            {activeTab === 'fotos' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon size={18} className="text-rose-500" />
                      Fotografias do Produto
                    </h2>
                    <p className="text-xs text-slate-400">
                      Até 4 fotos de alta resolução para exibição no catálogo, PDV e etiquetas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'image_url', label: 'Foto Principal' },
                    { key: 'image_url2', label: 'Foto 2 (Ângulo)' },
                    { key: 'image_url3', label: 'Foto 3 (Detalhe)' },
                    { key: 'image_url4', label: 'Foto 4 (Embalagem)' }
                  ].map(slot => {
                    const currentImg = (formData as any)[slot.key];
                    return (
                      <div key={slot.key} className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300">{slot.label}</label>
                        <div className="relative aspect-square rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 overflow-hidden flex flex-col items-center justify-center group hover:border-rose-500 transition-all">
                          {currentImg ? (
                            <>
                              <img
                                src={currentImg}
                                alt={slot.label}
                                className="w-full h-full object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, [slot.key]: '' });
                                  setHasUnsavedChanges(true);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-all cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-3">
                              <ImageIcon size={28} className="mx-auto text-slate-600 mb-1" />
                              <span className="text-[10px] text-slate-400">Sem imagem</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Cole a URL da imagem..."
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-rose-500"
                          value={currentImg || ''}
                          onChange={e => {
                            setFormData({ ...formData, [slot.key]: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA: FORNECEDORES */}
            {activeTab === 'fornecedores' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Truck size={18} className="text-rose-500" />
                      Fornecedores & Compras
                    </h2>
                    <p className="text-xs text-slate-400">Distribuidores, prazos médios de entrega e último custo</p>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Fornecedor *</label>
                    <input
                      type="text"
                      placeholder="Ex: Distribuidora Kombat Peças"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      value={newSupplier.supplier_name}
                      onChange={e => setNewSupplier({ ...newSupplier, supplier_name: e.target.value })}
                    />
                  </div>

                  <div className="w-36">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Código no Fornecedor</label>
                    <input
                      type="text"
                      placeholder="Ex: FORN-998"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      value={newSupplier.supplier_code}
                      onChange={e => setNewSupplier({ ...newSupplier, supplier_code: e.target.value })}
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Último Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      value={newSupplier.last_cost}
                      onChange={e => setNewSupplier({ ...newSupplier, last_cost: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newSupplier.supplier_name.trim()) {
                        alert('Informe o nome do fornecedor.');
                        return;
                      }
                      setSuppliers([...suppliers, { ...newSupplier }]);
                      setNewSupplier({ supplier_name: '', supplier_code: '', lead_time_days: '', last_cost: '' });
                      setHasUnsavedChanges(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">
                    Fornecedores Cadastrados ({suppliers.length})
                  </span>
                  {suppliers.map((sup, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-sm text-white">{sup.supplier_name}</strong>
                        {sup.supplier_code && (
                          <span className="text-xs text-slate-400 ml-2 font-mono">Cód: {sup.supplier_code}</span>
                        )}
                        {sup.last_cost && (
                          <span className="text-xs text-emerald-400 ml-3">
                            Último Custo: R$ {Number(sup.last_cost).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSuppliers(suppliers.filter((_, i) => i !== idx));
                          setHasUnsavedChanges(true);
                        }}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA: DADOS FISCAIS */}
            {activeTab === 'fiscal' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText size={18} className="text-rose-500" />
                      Tributação & Dados Fiscais
                    </h2>
                    <p className="text-xs text-slate-400">Classificação fiscal para emissão de NFC-e / NF-e</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">NCM (8 dígitos)</label>
                    <input
                      type="text"
                      placeholder="Ex: 8714.10.00"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono"
                      value={formData.ncm}
                      onChange={e => {
                        setFormData({ ...formData, ncm: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">CEST (7 dígitos)</label>
                    <input
                      type="text"
                      placeholder="Ex: 01.001.00"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono"
                      value={formData.cest}
                      onChange={e => {
                        setFormData({ ...formData, cest: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">CFOP Padrão</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono"
                      value={formData.cfop}
                      onChange={e => {
                        setFormData({ ...formData, cfop: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Origem da Mercadoria</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
                      value={formData.origin}
                      onChange={e => {
                        setFormData({ ...formData, origin: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <option value="0">0 - Nacional</option>
                      <option value="1">1 - Estrangeira (Importação direta)</option>
                      <option value="2">2 - Estrangeira (Adquirida mercado interno)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">CSOSN / CST ICMS</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono"
                      value={formData.icms_cst}
                      onChange={e => {
                        setFormData({ ...formData, icms_cst: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: HISTÓRICO */}
            {activeTab === 'historico' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <History size={18} className="text-rose-500" />
                      Histórico de Entradas, Saídas e Vendas
                    </h2>
                    <p className="text-xs text-slate-400">
                      Rastreabilidade completa de todas as movimentações de estoque
                    </p>
                  </div>
                </div>

                {movements.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
                    Nenhuma movimentação de estoque registrada para este produto até o momento.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Data / Hora</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3 text-right">Quantidade</th>
                          <th className="py-2.5 px-3">Motivo / Venda</th>
                          <th className="py-2.5 px-3">Operador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                        {movements.map(m => (
                          <tr key={m.id} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 text-slate-300 font-mono">
                              {new Date(m.created_at).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.type === 'ENTRADA'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : m.type === 'CANCELAMENTO'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {m.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-right text-white">
                              {m.quantity}
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {m.reason || (m.reference_id ? `Ref: ${m.reference_id}` : '-')}
                            </td>
                            <td className="py-2 px-3 text-slate-400">{m.username || 'Sistema'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ------------------------------------------------------- */}
          {/* COLUNA DIREITA: PAINEL INTELIGENTE & OZZY VIRTUAL        */}
          {/* ------------------------------------------------------- */}
          <aside className="w-80 flex-none bg-[#090e1a] border-l border-slate-800/80 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Foto Principal Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Visualização do Produto
              </span>
              <div className="aspect-square w-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Preview Principal"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-600">
                    <ImageIcon size={36} className="mx-auto mb-1 opacity-40" />
                    <span className="text-xs">Sem foto principal</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card de Resumo Comercial em Tempo Real */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                Resumo Comercial
              </span>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Preço Venda:</span>
                <strong className="text-base text-rose-400 font-mono">
                  {formatBRL(price)}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Custo:</span>
                <span className="text-slate-200 font-mono">{formatBRL(cost)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Margem de Lucro:</span>
                <span className="text-emerald-400 font-mono font-bold">{profitMargin}%</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Estoque Total:</span>
                <strong className="text-white font-mono text-sm">{totalStock} un.</strong>
              </div>

              {productType === 'com_variacoes' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Variações:</span>
                  <span className="text-indigo-400 font-bold">{variants.length} opções</span>
                </div>
              )}
            </div>

            {/* Ozzy Virtual AI Assistant */}
            <div className="p-3.5 bg-gradient-to-b from-slate-900 to-[#111928] rounded-2xl border border-rose-500/20 space-y-3 shadow-lg shadow-rose-950/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <Sparkles size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Ozzy Virtual</h3>
                  <p className="text-[10px] text-slate-400">Assistente Inteligente de Cadastro</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cole a descrição bruta recebida de fornecedor ou mensagem para gerar automaticamente o cadastro e as variações.
              </p>

              <textarea
                rows={3}
                placeholder="Ex: Manete Titan 160 preto 10 un, vermelho 5, azul 3. Custo 25, venda 45..."
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 resize-none font-sans"
                value={ozzyPrompt}
                onChange={e => setOzzyPrompt(e.target.value)}
              />

              <button
                type="button"
                onClick={handleOzzyInterpret}
                disabled={isOzzyAnalyzing || !ozzyPrompt.trim()}
                className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40 cursor-pointer"
              >
                <Sparkles size={12} />
                {isOzzyAnalyzing ? 'Interpretando...' : 'Interpretar com Ozzy'}
              </button>

              {ozzyMessage && (
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                  {ozzyMessage}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ========================================================= */}
        {/* RODAPÉ FIXO DE AÇÕES                                      */}
        {/* ========================================================= */}
        <footer className="flex-none px-6 py-3 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertCircle size={14} /> Alterações não salvas
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle size={14} className="text-emerald-500" /> Todas as alterações estão salvas
              </span>
            )}
            <span className="hidden sm:inline text-slate-400">
              Atalhos: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Ctrl+S</kbd> Salvar |{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Ctrl+Enter</kbd> Salvar & Próximo
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleCadastrarProximoProduto}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl border border-blue-500/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-950/40"
              title="Finalizar este produto e cadastrar o próximo produto limpo sem sobrescrever o atual"
            >
              <PlusCircle size={14} />
              + Cadastrar Próximo Produto
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} className="text-rose-400" />
              Salvar e Próximo
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save size={15} />
              {isSaving ? 'Gravando...' : formData.id ? 'Salvar Alterações' : 'Salvar Produto'}
            </button>
          </div>
        </footer>

        {/* ========================================================= */}
        {/* MODAL PARA ADICIONAR / EDITAR VARIAÇÃO INDIVIDUAL         */}
        {/* ========================================================= */}
        {isVariantModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {editingVariantIndex !== null ? 'Editar Variação' : 'Adicionar Nova Variação Individual'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Cadastre marca, cor e estoque sem alterar as variações já existentes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Seção de Atributos (Cor, Marca, Tamanho, etc.) */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers size={13} className="text-rose-400" />
                    Atributos da Variação (Cor, Marca, etc.)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {Object.entries(variantForm.attribute_combination).map(([attrKey, attrVal]) => (
                      <div key={attrKey} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{attrKey}</label>
                        <input
                          type="text"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-rose-500"
                          placeholder={`Ex: ${attrKey === 'MARCA' || attrKey === 'Marca' ? 'MELC, PRO TORK...' : 'VERDE, PRETO...'}`}
                          value={attrVal}
                          onChange={e =>
                            setVariantForm(prev => ({
                              ...prev,
                              attribute_combination: {
                                ...prev.attribute_combination,
                                [attrKey]: e.target.value
                              }
                            }))
                          }
                        />
                      </div>
                    ))}

                    {/* Adicionar outro atributo na hora */}
                    <div className="sm:col-span-2 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Novo Atributo (Ex: Marca, Ano, Lado)"
                        className="w-1/2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white outline-none"
                        value={newVariantCustomKey}
                        onChange={e => setNewVariantCustomKey(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Valor (Ex: PRO TORK)"
                        className="w-1/2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white outline-none"
                        value={newVariantCustomVal}
                        onChange={e => setNewVariantCustomVal(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newVariantCustomKey.trim() && newVariantCustomVal.trim()) {
                            setVariantForm(prev => ({
                              ...prev,
                              attribute_combination: {
                                ...prev.attribute_combination,
                                [newVariantCustomKey.trim()]: newVariantCustomVal.trim()
                              }
                            }));
                            setNewVariantCustomKey('');
                            setNewVariantCustomVal('');
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold rounded-lg border border-slate-700 text-[11px] cursor-pointer whitespace-nowrap"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* SKU e Código de Barras */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SKU / Código da Peça</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono outline-none"
                      value={variantForm.sku}
                      onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Código de Barras (EAN)</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono outline-none"
                      value={variantForm.barcode}
                      onChange={e => setVariantForm({ ...variantForm, barcode: e.target.value })}
                    />
                  </div>
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Preço de Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                      value={variantForm.purchase_price}
                      onChange={e => setVariantForm({ ...variantForm, purchase_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase text-rose-400">Preço de Venda à Vista (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold text-rose-400 outline-none"
                      value={variantForm.sale_price}
                      onChange={e => setVariantForm({ ...variantForm, sale_price: e.target.value })}
                    />
                  </div>
                </div>

                {/* Estoque e Localização */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Estoque Inicial</label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold outline-none"
                      value={variantForm.stock}
                      onChange={e => setVariantForm({ ...variantForm, stock: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Estoque Mínimo</label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                      value={variantForm.min_stock}
                      onChange={e => setVariantForm({ ...variantForm, min_stock: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Localização</label>
                    <input
                      type="text"
                      placeholder="Ex: PRAT. 03"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                      value={variantForm.location}
                      onChange={e => setVariantForm({ ...variantForm, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveVariantForm}
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  {editingVariantIndex !== null ? 'Atualizar Variação' : 'Confirmar e Adicionar à Grade'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProductRegistrationModalERP;

