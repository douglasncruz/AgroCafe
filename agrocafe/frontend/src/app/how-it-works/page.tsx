import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12">
      {/* Back button */}
      <div className="w-full max-w-5xl px-4 flex justify-start mb-6">
        <Link href="/" className="flex items-center gap-2 text-farm-600 hover:underline">
          <ArrowLeft className="h-5 w-5" />
          Voltar ao início
        </Link>
      </div>

      {/* Header */}
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 text-center">
        Como o AgroCafé funciona?
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl text-center mb-12">
        Conheça as principais funcionalidades da nossa plataforma que trazem controle, inteligência e segurança para a sua lavoura.
      </p>

      {/* Mockup image carousel – single slide for now */}
      <div className="w-full max-w-4xl mb-12">
        <Image
          src="/how_it_works_mockup_1778596806856.png"
          alt="Apresentação das funcionalidades do AgroCafé"
          width={1200}
          height={800}
          className="rounded-xl shadow-lg"
        />
      </div>

      {/* Feature list with icons */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl px-4">
        {[
          { icon: "📊", title: "Controle Financeiro", description: "Registre despesas e receitas, visualize fluxo de caixa em tempo real." },
          { icon: "🌱", title: "Gestão por Talhão", description: "Aloque custos e receitas por área, identifique os talhões mais lucrativos." },
          { icon: "📈", title: "Comparativo de Safras", description: "Analise histórico de produção, compare custos e produtividade entre ciclos." },
          { icon: "👥", title: "Controle de Fornecedores", description: "Cadastro completo e histórico de compras de insumos." },
          { icon: "🧠", title: "Categorização Inteligente", description: "Classifique gastos por tipo e descubra oportunidades de otimização." },
          { icon: "🔒", title: "Segurança de Dados", description: "Criptografia de ponta a ponta e backups automáticos diários." },
        ].map((f, i) => (
          <div key={i} className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
