"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, TrendingUp, Search, FileText, UserCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function RevenuesPage() {
  const [revenues, setRevenues] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [sacksSold, setSacksSold] = useState("");
  const [pricePerSack, setPricePerSack] = useState("");
  const [date, setDate] = useState("");
  const [farmId, setFarmId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const totalValueCalc = (Number(sacksSold) || 0) * (Number(pricePerSack) || 0);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const [revData, farmData] = await Promise.all([
        api.get('/revenues', token),
        api.get('/farms', token)
      ]);
      setRevenues(revData);
      setFarms(farmData);
      if (farmData.length > 0) setFarmId(farmData[0].id);
    } catch (err) {
      toast.error("Erro ao carregar receitas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, info: string) => {
    if (!confirm(`Deseja realmente apagar a venda de ${info}?`)) return;
    
    setDeletingId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/revenues/${id}`, token || "");
      toast.success("Venda apagada com sucesso!");
      loadData();
    } catch (err: any) {
      toast.error("Erro ao apagar venda.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      
      const formData = new FormData();
      formData.append('sacks_sold', sacksSold);
      formData.append('price_per_sack', pricePerSack);
      formData.append('date', date);
      formData.append('farmId', farmId);
      if (buyerName) formData.append('buyer_name', buyerName);
      if (receiptFile) formData.append('receipt', receiptFile);

      await api.postForm('/revenues', formData, token || "");
      
      toast.success("Venda cadastrada com sucesso!");
      setIsModalOpen(false);
      // Reset form
      setReceiptFile(null);
      setBuyerName("");
      setSacksSold("");
      setPricePerSack("");
      
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar receita.");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-green-600 h-6 w-6" />
              Receitas (Vendas de Café)
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Registre as vendas de sacas e acompanhe seus lucros</p>
          </div>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Venda
          </Button>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <p className="text-sm text-slate-500 font-medium">Total de Sacas Vendidas</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
               {revenues.reduce((acc, rev) => acc + Number(rev.sacks_sold), 0)} scs
             </h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <p className="text-sm text-slate-500 font-medium">Preço Médio por Saca</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
               {revenues.length > 0 
                 ? formatCurrency(revenues.reduce((acc, rev) => acc + Number(rev.price_per_sack), 0) / revenues.length)
                 : formatCurrency(0)}
             </h3>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-sm text-white">
             <p className="text-sm text-green-100 font-medium">Faturamento Total</p>
             <h3 className="text-2xl font-bold mt-1">
               {formatCurrency(revenues.reduce((acc, rev) => acc + Number(rev.total_value), 0))}
             </h3>
          </div>
        </div>

        {/* Tabela de Vendas */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9 bg-white dark:bg-slate-900" placeholder="Buscar comprador..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Comprador</th>
                  <th className="px-6 py-4 font-medium">Fazenda</th>
                  <th className="px-6 py-4 font-medium text-center">Qtd Sacas</th>
                  <th className="px-6 py-4 font-medium text-right">Preço Saca</th>
                  <th className="px-6 py-4 font-medium text-right">Valor Total</th>
                  <th className="px-6 py-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {revenues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma venda registrada.
                    </td>
                  </tr>
                ) : (
                  revenues.map((revenue) => (
                    <tr key={revenue.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {new Date(revenue.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        {revenue.buyer_name ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                            <UserCircle className="h-4 w-4 text-slate-400" />
                            {revenue.buyer_name}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Desconhecido</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {revenue.farm?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {revenue.sacks_sold}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(Number(revenue.price_per_sack))}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(Number(revenue.total_value))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {revenue.receipt_url && (
                          <a 
                            href={`http://localhost:3001${revenue.receipt_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-green-600 dark:hover:bg-slate-800 transition-colors mr-2"
                            title="Ver Nota Fiscal"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        )}
                        <button 
                          onClick={() => handleDelete(revenue.id, `${revenue.sacks_sold} sacas`)}
                          disabled={deletingId === revenue.id}
                          className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Excluir"
                        >
                          {deletingId === revenue.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nova Venda (Fora do contexto de animação para o z-index funcionar perfeito) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-green-50/50 dark:bg-green-900/10">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Registrar Venda de Café
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">×</button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="revenue-form" onSubmit={handleCreate} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sacks">Quantidade (Sacas)</Label>
                    <Input id="sacks" type="number" step="0.1" required placeholder="Ex: 100" value={sacksSold} onChange={e => setSacksSold(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Valor por Saca (R$)</Label>
                    <Input id="price" type="number" step="0.01" required placeholder="Ex: 1200.00" value={pricePerSack} onChange={e => setPricePerSack(e.target.value)} />
                  </div>
                </div>

                {/* Cálculo Dinâmico em Tempo Real */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex justify-between items-center border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-500">Valor Total Estimado:</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalValueCalc)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer">Comprador</Label>
                    <Input id="buyer" placeholder="Ex: Cooxupé" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiver">Sócio Recebedor (Conta Banco)</Label>
                    <Input id="receiver" placeholder="Ex: João" value={receiverName} onChange={e => setReceiverName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data da Venda</Label>
                    <Input id="data" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farm">Origem (Fazenda)</Label>
                    <select 
                      id="farm"
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      value={farmId}
                      onChange={e => setFarmId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      {farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label htmlFor="receipt" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Anexar Nota Fiscal (NFe)
                  </Label>
                  <Input 
                    id="receipt" 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={e => setReceiptFile(e.target.files ? e.target.files[0] : null)} 
                    className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  />
                </div>

              </form>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-slate-900/50">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" form="revenue-form" className="bg-green-600 hover:bg-green-700 text-white shadow-sm" disabled={saving}>
                  {saving ? "Salvando..." : "Confirmar Venda"}
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
