"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Coffee, 
  ArrowLeft, 
  Send,
  User,
  Phone,
  Mail,
  Building2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de envio
    setTimeout(() => {
      toast.success("Solicitação enviada! Douglas entrará em contato para agendar sua demonstração.");
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-fade-in">
          <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Solicitação Enviada!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Obrigado pelo interesse no <strong>AgroCerradoCafé</strong>. Em breve o Douglas entrará em contato com você pelo WhatsApp ou E-mail para agendarmos a melhor data.
          </p>
          <Link href="/">
            <Button variant="primary" size="lg" className="rounded-xl w-full">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Logo-agrocafe.png" alt="AgroCerradoCafé logo" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-coffee-600 dark:text-coffee-400">Cerrado</span><span className="text-farm-600 dark:text-farm-500">Café</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Side: Info */}
        <div className="flex-1 bg-farm-900 text-white p-12 md:p-24 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Image 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop" 
              alt="Café" 
              fill 
              className="object-cover"
            />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight">
              Veja o poder da <br /> 
              <span className="text-farm-400">gestão digital</span> <br /> 
              na sua lavoura.
            </h1>
            <ul className="space-y-6 text-lg text-slate-300">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-farm-600 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                Demonstração personalizada das ferramentas de custos.
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-farm-600 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                Como transformar suas planilhas em dashboards inteligentes.
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-farm-600 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                Tire suas dúvidas técnicas com o Douglas Cruz.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-lg">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Solicite sua Demo</h2>
              <p className="text-slate-500">Preencha os campos abaixo e entraremos em contato.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input id="name" placeholder="Nome completo" className="pl-10 h-12 rounded-xl" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="whatsapp" placeholder="(00) 00000-0000" className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="email" type="email" placeholder="seu@email.com" className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm">Nome da Fazenda (Opcional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input id="farm" placeholder="Ex: Fazenda Santa Maria" className="pl-10 h-12 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Observação</Label>
                <Textarea id="note" placeholder="Conte-nos um pouco sobre sua necessidade..." className="min-h-[100px] rounded-xl resize-none" />
              </div>

              <Button variant="primary" size="xl" className="w-full rounded-xl shadow-lg shadow-farm-600/20 mt-4" disabled={loading}>
                {loading ? "Enviando..." : (
                  <>
                    Solicitar Demonstração Gratuitamente
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
