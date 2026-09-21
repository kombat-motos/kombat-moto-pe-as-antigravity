import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Layers,
  Sparkles,
  Eye,
  FileCheck,
  ChevronDown,
  X,
  Compass,
  ArrowRight,
  RefreshCw,
  Save,
  Check,
  DollarSign,
  CreditCard
} from 'lucide-react';
import {
  LabelModel,
  LabelCalibration,
  SheetTrackerState,
  KOMBAT_LABEL_MODELS,
  validateGeometry,
  calculateLabelCoordinates,
  getDefaultCalibration,
  getDefaultSheetTracker
} from './types';

interface ProductLike {
  id?: number | string;
  description: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  application?: string;
  location?: string;
  sale_price?: number;
  sale_price_credit?: number;
  sale_price_wholesale?: number;
}

interface LabelAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductLike | null;
  products?: ProductLike[];
}

export default function LabelAssistantModal({
  isOpen,
  onClose,
  product: initialProduct,
  products = []
}: LabelAssistantModalProps) {
  // Modelos disponíveis (padrão Kombat + personalizados)
  const [models, setModels] = useState<LabelModel[]>(KOMBAT_LABEL_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>('kombat-99x38');

  // Abas do Assistente: 'print' | 'sheet_map' | 'custom_sheet' | 'calibration'
  const [activeTab, setActiveTab] = useState<'print' | 'sheet_map' | 'custom_sheet' | 'calibration'>('print');

  // Produto em edição/impressão
  const [selectedProduct, setSelectedProduct] = useState<ProductLike | null>(initialProduct || null);
  const [productSearch, setProductSearch] = useState('');

  // Quantidade de etiquetas desejada
  const [quantity, setQuantity] = useState<number>(1);

  // Calibrações salvas por modelo (chave: modelId)
  const [calibrations, setCalibrations] = useState<Record<string, LabelCalibration>>({});

  // Controle de folhas por modelo (chave: modelId)
  const [sheetTrackers, setSheetTrackers] = useState<Record<string, SheetTrackerState>>({});

  // Seleção manual temporária de posições na folha (se o usuário clicar no mapa)
  const [manualSelectedPositions, setManualSelectedPositions] = useState<number[] | null>(null);

  // Estado de confirmação pós-impressão
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [lastPrintedPositions, setLastPrintedPositions] = useState<number[]>([]);

  // Formulário do Assistente "Configurar Minha Folha"
  const [customForm, setCustomForm] = useState({
    name: 'Minha Etiqueta Personalizada',
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    columns: 2,
    rows: 7,
    marginLeftMm: 5.9,
    marginRightMm: 5.9,
    marginTopMm: 15.1,
    marginBottomMm: 15.1,
    gapHorizontalMm: 0.0,
    gapVerticalMm: 0.0
  });

  // Mensagens de status/toast
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Configuração de exibição de preços na etiqueta (À Vista / A Prazo)
  const [showCashPrice, setShowCashPrice] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kombat_label_show_cash_price');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [showCreditPrice, setShowCreditPrice] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kombat_label_show_credit_price');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [customCashPrice, setCustomCashPrice] = useState<string>('');
  const [customCreditPrice, setCustomCreditPrice] = useState<string>('');

  // Sincronizar preços do produto selecionado
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.sale_price !== undefined && selectedProduct.sale_price !== null && Number(selectedProduct.sale_price) > 0) {
        setCustomCashPrice(Number(selectedProduct.sale_price).toFixed(2));
      } else {
        setCustomCashPrice('');
      }

      if (selectedProduct.sale_price_credit !== undefined && selectedProduct.sale_price_credit !== null && Number(selectedProduct.sale_price_credit) > 0) {
        setCustomCreditPrice(Number(selectedProduct.sale_price_credit).toFixed(2));
      } else if (selectedProduct.sale_price && Number(selectedProduct.sale_price) > 0) {
        // Cálculo sugerido para venda a prazo (+10%)
        const suggested = Number(selectedProduct.sale_price) * 1.1;
        setCustomCreditPrice(suggested.toFixed(2));
      } else {
        setCustomCreditPrice('');
      }
    }
  }, [selectedProduct]);

  // Função para formatar preço em Real BRL
  const formatPriceDisplay = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return '0,00';
    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Inicialização e carregamento persistente
  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    } else if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]);
    }
  }, [initialProduct, products]);

  // Carregar calibrações e estados de folha do localStorage e do backend
  useEffect(() => {
    // Carregar do localStorage
    try {
      const savedCalibsStr = localStorage.getItem('kombat_labels_calibrations');
      if (savedCalibsStr) {
        setCalibrations(JSON.parse(savedCalibsStr));
      }
      const savedSheetsStr = localStorage.getItem('kombat_labels_sheet_trackers');
      if (savedSheetsStr) {
        setSheetTrackers(JSON.parse(savedSheetsStr));
      }
      const customModelsStr = localStorage.getItem('kombat_custom_label_models');
      if (customModelsStr) {
        const customModels = JSON.parse(customModelsStr);
        setModels([...KOMBAT_LABEL_MODELS, ...customModels]);
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações locais de etiquetas:', e);
    }

    // Carregar do SQLite via backend
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    fetch('/api/label-configs', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => (res.ok ? res.json() : []))
      .then((rows: any[]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          const remoteCalibs: Record<string, LabelCalibration> = {};
          const remoteSheets: Record<string, SheetTrackerState> = {};
          const remoteCustomModels: LabelModel[] = [];

          rows.forEach(r => {
            try {
              const data = JSON.parse(r.config_json);
              if (r.id.startsWith('calib_')) {
                const modelId = r.id.replace('calib_', '');
                remoteCalibs[modelId] = data;
              } else if (r.id.startsWith('sheet_')) {
                const modelId = r.id.replace('sheet_', '');
                remoteSheets[modelId] = data;
              } else if (r.id.startsWith('model_')) {
                remoteCustomModels.push(data);
              }
            } catch (err) {
              console.error('Erro ao decodificar config do banco:', err);
            }
          });

          if (Object.keys(remoteCalibs).length > 0) {
            setCalibrations(prev => ({ ...prev, ...remoteCalibs }));
          }
          if (Object.keys(remoteSheets).length > 0) {
            setSheetTrackers(prev => ({ ...prev, ...remoteSheets }));
          }
          if (remoteCustomModels.length > 0) {
            setModels(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const toAdd = remoteCustomModels.filter(m => !existingIds.has(m.id));
              return [...prev, ...toAdd];
            });
          }
        }
      })
      .catch(err => console.warn('Aviso ao sincronizar configs com backend:', err));
  }, []);

  // Modelo ativo atual
  const currentModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId) || models[0];
  }, [models, selectedModelId]);

  // Calibração do modelo ativo
  const currentCalibration = useMemo(() => {
    if (calibrations[currentModel.id]) {
      return calibrations[currentModel.id];
    }
    return getDefaultCalibration(currentModel);
  }, [calibrations, currentModel]);

  // Estado da folha do modelo ativo
  const currentSheetTracker = useMemo(() => {
    if (sheetTrackers[currentModel.id]) {
      return sheetTrackers[currentModel.id];
    }
    return getDefaultSheetTracker(currentModel.id);
  }, [sheetTrackers, currentModel.id]);

  // Validação geométrica em tempo real do modelo ativo
  const geometryValidation = useMemo(() => {
    return validateGeometry({
      labelWidthMm: currentModel.labelWidthMm,
      labelHeightMm: currentModel.labelHeightMm,
      columns: currentModel.columns,
      rows: currentModel.rows,
      marginLeftMm: currentCalibration.marginLeftMm,
      marginRightMm: currentCalibration.marginRightMm,
      marginTopMm: currentCalibration.marginTopMm,
      marginBottomMm: currentCalibration.marginBottomMm,
      gapHorizontalMm: currentCalibration.gapHorizontalMm,
      gapVerticalMm: currentCalibration.gapVerticalMm
    });
  }, [currentModel, currentCalibration]);

  // Validação em tempo real do formulário customizado
  const customFormValidation = useMemo(() => {
    return validateGeometry({
      labelWidthMm: Number(customForm.labelWidthMm) || 1,
      labelHeightMm: Number(customForm.labelHeightMm) || 1,
      columns: Number(customForm.columns) || 1,
      rows: Number(customForm.rows) || 1,
      marginLeftMm: Number(customForm.marginLeftMm) || 0,
      marginRightMm: Number(customForm.marginRightMm) || 0,
      marginTopMm: Number(customForm.marginTopMm) || 0,
      marginBottomMm: Number(customForm.marginBottomMm) || 0,
      gapHorizontalMm: Number(customForm.gapHorizontalMm) || 0,
      gapVerticalMm: Number(customForm.gapVerticalMm) || 0
    });
  }, [customForm]);

  // Cálculo automático das posições a imprimir
  // Posições usadas: currentSheetTracker.usedPositions
  // Se manualSelectedPositions !== null, usa a seleção manual do usuário
  const selectedPositionsToPrint = useMemo(() => {
    if (manualSelectedPositions !== null) {
      return manualSelectedPositions;
    }

    const total = currentModel.totalPerSheet;
    const usedSet = new Set(currentSheetTracker.usedPositions);
    const result: number[] = [];

    for (let pos = 1; pos <= total; pos++) {
      if (!usedSet.has(pos)) {
        result.push(pos);
        if (result.length >= quantity) break;
      }
    }
    return result;
  }, [manualSelectedPositions, currentModel.totalPerSheet, currentSheetTracker.usedPositions, quantity]);

  // Resetar seleção manual quando mudar modelo ou quantidade
  const handleQuantityChange = (newQty: number) => {
    const maxAvailable = currentModel.totalPerSheet - currentSheetTracker.usedPositions.length;
    const clamped = Math.max(1, Math.min(newQty, Math.max(1, maxAvailable || currentModel.totalPerSheet)));
    setQuantity(clamped);
    setManualSelectedPositions(null);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setManualSelectedPositions(null);
  };

  // Alternar posição manual no mapa interativo
  const handleTogglePosition = (pos: number) => {
    const isUsed = currentSheetTracker.usedPositions.includes(pos);
    if (isUsed) {
      // Se já estava usada, permitir desmarcar como usada (para reutilizar ou corrigir folha)
      const updatedUsed = currentSheetTracker.usedPositions.filter(p => p !== pos);
      saveSheetTracker({ ...currentSheetTracker, usedPositions: updatedUsed });
      setManualSelectedPositions(null);
      return;
    }

    const currentSelection = manualSelectedPositions !== null
      ? [...manualSelectedPositions]
      : [...selectedPositionsToPrint];

    if (currentSelection.includes(pos)) {
      const nextSelection = currentSelection.filter(p => p !== pos);
      setManualSelectedPositions(nextSelection);
      setQuantity(Math.max(1, nextSelection.length));
    } else {
      const nextSelection = [...currentSelection, pos].sort((a, b) => a - b);
      setManualSelectedPositions(nextSelection);
      setQuantity(nextSelection.length);
    }
  };

  // Iniciar nova folha (resetar usadas)
  const handleStartNewSheet = () => {
    const nextTracker: SheetTrackerState = {
      modelId: currentModel.id,
      sheetNumber: currentSheetTracker.sheetNumber + 1,
      usedPositions: [],
      updatedAt: new Date().toISOString()
    };
    saveSheetTracker(nextTracker);
    setManualSelectedPositions(null);
    showFeedback(`Nova Folha #${String(nextTracker.sheetNumber).padStart(3, '0')} iniciada!`, 'success');
  };

  // Salvar estado da folha
  const saveSheetTracker = (tracker: SheetTrackerState) => {
    const nextTrackers = { ...sheetTrackers, [tracker.modelId]: tracker };
    setSheetTrackers(nextTrackers);
    try {
      localStorage.setItem('kombat_labels_sheet_trackers', JSON.stringify(nextTrackers));
    } catch (e) {}

    // Sincronizar com SQLite
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    fetch('/api/label-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        id: `sheet_${tracker.modelId}`,
        name: `Controle de Folha ${tracker.modelId}`,
        config_json: JSON.stringify(tracker)
      })
    }).catch(err => console.warn('Erro ao salvar tracker no backend:', err));
  };

  // Salvar calibração
  const saveCalibration = (newCalib: LabelCalibration) => {
    const nextCalibs = { ...calibrations, [newCalib.modelId]: newCalib };
    setCalibrations(nextCalibs);
    try {
      localStorage.setItem('kombat_labels_calibrations', JSON.stringify(nextCalibs));
    } catch (e) {}

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    fetch('/api/label-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        id: `calib_${newCalib.modelId}`,
        name: `Calibração ${newCalib.modelId} (${newCalib.printerName})`,
        config_json: JSON.stringify(newCalib)
      })
    }).catch(err => console.warn('Erro ao salvar calibração no backend:', err));

    showFeedback('Calibração salva com sucesso!', 'success');
  };

  // Ajustes finos de X / Y
  const handleAdjustOffset = (axis: 'X' | 'Y', delta: number) => {
    const updated: LabelCalibration = {
      ...currentCalibration,
      offsetX: axis === 'X' ? Number((currentCalibration.offsetX + delta).toFixed(2)) : currentCalibration.offsetX,
      offsetY: axis === 'Y' ? Number((currentCalibration.offsetY + delta).toFixed(2)) : currentCalibration.offsetY
    };
    saveCalibration(updated);
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Salvar formulário "Configurar Minha Folha"
  const handleSaveCustomSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormValidation.valid) {
      showFeedback('A geometria da folha ultrapassa o papel A4. Corrija antes de salvar.', 'error');
      return;
    }

    const newId = `custom-${Date.now()}`;
    const newModel: LabelModel = {
      id: newId,
      name: customForm.name.trim() || `Personalizada ${customForm.labelWidthMm}x${customForm.labelHeightMm}mm`,
      paper: 'A4',
      paperWidthMm: 210.0,
      paperHeightMm: 297.0,
      labelWidthMm: Number(customForm.labelWidthMm),
      labelHeightMm: Number(customForm.labelHeightMm),
      columns: Number(customForm.columns),
      rows: Number(customForm.rows),
      totalPerSheet: Number(customForm.columns) * Number(customForm.rows),
      marginLeftMm: Number(customForm.marginLeftMm),
      marginRightMm: Number(customForm.marginRightMm),
      marginTopMm: Number(customForm.marginTopMm),
      marginBottomMm: Number(customForm.marginBottomMm),
      gapHorizontalMm: Number(customForm.gapHorizontalMm),
      gapVerticalMm: Number(customForm.gapVerticalMm),
      printerName: 'Epson EcoTank L3250',
      isCustom: true
    };

    const nextModels = [...models, newModel];
    setModels(nextModels);
    try {
      const customOnly = nextModels.filter(m => m.isCustom);
      localStorage.setItem('kombat_custom_label_models', JSON.stringify(customOnly));
    } catch (e) {}

    // Salvar no SQLite
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    fetch('/api/label-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        id: `model_${newId}`,
        name: newModel.name,
        config_json: JSON.stringify(newModel)
      })
    }).catch(err => console.warn('Erro ao salvar modelo no backend:', err));

    setSelectedModelId(newId);
    setActiveTab('print');
    showFeedback(`Modelo "${newModel.name}" salvo e selecionado!`, 'success');
  };

  // ==========================================
  // DISPARO DE IMPRESSÃO (REAL & TESTE)
  // ==========================================

  // 1. Folha de Teste com Contornos e Números
  const handlePrintTestSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Bloqueador de popups ativado. Por favor, autorize popups para imprimir.');
      return;
    }

    const { columns, rows } = currentModel;
    const {
      labelWidthMm,
      labelHeightMm
    } = currentModel;
    const {
      marginLeftMm,
      marginTopMm,
      gapHorizontalMm,
      gapVerticalMm,
      offsetX,
      offsetY
    } = currentCalibration;

    let cellsHtml = '';
    let pos = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const coords = calculateLabelCoordinates(c, r, currentModel, currentCalibration);
        cellsHtml += `
          <div class="test-label" style="
            position: absolute;
            left: ${coords.xMm}mm;
            top: ${coords.yMm}mm;
            width: ${coords.widthMm}mm;
            height: ${coords.heightMm}mm;
          ">
            <div class="pos-number">${String(pos).padStart(2, '0')}</div>
            <div class="pos-meta">${coords.widthMm} × ${coords.heightMm} mm</div>
            <div class="crosshair top-left"></div>
            <div class="crosshair top-right"></div>
            <div class="crosshair btm-left"></div>
            <div class="crosshair btm-right"></div>
          </div>
        `;
        pos++;
      }
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TESTE DE ALINHAMENTO — ${currentModel.name} (Epson L3250)</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 210mm;
                height: 297mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              position: relative;
              width: 210mm;
              height: 297mm;
              box-sizing: border-box;
            }
            .info-banner {
              position: absolute;
              top: 2mm;
              left: 5mm;
              right: 5mm;
              font-size: 7pt;
              text-align: center;
              color: #444;
              border-bottom: 0.2mm solid #ddd;
              padding-bottom: 1mm;
            }
            .test-label {
              border: 0.2mm solid #111;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: transparent;
            }
            .pos-number {
              font-size: 16pt;
              font-weight: 900;
              color: #111;
              line-height: 1;
            }
            .pos-meta {
              font-size: 6pt;
              font-weight: 700;
              color: #555;
              margin-top: 1mm;
            }
            .crosshair {
              position: absolute;
              width: 3mm;
              height: 3mm;
            }
            .top-left { top: 0; left: 0; border-top: 0.4mm solid #000; border-left: 0.4mm solid #000; }
            .top-right { top: 0; right: 0; border-top: 0.4mm solid #000; border-right: 0.4mm solid #000; }
            .btm-left { bottom: 0; left: 0; border-bottom: 0.4mm solid #000; border-left: 0.4mm solid #000; }
            .btm-right { bottom: 0; right: 0; border-bottom: 0.4mm solid #000; border-right: 0.4mm solid #000; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); }, 400)">
          <div class="info-banner">
            FOLHA DE TESTE — KOMBAT MOTO PEÇAS | Modelo: ${currentModel.name} | Epson L3250 | Offset X: ${offsetX >= 0 ? '+' : ''}${offsetX}mm, Y: ${offsetY >= 0 ? '+' : ''}${offsetY}mm
          </div>
          ${cellsHtml}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // 2. Impressão Real Física de Etiquetas
  const handlePrintRealLabels = () => {
    if (!geometryValidation.valid) {
      alert('Configuração inválida de geometria. Corrija as margens antes de imprimir.');
      return;
    }

    const prod = selectedProduct || {
      description: 'PRODUTO NÃO SELECIONADO',
      sku: 'SKU-000',
      barcode: '789000000000',
      brand: 'KOMBAT',
      application: 'GERAL',
      location: 'ESTOQUE'
    };

    const barcodeValue = prod.barcode || prod.sku || 'KOMBAT';
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeValue)}&scale=2&height=6&includetext`;
    const displayCash = formatPriceDisplay(customCashPrice);
    const displayCredit = formatPriceDisplay(customCreditPrice);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Bloqueador de popups ativado. Por favor, autorize popups para imprimir.');
      return;
    }

    const { columns, rows } = currentModel;
    const isLarge = currentModel.labelWidthMm >= 90;

    let cellsHtml = '';
    let pos = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const coords = calculateLabelCoordinates(c, r, currentModel, currentCalibration);
        const shouldPrint = selectedPositionsToPrint.includes(pos);

        if (shouldPrint) {
          if (isLarge) {
            // Modelo 99,1 x 38,1 mm
            cellsHtml += `
              <div class="label-box label-large" style="
                position: absolute;
                left: ${coords.xMm}mm;
                top: ${coords.yMm}mm;
                width: ${coords.widthMm}mm;
                height: ${coords.heightMm}mm;
              ">
                <div class="large-header">
                  <div class="large-title">${prod.description}</div>
                  <div class="large-sku">${prod.sku || prod.barcode || 'S/ SKU'}</div>
                </div>
                <div class="large-middle">
                  ${prod.brand ? `<span class="large-brand">MARCA: <strong>${prod.brand}</strong></span>` : ''}
                  ${prod.application ? `<span class="large-app">APL: ${prod.application}</span>` : ''}
                </div>
                ${(showCashPrice || showCreditPrice) ? `
                  <div class="large-prices">
                    ${showCashPrice ? `
                      <div class="large-price-item">
                        <span class="large-price-lbl">À VISTA:</span>
                        <span class="large-price-val">R$ ${displayCash}</span>
                      </div>
                    ` : ''}
                    ${showCreditPrice ? `
                      <div class="large-price-item">
                        <span class="large-price-lbl">A PRAZO:</span>
                        <span class="large-price-val credit">R$ ${displayCredit}</span>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
                <div class="large-footer">
                  <div class="large-loc">
                    <span class="loc-lbl">LOCALIZAÇÃO</span>
                    <span class="loc-val">${prod.location || 'ESTOQUE PADRÃO'}</span>
                  </div>
                  <div class="large-barcode">
                    <img src="${barcodeUrl}" alt="Barcode" />
                  </div>
                </div>
              </div>
            `;
          } else {
            // Modelo 63,5 x 31 mm ou outros
            cellsHtml += `
              <div class="label-box label-standard" style="
                position: absolute;
                left: ${coords.xMm}mm;
                top: ${coords.yMm}mm;
                width: ${coords.widthMm}mm;
                height: ${coords.heightMm}mm;
              ">
                <div class="std-title">${prod.description}</div>
                <div class="std-sku">${prod.sku || prod.barcode || 'S/ SKU'}</div>
                ${(showCashPrice || showCreditPrice) ? `
                  <div class="std-prices">
                    ${showCashPrice ? `
                      <div class="std-price-item">
                        <span class="std-price-lbl">À VISTA</span>
                        <span class="std-price-val">R$ ${displayCash}</span>
                      </div>
                    ` : ''}
                    ${showCreditPrice ? `
                      <div class="std-price-item">
                        <span class="std-price-lbl">A PRAZO</span>
                        <span class="std-price-val credit">R$ ${displayCredit}</span>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
                <div class="std-footer">
                  <div class="std-loc">LOC:<br/>${prod.location || 'ESTOQUE'}</div>
                  <div class="std-barcode">
                    <img src="${barcodeUrl}" alt="Barcode" />
                  </div>
                </div>
              </div>
            `;
          }
        } else {
          // Mantém o espaço FISICAMENTE EM BRANCO para não imprimir onde já foi usado ou onde não deve
          cellsHtml += `
            <div class="label-box label-empty" style="
              position: absolute;
              left: ${coords.xMm}mm;
              top: ${coords.yMm}mm;
              width: ${coords.widthMm}mm;
              height: ${coords.heightMm}mm;
              visibility: hidden;
            "></div>
          `;
        }
        pos++;
      }
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ETIQUETAS — ${prod.description} (${currentModel.name})</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 210mm;
                height: 297mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              position: relative;
              width: 210mm;
              height: 297mm;
              box-sizing: border-box;
            }
            .label-box {
              box-sizing: border-box;
              overflow: hidden;
              background: #fff;
            }
            /* Layout 99,1 x 38,1 mm */
            .label-large {
              padding: 3.5mm 4mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 0.1mm solid transparent;
            }
            .large-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 2mm;
            }
            .large-title {
              font-size: 13.5px;
              font-weight: 900;
              text-transform: uppercase;
              text-align: left;
              line-height: 1.15;
              max-height: 33px;
              overflow: hidden;
              flex: 1;
              letter-spacing: -0.2px;
            }
            .large-sku {
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.5px;
              white-space: nowrap;
              border: 1px solid #000;
              padding: 1px 4px;
              border-radius: 3px;
            }
            .large-middle {
              display: flex;
              justify-content: space-between;
              font-size: 7.5px;
              color: #333;
              line-height: 1.1;
              margin-top: 1mm;
              overflow: hidden;
              max-height: 9px;
            }
            .large-middle .large-app {
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 60%;
            }
            .large-prices {
              display: flex;
              align-items: baseline;
              gap: 4mm;
              margin: 0.8mm 0;
              padding: 0.4mm 0;
              border-top: 0.15mm solid #000;
              border-bottom: 0.15mm solid #000;
            }
            .large-price-item {
              display: flex;
              align-items: baseline;
              gap: 1mm;
            }
            .large-price-lbl {
              font-size: 7px;
              font-weight: 800;
              color: #222;
            }
            .large-price-val {
              font-size: 11px;
              font-weight: 900;
              color: #000;
            }
            .large-price-val.credit {
              font-size: 10px;
            }
            .large-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 3mm;
              margin-top: auto;
            }
            .large-loc {
              display: flex;
              flex-direction: column;
              max-width: 40%;
            }
            .loc-lbl {
              font-size: 6px;
              font-weight: 800;
              color: #555;
            }
            .loc-val {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              line-height: 1.1;
            }
            .large-barcode {
              max-width: 58%;
              text-align: right;
            }
            .large-barcode img {
              max-width: 100%;
              height: auto;
              max-height: 12mm;
              display: block;
              margin-left: auto;
            }

            /* Layout 63,5 x 31 mm */
            .label-standard {
              padding: 2.8mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 0.1mm solid transparent;
            }
            .std-title {
              font-size: 10.5px;
              font-weight: 900;
              text-transform: uppercase;
              text-align: center;
              line-height: 1.15;
              max-height: 24px;
              overflow: hidden;
            }
            .std-sku {
              text-align: center;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            .std-prices {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 2.5mm;
              margin: 0.4mm 0;
              padding: 0.3mm 0;
              border-top: 0.15mm solid #000;
              border-bottom: 0.15mm solid #000;
            }
            .std-price-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              line-height: 1;
            }
            .std-price-lbl {
              font-size: 5.5px;
              font-weight: 800;
              color: #333;
            }
            .std-price-val {
              font-size: 9.5px;
              font-weight: 900;
              color: #000;
            }
            .std-price-val.credit {
              font-size: 8.5px;
            }
            .std-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 2mm;
            }
            .std-loc {
              font-size: 6px;
              font-weight: bold;
              text-transform: uppercase;
              max-width: 45%;
              line-height: 1.2;
            }
            .std-barcode {
              max-width: 50%;
              text-align: right;
            }
            .std-barcode img {
              max-width: 100%;
              height: auto;
              max-height: 8mm;
              display: block;
              margin-left: auto;
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); }, 400)">
          ${cellsHtml}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Armazenar posições que foram enviadas para impressão e abrir diálogo de confirmação
    setLastPrintedPositions(selectedPositionsToPrint);
    setIsConfirmModalOpen(true);
  };

  // Resposta do Diálogo Pós-Impressão
  const handleConfirmUsed = () => {
    const updatedUsed = Array.from(new Set([...currentSheetTracker.usedPositions, ...lastPrintedPositions])).sort((a, b) => a - b);
    const isFull = updatedUsed.length >= currentModel.totalPerSheet;

    if (isFull) {
      // Passar para a próxima folha automaticamente
      const nextTracker: SheetTrackerState = {
        modelId: currentModel.id,
        sheetNumber: currentSheetTracker.sheetNumber + 1,
        usedPositions: [],
        updatedAt: new Date().toISOString()
      };
      saveSheetTracker(nextTracker);
      showFeedback(`Folha concluída! Folha #${String(nextTracker.sheetNumber).padStart(3, '0')} iniciada.`, 'success');
    } else {
      const nextTracker: SheetTrackerState = {
        ...currentSheetTracker,
        usedPositions: updatedUsed,
        updatedAt: new Date().toISOString()
      };
      saveSheetTracker(nextTracker);
      showFeedback(`${lastPrintedPositions.length} etiqueta(s) registradas como utilizadas na Folha #${String(nextTracker.sheetNumber).padStart(3, '0')}.`, 'success');
    }

    setIsConfirmModalOpen(false);
    setManualSelectedPositions(null);
  };

  const handleReprint = () => {
    setIsConfirmModalOpen(false);
    handlePrintRealLabels();
  };

  const handleCancelPrint = () => {
    setIsConfirmModalOpen(false);
    showFeedback('Impressão cancelada. As etiquetas não foram debitadas da folha.', 'error');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[99990] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ==================================================== */}
        {/* CABEÇALHO DO ASSISTENTE */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none">
              <Printer size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Assistente de Etiquetas
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-extrabold uppercase">
                  Epson L3250
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kombat Moto Peças — Modelos Físicos de Alta Precisão & Reutilização de Folha
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================================== */}
        {/* SELEÇÃO RÁPIDA DE MODELOS FAVORITOS KOMBAT */}
        {/* ==================================================== */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 mr-1">
              ⭐ Mais Usadas:
            </span>

            {/* Favorito 1: 99,1 x 38,1 mm */}
            <button
              type="button"
              onClick={() => handleSelectModel('kombat-99x38')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedModelId === 'kombat-99x38'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>⭐ 99,1 × 38,1 mm</span>
              <span className="text-[10px] opacity-80">(14 un)</span>
            </button>

            {/* Favorito 2: 63,5 x 31 mm */}
            <button
              type="button"
              onClick={() => handleSelectModel('kombat-63x31')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedModelId === 'kombat-63x31'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>⭐ 63,5 × 31 mm</span>
              <span className="text-[10px] opacity-80">(21 un)</span>
            </button>

            {/* Dropdown Outros tamanhos */}
            <div className="relative inline-block">
              <select
                value={models.some(m => !m.isFavorite && m.id === selectedModelId) ? selectedModelId : ''}
                onChange={(e) => {
                  if (e.target.value) handleSelectModel(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer outline-none"
              >
                <option value="">Outros tamanhos ▼</option>
                {models.filter(m => !m.isFavorite).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.totalPerSheet} un)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('custom_sheet')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Compass size={14} />
            <span>📐 Configurar Minha Folha</span>
          </button>
        </div>

        {/* ==================================================== */}
        {/* NAVEGAÇÃO ENTRE ABAS DO ASSISTENTE */}
        {/* ==================================================== */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'print'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Printer size={15} />
            <span>Impressão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet_map')}
            className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sheet_map'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={15} />
            <span>Mapa da Folha (#{String(currentSheetTracker.sheetNumber).padStart(3, '0')})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calibration')}
            className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calibration'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders size={15} />
            <span>Calibração & Teste Epson L3250</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom_sheet')}
            className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom_sheet'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass size={15} />
            <span>Medidor de Folha Real</span>
          </button>
        </div>

        {/* FEEDBACK MENSAGEM / TOAST */}
        {feedbackMessage && (
          <div className={`p-3 text-xs font-bold text-center flex items-center justify-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 border-b border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}>
            {feedbackMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* ALERTA DE GEOMETRIA INVÁLIDA SE HOUVER */}
        {!geometryValidation.valid && (
          <div className="p-3 bg-rose-500 text-white text-xs font-bold flex items-center justify-between gap-3 px-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>
                <strong>⚠️ CONFIGURAÇÃO INVÁLIDA:</strong> {geometryValidation.errors.join(' ')}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('calibration')}
              className="px-2.5 py-1 bg-white text-rose-700 rounded-lg text-[10px] font-black uppercase cursor-pointer"
            >
              Corrigir na Calibração
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* CONTEÚDO DAS ABAS */}
        {/* ==================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">

          {/* -------------------------------------------------- */}
          {/* ABA 1: IMPRESSÃO */}
          {/* -------------------------------------------------- */}
          {activeTab === 'print' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Coluna Esquerda: Produto & Configurações de Impressão */}
              <div className="lg:col-span-6 space-y-5">
                
                {/* Produto Selecionado */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Peça Selecionada
                    </label>
                    {products.length > 1 && (
                      <span className="text-[10px] text-slate-400">
                        {products.length} produtos disponíveis
                      </span>
                    )}
                  </div>

                  {/* Seletor/Busca de Produto caso queira trocar */}
                  {products.length > 0 && (
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const found = products.find(p => String(p.id) === e.target.value);
                        if (found) setSelectedProduct(found);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.description} ({p.sku || p.barcode || 'S/ SKU'})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedProduct ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white uppercase leading-snug">
                        {selectedProduct.description}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>SKU: <strong>{selectedProduct.sku || 'S/ SKU'}</strong></span>
                        <span>Cód. Barras: <strong>{selectedProduct.barcode || 'S/ Código'}</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>Marca: <strong>{selectedProduct.brand || 'Kombat'}</strong></span>
                        <span>Loc: <strong>{selectedProduct.location || 'Estoque Padrão'}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900 rounded-xl">
                      Nenhum produto selecionado. Digite ou selecione uma peça acima.
                    </div>
                  )}
                </div>

                {/* Quantidade e Resumo da Folha */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Quantidade de Etiquetas
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {currentModel.totalPerSheet} posições por folha A4 ({currentModel.columns} colunas × {currentModel.rows} linhas)
                      </p>
                    </div>

                    {/* Status da Folha Atual */}
                    <div className="text-right">
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                        Folha #{String(currentSheetTracker.sheetNumber).padStart(3, '0')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {currentSheetTracker.usedPositions.length} usadas • {currentModel.totalPerSheet - currentSheetTracker.usedPositions.length} livres
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center text-base cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={currentModel.totalPerSheet}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-black text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center text-base cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Resumo de Posições que serão preenchidas */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                    <p className="font-extrabold flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={15} />
                      Posições selecionadas para esta impressão:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedPositionsToPrint.length > 0 ? (
                        selectedPositionsToPrint.map(pos => (
                          <span
                            key={pos}
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[10px]"
                          >
                            #{String(pos).padStart(2, '0')}
                          </span>
                        ))
                      ) : (
                        <span className="text-rose-600 font-bold">Folha cheia! Inicie uma nova folha no Mapa da Folha.</span>
                      )}
                    </div>
                  </div>

                  {/* Botões de Impressão */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrintRealLabels}
                      disabled={selectedPositionsToPrint.length === 0 || !geometryValidation.valid}
                      className="flex-1 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Printer size={18} />
                      <span>Imprimir {selectedPositionsToPrint.length} Etiqueta(s)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintTestSheet}
                      title="Imprimir folha A4 com contornos finos para teste na Epson L3250"
                      className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                    >
                      <span>🧪 Folha de Teste</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Coluna Direita: Prévia Real da Etiqueta Física */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Prévia Visual ({currentModel.labelWidthMm} × {currentModel.labelHeightMm} mm)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Proporção física real
                  </span>
                </div>

                {/* Prévia Individual da Etiqueta */}
                <div className="p-6 bg-slate-200 dark:bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-300 dark:border-slate-800 overflow-x-auto min-h-[220px]">
                  {selectedProduct && currentModel.labelWidthMm >= 90 ? (
                    // Prévia 99,1 x 38,1 mm
                    <div
                      className="bg-white text-black shadow-xl rounded-md p-3.5 flex flex-col justify-between"
                      style={{
                        width: '99.1mm',
                        height: '38.1mm',
                        boxSizing: 'border-box',
                        border: '1px dashed #94a3b8'
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-[13px] font-black uppercase text-left leading-tight text-black line-clamp-2 flex-1">
                          {selectedProduct.description}
                        </div>
                        <div className="text-[10px] font-black px-1.5 py-0.5 border border-black rounded whitespace-nowrap text-black">
                          {selectedProduct.sku || selectedProduct.barcode || 'S/ SKU'}
                        </div>
                      </div>

                      <div className="flex justify-between text-[7.5px] text-slate-700 leading-tight">
                        <span>MARCA: <strong>{selectedProduct.brand || 'Kombat'}</strong></span>
                        <span className="truncate max-w-[55%]">APL: {selectedProduct.application || 'Geral'}</span>
                      </div>

                      {/* Exibição de Preço na Prévia (se ativo) */}
                      {(showCashPrice || showCreditPrice) && (
                        <div className="flex items-center gap-3 my-0.5 py-0.5 border-y border-black/20">
                          {showCashPrice && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-[6.5px] font-bold text-slate-600">À VISTA:</span>
                              <span className="text-[11px] font-black text-black">
                                R$ {formatPriceDisplay(customCashPrice)}
                              </span>
                            </div>
                          )}
                          {showCreditPrice && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-[6.5px] font-bold text-slate-600">A PRAZO:</span>
                              <span className="text-[10px] font-black text-slate-800">
                                R$ {formatPriceDisplay(customCreditPrice)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-end gap-2 pt-1">
                        <div className="flex flex-col">
                          <span className="text-[5.5px] font-extrabold text-slate-500">LOCALIZAÇÃO</span>
                          <span className="text-[7.5px] font-black uppercase text-black">{selectedProduct.location || 'ESTOQUE'}</span>
                        </div>
                        <div className="text-right max-w-[60%]">
                          <img
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(selectedProduct.barcode || selectedProduct.sku || 'KOMBAT')}&scale=2&height=5&includetext`}
                            alt="Barcode"
                            className="max-h-[11mm] max-w-full ml-auto"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selectedProduct ? (
                    // Prévia 63,5 x 31 mm
                    <div
                      className="bg-white text-black shadow-xl rounded-md p-2.5 flex flex-col justify-between"
                      style={{
                        width: '63.5mm',
                        height: '31mm',
                        boxSizing: 'border-box',
                        border: '1px dashed #94a3b8'
                      }}
                    >
                      <div className="text-[10.5px] font-black uppercase text-center leading-tight text-black line-clamp-2">
                        {selectedProduct.description}
                      </div>
                      <div className="text-center text-[10.5px] font-black text-black">
                        {selectedProduct.sku || selectedProduct.barcode || 'S/ SKU'}
                      </div>

                      {/* Exibição de Preço na Prévia (se ativo) */}
                      {(showCashPrice || showCreditPrice) && (
                        <div className="flex items-center justify-center gap-2.5 my-0.5 py-0.5 border-y border-black/15">
                          {showCashPrice && (
                            <div className="text-center leading-none">
                              <span className="text-[5.5px] font-extrabold text-slate-500 block">À VISTA</span>
                              <span className="text-[9.5px] font-black text-black">
                                R$ {formatPriceDisplay(customCashPrice)}
                              </span>
                            </div>
                          )}
                          {showCreditPrice && (
                            <div className="text-center leading-none">
                              <span className="text-[5.5px] font-extrabold text-slate-500 block">A PRAZO</span>
                              <span className="text-[9px] font-black text-slate-800">
                                R$ {formatPriceDisplay(customCreditPrice)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-end gap-1 pt-1">
                        <div className="text-[5.5px] font-bold text-black leading-tight">
                          LOC:<br />{selectedProduct.location || 'ESTOQUE'}
                        </div>
                        <div className="text-right max-w-[55%]">
                          <img
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(selectedProduct.barcode || selectedProduct.sku || 'KOMBAT')}&scale=2&height=4&includetext`}
                            alt="Barcode"
                            className="max-h-[7.5mm] max-w-full ml-auto"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Mini Mapa de Folha Informativo */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>Folha #{String(currentSheetTracker.sheetNumber).padStart(3, '0')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        {currentModel.totalPerSheet - currentSheetTracker.usedPositions.length} disponíveis
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      As etiquetas vermelhas (já usadas) permanecem em branco na impressão.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('sheet_map')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Ver Mapa</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Painel de Controle de Preço na Etiqueta (À Vista e A Prazo) */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wide">
                          Preço na Etiqueta
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Escolha se e quais preços saem impressos na etiqueta
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      !showCashPrice && !showCreditPrice
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {!showCashPrice && !showCreditPrice
                        ? 'Sem Preço'
                        : (showCashPrice && showCreditPrice
                          ? 'À Vista & A Prazo'
                          : (showCashPrice ? 'Só À Vista' : 'Só A Prazo'))}
                    </span>
                  </div>

                  {/* Botões de Seleção Interativos: À Vista e A Prazo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Botão Preço À Vista */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showCashPrice;
                        setShowCashPrice(next);
                        localStorage.setItem('kombat_label_show_cash_price', String(next));
                      }}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                        showCashPrice
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                          showCashPrice
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                        }`}>
                          ✓
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black">Preço À Vista</div>
                          <div className="text-[10px] opacity-75">Dinheiro / Pix</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black">
                          R$ {formatPriceDisplay(customCashPrice)}
                        </span>
                      </div>
                    </button>

                    {/* Botão Preço A Prazo */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showCreditPrice;
                        setShowCreditPrice(next);
                        localStorage.setItem('kombat_label_show_credit_price', String(next));
                      }}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                        showCreditPrice
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-100 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                          showCreditPrice
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                        }`}>
                          ✓
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black">Preço A Prazo</div>
                          <div className="text-[10px] opacity-75">Cartão / 30D</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black">
                          R$ {formatPriceDisplay(customCreditPrice)}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Atalhos Rápidos e Ajuste de Valor */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Atalhos:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCashPrice(false);
                          setShowCreditPrice(false);
                          localStorage.setItem('kombat_label_show_cash_price', 'false');
                          localStorage.setItem('kombat_label_show_credit_price', 'false');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          !showCashPrice && !showCreditPrice
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Sem Preço
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCashPrice(true);
                          setShowCreditPrice(false);
                          localStorage.setItem('kombat_label_show_cash_price', 'true');
                          localStorage.setItem('kombat_label_show_credit_price', 'false');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          showCashPrice && !showCreditPrice
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        Só À Vista
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCashPrice(false);
                          setShowCreditPrice(true);
                          localStorage.setItem('kombat_label_show_credit_price', 'true');
                          localStorage.setItem('kombat_label_show_cash_price', 'false');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          !showCashPrice && showCreditPrice
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        Só A Prazo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCashPrice(true);
                          setShowCreditPrice(true);
                          localStorage.setItem('kombat_label_show_cash_price', 'true');
                          localStorage.setItem('kombat_label_show_credit_price', 'true');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          showCashPrice && showCreditPrice
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300'
                        }`}
                      >
                        Ambos
                      </button>
                    </div>

                    {/* Campos de ajuste fino do valor impresso */}
                    {(showCashPrice || showCreditPrice) && (
                      <div className="flex items-center gap-2">
                        {showCashPrice && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">À Vista: R$</span>
                            <input
                              type="text"
                              value={customCashPrice}
                              onChange={(e) => setCustomCashPrice(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        {showCreditPrice && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">A Prazo: R$</span>
                            <input
                              type="text"
                              value={customCreditPrice}
                              onChange={(e) => setCustomCreditPrice(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* ABA 2: MAPA DA FOLHA INTERATIVO */}
          {/* -------------------------------------------------- */}
          {activeTab === 'sheet_map' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                    Controle de Folha — {currentModel.name}
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-md text-xs font-mono font-bold">
                      Folha #{String(currentSheetTracker.sheetNumber).padStart(3, '0')}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Clique em qualquer posição para marcar/desmarcar individualmente antes de enviar à impressora.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStartNewSheet}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus size={15} />
                    <span>Iniciar Nova Folha (#{String(currentSheetTracker.sheetNumber + 1).padStart(3, '0')})</span>
                  </button>
                </div>
              </div>

              {/* Legendas de Cor */}
              <div className="flex flex-wrap items-center gap-5 px-3 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-rose-500 border border-rose-600"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    🔴 Posição Já Utilizada ({currentSheetTracker.usedPositions.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    🟢 Selecionada para Esta Impressão ({selectedPositionsToPrint.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    ⚪ Disponível na Folha ({currentModel.totalPerSheet - currentSheetTracker.usedPositions.length - selectedPositionsToPrint.length})
                  </span>
                </div>
              </div>

              {/* Representação Gráfica da Folha A4 */}
              <div className="p-6 bg-slate-200 dark:bg-slate-950 rounded-3xl flex justify-center items-center border border-slate-300 dark:border-slate-800">
                <div
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 border border-slate-300 dark:border-slate-700 transition-all"
                  style={{
                    width: '100%',
                    maxWidth: currentModel.columns === 2 ? '440px' : '520px',
                    aspectRatio: '210 / 297'
                  }}
                >
                  <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">TOPO (Margem Sup: {currentCalibration.marginTopMm}mm)</span>
                    <span className="text-[10px] font-bold text-slate-500">Folha #{String(currentSheetTracker.sheetNumber).padStart(3, '0')}</span>
                  </div>

                  {/* Grid de Posições */}
                  <div
                    className="grid gap-2 h-[82%]"
                    style={{
                      gridTemplateColumns: `repeat(${currentModel.columns}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${currentModel.rows}, minmax(0, 1fr))`
                    }}
                  >
                    {Array.from({ length: currentModel.totalPerSheet }, (_, i) => i + 1).map(pos => {
                      const isUsed = currentSheetTracker.usedPositions.includes(pos);
                      const isSelected = selectedPositionsToPrint.includes(pos);

                      let bgClass = 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-slate-400';
                      let labelStatus = 'LIVRE';

                      if (isUsed) {
                        bgClass = 'bg-rose-500 text-white border-rose-600 shadow-sm';
                        labelStatus = 'USADA';
                      } else if (isSelected) {
                        bgClass = 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300 dark:ring-emerald-800';
                        labelStatus = 'IMPRIMIR';
                      }

                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => handleTogglePosition(pos)}
                          className={`rounded-xl border p-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none ${bgClass}`}
                        >
                          <span className="text-sm sm:text-base font-black font-mono">
                            {String(pos).padStart(2, '0')}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-90">
                            {labelStatus}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                    <span className="text-[10px] font-black uppercase text-slate-400">BASE DA FOLHA A4</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* ABA 3: CALIBRAÇÃO & TESTE EPSON L3250 */}
          {/* -------------------------------------------------- */}
          {activeTab === 'calibration' && (
            <div className="space-y-6">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={18} className="text-rose-600" />
                  Calibração Individual — {currentModel.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ajustes milimétricos salvos exclusivamente para este modelo na <strong>Epson EcoTank L3250</strong>. Alterar este modelo não altera os outros.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Deslocamento X e Y (Offset) */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-1">
                      Deslocamento Físico X e Y (Offset)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Use após a folha de teste para ajustar a impressão milimetricamente.
                    </p>
                  </div>

                  {/* Eixo Horizontal (X) */}
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">Deslocamento Horizontal (X):</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">
                        {currentCalibration.offsetX >= 0 ? `+${currentCalibration.offsetX.toFixed(2)}` : currentCalibration.offsetX.toFixed(2)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">← Esquerda:</span>
                      <button type="button" onClick={() => handleAdjustOffset('X', -1.0)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">-1.0mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('X', -0.5)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">-0.5mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('X', -0.1)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">-0.1mm</button>
                      
                      <span className="text-[10px] font-bold text-slate-400 ml-2 mr-1">Direita →:</span>
                      <button type="button" onClick={() => handleAdjustOffset('X', 0.1)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">+0.1mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('X', 0.5)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">+0.5mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('X', 1.0)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">+1.0mm</button>
                    </div>
                  </div>

                  {/* Eixo Vertical (Y) */}
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">Deslocamento Vertical (Y):</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">
                        {currentCalibration.offsetY >= 0 ? `+${currentCalibration.offsetY.toFixed(2)}` : currentCalibration.offsetY.toFixed(2)} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">↑ Cima:</span>
                      <button type="button" onClick={() => handleAdjustOffset('Y', -1.0)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">-1.0mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('Y', -0.5)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">-0.5mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('Y', -0.1)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">-0.1mm</button>

                      <span className="text-[10px] font-bold text-slate-400 ml-2 mr-1">Baixo ↓:</span>
                      <button type="button" onClick={() => handleAdjustOffset('Y', 0.1)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">+0.1mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('Y', 0.5)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">+0.5mm</button>
                      <button type="button" onClick={() => handleAdjustOffset('Y', 1.0)} className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-[10px] font-bold hover:bg-slate-100 cursor-pointer">+1.0mm</button>
                    </div>
                  </div>

                  {/* Resetar offsets */}
                  <button
                    type="button"
                    onClick={() => saveCalibration({ ...currentCalibration, offsetX: 0, offsetY: 0 })}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Zerar Deslocamento X e Y</span>
                  </button>
                </div>

                {/* Margens Físicas da Folha (Calibração) */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-1">
                      Margens e Espaçamentos (mm)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Valores de margem e separação física da folha.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Margem Esquerda</label>
                      <input
                        type="number"
                        step="0.05"
                        value={currentCalibration.marginLeftMm}
                        onChange={(e) => saveCalibration({ ...currentCalibration, marginLeftMm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Margem Direita</label>
                      <input
                        type="number"
                        step="0.05"
                        value={currentCalibration.marginRightMm}
                        onChange={(e) => saveCalibration({ ...currentCalibration, marginRightMm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Margem Superior</label>
                      <input
                        type="number"
                        step="0.05"
                        value={currentCalibration.marginTopMm}
                        onChange={(e) => saveCalibration({ ...currentCalibration, marginTopMm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Margem Inferior</label>
                      <input
                        type="number"
                        step="0.05"
                        value={currentCalibration.marginBottomMm}
                        onChange={(e) => saveCalibration({ ...currentCalibration, marginBottomMm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  {/* Botão Folha de Teste em Destaque */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePrintTestSheet}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none transition-all"
                    >
                      <span>🧪 Imprimir Folha de Teste na Epson L3250</span>
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Coloque uma folha A4 comum na impressora e sobreponha contra a luz sobre a cartela de etiquetas.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* ABA 4: CONFIGURAR MINHA FOLHA (ASSISTENTE DE MEDIÇÃO) */}
          {/* -------------------------------------------------- */}
          {activeTab === 'custom_sheet' && (
            <div className="space-y-6">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass size={18} className="text-rose-600" />
                  Assistente para Medir a Folha Real
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pegue uma régua e sua folha física de etiquetas. Digite as medidas abaixo para que o sistema valide a geometria e crie o modelo exato.
                </p>
              </div>

              <form onSubmit={handleSaveCustomSheet} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  
                  <div className="lg:col-span-4">
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">Nome do Modelo</label>
                    <input
                      type="text"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      placeholder="Ex: Minha Etiqueta Pimaco A4"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">1. Largura da Etiqueta (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={customForm.labelWidthMm}
                      onChange={(e) => setCustomForm({ ...customForm, labelWidthMm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">2. Altura da Etiqueta (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={customForm.labelHeightMm}
                      onChange={(e) => setCustomForm({ ...customForm, labelHeightMm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">3. Colunas na Folha</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customForm.columns}
                      onChange={(e) => setCustomForm({ ...customForm, columns: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">4. Linhas na Folha</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={customForm.rows}
                      onChange={(e) => setCustomForm({ ...customForm, rows: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">5. Margem Esquerda (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={customForm.marginLeftMm}
                      onChange={(e) => setCustomForm({ ...customForm, marginLeftMm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">6. Margem Superior (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={customForm.marginTopMm}
                      onChange={(e) => setCustomForm({ ...customForm, marginTopMm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">7. Gap Horizontal (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={customForm.gapHorizontalMm}
                      onChange={(e) => setCustomForm({ ...customForm, gapHorizontalMm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">8. Gap Vertical (mm)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={customForm.gapVerticalMm}
                      onChange={(e) => setCustomForm({ ...customForm, gapVerticalMm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold"
                    />
                  </div>
                </div>

                {/* Cálculos Resultantes & Validador */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Resultados Calculados Automaticamente
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Total de Etiquetas</span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                        {customForm.columns * customForm.rows} por folha
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Largura Ocupada</span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                        {customFormValidation.widthUsedMm} / 210 mm
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Altura Ocupada</span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                        {customFormValidation.heightUsedMm} / 297 mm
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Status Geométrico</span>
                      <span className={`text-xs font-black uppercase ${customFormValidation.valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {customFormValidation.valid ? '✅ Geometria Válida' : '⚠️ Inválida'}
                      </span>
                    </div>
                  </div>

                  {!customFormValidation.valid && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 rounded-xl text-xs font-bold">
                      {customFormValidation.errors.map((err, idx) => (
                        <p key={idx}>{err}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!customFormValidation.valid}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save size={16} />
                      <span>Salvar Modelo e Usar</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* RODAPÉ INFORMATIVO */}
        {/* ==================================================== */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Modelo Ativo: <strong className="text-slate-800 dark:text-slate-200">{currentModel.name}</strong></span>
            <span>Folha: <strong className="text-rose-600 dark:text-rose-400">#{String(currentSheetTracker.sheetNumber).padStart(3, '0')}</strong></span>
            <span>Impressora: <strong className="text-slate-800 dark:text-slate-200">Epson EcoTank L3250</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>

      {/* ==================================================== */}
      {/* DIÁLOGO MODAL PÓS-IMPRESSÃO */}
      {/* ==================================================== */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl">
                <Printer size={26} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  A impressão saiu corretamente?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirme para registrar as etiquetas na Folha #{String(currentSheetTracker.sheetNumber).padStart(3, '0')}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
              Foram enviadas para impressão as posições: <strong>{lastPrintedPositions.map(p => `#${String(p).padStart(2, '0')}`).join(', ')}</strong>.
              <br />
              Ao confirmar, essas posições serão marcadas como 🔴 <strong>UTILIZADAS</strong>, e as próximas impressões pularão automaticamente esses espaços.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmUsed}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check size={16} />
                <span>SIM — MARCAR COMO UTILIZADAS</span>
              </button>

              <button
                type="button"
                onClick={handleReprint}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw size={16} />
                <span>REIMPRIMIR</span>
              </button>

              <button
                type="button"
                onClick={handleCancelPrint}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer"
              >
                CANCELAR (Não registrar)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
