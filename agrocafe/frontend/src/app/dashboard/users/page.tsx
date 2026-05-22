"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Loader2, ShieldCheck, Trash2, Edit2, Camera, User, Lock, Save, X, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";

const modulesList = [
  { id: 'harvests', name: 'Safras' },
  { id: 'plots', name: 'Talhões' },
  { id: 'agrochemicals', name: 'Defensivos & Receitas' },
  { id: 'revenues', name: 'Receitas (Vendas)' },
  { id: 'expenses', name: 'Despesas & Custos' },
  { id: 'machines', name: 'Maquinário' },
  { id: 'stock', name: 'Estoque' },
  { id: 'partners', name: 'Sócios' },
  { id: 'reports', name: 'Relatórios' },
  { id: 'audit', name: 'Auditoria' },
  { id: 'users', name: 'Gerenciamento de Usuários' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('data'); // data, auth, permissions
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleName, setRoleName] = useState("Consulta");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [avatarBase64, setAvatarBase64] = useState("");
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("@AgroCafe:token");
      const data = await api.get('/users', token || "");
      setUsers(data);
    } catch (err) {
      toast.error("Erro ao carregar usuários. Verifique se você tem permissão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const payload = {
        name,
        email,
        phone,
        role_name: roleName,
        password: password || undefined,
        is_active: isActive,
        notes,
        permissions
      };

      if (editingId) {
        await api.put(`/users/${editingId}`, payload, token || "");
        if (avatarBase64) {
          await api.put(`/users/${editingId}/avatar`, { avatar_base64: avatarBase64 }, token || "");
        }
        toast.success("Usuário atualizado com sucesso!");
      } else {
        const newUser = await api.post('/users', payload, token || "");
        if (avatarBase64) {
          await api.put(`/users/${newUser.id}/avatar`, { avatar_base64: avatarBase64 }, token || "");
        }
        toast.success("Usuário criado com sucesso!");
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setRoleName("Consulta");
    setPassword("");
    setIsActive(true);
    setNotes("");
    setAvatarBase64("");
    setPermissions({});
    setActiveTab('data');
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setRoleName(user.role_name || "Consulta");
    setPassword("");
    setIsActive(user.is_active);
    setNotes(user.notes || "");
    setAvatarBase64(""); // We don't fetch full avatars in list typically, but if we do, set it here
    setPermissions(user.permissions || {});
    setActiveTab('data');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/users/${id}`, token || "");
      toast.success("Usuário excluído.");
      loadUsers();
    } catch (err) {
      toast.error("Erro ao excluir usuário.");
    }
  };

  const togglePermission = (module: string, action: string) => {
    setPermissions(prev => {
      const modulePerms = prev[module] || { view: false, edit: false, delete: false };
      return {
        ...prev,
        [module]: {
          ...modulePerms,
          [action]: !modulePerms[action]
        }
      };
    });
  };

  const applyProfileTemplate = (profile: string) => {
    setRoleName(profile);
    const p: any = {};
    modulesList.forEach(m => {
      if (profile === 'Administrador') {
        p[m.id] = { view: true, edit: true, delete: true };
      } else if (profile === 'Operacional') {
        if (['harvests', 'plots', 'agrochemicals', 'machines', 'stock'].includes(m.id)) {
          p[m.id] = { view: true, edit: true, delete: false };
        }
      } else if (profile === 'Financeiro') {
        if (['revenues', 'expenses', 'reports'].includes(m.id)) {
          p[m.id] = { view: true, edit: true, delete: false };
        }
      } else { // Consulta
        p[m.id] = { view: true, edit: false, delete: false };
      }
    });
    setPermissions(p);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-farm-600" />
            Controle de Acessos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie permissões (RBAC) e perfis da plataforma.</p>
        </div>
        <Button variant="primary" onClick={openNewModal} className="shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-farm-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Último Acesso</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {u.role_name || 'Personalizado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Ativo</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><div className="h-2 w-2 rounded-full bg-slate-300"></div> Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Nunca acessou'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5 text-farm-600"/> : <Plus className="h-5 w-5 text-farm-600"/>}
                {editingId ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'data' ? 'border-farm-600 text-farm-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Dados Pessoais
              </button>
              <button onClick={() => setActiveTab('auth')} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'auth' ? 'border-farm-600 text-farm-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Autenticação
              </button>
              <button onClick={() => setActiveTab('permissions')} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'permissions' ? 'border-farm-600 text-farm-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Permissões (RBAC)
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="flex-1 overflow-y-auto">
              <div className="p-6">
                
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className={`h-24 w-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden ${avatarBase64 ? 'border-farm-500' : 'bg-slate-50'}`}>
                          {avatarBase64 ? (
                            <img src={avatarBase64} alt="Preview" className="h-full w-full object-cover" />
                          ) : (
                            <Camera className="h-8 w-8 text-slate-400 group-hover:text-farm-500 transition-colors" />
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Foto de Perfil</h4>
                        <p className="text-xs text-slate-500 mt-1">JPG ou PNG, máx. 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Nome Completo *</Label>
                        <Input required value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail *</Label>
                        <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={!!editingId && email === 'douglas.cruz@agrocerradocafe.com.br'} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Observações Internas</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Usuário temporário para safra..." />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'auth' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                      <Label className="flex items-center gap-2 mb-2"><Lock className="h-4 w-4"/> Definir Senha</Label>
                      <Input type="password" placeholder={editingId ? "Deixe em branco para manter a atual" : "Senha segura..."} value={password} onChange={e => setPassword(e.target.value)} required={!editingId} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status da Conta</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={isActive ? "true" : "false"}
                        onChange={e => setIsActive(e.target.value === "true")}
                      >
                        <option value="true">Ativo (Pode logar)</option>
                        <option value="false">Inativo (Bloqueado)</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'permissions' && (
                  <div className="space-y-6">
                    <div className="space-y-2 mb-6">
                      <Label>Aplicar Perfil Pronto (Template)</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={roleName}
                        onChange={e => applyProfileTemplate(e.target.value)}
                      >
                        <option value="Consulta">Consulta (Apenas Visualização)</option>
                        <option value="Operacional">Operacional (Campo)</option>
                        <option value="Financeiro">Financeiro (Escritório)</option>
                        <option value="Administrador">Administrador Global</option>
                        <option value="Personalizado">Personalizado (Misto)</option>
                      </select>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">Módulo</th>
                            <th className="px-4 py-3 text-center">Ver</th>
                            <th className="px-4 py-3 text-center">Editar</th>
                            <th className="px-4 py-3 text-center">Excluir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {modulesList.map(m => (
                            <tr key={m.id}>
                              <td className="px-4 py-3 font-medium text-slate-700">{m.name}</td>
                              <td className="px-4 py-3 text-center">
                                <input type="checkbox" checked={permissions[m.id]?.view || false} onChange={() => togglePermission(m.id, 'view')} className="h-4 w-4 rounded border-slate-300 text-farm-600 focus:ring-farm-600"/>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input type="checkbox" checked={permissions[m.id]?.edit || false} onChange={() => togglePermission(m.id, 'edit')} className="h-4 w-4 rounded border-slate-300 text-farm-600 focus:ring-farm-600"/>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input type="checkbox" checked={permissions[m.id]?.delete || false} onChange={() => togglePermission(m.id, 'delete')} className="h-4 w-4 rounded border-slate-300 text-farm-600 focus:ring-farm-600"/>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 sticky bottom-0">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Salvando..." : (
                    <span className="flex items-center gap-2"><Save className="h-4 w-4"/> Salvar Usuário</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
