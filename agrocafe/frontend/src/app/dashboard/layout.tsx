"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Map, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Settings, 
  Menu,
  Bell,
  LogOut,
  BarChart3,
  FlaskConical,
  Search,
  ChevronDown,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("@AgroCafe:user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const isAdmin = user?.email === 'admin@agrocafe.com.br';

  const NavItem = ({ href, icon: Icon, children, activeColor = "text-farm-600 bg-farm-50 dark:bg-farm-900/20 dark:text-farm-400" }: any) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive 
            ? activeColor
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? "" : "opacity-70"}`} /> 
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex selection:bg-farm-200 selection:text-farm-900">
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed md:sticky top-0 h-screen flex flex-col w-72 border-r border-slate-200/60 bg-white/60 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60 z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <Image src="/Logo-agrocafe.png" alt="AgroCafé logo" width={40} height={40} className="rounded-lg shadow-lg" />
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-farm-600 dark:text-farm-500">Café</span>
            </span>
          </div>
        </div>

        {/* Navigation Grouped */}
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Section: Visão Geral */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Visão Geral</p>
            <NavItem href="/dashboard" icon={LayoutDashboard}>Painel 360°</NavItem>
            <NavItem href="/dashboard/plots" icon={Map} activeColor="text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500">Meus Talhões</NavItem>
            <NavItem href="/dashboard/agrochemicals" icon={FlaskConical} activeColor="text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400">Defensivos & Receitas</NavItem>
          </div>

          {/* Section: Gestão Financeira */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Finanças & Ativos</p>
            <NavItem href="/dashboard/revenues" icon={TrendingUp} activeColor="text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Receitas (Vendas)</NavItem>
            <NavItem href="/dashboard/expenses" icon={TrendingDown} activeColor="text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400">Despesas & Custos</NavItem>
            <NavItem href="/dashboard/machines" icon={Settings} activeColor="text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-white">Maquinário & Frota</NavItem>
          </div>

          {/* Section: Estratégia */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Estratégia & BI</p>
            <NavItem href="/dashboard/partners" icon={Users} activeColor="text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">Sócios & Acertos</NavItem>
            <NavItem href="/dashboard/reports" icon={BarChart3} activeColor="text-farm-700 bg-farm-50 dark:bg-farm-900/20 dark:text-farm-400">Relatórios (DRE)</NavItem>
            <NavItem href="/dashboard/audit" icon={ShieldAlert} activeColor="text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400">Auditoria & Compliance</NavItem>
          </div>

          {isAdmin && (
            <div className="space-y-1">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Administração</p>
              <NavItem href="/dashboard/users" icon={ShieldCheck} activeColor="text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-white">Acessos de Usuários</NavItem>
            </div>
          )}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-2 cursor-pointer hover:border-farm-300 transition-colors">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-farm-500 to-coffee-600 flex items-center justify-center text-white font-bold shadow-md">
              PR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Produtor Rural</p>
              <p className="text-xs text-slate-500 truncate">admin@agrocafe.com.br</p>
            </div>
          </div>
          
          <button className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" />
            Sair da Plataforma
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        
        {/* Sleek Topbar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden -ml-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            {/* Search Bar (Visual Only) */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-farm-500/50 focus-within:border-farm-500 transition-all w-64 lg:w-96">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar talhões, notas ou máquinas..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button className="relative p-2 text-slate-400 hover:text-farm-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-950"></span>
            </button>
            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <span>Safra 2026</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </div>
        </header>

        {/* Page Content with custom scrollbar */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
