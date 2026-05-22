"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useHarvest } from "@/context/HarvestContext";
import { api } from "@/services/api";
import { UploadCloud, FlaskConical, AlertTriangle, ShieldCheck, Activity, Brain, Image as ImageIcon, CheckCircle2, ChevronRight, Bug, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiagnosisResult {
  disease: string;
  severity: string;
  confidence: number;
  technical_explanation: string;
  causes: string[];
  recommendations: string[];
}

interface DiagnosisHistory {
  id: string;
  image_base64: string;
  disease_name: string;
  severity: string;
  analysis_result: DiagnosisResult;
  created_at: string;
}

export default function DiagnosisPage() {
  const { selectedFarm } = useHarvest();
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<DiagnosisHistory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = useCallback(async () => {
    if (!selectedFarm) return;
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const res = await api.get(`/ai/diagnosis/history?farmId=${selectedFarm.id}`, token || "");
      setHistory(res);
    } catch (err) {
      console.error(err);
    }
  }, [selectedFarm]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const max_size = 800;

          if (width > height && width > max_size) {
            height *= max_size / width;
            width = max_size;
          } else if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress with 0.7 quality
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem (JPEG/PNG).");
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setSelectedImage(compressedBase64);
      setCurrentResult(null); // Clear previous result
    } catch (err) {
      toast.error("Erro ao processar imagem localmente.");
    }
  };

  const submitDiagnosis = async () => {
    if (!selectedImage) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("@AgroCafe:token");
      const result = await api.post("/ai/diagnosis", {
        farmId: selectedFarm?.id,
        imageBase64: selectedImage
      }, token || "");

      setCurrentResult(result);
      fetchHistory();
      toast.success("Análise concluída com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao analisar imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === 'ALTA' || s === 'CRITICAL') return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    if (s === 'MEDIA' || s === 'WARNING') return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
    if (s === 'BAIXA') return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
  };

  const getSeverityIcon = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === 'ALTA' || s === 'CRITICAL') return <AlertTriangle className="h-5 w-5" />;
    if (s === 'MEDIA' || s === 'WARNING') return <Activity className="h-5 w-5" />;
    if (s === 'BAIXA') return <Info className="h-5 w-5" />;
    return <ShieldCheck className="h-5 w-5" />;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Coluna Principal */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Diagnóstico IA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Envie fotos de folhas, frutos ou solo. A Inteligência Artificial com Visão Computacional analisará doenças, pragas e deficiências.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          {!selectedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-8 w-8 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Faça upload ou tire uma foto</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Arraste uma imagem ou clique para procurar. Funciona perfeitamente com a câmera do celular.
              </p>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2 relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                <img src={selectedImage} alt="Uploaded" className="w-full aspect-square object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); setCurrentResult(null); }}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                  disabled={loading}
                >
                  <UploadCloud className="h-4 w-4" />
                </button>
              </div>

              <div className="w-full md:w-1/2 flex flex-col justify-center min-h-[300px]">
                {loading ? (
                  <div className="flex flex-col items-center text-center space-y-4 animate-pulse">
                    <div className="relative">
                      <div className="h-20 w-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <Brain className="h-10 w-10 text-indigo-600 animate-bounce" />
                      </div>
                      <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">Visão Computacional Ativa...</h3>
                      <p className="text-sm text-slate-500 mt-1">Cruzando dados com bancos agronômicos...</p>
                    </div>
                  </div>
                ) : !currentResult ? (
                  <div className="flex flex-col items-center text-center">
                    <ImageIcon className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Imagem Pronta</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Clique no botão abaixo para processar a análise inteligente através do Gemini 1.5 Vision.
                    </p>
                    <button 
                      onClick={submitDiagnosis}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <FlaskConical className="h-5 w-5" />
                      Gerar Diagnóstico IA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className={`p-4 rounded-xl border ${getSeverityColor(currentResult.severity)} flex gap-4 items-start`}>
                      <div className="mt-1 flex-shrink-0">
                        {getSeverityIcon(currentResult.severity)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{currentResult.disease_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-80">Risco: {currentResult.severity}</span>
                          <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                          <span className="text-xs font-bold opacity-80">Confiança: {currentResult.analysis_result.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-sm border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {currentResult.analysis_result.technical_explanation}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentResult.analysis_result.causes && currentResult.analysis_result.causes.length > 0 && (
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1">
                            <Bug className="h-4 w-4 text-amber-500" /> Possíveis Causas
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            {currentResult.analysis_result.causes.map((c: string, i: number) => (
                              <li key={i} className="flex gap-2"><span className="text-slate-300">•</span> {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {currentResult.analysis_result.recommendations && currentResult.analysis_result.recommendations.length > 0 && (
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> O que Fazer
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            {currentResult.analysis_result.recommendations.map((r: string, i: number) => (
                              <li key={i} className="flex gap-2"><span className="text-slate-300">•</span> {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest mt-4">
                      Aviso: Diagnóstico automatizado gerado por IA. Consulte um agrônomo para confirmação.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Lateral */}
      <div className="w-full lg:w-80 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Histórico da Fazenda</h2>
        
        {history.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
            <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhuma análise realizada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {history.map(item => (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedImage(item.image_base64);
                  setCurrentResult(item);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex gap-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
              >
                <img 
                  src={item.image_base64} 
                  alt="Histórico" 
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4">{item.disease_name}</h4>
                  <p className="text-xs text-slate-500">{format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-sm inline-block w-fit ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 self-center group-hover:text-indigo-500" />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
