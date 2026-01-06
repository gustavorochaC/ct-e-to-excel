import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, FileSpreadsheet, AlertCircle, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { getCTesFromCurrentMonth, deleteCTe } from '@/lib/storage';
import { generateExcel } from '@/lib/excelGenerator';
import { getCurrentMonthYear, getMonthName } from '@/lib/utils';
import type { CTeData } from '@/lib/pdfExtractor';

const History = () => {
  const [ctes, setCtes] = useState<CTeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(getCurrentMonthYear());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // In a full implementation, we would pass year/month to getCTesByMonth
      // For now, defaulting to current month as per existing logic
      const data = await getCTesFromCurrentMonth();
      setCtes(data);
    } catch (error) {
      console.error("Failed to load CTEs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (chaveAcesso: string) => {
    try {
      await deleteCTe(chaveAcesso, currentDate.year, currentDate.month);
      // Refresh data
      await loadData();
      
      // Optional: Regenerate Excel immediately or let user do it via dashboard
      // const updatedCtes = await getCTesFromCurrentMonth();
      // generateExcel(updatedCtes);
      
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete CTE", error);
    }
  };

  const handleDownloadExcel = () => {
    if (ctes.length > 0) {
      generateExcel(ctes);
    }
  };

  const filteredCtes = ctes.filter(cte => 
    cte.remetente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cte.numeroCTe?.includes(searchTerm) ||
    cte.chaveAcesso?.includes(searchTerm)
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Arquivos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os CT-es processados em {getMonthName(currentDate.month)} de {currentDate.year}
          </p>
        </div>
        <Button 
          onClick={handleDownloadExcel} 
          disabled={ctes.length === 0}
          className="gap-2 shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Baixar Excel Atualizado
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Arquivos Processados
                <Badge variant="secondary" className="ml-2">
                  {ctes.length} total
                </Badge>
              </CardTitle>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por número, chave ou remetente..." 
                  className="pl-9 bg-background/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 overflow-hidden bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/30">
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Remetente</TableHead>
                    <TableHead>Valor Carga</TableHead>
                    <TableHead>NF-e</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredCtes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 opacity-20" />
                          <p>Nenhum arquivo encontrado.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCtes.map((cte, index) => (
                      <TableRow key={cte.chaveAcesso || index} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-foreground/80">{cte.dataEmissao}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {cte.numeroCTe}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={cte.remetente}>
                          {cte.remetente}
                        </TableCell>
                        <TableCell>
                          {cte.valorTotalCarga ? `R$ ${cte.valorTotalCarga}` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {cte.nfe ? cte.nfe.split(',')[0] + (cte.nfe.split(',').length > 1 ? ` (+${cte.nfe.split(',').length - 1})` : '') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir CT-e?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso removerá o CT-e {cte.numeroCTe} do banco de dados e da planilha do mês atual.
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(cte.chaveAcesso)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Mostrando {filteredCtes.length} de {ctes.length} registros
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;
