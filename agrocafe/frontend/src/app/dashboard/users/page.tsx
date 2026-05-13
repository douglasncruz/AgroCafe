"use client";

import { useEffect, useState } from "react";
import { Users, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Password Reset Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const data = await api.get('/users', token || "");
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = (user: any) => {
    setSelectedUser(user);
    setNewPassword("");
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.put(`/users/${selectedUser.id}/reset-password`, { newPassword }, token || "");
      toast.success(`Senha de ${selectedUser.name} alterada com sucesso!`);
      setResetModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Falha ao redefinir a senha.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-slate-600 h-10 w-10" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            Controle de Acessos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestão exclusiva para Administradores. Redefina credenciais de produtores.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Produtor / Usuário</th>
                <th className="px-6 py-4">E-mail de Login</th>
                <th className="px-6 py-4">Data de Cadastro</th>
                <th className="px-6 py-4 text-right">Ações de Suporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold uppercase">
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.email !== 'admin@agrocafe.com.br' ? (
                      <Button variant="outline" size="sm" onClick={() => openResetModal(user)}>
                        <KeyRound className="h-4 w-4 mr-2" /> Resetar Senha
                      </Button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        Admin (Protegido)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">Redefinir Senha</h3>
              <button onClick={() => setResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm mb-4">
                Redefinindo acesso para:<br/>
                <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha Temporária</Label>
                <Input 
                  id="newPassword" 
                  type="text" 
                  required 
                  placeholder="Ex: Senha@123" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setResetModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Alterando..." : "Confirmar Nova Senha"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
