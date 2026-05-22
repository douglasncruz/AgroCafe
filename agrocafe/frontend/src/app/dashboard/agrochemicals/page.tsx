"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, FlaskConical, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function AgrochemicalsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [agrochemicals, setAgrochemicals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [targetPest, setTargetPest] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [plotApplied, setPlotApplied] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dose, setDose] = useState("");
  const [gracePeriod, setGracePeriod] = useState("");
  const [recipe, setRecipe] = useState("");
  const [operator, setOperator] = useState("");
  const [recipeFile, setRecipeFile] = useState<File | null>(null);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const farmData = await api.get('/farms', token);
      setFarms(farmData);
      
      if (farmData.length > 0) {
        setSelectedFarmId(farmData[0].id);
        await loadAgrochemicals(farmData[0].id, token);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error("Erro ao carregar dados.");
      setLoading(false);
    }
  };

  const loadAgrochemicals = async (farmId: string, token: string) => {
    try {
      const data = await api.get(`/agrochemicals?farmId=${farmId}`, token);
      setAgrochemicals(data);
    } catch (err) {
      toast.error("Erro ao carregar defensivos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    setLoading(true);
    const token = localStorage.getItem("@AgroCafe:token");
    if(token) loadAgrochemicals(id, token);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      
      const formData = new FormData();
      formData.append('farmId', selectedFarmId);
      formData.append('product_name', productName);
      formData.append('target_pest', targetPest);
      formData.append('application_date', applicationDate);
      formData.append('plot_applied', plotApplied);
      formData.append('quantity_used', quantity);
      formData.append('dose_per_hectare', dose);
      formData.append('grace_period_days', gracePeriod);
      formData.append('agronomist_recipe', recipe);
      formData.append('operator_name', operator);
      
      if (recipeFile) {
        formData.append('receipt', recipeFile);
      }

      await api.postForm('/agrochemicals', formData, token || "");
      
      toast.success("Aplicação registrada com sucesso!");
      setIsModalOpen(false);
      // Reset form
      setProductName(""); setTargetPest(""); setPlotApplied("");
      setQuantity(""); setDose(""); setGracePeriod("");
      setRecipe(""); setOperator(""); setRecipeFile(null);
      
      loadAgrochemicals(selectedFarmId, token || "");
    } catch (err) {
      toast.error("Erro ao registrar defensivo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja remover o registro de ${name}?`)) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/agrochemicals/${id}`, token || "");
      toast.success("Registro removido.");
      loadAgrochemicals(selectedFarmId, token || "");
    } catch (err) {
      toast.error("Erro ao remover registro.");
    } finally {
      setDeletingId(null);
    }
  };

  const isHarvestSafe = (safeDateStr: string) => {
    const safeDate = new Date(safeDateStr);
    const today = new Date();
    // zerar horas para comparar apenas dias
    safeDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return today >= safeDate;
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-purple-600 h-10 w-10" /></div>;
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="text-purple-600 h-6 w-6" />
              Gestão de Defensivos e Receituário
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Controle de aplicações, dosagens e período de carência agronômico</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:border-slate-800"
              value={selectedFarmId}
              onChange={handleFarmChange}
            >
              {farms.length === 0 ? <option disabled>Nenhuma fazenda cadastrada</option> : null}
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <Button variant="primary" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Aplicação
            </Button>
          </div>
        </div>

        {farms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
            Você precisa cadastrar uma Fazenda primeiro.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agrochemicals.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                Nenhum defensivo aplicado ainda nesta fazenda.
              </div>
            ) : (
              agrochemicals.map(agro => {
                const safe = isHarvestSafe(agro.safe_harvest_date);
                return (
                  <div key={agro.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden dark:bg-slate-900 ${safe ? 'border-slate-200 dark:border-slate-800' : 'border-red-300 dark:border-red-800/50'}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${safe ? 'border-slate-100 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800' : 'border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50'}`}>
                      <h3 className="font-bold text-slate-900 dark:text-white truncate" title={agro.product_name}>
                        {agro.product_name}
                      </h3>
                      {safe ? (
                         <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                           <CheckCircle2 className="h-3 w-3" /> Liberado
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full animate-pulse dark:bg-red-900/30 dark:text-red-400">
                           <ShieldAlert className="h-3 w-3" /> Em Carência
                         </span>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                        <span className="text-slate-500">Talhão:</span>
                        <span className="font-medium dark:text-white">{agro.plot_applied}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                        <span className="text-slate-500">Alvo (Praga/Doença):</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">{agro.target_pest}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                        <span className="text-slate-500">Dosagem:</span>
                        <span className="font-medium dark:text-white">{agro.dose_per_hectare} /ha</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
                        <span className="text-slate-500">Data Aplicação:</span>
                        <span className="font-medium dark:text-white">{new Date(agro.application_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <div className={`mt-2 p-3 rounded-lg ${safe ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                        <p className="text-xs font-semibold uppercase mb-1 flex items-center justify-between">
                          <span>Data Segura para Colheita</span>
                          <span>{agro.grace_period_days} dias carentes</span>
                        </p>
                        <p className="text-lg font-bold">{new Date(agro.safe_harvest_date).toLocaleDateString('pt-BR')}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                         <span className="text-xs text-slate-400" title={agro.operator_name}>Op: {agro.operator_name || 'N/A'} | Rec: {agro.agronomist_recipe || 'N/A'}</span>
                         <div>
                           {agro.recipe_url && (
                             <a 
                               href={`http://localhost:3001${agro.recipe_url}`} 
                               target="_blank" 
                               rel="noreferrer"
                               className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-purple-600 dark:hover:bg-slate-800 transition-colors mr-1"
                               title="Ver Receita Agronômica"
                             >
                               <span className="text-xs font-semibold underline">Ver Receita</span>
                             </a>
                           )}
                           <button 
                              onClick={() => handleDelete(agro.id, agro.product_name)}
                              disabled={deletingId === agro.id}
                              className="text-slate-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Excluir"
                           >
                              {deletingId === agro.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[95dvh] sm:max-h-[90dvh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/10">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-400 flex items-center gap-2">
                <FlaskConical className="h-5 w-5" /> Registrar Nova Aplicação
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">×</button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="agro-form" onSubmit={handleCreate} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Produto Utilizado (Ex: RoundUp)</Label>
                    <Input required value={productName} onChange={e => setProductName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Praga/Doença Alvo</Label>
                    <Input required value={targetPest} onChange={e => setTargetPest(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Talhão Aplicado</Label>
                    <Input required value={plotApplied} onChange={e => setPlotApplied(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data da Aplicação</Label>
                    <Input type="date" required value={applicationDate} onChange={e => setApplicationDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Qtd. Total (L ou Kg)</Label>
                    <Input type="number" step="0.1" required value={quantity} onChange={e => setQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosagem /ha</Label>
                    <Input type="number" step="0.1" required value={dose} onChange={e => setDose(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Carência (Dias)</Label>
                    <Input type="number" required value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº Receituário Agronômico</Label>
                    <Input placeholder="Ex: REC-12345" value={recipe} onChange={e => setRecipe(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável/Operador</Label>
                    <Input placeholder="Ex: José da Silva" value={operator} onChange={e => setOperator(e.target.value)} />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/50 mt-4">
                  <p className="text-xs text-purple-800 dark:text-purple-300">
                    * Atenção Agronômica: A data segura de colheita será calculada automaticamente com base na Data de Aplicação + Tempo de Carência em dias.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label htmlFor="receiptFile" className="flex items-center gap-2">
                    Anexar Receita (PDF / Imagem)
                  </Label>
                  <Input 
                    id="receiptFile" 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={e => setRecipeFile(e.target.files ? e.target.files[0] : null)} 
                    className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-slate-900/50">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" form="agro-form" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Aplicação"}
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
