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

  // CT-e number
  const numMatch = pdfText.match(/N[ÚU]MERO\s*[:\s]*(\d+)/i);
  if (numMatch) data.numeroCTe = numMatch[1];
  else {
    const altNumMatch = pdfText.match(/CT-?e\s*n[°ºo]?\s*[:\s]*(\d+)/i);
    if (altNumMatch) data.numeroCTe = altNumMatch[1];
  }

  // Series
  const serieMatch = pdfText.match(/S[ÉE]RIE[:\s]*(\d+)/i);
  if (serieMatch) data.serie = serieMatch[1];

  // Access key (44 digits)
  const chaveMatch = pdfText.match(/(\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4})/);
  if (chaveMatch) data.chaveAcesso = chaveMatch[1].replace(/\s/g, '');

  // Carrier (company name patterns)
  const transpMatch = pdfText.match(/EMITENTE[^A-Z]*([A-Z][A-Z\s]+(?:LTDA|S\.?A\.?|EIRELI|ME|EPP))/i);
  if (transpMatch) data.transportadora = transpMatch[1].trim();
  else {
    const altTranspMatch = pdfText.match(/([A-Z][A-Z\s]+(?:TRANSPORTES?|LOGISTICA)[A-Z\s]*(?:LTDA|S\.?A\.?))/i);
    if (altTranspMatch) data.transportadora = altTranspMatch[1].trim();
  }

  // Carrier CNPJ (14 digits after carrier section)
  const cnpjTranspMatch = pdfText.match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i);
  if (cnpjTranspMatch) data.cnpjTransportadora = cnpjTranspMatch[1].replace(/[.\/-]/g, '');

  // Sender
  const remMatch = pdfText.match(/REMETENTE[^A-Z]*([A-Z][A-Z\s]+(?:LTDA|S\.?A\.?|EIRELI|INDUSTRIA|COMERCIO))/i);
  if (remMatch) data.remetente = remMatch[1].trim();

  // Sender CNPJ
  const cnpjRemMatch = pdfText.match(/REMETENTE[^0-9]*?CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/is);
  if (cnpjRemMatch) data.cnpjRemetente = cnpjRemMatch[1].replace(/[.\/-]/g, '');

  // Origin city and state
  const origMatch = pdfText.match(/MUNIC[ÍI]PIO[:\s]*([A-Z][A-Z\s]+?)(?:\s*[-–]\s*|\s+)([A-Z]{2})\s/i);
  if (origMatch) {
    data.cidadeOrigem = origMatch[1].trim();
    data.ufOrigem = origMatch[2];
  }

  // Recipient
  const destMatch = pdfText.match(/DESTINAT[ÁA]RIO[^A-Z]*([A-Z][A-Z\s]+(?:LTDA|S\.?A\.?|EIRELI))/i);
  if (destMatch) data.destinatario = destMatch[1].trim();

  // Recipient CNPJ
  const cnpjDestMatch = pdfText.match(/DESTINAT[ÁA]RIO[^0-9]*?CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/is);
  if (cnpjDestMatch) data.cnpjDestinatario = cnpjDestMatch[1].replace(/[.\/-]/g, '');

  // Destination city and state
  const destCityMatch = pdfText.match(/DESTINO[:\s]*([A-Z][A-Z\s]+?)(?:\s*[-–]\s*|\s+)([A-Z]{2})/i);
  if (destCityMatch) {
    data.cidadeDestino = destCityMatch[1].trim();
    data.ufDestino = destCityMatch[2];
  }

  // Product
  const prodMatch = pdfText.match(/PRODUTO\s+PREDOMINANTE[:\s]*([A-Z][A-Z\s\-\d,\.]+)/i);
  if (prodMatch) data.produto = prodMatch[1].trim();

  // Weight
  const pesoMatch = pdfText.match(/PESO\s*(?:BRUTO|TOTAL)?[:\s]*(\d+[,\.]\d+)\s*(?:KG)?/i);
  if (pesoMatch) data.peso = pesoMatch[1].replace(',', '.');
  else {
    const altPesoMatch = pdfText.match(/QNT\.?\s*(\d+[,\.]\d+)/i);
    if (altPesoMatch) data.peso = altPesoMatch[1].replace(',', '.');
  }

  // Number of volumes
  const volMatch = pdfText.match(/QUANTIDADE\s+(?:DE\s+)?VOLUMES[:\s]*(\d+)/i);
  if (volMatch) data.quantidadeVolumes = volMatch[1];

  // Total cargo value
  const valorCargaMatch = pdfText.match(/VALOR\s+TOTAL\s+(?:DA\s+)?CARGA[:\s]*R?\$?\s*(\d+[.\d]*,\d{2})/i);
  if (valorCargaMatch) data.valorTotalCarga = valorCargaMatch[1].replace(/\./g, '').replace(',', '.');

  // Freight value
  const valorFreteMatch = pdfText.match(/VALOR\s+TOTAL\s+(?:DA\s+)?PRESTA[ÇC][ÃA]O[:\s]*R?\$?\s*(\d+[.\d]*,\d{2})/i);
  if (valorFreteMatch) data.valorFrete = valorFreteMatch[1].replace(/\./g, '').replace(',', '.');

  // ICMS value
  const icmsMatch = pdfText.match(/VALOR\s+(?:DO\s+)?ICMS[:\s]*R?\$?\s*(\d+[.\d]*,\d{2})/i);
  if (icmsMatch) data.valorICMS = icmsMatch[1].replace(/\./g, '').replace(',', '.');

  // NF-e
  const nfeMatch = pdfText.match(/NF-?e?[:\s]*(\d{3}\/\d+)/i);
  if (nfeMatch) data.nfe = nfeMatch[1];
  else {
    const altNfeMatch = pdfText.match(/NOTA\s+FISCAL[:\s]*(\d+)/i);
    if (altNfeMatch) data.nfe = altNfeMatch[1];
  }

  return data;
};

export const countExtractedFields = (data: CTeData): number => {
  return Object.entries(data).filter(([key, value]) => key !== 'placaVeiculo' && value !== '').length;
};
