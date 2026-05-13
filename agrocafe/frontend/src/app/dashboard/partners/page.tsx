"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Users, Receipt, HandCoins, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function PartnersPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const [settlement, setSettlement] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [share, setShare] = useState("");

  const loadData = async (farmIdToLoad?: string) => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const farmData = await api.get('/farms', token);
      setFarms(farmData);
      
      const targetFarmId = farmIdToLoad || (farmData.length > 0 ? farmData[0].id : null);
      if (targetFarmId) {
        setSelectedFarmId(targetFarmId);
        await loadFarmData(targetFarmId, token);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error("Erro ao carregar dados.");
      setLoading(false);
    }
  };

  const loadFarmData = async (farmId: string, token: string) => {
    try {
      const pData = await api.get(`/partners?farmId=${farmId}`, token);
      setPartners(pData);
      const sData = await api.get(`/partners/settlement?farmId=${farmId}`, token);
      setSettlement(sData);
    } catch (err) {
      toast.error("Erro ao carregar dados da fazenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    setLoading(true);
    const token = localStorage.getItem("@AgroCafe:token");
    if(token) loadFarmData(id, token);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.post('/partners', {
        name,
        share_percentage: Number(share),
        farmId: selectedFarmId
      }, token || "");
      toast.success("Sócio adicionado!");
      setIsModalOpen(false);
      setName("");
      setShare("");
      loadFarmData(selectedFarmId, token || "");
    } catch (err) {
      toast.error("Erro ao salvar sócio.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, partnerName: string) => {
    if (!confirm(`Deseja remover o sócio ${partnerName}?`)) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/partners/${id}`, token || "");
      toast.success("Sócio removido.");
      loadFarmData(selectedFarmId, token || "");
    } catch (err) {
      toast.error("Erro ao remover sócio.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-slate-500 h-10 w-10" /></div>;
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="text-farm-600 h-6 w-6" />
              Sócios e Acerto de Contas
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie o quadro societário e visualize o balanço de acertos</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              className="flex h-10 w-full sm:w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:bg-slate-900 dark:border-slate-800"
              value={selectedFarmId}
              onChange={handleFarmChange}
            >
              {farms.length === 0 ? <option disabled>Nenhuma fazenda cadastrada</option> : null}
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        {farms.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-xl border-slate-200">
            Você precisa cadastrar uma Fazenda primeiro.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* LEFT COLUMN - PARTNERS LIST */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quadro Societário</h3>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              
              <div className="space-y-3">
                {partners.length === 0 ? (
                  <div className="p-4 text-sm text-center text-slate-500 bg-white rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    Nenhum sócio cadastrado
                  </div>
                ) : (
                  partners.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 group">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-500">Participação: <span className="font-semibold text-farm-600">{p.share_percentage}%</span></p>
                      </div>
                      <button 
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deletingId === p.id}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - SETTLEMENT PANEL */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Relatório de Acerto</h3>
              
              {settlement && partners.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Receitas</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(settlement.totalRevenues)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Despesas</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(settlement.totalExpenses)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Lucro Líquido</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(settlement.netProfit)}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-4">Sócio</th>
                          <th className="px-6 py-4 text-right">Direito (Lucro %)</th>
                          <th className="px-6 py-4 text-right">Saldo Físico (R - D)</th>
                          <th className="px-6 py-4 text-right">Acerto Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlement.settlement.map((s: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                              {s.name} <span className="text-xs text-slate-400 font-normal">({s.percentage}%)</span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">
                              {formatCurrency(s.fairShareProfit)}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">
                              {formatCurrency(s.netCashPosition)}
                              <p className="text-[10px] text-slate-400 mt-0.5">Retém no bolso</p>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">
                              {s.balance > 0 ? (
                                <span className="text-green-600 flex items-center justify-end gap-1">
                                  <HandCoins className="h-4 w-4" /> Recebe {formatCurrency(s.balance)}
                                </span>
                              ) : s.balance < 0 ? (
                                <span className="text-red-600 flex items-center justify-end gap-1">
                                  <Receipt className="h-4 w-4" /> Paga {formatCurrency(Math.abs(s.balance))}
                                </span>
                              ) : (
                                <span className="text-slate-400">Zeradão</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:border-slate-800">
                  Adicione sócios para ver o painel de acerto.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">Novo Sócio</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome do Sócio</Label>
                <Input required placeholder="Ex: João da Silva" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Participação (%)</Label>
                <Input type="number" step="0.1" required placeholder="Ex: 50" value={share} onChange={e => setShare(e.target.value)} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={saving}>Salvar Sócio</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
