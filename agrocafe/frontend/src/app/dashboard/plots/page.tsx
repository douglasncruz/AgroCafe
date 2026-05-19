"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Map, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function FarmsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const loadData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      const data = await api.get('/farms', token);
      setFarms(data);
    } catch (err) {
      toast.error("Erro ao carregar fazendas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName("");
    setArea("");
    setCity("");
    setState("");
    setEditingId(null);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  }

  const openEditModal = (farm: any) => {
    setEditingId(farm.id);
    setName(farm.name);
    setArea(farm.total_area_hectares.toString());
    setCity(farm.city || "");
    setState(farm.state || "");
    setIsModalOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const payload = {
        name,
        total_area_hectares: Number(area),
        city,
        state
      };

      if (editingId) {
        await api.put(`/farms/${editingId}`, payload, token || "");
        toast.success("Fazenda atualizada com sucesso!");
      } else {
        await api.post('/farms', payload, token || "");
        toast.success("Fazenda cadastrada com sucesso!");
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || (editingId ? "Erro ao atualizar fazenda." : "Erro ao salvar fazenda."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, farmName: string) => {
    if (!confirm(`TEM CERTEZA que deseja excluir a fazenda "${farmName}"? Todas as receitas, despesas e talhões vinculados a ela serão APAGADOS permanentemente.`)) {
      return;
    }
    
    setDeletingId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/farms/${id}`, token || "");
      toast.success("Fazenda excluída com sucesso.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir a fazenda.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-amber-600 h-10 w-10" /></div>;
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Minhas Fazendas & Talhões</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie suas propriedades e áreas de plantio</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={openNewModal}>
            <Plus className="mr-2 h-4 w-4" /> Nova Fazenda
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {farms.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
              <Map className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma fazenda cadastrada</h3>
              <p className="text-slate-500 mt-1 mb-4">Adicione sua primeira propriedade para começar a rastrear os custos por talhão.</p>
              <Button variant="outline" onClick={openNewModal}>Adicionar Fazenda</Button>
            </div>
          ) : (
            farms.map(farm => (
              <div key={farm.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 flex flex-col relative group">
                
                {/* Ações Rápidas (Editar e Excluir) */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(farm)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                    title="Editar Fazenda"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(farm.id, farm.name)}
                    disabled={deletingId === farm.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    title="Excluir Fazenda"
                  >
                    {deletingId === farm.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex justify-between items-start mb-4 pr-16">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 flex items-center justify-center dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-400 shadow-sm">
                    <Map className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Ativa
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 truncate" title={farm.name}>{farm.name}</h3>
                <p className="text-slate-500 text-sm mb-4">
                  {farm.city ? `${farm.city} - ${farm.state}` : 'Localização não informada'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Área Total</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{farm.total_area_hectares} ha</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Talhões</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Gestão Unificada</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <Map className="h-5 w-5" /> {editingId ? "Editar Fazenda" : "Cadastrar Fazenda"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Propriedade</Label>
                <Input id="name" required placeholder="Ex: Sítio São José" value={name} onChange={e => setName(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">Área Total (Hectares)</Label>
                <Input id="area" type="number" step="0.1" required placeholder="Ex: 50.5" value={area} onChange={e => setArea(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" placeholder="Ex: Varginha" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input id="state" placeholder="Ex: MG" maxLength={2} value={state} onChange={e => setState(e.target.value)} />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={saving}>
                  {saving ? "Salvando..." : (editingId ? "Salvar Alterações" : "Salvar Fazenda")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
