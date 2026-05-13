"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Loader2, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";
import Link from "next/link";

export default function AuditPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadAudit();
    } else {
      setAlerts([]);
      setLoading(false);
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const data = await api.get('/farms', token || "");
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      toast.error("Erro ao carregar fazendas.");
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const response = await api.get(`/audit/report?farmId=${selectedFarmId}`, token || "");
      setAlerts(response.alerts || []);
    } catch (err) {
      toast.error("Falha ao gerar relatório de auditoria.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-300';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-300';
      case 'low': return 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-300';
      default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case 'high': return <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />;
      case 'medium': return <Info className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case 'low': return <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />;
      default: return <Info className="h-6 w-6" />;
    }
  };

  if (loading && farms.length === 0) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-red-600 h-10 w-10" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Auditoria & Compliance
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Motor inteligente de rastreabilidade contábil, fiscal e agronômica.
          </p>
        </div>
        
        {farms.length > 0 && (
          <select 
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">Relatório Dinâmico de Inconformidades</h3>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mb-4" />
            <p className="text-slate-500">Rodando motor de auditoria em todos os módulos...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Nenhum dado encontrado para analisar. Comece a cadastrar informações na plataforma.
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`p-5 rounded-xl border flex items-start gap-4 transition-all hover:shadow-md ${getSeverityStyles(alert.severity)}`}>
                <div className="shrink-0 mt-1">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{alert.title}</h4>
                  <p className="text-sm opacity-90 mb-3">{alert.message}</p>
                  
                  {alert.action && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-current opacity-80">
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-sm font-semibold">Plano de Ação: {alert.action}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-500">
        <strong>Nota do Auditor:</strong> Manter a documentação 100% aderente (arquivos PDF anexados, receituários vinculados) é o que garante que a fazenda passe em auditorias de certificação internacional (ex: UTZ, Rainforest Alliance) e evite multas na Receita Federal do Brasil.
      </div>
    </div>
  );
}
