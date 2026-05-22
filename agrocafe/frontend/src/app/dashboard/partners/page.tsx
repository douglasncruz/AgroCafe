"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Users, Receipt, HandCoins, Trash2, Edit2, History, X, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useHarvest } from "@/context/HarvestContext";

export default function PartnersPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const [settlement, setSettlement] = useState<any>(null);
  
  const { harvests, selectedHarvest } = useHarvest();
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Statement Modal State
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [share, setShare] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

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
      
      let settlementUrl = `/partners/settlement?farmId=${farmId}`;
      if (selectedHarvest) {
        settlementUrl += `&harvestId=${selectedHarvest.id}`;
      }
      
      const sData = await api.get(settlementUrl, token);
      setSettlement(sData);
    } catch (err) {
      toast.error("Erro ao carregar dados da fazenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHarvest]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    setLoading(true);
    const token = localStorage.getItem("@AgroCafe:token");
    if(token) loadFarmData(id, token);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const payload = {
        name,
        share_percentage: Number(share),
        is_active: isActive,
        contact_info: contactInfo,
        notes,
        farmId: selectedFarmId
      };

      if (editingId) {
        await api.put(`/partners/${editingId}`, payload, token || "");
        toast.success("Sócio atualizado com sucesso!");
      } else {
        await api.post('/partners', payload, token || "");
        toast.success("Sócio adicionado!");
      }
      setIsModalOpen(false);
      resetForm();
      loadFarmData(selectedFarmId, token || "");
    } catch (err) {
      toast.error("Erro ao salvar sócio.");
    } finally {
      setSaving(false);
    }
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setShare(p.share_percentage);
    setIsActive(p.is_active);
    setContactInfo(p.contact_info || "");
    setNotes(p.notes || "");
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setShare("");
    setIsActive(true);
    setContactInfo("");
    setNotes("");
  };

  const viewStatement = async (partnerId: string) => {
    setStatementModalOpen(true);
    setLoadingStatement(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      let url = `/partners/${partnerId}/statement`;
      if (selectedHarvest) {
        url += `?harvestId=${selectedHarvest.id}`;
      }
      const data = await api.get(url, token || "");
      setStatementData(data);
    } catch (err) {
      toast.error("Erro ao carregar extrato.");
      setStatementModalOpen(false);
    } finally {
      setLoadingStatement(false);
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
                <Button variant="outline" size="sm" onClick={openNewModal}>
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
                    <div key={p.id} className="flex flex-col p-4 bg-white rounded-xl border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                            {!p.is_active && (
                              <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-slate-100 text-slate-500">Inativo</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Participação: <span className="font-semibold text-farm-600">{p.share_percentage}%</span></p>
                          {p.contact_info && <p className="text-xs text-slate-400 mt-0.5">{p.contact_info}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => viewStatement(p.id)} title="Extrato Financeiro" className="p-2 text-slate-400 hover:text-farm-600 hover:bg-farm-50 rounded-md">
                            <History className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - SETTLEMENT PANEL */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Relatório de Acerto {selectedHarvest ? `- ${selectedHarvest.name}` : ''}
              </h3>
              
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

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800 mb-6">
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

                  <h4 className="font-bold text-md text-slate-900 dark:text-white mt-6 mb-3">Análise de Desembolso (Despesas)</h4>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-4">Sócio</th>
                          <th className="px-6 py-4 text-right">Deveria Pagar</th>
                          <th className="px-6 py-4 text-right">Pagou de Fato</th>
                          <th className="px-6 py-4 text-right">Diferença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlement.settlement.map((s: any, idx: number) => {
                          const expectedPayment = settlement.totalExpenses * (s.percentage / 100);
                          const difference = (s.paid || 0) - expectedPayment;
                          return (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                {s.name} <span className="text-xs text-slate-400 font-normal">({s.percentage}%)</span>
                              </td>
                              <td className="px-6 py-4 text-right text-slate-600">
                                {formatCurrency(expectedPayment)}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-600">
                                {formatCurrency(s.paid || 0)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold">
                                {difference > 0 ? (
                                  <span className="text-green-600">
                                    Pagou a mais: {formatCurrency(difference)}
                                  </span>
                                ) : difference < 0 ? (
                                  <span className="text-red-600">
                                    Pagou a menos: {formatCurrency(Math.abs(difference))}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Na medida exata</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingId ? "Editar Sócio" : "Novo Sócio"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nome do Sócio *</Label>
                  <Input required placeholder="Ex: João da Silva" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Participação (%) *</Label>
                  <Input type="number" step="0.1" required placeholder="Ex: 50" value={share} onChange={e => setShare(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:bg-slate-900 dark:border-slate-800"
                    value={isActive ? "true" : "false"}
                    onChange={e => setIsActive(e.target.value === "true")}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Informações de Contato</Label>
                <Input placeholder="Telefone ou Email" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <textarea 
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:bg-slate-900 dark:border-slate-800"
                  rows={3} 
                  placeholder="Informações adicionais..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Salvando..." : (editingId ? "Salvar" : "Adicionar")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {statementModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95dvh] sm:max-h-[90dvh] flex flex-col animate-scale-in border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-farm-600" />
                  Extrato Financeiro
                </h3>
                {statementData && (
                  <p className="text-sm text-slate-500 mt-1">Sócio: <span className="font-semibold text-slate-900 dark:text-white">{statementData.partner.name}</span></p>
                )}
              </div>
              <button onClick={() => setStatementModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingStatement ? (
                <div className="flex py-20 items-center justify-center"><Loader2 className="animate-spin text-farm-600 h-8 w-8" /></div>
              ) : statementData ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <p className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500"/> Total Recebido</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(statementData.totalReceived)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <p className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1"><TrendingDown className="h-4 w-4 text-red-500"/> Total Pago</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(statementData.totalPaid)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <p className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1"><HandCoins className="h-4 w-4 text-farm-500"/> Saldo em Mãos</p>
                      <p className={`text-xl font-bold mt-1 ${statementData.netCash > 0 ? 'text-green-600' : statementData.netCash < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {formatCurrency(statementData.netCash)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Data</th>
                          <th className="px-4 py-3 text-left">Descrição</th>
                          <th className="px-4 py-3 text-left">Safra</th>
                          <th className="px-4 py-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {statementData.statement.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhuma movimentação encontrada.</td></tr>
                        ) : (
                          statementData.statement.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {new Date(s.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-900 dark:text-white">{s.description}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.category}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {s.harvest}
                              </td>
                              <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${s.type === 'revenue' ? 'text-green-600' : 'text-red-500'}`}>
                                {s.type === 'revenue' ? '+' : '-'}{formatCurrency(s.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
