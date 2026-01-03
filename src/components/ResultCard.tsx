import { CheckCircle, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CTeData } from '@/lib/pdfExtractor';

interface ResultCardProps {
  data: CTeData;
  fieldsCount: number;
  onDownload: () => void;
}

const ResultCard = ({ data, fieldsCount, onDownload }: ResultCardProps) => {
  return (
    <div className="border-2 border-border p-6 bg-card">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 bg-primary">
          <CheckCircle className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">
            ✅ CT-e processado com sucesso!
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 font-mono">
            <li>• {fieldsCount} campos extraídos</li>
            <li>• CT-e nº {data.numeroCTe || 'N/A'}</li>
            <li>• Download iniciado automaticamente</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-accent border-2 border-border mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Lembre-se:</strong> Preencha a coluna "Placa Veículo" na planilha usando sua programação de carregamento
          </p>
        </div>
      </div>

      <Button
        onClick={onDownload}
        className="w-full gap-2 font-semibold"
        size="lg"
      >
        <Download className="w-5 h-5" />
        Baixar Excel Novamente
      </Button>
    </div>
  );
};

export default ResultCard;
