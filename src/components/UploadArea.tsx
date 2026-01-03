import { Upload, FileText, X } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface UploadAreaProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const UploadArea = ({ file, onFileSelect, disabled }: UploadAreaProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type === 'application/pdf') {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      onFileSelect(selectedFile);
    }
    e.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-200 bg-secondary/30
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-secondary/50 hover:border-primary active:shadow-xs'
          }
        `}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold mb-2">
          Arraste o CT-e aqui ou clique
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          Apenas arquivos PDF (máx. 10MB)
        </p>
        <input
          id="file-input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {file && (
        <div className="p-4 bg-secondary border-2 border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold truncate max-w-xs">
                {file.name}
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
            }}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            Remover
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
