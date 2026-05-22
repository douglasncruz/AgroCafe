"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  ShieldCheck,
  Wheat,
  AlertTriangle,
  X,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHarvest } from "@/context/HarvestContext";
import ChatWidget from "@/components/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { farms, selectedFarm, selectFarm, harvests, selectedHarvest, selectHarvest, hasOpenHarvest } = useHarvest();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("@AgroCafe:user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore parse errors */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("@AgroCafe:user");
    localStorage.removeItem("@AgroCafe:token");
    router.push("/login");
  };

  const isAdmin = user?.email === 'admin@agrocerradocafe.com.br';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    { title: "Painel 360°", href: "/dashboard", tags: ["inicio", "home", "dashboard"] },
    { title: "Safras", href: "/dashboard/harvests", tags: ["safras", "ciclos", "anos"] },
    { title: "Meus Talhões", href: "/dashboard/plots", tags: ["fazendas", "talhoes", "areas"] },
    { title: "Defensivos & Receitas", href: "/dashboard/agrochemicals", tags: ["venenos", "defensivos", "agronomico", "receitas"] },
    { title: "Receitas (Vendas)", href: "/dashboard/revenues", tags: ["vendas", "cafe", "receitas", "dinheiro"] },
    { title: "Despesas & Custos", href: "/dashboard/expenses", tags: ["custos", "compras", "despesas", "pagar"] },
    { title: "Maquinário & Frota", href: "/dashboard/machines", tags: ["trator", "manutencao", "frota", "maquinas"] },
    { title: "Sócios & Acertos", href: "/dashboard/partners", tags: ["socios", "acerto", "divisao"] },
    { title: "Relatórios (DRE)", href: "/dashboard/reports", tags: ["dre", "relatorio", "lucro", "resultado"] },
  ];

  const searchResults = menuItems.filter(item => 
    searchQuery && (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
    )
  );

  const handleSearchNav = (href: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(href);
  };

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
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className={`h-5 w-5 ${isActive ? "" : "opacity-70"}`} /> 
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex selection:bg-farm-200 selection:text-farm-900">
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed md:sticky top-0 h-[100dvh] flex flex-col w-72 border-r border-slate-200/60 bg-white/60 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60 z-40 transition-transform duration-300 print:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <Image src="/Logo-agrocafe.png" alt="AgroCafé logo" width={40} height={40} className="rounded-lg shadow-lg" />
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-coffee-600 dark:text-coffee-400">Cerrado</span><span className="text-farm-600 dark:text-farm-500">Café</span>
            </span>
          </div>
        </div>

        {/* Navigation Grouped */}
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Section: Visão Geral */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Visão Geral</p>
            <NavItem href="/dashboard" icon={LayoutDashboard}>Painel 360°</NavItem>
            <NavItem href="/dashboard/harvests" icon={Wheat} activeColor="text-farm-700 bg-farm-50 dark:bg-farm-900/20 dark:text-farm-400">Safras</NavItem>
            <NavItem href="/dashboard/plots" icon={Map} activeColor="text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500">Meus Talhões</NavItem>
            <NavItem href="/dashboard/agrochemicals" icon={FlaskConical} activeColor="text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400">Defensivos & Receitas</NavItem>
          </div>

          {/* Section: Gestão Financeira */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Finanças & Ativos</p>
            <NavItem href="/dashboard/revenues" icon={TrendingUp} activeColor="text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400">Receitas (Vendas)</NavItem>
            <NavItem href="/dashboard/expenses" icon={TrendingDown} activeColor="text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400">Despesas & Custos</NavItem>
            <NavItem href="/dashboard/machines" icon={Settings} activeColor="text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-white">Maquinário & Frota</NavItem>
            <NavItem href="/dashboard/stock" icon={Package} activeColor="text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400">Controle de Estoque</NavItem>
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
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-farm-500 to-coffee-600 flex items-center justify-center text-white font-bold shadow-md text-sm">
              {user ? getInitials(user.name) : "??"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || "Carregando..."}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
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
      <div className="flex-1 flex flex-col min-w-0 max-h-[100dvh] overflow-hidden">
        
        {/* Sleek Topbar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden -ml-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-farm-500/50 focus-within:border-farm-500 transition-all w-64 lg:w-96 relative">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar páginas, módulos..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              />
              
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <p className="px-4 py-1 text-xs font-bold text-slate-400 uppercase">Ir para:</p>
                      {searchResults.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearchNav(item.href)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Nenhum módulo encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button className="relative p-2 text-slate-400 hover:text-farm-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              {!hasOpenHarvest && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-950"></span>
              )}
            </button>
            {/* Farm Selector */}
            {farms.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <Map className="h-4 w-4 text-slate-400" />
                  <span className="hidden sm:inline">{selectedFarm ? selectedFarm.name : "Selecione a Fazenda"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 animate-fade-in">
                  {farms.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFarm(f.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                        selectedFarm?.id === f.id ? "font-bold text-farm-600" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span>{f.name}</span>
                      {selectedFarm?.id === f.id && <span className="text-farm-600">✓</span>}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    <Link
                      href="/dashboard/plots"
                      className="block px-4 py-2 text-sm text-farm-600 dark:text-farm-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Gerenciar Fazendas →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Harvest Selector */}
            <div className="relative group">
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                selectedHarvest || hasOpenHarvest
                  ? "bg-farm-50 text-farm-700 dark:bg-farm-900/20 dark:text-farm-400 border-farm-200 dark:border-farm-800 hover:bg-farm-100"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100"
              }`}>
                <Wheat className="h-4 w-4" />
                <span className="hidden sm:inline">{selectedHarvest ? selectedHarvest.name : (harvests.length > 0 ? "Todas as Safras" : "Sem Safra")}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
                {harvests.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Nenhuma safra criada.
                    <Link href="/dashboard/harvests" className="block mt-1 text-farm-600 font-medium hover:underline">
                      Criar safra →
                    </Link>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => selectHarvest('all')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                        selectedHarvest === null ? "font-bold text-farm-600" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span>Todas as Safras</span>
                      {selectedHarvest === null && <span className="text-farm-600">✓</span>}
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                    {harvests.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => selectHarvest(h.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                          selectedHarvest?.id === h.id ? "font-bold text-farm-600" : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span>{h.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          h.status === 'Aberta' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                          h.status === 'Encerrada' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                          {h.status === 'Aberta' ? '●' : h.status === 'Encerrada' ? '🔒' : '📦'}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <Link
                        href="/dashboard/harvests"
                        className="block px-4 py-2 text-sm text-farm-600 dark:text-farm-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Gerenciar safras →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Alert: No open harvest */}
        {!hasOpenHarvest && !alertDismissed && harvests.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800 px-6 lg:px-10 py-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                <strong>Atenção:</strong> Não existe safra aberta. Lançamentos de despesas e receitas estão bloqueados.{" "}
                <Link href="/dashboard/harvests" className="underline font-bold hover:text-amber-900">
                  Abrir nova safra →
                </Link>
              </p>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="text-amber-600 hover:text-amber-800 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Content with custom scrollbar */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
