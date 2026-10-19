import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, Trash2, Edit, Copy, FileDown, Send, Share2, CheckCircle,
  AlertCircle, X, FileText, Calendar, DollarSign, Package, Phone, User,
  Clock, Check, Eye, AlertTriangle, Layers, ArrowUpDown, Filter, Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// --- Interfaces ---
export interface PurchaseOrderItem {
  id?: number | string;
  product_id?: number | null;
  description: string;
  code?: string;
  brand?: string;
  application?: string;
  quantity: number;
  unit?: string;
  price?: number | null;
  subtotal?: number | null;
  item_notes?: string;
  is_manual?: boolean;
}

export interface PurchaseOrder {
  id: string | number;
  order_number: string;
  distributor_id?: string | number | null;
  distributor_name: string;
  representative_name?: string;
  whatsapp?: string;
  delivery_forecast?: string;
  payment_terms?: string;
  notes?: string;
  status: 'Rascunho' | 'Pendente' | 'Enviado' | 'Cancelado' | string;
  subtotal: number;
  discount: number;
  shipping: number;
  total_value: number;
  total_items?: number;
  total_units?: number;
  has_unquoted_items?: boolean | number;
  cancelled_at?: string;
  cancelled_reason?: string;
  date: string;
  items: PurchaseOrderItem[];
}

interface PurchaseOrdersModuleProps {
  purchaseOrders: PurchaseOrder[];
  distributors: any[];
  products: any[];
  companyData: any;
  companyLogo: string | null;
  localApi: any;
  fetchData: () => Promise<void>;
  formatBRL: (val: any) => string;
  setIsDistributorModalOpen?: (open: boolean) => void;
}

export const PurchaseOrdersModule: React.FC<PurchaseOrdersModuleProps> = ({
  purchaseOrders,
  distributors,
  products,
  companyData,
  companyLogo,
  localApi,
  fetchData,
  formatBRL,
  setIsDistributorModalOpen
}) => {
  // --- List View States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [periodFilter, setPeriodFilter] = useState<string>('Todos');

  // --- Order Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [orderStatus, setOrderStatus] = useState<'Rascunho' | 'Pendente' | 'Enviado' | 'Cancelado'>('Pendente');
  const [distributorId, setDistributorId] = useState('');
  const [distributorName, setDistributorName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [deliveryForecast, setDeliveryForecast] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<string>('0');
  const [shipping, setShipping] = useState<string>('0');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // Add Item States
  const [activeAddTab, setActiveAddTab] = useState<'stock' | 'manual'>('stock');

  // Stock Search Tab
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockItemQuantity, setStockItemQuantity] = useState<number>(1);
  const [selectedStockProduct, setSelectedStockProduct] = useState<any | null>(null);

  // Manual Item Tab
  const [manualDescription, setManualDescription] = useState('');
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [manualUnit, setManualUnit] = useState('UN');
  const [manualCode, setManualCode] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualApplication, setManualApplication] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Editing existing line item in modal
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemQty, setEditItemQty] = useState<number>(1);
  const [editItemPrice, setEditItemPrice] = useState<string>('');
  const [editItemNotes, setEditItemNotes] = useState<string>('');

  // Duplicate prompt
  const [duplicatePromptProduct, setDuplicatePromptProduct] = useState<{ product: any; existingIndex: number; quantity: number } | null>(null);

  // --- Document Preview & WhatsApp Modal States ---
  const [previewOrder, setPreviewOrder] = useState<PurchaseOrder | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewIncludePrices, setPreviewIncludePrices] = useState(true);

  // WhatsApp Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppOrder, setWhatsAppOrder] = useState<PurchaseOrder | null>(null);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState('');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppIncludePrices, setWhatsAppIncludePrices] = useState(true);
  const [whatsAppShareInitiated, setWhatsAppShareInitiated] = useState(false);

  // Cancel order modal
  const [cancellingOrder, setCancellingOrder] = useState<PurchaseOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Helper: Normalize string for accent-insensitive search
  const normalize = (text: string) => {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Filtered Stock Products for "Buscar no estoque"
  const filteredStockProducts = useMemo(() => {
    if (!stockSearchQuery || stockSearchQuery.trim().length < 1) return [];
    const query = normalize(stockSearchQuery);
    return products.filter(p => {
      const desc = normalize(p.description);
      const sku = normalize(p.sku);
      const barcode = normalize(p.barcode);
      const altCode = normalize(p.alt_code);
      const brand = normalize(p.brand);
      const app = normalize(p.application);
      return desc.includes(query) || sku.includes(query) || barcode.includes(query) || altCode.includes(query) || brand.includes(query) || app.includes(query);
    }).slice(0, 25);
  }, [products, stockSearchQuery]);

  // Handle Distributor Change
  const handleSelectDistributor = (selectedId: string) => {
    setIsDirty(true);
    setDistributorId(selectedId);
    if (!selectedId) {
      setDistributorName('');
      return;
    }
    const dist = distributors.find(d => String(d.id) === String(selectedId));
    if (dist) {
      setDistributorName(dist.name || '');
      setRepresentativeName(dist.contact_person || dist.contact || '');
      setWhatsapp(dist.phone || dist.whatsapp || '');
    }
  };

  // Add Item from Stock
  const handleAddStockProduct = (product: any, qtyToAdd?: number) => {
    const quantity = qtyToAdd || Number(stockItemQuantity) || 1;
    if (quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    // Check if already in items
    const existingIndex = items.findIndex(it => it.product_id === product.id || normalize(it.description) === normalize(product.description));
    if (existingIndex !== -1 && !qtyToAdd) {
      // Prompt user to add to existing line or create new
      setDuplicatePromptProduct({ product, existingIndex, quantity });
      return;
    }

    // Always use purchase_price (preço de custo), NEVER sale_price!
    const purchaseCost = product.purchase_price !== null && product.purchase_price !== undefined && Number(product.purchase_price) > 0
      ? Number(product.purchase_price)
      : null;

    const newItem: PurchaseOrderItem = {
      product_id: product.id,
      description: product.description,
      code: product.sku || product.alt_code || product.barcode || '',
      brand: product.brand || '',
      application: product.application || '',
      quantity: quantity,
      unit: product.unit || 'UN',
      price: purchaseCost,
      subtotal: purchaseCost !== null ? Math.round(quantity * purchaseCost * 100) / 100 : null,
      is_manual: false,
      item_notes: ''
    };

    setItems(prev => [...prev, newItem]);
    setIsDirty(true);
    setStockItemQuantity(1);
    setSelectedStockProduct(null);
  };

  const handleConfirmMergeStockProduct = () => {
    if (!duplicatePromptProduct) return;
    const { existingIndex, quantity } = duplicatePromptProduct;
    setItems(prev => prev.map((item, idx) => {
      if (idx === existingIndex) {
        const newQty = item.quantity + quantity;
        const newSubtotal = item.price !== null && item.price !== undefined
          ? Math.round(newQty * item.price * 100) / 100
          : null;
        return { ...item, quantity: newQty, subtotal: newSubtotal };
      }
      return item;
    }));
    setIsDirty(true);
    setDuplicatePromptProduct(null);
    setStockItemQuantity(1);
  };

  const handleAddNewLineStockProduct = () => {
    if (!duplicatePromptProduct) return;
    const { product, quantity } = duplicatePromptProduct;
    const purchaseCost = product.purchase_price !== null && product.purchase_price !== undefined && Number(product.purchase_price) > 0
      ? Number(product.purchase_price)
      : null;

    const newItem: PurchaseOrderItem = {
      product_id: product.id,
      description: product.description,
      code: product.sku || product.alt_code || product.barcode || '',
      brand: product.brand || '',
      application: product.application || '',
      quantity: quantity,
      unit: product.unit || 'UN',
      price: purchaseCost,
      subtotal: purchaseCost !== null ? Math.round(quantity * purchaseCost * 100) / 100 : null,
      is_manual: false,
      item_notes: ''
    };

    setItems(prev => [...prev, newItem]);
    setIsDirty(true);
    setDuplicatePromptProduct(null);
    setStockItemQuantity(1);
  };

  // Add Item Manually
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescription.trim()) {
      alert('Descrição da peça é obrigatória.');
      return;
    }
    const qty = Number(manualQuantity);
    if (!qty || qty <= 0) {
      alert('Quantidade deve ser maior que zero.');
      return;
    }

    // Check possible duplicate warning
    const exists = items.some(it => normalize(it.description) === normalize(manualDescription));
    if (exists) {
      const confirmAdd = window.confirm(`Atenção: Já existe um item com a descrição "${manualDescription}" no pedido. Deseja adicionar mesmo assim como uma linha separada?`);
      if (!confirmAdd) return;
    }

    const priceVal = manualPrice.trim() !== '' ? parseFloat(manualPrice.replace(',', '.')) : null;
    const validPrice = priceVal !== null && !isNaN(priceVal) && priceVal >= 0 ? priceVal : null;
    const itemSubtotal = validPrice !== null ? Math.round(qty * validPrice * 100) / 100 : null;

    const newItem: PurchaseOrderItem = {
      description: manualDescription.trim(),
      code: manualCode.trim(),
      brand: manualBrand.trim(),
      application: manualApplication.trim(),
      quantity: qty,
      unit: (manualUnit || 'UN').trim().toUpperCase(),
      price: validPrice,
      subtotal: itemSubtotal,
      item_notes: manualNotes.trim(),
      is_manual: true
    };

    setItems(prev => [...prev, newItem]);
    setIsDirty(true);

    // Reset manual form
    setManualDescription('');
    setManualQuantity(1);
    setManualCode('');
    setManualBrand('');
    setManualApplication('');
    setManualPrice('');
    setManualNotes('');
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  // Open Edit Item Inline Modal
  const handleOpenEditItem = (index: number) => {
    const item = items[index];
    setEditingItemIndex(index);
    setEditItemQty(item.quantity);
    setEditItemPrice(item.price !== null && item.price !== undefined ? String(item.price) : '');
    setEditItemNotes(item.item_notes || '');
  };

  // Save Edit Item
  const handleSaveEditItem = () => {
    if (editingItemIndex === null) return;
    const qty = Number(editItemQty);
    if (qty <= 0) {
      alert('Quantidade deve ser maior que zero.');
      return;
    }
    const priceVal = editItemPrice.trim() !== '' ? parseFloat(editItemPrice.replace(',', '.')) : null;
    const validPrice = priceVal !== null && !isNaN(priceVal) && priceVal >= 0 ? priceVal : null;
    const itemSubtotal = validPrice !== null ? Math.round(qty * validPrice * 100) / 100 : null;

    setItems(prev => prev.map((item, idx) => {
      if (idx === editingItemIndex) {
        return {
          ...item,
          quantity: qty,
          price: validPrice,
          subtotal: itemSubtotal,
          item_notes: editItemNotes.trim()
        };
      }
      return item;
    }));

    setIsDirty(true);
    setEditingItemIndex(null);
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalUnits = 0;
    let hasUnquoted = false;

    items.forEach(item => {
      totalUnits += Number(item.quantity) || 0;
      if (item.price !== null && item.price !== undefined) {
        subtotal += (Number(item.quantity) || 0) * Number(item.price);
      } else {
        hasUnquoted = true;
      }
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const numDiscount = Math.max(0, Math.round((parseFloat(discount.replace(',', '.')) || 0) * 100) / 100);
    const numShipping = Math.max(0, Math.round((parseFloat(shipping.replace(',', '.')) || 0) * 100) / 100);
    const estimatedTotal = Math.max(0, Math.round((subtotal - numDiscount + numShipping) * 100) / 100);

    return {
      lineCount: items.length,
      totalUnits,
      subtotal,
      discount: numDiscount,
      shipping: numShipping,
      estimatedTotal,
      hasUnquoted
    };
  }, [items, discount, shipping]);

  // Open New Order Modal
  const handleOpenNewOrder = () => {
    // Generate sequential / temporary order number based on current count
    const nextNumber = String(purchaseOrders.length + 1).padStart(6, '0');
    setEditingOrderId(null);
    setOrderNumber(nextNumber);
    setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderStatus('Pendente');
    setDistributorId('');
    setDistributorName('');
    setRepresentativeName('');
    setWhatsapp('');
    setDeliveryForecast('');
    setPaymentTerms('');
    setNotes('');
    setDiscount('0');
    setShipping('0');
    setItems([]);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: PurchaseOrder) => {
    setEditingOrderId(order.id);
    setOrderNumber(order.order_number || String(order.id).padStart(6, '0'));
    setOrderDate(order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setOrderStatus((order.status as any) || 'Pendente');
    setDistributorId(order.distributor_id ? String(order.distributor_id) : '');
    setDistributorName(order.distributor_name || '');
    setRepresentativeName(order.representative_name || '');
    setWhatsapp(order.whatsapp || '');
    setDeliveryForecast(order.delivery_forecast || '');
    setPaymentTerms(order.payment_terms || '');
    setNotes(order.notes || '');
    setDiscount(String(order.discount || 0));
    setShipping(String(order.shipping || 0));
    setItems(order.items || []);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  // Close with unsaved changes confirmation
  const handleCloseModal = () => {
    if (isDirty) {
      const confirmClose = window.confirm('Você possui alterações não salvas neste pedido. Deseja realmente sair e descartar as alterações?');
      if (!confirmClose) return;
    }
    setIsModalOpen(false);
    setIsDirty(false);
    setEditingOrderId(null);
  };

  // Save Order (Draft or Final)
  const handleSaveOrder = async (targetStatus: 'Rascunho' | 'Pendente') => {
    if (targetStatus === 'Pendente') {
      if (!distributorId && !distributorName.trim()) {
        alert('Por favor, selecione ou informe o distribuidor.');
        return;
      }
      if (items.length === 0) {
        alert('Adicione pelo menos um item ao pedido para salvar como pedido.');
        return;
      }
      if (calculations.discount > calculations.subtotal && calculations.subtotal > 0) {
        alert('O valor do desconto não pode ser maior que o subtotal dos itens.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        distributor_id: distributorId ? Number(distributorId) : null,
        distributor_name: distributorName.trim(),
        representative_name: representativeName.trim(),
        whatsapp: whatsapp.trim(),
        delivery_forecast: deliveryForecast.trim(),
        payment_terms: paymentTerms.trim(),
        notes: notes.trim(),
        discount: calculations.discount,
        shipping: calculations.shipping,
        status: targetStatus,
        items: items.map(it => ({
          product_id: it.product_id || null,
          description: it.description,
          code: it.code || '',
          brand: it.brand || '',
          application: it.application || '',
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'UN',
          price: it.price !== null && it.price !== undefined ? Number(it.price) : null,
          item_notes: it.item_notes || '',
          is_manual: Boolean(it.is_manual)
        }))
      };

      let savedId = editingOrderId;
      let savedNumber = orderNumber;

      if (editingOrderId) {
        await localApi.put('purchase_orders', editingOrderId, payload);
      } else {
        const res = await localApi.post('purchase_orders', payload);
        if (res && res.id) {
          savedId = res.id;
          savedNumber = res.order_number || String(res.id).padStart(6, '0');
        }
      }

      setIsDirty(false);
      setIsModalOpen(false);
      await fetchData();
      alert(`Pedido ${targetStatus === 'Rascunho' ? 'salvo como rascunho' : 'salvo com sucesso'}!`);
      return { id: savedId, order_number: savedNumber };
    } catch (error: any) {
      console.error('Error saving purchase order:', error);
      alert('Erro ao salvar pedido: ' + (error.message || 'Erro desconhecido. Os dados digitados foram preservados.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate Order
  const handleDuplicateOrder = async (order: PurchaseOrder) => {
    if (!window.confirm(`Deseja duplicar o Pedido #${order.order_number || order.id}? Um novo rascunho será criado.`)) return;
    try {
      const res = await localApi.post(`purchase_orders/${order.id}/duplicate`, {});
      await fetchData();
      alert(`Pedido duplicado com sucesso! Novo número: #${res.order_number || res.id}`);
    } catch (err: any) {
      console.error('Error duplicating order:', err);
      alert('Erro ao duplicar pedido: ' + (err.message || 'Erro desconhecido'));
    }
  };

  // Cancel Order Modal Handlers
  const handleOpenCancelOrder = (order: PurchaseOrder) => {
    setCancellingOrder(order);
    setCancelReason('');
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    try {
      await fetch(`/api/purchase_orders/${cancellingOrder.id}/status`, {
        method: 'PATCH',
        headers: localApi.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          status: 'Cancelado',
          cancelled_reason: cancelReason.trim() || 'Cancelado pelo usuário'
        })
      });
      setCancellingOrder(null);
      await fetchData();
      alert('Pedido marcado como Cancelado mantendo o histórico.');
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert('Erro ao cancelar pedido: ' + err.message);
    }
  };

  // Mark Order as Sent
  const handleMarkAsSent = async (orderId: string | number) => {
    try {
      await fetch(`/api/purchase_orders/${orderId}/status`, {
        method: 'PATCH',
        headers: localApi.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: 'Enviado' })
      });
      await fetchData();
    } catch (err: any) {
      console.error('Error updating status:', err);
    }
  };

  // --- Professional Vector PDF Generation (A4, Selectable Text) ---
  const generatePDFDocument = (order: PurchaseOrder, includePrices: boolean = true): jsPDF => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm
    let currentY = margin;

    // Helper: Draw Header & Store Details
    const drawHeader = () => {
      // Store Logo or Name
      if (companyLogo) {
        try {
          pdf.addImage(companyLogo, 'PNG', margin, currentY, 32, 16, undefined, 'FAST');
        } catch (e) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.setTextColor(225, 29, 72); // rose-600
          pdf.text('KOMBAT MOTO PEÇAS', margin, currentY + 8);
        }
      } else {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(225, 29, 72);
        pdf.text('KOMBAT MOTO PEÇAS', margin, currentY + 8);
      }

      // Store Details (from companyData)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105); // slate-600

      const razao = companyData?.razaoSocial || 'Kombat comércio de auto peças ltda';
      const cnpj = companyData?.cnpj ? `CNPJ: ${companyData.cnpj}` : '';
      const fone = companyData?.telefone ? `Tel/WhatsApp: ${companyData.telefone}` : '';
      const endereco = companyData?.endereco ? `${companyData.endereco}${companyData?.bairro ? ' - ' + companyData.bairro : ''}` : '';
      const cidadeUf = companyData?.cidade ? `${companyData.cidade} - ${companyData.estado || 'PR'}` : '';

      const startTextX = margin + 38;
      pdf.text(razao, startTextX, currentY + 4);
      if (cnpj || fone) pdf.text(`${cnpj} ${cnpj && fone ? '| ' : ''}${fone}`, startTextX, currentY + 8);
      if (endereco || cidadeUf) pdf.text(`${endereco} ${endereco && cidadeUf ? '| ' : ''}${cidadeUf}`, startTextX, currentY + 12);

      // Order Title Box (Right Side)
      const boxWidth = 58;
      const boxHeight = 18;
      const boxX = pageWidth - margin - boxWidth;
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(203, 213, 225); // slate-300
      pdf.roundedRect(boxX, currentY, boxWidth, boxHeight, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('PEDIDO DE PEÇAS', boxX + (boxWidth / 2), currentY + 5, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setTextColor(225, 29, 72); // rose-600
      pdf.text(`Nº ${order.order_number || String(order.id).padStart(6, '0')}`, boxX + (boxWidth / 2), currentY + 10, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      const formattedDate = order.date ? new Date(order.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
      pdf.text(`Emissão: ${formattedDate}`, boxX + (boxWidth / 2), currentY + 15, { align: 'center' });

      currentY += 22;

      // Divider line
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 4;
    };

    // Draw Distributor & Order Details Box
    const drawDistributorInfo = () => {
      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);

      // Col 1: Distribuidor
      pdf.text('DISTRIBUIDOR / FORNECEDOR:', margin + 3, currentY + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.distributor_name || 'Não informado', margin + 3, currentY + 9);

      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTATO / REPRESENTANTE:', margin + 3, currentY + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.representative_name || '-', margin + 3, currentY + 18);

      // Col 2: Telefone & Condições
      const col2X = margin + 95;
      pdf.setFont('helvetica', 'bold');
      pdf.text('WHATSAPP / TELEFONE:', col2X, currentY + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.whatsapp || '-', col2X, currentY + 9);

      pdf.setFont('helvetica', 'bold');
      pdf.text('CONDIÇÃO DE PAGAMENTO:', col2X, currentY + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.payment_terms || 'A combinar', col2X, currentY + 18);

      // Col 3: Previsão & Status
      const col3X = margin + 145;
      pdf.setFont('helvetica', 'bold');
      pdf.text('PREVISÃO ENTREGA:', col3X, currentY + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.delivery_forecast || 'Imediata', col3X, currentY + 9);

      pdf.setFont('helvetica', 'bold');
      pdf.text('STATUS:', col3X, currentY + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.text((order.status || 'Pendente').toUpperCase(), col3X, currentY + 18);

      currentY += 24;
    };

    // Table Header Drawer
    const drawTableHeader = () => {
      pdf.setFillColor(30, 41, 59); // slate-800
      pdf.rect(margin, currentY, contentWidth, 7, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);

      if (includePrices) {
        pdf.text('#', margin + 2, currentY + 4.8);
        pdf.text('CÓDIGO/REF', margin + 9, currentY + 4.8);
        pdf.text('DESCRIÇÃO DA PEÇA', margin + 35, currentY + 4.8);
        pdf.text('MARCA / APLICAÇÃO', margin + 92, currentY + 4.8);
        pdf.text('QTD', margin + 132, currentY + 4.8, { align: 'right' });
        pdf.text('UN', margin + 139, currentY + 4.8);
        pdf.text('VALOR UNIT.', margin + 160, currentY + 4.8, { align: 'right' });
        pdf.text('SUBTOTAL', margin + contentWidth - 2, currentY + 4.8, { align: 'right' });
      } else {
        // Quotation layout (without prices)
        pdf.text('#', margin + 2, currentY + 4.8);
        pdf.text('CÓDIGO/REF', margin + 10, currentY + 4.8);
        pdf.text('DESCRIÇÃO DA PEÇA', margin + 42, currentY + 4.8);
        pdf.text('MARCA / APLICAÇÃO', margin + 115, currentY + 4.8);
        pdf.text('QTD', margin + 165, currentY + 4.8, { align: 'right' });
        pdf.text('UN', margin + 173, currentY + 4.8);
      }

      currentY += 7;
    };

    // Page 1 initial setup
    drawHeader();
    drawDistributorInfo();
    drawTableHeader();

    // Table rows
    const orderItems = order.items || [];
    orderItems.forEach((item, index) => {
      // Check page overflow
      if (currentY > 265) {
        pdf.addPage();
        currentY = margin;
        drawHeader();
        drawTableHeader();
      }

      // Zebra striping
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, currentY, contentWidth, 7, 'F');
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);

      const itemNum = String(index + 1);
      const code = item.code || '-';
      const desc = item.description || 'Peça sem descrição';
      const brandApp = `${item.brand || ''}${item.brand && item.application ? ' - ' : ''}${item.application || '-'}` || '-';
      const qty = String(item.quantity);
      const unit = item.unit || 'UN';

      if (includePrices) {
        const priceStr = item.price !== null && item.price !== undefined ? formatBRL(item.price) : 'A cotar';
        const subtotalStr = item.subtotal !== null && item.subtotal !== undefined ? formatBRL(item.subtotal) : (item.price !== null && item.price !== undefined ? formatBRL(item.quantity * item.price) : '-');

        pdf.text(itemNum, margin + 2, currentY + 4.8);
        pdf.text(code.substring(0, 14), margin + 9, currentY + 4.8);
        pdf.text(desc.substring(0, 36), margin + 35, currentY + 4.8);
        pdf.text(brandApp.substring(0, 26), margin + 92, currentY + 4.8);
        pdf.text(qty, margin + 132, currentY + 4.8, { align: 'right' });
        pdf.text(unit, margin + 139, currentY + 4.8);
        pdf.text(priceStr, margin + 160, currentY + 4.8, { align: 'right' });
        pdf.text(subtotalStr, margin + contentWidth - 2, currentY + 4.8, { align: 'right' });
      } else {
        pdf.text(itemNum, margin + 2, currentY + 4.8);
        pdf.text(code.substring(0, 16), margin + 10, currentY + 4.8);
        pdf.text(desc.substring(0, 48), margin + 42, currentY + 4.8);
        pdf.text(brandApp.substring(0, 35), margin + 115, currentY + 4.8);
        pdf.text(qty, margin + 165, currentY + 4.8, { align: 'right' });
        pdf.text(unit, margin + 173, currentY + 4.8);
      }

      currentY += 7;
    });

    currentY += 4;

    // Check bottom space for summary & notes
    if (currentY > 235) {
      pdf.addPage();
      currentY = margin;
      drawHeader();
    }

    // Commercial Conditions & Notes (Left Side)
    const notesBoxWidth = includePrices ? 110 : contentWidth;
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(margin, currentY, notesBoxWidth, 24, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('OBSERVAÇÕES E INSTRUÇÕES:', margin + 3, currentY + 4.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 41, 59);

    const notesText = order.notes || 'Favor confirmar disponibilidade, valores e prazo de entrega antes do envio.';
    const splitNotes = pdf.splitTextToSize(notesText, notesBoxWidth - 6);
    pdf.text(splitNotes, margin + 3, currentY + 9);

    // Totals Box (Right Side - when includePrices is enabled)
    if (includePrices) {
      const totalsBoxX = margin + 115;
      const totalsBoxWidth = contentWidth - 115;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(totalsBoxX, currentY, totalsBoxWidth, 24, 2, 2, 'FD');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Itens Precificados:', totalsBoxX + 3, currentY + 5);
      pdf.text(formatBRL(order.subtotal || 0), totalsBoxX + totalsBoxWidth - 3, currentY + 5, { align: 'right' });

      if (Number(order.discount) > 0) {
        pdf.text('Desconto:', totalsBoxX + 3, currentY + 9);
        pdf.text(`- ${formatBRL(order.discount)}`, totalsBoxX + totalsBoxWidth - 3, currentY + 9, { align: 'right' });
      }

      if (Number(order.shipping) > 0) {
        pdf.text('Frete:', totalsBoxX + 3, currentY + 13);
        pdf.text(`+ ${formatBRL(order.shipping)}`, totalsBoxX + totalsBoxWidth - 3, currentY + 13, { align: 'right' });
      }

      pdf.setDrawColor(203, 213, 225);
      pdf.line(totalsBoxX + 3, currentY + 16, totalsBoxX + totalsBoxWidth - 3, currentY + 16);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(225, 29, 72);
      pdf.text('TOTAL ESTIMADO:', totalsBoxX + 3, currentY + 21);
      pdf.text(formatBRL(order.total_value || 0), totalsBoxX + totalsBoxWidth - 3, currentY + 21, { align: 'right' });
    }

    currentY += 28;

    // Total pieces count line
    const totalLines = orderItems.length;
    const totalPieces = orderItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text(`Total de Linhas: ${totalLines} | Total de Unidades: ${totalPieces}`, margin, currentY);

    if (order.has_unquoted_items) {
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(217, 119, 6); // amber-600
      pdf.text('* Atenção: existem itens aguardando cotação de valores.', margin + 70, currentY);
    }

    // Page Numbers on all pages
    const pageCount = pdf.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      pdf.setPage(p);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(
        `Kombat Moto Peças • Pedido de Peças #${order.order_number || String(order.id).padStart(6, '0')} • Página ${p} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    return pdf;
  };

  // Download PDF Action
  const handleDownloadPDF = (order: PurchaseOrder, includePrices: boolean = true) => {
    try {
      const pdf = generatePDFDocument(order, includePrices);
      const safeNum = order.order_number || String(order.id).padStart(6, '0');
      pdf.save(`Pedido_Pecas_Kombat_${safeNum}.pdf`);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('Erro ao gerar PDF: ' + err.message);
    }
  };

  // Open Document Preview Modal
  const handleOpenPreview = (order: PurchaseOrder) => {
    setPreviewOrder(order);
    setPreviewIncludePrices(true);
    setIsPreviewModalOpen(true);
  };

  // --- WhatsApp Sharing Modal Flow ---
  const handleOpenWhatsAppShare = (order: PurchaseOrder) => {
    setWhatsAppOrder(order);
    setWhatsAppRecipient(order.representative_name || order.distributor_name || '');
    setWhatsAppPhone(order.whatsapp || '');
    setWhatsAppIncludePrices(true);
    setWhatsAppShareInitiated(false);

    // Build default message
    const orderNum = order.order_number || String(order.id).padStart(6, '0');
    let msg = `Olá! Segue o pedido de peças nº ${orderNum}, da Kombat Moto Peças.\n\n*RELAÇÃO DE PEÇAS:*\n`;

    (order.items || []).forEach((item, idx) => {
      const ref = item.code ? ` (Ref: ${item.code})` : '';
      const brand = item.brand ? ` [${item.brand}]` : '';
      const priceText = (order.subtotal > 0 && item.price)
        ? ` - ${formatBRL(item.price)} un. | Subtotal: ${formatBRL(item.quantity * item.price)}`
        : '';
      msg += `${idx + 1}. ${item.quantity} ${item.unit || 'UN'} - ${item.description}${ref}${brand}${priceText}\n`;
    });

    if (order.subtotal > 0) {
      msg += `\n*Total Estimado:* ${formatBRL(order.total_value)}`;
      if (order.has_unquoted_items) {
        msg += ` _(Total parcial: existem itens a cotar)_`;
      }
    }

    if (order.notes) {
      msg += `\n\n*Observações:* ${order.notes}`;
    }

    msg += `\n\nPor favor, confirme disponibilidade, valores e prazo de entrega.`;
    setWhatsAppMessage(msg);
    setIsWhatsAppModalOpen(true);
  };

  // Trigger Native Share or Fallback Download + Open wa.me
  const handleExecuteWhatsAppShare = async () => {
    if (!whatsAppOrder) return;
    const cleanPhone = whatsAppPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Por favor, informe um número de WhatsApp válido.');
      return;
    }

    const fullPhone = cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone;
    const safeNum = whatsAppOrder.order_number || String(whatsAppOrder.id).padStart(6, '0');
    const pdfDoc = generatePDFDocument(whatsAppOrder, whatsAppIncludePrices);
    const pdfBlob = pdfDoc.output('blob');
    const pdfFile = new File([pdfBlob], `Pedido_Pecas_Kombat_${safeNum}.pdf`, { type: 'application/pdf' });

    // Try Web Share API with File
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        setWhatsAppShareInitiated(true);
        await navigator.share({
          title: `Pedido de Peças Kombat #${safeNum}`,
          text: whatsAppMessage,
          files: [pdfFile]
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to download + link:', err);
        }
      }
    }

    // Fallback: Download PDF and open WhatsApp Web / App
    try {
      pdfDoc.save(`Pedido_Pecas_Kombat_${safeNum}.pdf`);
      setWhatsAppShareInitiated(true);

      const encodedMsg = encodeURIComponent(whatsAppMessage);
      const waUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;
      window.open(waUrl, '_blank');

      alert(`O arquivo PDF "Pedido_Pecas_Kombat_${safeNum}.pdf" foi baixado!\n\nAo abrir a conversa no WhatsApp, anexe o arquivo baixado manualmente.`);
    } catch (e: any) {
      console.error('Error downloading or opening wa:', e);
      alert('Erro ao processar envio: ' + e.message);
    }
  };

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      // Search
      const search = normalize(searchTerm);
      if (search) {
        const num = normalize(order.order_number || String(order.id));
        const dist = normalize(order.distributor_name);
        const rep = normalize(order.representative_name || '');
        const hasItem = (order.items || []).some(it => normalize(it.description).includes(search) || normalize(it.code || '').includes(search));
        if (!num.includes(search) && !dist.includes(search) && !rep.includes(search) && !hasItem) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'Todos' && order.status !== statusFilter) {
        return false;
      }

      // Period
      if (periodFilter !== 'Todos' && order.date) {
        const orderDateObj = new Date(order.date);
        const now = new Date();
        if (periodFilter === 'Hoje') {
          const isToday = orderDateObj.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (periodFilter === '7dias') {
          const diffDays = (now.getTime() - orderDateObj.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (periodFilter === 'mes') {
          const isThisMonth = orderDateObj.getMonth() === now.getMonth() && orderDateObj.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        }
      }

      return true;
    });
  }, [purchaseOrders, searchTerm, statusFilter, periodFilter]);

  // Status Counts
  const statusCounts = useMemo(() => {
    return {
      todos: purchaseOrders.length,
      rascunho: purchaseOrders.filter(o => o.status === 'Rascunho').length,
      pendente: purchaseOrders.filter(o => o.status === 'Pendente').length,
      enviado: purchaseOrders.filter(o => o.status === 'Enviado').length,
      cancelado: purchaseOrders.filter(o => o.status === 'Cancelado').length,
    };
  }, [purchaseOrders]);

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="text-rose-600" size={28} />
            Pedidos de Peças para Distribuidores
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie cotações e pedidos de compra de distribuidores com agilidade e precisão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenNewOrder}
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-200 dark:shadow-none flex items-center gap-2 text-sm"
          >
            <Plus size={18} /> Novo Pedido de Peças
          </button>
          {setIsDistributorModalOpen && (
            <button
              onClick={() => setIsDistributorModalOpen(true)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Cadastrar Distribuidor
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total de Pedidos</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{statusCounts.todos}</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-sm">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Em Cotação / Pendentes</p>
          <p className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">{statusCounts.pendente}</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/40 shadow-sm">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Enviados</p>
          <p className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1">{statusCounts.enviado}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rascunhos</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{statusCounts.rascunho}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por número do pedido, distribuidor ou nome da peça..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none font-medium dark:text-slate-100"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none dark:text-slate-100"
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
            >
              <option value="Todos">Período: Todos</option>
              <option value="Hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
          {[
            { id: 'Todos', label: `Todos (${statusCounts.todos})` },
            { id: 'Pendente', label: `Pendentes (${statusCounts.pendente})` },
            { id: 'Enviado', label: `Enviados (${statusCounts.enviado})` },
            { id: 'Rascunho', label: `Rascunhos (${statusCounts.rascunho})` },
            { id: 'Cancelado', label: `Cancelados (${statusCounts.cancelado})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-300 dark:border-slate-700">
            <Package className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhum pedido encontrado</p>
            <p className="text-sm text-slate-400 mt-1">Crie um novo pedido ou altere os filtros de busca.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const statusConfig = {
              Rascunho: { bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
              Pendente: { bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' },
              Enviado: { bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300' },
              Cancelado: { bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300' }
            }[order.status] || { bg: 'bg-slate-100 text-slate-700 border-slate-300' };

            const itemCount = (order.items || []).length;
            const unitCount = (order.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-400 transition-all"
              >
                {/* Order Information */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      Pedido #{order.order_number || String(order.id).padStart(6, '0')}
                    </span>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}>
                      {(order.status || 'Pendente').toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {order.date ? new Date(order.date).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-3">
                    <span>🏢 Distribuidor: <strong className="text-slate-900 dark:text-slate-100">{order.distributor_name}</strong></span>
                    {order.representative_name && (
                      <span className="text-slate-500">👤 {order.representative_name}</span>
                    )}
                    {order.whatsapp && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Phone size={13} /> {order.whatsapp}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                    <span>📦 <strong>{itemCount}</strong> {itemCount === 1 ? 'linha' : 'linhas'} ({unitCount} unidades)</span>
                    {order.payment_terms && <span>💳 {order.payment_terms}</span>}
                    {order.delivery_forecast && <span>🚚 Previsão: {order.delivery_forecast}</span>}
                  </div>
                </div>

                {/* Totals & Quick Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
                  <div className="text-left sm:text-right pr-2">
                    <p className="text-[11px] uppercase font-bold text-slate-400">Valor Estimado</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {Number(order.total_value) > 0 ? formatBRL(order.total_value) : (order.has_unquoted_items ? 'A cotar' : 'R$ 0,00')}
                    </p>
                    {order.has_unquoted_items && Number(order.total_value) > 0 && (
                      <p className="text-[10px] text-amber-600 font-bold">Total parcial</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenPreview(order)}
                      className="p-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
                      title="Visualizar Pedido"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      onClick={() => handleOpenEditOrder(order)}
                      className="p-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 transition-colors"
                      title="Editar Pedido"
                    >
                      <Edit size={17} />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(order, true)}
                      className="p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors"
                      title="Baixar PDF A4"
                    >
                      <FileDown size={17} />
                    </button>
                    <button
                      onClick={() => handleOpenWhatsAppShare(order)}
                      className="p-2 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl hover:bg-rose-100 transition-colors"
                      title="Compartilhar pelo WhatsApp"
                    >
                      <Send size={17} />
                    </button>
                    <button
                      onClick={() => handleDuplicateOrder(order)}
                      className="p-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
                      title="Duplicar Pedido"
                    >
                      <Copy size={17} />
                    </button>
                    {order.status !== 'Cancelado' && (
                      <button
                        onClick={() => handleOpenCancelOrder(order)}
                        className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition-colors"
                        title="Cancelar Pedido"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. MODERNIZED "NOVO PEDIDO DE PEÇAS" FULL MODAL                */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-none">
                  <Package size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {editingOrderId ? `Editar Pedido #${orderNumber}` : 'Novo Pedido de Peças'}
                    </h3>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      #{orderNumber || 'NOVO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kombat Moto Peças • Pedido de Compra para Distribuidor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
              {/* SECTION 1: Distributor & Order Header Information */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <User size={15} /> Dados do Distribuidor e Pedido
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status:</span>
                    <select
                      value={orderStatus}
                      onChange={e => {
                        setOrderStatus(e.target.value as any);
                        setIsDirty(true);
                      }}
                      className="px-2.5 py-1 text-xs font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none"
                    >
                      <option value="Rascunho">RASCUNHO</option>
                      <option value="Pendente">PENDENTE</option>
                      <option value="Enviado">ENVIADO</option>
                      <option value="Cancelado">CANCELADO</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Distributor Select */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Distribuidor <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={distributorId}
                      onChange={e => handleSelectDistributor(e.target.value)}
                    >
                      <option value="">Selecione um distribuidor cadastrado...</option>
                      {distributors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Representative Name (editable per order) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Representante / Vendedor
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do vendedor..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={representativeName}
                      onChange={e => {
                        setRepresentativeName(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>

                  {/* WhatsApp (editable per order) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp do Destinatário
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: (43) 99999-9999"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={whatsapp}
                      onChange={e => {
                        setWhatsapp(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>

                  {/* Delivery Forecast */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Previsão de Entrega (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 24h, 3 dias, 15/11/2026..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={deliveryForecast}
                      onChange={e => {
                        setDeliveryForecast(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Condição de Pagamento (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: À vista, Boleto 28 DD, 30/60 dias..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={paymentTerms}
                      onChange={e => {
                        setPaymentTerms(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>

                  {/* Creation Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Criação
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={orderDate}
                      onChange={e => {
                        setOrderDate(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Add Items Area (Dual Mode Tabs) */}
              <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Plus size={15} /> Inclusão de Peças
                  </span>

                  {/* Tabs Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveAddTab('stock')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeAddTab === 'stock'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Search size={14} /> Buscar no Estoque
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddTab('manual')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeAddTab === 'manual'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Plus size={14} /> Adicionar Manualmente
                    </button>
                  </div>
                </div>

                {/* Tab 1: Buscar no Estoque */}
                {activeAddTab === 'stock' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="Pesquisar estoque por descrição, código interno, SKU, EAN ou aplicação..."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                          value={stockSearchQuery}
                          onChange={e => setStockSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Qtd Padrão:</label>
                        <input
                          type="number"
                          min="1"
                          className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-center outline-none"
                          value={stockItemQuantity}
                          onChange={e => setStockItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    </div>

                    {/* Stock Search Results Dropdown/List */}
                    {stockSearchQuery.trim().length > 0 && (
                      <div className="border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredStockProducts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 italic">
                            Nenhum produto cadastrado encontrado com este termo. Você também pode usar a aba "Adicionar Manualmente".
                          </div>
                        ) : (
                          filteredStockProducts.map(product => {
                            const stockNum = Number(product.stock) || 0;
                            const costPrice = Number(product.purchase_price) || 0;
                            return (
                              <div
                                key={product.id}
                                className="p-3 hover:bg-white dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {product.description}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                                    <span>Código: <strong>{product.sku || product.alt_code || '-'}</strong></span>
                                    {product.brand && <span>Marca: <strong>{product.brand}</strong></span>}
                                    {product.application && <span>Aplicação: <strong>{product.application}</strong></span>}
                                    <span className={stockNum > 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                      Estoque: {stockNum} {product.unit || 'UN'}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300">
                                      Custo Cadastrado: <strong>{costPrice > 0 ? formatBRL(costPrice) : 'Não informado'}</strong>
                                    </span>
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddStockProduct(product)}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                                >
                                  <Plus size={15} /> Adicionar ({stockItemQuantity})
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Adicionar Manualmente */}
                {activeAddTab === 'manual' && (
                  <form onSubmit={handleAddManualItem} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Description */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Descrição da Peça <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Pastilha de Freio Dianteira..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                          value={manualDescription}
                          onChange={e => setManualDescription(e.target.value)}
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Quantidade <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-rose-500/20"
                          value={manualQuantity}
                          onChange={e => setManualQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Unidade
                        </label>
                        <input
                          type="text"
                          placeholder="UN, PC, CX, JG..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none text-center uppercase"
                          value={manualUnit}
                          onChange={e => setManualUnit(e.target.value.toUpperCase())}
                        />
                      </div>

                      {/* Code / Reference */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Código ou Referência
                        </label>
                        <input
                          type="text"
                          placeholder="Ref. fabricante..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none"
                          value={manualCode}
                          onChange={e => setManualCode(e.target.value)}
                        />
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Marca
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Cobreq, Nakata..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none"
                          value={manualBrand}
                          onChange={e => setManualBrand(e.target.value)}
                        />
                      </div>

                      {/* Application / Model / Year */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Aplicação / Modelo / Ano
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: CG 160 Titan 2018..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none"
                          value={manualApplication}
                          onChange={e => setManualApplication(e.target.value)}
                        />
                      </div>

                      {/* Unit Price (Optional for quotation) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Valor Unit. Compra (R$)
                        </label>
                        <input
                          type="text"
                          placeholder="Em branco p/ cotar"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none text-right"
                          value={manualPrice}
                          onChange={e => setManualPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <p className="text-xs text-slate-400 italic">
                        * A inclusão manual registra a peça exclusivamente neste pedido sem criar produtos no estoque.
                      </p>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-1.5"
                      >
                        <Plus size={16} /> Incluir Peça no Pedido
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* SECTION 3: Order Items Table (Desktop) / Cards (Mobile) */}
              <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Package size={15} /> Itens Incluídos no Pedido ({items.length})
                  </span>

                  {calculations.hasUnquoted && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle size={13} /> Existem itens para cotação
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic text-sm">
                    Nenhuma peça incluída no pedido ainda. Use a busca do estoque ou a inclusão manual acima.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-black">
                            <th className="py-2.5 px-2">#</th>
                            <th className="py-2.5 px-2">Origem</th>
                            <th className="py-2.5 px-2">Código/Ref</th>
                            <th className="py-2.5 px-2">Descrição</th>
                            <th className="py-2.5 px-2">Marca/Aplicação</th>
                            <th className="py-2.5 px-2 text-center">Qtd</th>
                            <th className="py-2.5 px-2 text-center">Un</th>
                            <th className="py-2.5 px-2 text-right">Valor Unit.</th>
                            <th className="py-2.5 px-2 text-right">Subtotal</th>
                            <th className="py-2.5 px-2 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {items.map((item, idx) => {
                            const isUnquoted = item.price === null || item.price === undefined;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-2.5 px-2 font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-2.5 px-2">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    item.is_manual
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  }`}>
                                    {item.is_manual ? 'Manual' : 'Estoque'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-300">
                                  {item.code || '-'}
                                </td>
                                <td className="py-2.5 px-2 font-semibold text-slate-900 dark:text-slate-100">
                                  {item.description}
                                  {item.item_notes && (
                                    <p className="text-[11px] text-slate-400 italic">{item.item_notes}</p>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-slate-500">
                                  {item.brand || item.application ? `${item.brand || ''}${item.brand && item.application ? ' • ' : ''}${item.application || ''}` : '-'}
                                </td>
                                <td className="py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 px-2 text-center uppercase font-bold text-slate-400">
                                  {item.unit || 'UN'}
                                </td>
                                <td className="py-2.5 px-2 text-right font-medium">
                                  {isUnquoted ? (
                                    <span className="text-amber-600 font-bold">A cotar</span>
                                  ) : (
                                    formatBRL(item.price)
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-right font-bold text-slate-900 dark:text-slate-100">
                                  {isUnquoted ? (
                                    <span className="text-slate-400">-</span>
                                  ) : (
                                    formatBRL(item.subtotal || (item.quantity * (item.price || 0)))
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditItem(idx)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                                      title="Editar item"
                                    >
                                      <Edit size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(idx)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                      title="Remover item"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {items.map((item, idx) => {
                        const isUnquoted = item.price === null || item.price === undefined;
                        return (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-300 dark:border-slate-700 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-400 mr-1.5">#{idx + 1}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mr-2 ${
                                  item.is_manual
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                }`}>
                                  {item.is_manual ? 'Manual' : 'Estoque'}
                                </span>
                                <strong className="text-slate-900 dark:text-slate-100 text-sm">
                                  {item.description}
                                </strong>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditItem(idx)}
                                  className="p-1 text-indigo-600"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 text-rose-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-slate-500">
                              {item.code && <span>Cód: <strong>{item.code}</strong></span>}
                              {item.brand && <span>Marca: <strong>{item.brand}</strong></span>}
                              {item.application && <span>Aplicação: <strong>{item.application}</strong></span>}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                Qtd: {item.quantity} {item.unit || 'UN'}
                              </span>
                              <span className="font-black text-slate-900 dark:text-slate-100">
                                {isUnquoted ? 'A cotar' : formatBRL(item.subtotal || (item.quantity * (item.price || 0)))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* SECTION 4: Notes and Commercial Terms */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700/80">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Gerais do Pedido
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais para o fornecedor, observações de frete, horário para entrega..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={notes}
                  onChange={e => {
                    setNotes(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              {/* SECTION 5: Summary and Calculations */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-slate-400 font-bold uppercase">Total de Linhas</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">{calculations.lineCount}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-slate-400 font-bold uppercase">Total de Peças</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">{calculations.totalUnits}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-slate-400 font-bold uppercase">Subtotal dos Itens</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">{formatBRL(calculations.subtotal)}</p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/40">
                    <p className="text-rose-500 font-bold uppercase">Total Estimado</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-300">{formatBRL(calculations.estimatedTotal)}</p>
                  </div>
                </div>

                {/* Optional Discounts and Shipping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Desconto em Reais (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none text-right"
                      value={discount}
                      onChange={e => {
                        setDiscount(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Frete em Reais (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none text-right"
                      value={shipping}
                      onChange={e => {
                        setShipping(e.target.value);
                        setIsDirty(true);
                      }}
                    />
                  </div>
                </div>

                {/* Quotation Warning */}
                {calculations.hasUnquoted && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Total parcial: existem itens aguardando cotação de valores com o distribuidor.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveOrder('Rascunho')}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Salvar Rascunho
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const tempOrder: PurchaseOrder = {
                      id: editingOrderId || 'preview',
                      order_number: orderNumber || 'NOVO',
                      date: orderDate,
                      status: orderStatus,
                      distributor_name: distributorName || 'Distribuidor',
                      representative_name: representativeName,
                      whatsapp: whatsapp,
                      delivery_forecast: deliveryForecast,
                      payment_terms: paymentTerms,
                      notes: notes,
                      subtotal: calculations.subtotal,
                      discount: calculations.discount,
                      shipping: calculations.shipping,
                      total_value: calculations.estimatedTotal,
                      has_unquoted_items: calculations.hasUnquoted,
                      items: items
                    };
                    handleOpenPreview(tempOrder);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Eye size={15} /> Visualizar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tempOrder: PurchaseOrder = {
                      id: editingOrderId || 'temp',
                      order_number: orderNumber || '000000',
                      date: orderDate,
                      status: orderStatus,
                      distributor_name: distributorName || 'Distribuidor',
                      representative_name: representativeName,
                      whatsapp: whatsapp,
                      delivery_forecast: deliveryForecast,
                      payment_terms: paymentTerms,
                      notes: notes,
                      subtotal: calculations.subtotal,
                      discount: calculations.discount,
                      shipping: calculations.shipping,
                      total_value: calculations.estimatedTotal,
                      has_unquoted_items: calculations.hasUnquoted,
                      items: items
                    };
                    handleDownloadPDF(tempOrder, true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-100 dark:shadow-none flex items-center gap-1.5"
                >
                  <FileDown size={15} /> Baixar PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tempOrder: PurchaseOrder = {
                      id: editingOrderId || 'temp',
                      order_number: orderNumber || '000000',
                      date: orderDate,
                      status: orderStatus,
                      distributor_name: distributorName || 'Distribuidor',
                      representative_name: representativeName,
                      whatsapp: whatsapp,
                      delivery_forecast: deliveryForecast,
                      payment_terms: paymentTerms,
                      notes: notes,
                      subtotal: calculations.subtotal,
                      discount: calculations.discount,
                      shipping: calculations.shipping,
                      total_value: calculations.estimatedTotal,
                      has_unquoted_items: calculations.hasUnquoted,
                      items: items
                    };
                    handleOpenWhatsAppShare(tempOrder);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-100 dark:shadow-none flex items-center gap-1.5"
                >
                  <Send size={15} /> Enviar pelo WhatsApp
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveOrder('Pendente')}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-lg shadow-rose-200 dark:shadow-none flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingOrderId ? 'Atualizar Pedido' : 'Salvar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DUPLICATE STOCK PRODUCT MERGE PROMPT MODAL                  */}
      {/* ============================================================== */}
      {duplicatePromptProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={20} /> Produto já incluído
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              O produto <strong>{duplicatePromptProduct.product.description}</strong> já está presente na lista deste pedido.
            </p>
            <p className="text-xs text-slate-500">
              Deseja somar <strong>+{duplicatePromptProduct.quantity}</strong> unidades à linha existente ou adicionar uma nova linha separada?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDuplicatePromptProduct(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddNewLineStockProduct}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Nova Linha Separada
              </button>
              <button
                type="button"
                onClick={handleConfirmMergeStockProduct}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
              >
                Somar Quantidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. INLINE EDIT ITEM MODAL                                      */}
      {/* ============================================================== */}
      {editingItemIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Edit size={18} className="text-indigo-600" /> Editar Item do Pedido
            </h4>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {items[editingItemIndex]?.description}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  value={editItemQty}
                  onChange={e => setEditItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Valor Unitário de Compra (R$) - Deixe em branco se for cotação
                </label>
                <input
                  type="text"
                  placeholder="Em branco para cotar"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  value={editItemPrice}
                  onChange={e => setEditItemPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Observações do Item</label>
                <input
                  type="text"
                  placeholder="Ex: Peça sob encomenda, detalhe técnico..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  value={editItemNotes}
                  onChange={e => setEditItemNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItemIndex(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditItem}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DOCUMENT PREVIEW MODAL                                      */}
      {/* ============================================================== */}
      {isPreviewModalOpen && previewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText size={20} className="text-rose-600" /> Prévia do Documento • Pedido #{previewOrder.order_number || String(previewOrder.id).padStart(6, '0')}
              </h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={previewIncludePrices}
                    onChange={e => setPreviewIncludePrices(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  Incluir Valores no PDF
                </label>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Document Mockup View */}
              <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-inner space-y-6 text-slate-900 max-w-2xl mx-auto">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h4 className="text-base font-black text-rose-600 uppercase">Kombat Moto Peças</h4>
                    <p className="text-[11px] text-slate-500">{companyData?.razaoSocial}</p>
                    <p className="text-[10px] text-slate-400">CNPJ: {companyData?.cnpj} | Tel: {companyData?.telefone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-slate-800">PEDIDO DE PEÇAS</p>
                    <p className="text-sm font-black text-rose-600">Nº {previewOrder.order_number || String(previewOrder.id).padStart(6, '0')}</p>
                    <p className="text-[10px] text-slate-400">{previewOrder.date ? new Date(previewOrder.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-[11px]">
                  <p><strong>Distribuidor:</strong> {previewOrder.distributor_name}</p>
                  <p><strong>Representante:</strong> {previewOrder.representative_name || '-'}</p>
                  <p><strong>WhatsApp:</strong> {previewOrder.whatsapp || '-'}</p>
                  <p><strong>Cond. Pagamento:</strong> {previewOrder.payment_terms || '-'}</p>
                </div>

                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-slate-800 font-bold uppercase text-[10px]">
                      <th className="py-1">#</th>
                      <th className="py-1">Ref</th>
                      <th className="py-1">Descrição</th>
                      <th className="py-1 text-center">Qtd</th>
                      {previewIncludePrices && (
                        <>
                          <th className="py-1 text-right">Unitário</th>
                          <th className="py-1 text-right">Subtotal</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(previewOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5">{idx + 1}</td>
                        <td className="py-1.5 font-mono text-[10px]">{it.code || '-'}</td>
                        <td className="py-1.5 font-semibold">{it.description}</td>
                        <td className="py-1.5 text-center">{it.quantity} {it.unit || 'UN'}</td>
                        {previewIncludePrices && (
                          <>
                            <td className="py-1.5 text-right font-medium">
                              {it.price !== null && it.price !== undefined ? formatBRL(it.price) : 'A cotar'}
                            </td>
                            <td className="py-1.5 text-right font-bold">
                              {it.subtotal !== null && it.subtotal !== undefined ? formatBRL(it.subtotal) : '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {previewIncludePrices && (
                  <div className="flex justify-end pt-3 border-t">
                    <div className="text-right text-xs space-y-1">
                      <p>Subtotal: <strong>{formatBRL(previewOrder.subtotal || 0)}</strong></p>
                      {Number(previewOrder.discount) > 0 && <p>Desconto: -{formatBRL(previewOrder.discount)}</p>}
                      {Number(previewOrder.shipping) > 0 && <p>Frete: +{formatBRL(previewOrder.shipping)}</p>}
                      <p className="text-sm font-black text-rose-600">Total: {formatBRL(previewOrder.total_value || 0)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPDF(previewOrder, previewIncludePrices)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <FileDown size={15} /> Baixar PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  handleOpenWhatsAppShare(previewOrder);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send size={15} /> Compartilhar pelo WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. WHATSAPP SHARING PREVIEW MODAL                              */}
      {/* ============================================================== */}
      {isWhatsAppModalOpen && whatsAppOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send size={18} className="text-emerald-600" /> Enviar Pedido via WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Destinatário</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                    value={whatsAppRecipient}
                    onChange={e => setWhatsAppRecipient(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ex: (43) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    value={whatsAppPhone}
                    onChange={e => setWhatsAppPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mensagem Formatada</label>
                <textarea
                  rows={8}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px] leading-relaxed outline-none"
                  value={whatsAppMessage}
                  onChange={e => setWhatsAppMessage(e.target.value)}
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">
                  📱 Opções de Envio e Anexo do PDF
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Em celulares compatíveis, o menu nativo permite escolher o WhatsApp com o PDF anexado. No computador, o sistema baixa o arquivo PDF e abre a conversa para você anexar.
                </p>
              </div>

              {whatsAppShareInitiated && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    ✓ Compartilhamento iniciado!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkAsSent(whatsAppOrder.id);
                      setIsWhatsAppModalOpen(false);
                      alert('Status do pedido atualizado para ENVIADO.');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                  >
                    Marcar como Enviado
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleExecuteWhatsAppShare}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-100"
              >
                <Send size={15} /> Baixar PDF e Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. CANCEL ORDER CONFIRMATION MODAL                             */}
      {/* ============================================================== */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h4 className="text-base font-black text-rose-600 flex items-center gap-2">
              <AlertTriangle size={20} /> Cancelar Pedido #{cancellingOrder.order_number || String(cancellingOrder.id).padStart(6, '0')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              O pedido será marcado como <strong>Cancelado</strong> preservando todo o histórico de itens e cotação para consultas futuras.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Motivo do Cancelamento (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Cotação não aprovada, distribuidor sem estoque..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersModule;
