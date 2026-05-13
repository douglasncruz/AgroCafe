"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      
      // Armazena no localStorage
      localStorage.setItem("@AgroCafe:token", data.access_token);
      localStorage.setItem("@AgroCafe:user", JSON.stringify(data.user));
      
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard"); // Futura rota
    } catch (err: any) {
      toast.error(err.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Left panel - Image/Brand */}
      <div className="hidden md:flex flex-1 relative flex-col justify-between p-10 text-white overflow-hidden">
        <div className="absolute inset-0 bg-farm-900 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent z-10" />
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay z-0"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2574&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </div>
        
        <div className="relative z-20 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
            <Coffee className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Agro<span className="text-farm-400">Café</span>
          </span>
        </div>

        <div className="relative z-20 mt-auto max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Bem-vindo de volta à sua fazenda digital</h2>
          <p className="text-slate-300 text-lg">
            Acesse seus dados financeiros, controle seus talhões e acompanhe a evolução da sua safra de onde estiver.
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex items-center gap-2 md:hidden mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-farm-600 text-white shadow-lg shadow-farm-600/20">
              <Coffee className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-farm-600 dark:text-farm-500">Café</span>
            </span>
          </div>

          <div>
            <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Acesse sua conta</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Insira seu email e senha para acessar o painel.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@exemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-farm-600 hover:text-farm-500 dark:text-farm-400">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Não tem uma conta? </span>
            <Link href="/register" className="font-medium text-farm-600 hover:text-farm-500 dark:text-farm-400 transition-colors">
              Crie uma conta gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
