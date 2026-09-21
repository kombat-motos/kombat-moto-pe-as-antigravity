// ==========================================================
// KOMBAT MOTO PEÇAS — ASSISTENTE DE ETIQUETAS
// Definições de Tipos, Validador de Geometria e Cálculos Físicos
// ==========================================================

export interface LabelModel {
  id: string;
  name: string;
  isFavorite?: boolean;
  paper: 'A4';
  paperWidthMm: number;   // 210 mm para A4
  paperHeightMm: number;  // 297 mm para A4
  labelWidthMm: number;   // Ex: 99.1 ou 63.5
  labelHeightMm: number;  // Ex: 38.1 ou 31.0
  columns: number;        // Ex: 2 ou 3
  rows: number;           // Ex: 7
  totalPerSheet: number;  // Ex: 14 ou 21
  marginLeftMm: number;   // Margem física esquerda
  marginRightMm: number;  // Margem física direita
  marginTopMm: number;    // Margem física superior
  marginBottomMm: number; // Margem física inferior
  gapHorizontalMm: number;// Espaço entre colunas
  gapVerticalMm: number;  // Espaço entre linhas
  printerName: string;    // Ex: 'Epson EcoTank L3250'
  isCustom?: boolean;
}

export interface LabelCalibration {
  modelId: string;
  printerName: string;
  offsetX: number;        // Deslocamento X em mm (+/-)
  offsetY: number;        // Deslocamento Y em mm (+/-)
  scalePercent: number;   // Escala padrão 100%
  // Ajustes finos de margens e gaps salvos pelo usuário
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
}

export interface SheetTrackerState {
  modelId: string;
  sheetNumber: number;    // Ex: 1 (#001)
  usedPositions: number[];// Posições 1-indexadas já utilizadas [1, 2, 3...]
  updatedAt: string;
}

export interface GeometryValidationResult {
  valid: boolean;
  widthUsedMm: number;
  heightUsedMm: number;
  widthAvailableMm: number;
  heightAvailableMm: number;
  widthDifferenceMm: number; // >0 significa que ultrapassou
  heightDifferenceMm: number;// >0 significa que ultrapassou
  errors: string[];
}

/**
 * Validador Estrito de Geometria Matemática da Folha
 * Regra:
 * largura_utilizada = margem_esquerda + (colunas * largura_etiqueta) + ((colunas - 1) * gap_horizontal) + margem_direita <= 210mm
 * altura_utilizada = margem_superior + (linhas * altura_etiqueta) + ((linhas - 1) * gap_vertical) + margem_inferior <= 297mm
 */
export function validateGeometry(params: {
  paperWidthMm?: number;
  paperHeightMm?: number;
  labelWidthMm: number;
  labelHeightMm: number;
  columns: number;
  rows: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
}): GeometryValidationResult {
  const paperWidth = params.paperWidthMm || 210.0;
  const paperHeight = params.paperHeightMm || 297.0;

  const cols = Math.max(1, params.columns);
  const rows = Math.max(1, params.rows);

  const widthUsed = Number((
    params.marginLeftMm +
    (cols * params.labelWidthMm) +
    ((cols - 1) * params.gapHorizontalMm) +
    params.marginRightMm
  ).toFixed(2));

  const heightUsed = Number((
    params.marginTopMm +
    (rows * params.labelHeightMm) +
    ((rows - 1) * params.gapVerticalMm) +
    params.marginBottomMm
  ).toFixed(2));

  const errors: string[] = [];

  const widthDiff = Number((widthUsed - paperWidth).toFixed(2));
  if (widthDiff > 0.05) {
    errors.push(`Largura total utilizada (${widthUsed} mm) ultrapassa os ${paperWidth} mm do papel A4 por ${widthDiff} mm.`);
  }

  const heightDiff = Number((heightUsed - paperHeight).toFixed(2));
  if (heightDiff > 0.05) {
    errors.push(`Altura total utilizada (${heightUsed} mm) ultrapassa os ${paperHeight} mm do papel A4 por ${heightDiff} mm.`);
  }

  return {
    valid: errors.length === 0,
    widthUsedMm: widthUsed,
    heightUsedMm: heightUsed,
    widthAvailableMm: paperWidth,
    heightAvailableMm: paperHeight,
    widthDifferenceMm: widthDiff,
    heightDifferenceMm: heightDiff,
    errors
  };
}

/**
 * Cálculo de Posicionamento Físico de cada Etiqueta
 * Coluna c (0 a cols-1) e Linha r (0 a rows-1)
 * X = margem_esquerda + (coluna * (largura + gap_h)) + offset_x
 * Y = margem_superior + (linha * (altura + gap_v)) + offset_y
 */
export function calculateLabelCoordinates(
  colIndex: number,
  rowIndex: number,
  model: LabelModel,
  calibration?: Partial<LabelCalibration>
): { xMm: number; yMm: number; widthMm: number; heightMm: number } {
  const marginLeft = calibration?.marginLeftMm ?? model.marginLeftMm;
  const marginTop = calibration?.marginTopMm ?? model.marginTopMm;
  const gapH = calibration?.gapHorizontalMm ?? model.gapHorizontalMm;
  const gapV = calibration?.gapVerticalMm ?? model.gapVerticalMm;
  const offsetX = calibration?.offsetX ?? 0.0;
  const offsetY = calibration?.offsetY ?? 0.0;

  const x = marginLeft + (colIndex * (model.labelWidthMm + gapH)) + offsetX;
  const y = marginTop + (rowIndex * (model.labelHeightMm + gapV)) + offsetY;

  return {
    xMm: Number(x.toFixed(2)),
    yMm: Number(y.toFixed(2)),
    widthMm: Number(model.labelWidthMm.toFixed(2)),
    heightMm: Number(model.labelHeightMm.toFixed(2))
  };
}

// ==========================================
// MODELOS PADRÃO KOMBAT MOTO PEÇAS
// ==========================================

export const KOMBAT_LABEL_MODELS: LabelModel[] = [
  {
    id: 'kombat-99x38',
    name: '⭐ KOMBAT — 99,1 × 38,1 mm',
    isFavorite: true,
    paper: 'A4',
    paperWidthMm: 210.0,
    paperHeightMm: 297.0,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    columns: 2,
    rows: 7,
    totalPerSheet: 14,
    // 5.9 + (2*99.1) + 5.9 = 210.0mm Exato!
    marginLeftMm: 5.9,
    marginRightMm: 5.9,
    // 15.1 + (7*38.1) + 15.1 = 296.9mm Exato!
    marginTopMm: 15.1,
    marginBottomMm: 15.1,
    gapHorizontalMm: 0.0,
    gapVerticalMm: 0.0,
    printerName: 'Epson EcoTank L3250'
  },
  {
    id: 'kombat-63x31',
    name: '⭐ KOMBAT — 63,5 × 31 mm',
    isFavorite: true,
    paper: 'A4',
    paperWidthMm: 210.0,
    paperHeightMm: 297.0,
    labelWidthMm: 63.5,
    labelHeightMm: 31.0,
    columns: 3,
    rows: 7,
    totalPerSheet: 21,
    // 3 * 63.5 = 190.5 mm -> sobram 19.5 mm (9.75mm de cada lado sem ultrapassar 210mm)
    marginLeftMm: 9.75,
    marginRightMm: 9.75,
    // 7 * 31.0 = 217.0 mm -> sobram 80 mm
    marginTopMm: 15.0,
    marginBottomMm: 65.0,
    gapHorizontalMm: 0.0,
    gapVerticalMm: 0.0,
    printerName: 'Epson EcoTank L3250'
  },
  {
    id: 'pimaco-6180',
    name: 'Pimaco 6080 / 6180 — 66,7 × 25,4 mm',
    isFavorite: false,
    paper: 'A4',
    paperWidthMm: 210.0,
    paperHeightMm: 297.0,
    labelWidthMm: 66.7,
    labelHeightMm: 25.4,
    columns: 3,
    rows: 10,
    totalPerSheet: 30,
    marginLeftMm: 4.95,
    marginRightMm: 4.95,
    marginTopMm: 21.5,
    marginBottomMm: 21.5,
    gapHorizontalMm: 0.0,
    gapVerticalMm: 0.0,
    printerName: 'Epson EcoTank L3250'
  },
  {
    id: 'pimaco-6181',
    name: 'Pimaco 6181 — 101,6 × 25,4 mm',
    isFavorite: false,
    paper: 'A4',
    paperWidthMm: 210.0,
    paperHeightMm: 297.0,
    labelWidthMm: 101.6,
    labelHeightMm: 25.4,
    columns: 2,
    rows: 10,
    totalPerSheet: 20,
    marginLeftMm: 3.4,
    marginRightMm: 3.4,
    marginTopMm: 21.5,
    marginBottomMm: 21.5,
    gapHorizontalMm: 0.0,
    gapVerticalMm: 0.0,
    printerName: 'Epson EcoTank L3250'
  }
];

export function getDefaultCalibration(model: LabelModel): LabelCalibration {
  return {
    modelId: model.id,
    printerName: model.printerName || 'Epson EcoTank L3250',
    offsetX: 0.0,
    offsetY: 0.0,
    scalePercent: 100,
    marginLeftMm: model.marginLeftMm,
    marginRightMm: model.marginRightMm,
    marginTopMm: model.marginTopMm,
    marginBottomMm: model.marginBottomMm,
    gapHorizontalMm: model.gapHorizontalMm,
    gapVerticalMm: model.gapVerticalMm
  };
}

export function getDefaultSheetTracker(modelId: string): SheetTrackerState {
  return {
    modelId,
    sheetNumber: 1,
    usedPositions: [],
    updatedAt: new Date().toISOString()
  };
}
