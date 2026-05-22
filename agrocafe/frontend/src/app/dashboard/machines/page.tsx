"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Settings, Wrench, Trash2, FileText, Factory, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function MachinesPage() {
  const [activeTab, setActiveTab] = useState<'machines' | 'maintenance'>('machines');
  
  const [machines, setMachines] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Machine Form
  const [mName, setMName] = useState("");
  const [mBrand, setMBrand] = useState("");
  const [mModel, setMModel] = useState("");
  const [mYear, setMYear] = useState("");
  const [mType, setMType] = useState("Trator");
  const [mValue, setMValue] = useState("");
  const [mPlate, setMPlate] = useState("");
  const [mFarmId, setMFarmId] = useState("");

  // Maintenance Form
  const [mtMachineId, setMtMachineId] = useState("");
  const [mtDate, setMtDate] = useState("");
  const [mtDesc, setMtDesc] = useState("");
  const [mtType, setMtType] = useState("Preventiva");
  const [mtCost, setMtCost] = useState("");
  const [mtProvider, setMtProvider] = useState("");
  const [mtReceipt, setMtReceipt] = useState<File | null>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const [machData, maintData, farmData] = await Promise.all([
        api.get('/machines', token),
        api.get('/machines/maintenances', token),
        api.get('/farms', token)
      ]);
      setMachines(machData);
      setMaintenances(maintData);
      setFarms(farmData);
      
      if (farmData.length > 0) setMFarmId(farmData[0].id);
      if (machData.length > 0) setMtMachineId(machData[0].id);
    } catch (err) {
      toast.error("Erro ao carregar dados de maquinário.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.post('/machines', {
        name: mName,
        brand: mBrand,
        model: mModel,
        year: Number(mYear),
        type: mType,
        acquisition_value: Number(mValue),
        plate_or_chassis: mPlate,
        farmId: mFarmId
      }, token || "");
      toast.success("Ativo cadastrado com sucesso!");
      setIsMachineModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Erro ao salvar ativo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const formData = new FormData();
      formData.append('machineId', mtMachineId);
      formData.append('date', mtDate);
      formData.append('description', mtDesc);
      formData.append('type', mtType);
      formData.append('cost', mtCost);
      formData.append('provider_name', mtProvider);
      if (mtReceipt) formData.append('receipt', mtReceipt);

      await api.postForm('/machines/maintenances', formData, token || "");
      toast.success("Manutenção registrada!");
      setIsMaintModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Erro ao salvar manutenção.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMachine = async (id: string, name: string) => {
    if (!confirm(`Deseja apagar o ativo ${name}? Isso excluirá o histórico de manutenções dele!`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/machines/${id}`, localStorage.getItem("@AgroCafe:token") || "");
      toast.success("Ativo apagado!");
      loadData();
    } catch (err) {
      toast.error("Erro ao apagar ativo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteMaint = async (id: string) => {
    if (!confirm("Deseja apagar este registro de manutenção?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/machines/maintenances/${id}`, localStorage.getItem("@AgroCafe:token") || "");
      toast.success("Registro apagado!");
      loadData();
    } catch (err) {
      toast.error("Erro ao apagar registro.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-slate-500 h-10 w-10" /></div>;
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="text-slate-500 h-6 w-6" />
              Maquinários & Ativos
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie frota, implementos e custos de manutenção</p>
          </div>
          
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'machines' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              onClick={() => setActiveTab('machines')}
            >
              Meus Ativos
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'maintenance' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              onClick={() => setActiveTab('maintenance')}
            >
              Manutenções
            </button>
          </div>
        </div>

        {/* TAB MACHINES */}
        {activeTab === 'machines' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frota Atual</h3>
              <Button onClick={() => setIsMachineModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Cadastrar Ativo
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
              {machines.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">Nenhum ativo cadastrado.</div>
              ) : (
                machines.map(m => (
                  <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm relative group dark:bg-slate-900 dark:border-slate-800">
                    <button 
                      onClick={() => handleDeleteMachine(m.id, m.name)}
                      disabled={deletingId === m.id}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deletingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 dark:bg-slate-800">
                        {m.type === 'Veículo' ? <Car className="h-5 w-5" /> : <Factory className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{m.name}</h4>
                        <p className="text-xs text-slate-500">{m.brand} • {m.year}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                        <span>Valor de Compra:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(Number(m.acquisition_value))}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                        <span>Status:</span>
                        <span className="font-medium text-green-600">{m.status}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>Alocação:</span>
                        <span className="font-medium truncate max-w-[120px]" title={m.farm?.name}>{m.farm?.name || 'Geral'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Manutenções</h3>
              <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsMaintModalOpen(true)}>
                <Wrench className="h-4 w-4 mr-2" /> Registrar Manutenção
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Ativo (Máquina)</th>
                    <th className="px-6 py-4">Serviço</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 text-right">Custo</th>
                    <th className="px-6 py-4 text-center">NF</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenances.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                  ) : (
                    maintenances.map(m => (
                      <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{m.machine?.name}</td>
                        <td className="px-6 py-4">
                          <span className="block">{m.description}</span>
                          <span className="text-xs text-slate-400">{m.provider_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.type === 'Preventiva' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(Number(m.cost))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {m.receipt_url && (
                            <a href={`http://localhost:3001${m.receipt_url}`} target="_blank" className="inline-flex p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDeleteMaint(m.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-md">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MÁQUINA */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">Cadastrar Ativo / Máquina</h3>
              <button onClick={() => setIsMachineModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreateMachine} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome do Ativo</Label>
                <Input required placeholder="Ex: Trator John Deere 5075E" value={mName} onChange={e => setMName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input placeholder="Ex: John Deere" value={mBrand} onChange={e => setMBrand(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input type="number" placeholder="Ex: 2022" value={mYear} onChange={e => setMYear(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900" value={mType} onChange={e => setMType(e.target.value)}>
                    <option value="Trator">Trator</option>
                    <option value="Colheitadeira">Colheitadeira</option>
                    <option value="Implemento">Implemento</option>
                    <option value="Veículo">Veículo / Caminhonete</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Valor de Aquisição (R$)</Label>
                  <Input type="number" step="0.01" required value={mValue} onChange={e => setMValue(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fazenda Alocada</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900" value={mFarmId} onChange={e => setMFarmId(e.target.value)} required>
                  <option value="" disabled>Selecione...</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsMachineModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={saving}>Salvar Ativo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MANUTENÇÃO */}
      {isMaintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-amber-50 dark:bg-amber-900/10">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-500">Registrar Manutenção</h3>
              <button onClick={() => setIsMaintModalOpen(false)} className="text-slate-400">×</button>
            </div>
            <form onSubmit={handleCreateMaintenance} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Qual Máquina/Ativo?</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900" value={mtMachineId} onChange={e => setMtMachineId(e.target.value)} required>
                  <option value="" disabled>Selecione...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Descrição do Serviço / Peças</Label>
                <Input required placeholder="Ex: Troca de óleo e filtro" value={mtDesc} onChange={e => setMtDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Manutenção</Label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900" value={mtType} onChange={e => setMtType(e.target.value)}>
                    <option value="Preventiva">Preventiva (Revisão)</option>
                    <option value="Corretiva">Corretiva (Quebra)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" required value={mtDate} onChange={e => setMtDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custo Total (R$)</Label>
                  <Input type="number" step="0.01" required value={mtCost} onChange={e => setMtCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Oficina / Mecânico</Label>
                  <Input placeholder="Ex: Oficina do Zé" value={mtProvider} onChange={e => setMtProvider(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label>Anexar Nota Fiscal / Recibo</Label>
                <Input type="file" accept="image/*,.pdf" onChange={e => setMtReceipt(e.target.files ? e.target.files[0] : null)} className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-amber-50 file:text-amber-700 cursor-pointer" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsMaintModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={saving}>Salvar Manutenção</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
