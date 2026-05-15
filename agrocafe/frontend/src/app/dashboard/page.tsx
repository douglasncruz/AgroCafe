"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Sprout, TrendingDown, TrendingUp, Wallet, Loader2, Tractor, Wheat } from "lucide-react";
import { api } from "@/services/api";
import { useHarvest } from "@/context/HarvestContext";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedHarvest } = useHarvest();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = localStorage.getItem("@AgroCafe:token");
        if (!token) return;
        
        const url = selectedHarvest 
          ? `/dashboard/summary?harvestId=${selectedHarvest.id}` 
          : '/dashboard/summary';
          
        const summary = await api.get(url, token);
        setData(summary);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedHarvest]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center mt-32 text-farm-600">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Carregando Visão 360°...</p>
      </div>
    );
  }

  if (!data) return <div className="text-center mt-10">Não foi possível carregar os dados reais. Verifique se o servidor está rodando.</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const avgPrice = data.totalSacas > 0 ? data.totalReceitas / data.totalSacas : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Seletor de Safra no Topo do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel 360°</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {selectedHarvest ? `Análise consolidada da ${selectedHarvest.name}` : "Selecione uma safra para analisar"}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {harvests.map((h) => (
            <button
              key={h.id}
              onClick={() => selectHarvest(h.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedHarvest?.id === h.id
                  ? "bg-farm-600 text-white shadow-lg shadow-farm-600/20 scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Primeiros 4 Cards Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Receitas</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalReceitas)}</h2>
            <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Vendas de café
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Despesas</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalDespesas)}</h2>
            <p className="text-xs text-red-600 flex items-center mt-1 font-medium">
              <ArrowDownRight className="h-3 w-3 mr-1" /> Custos + Manutenção
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lucro Líquido</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-coffee-50 dark:bg-coffee-900/20">
              <Wallet className="h-5 w-5 text-coffee-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.lucroEstimado)}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
              Caixa livre gerado
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sacas Vendidas</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Wheat className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalSacas} scs</h2>
            <p className="text-xs text-amber-600 flex items-center mt-1 font-medium">
              Preço Médio: {formatCurrency(avgPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Row secundária de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-md text-white flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400 font-medium">Maquinários & Frota</p>
            <h2 className="text-3xl font-bold mt-1">{data.machinesCount} <span className="text-lg font-normal text-slate-400">ativos registrados</span></h2>
          </div>
          <Tractor className="h-12 w-12 text-slate-600 opacity-50" />
        </div>
        <div className="rounded-xl bg-gradient-to-br from-farm-600 to-farm-700 p-6 shadow-md text-white flex justify-between items-center">
          <div>
            <p className="text-sm text-farm-200 font-medium">Custo Médio por Hectare</p>
            <h2 className="text-3xl font-bold mt-1">{formatCurrency(data.custoPorHectare)}</h2>
          </div>
          <Sprout className="h-12 w-12 text-farm-800 opacity-50" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* Cashflow Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fluxo de Caixa Geral</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Comparativo Mensal (Entradas vs Saídas)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-slate-500" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-slate-500" tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                <Tooltip formatter={((value: any) => formatCurrency(Number(value || 0))) as any} />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorReceitas)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Centros de Custos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Distribuição entre Fazendas e Manutenções</p>
          </div>
          <div className="h-[240px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.expensesByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={((value: any) => formatCurrency(Number(value || 0))) as any} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-2">
            {data.expensesByCategory.map((category: any) => (
              <div key={category.name} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={category.name}>{category.name}</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatCurrency(category.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visão de Sociedade (Bar Chart) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Balanço Físico dos Sócios</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostra quem reteve dinheiro no bolso (Positivo) e quem pagou do próprio bolso (Negativo).
            </p>
          </div>
          <div className="h-[300px] w-full">
            {data.partnerSplit && data.partnerSplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.partnerSplit} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$ ${val/1000}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={((value: any) => formatCurrency(Number(value || 0))) as any} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" name="Saldo Físico (R$)" radius={[4, 4, 4, 4]}>
                    {data.partnerSplit.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#16a34a' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-lg dark:border-slate-800">
                Ainda não há dados financeiros vinculados a sócios.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
