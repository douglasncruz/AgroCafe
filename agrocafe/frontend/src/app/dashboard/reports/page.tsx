"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, BarChart3, Download, Printer, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function ReportsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const farmData = await api.get('/farms', token);
      setFarms(farmData);
      
      if (farmData.length > 0) {
        setSelectedFarmId(farmData[0].id);
        await fetchReport(farmData[0].id, selectedYear, token);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error("Erro ao carregar fazendas.");
      setLoading(false);
    }
  };

  const fetchReport = async (farmId: string, year: string, token: string) => {
    setLoading(true);
    try {
      const data = await api.get(`/reports/agro?farmId=${farmId}&year=${year}`, token);
      setReportData(data);
    } catch (err) {
      toast.error("Erro ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleFilterChange = () => {
    const token = localStorage.getItem("@AgroCafe:token");
    if(token && selectedFarmId) {
      fetchReport(selectedFarmId, selectedYear, token);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading && !reportData) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-farm-600 h-10 w-10" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* HEADER E FILTROS (Escondidos na Impressão) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-farm-600 h-6 w-6" />
            Relatório de Fechamento (DRE Agro)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Demonstrativo de Resultado e Custos de Produção</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto bg-white p-2 rounded-lg border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <select 
            className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none dark:bg-slate-800 dark:border-slate-700"
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
          >
            {farms.length === 0 ? <option disabled>Sem fazendas</option> : null}
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          
          <select 
            className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none dark:bg-slate-800 dark:border-slate-700"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">Safra 2026</option>
            <option value="2025">Safra 2025</option>
          </select>

          <Button variant="outline" size="sm" onClick={handleFilterChange} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Filtrar"}
          </Button>

          <Button variant="primary" size="sm" onClick={handlePrint} className="ml-2">
            <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* ÁREA DO RELATÓRIO (O que será impresso) */}
      {reportData ? (
        <div ref={printRef} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 print:shadow-none print:border-none print:dark:bg-white print:text-black">
          
          {/* TÍTULO DO RELATÓRIO */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-white">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white print:text-black">DRE Simplificado e Custos</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Propriedade: <span className="font-semibold text-slate-900 dark:text-white print:text-black">{reportData.farmDetails.name}</span> | Safra/Ano: <span className="font-semibold text-slate-900 dark:text-white print:text-black">{reportData.farmDetails.year}</span>
            </p>
          </div>

          <div className="p-8 grid gap-8 md:grid-cols-2">
            
            {/* COLUNA ESQUERDA: DRE */}
            <div>
              <h3 className="font-bold text-lg border-b-2 border-slate-200 pb-2 mb-4 text-slate-900 dark:text-white flex items-center gap-2 print:text-black">
                <PieChart className="h-5 w-5 text-farm-600" />
                Demonstrativo de Resultado (DRE)
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-green-700 dark:text-green-400 print:text-green-800 text-lg">(=) Receita Bruta Total</span>
                  <span className="font-bold text-xl text-green-700 dark:text-green-400 print:text-green-800">{formatCurrency(reportData.dre.grossRevenue)}</span>
                </div>
                
                <div className="pt-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">(-) Custos Operacionais Diretos</span>
                  
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400 text-sm print:text-slate-700">
                    <span>Insumos e Fertilizantes</span>
                    <span>{formatCurrency(reportData.dre.directCosts.insumos)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400 text-sm print:text-slate-700">
                    <span>Mão de Obra</span>
                    <span>{formatCurrency(reportData.dre.directCosts.mao_de_obra)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400 text-sm print:text-slate-700">
                    <span>Manutenção de Maquinário</span>
                    <span>{formatCurrency(reportData.dre.directCosts.maquinario)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400 text-sm print:text-slate-700">
                    <span>Impostos e Taxas</span>
                    <span>{formatCurrency(reportData.dre.directCosts.impostos_taxas)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400 text-sm print:text-slate-700">
                    <span>Outros Custos</span>
                    <span>{formatCurrency(reportData.dre.directCosts.outros)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-red-600 print:text-red-800">(=) Total de Despesas</span>
                  <span className="font-bold text-red-600 print:text-red-800">{formatCurrency(reportData.dre.totalCosts)}</span>
                </div>

                <div className="flex justify-between items-end pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white print:text-black text-xl">(=) Lucro / Prejuízo Líquido</span>
                  <span className={`font-bold text-2xl ${reportData.dre.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.dre.netProfit)}
                  </span>
                </div>
                <div className="text-right text-sm text-slate-500">
                  Margem de Lucro: <span className="font-bold">{reportData.dre.profitMargin.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: KPIs e SOCIEDADE */}
            <div className="space-y-8">
              
              {/* KPIs de Produção */}
              <div>
                <h3 className="font-bold text-lg border-b-2 border-slate-200 pb-2 mb-4 text-slate-900 dark:text-white flex items-center gap-2 print:text-black">
                  <BarChart3 className="h-5 w-5 text-farm-600" />
                  Custos de Produção (KPIs)
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 print:border-slate-300">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Custo por Saca</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white print:text-black">{formatCurrency(reportData.kpi.costPerSack)}</p>
                    <p className="text-xs text-slate-400 mt-1">Total {reportData.kpi.sacksSold} scs</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 print:border-slate-300">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Preço Méd. Venda</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.kpi.averageSackPrice)}</p>
                    <p className="text-xs text-slate-400 mt-1">Receita / Sacas</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 print:border-slate-300">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Custo por Hectare</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white print:text-black">{formatCurrency(reportData.kpi.costPerHectare)}</p>
                    <p className="text-xs text-slate-400 mt-1">Área {reportData.farmDetails.area} ha</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 print:border-slate-300">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Receita por Hectare</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.kpi.revenuePerHectare)}</p>
                    <p className="text-xs text-slate-400 mt-1">Área {reportData.farmDetails.area} ha</p>
                  </div>
                </div>
              </div>

              {/* Tabela de Sociedade Resumida */}
              <div>
                <h3 className="font-bold text-lg border-b-2 border-slate-200 pb-2 mb-4 text-slate-900 dark:text-white print:text-black">
                  Distribuição de Lucros (Sócios)
                </h3>
                {reportData.settlement.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum sócio cadastrado para distribuição.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden dark:border-slate-800 print:border-slate-300">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase dark:bg-slate-800 print:bg-slate-100 print:text-black">
                        <tr>
                          <th className="px-4 py-2">Sócio</th>
                          <th className="px-4 py-2 text-right">Direito (%)</th>
                          <th className="px-4 py-2 text-right">Saldo Físico</th>
                          <th className="px-4 py-2 text-right">Receber/Pagar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.settlement.map((s: any, idx: number) => (
                          <tr key={idx} className="border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
                            <td className="px-4 py-2 font-medium print:text-black">{s.name}</td>
                            <td className="px-4 py-2 text-right print:text-black">{formatCurrency(s.fairShareProfit)}</td>
                            <td className="px-4 py-2 text-right print:text-black">{formatCurrency(s.netCashPosition)}</td>
                            <td className={`px-4 py-2 text-right font-bold ${s.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(s.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 dark:bg-slate-900 dark:text-slate-600 print:text-slate-500 border-t border-slate-200 dark:border-slate-800 print:border-slate-300">
            Gerado pelo AgroCafé | {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
          Selecione uma fazenda e ano para gerar o relatório.
        </div>
      )}
    </div>
  );
}
