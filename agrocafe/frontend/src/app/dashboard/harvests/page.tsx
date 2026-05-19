"use client";

import { useEffect, useState } from "react";
import {
  Wheat,
  Plus,
  Loader2,
  Lock,
  Archive,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useHarvest } from "@/context/HarvestContext";

interface HarvestSummary {
  harvest: {
    id: string;
    name: string;
    year: number;
    status: string;
    start_date: string;
    end_date: string | null;
    farm: string;
  };
  totalExpenses: number;
  totalRevenues: number;
  netProfit: number;
  totalSacks: number;
  avgPricePerSack: number;
  expenseCount: number;
  revenueCount: number;
}

export default function HarvestsPage() {
  const [harvests, setHarvests] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<Record<string, HarvestSummary>>({});
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const { refreshHarvests } = useHarvest();

  // Form states
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [notes, setNotes] = useState("");
  const [farmId, setFarmId] = useState("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;

      const farmData = await api.get("/farms", token);
      setFarms(farmData);

      if (farmData.length > 0) {
        setFarmId(farmData[0].id);
        const allHarvests = await api.get(`/harvests/farm/${farmData[0].id}`, token);
        setHarvests(allHarvests);

        // Load summaries for each harvest
        const summaryMap: Record<string, HarvestSummary> = {};
        for (const h of allHarvests) {
          try {
            const summary = await api.get(`/harvests/${h.id}/summary`, token);
            summaryMap[h.id] = summary;
          } catch {
            // Summary might fail for empty harvests, ignore
          }
        }
        setSummaries(summaryMap);
      }
    } catch (err) {
      toast.error("Erro ao carregar safras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.post("/harvests", { name, year: Number(year), notes, farmId }, token || "");
      toast.success("Safra criada com sucesso!");
      setIsModalOpen(false);
      setName("");
      setNotes("");
      await loadData();
      await refreshHarvests();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar safra.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: string, harvestName: string) => {
    if (!confirm(`Deseja realmente ENCERRAR a safra "${harvestName}"?\n\nApós o encerramento, nenhum novo lançamento financeiro poderá ser feito nesta safra.`))
      return;

    setActionId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.patch(`/harvests/${id}/close`, {}, token || "");
      toast.success(`Safra "${harvestName}" encerrada com sucesso.`);
      await loadData();
      await refreshHarvests();
    } catch (err: any) {
      toast.error(err.message || "Erro ao encerrar safra.");
    } finally {
      setActionId(null);
    }
  };

  const handleArchive = async (id: string, harvestName: string) => {
    if (!confirm(`Deseja ARQUIVAR a safra "${harvestName}"?\n\nA safra ficará disponível apenas para consultas históricas.`))
      return;

    setActionId(id);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.patch(`/harvests/${id}/archive`, {}, token || "");
      toast.success(`Safra "${harvestName}" arquivada.`);
      await loadData();
      await refreshHarvests();
    } catch (err: any) {
      toast.error(err.message || "Erro ao arquivar safra.");
    } finally {
      setActionId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Aberta":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          ring: "ring-green-500/20",
        };
      case "Encerrada":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/10",
          border: "border-amber-200 dark:border-amber-800",
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
          icon: <Lock className="h-5 w-5 text-amber-600" />,
          ring: "ring-amber-500/20",
        };
      case "Arquivada":
        return {
          bg: "bg-slate-50 dark:bg-slate-800/50",
          border: "border-slate-200 dark:border-slate-700",
          badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
          icon: <Archive className="h-5 w-5 text-slate-400" />,
          ring: "ring-slate-500/10",
        };
      default:
        return {
          bg: "bg-slate-50",
          border: "border-slate-200",
          badge: "bg-slate-100 text-slate-600",
          icon: <Wheat className="h-5 w-5" />,
          ring: "",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center mt-20">
        <Loader2 className="animate-spin text-farm-600 h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wheat className="text-farm-600 h-6 w-6" />
              Gestão de Safras
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Controle o ciclo financeiro da sua lavoura por safra
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Abrir Nova Safra
          </Button>
        </div>

        {/* Alert: No open harvest */}
        {!harvests.some((h) => h.status === "Aberta") && harvests.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Nenhuma safra aberta. Abra uma nova safra para poder registrar despesas e receitas.
            </p>
          </div>
        )}

        {/* Empty state */}
        {harvests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Wheat className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">
              Nenhuma safra cadastrada
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 text-center max-w-md">
              Crie sua primeira safra para começar a registrar movimentações financeiras da lavoura.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeira Safra
            </Button>
          </div>
        )}

        {/* Harvest Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {harvests.map((harvest) => {
            const sc = getStatusConfig(harvest.status);
            const summary = summaries[harvest.id];

            return (
              <div
                key={harvest.id}
                className={`rounded-2xl border-2 ${sc.border} ${sc.bg} p-6 transition-all hover:shadow-lg ring-1 ${sc.ring}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {sc.icon}
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{harvest.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${sc.badge}`}>
                          {harvest.status}
                        </span>
                        {harvest.is_active && harvest.status === "Aberta" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-farm-100 text-farm-700 dark:bg-farm-900/40 dark:text-farm-400">
                            Ativa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>
                    Início: {harvest.start_date ? new Date(harvest.start_date).toLocaleDateString("pt-BR") : "—"}
                    {harvest.end_date && ` → Fim: ${new Date(harvest.end_date).toLocaleDateString("pt-BR")}`}
                  </span>
                </div>

                {/* Financial Summary */}
                {summary && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-2 text-center">
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-500 font-medium">Receitas</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(summary.totalRevenues)}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-2 text-center">
                      <TrendingDown className="h-3.5 w-3.5 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500 font-medium">Despesas</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(summary.totalExpenses)}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-2 text-center">
                      <Wallet className="h-3.5 w-3.5 text-coffee-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-500 font-medium">Resultado</p>
                      <p className={`text-sm font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(summary.netProfit)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {harvest.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4 line-clamp-2">
                    {harvest.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  {harvest.status === "Aberta" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                      onClick={() => handleClose(harvest.id, harvest.name)}
                      disabled={actionId === harvest.id}
                    >
                      {actionId === harvest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Lock className="h-4 w-4 mr-1" />
                      )}
                      Encerrar
                    </Button>
                  )}
                  {harvest.status === "Encerrada" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-slate-600 border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
                      onClick={() => handleArchive(harvest.id, harvest.name)}
                      disabled={actionId === harvest.id}
                    >
                      {actionId === harvest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Archive className="h-4 w-4 mr-1" />
                      )}
                      Arquivar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nova Safra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-farm-50/50 dark:bg-farm-900/10">
              <h3 className="text-lg font-bold text-farm-900 dark:text-farm-400 flex items-center gap-2">
                <Wheat className="h-5 w-5" /> Abrir Nova Safra
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="harvest-name">Nome da Safra *</Label>
                <Input
                  id="harvest-name"
                  required
                  placeholder="Ex: Safra 2026/27"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harvest-year">Ano *</Label>
                  <Input
                    id="harvest-year"
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="harvest-farm">Fazenda *</Label>
                  <select
                    id="harvest-farm"
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    value={farmId}
                    onChange={(e) => setFarmId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="harvest-notes">Observações</Label>
                <Textarea
                  id="harvest-notes"
                  placeholder="Anotações sobre esta safra (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 bg-farm-50 dark:bg-farm-900/10 border border-farm-100 dark:border-farm-900/30 rounded-lg">
                <p className="text-xs text-farm-700 dark:text-farm-400 leading-relaxed">
                  <strong>⚠️ Importante:</strong> Apenas uma safra pode estar aberta por vez.
                  Ao abrir esta safra, todas as novas despesas e receitas serão vinculadas a ela.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Abrir Safra
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
