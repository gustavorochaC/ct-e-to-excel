import { FileText, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Sidebar = ({ darkMode, onToggleDarkMode }: SidebarProps) => {
  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r-2 border-sidebar-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-foreground bg-primary">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              CT-e para Excel
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              v1.0
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="p-4 border-t-2 border-sidebar-border">
        <Button
          variant="outline"
          onClick={onToggleDarkMode}
          className="w-full justify-center gap-2 font-medium"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4" />
              Modo Claro
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              Modo Escuro
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
