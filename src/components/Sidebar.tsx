import { FileText, Moon, Sun, ChevronLeft, ChevronRight, LayoutDashboard, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar = ({ darkMode, onToggleDarkMode, collapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out relative z-10",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="absolute -right-3 top-8">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6 rounded-full shadow-md bg-background border border-border hover:bg-muted"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="p-4 flex items-center justify-center border-b border-border/50 h-16">
        <div className="flex items-center gap-3 w-full animate-fade-in">
          <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-sm font-bold tracking-tight">
                CT-e Extractor
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                v1.2.0
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-2 px-3">
        <Button 
          variant={isActive('/') ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 relative overflow-hidden",
            collapsed && "justify-center px-0",
            !isActive('/') && "hover:bg-muted/80 text-muted-foreground"
          )}
          onClick={() => navigate('/')}
        >
          <LayoutDashboard className={cn("w-5 h-5", isActive('/') ? "text-primary" : "text-muted-foreground")} />
          {!collapsed && <span>Dashboard</span>}
          {!collapsed && isActive('/') && <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l-full" />}
        </Button>

        <Button 
          variant={isActive('/history') ? "secondary" : "ghost"} 
          className={cn(
            "w-full justify-start gap-3 relative overflow-hidden",
            collapsed && "justify-center px-0",
            !isActive('/history') && "hover:bg-muted/80 text-muted-foreground"
          )}
          onClick={() => navigate('/history')}
        >
          <FileSpreadsheet className={cn("w-5 h-5", isActive('/history') ? "text-primary" : "text-muted-foreground")} />
          {!collapsed && <span>Histórico</span>}
          {!collapsed && isActive('/history') && <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l-full" />}
        </Button>
      </div>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={onToggleDarkMode}
          className={cn(
            "w-full gap-2 font-medium transition-colors hover:bg-muted",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
          title={darkMode ? "Modo Claro" : "Modo Escuro"}
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {!collapsed && (darkMode ? "Modo Claro" : "Modo Escuro")}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
