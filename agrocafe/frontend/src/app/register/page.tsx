"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post('/auth/register', { name, email, password });
      
      // Auto login after register
      localStorage.setItem("@AgroCafe:token", data.access_token);
      localStorage.setItem("@AgroCafe:user", JSON.stringify(data.user));
      
      toast.success("Conta criada com sucesso! Bem-vindo ao AgroCerradoCafé.");
      router.push("/dashboard"); // Futura rota
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta. E-mail pode já estar em uso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Right panel - Form (reversed for variety) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 order-2 md:order-1">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex items-center gap-2 md:hidden mb-8">
            <div className="flex items-center justify-center rounded-lg">
              <Image src="/Logo-agrocafe.png" alt="AgroCafé logo" width={40} height={40} className="rounded-lg shadow-lg" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-coffee-600 dark:text-coffee-400">Cerrado</span><span className="text-farm-600 dark:text-farm-500">Café</span>
            </span>
          </div>

          <div>
            <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Crie sua conta</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Comece a gerenciar sua fazenda de forma inteligente hoje mesmo.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="João da Silva" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
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
                <Label htmlFor="password">Senha</Label>
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
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Ao criar uma conta, você concorda com nossos{" "}
              <Link href="#" className="underline hover:text-slate-900 dark:hover:text-white">Termos de Serviço</Link> e{" "}
              <Link href="#" className="underline hover:text-slate-900 dark:hover:text-white">Política de Privacidade</Link>.
            </p>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Já tem uma conta? </span>
            <Link href="/login" className="font-medium text-farm-600 hover:text-farm-500 dark:text-farm-400 transition-colors">
              Faça login
            </Link>
          </div>
        </div>
      </div>

      {/* Left panel - Image/Brand */}
      <div className="hidden md:flex flex-1 relative flex-col justify-between p-10 text-white overflow-hidden order-1 md:order-2">
        <div className="absolute inset-0 bg-coffee-900 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent z-10" />
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay z-0"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=2671&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </div>
        
        <div className="relative z-20 flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              Agro<span className="text-coffee-300">Cerrado</span><span className="text-farm-400">Café</span>
            </span>
            <div className="flex items-center justify-center rounded-lg">
              <Image src="/Logo-agrocafe.png" alt="AgroCafé logo" width={40} height={40} className="rounded-lg shadow-md" />
            </div>
          </div>
        </div>

        <div className="relative z-20 mt-auto max-w-lg text-right self-end">
          <h2 className="text-3xl font-bold mb-4">Transforme sua lavoura</h2>
          <p className="text-slate-300 text-lg">
            Deixe as planilhas complexas para trás e junte-se aos produtores que otimizaram sua gestão financeira.
          </p>
        </div>
      </div>
    </div>
  );
}
