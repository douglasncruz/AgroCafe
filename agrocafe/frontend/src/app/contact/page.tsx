"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  MessageCircle, 
  MapPin, 
  Coffee, 
  ArrowLeft, 
  Send,
  User,
  Globe
} from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de envio
    setTimeout(() => {
      toast.success("Mensagem enviada com sucesso! Douglas entrará em contato em breve.");
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

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
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-farm-900 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <Image 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop" 
              alt="Café no Cerrado" 
              fill 
              className="object-cover"
            />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Fale Conosco</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Estamos aqui para apoiar o produtor rural. Dúvidas, sugestões ou suporte técnico? Entre em contato diretamente com o nosso desenvolvedor.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 -mt-24 relative z-20">
            {/* Contact Cards */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-farm-100 dark:bg-farm-900/30 flex items-center justify-center text-farm-600 mb-6">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">E-mail</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Respostas em até 24h úteis</p>
              <a href="mailto:douglas.cruz@agrocerradocafe.com.br" className="text-farm-600 font-semibold hover:underline">
                douglas.cruz@agrocerradocafe.com.br
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-6">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">WhatsApp</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Suporte rápido e direto</p>
              <a href="https://wa.me/5511981699953" target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">
                (11) 98169-9953
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-coffee-100 dark:bg-coffee-900/30 flex items-center justify-center text-coffee-600 mb-6">
                <MapPin className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">Localização</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-2 text-sm">Patrocínio/MG</p>
              <p className="text-coffee-600 font-semibold">
                Capital Mundial do Café <br />
                Cerrado Mineiro
              </p>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-2 gap-16 items-start">
            {/* Contact Form */}
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Envie uma Mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="name" placeholder="Seu nome" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Como podemos ajudar?</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Descreva sua dúvida ou sugestão..." 
                    className="min-h-[150px] resize-none"
                    required
                  />
                </div>
                <Button variant="primary" size="xl" className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Enviando..." : (
                    <>
                      Enviar Mensagem
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Developer Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Sobre o Desenvolvedor</h2>
                <div className="flex items-start gap-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-farm-600 to-coffee-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                    DC
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Douglas Nunes da Cruz</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Especialista em tecnologia aplicada ao agronegócio, focado em transformar a complexidade das planilhas em soluções digitais inteligentes que geram lucro real para o produtor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                  <Globe className="h-6 w-6 text-farm-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Atuação</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Nacional com foco no Cerrado Mineiro</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                  <Coffee className="h-6 w-6 text-coffee-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Especialidade</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Gestão Financeira para Cafeicultura</p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-farm-50 dark:bg-farm-900/10 border border-farm-100 dark:border-farm-900/20">
                <h4 className="font-bold text-farm-900 dark:text-farm-400 mb-2">Patrocínio - MG</h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Orgulhosamente desenvolvendo soluções na Capital Mundial do Café para produtores que buscam excelência e tecnologia na lavoura.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-coffee-600">Cerrado</span><span className="text-farm-600">Café</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} AgroCerradoCafé. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
