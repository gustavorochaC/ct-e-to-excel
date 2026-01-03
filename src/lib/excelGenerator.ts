import * as XLSX from 'xlsx';
import type { CTeData } from './pdfExtractor';

export const generateExcel = (data: CTeData): void => {
  const excelData = [{
    "Data Emissão": data.dataEmissao,
    "Nº CT-e": data.numeroCTe,
    "Série": data.serie,
    "Chave de Acesso": data.chaveAcesso,
    "Transportadora": data.transportadora,
    "CNPJ Transportadora": formatCNPJ(data.cnpjTransportadora),
    "Remetente": data.remetente,
    "CNPJ Remetente": formatCNPJ(data.cnpjRemetente),
    "Origem": data.cidadeOrigem && data.ufOrigem ? `${data.cidadeOrigem} - ${data.ufOrigem}` : data.cidadeOrigem || data.ufOrigem,
    "Destinatário": data.destinatario,
    "CNPJ Destinatário": formatCNPJ(data.cnpjDestinatario),
    "Destino": data.cidadeDestino && data.ufDestino ? `${data.cidadeDestino} - ${data.ufDestino}` : data.cidadeDestino || data.ufDestino,
    "Produto": data.produto,
    "Peso (KG)": data.peso ? parseFloat(data.peso) : '',
    "Volumes": data.quantidadeVolumes ? parseInt(data.quantidadeVolumes) : '',
    "Valor Carga (R$)": data.valorTotalCarga ? parseFloat(data.valorTotalCarga) : '',
    "Valor Frete (R$)": data.valorFrete ? parseFloat(data.valorFrete) : '',
    "ICMS (R$)": data.valorICMS ? parseFloat(data.valorICMS) : '',
    "NF-e": data.nfe,
    "Placa Veículo": ""
  }];

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

  // File name: CTe_[number]_[date].xlsx
  const safeDate = data.dataEmissao ? data.dataEmissao.replace(/\//g, '-') : 'sem-data';
  const safeNumber = data.numeroCTe || 'sem-numero';
  const fileName = `CTe_${safeNumber}_${safeDate}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

const formatCNPJ = (cnpj: string): string => {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};
