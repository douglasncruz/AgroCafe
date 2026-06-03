"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, ArrowDownRight, Search, FileText, UserCircle, Paperclip, Trash2, TrendingDown, ArrowUp, ArrowDown, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useHarvest } from "@/context/HarvestContext";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { harvests, selectedHarvest, hasOpenHarvest, activeOpenHarvest, selectedFarm } = useHarvest();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sorting states
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Outros");
  const [farmId, setFarmId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [harvestId, setHarvestId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const [expData, farmData] = await Promise.all([
        api.get('/expenses', token),
        api.get('/farms', token)
      ]);
      setExpenses(expData);
      setFarms(farmData);
      
      if (selectedFarm) {
        setFarmId(selectedFarm.id);
      } else if (farmData.length > 0) {
        setFarmId(farmData[0].id);
      }

      if (activeOpenHarvest) setHarvestId(activeOpenHarvest.id);
      else if (selectedHarvest) setHarvestId(selectedHarvest.id);
    } catch (err) {
      toast.error("Erro ao carregar despesas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFarm?.id, selectedHarvest?.id]);

  useEffect(() => {
    const fetchPartners = async () => {
      if (!farmId) {
        setPartners([]);
        return;
      }
      try {
        const token = localStorage.getItem("@AgroCafe:token");
        const res = await api.get(`/partners?farmId=${farmId}`, token || "");
        setPartners(res);
      } catch (err) {
        console.error("Erro ao carregar sócios", err);
      }
    };
    fetchPartners();
  }, [farmId]);

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Deseja realmente apagar a despesa "${description}"?`)) return;
    
    setDeletingId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/expenses/${id}`, token || "");
      toast.success("Despesa apagada com sucesso!");
      loadData();
    } catch (err: any) {
      toast.error("Erro ao apagar despesa.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      
      const formData = new FormData();
      formData.append('description', description);
      formData.append('amount', amount);
      formData.append('date', date);
      formData.append('category', category);
      if (farmId) formData.append('farmId', farmId);
      if (payerName) formData.append('payer_name', payerName);
      if (harvestId) formData.append('harvestId', harvestId);
      if (receiptFile) formData.append('receipt', receiptFile);

      if (editingId) {
        await api.putForm(`/expenses/${editingId}`, formData, token || "");
        toast.success("Despesa atualizada com sucesso!");
      } else {
        await api.postForm('/expenses', formData, token || "");
        toast.success("Despesa cadastrada com sucesso!");
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar despesa.");
    } finally {
      setSaving(false);
    }
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (expense: any) => {
    setEditingId(expense.id);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : "");
    setCategory(expense.category);
    setFarmId(expense.farm?.id || farms[0]?.id || "");
    setPayerName(expense.payer_name || "");
    setHarvestId(expense.harvest?.id || activeOpenHarvest?.id || selectedHarvest?.id || "");
    setReceiptFile(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setReceiptFile(null);
    setPayerName("");
    setDescription("");
    setAmount("");
    setDate("");
    setCategory("Outros");
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />;
  };

  const filteredExpenses = expenses
    .filter(exp => !selectedHarvest || exp.harvest?.id === selectedHarvest.id)
    .filter(exp => {
      if (selectedMonth === "all") return true;
      const monthIndex = exp.date.includes('-') 
        ? parseInt(exp.date.split('-')[1], 10) - 1 
        : new Date(exp.date).getUTCMonth();
      return monthIndex.toString() === selectedMonth;
    })
    .filter(exp => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        exp.description?.toLowerCase().includes(term) ||
        exp.category?.toLowerCase().includes(term) ||
        exp.payer_name?.toLowerCase().includes(term) ||
        exp.farm?.name?.toLowerCase().includes(term)
      );
    });

  const totalFilteredAmount = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const sortedExpenses = [...filteredExpenses]
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'farm') {
        aVal = a.farm?.name?.toLowerCase() || '';
        bVal = b.farm?.name?.toLowerCase() || '';
      } else if (sortField === 'amount') {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      } else if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-farm-600 h-10 w-10" /></div>;
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Controle de Despesas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie os custos e anexe comprovantes da lavoura</p>
        </div>
        <Button
          variant="primary"
          onClick={openNewModal}
          disabled={!hasOpenHarvest}
          title={!hasOpenHarvest ? 'Abra uma safra antes de lançar despesas' : ''}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-9 bg-white dark:bg-slate-900" 
                placeholder="Buscar despesa..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="p-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-farm-500 outline-none w-full sm:w-44 font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="all">Todos os Meses</option>
              <option value="0">Janeiro</option>
              <option value="1">Fevereiro</option>
              <option value="2">Março</option>
              <option value="3">Abril</option>
              <option value="4">Maio</option>
              <option value="5">Junho</option>
              <option value="6">Julho</option>
              <option value="7">Agosto</option>
              <option value="8">Setembro</option>
              <option value="9">Outubro</option>
              <option value="10">Novembro</option>
              <option value="11">Dezembro</option>
            </select>
          </div>
          
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            Total do período: <span className="text-farm-600 dark:text-farm-400 font-bold">{formatCurrency(totalFilteredAmount)}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('date')}>Data {getSortIcon('date')}</th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('description')}>Descrição {getSortIcon('description')}</th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('category')}>Categoria {getSortIcon('category')}</th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('farm')}>Fazenda {getSortIcon('farm')}</th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('payer_name')}>Pagador {getSortIcon('payer_name')}</th>
                <th className="px-6 py-4 font-medium text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('amount')}>Valor {getSortIcon('amount')}</th>
                <th className="px-6 py-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
                {sortedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center border-b border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <TrendingDown className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma despesa lançada</p>
                        <p className="text-sm mt-1">Nenhum registro encontrado para esta safra.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {expense.farm?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {expense.payer_name ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md w-fit">
                          <UserCircle className="h-3.5 w-3.5 text-slate-400" />
                          {expense.payer_name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Não inf.</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {expense.receipt_url && (
                        <a 
                          href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '')}${expense.receipt_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-2 rounded-md text-farm-600 bg-farm-50 hover:bg-farm-100 dark:bg-farm-900/30 dark:text-farm-400 dark:hover:bg-farm-900/50 transition-colors mr-2"
                          title="Ver Anexo"
                        >
                          <Paperclip className="h-4 w-4" />
                        </a>
                      )}
                      <button 
                        onClick={() => openEditModal(expense)}
                        className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-farm-600 hover:bg-farm-50 dark:hover:bg-farm-900/30 transition-colors mr-1"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id, expense.description)}
                        disabled={deletingId === expense.id}
                        className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Excluir"
                      >
                        {deletingId === expense.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      {/* Modal Nova Despesa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[95dvh] sm:max-h-[90dvh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-farm-50/50 dark:bg-farm-900/10">
              <h3 className="text-lg font-bold text-farm-900 dark:text-farm-400 flex items-center gap-2">
                <FileText className="h-5 w-5" /> {editingId ? "Editar Despesa" : "Nova Despesa"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="expense-form" onSubmit={handleCreateOrUpdate} className="space-y-4">
                
                {/* Opcionais: Nome do Pagador & Recibo */}
                <div className="p-4 bg-farm-50/50 dark:bg-farm-900/10 border border-farm-100 dark:border-farm-900/30 rounded-lg space-y-4 mb-2">
                  <h4 className="text-sm font-semibold text-farm-800 dark:text-farm-300 flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> Informações do Pagamento
                  </h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payer">Quem realizou o pagamento?</Label>
                    <select 
                      id="payer"
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      value={payerName}
                      onChange={e => setPayerName(e.target.value)}
                    >
                      <option value="">Nenhum específico / Fazenda</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">Anexar Comprovante / NF</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="receipt" 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={e => setReceiptFile(e.target.files ? e.target.files[0] : null)} 
                        className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-farm-50 file:text-farm-700 hover:file:bg-farm-100 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição do Gasto</Label>
                  <Input id="desc" required placeholder="Ex: Compra de Adubo NPK" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input id="valor" type="number" step="0.01" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data do Gasto</Label>
                    <Input id="data" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat">Categoria</Label>
                    <select 
                      id="cat"
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="Mão de Obra">Mão de Obra</option>
                      <option value="Manutenção Máquinas e Implementos">Manutenção Máquinas e Implementos</option>
                      <option value="Fertilizantes e Corretivos">Fertilizantes e Corretivos</option>
                      <option value="Defensivos Agrícolas">Defensivos Agrícolas</option>
                      <option value="Taxa Administração e Impostos">Taxa Administração e Impostos</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Armazenamento Grãos">Armazenamento Grãos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="farm">Fazenda / Talhão</Label>
                    <select 
                      id="farm"
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
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

                <div className="space-y-2">
                  <Label htmlFor="harvest">Safra Vinculada</Label>
                  <select 
                    id="harvest"
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    value={harvestId}
                    onChange={e => setHarvestId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecione a Safra...</option>
                    {harvests.filter(h => h.status === 'Aberta').map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

              </form>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" form="expense-form" variant="primary" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
