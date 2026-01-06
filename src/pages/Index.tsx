import { useState, useEffect } from 'react';
import { Loader2, Rocket, FileSpreadsheet, Info, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadArea from '@/components/UploadArea';
import ResultCard from '@/components/ResultCard';
import ErrorMessage from '@/components/ErrorMessage';
import { extractCTeData, countExtractedFields, getMissingFields, type CTeData } from '@/lib/pdfExtractor';
import { generateExcel } from '@/lib/excelGenerator';
import { addCTeToStorage, getCTesFromCurrentMonth, getCurrentMonthCount } from '@/lib/storage';
import { getCurrentMonthYear, getMonthName } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<CTeData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthCount, setMonthCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Carregar contador do mês atual ao montar o componente
  useEffect(() => {
    const loadMonthCount = async () => {
      const count = await getCurrentMonthCount();
      setMonthCount(count);
    };
    loadMonthCount();
  }, []);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setExtractedData(null);
  };

  const processCTe = async () => {
    if (!file) {
      setError('Selecione um arquivo primeiro');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await extractCTeData(file);
      
      // Adicionar CT-e ao armazenamento
      await addCTeToStorage(data);
      
      // Recuperar todos os CT-es do mês atual
      const allCTes = await getCTesFromCurrentMonth();
      
      // Atualizar contador
      setMonthCount(allCTes.length);
      
      // Gerar Excel com todos os dados do mês
      generateExcel(allCTes);
      
      // Mostrar dados do último CT-e processado
      setExtractedData(data);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage(`CT-e adicionado ao Excel do mês! Total: ${allCTes.length} CT-e(s) processado(s) este mês.`);
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Erro ao processar CT-e. Verifique se o arquivo é um PDF válido.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const allCTes = await getCTesFromCurrentMonth();
      if (allCTes.length === 0) {
        setError('Nenhum CT-e processado este mês ainda.');
        return;
      }
      generateExcel(allCTes);
    } catch (err) {
      console.error('Download error:', err);
      setError('Erro ao gerar Excel. Tente novamente.');
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-md">
            Gerencie suas extrações e exporte para Excel
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Sistema online
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card com informações do mês atual */}
        <Card className="md:col-span-3 border-none shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>Visão Geral do Mês</span>
              </div>
              <Badge variant="secondary" className="font-normal px-2.5 py-0.5 text-xs bg-background/80 backdrop-blur">
                {getMonthName(getCurrentMonthYear().month)} {getCurrentMonthYear().year}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Rocket className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-4xl font-bold tracking-tight tabular-nums">{monthCount}</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    CT-e(s) processados
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-auto flex flex-col items-end gap-2">
                <Button
                  onClick={handleDownload}
                  disabled={monthCount === 0}
                  variant="outline"
                  className="w-full md:w-auto gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Baixar Relatório Completo
                </Button>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Autosalvo no banco de dados local
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-2 space-y-6">
           <div className="rounded-xl border border-border bg-card shadow-sm p-1">
             <UploadArea
                file={file}
                onFileSelect={handleFileSelect}
                disabled={processing}
              />
           </div>

          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                {successMessage}
              </p>
            </div>
          )}

          <Button
            onClick={processCTe}
            disabled={!file || processing}
            size="lg"
            className={cn(
              "w-full gap-2 font-bold text-base shadow-lg transition-all hover:shadow-primary/25 hover:-translate-y-0.5",
              processing && "opacity-80 cursor-not-allowed"
            )}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Extrair Dados do CT-e
              </>
            )}
          </Button>

          {error && <ErrorMessage message={error} />}
        </div>

        <div className="md:col-span-3">
          {extractedData ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <ResultCard
                data={extractedData}
                fieldsCount={countExtractedFields(extractedData)}
                missingFields={getMissingFields(extractedData)}
                onDownload={handleDownload}
              />
            </div>
          ) : (
            <div className="h-full min-h-[300px] rounded-xl border-2 border-dashed border-muted-foreground/10 bg-muted/5 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8 opacity-20" />
              </div>
              <h3 className="text-lg font-medium mb-1">Aguardando processamento</h3>
              <p className="text-sm max-w-xs mx-auto">
                Faça upload de um arquivo PDF para visualizar os dados extraídos aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
