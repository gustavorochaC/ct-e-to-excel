import * as XLSX from 'xlsx';
import type { CTeData } from './pdfExtractor';
import { getMonthName, getMonthYearFromDate, getCurrentMonthYear } from './utils';

// Converter um CT-e para formato de linha do Excel
const cteToExcelRow = (data: CTeData) => ({
  "Data": data.dataEmissao,
  "Nº CT-e": data.numeroCTe,
  "Série": data.serie,
  "Chave": data.chaveAcesso,
  "Transportadora": data.transportadora,
  "CNPJ Transportadora": formatCNPJ(data.cnpjTransportadora),
  "Remetente": data.remetente,
  "CNPJ Remetente": formatCNPJ(data.cnpjRemetente),
  "Origem": data.cidadeOrigem && data.ufOrigem ? `${data.cidadeOrigem} - ${data.ufOrigem}` : data.cidadeOrigem || data.ufOrigem,
  "Destinatário": data.destinatario,
  "CNPJ Destinatário": formatCNPJ(data.cnpjDestinatario),
  "Destino": data.cidadeDestino && data.ufDestino ? `${data.cidadeDestino} - ${data.ufDestino}` : data.cidadeDestino || data.ufDestino,
  "Produto": data.produto,
  "Peso KG": data.peso ? parseFloat(data.peso) : '',
  "Volumes": data.quantidadeVolumes ? parseInt(data.quantidadeVolumes) : '',
  "Valor Carga (R$)": data.valorTotalCarga ? parseFloat(data.valorTotalCarga) : '',
  "Valor Frete (R$)": data.valorFrete ? parseFloat(data.valorFrete) : '',
  "ICMS (R$)": data.valorICMS ? parseFloat(data.valorICMS) : '',
  "NF-e": data.nfe,
  "Placa Veículo": ""
});

// Gerar Excel a partir de um array de CT-es
export const generateExcel = (dataArray: CTeData[]): void => {
  if (!dataArray || dataArray.length === 0) {
    console.error('Nenhum dado para gerar Excel');
    return;
  }

  // Converter todos os CT-es para linhas do Excel
  const excelData = dataArray.map(cteToExcelRow);

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 },  // Data
    { wch: 10 },  // Nº CT-e
    { wch: 8 },   // Série
    { wch: 48 },  // Chave
    { wch: 30 },  // Transportadora
    { wch: 20 },  // CNPJ
    { wch: 30 },  // Remetente
    { wch: 20 },  // CNPJ
    { wch: 25 },  // Origem
    { wch: 30 },  // Destinatário
    { wch: 20 },  // CNPJ
    { wch: 25 },  // Destino
    { wch: 35 },  // Produto
    { wch: 12 },  // Peso
    { wch: 10 },  // Volumes
    { wch: 15 },  // Valor Carga
    { wch: 15 },  // Valor Frete
    { wch: 12 },  // ICMS
    { wch: 15 },  // NF-e
    { wch: 15 }   // Placa (empty)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CT-e");

  // Determinar mês e ano para o nome do arquivo
  // Tenta usar a data do primeiro CT-e, senão usa a data atual
  const firstCTe = dataArray[0];
  const monthYear = getMonthYearFromDate(firstCTe.dataEmissao) || getCurrentMonthYear();
  const monthName = getMonthName(monthYear.month);
  const fileName = `CTe_${monthName}_${monthYear.year}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

// Função de compatibilidade: aceita um único CT-e (converte para array)
export const generateExcelFromSingle = (data: CTeData): void => {
  generateExcel([data]);
};

const formatCNPJ = (cnpj: string): string => {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};
