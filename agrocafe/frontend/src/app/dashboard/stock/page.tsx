"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Loader2, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function StockPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [txProductName, setTxProductName] = useState("");
  const [txType, setTxType] = useState("ENTRADA");
  const [txQuantity, setTxQuantity] = useState("");
  const [txUnit, setTxUnit] = useState("L");
  const [txDate, setTxDate] = useState("");
  const [txUnitPrice, setTxUnitPrice] = useState("");
  const [txNotes, setTxNotes] = useState("");
  const [txCategory, setTxCategory] = useState("Defensivo");
  const [txMinQuantity, setTxMinQuantity] = useState("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      const farmData = await api.get("/farms", token);
      setFarms(farmData);
      if (farmData.length > 0) {
        setSelectedFarmId(farmData[0].id);
        await loadStock(farmData[0].id, token);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error("Erro ao carregar dados.");
      setLoading(false);
    }
  };

  const loadStock = async (farmId: string, token: string) => {
    setLoading(true);
    try {
      const [items, txs] = await Promise.all([
        api.get(`/stock?farmId=${farmId}`, token),
        api.get(`/stock/transactions?farmId=${farmId}`, token),
      ]);
      setStockItems(items);
      setTransactions(txs);
    } catch {
      toast.error("Erro ao carregar estoque.");
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
    const token = localStorage.getItem("@AgroCafe:token");
    if (token) loadStock(id, token);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.post(
        "/stock/transaction",
        {
          farmId: selectedFarmId,
          product_name: txProductName,
          type: txType,
          quantity: txQuantity,
          unit: txUnit,
          date: txDate,
          unit_price: txUnitPrice || undefined,
          notes: txNotes,
          category: txCategory,
          min_quantity: txMinQuantity || undefined,
        },
        token || ""
      );
      toast.success(`${txType === "ENTRADA" ? "Entrada" : "Saída"} registrada com sucesso!`);
      setIsModalOpen(false);
      resetForm();
      await loadStock(selectedFarmId, token || "");
    } catch {
      toast.error("Erro ao registrar movimentação.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTxProductName("");
    setTxType("ENTRADA");
    setTxQuantity("");
    setTxUnit("L");
    setTxDate("");
    setTxUnitPrice("");
    setTxNotes("");
    setTxCategory("Defensivo");
    setTxMinQuantity("");
  };

  const totalItems = stockItems.length;
  const lowStockItems = stockItems.filter(
    (s) => Number(s.min_quantity) > 0 && Number(s.quantity) <= Number(s.min_quantity)
  );
  const negativeStockItems = stockItems.filter((s) => Number(s.quantity) < 0);

  if (loading && stockItems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center mt-20">
        <Loader2 className="animate-spin text-teal-600 h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="text-teal-600 h-6 w-6" />
              Controle de Estoque de Insumos
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Gerencie entradas e saídas de defensivos, fertilizantes e insumos agrícolas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-900 dark:border-slate-800"
              value={selectedFarmId}
              onChange={handleFarmChange}
            >
              {farms.length === 0 ? (
                <option disabled>Nenhuma fazenda cadastrada</option>
              ) : null}
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
            </Button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              Produtos em Estoque
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalItems}</p>
            <p className="text-xs text-slate-400 mt-1">itens cadastrados</p>
          </div>
          <div
            className={`rounded-xl border p-5 shadow-sm ${
              lowStockItems.length > 0
                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
            }`}
          >
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              Estoque Baixo
            </p>
            <p
              className={`text-3xl font-bold ${
                lowStockItems.length > 0
                  ? "text-amber-600"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {lowStockItems.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">abaixo do mínimo</p>
          </div>
          <div
            className={`rounded-xl border p-5 shadow-sm ${
              negativeStockItems.length > 0
                ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
            }`}
          >
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              Estoque Negativo
            </p>
            <p
              className={`text-3xl font-bold ${
                negativeStockItems.length > 0
                  ? "text-red-600"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {negativeStockItems.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">aplicação sem compra</p>
          </div>
        </div>

        {/* STOCK TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Estoque Atual
            </h3>
          </div>
          {stockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhum item em estoque. Registre compras ou aplicações para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Produto</th>
                    <th className="px-5 py-3 text-left">Categoria</th>
                    <th className="px-5 py-3 text-right">Quantidade</th>
                    <th className="px-5 py-3 text-right">Mínimo</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item) => {
                    const qty = Number(item.quantity);
                    const minQty = Number(item.min_quantity);
                    const isNegative = qty < 0;
                    const isLow = !isNegative && minQty > 0 && qty <= minQty;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                          {item.product_name}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{item.category}</td>
                        <td
                          className={`px-5 py-3 text-right font-bold ${
                            isNegative
                              ? "text-red-600"
                              : isLow
                              ? "text-amber-600"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {qty.toFixed(2)} {item.unit}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-400">
                          {minQty > 0 ? `${minQty.toFixed(2)} ${item.unit}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isNegative ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                              <AlertTriangle className="h-3 w-3" /> Negativo
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> Baixo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TRANSACTIONS HISTORY */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Histórico de Movimentações
            </h3>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Data</th>
                    <th className="px-5 py-3 text-left">Produto</th>
                    <th className="px-5 py-3 text-center">Tipo</th>
                    <th className="px-5 py-3 text-right">Quantidade</th>
                    <th className="px-5 py-3 text-right">Valor Unit.</th>
                    <th className="px-5 py-3 text-left">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                        {new Date(tx.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                        {tx.product_name}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {tx.type === "ENTRADA" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                            <ArrowDownCircle className="h-3 w-3" /> Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400">
                            <ArrowUpCircle className="h-3 w-3" /> Saída
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {Number(tx.quantity).toFixed(2)} {tx.unit}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">
                        {tx.unit_price ? formatCurrency(Number(tx.unit_price)) : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-400 truncate max-w-[200px]" title={tx.notes}>
                        {tx.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NOVA MOVIMENTAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-teal-50/50 dark:bg-teal-900/10">
              <h3 className="text-lg font-bold text-teal-900 dark:text-teal-400 flex items-center gap-2">
                <Package className="h-5 w-5" /> Registrar Movimentação de Estoque
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <form id="stock-form" onSubmit={handleCreateTransaction} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Movimentação</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700"
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                    >
                      <option value="ENTRADA">📥 Entrada (Compra)</option>
                      <option value="SAIDA">📤 Saída (Consumo/Ajuste)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                    >
                      <option value="Defensivo">Defensivo</option>
                      <option value="Fertilizante">Fertilizante</option>
                      <option value="Adubo">Adubo</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Produto</Label>
                    <Input
                      required
                      placeholder="Ex: RoundUp Original"
                      value={txProductName}
                      onChange={(e) => setTxProductName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={txQuantity}
                      onChange={(e) => setTxQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700"
                      value={txUnit}
                      onChange={(e) => setTxUnit(e.target.value)}
                    >
                      <option value="L">Litros (L)</option>
                      <option value="Kg">Quilos (Kg)</option>
                      <option value="Saco">Sacos</option>
                      <option value="Un">Unidade</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      value={txUnitPrice}
                      onChange={(e) => setTxUnitPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qtd. Mínima Recomendada</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 10 (para alertas)"
                      value={txMinQuantity}
                      onChange={(e) => setTxMinQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Input
                      placeholder="Ex: Compra NF #1234"
                      value={txNotes}
                      onChange={(e) => setTxNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-100 dark:border-teal-800/50 mt-2">
                  <p className="text-xs text-teal-800 dark:text-teal-300">
                    * O estoque é atualizado automaticamente ao registrar aplicações de defensivos no módulo de Defensivos. Use esta tela para registrar compras (entradas) e ajustes manuais.
                  </p>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-slate-900/50">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="stock-form"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Registrar Movimentação"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
