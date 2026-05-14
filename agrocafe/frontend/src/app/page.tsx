import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Leaf, Sprout, LineChart, ShieldCheck, ChevronRight, BarChart3, Users, Smartphone, Coffee } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image src="/Logo-agrocafe.png" alt="AgroCafé logo" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agro<span className="text-farm-600 dark:text-farm-500">Café</span>
            </span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-farm-600 dark:text-slate-300 dark:hover:text-farm-500 transition-colors">
              Recursos
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-farm-600 dark:text-slate-300 dark:hover:text-farm-500 transition-colors">
              Como Funciona
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-farm-600 dark:text-slate-300 dark:hover:text-farm-500 transition-colors">
              Planos
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-farm-600 dark:text-slate-300 dark:hover:text-farm-500 transition-colors hidden sm:block">
              Entrar
            </Link>
            <Link href="/register">
              <Button variant="primary" className="rounded-full shadow-lg shadow-farm-600/20">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-farm-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950"></div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4 transform">
            <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-farm-200/40 to-coffee-200/40 blur-3xl dark:from-farm-900/20 dark:to-coffee-900/20"></div>
          </div>
          <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/3 translate-y-1/3 transform">
            <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-earth-200/40 to-farm-200/40 blur-3xl dark:from-earth-900/20 dark:to-farm-900/20"></div>
          </div>

          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto stagger-children">
              <div className="inline-flex items-center rounded-full border border-farm-200 bg-farm-50 px-3 py-1 text-sm font-medium text-farm-800 dark:border-farm-800/30 dark:bg-farm-900/30 dark:text-farm-300 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-farm-600 mr-2 animate-pulse"></span>
                O futuro da gestão cafeeira chegou
              </div>
              
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl mb-8">
                Gestão financeira <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-farm-600 to-coffee-600">
                  inteligente para sua lavoura
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl leading-relaxed">
                Transformando dados da lavoura em decisões inteligentes, produtividade e lucro. O AgroCafé substitui planilhas complexas por um sistema moderno, seguro e fácil de usar, focado no sucesso do produtor.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="xl" className="w-full rounded-full shadow-xl shadow-farm-600/20 group">
                    Criar Conta Grátis
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/how-it-works" className="w-full sm:w-auto">
                  <Button variant="outline" size="xl" className="w-full rounded-full bg-white/50 backdrop-blur-sm">
                    Ver como funciona
                  </Button>
                </Link>
              </div>

              <div className="mt-16 flex items-center justify-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-farm-500" />
                  Dados 100% Seguros
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-farm-500" />
                  Acesso de qualquer lugar
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-4">
                Tudo que você precisa para gerenciar sua fazenda
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Ferramentas projetadas especificamente para a realidade do produtor de café.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <LineChart className="h-8 w-8 text-farm-600" />,
                  title: "Controle Financeiro",
                  description: "Registre despesas e receitas com facilidade. Acompanhe o fluxo de caixa da sua propriedade em tempo real."
                },
                {
                  icon: <Sprout className="h-8 w-8 text-farm-600" />,
                  title: "Gestão por Talhão",
                  description: "Descubra quais talhões são mais lucrativos. Aloque custos e receitas por área da sua lavoura."
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-farm-600" />,
                  title: "Comparativo de Safras",
                  description: "Analise o desempenho histórico da sua produção. Compare custos e produtividade entre diferentes anos."
                },
                {
                  icon: <Users className="h-8 w-8 text-farm-600" />,
                  title: "Controle de Fornecedores",
                  description: "Mantenha o cadastro de fornecedores e controle as compras de insumos de forma organizada."
                },
                {
                  icon: <Leaf className="h-8 w-8 text-farm-600" />,
                  title: "Categorização Inteligente",
                  description: "Classifique seus gastos com insumos, mão de obra, maquinário e veja onde seu dinheiro está indo."
                },
                {
                  icon: <ShieldCheck className="h-8 w-8 text-farm-600" />,
                  title: "Segurança de Dados",
                  description: "Seus dados protegidos com criptografia de ponta a ponta e backups automáticos diários."
                }
              ].map((feature, index) => (
                <div key={index} className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900/50 hover:-translate-y-1">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-farm-50 dark:bg-farm-900/20 group-hover:bg-farm-100 dark:group-hover:bg-farm-900/40 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-farm-900/40 via-transparent to-coffee-900/40 mix-blend-overlay"></div>
          
          <div className="relative container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto glass border-slate-800/50 rounded-3xl p-8 md:p-16 backdrop-blur-xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Pronto para modernizar sua gestão?
              </h2>
              <p className="text-lg text-slate-300 mb-10">
                Junte-se a produtores que já estão aumentando a rentabilidade de suas lavouras com o AgroCafé.
              </p>
              <Link href="/register">
                <Button variant="primary" size="xl" className="rounded-full shadow-lg shadow-farm-500/20 px-8">
                  Comece Gratuitamente Hoje
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Coffee className="h-6 w-6 text-farm-600" />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Agro<span className="text-farm-600">Café</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} AgroCafé. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Termos
              </Link>
              <Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Contato
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
