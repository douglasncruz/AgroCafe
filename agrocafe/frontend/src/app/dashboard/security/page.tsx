"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldAlert, ShieldCheck, Activity, Search, Filter, History, Eye, UserX, UserCheck, Edit3, Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SecurityLog {
  id: string;
  user_name: string;
  action: string;
  module_name: string;
  ip_address: string;
  user_agent: string;
  status: string;
  created_at: string;
  old_values: any;
  new_values: any;
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<any>({ failedLogins: 0, totalLogsToday: 0, topActions: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const res = await api.get(`/security-logs?page=${page}&limit=15${filterAction ? `&action=${filterAction}` : ""}`, token || "");
      setLogs(res.data);
      setTotalPages(res.last_page);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const res = await api.get(`/security-logs/stats`, token || "");
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN_FAILED")) return <UserX className="h-4 w-4 text-red-500" />;
    if (action.includes("LOGIN_SUCCESS")) return <UserCheck className="h-4 w-4 text-emerald-500" />;
    if (action === "CREATE") return <PlusCircle className="h-4 w-4 text-blue-500" />;
    if (action === "UPDATE") return <Edit3 className="h-4 w-4 text-amber-500" />;
    if (action === "DELETE") return <Trash2 className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-slate-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'FAILURE') return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    if (status === 'WARNING') return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Auditoria e Segurança
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitoramento em tempo real de acessos e alterações no sistema.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Falhas de Login (Hoje)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.failedLogins}</h3>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Eventos Registrados (Hoje)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalLogsToday}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-slate-500 font-medium mb-2">Ações Frequentes</p>
          <div className="flex flex-wrap gap-2">
            {stats.topActions?.map((a: any, i: number) => (
              <span key={i} className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                {a.action}: {a.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por usuário..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas as Ações</option>
              <option value="LOGIN_SUCCESS">Login</option>
              <option value="LOGIN_FAILED">Falha de Login</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Módulo</th>
                <th className="px-6 py-4">IP</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center space-x-2 animate-pulse">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animation-delay-200"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animation-delay-400"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {log.user_name || "Sistema / Desconhecido"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {log.module_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Ver payload completo"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Página <span className="font-medium text-slate-900 dark:text-white">{page}</span> de <span className="font-medium text-slate-900 dark:text-white">{totalPages || 1}</span>
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detalhes do Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  Detalhes do Evento: {selectedLog.action}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Módulo: {selectedLog.module_name} | Registrado em {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss")}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Usuário</p>
                  <p className="font-medium text-sm truncate">{selectedLog.user_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Endereço IP</p>
                  <p className="font-medium text-sm font-mono truncate">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2">
                  <p className="text-xs text-slate-500 mb-1">User Agent</p>
                  <p className="font-medium text-xs truncate" title={selectedLog.user_agent}>{selectedLog.user_agent || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.action === 'UPDATE' && selectedLog.old_values && selectedLog.new_values && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Valores Antigos
                    </h4>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 overflow-x-auto text-xs font-mono">
                      <pre>{JSON.stringify(selectedLog.old_values, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-600 mb-2 flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" /> Valores Novos
                    </h4>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 overflow-x-auto text-xs font-mono">
                      <pre>{JSON.stringify(selectedLog.new_values, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.action !== 'UPDATE' && (selectedLog.new_values || selectedLog.old_values) && (
                 <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Payload (Dados da Operação)</h4>
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-mono">
                    <pre>{JSON.stringify(selectedLog.new_values || selectedLog.old_values, null, 2)}</pre>
                  </div>
                </div>
              )}

              {selectedLog.status === 'FAILURE' && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex gap-3 items-start">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Atenção</p>
                    <p>Esta operação falhou ou foi bloqueada por razões de segurança (ex: senha incorreta, permissão negada).</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
