import { useState, useEffect } from 'react';
import { Loader2, Rocket, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import UploadArea from '@/components/UploadArea';
import ResultCard from '@/components/ResultCard';
import ErrorMessage from '@/components/ErrorMessage';
import { extractCTeData, countExtractedFields, getMissingFields, type CTeData } from '@/lib/pdfExtractor';
import { generateExcel } from '@/lib/excelGenerator';
import { addCTeToStorage, getCTesFromCurrentMonth, getCurrentMonthCount } from '@/lib/storage';
import { getCurrentMonthYear, getMonthName } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<CTeData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [monthCount, setMonthCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        darkMode={darkMode} 
        onToggleDarkMode={() => setDarkMode(!darkMode)} 
      />

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">
            📄 Extrair Dados do CT-e
          </h2>
          <p className="text-muted-foreground mb-8 font-mono text-sm">
            Faça upload do PDF e gere sua planilha Excel automaticamente
          </p>

          <div className="space-y-6">
            {/* Card com informações do mês atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Excel do Mês Atual</span>
                  <Badge variant="secondary" className="text-sm">
                    {getMonthName(getCurrentMonthYear().month)} {getCurrentMonthYear().year}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Todos os CT-es processados este mês serão acumulados no mesmo arquivo Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{monthCount}</p>
                    <p className="text-sm text-muted-foreground">
                      CT-e(s) processado(s) este mês
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={monthCount === 0}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Baixar Excel do Mês
                  </Button>
                </div>
              </CardContent>
            </Card>

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  ✓ {successMessage}
                </p>
              </div>
            )}

            <UploadArea
              file={file}
              onFileSelect={handleFileSelect}
              disabled={processing}
            />

            <Button
              onClick={processCTe}
              disabled={!file || processing}
              size="lg"
              className="w-full gap-2 font-bold text-base"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extraindo dados...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Extrair Dados
                </>
              )}
            </Button>

            {error && <ErrorMessage message={error} />}

            {extractedData && (
              <ResultCard
                data={extractedData}
                fieldsCount={countExtractedFields(extractedData)}
                missingFields={getMissingFields(extractedData)}
                onDownload={handleDownload}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
