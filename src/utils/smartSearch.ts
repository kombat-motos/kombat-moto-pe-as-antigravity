/**
 * Smart Search Engine for Kombat Moto Peças
 * Ultra-fast tokenized, abbreviation-aware, fuzzy and relevance-ranked search
 */

export interface ProductItem {
  id: number;
  description: string;
  sku?: string;
  barcode?: string;
  purchase_price?: number;
  sale_price: number;
  sale_price_credit?: number;
  sale_price_wholesale?: number;
  stock: number;
  unit?: string;
  category?: string;
  brand?: string;
  location?: string;
  image_url?: string;
  image_url2?: string;
  application?: string;
  distributor?: string;
  alt_code?: string;
  [key: string]: any;
}

export interface CustomerItem {
  id: number;
  name: string;
  nickname?: string;
  cpf?: string;
  cnpj?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  credit_status?: string;
  credit_limit?: number;
  credit_block_reason?: string;
  [key: string]: any;
}

export interface MotorcycleItem {
  id: number;
  customer_id: number;
  plate: string;
  model: string;
  current_km?: number;
  brand?: string;
  [key: string]: any;
}

export interface ServiceItem {
  id: string | number;
  description?: string;
  name?: string;
  price: number;
  category?: string;
  type?: string;
  [key: string]: any;
}

export interface ProductSearchResult {
  item: ProductItem;
  type: 'product' | 'service';
  score: number;
  matchedTokens: string[];
}

export interface CustomerSearchResult {
  customer: CustomerItem;
  motorcycles: MotorcycleItem[];
  matchedMoto?: MotorcycleItem;
  matchedField: 'name' | 'phone' | 'cpf' | 'cnpj' | 'plate' | 'moto_model' | 'nickname';
  score: number;
}

// Dicionário de Sinônimos e Abreviações Automotivas de Motos
export const MOTO_ABBREVIATIONS: Record<string, string[]> = {
  // Peças e Acessórios
  acel: ['acelerador', 'aceleracao'],
  aceler: ['acelerador'],
  rel: ['relacao', 'kit relacao', 'transmissao'],
  relac: ['relacao', 'kit relacao'],
  rele: ['rele'],
  lona: ['lona', 'lona de freio', 'sapata'],
  beng: ['bengala', 'tubo interno', 'cilindro bengala'],
  bengala: ['bengala'],
  ret: ['retentor', 'vedador'],
  past: ['pastilha', 'pastilha de freio'],
  com: ['comando', 'corrente de comando', 'valvula'],
  cmd: ['comando'],
  carb: ['carburador'],
  inj: ['injecao', 'bico injetor'],
  amort: ['amortecedor'],
  rol: ['rolamento'],
  rolam: ['rolamento'],
  bateria: ['bateria', 'bat'],
  bat: ['bateria'],
  vel: ['vela', 'vela de ignicao'],
  vela: ['vela'],
  emb: ['embreagem', 'disco embreagem', 'plato'],
  embr: ['embreagem'],
  embreag: ['embreagem'],
  pneu: ['pneu'],
  cam: ['camara', 'camara de ar'],
  camara: ['camara', 'camara de ar'],
  oleo: ['oleo', 'lubrificante', 'motor'],
  lub: ['lubrificante', 'oleo'],
  lamp: ['lampada', 'farol'],
  lampada: ['lampada'],
  estat: ['estator', 'bobina'],
  estator: ['estator'],
  reg: ['regulador', 'retificador', 'regulador retificador'],
  retif: ['retificador', 'regulador'],
  desc: ['descarga', 'escapamento'],
  escap: ['escapamento', 'descarga'],
  transm: ['transmissao', 'relacao'],
  disco: ['disco', 'disco de freio', 'disco de embreagem'],
  retrov: ['retrovisor', 'espelho'],
  espelho: ['espelho', 'retrovisor'],
  manic: ['manicoto'],
  manete: ['manete'],
  manopla: ['manopla', 'punho'],
  punho: ['punho', 'manopla'],
  guidao: ['guidao'],
  raio: ['raio', 'raios'],
  aro: ['aro'],
  cubo: ['cubo'],
  flange: ['flange'],
  bucha: ['bucha', 'coxim'],
  coxim: ['coxim', 'bucha'],
  trava: ['trava'],
  anel: ['anel', 'aneis', 'segmento'],
  pistao: ['pistao'],
  cil: ['cilindro', 'kit cilindro'],
  cilindro: ['cilindro'],
  biela: ['biela', 'kit biela'],
  junta: ['junta', 'kit junta'],
  filt: ['filtro'],
  filtro: ['filtro'],
  part: ['partida', 'motor partida', 'arranque'],
  arranque: ['arranque', 'partida'],
  ignicao: ['ignicao', 'chave ignicao'],
  comb: ['combustivel', 'gasolina'],
  tanque: ['tanque'],
  pedal: ['pedal', 'pedal de cambio', 'pedal de partida'],
  cav: ['cavalete', 'pe descanso'],
  cavalete: ['cavalete'],
  cabo: ['cabo'],
  freio: ['freio'],
  diant: ['dianteiro', 'dianteira'],
  tras: ['traseiro', 'traseira'],
  esq: ['esquerdo', 'esquerda'],
  dir: ['direito', 'direita'],
  inf: ['inferior'],
  sup: ['superior'],
  pisca: ['pisca', 'lanterna pisca', 'sinaleira'],
  sinal: ['sinaleira', 'pisca'],

  // Medidas comuns de pistão / lona / anéis
  '025': ['0.25', '0,25', '025', '25'],
  '050': ['0.50', '0,50', '050', '50'],
  '075': ['0.75', '0,75', '075', '75'],
  '100': ['1.00', '1,00', '100', '1mm'],
  std: ['std', 'padrao', 'standard'],

  // Modelos de Motos & Cilindradas
  titan: ['titan', 'cg titan', 'cg'],
  tit: ['titan', 'cg'],
  tt: ['titan'],
  fan: ['fan', 'cg fan', 'cg'],
  bros: ['bros', 'nxr', 'nxr bros'],
  nxr: ['nxr', 'bros'],
  biz: ['biz', 'honda biz'],
  pop: ['pop', 'pop 100', 'pop 110'],
  fazer: ['fazer', 'fz', 'fzr', 'yamaha fazer'],
  faz: ['fazer', 'fz', 'fzr'],
  fz: ['fazer'],
  twister: ['twister', 'cbx', 'cb twister'],
  tw: ['twister'],
  cb: ['cb'],
  cb300: ['cb 300', 'cb300', 'cb300r'],
  cb300r: ['cb 300', 'cb300'],
  xre: ['xre'],
  xre300: ['xre 300', 'xre300'],
  xre190: ['xre 190', 'xre190'],
  lander: ['lander', 'xtz 250', 'xtz'],
  xtz: ['xtz', 'lander', 'crosser'],
  crosser: ['crosser', 'xtz 150'],
  factor: ['factor', 'ybr factor', 'ybr'],
  ybr: ['ybr', 'factor'],
  pcx: ['pcx', 'honda pcx'],
  elite: ['elite', 'elite 125'],
  lead: ['lead', 'lead 110'],
  burgman: ['burgman', 'suzuki burgman'],
  yes: ['yes', 'en 125'],
  intruder: ['intruder', 'gn 125'],
  fazer250: ['fazer 250', 'fz25', 'fz 25'],
  titan150: ['titan 150', 'cg 150'],
  titan160: ['titan 160', 'cg 160'],
  titan125: ['titan 125', 'cg 125'],
  bros150: ['bros 150', 'nxr 150'],
  bros160: ['bros 160', 'nxr 160'],
  fan125: ['fan 125'],
  fan150: ['fan 150'],
  fan160: ['fan 160'],
  biz125: ['biz 125'],
  biz100: ['biz 100'],
  biz110: ['biz 110'],
};

/**
 * Remove acentos, pontuações indesejadas e converte para minúsculas
 */
export function normalizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^\w\s.,/-]/g, ' ') // mantém letras, números e pontuações comuns
    .replace(/[\s\t\n]+/g, ' ')
    .trim();
}

/**
 * Normaliza apenas dígitos para telefones e documentos
 */
export function cleanDigits(str: string | null | undefined): string {
  if (!str) return '';
  return str.toString().replace(/\D/g, '');
}

/**
 * Normaliza placas de veículos (remove hífen, espaços e coloca em maiúsculas)
 */
export function cleanPlate(str: string | null | undefined): string {
  if (!str) return '';
  return str.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Distância de Levenshtein para identificar pequenos erros de digitação (fuzzy match)
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Divide uma busca em tokens inteligentes (ex: "cb300" vira ["cb300", "cb", "300"])
 */
export function extractQueryTokens(query: string): string[] {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  const rawTokens = normalized.split(/\s+/).filter(t => t.length > 0);
  const result: string[] = [];

  for (const token of rawTokens) {
    result.push(token);
    // Se o token combina letras e números (ex: "cb300", "cg160", "titan150")
    const match = token.match(/^([a-z]+)(\d+)$/);
    if (match) {
      if (!result.includes(match[1])) result.push(match[1]);
      if (!result.includes(match[2])) result.push(match[2]);
    }
  }

  return Array.from(new Set(result));
}

/**
 * Verifica se um token de busca confere com um texto alvo, considerando prefixo,
 * abreviações, sinônimos e tolerância a pequenos erros de digitação.
 */
function tokenMatchesField(
  token: string,
  targetWords: string[],
  targetFull: string
): { matched: boolean; score: number; matchType: string } {
  if (!token || !targetFull) return { matched: false, score: 0, matchType: '' };

  // 1. Correspondência exata de palavra inteira
  if (targetWords.includes(token)) {
    return { matched: true, score: 100, matchType: 'exact_word' };
  }

  // 2. Prefixo de palavra (ex: "acel" -> "acelerador", "beng" -> "bengala", "bros" -> "bros")
  const prefixMatch = targetWords.some(w => w.startsWith(token));
  if (prefixMatch) {
    return { matched: true, score: 80, matchType: 'prefix' };
  }

  // 3. Verificação no dicionário de abreviações e sinônimos
  const expansions = MOTO_ABBREVIATIONS[token];
  if (expansions && expansions.length > 0) {
    for (const exp of expansions) {
      const expNorm = normalizeText(exp);
      const expWords = expNorm.split(/\s+/);
      if (expWords.some(ew => targetWords.some(tw => tw.startsWith(ew) || ew.startsWith(tw)))) {
        return { matched: true, score: 90, matchType: 'synonym' };
      }
      if (targetFull.includes(expNorm)) {
        return { matched: true, score: 85, matchType: 'synonym_full' };
      }
    }
  }

  // 4. Substring simples dentro do campo completo (para códigos, medidas tipo "0.25", etc)
  if (token.length >= 2 && targetFull.includes(token)) {
    return { matched: true, score: 60, matchType: 'substring' };
  }

  // 5. Normalização de medidas como "025" -> "0.25" / "0,25"
  if (/^\d{2,4}$/.test(token)) {
    const formattedWithDot = token.length === 3 ? `0.${token.slice(1)}` : `${token.slice(0, 1)}.${token.slice(1)}`;
    const formattedWithComma = formattedWithDot.replace('.', ',');
    if (targetFull.includes(formattedWithDot) || targetFull.includes(formattedWithComma)) {
      return { matched: true, score: 95, matchType: 'measure_match' };
    }
  }

  // 6. Fuzzy match (pequenos erros de digitação: dist <= 1 para palavras de >= 4 letras)
  if (token.length >= 4) {
    for (const word of targetWords) {
      if (Math.abs(word.length - token.length) <= 1) {
        const dist = levenshtein(token, word);
        if (dist === 1) {
          return { matched: true, score: 40, matchType: 'fuzzy_1' };
        }
      }
    }
  }

  return { matched: false, score: 0, matchType: '' };
}

/**
 * Busca inteligente de Peças e Serviços
 */
export function searchSmartProducts(
  products: ProductItem[],
  query: string,
  options?: {
    services?: ServiceItem[];
    limit?: number;
    activePriceTable?: 'vista' | 'credito_30_dias' | 'atacado';
  }
): ProductSearchResult[] {
  const cleanQ = normalizeText(query);
  if (!cleanQ || cleanQ.length < 2) return [];

  const tokens = extractQueryTokens(cleanQ);
  const limit = options?.limit || 30;
  const results: ProductSearchResult[] = [];

  // 1. Avaliar Produtos
  for (const p of products) {
    if (!p) continue;

    const descNorm = normalizeText(p.description || '');
    const brandNorm = normalizeText(p.brand || '');
    const appNorm = normalizeText(p.application || '');
    const catNorm = normalizeText(p.category || '');
    const skuNorm = normalizeText(p.sku || '');
    const barcodeNorm = normalizeText(p.barcode || '');
    const altCodeNorm = normalizeText(p.alt_code || '');
    const locNorm = normalizeText(p.location || '');

    // Verificação de Correspondência Exata em Código / SKU / Barcode / Referência
    const rawQClean = cleanQ.replace(/\s+/g, '');
    if (
      (skuNorm && skuNorm === cleanQ) ||
      (barcodeNorm && barcodeNorm === rawQClean) ||
      (altCodeNorm && altCodeNorm === cleanQ)
    ) {
      results.push({
        item: p,
        type: 'product',
        score: 15000 + (p.stock > 0 ? 50 : 0),
        matchedTokens: tokens,
      });
      continue;
    }

    // Campo consolidado para busca rápida
    const fullSearchable = `${descNorm} ${appNorm} ${brandNorm} ${catNorm} ${skuNorm} ${barcodeNorm} ${altCodeNorm} ${locNorm}`;
    const allWords = fullSearchable.split(/\s+/).filter(Boolean);
    const descWords = descNorm.split(/\s+/).filter(Boolean);
    const appWords = appNorm.split(/\s+/).filter(Boolean);

    let matchedTokensCount = 0;
    let itemScore = 0;
    const matchedTokensList: string[] = [];

    // Cada token digitado pelo operador DEVE ser satisfeito
    for (const token of tokens) {
      // Testa no nome da peça
      const matchDesc = tokenMatchesField(token, descWords, descNorm);
      // Testa na aplicação / modelo de moto (Bros 150, Titan 160, Fazer 250, etc)
      const matchApp = tokenMatchesField(token, appWords, appNorm);
      // Testa no resto (marca, sku, categoria)
      const matchOthers = tokenMatchesField(token, allWords, fullSearchable);

      if (matchDesc.matched || matchApp.matched || matchOthers.matched) {
        matchedTokensCount++;
        matchedTokensList.push(token);

        // Pontuação por relevância
        if (matchDesc.matched) itemScore += matchDesc.score * 2.5; // Descrição tem prioridade máxima
        if (matchApp.matched) itemScore += matchApp.score * 2.0;   // Aplicação de moto tem peso altíssimo
        if (matchOthers.matched && !matchDesc.matched && !matchApp.matched) {
          itemScore += matchOthers.score * 1.2;
        }
      }
    }

    // Exige que todos os tokens sejam correspondidos para evitar itens não relacionados
    // (Se o operador digitou mais de 1 palavra, todas devem ter casamento)
    if (matchedTokensCount === tokens.length && tokens.length > 0) {
      // Bônus de frase exata contínua
      if (descNorm.includes(cleanQ)) {
        itemScore += 3000;
      }

      // Bônus se começa com a primeira palavra digitada
      if (descNorm.startsWith(tokens[0])) {
        itemScore += 500;
      }

      // Bônus de compatibilidade mecânica na aplicação
      if (appNorm && tokens.some(t => appNorm.includes(t))) {
        itemScore += 600;
      }

      // Bônus de disponibilidade em estoque (peça pronta para entrega)
      if (p.stock > 0) {
        itemScore += 100;
      } else {
        itemScore -= 50; // Peça sem estoque fica ligeiramente atrás de equivalentes disponíveis
      }

      results.push({
        item: p,
        type: 'product',
        score: itemScore,
        matchedTokens: matchedTokensList,
      });
    }
  }

  // 2. Avaliar Serviços Cadastrados (se fornecidos)
  if (options?.services && options.services.length > 0) {
    for (const s of options.services) {
      if (!s) continue;
      const desc = s.description || s.name || '';
      const descNorm = normalizeText(desc);
      const catNorm = normalizeText(s.category || '');
      const full = `${descNorm} ${catNorm}`;
      const words = full.split(/\s+/).filter(Boolean);

      let matchedTokensCount = 0;
      let serviceScore = 0;
      const matchedTokensList: string[] = [];

      for (const token of tokens) {
        const match = tokenMatchesField(token, words, full);
        if (match.matched) {
          matchedTokensCount++;
          matchedTokensList.push(token);
          serviceScore += match.score * 2.0;
        }
      }

      if (matchedTokensCount === tokens.length && tokens.length > 0) {
        if (descNorm.includes(cleanQ)) serviceScore += 2500;
        if (descNorm.startsWith(tokens[0])) serviceScore += 400;

        results.push({
          item: {
            id: typeof s.id === 'number' ? s.id : parseInt(String(s.id), 10) || 0,
            description: desc,
            sale_price: s.price || 0,
            stock: 999, // Serviços não possuem controle restrito de estoque
            unit: 'Serviço',
            category: s.category || 'Mão de Obra',
            is_service: true,
          } as ProductItem,
          type: 'service',
          score: serviceScore + 50, // serviços relevantes pontuam bem
          matchedTokens: matchedTokensList,
        });
      }
    }
  }

  // Ordenar por pontuação decrescente
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Busca Inteligente de Clientes por Nome, Telefone, Placa de Moto, CPF/CNPJ ou Modelo
 */
export function searchSmartCustomers(
  customers: CustomerItem[],
  query: string,
  motorcycles: MotorcycleItem[],
  options?: { limit?: number }
): CustomerSearchResult[] {
  const cleanQ = normalizeText(query);
  if (!cleanQ || cleanQ.length < 2) return [];

  const queryDigits = cleanDigits(query);
  const queryPlate = cleanPlate(query);
  const tokens = extractQueryTokens(cleanQ);
  const limit = options?.limit || 20;
  const results: CustomerSearchResult[] = [];

  for (const c of customers) {
    if (!c) continue;

    const custMotos = motorcycles.filter(m => m.customer_id === c.id);
    const nameNorm = normalizeText(c.name || '');
    const nickNorm = normalizeText(c.nickname || '');
    const phoneDigits = cleanDigits(c.whatsapp || c.phone || '');
    const cpfDigits = cleanDigits(c.cpf || '');
    const cnpjDigits = cleanDigits(c.cnpj || '');

    let matched = false;
    let score = 0;
    let matchedField: CustomerSearchResult['matchedField'] = 'name';
    let matchedMoto: MotorcycleItem | undefined = undefined;

    // 1. Busca por Placa de Moto Vinculada (ex: "ABC1D23", "ABC-1234", "1234")
    if (queryPlate.length >= 3) {
      for (const m of custMotos) {
        const mPlateClean = cleanPlate(m.plate);
        if (mPlateClean === queryPlate) {
          matched = true;
          score = 10000;
          matchedField = 'plate';
          matchedMoto = m;
          break;
        } else if (mPlateClean.includes(queryPlate)) {
          matched = true;
          score = 7000;
          matchedField = 'plate';
          matchedMoto = m;
          break;
        }
      }
    }

    // 2. Busca por Telefone / WhatsApp (ex: "9988", "988776655")
    if (!matched && queryDigits.length >= 3) {
      if (phoneDigits === queryDigits) {
        matched = true;
        score = 9000;
        matchedField = 'phone';
      } else if (phoneDigits.endsWith(queryDigits) || phoneDigits.includes(queryDigits)) {
        matched = true;
        score = 6000 + (queryDigits.length * 100);
        matchedField = 'phone';
      }
    }

    // 3. Busca por CPF ou CNPJ
    if (!matched && queryDigits.length >= 4) {
      if (cpfDigits && (cpfDigits === queryDigits || cpfDigits.includes(queryDigits))) {
        matched = true;
        score = 8500;
        matchedField = 'cpf';
      } else if (cnpjDigits && (cnpjDigits === queryDigits || cnpjDigits.includes(queryDigits))) {
        matched = true;
        score = 8500;
        matchedField = 'cnpj';
      }
    }

    // 4. Busca por Modelo da Motocicleta (ex: "Titan 160", "Bros", "Fazer")
    if (!matched && tokens.length > 0) {
      for (const m of custMotos) {
        const motoNorm = normalizeText(m.model || m.brand || '');
        const motoWords = motoNorm.split(/\s+/).filter(Boolean);
        let motoTokenMatches = 0;

        for (const token of tokens) {
          const match = tokenMatchesField(token, motoWords, motoNorm);
          if (match.matched) motoTokenMatches++;
        }

        if (motoTokenMatches === tokens.length) {
          matched = true;
          score = 5500;
          matchedField = 'moto_model';
          matchedMoto = m;
          break;
        }
      }
    }

    // 5. Busca por Nome ou Apelido (Tokens fora de ordem, abreviações, prefixos)
    if (!matched) {
      const nameWords = nameNorm.split(/\s+/).filter(Boolean);
      const nickWords = nickNorm.split(/\s+/).filter(Boolean);
      const combinedWords = [...nameWords, ...nickWords];
      const combinedFull = `${nameNorm} ${nickNorm}`;

      let tokensMatchedCount = 0;
      let nameScore = 0;

      for (const token of tokens) {
        const match = tokenMatchesField(token, combinedWords, combinedFull);
        if (match.matched) {
          tokensMatchedCount++;
          nameScore += match.score;
        }
      }

      if (tokensMatchedCount === tokens.length && tokens.length > 0) {
        matched = true;
        matchedField = nickWords.some(nw => nw.startsWith(tokens[0])) ? 'nickname' : 'name';

        // Correspondência exata do nome
        if (nameNorm === cleanQ) {
          nameScore += 4000;
        } else if (nameNorm.startsWith(cleanQ)) {
          nameScore += 2500;
        } else if (nameNorm.includes(cleanQ)) {
          nameScore += 1500;
        }

        score = nameScore;
      }
    }

    if (matched) {
      // Se não identificou moto específica pelo termo, anexa a primeira moto cadastrada
      if (!matchedMoto && custMotos.length > 0) {
        matchedMoto = custMotos[0];
      }

      results.push({
        customer: c,
        motorcycles: custMotos,
        matchedMoto,
        matchedField,
        score,
      });
    }
  }

  // Ordenar por relevância
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Função para destacar trechos do texto correspondentes à pesquisa
 * Retorna uma lista de partes com flag se deram match ou não
 */
export function getHighlightedSegments(
  text: string | null | undefined,
  query: string
): Array<{ text: string; match: boolean }> {
  if (!text) return [];
  if (!query || query.trim().length < 2) return [{ text, match: false }];

  const tokens = extractQueryTokens(query);
  if (tokens.length === 0) return [{ text, match: false }];

  // Monta lista de termos para destacar (incluindo sinônimos de motos)
  const allTerms: string[] = [];
  for (const t of tokens) {
    allTerms.push(t);
    const expansions = MOTO_ABBREVIATIONS[t];
    if (expansions) {
      for (const exp of expansions) {
        allTerms.push(...exp.split(/\s+/));
      }
    }
  }

  // Remove termos curtos duplicados
  const cleanTerms = Array.from(new Set(allTerms.filter(t => t.length >= 2)));
  if (cleanTerms.length === 0) return [{ text, match: false }];

  // Ordena termos pelo maior comprimento primeiro para regex gananciosa
  cleanTerms.sort((a, b) => b.length - a.length);

  // Escapar caracteres especiais para Regex
  const escaped = cleanTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  // Criar regex case-insensitive e acento-sensível compatível
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts
      .filter(p => p.length > 0)
      .map(part => {
        const normPart = normalizeText(part);
        const isMatch = cleanTerms.some(t => normPart.startsWith(t) || t.startsWith(normPart));
        return { text: part, match: isMatch };
      });
  } catch (e) {
    return [{ text, match: false }];
  }
}
