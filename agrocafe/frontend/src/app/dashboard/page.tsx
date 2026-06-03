"use client";

import React, { useEffect, useState, Fragment } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Sprout, TrendingDown, TrendingUp, Wallet, Loader2, Tractor, Wheat, ChevronDown, FileText } from "lucide-react";
import { api } from "@/services/api";
import { useHarvest } from "@/context/HarvestContext";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("all");
  const { farms, selectedFarm, harvests, selectedHarvest, selectHarvest } = useHarvest();

  useEffect(() => {
    async function loadPartners() {
      if (!selectedFarm) {
        setPartners([]);
        setSelectedPartnerId("all");
        return;
      }
      try {
        const token = localStorage.getItem("@AgroCafe:token");
        const res = await api.get(`/partners?farmId=${selectedFarm.id}`, token || "");
        setPartners(res);
      } catch (err) {
        console.error("Erro ao carregar sócios", err);
      }
    }
    loadPartners();
  }, [selectedFarm]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token = localStorage.getItem("@AgroCafe:token");
        if (!token) return;
        
        let url = '/dashboard/summary';
        const params: string[] = [];
        if (selectedHarvest) {
          params.push(`harvestId=${selectedHarvest.id}`);
        }
        if (selectedFarm) {
          params.push(`farmId=${selectedFarm.id}`);
        }
        if (selectedPartnerId !== "all") {
          params.push(`partnerId=${selectedPartnerId}`);
        }
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
          
        const summary = await api.get(url, token);
        setData(summary);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedHarvest, selectedFarm, selectedPartnerId]);

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

  const renderHarvestSelector = () => {
    if (harvests.length === 0) {
      return (
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
          Nenhuma safra criada. <a href="/dashboard/harvests" className="underline">Criar safra →</a>
        </p>
      );
    }

    const allButton = (
      <button
        key="all"
        onClick={() => selectHarvest('all')}
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
          selectedHarvest === null
            ? "bg-farm-600 text-white shadow-lg shadow-farm-600/20 scale-105"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        }`}
      >
        Todas as Safras
        <span className="w-2 h-2 rounded-full bg-blue-400" />
      </button>
    );

    if (harvests.length < 6) {
      return (
        <div className="flex flex-wrap gap-2 items-center">
          {allButton}
          {harvests.map((h) => (
            <button
              key={h.id}
              onClick={() => selectHarvest(h.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                selectedHarvest?.id === h.id
                  ? "bg-farm-600 text-white shadow-lg shadow-farm-600/20 scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {h.name}
              <span className={`w-2 h-2 rounded-full ${
                h.status === 'Aberta' ? 'bg-green-400' : h.status === 'Encerrada' ? 'bg-amber-400' : 'bg-slate-400'
              }`} />
            </button>
          ))}
        </div>
      );
    }

    const active = harvests.filter(h => h.status === 'Aberta');
    const closed = harvests.filter(h => h.status !== 'Aberta').sort((a, b) => b.year - a.year);
    
    const quickHarvests = [
      ...active,
      ...closed.slice(0, 2)
    ];

    const otherHarvests = harvests;
    const isSelectedInQuick = quickHarvests.some(q => q.id === selectedHarvest?.id);

    return (
      <div className="flex flex-wrap gap-2 items-center">
        {allButton}
        {quickHarvests.map((h) => (
          <button
            key={h.id}
            onClick={() => selectHarvest(h.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              selectedHarvest?.id === h.id
                ? "bg-farm-600 text-white shadow-lg shadow-farm-600/20 scale-105"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            {h.name}
            <span className={`w-2 h-2 rounded-full ${
              h.status === 'Aberta' ? 'bg-green-400' : h.status === 'Encerrada' ? 'bg-amber-400' : 'bg-slate-400'
            }`} />
          </button>
        ))}

        <div className="relative">
          <select
            value={isSelectedInQuick || selectedHarvest === null ? "quick" : selectedHarvest.id}
            onChange={(e) => {
              if (e.target.value !== "quick") {
                selectHarvest(e.target.value);
              }
            }}
            className={`appearance-none pr-10 pl-4 py-2 rounded-xl text-sm font-bold border-none outline-none cursor-pointer transition-all ${
              !isSelectedInQuick && selectedHarvest !== null
                ? "bg-farm-600 text-white shadow-lg shadow-farm-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            <option value="quick" disabled>Outras Safras...</option>
            {otherHarvests.map((h) => (
              <option key={h.id} value={h.id} className="text-slate-800 dark:text-white bg-white dark:bg-slate-900">
                {h.name} ({h.status})
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-70 ${
            !isSelectedInQuick && selectedHarvest !== null ? "text-white" : "text-slate-500"
          }`} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Seletor de Safra e Sócio no Topo do Painel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel 360°</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {selectedFarm ? `Fazenda: ${selectedFarm.name}` : "Selecione uma fazenda"} 
            {selectedHarvest ? ` | Safra: ${selectedHarvest.name}` : (harvests.length > 0 ? " | Safra: Todas as Safras" : " | Sem Safra")}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {partners.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-500">Sócio:</span>
              <select 
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="all">Visão Consolidada</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          {renderHarvestSelector()}
        </div>
      </div>
      
      {/* Primeiros 4 Cards Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {data.partnerAcerto ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sua Receita ({Number(data.partnerAcerto.percentual)}%)</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.partnerAcerto.receitas)}</h2>
                <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
                  Já creditado via vendas
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sua Parte Despesas</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.partnerAcerto.parteTeoricaDespesas)}</h2>
                <p className="text-xs text-amber-600 flex items-center mt-1 font-medium">
                  Rateio ({Number(data.partnerAcerto.percentual)}% de {formatCurrency(data.partnerAcerto.totalDespesasFazenda)})
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Você Pagou</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.partnerAcerto.despesasPagas)}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                  Desembolso físico até agora
                </p>
              </div>
            </div>

            <div className={`rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${data.partnerAcerto.saldoAcerto >= 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'}`}>
              <div className="flex items-center justify-between pb-2">
                <p className={`text-sm font-medium ${data.partnerAcerto.saldoAcerto >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  Status do Acerto
                </p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${data.partnerAcerto.saldoAcerto >= 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                  {data.partnerAcerto.saldoAcerto >= 0 ? <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" /> : <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />}
                </div>
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${data.partnerAcerto.saldoAcerto >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {formatCurrency(Math.abs(data.partnerAcerto.saldoAcerto))}
                </h2>
                <p className={`text-xs flex items-center mt-1 font-medium ${data.partnerAcerto.saldoAcerto >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {data.partnerAcerto.saldoAcerto >= 0 ? 'A Receber (Pagou a mais)' : 'A Pagar (Pagou a menos)'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
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
        
        {/* Monthly Expenses Chart */}
        {(() => {
          const monthlyData = data.cashflow || data.cashflowData || [];
          const expensesOnly = monthlyData.filter((d: any) => d.despesas > 0);
          const maxExpenseMonth = expensesOnly.length > 0 ? expensesOnly.reduce((prev: any, current: any) => (prev.despesas > current.despesas) ? prev : current) : null;
          const minExpenseMonth = expensesOnly.length > 0 ? expensesOnly.reduce((prev: any, current: any) => (prev.despesas < current.despesas) ? prev : current) : null;
          
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" /> Histórico Mensal de Despesas
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sazonalidade e distribuição de gastos</p>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0">
                  {maxExpenseMonth && (
                    <div className="bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mb-0.5">Maior Gasto ({maxExpenseMonth.month})</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-500 leading-none">{formatCurrency(maxExpenseMonth.despesas)}</p>
                    </div>
                  )}
                  {minExpenseMonth && (
                    <div className="bg-green-50 dark:bg-green-900/10 px-4 py-2 rounded-xl border border-green-100 dark:border-green-900/30">
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-0.5">Menor Gasto ({minExpenseMonth.month})</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-500 leading-none">{formatCurrency(minExpenseMonth.despesas)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800/50" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-slate-500" />
                    <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-slate-500" />
                    <Tooltip formatter={((value: any) => formatCurrency(Number(value))) as any} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="despesas" name="Despesas" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((entry: any, index: number) => {
                        const isMax = maxExpenseMonth && entry.month === maxExpenseMonth.month;
                        const isMin = minExpenseMonth && entry.month === minExpenseMonth.month;
                        return <Cell key={`cell-${index}`} fill={isMax ? '#dc2626' : isMin ? '#34d399' : '#f87171'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Cashflow Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fluxo de Caixa Geral</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Comparativo Mensal (Entradas vs Saídas)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashflow || data.cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <div className="h-[240px] min-h-[240px] w-full shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
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

        {/* Expenses by Categorization */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Categorização das Despesas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Distribuição percentual por categoria</p>
          </div>
          <div className="h-[240px] min-h-[240px] w-full shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expensesByCategorization || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => percent ? `${(percent * 100).toFixed(1)}%` : ''}
                  labelLine={false}
                >
                  {(data.expensesByCategorization || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={((value: any) => formatCurrency(Number(value || 0))) as any} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-2">
            {(data.expensesByCategorization || []).map((category: any) => {
              const totalCategorization = (data.expensesByCategorization || []).reduce((acc: number, curr: any) => acc + curr.value, 0);
              const percentage = totalCategorization > 0 ? ((category.value / totalCategorization) * 100).toFixed(1) : "0.0";
              return (
                <div key={category.name} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={category.name}>{category.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(category.value)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Visão de Sociedade (Bar Chart -> Tabela) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Balanço Físico dos Sócios</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostra quem reteve dinheiro no bolso (Positivo) e quem pagou do próprio bolso (Negativo).
            </p>
          </div>
          <div className="w-full overflow-x-auto">
            {data.partnerSplit && data.partnerSplit.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Sócio</th>
                    <th className="px-4 py-3 text-left font-semibold">Mês</th>
                    <th className="px-4 py-3 text-right font-semibold">Despesas (Pagou)</th>
                    <th className="px-4 py-3 text-right font-semibold">Receitas (Reteve)</th>
                    <th className="px-4 py-3 text-right font-semibold">Consolidado (Caixa)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.partnerSplit.map((p: any) => {
                    const months = Object.entries(p.monthly || {});
                    return (
                      <React.Fragment key={p.name}>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Total Ano/Safra</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.despesas)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.receitas)}</td>
                          <td className={`px-4 py-3 text-right font-bold ${p.saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {formatCurrency(p.saldo)}
                          </td>
                        </tr>
                        {months.map(([month, mData]: any) => (
                          <tr key={`${p.name}-${month}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400">{month}</td>
                            <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-500">{formatCurrency(mData.despesas)}</td>
                            <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-500">{formatCurrency(mData.receitas)}</td>
                            <td className={`px-4 py-2 text-right font-medium ${mData.saldo >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {formatCurrency(mData.saldo)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500 border border-dashed border-slate-200 rounded-lg dark:border-slate-800">
                Ainda não há dados financeiros vinculados a sócios.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
