"use client";

import { useEffect, useState } from "react";
import { Loader2, BarChart3, Printer, PieChart as PieIcon, FileSpreadsheet, TrendingUp, TrendingDown, Wheat, ArrowRightLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useHarvest } from "@/context/HarvestContext";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";

export default function ReportsPage() {
  const { harvests, selectedHarvest } = useHarvest();
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedHarvestId, setSelectedHarvestId] = useState("");
  const [compareHarvestId, setCompareHarvestId] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompare, setShowCompare] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const loadInitial = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      const farmData = await api.get("/farms", token);
      setFarms(farmData);

      if (selectedHarvest) {
        setSelectedHarvestId(selectedHarvest.id);
        await fetchHarvestReport(selectedHarvest.id, token);
      }
      if (farmData.length > 0) {
        const evo = await api.get(`/reports/evolution/${farmData[0].id}`, token);
        setEvolutionData(evo);
      }
    } catch { toast.error("Erro ao carregar dados."); }
    finally { setLoading(false); }
  };

  const fetchHarvestReport = async (hId: string, token: string) => {
    setLoading(true);
    try {
      const data = await api.get(`/reports/harvest/${hId}`, token);
      setReportData(data);
    } catch { toast.error("Erro ao gerar relatório."); }
    finally { setLoading(false); }
  };

  const fetchCompare = async () => {
    if (!selectedHarvestId || !compareHarvestId) return;
    const token = localStorage.getItem("@AgroCafe:token");
    if (!token) return;
    try {
      const data = await api.get(`/reports/compare?harvest1=${compareHarvestId}&harvest2=${selectedHarvestId}`, token);
      setCompareData(data);
    } catch { toast.error("Erro ao comparar safras."); }
  };

  useEffect(() => { loadInitial(); }, []);

  const handleFilter = () => {
    const token = localStorage.getItem("@AgroCafe:token");
    if (token && selectedHarvestId) fetchHarvestReport(selectedHarvestId, token);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    let csvContent = "\uFEFF"; // BOM for Excel encoding support
    csvContent += `DEMONSTRATIVO DE RESULTADO (DRE) - ${reportData.farmDetails.name}\n`;
    csvContent += `Propriedade;${reportData.farmDetails.name?.split(" ")[0] || ""}\n`;
    csvContent += `Safra;${reportData.farmDetails.name || ""}\n`;
    csvContent += `Status;${reportData.farmDetails.status || ""}\n`;
    csvContent += `Data de Emissão;${new Date().toLocaleString("pt-BR")}\n\n`;

    csvContent += `INDICADORES DRE\n`;
    csvContent += `Rubrica;Valor (BRL)\n`;
    csvContent += `(=) Receita Bruta Total;${reportData.dre.grossRevenue.toFixed(2)}\n`;
    csvContent += `Insumos e Fertilizantes;${reportData.dre.directCosts.insumos.toFixed(2)}\n`;
    csvContent += `Mão de Obra;${reportData.dre.directCosts.mao_de_obra.toFixed(2)}\n`;
    csvContent += `Manutenção de Maquinário;${reportData.dre.directCosts.maquinario.toFixed(2)}\n`;
    csvContent += `Impostos e Taxas;${reportData.dre.directCosts.impostos_taxas.toFixed(2)}\n`;
    csvContent += `Outros Custos;${reportData.dre.directCosts.outros.toFixed(2)}\n`;
    csvContent += `(-) Total de Despesas;${reportData.dre.totalCosts.toFixed(2)}\n`;
    csvContent += `(=) Lucro / Prejuízo;${reportData.dre.netProfit.toFixed(2)}\n`;
    csvContent += `Margem (%);${reportData.dre.profitMargin.toFixed(2)}\n\n`;

    csvContent += `CUSTOS DE PRODUÇÃO & KPIS\n`;
    csvContent += `Métrica;Valor\n`;
    csvContent += `Custo por Saca;${reportData.kpi.costPerSack.toFixed(2)}\n`;
    csvContent += `Preço Médio Venda;${reportData.kpi.averageSackPrice.toFixed(2)}\n`;
    csvContent += `Custo por Hectare;${reportData.kpi.costPerHectare.toFixed(2)}\n`;
    csvContent += `Receita por Hectare;${reportData.kpi.revenuePerHectare.toFixed(2)}\n`;
    csvContent += `Total Sacas Vendidas;${reportData.kpi.sacksSold}\n\n`;

    csvContent += `DISTRIBUIÇÃO DE LUCROS (SÓCIOS)\n`;
    csvContent += `Sócio;Direito de Lucro (BRL);Saldo Físico Pago/Recebido (BRL);Saldo do Acerto (BRL)\n`;
    
    reportData.settlement.forEach((s: any) => {
      csvContent += `${s.name};${s.fairShareProfit.toFixed(2)};${s.netCashPosition.toFixed(2)};${s.balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DRE_${reportData.farmDetails.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel/CSV exportado com sucesso!");
  };

  const directCostsData = reportData ? [
    { name: "Insumos e Fertilizantes", value: Number(reportData.dre.directCosts.insumos), color: "#8b5cf6" },
    { name: "Mão de Obra", value: Number(reportData.dre.directCosts.mao_de_obra), color: "#f59e0b" },
    { name: "Manutenção de Maquinário", value: Number(reportData.dre.directCosts.maquinario), color: "#3b82f6" },
    { name: "Impostos e Taxas", value: Number(reportData.dre.directCosts.impostos_taxas), color: "#64748b" },
    { name: "Outros Custos", value: Number(reportData.dre.directCosts.outros), color: "#10b981" },
  ].filter(c => c.value > 0) : [];

  const VariationBadge = ({ value, suffix = "" }: { value: any; suffix?: string }) => {
    if (!value) return null;
    const pct = value.percentage;
    const isPositive = pct >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(pct).toFixed(1)}%{suffix}
      </span>
    );
  };

  if (loading && !reportData) {
    return <div className="flex h-full items-center justify-center mt-20"><Loader2 className="animate-spin text-farm-600 h-10 w-10" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-farm-600 h-6 w-6" /> Relatório DRE por Safra
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Demonstrativo de Resultado e Custos de Produção</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto bg-white p-3 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <select className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm dark:bg-slate-800 dark:border-slate-700" value={selectedHarvestId} onChange={e => setSelectedHarvestId(e.target.value)}>
            <option value="" disabled>Selecione a Safra</option>
            {harvests.map(h => <option key={h.id} value={h.id}>{h.name} ({h.status})</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={handleFilter} disabled={loading || !selectedHarvestId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!reportData}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel/CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCompare(!showCompare)} className="ml-auto">
            <ArrowRightLeft className="h-4 w-4 mr-1" /> Comparar
          </Button>
        </div>
      </div>

      {/* COMPARATIVO SELECTOR */}
      {showCompare && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl print:hidden">
          <Wheat className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Comparar com:</span>
          <select className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-sm dark:bg-slate-800 dark:border-slate-700" value={compareHarvestId} onChange={e => setCompareHarvestId(e.target.value)}>
            <option value="" disabled>Safra anterior...</option>
            {harvests.filter(h => h.id !== selectedHarvestId).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={fetchCompare} disabled={!compareHarvestId}>Comparar</Button>
        </div>
      )}

      {/* EVOLUÇÃO MULTI-SAFRA */}
      {evolutionData.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 print:hidden">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-farm-600" /> Evolução Financeira por Safra
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {evolutionData.map((s, i) => (
              <div key={s.id} className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedHarvestId === s.id ? "border-farm-500 bg-farm-50 dark:bg-farm-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"}`}
                onClick={() => { setSelectedHarvestId(s.id); const t = localStorage.getItem("@AgroCafe:token"); if(t) fetchHarvestReport(s.id, t); }}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.name}</p>
                <p className={`text-lg font-bold ${s.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(s.netProfit)}</p>
                <p className="text-xs text-slate-400 mt-1">{s.totalSacks} sacas</p>
                <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${s.status === "Aberta" ? "bg-green-100 text-green-700" : s.status === "Encerrada" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPARATIVO SIDE-BY-SIDE */}
      {compareData && showCompare && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden print:hidden animate-scale-in">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" /> Comparativo: {compareData.harvest1.farmDetails.name} × {compareData.harvest2.farmDetails.name}
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Indicador</th>
                    <th className="px-4 py-3 text-right">{compareData.harvest1.farmDetails.name}</th>
                    <th className="px-4 py-3 text-right">{compareData.harvest2.farmDetails.name}</th>
                    <th className="px-4 py-3 text-center">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Receita Bruta", k: "grossRevenue", v1: compareData.harvest1.dre.grossRevenue, v2: compareData.harvest2.dre.grossRevenue },
                    { label: "Custo Total", k: "totalCosts", v1: compareData.harvest1.dre.totalCosts, v2: compareData.harvest2.dre.totalCosts },
                    { label: "Lucro Líquido", k: "netProfit", v1: compareData.harvest1.dre.netProfit, v2: compareData.harvest2.dre.netProfit },
                    { label: "Sacas Vendidas", k: "sacksSold", v1: compareData.harvest1.kpi.sacksSold, v2: compareData.harvest2.kpi.sacksSold },
                    { label: "Custo por Saca", k: "costPerSack", v1: compareData.harvest1.kpi.costPerSack, v2: compareData.harvest2.kpi.costPerSack },
                    { label: "Preço Médio Venda", k: "averageSackPrice", v1: compareData.harvest1.kpi.averageSackPrice, v2: compareData.harvest2.kpi.averageSackPrice },
                  ].map(row => (
                    <tr key={row.k} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.label}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{row.k === "sacksSold" ? row.v1 : formatCurrency(row.v1)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{row.k === "sacksSold" ? row.v2 : formatCurrency(row.v2)}</td>
                      <td className="px-4 py-3 text-center">
                        <VariationBadge value={compareData.variation[row.k as keyof typeof compareData.variation]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Comparativo Gráfico */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 h-[300px] flex flex-col justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 text-center">Evolução de Valores de Safra (R$)</p>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    {
                      name: "Receita Bruta",
                      [compareData.harvest1.farmDetails.name]: compareData.harvest1.dre.grossRevenue,
                      [compareData.harvest2.farmDetails.name]: compareData.harvest2.dre.grossRevenue,
                    },
                    {
                      name: "Custo Total",
                      [compareData.harvest1.farmDetails.name]: compareData.harvest1.dre.totalCosts,
                      [compareData.harvest2.farmDetails.name]: compareData.harvest2.dre.totalCosts,
                    },
                    {
                      name: "Lucro Líquido",
                      [compareData.harvest1.farmDetails.name]: compareData.harvest1.dre.netProfit,
                      [compareData.harvest2.farmDetails.name]: compareData.harvest2.dre.netProfit,
                    },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey={compareData.harvest1.farmDetails.name} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={compareData.harvest2.farmDetails.name} fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRE PRINCIPAL */}
      {reportData ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 print:shadow-none print:border-none">
          <div className="p-8 border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-white">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white print:text-black">DRE — Demonstrativo de Resultado</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Safra: <span className="font-semibold text-farm-600">{reportData.farmDetails.name}</span> | Propriedade: <span className="font-semibold text-slate-900 dark:text-white print:text-black">{reportData.farmDetails.name?.split(" ")[0] || "—"}</span>
              {reportData.farmDetails.status && <span className={`ml-2 text-sm px-2 py-0.5 rounded-full ${reportData.farmDetails.status === "Aberta" ? "bg-green-100 text-green-700" : reportData.farmDetails.status === "Encerrada" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{reportData.farmDetails.status}</span>}
            </p>
          </div>

          <div className="p-8 grid gap-8 md:grid-cols-2">
            {/* Left Column: DRE + Partners */}
            <div className="space-y-8">
              {/* DRE */}
              <div>
                <h3 className="font-bold text-lg border-b-2 border-slate-200 pb-2 mb-4 text-slate-900 dark:text-white flex items-center gap-2 print:text-black">
                  <PieIcon className="h-5 w-5 text-farm-600" /> Demonstrativo (DRE)
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-green-700 dark:text-green-400 text-lg">(=) Receita Bruta Total</span>
                    <span className="font-bold text-xl text-green-700 dark:text-green-400">{formatCurrency(reportData.dre.grossRevenue)}</span>
                  </div>
                  <div className="pt-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">(-) Custos Operacionais Diretos</span>
                    {[
                      ["Insumos e Fertilizantes", reportData.dre.directCosts.insumos],
                      ["Mão de Obra", reportData.dre.directCosts.mao_de_obra],
                      ["Manutenção de Maquinário", reportData.dre.directCosts.maquinario],
                      ["Impostos e Taxas", reportData.dre.directCosts.impostos_taxas],
                      ["Outros Custos", reportData.dre.directCosts.outros],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between pl-4 text-slate-600 dark:text-slate-400 text-sm">
                        <span>{label as string}</span><span>{formatCurrency(val as number)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-red-600">(=) Total de Despesas</span>
                    <span className="font-bold text-red-600">{formatCurrency(reportData.dre.totalCosts)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white text-xl">(=) Lucro / Prejuízo</span>
                    <span className={`font-bold text-2xl ${reportData.dre.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(reportData.dre.netProfit)}</span>
                  </div>
                  <div className="text-right text-sm text-slate-500">Margem: <span className="font-bold">{reportData.dre.profitMargin.toFixed(2)}%</span></div>
                </div>
              </div>

              {/* Sócios */}
              <div>
                <h3 className="font-bold text-lg border-b-2 border-slate-200 pb-2 mb-4 text-slate-900 dark:text-white">Distribuição de Lucros (Sócios)</h3>
                {reportData.settlement.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum sócio cadastrado.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Sócio</th>
                          <th className="px-4 py-2 text-right">Direito</th>
                          <th className="px-4 py-2 text-right">Saldo</th>
                          <th className="px-4 py-2 text-right">Receber/Pagar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.settlement.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="px-4 py-2 font-medium">{s.name}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(s.fairShareProfit)}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(s.netCashPosition)}</td>
                            <td className={`px-4 py-2 text-right font-bold ${s.balance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(s.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: KPIs + Cost PieChart */}
            <div className="space-y-8">
              {/* KPIs */}
              <div>
                <h3 className="font-bold text-lg border-b-2 border-slate-200 pb-2 mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-farm-600" /> Custos de Produção
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Custo/Saca", value: formatCurrency(reportData.kpi.costPerSack), sub: `${reportData.kpi.sacksSold} scs` },
                    { label: "Preço Méd. Venda", value: formatCurrency(reportData.kpi.averageSackPrice), sub: "Receita/Sacas", green: true },
                    { label: "Custo/Hectare", value: formatCurrency(reportData.kpi.costPerHectare), sub: `${reportData.farmDetails.area} ha` },
                    { label: "Receita/Hectare", value: formatCurrency(reportData.kpi.revenuePerHectare), sub: `${reportData.farmDetails.area} ha`, green: true },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-slate-50 p-4 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{kpi.label}</p>
                      <p className={`text-xl font-bold ${kpi.green ? "text-green-600" : "text-slate-900 dark:text-white"}`}>{kpi.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico de Distribuição de Custos */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center print:hidden">
                <p className="text-sm font-semibold uppercase tracking-wider mb-4 text-slate-500">Distribuição de Custos</p>
                {directCostsData.length > 0 ? (
                  <div className="h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={directCostsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {directCostsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Sem despesas registradas.</p>
                )}
                {/* Legenda */}
                <div className="mt-4 w-full grid grid-cols-2 gap-2 text-xs">
                  {directCostsData.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate text-slate-600 dark:text-slate-400" title={c.name}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            Gerado pelo AgroCerradoCafé | {new Date().toLocaleString("pt-BR")}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
          <Wheat className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>Selecione uma safra acima para gerar o relatório DRE.</p>
        </div>
      )}
    </div>
  );
}
