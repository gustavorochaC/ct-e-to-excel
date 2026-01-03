import * as pdfjsLib from 'pdfjs-dist';

// CRITICAL: Configure PDF.js worker from CDN with fixed version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface CTeData {
  dataEmissao: string;
  numeroCTe: string;
  serie: string;
  chaveAcesso: string;
  transportadora: string;
  cnpjTransportadora: string;
  remetente: string;
  cnpjRemetente: string;
  cidadeOrigem: string;
  ufOrigem: string;
  destinatario: string;
  cnpjDestinatario: string;
  cidadeDestino: string;
  ufDestino: string;
  produto: string;
  peso: string;
  quantidadeVolumes: string;
  valorTotalCarga: string;
  valorFrete: string;
  valorICMS: string;
  nfe: string;
  placaVeiculo: string;
}

export const extractCTeData = async (file: File): Promise<CTeData> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  // Normalize whitespace for more stable regex matching
  fullText = fullText.replace(/\s+/g, ' ').trim();
  
  return parseText(fullText);
};

const parseText = (pdfText: string): CTeData => {
  const data: CTeData = {
    dataEmissao: '',
    numeroCTe: '',
    serie: '',
    chaveAcesso: '',
    transportadora: '',
    cnpjTransportadora: '',
    remetente: '',
    cnpjRemetente: '',
    cidadeOrigem: '',
    ufOrigem: '',
    destinatario: '',
    cnpjDestinatario: '',
    cidadeDestino: '',
    ufDestino: '',
    produto: '',
    peso: '',
    quantidadeVolumes: '',
    valorTotalCarga: '',
    valorFrete: '',
    valorICMS: '',
    nfe: '',
    placaVeiculo: ''
  };

  // Issue date (DD/MM/YYYY)
  const dateMatch = pdfText.match(/(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*\d{2}:\d{2}/);
  if (dateMatch) data.dataEmissao = dateMatch[1];
  else {
    const altDateMatch = pdfText.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (altDateMatch) data.dataEmissao = altDateMatch[1];
  }

  // CT-e number and series - prioritize combined pattern "Nº DOCUMENTO CT-E SÉRIE: {numero} {serie}"
  const numSerieMatch = pdfText.match(/N[ºo°]?\s*DOCUMENTO\s+CT-?E\s+S[ÉE]RIE[:\s]*(\d+)\s+(\d+)/i);
  if (numSerieMatch) {
    data.numeroCTe = numSerieMatch[1];
    data.serie = numSerieMatch[2];
  } else {
    // Fallback: try individual patterns
    const numMatch = pdfText.match(/N[ÚU]MERO\s*[:\s]*(\d+)/i);
    if (numMatch) data.numeroCTe = numMatch[1];
    else {
      const altNumMatch = pdfText.match(/CT-?e\s*n[°ºo]?\s*[:\s]*(\d+)/i);
      if (altNumMatch) data.numeroCTe = altNumMatch[1];
    }

    // Series
    const serieMatch = pdfText.match(/S[ÉE]RIE[:\s]*(\d+)/i);
    if (serieMatch) data.serie = serieMatch[1];
  }

  // Access key (44 digits)
  const chaveMatch = pdfText.match(/(\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4})/);
  if (chaveMatch) data.chaveAcesso = chaveMatch[1].replace(/\s/g, '');

  // Carrier (company name patterns) - accepts accented characters
  const transpMatch = pdfText.match(/EMITENTE[^A-ZÀ-Ú]*([A-ZÀ-Ú][A-ZÀ-Ú\s]+(?:LTDA|LTDA\.|S\.?A\.?|EIRELI|ME|EPP|TRANSPORTES?))/i);
  if (transpMatch) {
    data.transportadora = transpMatch[1].trim();
    // Carrier CNPJ - extract from same context as carrier name
    const cnpjTranspMatch = pdfText.substring(transpMatch.index).match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
    if (cnpjTranspMatch) data.cnpjTransportadora = cnpjTranspMatch[1].replace(/[.\/\-]/g, '');
  } else {
    const altTranspMatch = pdfText.match(/([A-ZÀ-Ú][A-ZÀ-Ú\s]+(?:TRANSPORTES?|LOG[ÍI]STICA)[A-ZÀ-Ú\s]*(?:LTDA|LTDA\.|S\.?A\.?))/i);
    if (altTranspMatch) {
      data.transportadora = altTranspMatch[1].trim();
      // Try to get CNPJ from same context
      const cnpjTranspMatch = pdfText.substring(altTranspMatch.index).match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
      if (cnpjTranspMatch) data.cnpjTransportadora = cnpjTranspMatch[1].replace(/[.\/\-]/g, '');
    }
  }

  // Fallback: if CNPJ not found in context, try first occurrence
  if (!data.cnpjTransportadora) {
    const cnpjTranspMatch = pdfText.match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i);
    if (cnpjTranspMatch) data.cnpjTransportadora = cnpjTranspMatch[1].replace(/[.\/\-]/g, '');
  }

  // Sender - support accented characters
  const remMatch = pdfText.match(/REMETENTE[^A-ZÀ-Ú]*([A-ZÀ-Ú][A-ZÀ-Ú\s]+(?:LTDA|S\.?A\.?|EIRELI|IND[ÚU]STRIA|COM[ÉE]RCIO))/i);
  if (remMatch) data.remetente = remMatch[1].trim();

  // Sender CNPJ
  const cnpjRemMatch = pdfText.match(/REMETENTE[^0-9]*?CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/is);
  if (cnpjRemMatch) data.cnpjRemetente = cnpjRemMatch[1].replace(/[.\/-]/g, '');

  // Try to extract origin and destination from concatenated pattern first
  // Pattern: "CIDADE1 - UF1 CIDADE2 - UF2" (e.g., "GOIANIA - GO SAO BERNARDO DO CAMPO - SP")
  const origDestMatch = pdfText.match(/([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)\s*-\s*([A-Z]{2})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)\s*-\s*([A-Z]{2})/);
  if (origDestMatch) {
    data.cidadeOrigem = origDestMatch[1].trim();
    data.ufOrigem = origDestMatch[2];
    data.cidadeDestino = origDestMatch[3].trim();
    data.ufDestino = origDestMatch[4];
  } else {
    // Origin city and state (individual extraction)
    const origMatch = pdfText.match(/MUNIC[ÍI]PIO[:\s]*([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)(?:\s*[-–]\s*|\s+)([A-Z]{2})\s/i);
    if (origMatch) {
      data.cidadeOrigem = origMatch[1].trim();
      data.ufOrigem = origMatch[2];
    }

    // Destination city and state (individual extraction)
    const destCityMatch = pdfText.match(/DESTINO[:\s]*([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)(?:\s*[-–]\s*|\s+)([A-Z]{2})/i);
    if (destCityMatch) {
      data.cidadeDestino = destCityMatch[1].trim();
      data.ufDestino = destCityMatch[2];
    }
  }

  // Recipient - support accented characters
  const destMatch = pdfText.match(/DESTINAT[ÁA]RIO[^A-ZÀ-Ú]*([A-ZÀ-Ú][A-ZÀ-Ú\s]+(?:LTDA|S\.?A\.?|EIRELI))/i);
  if (destMatch) data.destinatario = destMatch[1].trim();

  // Recipient CNPJ
  const cnpjDestMatch = pdfText.match(/DESTINAT[ÁA]RIO[^0-9]*?CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/is);
  if (cnpjDestMatch) data.cnpjDestinatario = cnpjDestMatch[1].replace(/[.\/-]/g, '');

  // Product - support accented characters and better delimitation
  const prodMatch = pdfText.match(/PRODUTO\s+PREDOMINANTE[:\s]*([A-ZÀ-Ú][A-ZÀ-Ú\s\-\d,\.]+?)(?=\s+(?:PESO|QNT|QUANTIDADE|VALOR|COMPONENTES))/i);
  if (prodMatch) data.produto = prodMatch[1].trim();
  else {
    const altProdMatch = pdfText.match(/PRODUTO\s+PREDOMINANTE[:\s]*([A-ZÀ-Ú][A-ZÀ-Ú\s\-\d,\.]{5,50})/i);
    if (altProdMatch) data.produto = altProdMatch[1].trim();
  }

  // Weight - support various formats (with/without thousands separator, comma or dot)
  const pesoMatch = pdfText.match(/PESO\s*(?:BRUTO|TOTAL)?[:\s]*(\d{1,3}(?:[.,]\d{3})*[.,]\d+|\d+)\s*(?:KG)?/i);
  if (pesoMatch) {
    // Normalize: remove thousands separator, convert comma to dot
    let peso = pesoMatch[1];
    // If has both dot and comma, assume dot is thousands separator
    if (peso.includes('.') && peso.includes(',')) {
      peso = peso.replace(/\./g, '').replace(',', '.');
    } else if (peso.includes(',')) {
      peso = peso.replace(',', '.');
    }
    data.peso = peso;
  } else {
    const altPesoMatch = pdfText.match(/QNT\.?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d+|\d+)/i);
    if (altPesoMatch) {
      let peso = altPesoMatch[1];
      if (peso.includes('.') && peso.includes(',')) {
        peso = peso.replace(/\./g, '').replace(',', '.');
      } else if (peso.includes(',')) {
        peso = peso.replace(',', '.');
      }
      data.peso = peso;
    }
  }

  // Number of volumes - accept formats like "6,000" or "6.000" or "6"
  const volMatch = pdfText.match(/QUANTIDADE\s+(?:DE\s+)?VOLUMES[:\s]*(\d+)[.,]?(\d+)?/i);
  if (volMatch) {
    // Take only the integer part (before decimal/thousands separator)
    data.quantidadeVolumes = volMatch[1];
  }

  // Total cargo value
  const valorCargaMatch = pdfText.match(/VALOR\s+TOTAL\s+(?:DA\s+)?CARGA[:\s]*R?\$?\s*(\d+[.\d]*,\d{2})/i);
  if (valorCargaMatch) data.valorTotalCarga = valorCargaMatch[1].replace(/\./g, '').replace(',', '.');

  // Freight value
  const valorFreteMatch = pdfText.match(/VALOR\s+TOTAL\s+(?:DA\s+)?PRESTA[ÇC][ÃA]O[:\s]*R?\$?\s*(\d+[.\d]*,\d{2})/i);
  if (valorFreteMatch) data.valorFrete = valorFreteMatch[1].replace(/\./g, '').replace(',', '.');

  // ICMS value
  const icmsMatch = pdfText.match(/VALOR\s+(?:DO\s+)?ICMS[:\s]*R?\$?\s*(\d+[.\d]*,\d{2})/i);
  if (icmsMatch) data.valorICMS = icmsMatch[1].replace(/\./g, '').replace(',', '.');

  // NF-e - accept spaces around slash
  const nfeMatch = pdfText.match(/NF-?e?[:\s]*(\d{3})\s*\/\s*(\d+)/i);
  if (nfeMatch) {
    data.nfe = `${nfeMatch[1]}/${nfeMatch[2]}`;
  } else {
    const altNfeMatch = pdfText.match(/S[ÉE]RIE\s*\/\s*N[ºo°]?\s*DOCUMENTO[^0-9]*(\d{3})\s*\/\s*(\d+)/i);
    if (altNfeMatch) {
      data.nfe = `${altNfeMatch[1]}/${altNfeMatch[2]}`;
    } else {
      const simpleNfeMatch = pdfText.match(/NOTA\s+FISCAL[:\s]*(\d+)/i);
      if (simpleNfeMatch) data.nfe = simpleNfeMatch[1];
    }
  }

  return data;
};

export const countExtractedFields = (data: CTeData): number => {
  return Object.entries(data).filter(([key, value]) => key !== 'placaVeiculo' && value !== '').length;
};

// Get list of fields that were not found
export const getMissingFields = (data: CTeData): string[] => {
  const fieldLabels: Record<string, string> = {
    dataEmissao: 'Data de Emissão',
    numeroCTe: 'Número do CT-e',
    serie: 'Série',
    chaveAcesso: 'Chave de Acesso',
    transportadora: 'Transportadora',
    cnpjTransportadora: 'CNPJ Transportadora',
    remetente: 'Remetente',
    cnpjRemetente: 'CNPJ Remetente',
    cidadeOrigem: 'Cidade de Origem',
    ufOrigem: 'UF de Origem',
    destinatario: 'Destinatário',
    cnpjDestinatario: 'CNPJ Destinatário',
    cidadeDestino: 'Cidade de Destino',
    ufDestino: 'UF de Destino',
    produto: 'Produto',
    peso: 'Peso',
    quantidadeVolumes: 'Volumes',
    valorTotalCarga: 'Valor da Carga',
    valorFrete: 'Valor do Frete',
    valorICMS: 'Valor ICMS',
    nfe: 'NF-e'
  };

  return Object.entries(data)
    .filter(([key, value]) => key !== 'placaVeiculo' && value === '')
    .map(([key]) => fieldLabels[key] || key);
};

// Validate if CT-e has minimum required fields
export const isValidCTeData = (data: CTeData): boolean => {
  // Minimum required fields for a valid CT-e
  const requiredFields = [
    data.numeroCTe,
    data.chaveAcesso,
    data.cnpjRemetente || data.remetente,
    data.cnpjDestinatario || data.destinatario
  ];
  
  return requiredFields.every(field => field && field !== '');
};
