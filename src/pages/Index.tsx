import { useState, useEffect } from 'react';
import { Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import UploadArea from '@/components/UploadArea';
import ResultCard from '@/components/ResultCard';
import ErrorMessage from '@/components/ErrorMessage';
import { extractCTeData, countExtractedFields, getMissingFields, type CTeData } from '@/lib/pdfExtractor';
import { generateExcel } from '@/lib/excelGenerator';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<CTeData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

    try {
      const data = await extractCTeData(file);
      
      // We always allow extraction now, but we'll show what's missing
      setExtractedData(data);
      generateExcel(data);
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Erro ao processar CT-e. Verifique se o arquivo é um PDF válido.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (extractedData) {
      generateExcel(extractedData);
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
