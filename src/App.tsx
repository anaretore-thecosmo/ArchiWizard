/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Check, 
  Home,
  Building2, 
  Info, 
  Upload, 
  Link as LinkIcon, 
  DollarSign, 
  User, 
  FileText, 
  Layers, 
  Calculator,
  Download,
  Share2,
  Trash2,
  Image as ImageIcon,
  History,
  Save,
  Menu,
  X,
  Stethoscope,
  Mic,
  Scan,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Activity,
  BarChart3,
  Clock,
  ListTodo,
  PieChart,
  LayoutDashboard,
  Zap,
  Copy,
  Sparkles,
  Maximize2,
  Layout
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectData, INITIAL_DATA, JourneyType } from './types';
import { PROJECT_TYPES, PROJECT_JOURNEYS, ENVIRONMENTS, DATA_ENTRY_METHODS, REFERENCE_STYLES } from './constants';
import { getArchitecturalStyleSuggestions, ArchitecturalStyle, generateProjectDossier, ProjectDossier } from './services/geminiService';
import { Viewer3D } from './components/Viewer3D';

const TEST_CASES: Record<string, Partial<ProjectData>> = {
  residencial: {
    name: 'Mansão Horizonte (Teste)',
    journey: 'residential',
    briefing: {
      objectives: 'Residência contemporânea de alto padrão para família de 4 pessoas. Foco em integração e eficiência térmica.',
      spatialIdentity: 'Quero uma casa que misture o rústico com o moderno. Algo "casa de campo encontra SP". Muito concreto aparente, madeira de demolição, mas com vidros grandes e automação. O modo de vida é focado em receber amigos e gastronomia.',
      estimatedMetragem: 220,
      technicalRisks: [],
      legalRequirements: []
    },
    environments: ['Living Gourmet', 'Master Suite', 'Home Office', 'Cozinha', 'Área de Lazer'],
    references: {
      links: [],
      images: [],
      styles: ['inspirado'],
      roomSpecificReferences: {
        'Sala': 'Design minimalista, tons de cinza, mobiliário baixo e muita luz.',
        'Suíte': 'Estilo boho romântico, fibras naturais, dossel na cama e muitas plantas.',
        'Gourmet': 'Linguagem industrial pesada, aço corten, concreto bruto e banquetas de ferro.',
        'Banheiro': 'Estilo escandinavo, madeira clara e mármore branco.',
        'maintenance': 'low'
      }
    },
    budget: { maxValue: 850000, costPerM2: 3800, minM2: 180, maxM2: 250 },
    step: 7 // Jump to generation logic
  },
  clinica: {
    name: 'Fisiocore Centro Médico (Teste)',
    journey: 'health',
    briefing: {
      objectives: 'Reforma de sala comercial para clínica de fisioterapia. Necessidade de 3 boxes de atendimento e área de pilates.',
      spatialIdentity: 'Clínica com ar de spa. Fugir do "hospitalar branco". Tons de areia, texturas naturais, muita planta. Precisa passar calma mas ser extremamente fácil de limpar (materiais higienizáveis que não pareçam frios). Foco em pacientes premium.',
      estimatedMetragem: 85,
      technicalRisks: [],
      legalRequirements: ['Acessibilidade RDC 50']
    },
    environments: ['Recepção', 'Salas de Atendimento', 'Estúdio Pilates', 'Copa', 'Banheiro PCD'],
    references: {
      links: [],
      images: [],
      styles: ['inspirado'],
      selectedStylePrimary: 'orgânico',
      roomSpecificReferences: {
        'Recepção': 'Linguagem contemporânea clean, balcão de madeira marfim, poltronas em linho e iluminação quente.',
        'Salas de Atendimento': 'Linguagem rústica e leve, piso vinílico amadeirado e paredes areia laváveis.',
        'Estúdio Pilates': 'Design minimalista e natural, espelho amplo, piso emborrachado acolhedor e plantas suspensas.',
        'Banheiro PCD': 'Totalmente higienizável e clean, concreto queimado e metais pretos.',
        'maintenance': 'low'
      }
    },
    budget: { maxValue: 120000, costPerM2: 1400, minM2: 70, maxM2: 100 },
    step: 7
  },
  podcast: {
    name: 'EcoSom Podcast Rural (Teste)',
    journey: 'podcast',
    briefing: {
      objectives: 'Estúdio de gravação profissional em área rural. Foco total em isolamento acústico contra barulhos externos (animais/vento).',
      spatialIdentity: 'Estúdio "Ninho". Quero me sentir dentro de uma cabana, mas com tecnologia de ponta. Revestimentos em lã de rocha cobertos por tecidos orgânicos (linho). Iluminação RGB controlável mas que no dia-a-dia seja quente e acolhedora. Piso em cimento queimado para evitar ruído de sapato.',
      estimatedMetragem: 35,
      technicalRisks: ['Interferência externa rural'],
      legalRequirements: []
    },
    environments: ['Estúdio A', 'Técnica/Edição', 'Área de Descompressão'],
    references: {
      links: [],
      images: [],
      styles: ['inspirado'],
      selectedStylePrimary: 'industrial',
      roomSpecificReferences: {
        'Estúdio A': 'Cabana de madeira escura com painéis acústicos cinza chumbo, iluminação neon quente.',
        'Técnica/Edição': 'Estilo brutalista, mesa de metal, cadeiras premium e concreto aparente.',
        'Área de Descompressão': 'Estilo rústico-industrial, sofás terracota e bar de café em ferro.',
        'maintenance': 'durability'
      }
    },
    budget: { maxValue: 45000, costPerM2: 1300, minM2: 25, maxM2: 40 },
    step: 7
  }
};

// --- Helper Components ---

function normalizeProjectData(project: any): ProjectData {
  const normBriefing = {
    objectives: '',
    spatialIdentity: '',
    technicalRisks: [],
    legalRequirements: [],
    estimatedMetragem: 0,
    terrainArea: undefined,
    terrainFormat: '',
    occupants: 1,
    useFengShui: false,
    ...(project?.briefing || {})
  };

  if (!Array.isArray(normBriefing.technicalRisks)) normBriefing.technicalRisks = [];
  if (!Array.isArray(normBriefing.legalRequirements)) normBriefing.legalRequirements = [];

  const normReferences = {
    links: [],
    images: [],
    styles: ['inspirado'],
    selectedStylePrimary: 'minimalista',
    roomSpecificReferences: {},
    ...(project?.references || {})
  };

  if (!Array.isArray(normReferences.links)) normReferences.links = [];
  if (!Array.isArray(normReferences.images)) normReferences.images = [];
  if (!Array.isArray(normReferences.styles)) normReferences.styles = ['inspirado'];
  if (!normReferences.roomSpecificReferences) normReferences.roomSpecificReferences = {};

  const normBudget = {
    maxValue: 100000,
    costPerM2: 2500,
    minM2: 40,
    maxM2: 200,
    ...(project?.budget || {})
  };

  return {
    id: project?.id || crypto.randomUUID(),
    name: project?.name || 'Novo Projeto',
    step: typeof project?.step === 'number' ? project.step : 0,
    journey: project?.journey || 'residential',
    type: project?.type || '',
    environments: Array.isArray(project?.environments) ? project.environments : [],
    dataEntryMethods: Array.isArray(project?.dataEntryMethods) ? project.dataEntryMethods : [],
    briefing: normBriefing as any,
    references: normReferences as any,
    budget: normBudget,
    professionals: project?.professionals || {},
    results: project?.results || undefined,
    validationAnswers: project?.validationAnswers || undefined,
    coverImage: project?.coverImage
  };
}

function DiscoveryAtmosphere({ data }: { data: ProjectData }) {
   if (!data || data.step < 2 || data.step >= 7) return null;
   
   const vibe = data.references?.roomSpecificReferences?.['globalVibe'];
   const color = vibe === 'minimalist' ? 'bg-slate-200' : vibe === 'organic' ? 'bg-emerald-800' : vibe === 'industrial' ? 'bg-slate-800' : 'bg-brand-primary';
   const envs = data.environments || [];
   
   return (
     <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-50">
        <motion.div 
          layout
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex items-center justify-between gap-6 pointer-events-auto"
        >
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-1000 shrink-0`}>
                 <Sparkles className="text-white" size={24} />
              </div>
              <div className="overflow-hidden">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atmosfera em Construção</h4>
                 <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                    {vibe === 'minimalist' ? 'Essência Minimalista' : vibe === 'organic' ? 'Vitalidade Orgânica' : vibe === 'industrial' ? 'Força Industrial' : 'Expressão em Definição'}
                 </p>
              </div>
           </div>
           <div className="flex -space-x-2 shrink-0">
              {envs.slice(0, 3).map((e, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm uppercase">
                   {e[0]}
                </div>
              ))}
              {envs.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[8px] font-black text-white shadow-sm">+</div>
              )}
              {envs.length === 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-dashed bg-slate-50" />
              )}
           </div>
        </motion.div>
     </div>
   );
}

export default function App() {
  const [data, setData] = useState<ProjectData>(() => {
    const saved = localStorage.getItem('archiwizard_current_project');
    try {
      if (saved) {
        return normalizeProjectData(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading current project from localStorage:', e);
    }
    return normalizeProjectData({ ...INITIAL_DATA, id: crypto.randomUUID(), step: 0 });
  });
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>(() => {
    const saved = localStorage.getItem('archiwizard_history');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(p => normalizeProjectData(p));
        }
      }
    } catch (e) {
      console.error('Error loading project history from localStorage:', e);
    }
    return [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const nextStep = () => setData(prev => normalizeProjectData({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setData(prev => normalizeProjectData({ ...prev, step: Math.max(1, prev.step - 1) }));

  const updateData = (updates: Partial<ProjectData>) => {
    setData(prev => {
      const newData = normalizeProjectData({ ...prev, ...updates });
      localStorage.setItem('archiwizard_current_project', JSON.stringify(newData));
      return newData;
    });
  };

  const saveCurrentProject = () => {
    setSavedProjects(prev => {
      const filtered = prev.filter(p => p.id !== data.id);
      const newHistory = [data, ...filtered];
      localStorage.setItem('archiwizard_history', JSON.stringify(newHistory));
      return newHistory.map(p => normalizeProjectData(p));
    });
  };

  const loadProject = (project: ProjectData) => {
    const normalized = normalizeProjectData(project);
    setData(normalized);
    localStorage.setItem('archiwizard_current_project', JSON.stringify(normalized));
    setShowHistory(false);
  };

  const deleteProject = (id: string) => {
    setSavedProjects(prev => {
      const newHistory = prev.filter(p => p.id !== id);
      localStorage.setItem('archiwizard_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const startNewProject = () => {
    const newProject = normalizeProjectData({ ...INITIAL_DATA, id: crypto.randomUUID(), step: 0 });
    setData(newProject);
    localStorage.setItem('archiwizard_current_project', JSON.stringify(newProject));
    setShowHistory(false);
  };

  const handleConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  useEffect(() => {
    if (data.step === 10) {
      handleConfetti();
    }
  }, [data.step]);

  // Simulated Generation Effect
  useEffect(() => {
    if (data.step === 8) {
      setIsGenerating(true);
      const timer = setTimeout(async () => {
        const dossier = await generateProjectDossier(data);
        setIsGenerating(false);
        updateData({
          results: {
            plan2D: 'https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=800',
            visual3D: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
            materials: [
              { name: 'Cimento (Sacos)', quantity: '120', price: 35 },
              { name: 'Tijolos', quantity: '5000', price: 0.8 },
              { name: 'Argamassa', quantity: '40', price: 25 },
              { name: 'Pinta Acrílica (Branca)', quantity: '5', price: 180 },
            ],
            estimatedTotal: data.budget.costPerM2 * (data.budget.minM2 + data.budget.maxM2) / 2,
            dossier
          }
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data.step]);

  const renderStep = () => {
    switch (data.step) {
      case 0: return <StepZero onSelectCase={(preset) => updateData({ ...preset })} onStartNew={nextStep} />;
      case 1: return <StepJourney data={data} updateData={updateData} onNext={nextStep} />;
      case 2: return <StepVision data={data} updateData={updateData} />;
      case 3: return <StepDimensioning data={data} updateData={updateData} />;
      case 4: return <StepLife data={data} updateData={updateData} />;
      case 5: return <StepHarmonization data={data} updateData={updateData} />;
      case 6: return <StepSoul data={data} updateData={updateData} />;
      case 7: return <StepReview data={data} updateData={updateData} />;
      case 8: return <StepGeracao isGenerating={isGenerating} data={data} updateData={updateData} />;
      case 9: return <StepDashboard data={data} updateData={updateData} />;
      case 10: return <StepDossier data={data} />;
      case 11: return <StepCalculadora data={data} />;
      case 12: return <StepFinal data={data} onNext={nextStep} />;
      case 13: return <StepValidacao data={data} updateData={updateData} />;
      default: return null;
    }
  };

  const progress = (data.step / 8) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans selection:bg-brand-accent/20 overflow-x-hidden pb-32">
      {/* History Sidebar/Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <History className="text-brand-accent" size={20} />
                  <h2 className="text-xl font-bold text-slate-800">Meus Projetos</h2>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-wrap">
                <button 
                  onClick={startNewProject}
                  className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-brand-accent hover:border-brand-accent transition-all font-bold"
                >
                  <Plus size={20} /> Novo Projeto
                </button>

                {savedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">Nenhum projeto salvo ainda.</p>
                  </div>
                ) : (
                  savedProjects.map(project => (
                    <div 
                      key={project.id}
                      className={`group p-4 rounded-2xl border-2 transition-all relative flex gap-3 ${
                        data.id === project.id ? 'border-brand-accent bg-brand-accent/5' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {project.coverImage && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                          <img src={project.coverImage} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <button 
                        onClick={() => loadProject(project)}
                        className="flex-1 text-left pr-8"
                      >
                        <h3 className="font-bold text-slate-800 truncate leading-tight">{project.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {PROJECT_JOURNEYS.find(j => j.id === project.journey)?.label || 'Aguardando Tipo...'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Etapa {project.step} / 12</p>
                      </button>
                      <button 
                        onClick={() => deleteProject(project.id)}
                        className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DiscoveryAtmosphere data={data} />

      {/* Header */}
      <header className="w-full max-w-2xl mb-8 flex items-center justify-between bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-white">
        <button 
          onClick={() => updateData({ step: 0 })}
          className="flex items-center gap-3 group"
        >
          <div className="bg-slate-900 p-2.5 rounded-2xl text-brand-accent shadow-lg shadow-slate-900/20 group-hover:bg-brand-primary transition-colors">
            <Building2 size={20} />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase">ArchiWizard<span className="text-brand-accent">.</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-1">Discovery Journey</p>
          </div>
        </button>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 hover:text-brand-accent transition-all active:scale-95"
          title="Ver Projetos Salvos"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-12">
         <div className="flex justify-between items-end mb-3 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso da Descoberta</span>
            <span className="text-xs font-black text-slate-900">{Math.round(progress)}%</span>
         </div>
         <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="h-full bg-brand-primary rounded-full transition-all duration-700"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
         </div>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden min-h-[500px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={data.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center bg-white">
          <div className="flex gap-2">
            {data.step > 1 && data.step < 8 && (
              <button 
                onClick={prevStep}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-medium text-sm px-4 py-2"
              >
                <ChevronLeft size={18} />
                Voltar
              </button>
            )}
            
            {data.step < 8 && (
              <button 
                onClick={saveCurrentProject}
                className="flex items-center gap-2 text-slate-300 hover:text-brand-accent transition-colors font-medium text-xs px-2 py-2"
                title="Salvar progresso"
              >
                <Save size={16} />
                <span className="hidden sm:inline">Salvar</span>
              </button>
            )}
          </div>
          
          {data.step < 8 && (
            <button 
              onClick={nextStep}
              disabled={data.step === 1 && !data.type}
              className="ml-auto bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-brand-accent/25 active:scale-95"
            >
              {data.step === 7 ? 'Gerar Projeto' : 'Próximo'}
              <ChevronRight size={18} />
            </button>
          )}

          {data.step >= 8 && data.step < 13 && !isGenerating && (
             <button 
              onClick={nextStep}
              className="ml-auto bg-brand-accent hover:bg-brand-accent/90 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-brand-accent/25 active:scale-95"
            >
              {data.step === 12 ? 'Validar Projeto' : data.step === 10 ? 'Ver Análise Financeira' : 'Continuar'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="mt-8 text-slate-400 text-xs flex items-center gap-4">
        <span>ArchiWizard MVP &copy; 2026</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
          <span>Sistema Ativo</span>
        </div>
      </footer>
    </div>
  );
}

// --- Step Components ---

function StepJourney({ data, updateData, onNext }: { data: ProjectData, updateData: any, onNext: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Qual é o foco da sua jornada?</h2>
        <p className="text-slate-500">Selecione uma jornada inteligente para personalizar sua experiência.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação do Projeto</label>
        <input 
          type="text" 
          placeholder="Ex: Reforma do Studio X"
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-brand-accent/30 font-bold text-slate-700"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
        />
      </div>

      <div className="grid gap-3">
        {PROJECT_JOURNEYS.map((j) => {
          const Icon = j.icon;
          const isActive = data.journey === j.id;
          return (
            <button
              key={j.id}
              onClick={() => {
                updateData({ journey: j.id, type: j.id });
                // Reset some data if journey changes
                if (data.journey !== j.id) {
                  updateData({ environments: [] });
                }
              }}
              className={`flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all group ${
                isActive ? 'border-brand-primary bg-brand-primary/5 ring-4 ring-brand-primary/10' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`p-3 rounded-2xl ${isActive ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-base ${isActive ? 'text-brand-primary' : 'text-slate-700'}`}>{j.label}</h3>
                <p className="text-slate-500 text-xs">{j.description}</p>
              </div>
              {isActive && <div className="bg-brand-primary text-white p-1 rounded-full"><Check size={14} /></div>}
            </button>
          );
        })}
      </div>
      
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
        <AlertTriangle size={18} className="text-amber-500 shrink-0" />
        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
          <strong>Lembre-se:</strong> O ArchiWizard é um simulador para briefing e decisão estética. Ele não substitui o projeto executivo assinado por profissionais habilitados.
        </p>
      </div>
    </div>
  );
}

function StepVision({ data, updateData }: { data: ProjectData, updateData: any }) {
  const currentJourney = PROJECT_JOURNEYS.find(j => j.id === data.journey);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">A Visão do Seu Espaço</h2>
        <p className="text-slate-500 font-medium">Deixe a burocracia de lado e nos conte como você imagina viver nesse lugar.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-slate-100 px-2 py-0.5 rounded">O que você deseja alcançar?</label>
          <div className="relative group">
            <textarea 
              placeholder="Ex: Quero um refúgio para minha família, onde a luz natural entre por todos os lados e as crianças possam brincar livremente..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 py-5 outline-none focus:border-brand-primary/30 font-medium text-slate-700 min-h-[140px] text-base transition-all resize-none shadow-inner"
              value={data.briefing.objectives}
              onChange={(e) => updateData({ briefing: { ...data.briefing, objectives: e.target.value } })}
            />
            <div className="absolute bottom-4 right-4 opacity-20 group-focus-within:opacity-40 transition-opacity">
               <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="bg-brand-primary/5 rounded-[3rem] p-8 border-2 border-brand-primary/10 relative overflow-hidden group">
           <div className="absolute -right-12 -top-12 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl group-hover:bg-brand-primary/20 transition-all duration-700" />
           
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                 <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Identidade Espacial</h3>
                <p className="text-xs text-slate-500 font-bold">Qual é o "vibe" do projeto?</p>
              </div>
           </div>
           
           <textarea 
            placeholder="Ex: Uma mistura rústica de casa de campo com o design moderno de SP. Muito concreto, madeira e vidro..."
            className="w-full bg-white border-2 border-slate-200/50 rounded-2xl px-6 py-5 outline-none focus:border-brand-primary/30 font-medium text-slate-700 min-h-[120px] placeholder:text-slate-300 text-sm shadow-sm"
            value={data.briefing.spatialIdentity}
            onChange={(e) => updateData({ briefing: { ...data.briefing, spatialIdentity: e.target.value } })}
          />
          
          <div className="mt-6 flex flex-wrap gap-2">
             {['Minimalista', 'Acolhedor', 'Industrial', 'Orgânico', 'Luxuoso', 'Funcional'].map(tag => (
               <button 
                 key={tag}
                 onClick={() => {
                   const current = data.briefing.spatialIdentity || '';
                   if (!current.includes(tag)) {
                     updateData({ briefing: { ...data.briefing, spatialIdentity: current ? `${current}, ${tag}` : tag } });
                   }
                 }}
                 className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-slate-500 hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95 shadow-sm"
               >
                 + {tag}
               </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
           <Zap className="text-emerald-500" size={20} />
           <p className="text-xs font-bold text-emerald-800">Dica: Descreva sensações (conforto, calma) além de materiais.</p>
        </div>
      </div>
    </div>
  );
}

function StepDimensioning({ data, updateData }: { data: ProjectData, updateData: any }) {
  const DIMENSION_TIERS = [
    { id: 'compact', label: 'Compacto', icon: User, desc: 'Foco no essencial, ideal para eficiência máxima.', multiplier: 0.8, range: '40 - 80m²' },
    { id: 'comfortable', label: 'Confortável', icon: Layout, desc: 'Equilíbrio ideal entre espaço e circulação.', multiplier: 1.2, range: '90 - 150m²' },
    { id: 'ample', label: 'Amplo', icon: Maximize2, desc: 'Ambientes generosos e protagonismo espacial.', multiplier: 1.8, range: '180m²+' },
  ];

  const terrainArea = data.briefing.terrainArea || 0;
  const occupants = data.briefing.occupants || 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">A Proporção Ideal</h2>
        <p className="text-slate-500 font-medium tracking-tight">Como esse espaço deve acolher as pessoas e o terreno?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Área do Terreno (m²)</label>
            <div className="relative">
              <input 
                type="number" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-accent/30 font-black text-xl text-slate-700 pr-12 shadow-inner"
                value={data.briefing.terrainArea || ''}
                onChange={(e) => updateData({ briefing: { ...data.briefing, terrainArea: Number(e.target.value) } })}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">m²</span>
            </div>
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pessoas que usarão o espaço</label>
            <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl">
               <button 
                onClick={() => updateData({ briefing: { ...data.briefing, occupants: Math.max(1, (data.briefing.occupants || 1) - 1) } })}
                className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-brand-primary transition-colors shadow-sm"
               >-</button>
               <div className="flex-1 text-center">
                  <span className="text-xl font-black text-slate-800">{data.briefing.occupants || 1}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Residentes</span>
               </div>
               <button 
                onClick={() => updateData({ briefing: { ...data.briefing, occupants: (data.briefing.occupants || 1) + 1 } })}
                className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-brand-primary transition-colors shadow-sm"
               >+</button>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intensidade de Espaço</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {DIMENSION_TIERS.map((tier) => {
             const Icon = tier.icon;
             const isSelected = data.budget.costPerM2 > 0 && Math.abs(data.budget.minM2 - (occupants * 25 * tier.multiplier)) < 20; // Simulated selection logic
             
             return (
               <button
                 key={tier.id}
                 onClick={() => {
                   const base = occupants * 30;
                   const min = Math.round(base * tier.multiplier);
                   const max = Math.round(min * 1.3);
                   updateData({ 
                     briefing: { ...data.briefing, estimatedMetragem: min },
                     budget: { ...data.budget, minM2: min, maxM2: max }
                   });
                 }}
                 className={`p-6 rounded-[2.5rem] border-4 text-left transition-all ${
                   data.briefing.estimatedMetragem && Math.abs(data.briefing.estimatedMetragem - Math.round(occupants * 30 * tier.multiplier)) < 10
                   ? 'border-brand-primary bg-white shadow-xl -translate-y-1' 
                   : 'border-slate-100 bg-slate-50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                 }`}
               >
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                   isSelected ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500'
                 }`}>
                    <Icon size={24} />
                 </div>
                 <h3 className="font-black text-slate-800 uppercase tracking-tight">{tier.label}</h3>
                 <p className="text-[10px] text-slate-500 leading-tight mt-1 mb-3 font-bold">{tier.desc}</p>
                 <div className="bg-slate-100 px-3 py-1.5 rounded-full inline-block">
                    <span className="text-[10px] font-black text-slate-700">{tier.range} sugeridos</span>
                 </div>
               </button>
             );
           })}
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
         <div className="flex justify-between items-end relative z-10">
            <div>
               <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest block mb-2">Escala Humana vs Espaço</span>
               <h4 className="text-lg font-black italic">Tradução Visual</h4>
            </div>
            <div className="text-right">
               <span className="text-4xl font-black text-brand-accent">{data.briefing.estimatedMetragem || 0}</span>
               <span className="text-sm font-black ml-2 text-slate-400">m² Estimados</span>
            </div>
         </div>
         
         <div className="mt-8 flex items-end gap-1 h-24">
            {/* Visual Scale representation */}
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-lg transition-all duration-500 ${
                  i < (data.briefing.estimatedMetragem || 0) / 15 
                  ? 'bg-brand-accent' 
                  : 'bg-white/10'
                }`}
                style={{ height: `${20 + (i * 5)}%` }}
              />
            ))}
         </div>
         <div className="mt-4 flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-widest">
            <span>Compacto (Solo)</span>
            <span>Equilibrado (Família)</span>
            <span>Monumental (Gourmet)</span>
         </div>
      </div>
    </div>
  );
}

function StepLife({ data, updateData }: { data: ProjectData, updateData: any }) {
  const options = ENVIRONMENTS[data.journey as keyof typeof ENVIRONMENTS] || [];

  const toggleEnv = (env: string) => {
    const next = data.environments.includes(env)
      ? data.environments.filter(e => e !== env)
      : [...data.environments, env];
    updateData({ environments: next });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">A Vida no Espaço</h2>
        <p className="text-slate-500 font-medium">Selecione as experiências que farão parte do seu dia a dia.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((env) => {
          const isActive = data.environments.includes(env);
          return (
            <button
              key={env}
              onClick={() => toggleEnv(env)}
              className={`flex flex-col gap-4 p-6 rounded-[2.5rem] border-4 text-left transition-all group relative overflow-hidden ${
                isActive 
                  ? 'border-brand-primary bg-white shadow-xl -translate-y-1' 
                  : 'border-slate-100 bg-slate-50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-200 text-slate-400'
              }`}>
                {isActive ? <Check size={24} /> : <Plus size={20} />}
              </div>
              <div>
                 <h3 className={`font-black text-slate-800 uppercase tracking-tight text-sm ${isActive ? '' : 'text-slate-400'}`}>{env}</h3>
              </div>
              {isActive && (
                <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10">
                   <Home size={64} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {data.environments.length > 0 && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
           <div className="flex items-center gap-3 mb-6">
              <Activity className="text-brand-accent" size={20} />
              <h4 className="text-sm font-black uppercase tracking-widest text-brand-accent">Layout Funcional Estimado</h4>
           </div>
           <div className="space-y-4">
              {data.environments.map((env, i) => (
                <div key={env} className="flex items-center gap-4 group">
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                   <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-bold">{env}</span>
                         <span className="text-[10px] font-black text-slate-500">12% da área</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          className="h-full bg-brand-accent"
                         />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

function StepHarmonization({ data, updateData }: { data: ProjectData, updateData: any }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">Fragmentos & Harmonização</h2>
        <p className="text-slate-500 font-medium tracking-tight">Personalize o que você imagina para cada ambiente selecionado.</p>
      </div>

      <div className="space-y-6">
        {data.environments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">Nenhum ambiente selecionado anteriormente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.environments.map((env) => (
              <div key={env} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center font-black uppercase text-[10px]">
                      {env.substring(0, 2)}
                   </div>
                   <h3 className="font-black text-slate-800 uppercase tracking-tight">{env}</h3>
                </div>
                <div className="relative group">
                  <textarea 
                    placeholder={`Descreva sua visão para o/a ${env}... Ex: Quero uma linguagem industrial, com tijolinhos e iluminação focal.`}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-brand-primary/30 font-medium text-slate-700 min-h-[100px] text-sm resize-none shadow-inner"
                    value={data.references.roomSpecificReferences?.[env] || ''}
                    onChange={(e) => {
                      const nextRefs = { ...data.references.roomSpecificReferences, [env]: e.target.value };
                      updateData({ references: { ...data.references, roomSpecificReferences: nextRefs } });
                    }}
                  />
                  <div className="absolute top-3 right-3 opacity-10 group-focus-within:opacity-30">
                     <FileText size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-brand-primary/5 rounded-[3rem] p-8 border-2 border-brand-primary/10">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white text-brand-primary rounded-2xl flex items-center justify-center shadow-sm">
                 <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block mb-1">Harmonização Automática IA</span>
                <p className="text-xs text-slate-500 font-bold italic">Nosso motor de análise detectará conflitos entre os ambientes acima e sugerirá uma linguagem coerente.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StepSoul({ data, updateData }: { data: ProjectData, updateData: any }) {
  const STYLES = ['rústico', 'boho', 'praiano', 'contemporâneo', 'industrial', 'orgânico', 'mediterrâneo', 'minimalista'];
  const MATERIALS = ['concreto', 'pedra', 'madeira', 'fibras naturais', 'cimento queimado', 'vidro', 'metais'];
  const LANGUAGES = ['clean', 'sofisticada', 'natural', 'acolhedora', 'brutalista', 'leve', 'tecnológica'];
  const MAINTENANCE = [
    { id: 'low', label: 'Baixa Manutenção', icon: Zap },
    { id: 'durability', label: 'Alta Durabilidade', icon: FileCheck },
    { id: 'natural', label: 'Materiais Naturais', icon: Home },
    { id: 'resistance', label: 'Resistência Climática', icon: Building2 }
  ];

  const toggleList = (field: string, val: string) => {
    const current = (data.briefing as any)[field] || [];
    const next = current.includes(val) ? current.filter((v: string) => v !== val) : [...current, val];
    updateData({ briefing: { ...data.briefing, [field]: next } });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">A Alma do Projeto</h2>
        <p className="text-slate-500 font-medium tracking-tight">Linguagem, materiais e o espírito do seu espaço.</p>
      </div>

      <div className="space-y-10">
        {/* Dominant Style */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 px-2 py-0.5 rounded border border-slate-100 italic">Estilo Dominante Desejado</label>
           <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => updateData({ references: { ...data.references, selectedStylePrimary: style } })}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    data.references.selectedStylePrimary === style 
                    ? 'bg-brand-primary text-white shadow-lg' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
           </div>
        </div>

        {/* Predominant Materials */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 px-2 py-0.5 rounded border border-slate-100 italic">Materiais Predominantes</label>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MATERIALS.map((mat) => {
                const isActive = data.briefing.technicalRisks?.includes(mat);
                return (
                  <button
                    key={mat}
                    onClick={() => toggleList('technicalRisks', mat)}
                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-tight transition-all text-center ${
                      isActive ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                  >
                    {mat}
                  </button>
                );
              })}
           </div>
        </div>

        {/* Visual Language */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 px-2 py-0.5 rounded border border-slate-100 italic">Linguagem Visual</label>
           <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const isActive = data.briefing.legalRequirements?.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleList('legalRequirements', lang)}
                    className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                      isActive ? 'border-brand-accent bg-brand-accent/5 text-brand-accent' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
           </div>
        </div>

        {/* Maintenance */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 px-2 py-0.5 rounded border border-slate-100 italic">Manutenção & Durabilidade</label>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAINTENANCE.map((m) => {
                const isActive = data.references.roomSpecificReferences?.['maintenance'] === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      const nextRefs = { ...data.references.roomSpecificReferences, maintenance: m.id };
                      updateData({ references: { ...data.references, roomSpecificReferences: nextRefs } });
                    }}
                    className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                      isActive ? 'border-brand-primary bg-white shadow-xl' : 'border-slate-50 bg-slate-50 text-slate-400 opacity-40'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                       <Icon size={18} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-slate-800' : ''}`}>{m.label}</span>
                  </button>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
}

function StepReview({ data, updateData }: { data: ProjectData, updateData: any }) {
  const estimatedTotal = (data.budget.costPerM2 || 3500) * (data.briefing.estimatedMetragem || 100);
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">Revisão do Investimento</h2>
        <p className="text-slate-500 font-medium tracking-tight">Estamos prontos? Vamos conferir os números.</p>
      </div>

      <div className="bg-white border-4 border-slate-900 rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
         <div className="absolute right-0 top-0 p-8 opacity-5">
            <DollarSign size={120} />
         </div>
         
         <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estimativa de Investimento (Obra + IA)</span>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black text-slate-900">R$ {estimatedTotal.toLocaleString()}</span>
               <span className="text-slate-400 font-bold">estimados</span>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custo Médio/m²</span>
               <input 
                 type="number"
                 className="bg-transparent font-black text-slate-800 outline-none w-full"
                 value={data.budget.costPerM2 || 3500}
                 onChange={(e) => updateData({ budget: { ...data.budget, costPerM2: Number(e.target.value) } })}
               />
            </div>
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Área Confirmada</span>
               <span className="font-black text-slate-800 block">{data.briefing.estimatedMetragem || 0} m²</span>
            </div>
         </div>

         <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Seu Briefing em uma frase:</h4>
            <p className="text-sm font-medium italic leading-relaxed text-slate-300">
              "{data.briefing.spatialIdentity || 'Um projeto equilibrado focado em funcionalidade e estética contemporânea.'}"
            </p>
         </div>
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-100 flex gap-4">
         <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Info size={24} />
         </div>
         <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Estamos Quase Lá</h4>
            <p className="text-xs font-medium text-amber-800 leading-relaxed mt-1">
              Ao clicar em <strong>Gerar Projeto</strong>, nossa IA processará todas as suas preferências, referências e desejos para entregar uma estratégia arquitetônica completa em segundos.
            </p>
         </div>
      </div>
    </div>
  );
}

function StepProfissionais({ data, updateData }: { data: ProjectData, updateData: any }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Equipe Técnica</h2>
        <p className="text-slate-500">Possui profissionais de confiança? (Opcional)</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <User size={16} /> Arquiteto(a)
          </label>
          <input 
            type="text" 
            placeholder="Nome completo..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent/30 font-medium"
            value={data.professionals.architect || ''}
            onChange={(e) => updateData({ professionals: { ...data.professionals, architect: e.target.value } })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <User size={16} /> Engenheiro(a)
          </label>
          <input 
            type="text" 
            placeholder="Nome completo..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-accent/30 font-medium"
            value={data.professionals.engineer || ''}
            onChange={(e) => updateData({ professionals: { ...data.professionals, engineer: e.target.value } })}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-400 text-sm italic italic tracking-tight">Caso não possua, o ArchiWizard sugerirá perfis compatíveis com seu projeto no final.</p>
      </div>
    </div>
  );
}

function StepGeracao({ isGenerating, data, updateData }: { isGenerating: boolean, data: ProjectData, updateData: any }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
      {isGenerating ? (
        <>
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-brand-accent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="text-brand-accent" size={32} />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-slate-800 animate-pulse">Gerando seu projeto...</h2>
            <div className="flex flex-col items-center gap-2">
              <p className="text-slate-500 max-w-xs text-sm">Nossa IA está processando as medidas, referências e orçamento para criar uma simulação fiel.</p>
              <div className="flex gap-1 mt-2">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Check size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-800">Dossiê Gerado!</h2>
            <p className="text-slate-500">Seu briefing inteligente e análise de viabilidade estão prontos.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-4">
             <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200">
               <img src={data.results?.plan2D} className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all cursor-pointer" />
               <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-700">Planta 2D</div>
             </div>
             <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200">
               <img src={data.results?.visual3D} className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all cursor-pointer" />
               <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-700">Visual 3D</div>
             </div>
          </div>

          <button 
           onClick={() => {
             const next = data.step + 1;
             updateData({ step: next });
           }}
           className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all animate-bounce"
          >
            Ver Dashboard do Projeto
          </button>
        </div>
      )}
    </div>
  );
}

function StepDashboard({ data, updateData }: { data: ProjectData, updateData: (d: Partial<ProjectData>) => void }) {
  const dossier = data.results?.dossier;
  if (!dossier) return null;

  const stepsProgress = [
    { name: 'Briefing', completed: true },
    { name: 'AI Scan', completed: !!data.results?.plan2D },
    { name: 'Ambientes', completed: data.environments.length > 0 },
    { name: 'Orçamento', completed: !!data.budget.costPerM2 },
    { name: 'Dossiê', completed: true },
  ];

  const totalMetragem = Number(data.briefing.estimatedMetragem);
  const totalBudget = totalMetragem * Number(data.budget.costPerM2);

  const highSeverityAlerts = dossier.infeasibilityAlerts.filter(a => a.severity === 'high');

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6 pb-20 space-y-8">
      {/* Header Dashboard */}
      <div className="flex items-center justify-between bg-slate-900 -mx-6 p-6 sticky top-0 z-10 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-none mb-1">Status do Projeto</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jornada {data.journey}</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Ativo</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => updateData({ step: 11 })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
        >
          Finalizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progresso Geral */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> Fluxo de Decisões
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              {stepsProgress.filter(s => s.completed).length}/{stepsProgress.length} Concluídos
            </span>
          </div>
          <div className="flex items-center gap-2">
            {stepsProgress.map((step, i) => (
              <div key={i} className="flex-1 space-y-2">
                <div className={`h-1.5 rounded-full ${step.completed ? 'bg-brand-accent' : 'bg-slate-100'}`} />
                <span className={`block text-[9px] font-black uppercase tracking-tighter truncate ${step.completed ? 'text-slate-800' : 'text-slate-300'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={64} />
          </div>
          <h3 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-4">Investimento Estimado</h3>
          <div className="space-y-1">
            <span className="text-3xl font-black tracking-tighter">
              R$ {totalBudget.toLocaleString('pt-BR')}
            </span>
            <p className="text-[10px] text-slate-400 font-medium">Com base em R$ {data.budget.costPerM2}/m²</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Margem de Risco</span>
            <span className="text-[10px] font-bold text-amber-500">± 15%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alertas Críticos */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={14} /> Alertas Críticos ({highSeverityAlerts.length})
          </h3>
          <div className="space-y-3">
            {highSeverityAlerts.length > 0 ? (
              highSeverityAlerts.map((alert, i) => (
                <div key={i} className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-red-900 uppercase leading-tight mb-1">{alert.problem}</h4>
                    <p className="text-[10px] text-red-800 leading-tight opacity-70 mb-2">{alert.impact}</p>
                    <span className="text-[10px] font-bold text-red-900">💡 Sugestão: {alert.suggestion}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <Check size={24} />
                 </div>
                 <span className="text-[11px] font-black text-emerald-900 uppercase">Nenhum risco crítico</span>
              </div>
            )}
          </div>
        </div>

        {/* Ambientes & Status */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <PieChart size={14} /> Mapa de Espaços
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {data.environments.map((env, i) => (
              <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:border-brand-accent transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-accent" />
                  <span className="text-xs font-bold text-slate-700">{env}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Definido</span>
                  <Check size={14} className="text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline Refinada */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} /> Próxima Milestone
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 font-black">?</div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Viabilidade Técnica</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Contratação de projetista para validação das estimativas.</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => updateData({ step: 10 })}
            className="mt-6 w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Acessar Calculadora <BarChart3 size={12} />
          </button>
        </div>

        {/* Próximos Passos */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
           <div>
              <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ListTodo size={14} /> Prioridades Estratégicas
              </h3>
              <div className="space-y-3">
                {dossier.nextSteps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[10px] font-black text-indigo-200 bg-white/10 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i+1}</span>
                    <p className="text-[10px] font-medium leading-tight">{step}</p>
                  </div>
                ))}
              </div>
           </div>
           <button 
            onClick={() => updateData({ step: 9 })}
            className="mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            Ver Dossiê Completo <Activity size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepDossier({ data }: { data: ProjectData }) {
  const dossier = data.results?.dossier;
  if (!dossier) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileCheck className="text-brand-primary" /> Dossiê do Projeto
        </h2>
        <button className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all">
          <Download size={18} />
        </button>
      </div>

      <div className="bg-gradient-to-br from-brand-primary to-indigo-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all scale-150">
           <Sparkles size={120} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 block mb-2 relative z-10">Diretriz de Identidade Espacial</span>
        <h3 className="text-3xl font-black mb-4 leading-tight relative z-10 italic">"{dossier.identity}"</h3>
        <p className="text-xs text-brand-primary/20 bg-white/10 p-3 rounded-2xl mb-4 relative z-10 font-medium">
          {dossier.dominantStyle}
        </p>
        <div className="flex flex-wrap gap-2 relative z-10 items-center">
          {dossier.emotionalMoodboard.map(mood => (
            <span key={mood} className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/5">
              {mood}
            </span>
          ))}
          <span className="ml-auto text-[9px] font-black uppercase bg-brand-accent text-slate-900 px-3 py-1 rounded-full">
            {dossier.sophisticationLevel}
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] p-6 text-white">
        <div className="flex justify-between items-center mb-4">
           <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Paleta Cromática Sugerida</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           {dossier.suggestedPalette.map((color, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-2">
                 <div className="w-full h-8 rounded-lg bg-white/20" />
                 <span className="text-[9px] font-black uppercase tracking-tighter text-center">{color}</span>
              </div>
           ))}
        </div>
      </div>

      <div className="bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 space-y-8">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                 <Maximize2 size={24} className="text-brand-primary" /> Dimensionamento Espacial
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Estimativas de área baseadas na sua realidade.</p>
           </div>
           <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Metragem Sugerida</span>
              <span className="text-xl font-black text-slate-900">{dossier.spatialDimensioning.totalAreaRange.min} - {dossier.spatialDimensioning.totalAreaRange.max} m²</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {['compact', 'comfortable', 'premium'].map((tier) => (
              <div key={tier} className={`p-5 rounded-3xl border-2 transition-all ${
                (tier === 'comfortable') ? 'bg-white border-brand-primary/20 shadow-lg scale-105 z-10' : 'bg-slate-100/50 border-slate-100 opacity-80'
              }`}>
                 <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-2 block">{tier === 'compact' ? 'Compacto' : tier === 'comfortable' ? 'Confortável' : 'Premium'}</span>
                 <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    {dossier.spatialDimensioning.tiers[tier as keyof typeof dossier.spatialDimensioning.tiers]}
                 </p>
              </div>
           ))}
        </div>

        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={14} /> Distribuição de Áreas por Ambiente
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dossier.spatialDimensioning.rooms.map((room, i) => (
                 <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-brand-primary transition-all">
                    <div className="space-y-1">
                       <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{room.name}</h5>
                       <p className="text-[9px] text-slate-500 italic">{room.reason}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-black text-brand-primary">{room.areaRange}</span>
                    </div>
                 </div>
              ))}
           </div>
           <div className="bg-white/50 p-4 rounded-2xl border border-dashed border-slate-300 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Circulação e Estrutura</span>
              <span className="text-xs font-bold text-slate-600">{dossier.spatialDimensioning.circulationEstimate}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Layers size={14} className="text-brand-primary" /> Materiais Sugeridos
          </h4>
          <ul className="space-y-2">
            {dossier.suggestedMaterials.map(m => (
              <li key={m} className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                <div className="w-1 h-1 bg-brand-primary rounded-full" /> {m}
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-500" /> Iluminação
          </h4>
          <ul className="space-y-2">
            {dossier.suggestedLighting.map(l => (
              <li key={l} className="text-[11px] font-bold text-slate-700 flex items-center gap-2 border-b border-slate-50 pb-1">
                 {l}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={14} /> Auditoria de Viabilidade & Riscos
        </h4>
        <div className="space-y-3">
          {dossier.infeasibilityAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-[2rem] border ${
                alert.severity === 'high' ? 'bg-red-50 border-red-100' : 
                alert.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 
                'bg-blue-50 border-blue-100'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  alert.severity === 'high' ? 'bg-red-500' : 
                  alert.severity === 'medium' ? 'bg-amber-500' : 
                  'bg-blue-500'
                }`} />
                <h5 className={`text-sm font-black leading-tight ${
                  alert.severity === 'high' ? 'text-red-900' : 
                  alert.severity === 'medium' ? 'text-amber-900' : 
                  'text-blue-900'
                }`}>
                  {alert.problem}
                </h5>
              </div>
              <div className="space-y-3 ml-5">
                <p className="text-[10px] leading-relaxed opacity-80">
                  <strong>Motivo:</strong> {alert.reason}
                </p>
                <p className="text-[10px] leading-relaxed opacity-80">
                  <strong>Impacto:</strong> {alert.impact}
                </p>
                <div className="pt-2 border-t border-black/5">
                  <p className="text-[11px] font-bold">
                    💡 Sugestão: {alert.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {dossier.spatialHarmony && (
        <div className={`${data.briefing.useFengShui ? 'bg-emerald-50 border-emerald-100' : 'bg-brand-primary/5 border-brand-primary/10'} border-2 rounded-[2.5rem] p-8 space-y-6 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${data.briefing.useFengShui ? 'bg-emerald-500' : 'bg-brand-primary'} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
              {data.briefing.useFengShui ? <Sparkles size={24} /> : <Layers size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                {data.briefing.useFengShui ? 'Harmonia Espacial (Feng Shui)' : 'Harmonização de Fragmentos'}
              </h3>
              <p className={`text-xs ${data.briefing.useFengShui ? 'text-emerald-700/70' : 'text-brand-primary/70'} font-black uppercase tracking-tight`}>
                {data.briefing.useFengShui ? 'Análise simbólica e fluxo energético' : 'Consolidação de estilos e materiais'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-white space-y-3">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise de Coerência Visual</h4>
             <p className="text-sm font-medium text-slate-700 italic leading-relaxed">
               "{dossier.spatialHarmony.analysis}"
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className={`text-[10px] font-black ${data.briefing.useFengShui ? 'text-emerald-600' : 'text-brand-primary'} uppercase tracking-widest flex items-center gap-2`}>
                <Check size={12} /> Recomendações
              </h4>
              <div className="space-y-2">
                {dossier.spatialHarmony.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 bg-white/50 p-3 rounded-xl border border-white/50">
                    <span className="text-brand-accent mt-0.5">•</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-tight">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={12} /> Conflitos Detectados
              </h4>
              <div className="space-y-2">
                {dossier.spatialHarmony.symbolicConflicts && dossier.spatialHarmony.symbolicConflicts.length > 0 ? (
                  dossier.spatialHarmony.symbolicConflicts.map((conf, i) => (
                    <div key={i} className="flex gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                      <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-red-700 leading-tight">{conf}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 flex items-center gap-2">
                     <Check size={14} className="text-emerald-500" />
                     <p className="text-[11px] font-bold text-emerald-700">Nenhum conflito estilístico detectado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <FileCheck size={14} /> Checklist Automático da Jornada
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {dossier.checklist.map((check, idx) => (
            <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
               <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                 check.status === 'ok' ? 'bg-emerald-50 text-emerald-500' :
                 check.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                 'bg-blue-50 text-blue-500'
               }`}>
                  {check.status === 'ok' ? <Check size={14} /> : 
                   check.status === 'pending' ? <AlertTriangle size={14} /> : 
                   <Plus size={14} />}
               </div>
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{check.item}</h5>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                      check.status === 'ok' ? 'bg-emerald-100 text-emerald-600' :
                      check.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {check.status === 'ok' ? 'Resolvido' : 
                       check.status === 'pending' ? 'Atenção' : 
                       'Dica'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{check.description}</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 p-5 rounded-3xl text-white">
        <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-3">Próximos Passos Recomendados</h4>
        <div className="space-y-3 mb-6">
          {dossier.nextSteps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-[10px] font-black text-brand-accent bg-brand-accent/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{i+1}</span>
              <p className="text-[11px] font-bold">{step}</p>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-slate-800">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Briefing para Profissionais</h4>
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] leading-relaxed text-slate-300 font-medium italic">
                {dossier.briefingForProfessionals}
              </p>
           </div>
           <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
              <Copy size={12} /> Copiar para o Arquivo
           </button>
        </div>
      </div>
    </div>
  );
}

function StepCalculadora({ data }: { data: ProjectData }) {
  const m2 = (data.budget.minM2 + data.budget.maxM2) / 2;
  const total = m2 * data.budget.costPerM2;
  
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 underline decoration-indigo-500 decoration-3 underline-offset-4">Calculadora de Viabilidade</h2>
        <p className="text-slate-500">Projeção estimada baseada nas configurações do projeto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <Calculator className="absolute top-4 right-4 opacity-10" size={60} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Custo Total Projetado</span>
          <h3 className="text-4xl font-black">R$ {total.toLocaleString('pt-BR')}</h3>
          <p className="text-xs mt-4 text-emerald-400 font-bold flex items-center gap-1">
            <Check size={12} /> Dentro do orçamento de R$ {data.budget.maxValue.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-6 bg-brand-accent rounded-3xl text-white shadow-xl border border-indigo-400/30">
          <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest block mb-1">Custo Médio por m²</span>
          <h3 className="text-4xl font-black">R$ {data.budget.costPerM2.toLocaleString('pt-BR')}</h3>
          <p className="text-xs mt-4 text-indigo-50 text-opacity-80 font-medium">Equivale a {m2}m² de área construída/reformada.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Detalhamento Financeiro</h4>
        <div className="space-y-3">
          {[
            { label: 'Mão de Obra', p: '35%', val: total * 0.35 },
            { label: 'Materiais Básicos', p: '45%', val: total * 0.45 },
            { label: 'Acabamentos', p: '20%', val: total * 0.20 },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
               <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <span className="text-[10px] font-bold text-slate-400">{item.p} do total</span>
               </div>
               <span className="font-bold text-slate-900">R$ {item.val.toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepFinal({ data, onNext }: { data: ProjectData, onNext?: () => void }) {
  const jsonOutput = JSON.stringify(data, null, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Projeto Finalizado</h2>
        <p className="text-slate-500 font-medium italic tracking-tight">Aqui está o resumo executivo do seu novo sonho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="md:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                 <FileText className="text-brand-accent" size={20} /> Resumo dos Dados
               </h3>
               <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="col-span-2 bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles size={48} />
                     </div>
                     <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest block mb-1">Identidade Espacial Consolidada</span>
                     <p className="text-sm font-black italic">"{data.results?.dossier?.identity}"</p>
                     <p className="text-[10px] text-brand-accent/60 mt-1 uppercase font-black tracking-tight">{data.results?.dossier?.sophisticationLevel}</p>
                     <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">
                        {data.results?.dossier?.visualIdentitySummary || data.briefing.spatialIdentity || 'Interpretação arquitetônica profissional baseada nos objetivos.'}
                     </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tipo</span>
                    <span className="font-bold text-slate-700 text-sm">{PROJECT_TYPES.find(t => t.id === data.type)?.label}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Metragem</span>
                    <span className="font-bold text-slate-700 text-sm">{(data.budget.minM2 + data.budget.maxM2)/2} m²</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Ambientes</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {data.environments.map(e => (
                        <span key={e} className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Estilos de Referência</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {data.references.styles.map(s => (
                        <span key={s} className="bg-brand-accent/10 px-2 py-0.5 rounded-lg text-[10px] font-bold text-brand-accent border border-brand-accent/20">
                          {REFERENCE_STYLES.find(rs => rs.id === s)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(data.references.selectedStylePrimary || data.references.selectedStyleSecondary) && (
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Estilo Detalhado</span>
                      <div className="flex gap-4 mt-1">
                        {data.references.selectedStylePrimary && (
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-brand-accent uppercase tracking-tighter">Principal</span>
                            <span className="font-bold text-slate-700 text-sm leading-tight">{data.references.selectedStylePrimary}</span>
                          </div>
                        )}
                        {data.references.selectedStyleSecondary && (
                          <div className="flex flex-col border-l border-slate-200 pl-4">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">Secundário</span>
                            <span className="font-bold text-slate-700 text-sm leading-tight">{data.references.selectedStyleSecondary}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                 <Layers className="text-brand-accent" size={20} /> Lista de Materiais (Estimada)
               </h3>
               <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200 mb-2 px-1">
                    <span className="w-1/3 text-left">Item</span>
                    <span className="w-1/6 text-center">Quant.</span>
                    <span className="w-1/4 text-right">Unitário</span>
                    <span className="w-1/4 text-right">Subtotal</span>
                  </div>
                  {data.results?.materials.map((m, i) => {
                    const quantity = parseFloat(m.quantity) || 0;
                    const subtotal = quantity * m.price;
                    return (
                      <div key={i} className="flex justify-between items-center text-[11px] py-2.5 border-b border-slate-200 last:border-0 border-dashed px-1 hover:bg-slate-100/50 transition-colors rounded-lg">
                        <span className="w-1/3 text-slate-800 font-bold truncate pr-2">{m.name}</span>
                        <span className="w-1/6 text-center text-slate-500 font-medium">{m.quantity}</span>
                        <span className="w-1/4 text-right text-slate-500 italic text-[10px]">R$ {m.price.toLocaleString('pt-BR')}</span>
                        <span className="w-1/4 text-right font-bold text-brand-accent">R$ {subtotal.toLocaleString('pt-BR')}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-200 group relative">
               <Viewer3D journey={data.journey} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 pointer-events-none">
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest leading-none">Exploração 3D Interativa</span>
               </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl text-white shadow-xl shadow-indigo-200">
               <h4 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Investimento Total</h4>
               <p className="text-2xl font-black">R$ {(data.results?.estimatedTotal || 0).toLocaleString('pt-BR')}</p>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button className="flex-1 bg-white border-2 border-slate-200 hover:border-brand-accent hover:text-brand-accent py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group active:scale-95 shadow-sm text-sm">
          <Download size={20} className="group-hover:-translate-y-1 transition-transform" /> Exportar (PDF)
        </button>
        <button 
          onClick={onNext}
          className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-accent transition-all active:scale-95 shadow-lg shadow-brand-primary/20 text-sm"
        >
          <Check size={20} /> Validar Projeto
        </button>
      </div>
    </div>
  );
}

function StepZero({ onSelectCase, onStartNew }: { onSelectCase: (d: Partial<ProjectData>) => void, onStartNew: () => void }) {
  return (
    <div className="space-y-12 py-8 animate-in fade-in zoom-in duration-700">
       <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] border border-brand-primary/10">
             <Sparkles size={12} /> Comece o Seu Legado
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-[0.9] uppercase">Como você deseja explorar?</h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">Seja através de uma referência pronta ou criando sua própria visão do zero.</p>
       </div>

       <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { case: TEST_CASES.residencial, icon: Home, title: 'Residência', color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { case: TEST_CASES.clinica, icon: Stethoscope, title: 'Clínica', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { case: TEST_CASES.podcast, icon: Mic, title: 'Podcast', color: 'text-slate-700', bg: 'bg-slate-100' }
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => onSelectCase(item.case)}
                className="group p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-brand-primary hover:shadow-2xl hover:-translate-y-1 transition-all text-center flex flex-col items-center gap-4"
              >
                 <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-sm`}>
                    <item.icon size={24} />
                 </div>
                 <span className="text-xs font-black uppercase tracking-tight text-slate-800">Ver {item.title}</span>
              </button>
            ))}
          </div>

          <div className="relative">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
             </div>
             <div className="relative flex justify-center text-[10px] font-black uppercase">
                <span className="bg-white px-6 text-slate-300 tracking-[0.3em]">Ou Inicie Sua</span>
             </div>
          </div>

          <button 
            onClick={onStartNew}
            className="group relative w-full p-8 bg-slate-900 rounded-[3rem] text-white flex items-center justify-between overflow-hidden hover:bg-brand-primary transition-all shadow-xl active:scale-[0.98]"
          >
             <div className="text-left relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Jornada de Descoberta</h3>
                <p className="text-slate-400 font-bold group-hover:text-white/80 transition-colors">Personalize cada detalhe do seu espaço.</p>
             </div>
             <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center relative z-10 group-hover:rotate-12 transition-transform">
                <ChevronRight size={32} />
             </div>
             <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Building2 size={160} />
             </div>
          </button>
       </div>
    </div>
  );
}

function StepValidacao({ data, updateData }: { data: ProjectData, updateData: (d: Partial<ProjectData>) => void }) {
  const [answers, setAnswers] = useState(data.validationAnswers || {
    helpedDecide: '',
    revealedProblem: '',
    organizedInfo: '',
    usefulChecklist: '',
    alertsQuality: '',
    dashboardClarity: '',
    missingForRealWork: ''
  });

  const questions = [
    { id: 'helpedDecide', q: 'O app ajudou a decidir algo concreto?', placeholder: 'Ex: Escolha de materiais ou divisão de ambientes...' },
    { id: 'revealedProblem', q: 'O app revelou algum problema que você não tinha pensado?', placeholder: 'Ex: Erro de fluxo ou custo incompatível...' },
    { id: 'organizedInfo', q: 'O app organizou melhor o que você precisa enviar para um profissional?', placeholder: 'Briefing técnico foi útil?' },
    { id: 'usefulChecklist', q: 'O checklist foi realmente útil para a jornada?', placeholder: 'Sentiu falta de algum item?' },
    { id: 'alertsQuality', q: 'Algum alerta pareceu exagerado, genérico ou inútil?', placeholder: 'Dê seu feedback sobre os alertas...' },
    { id: 'dashboardClarity', q: 'O dashboard deixou o projeto mais claro?', placeholder: 'Fácil de acompanhar as decisões?' },
    { id: 'missingForRealWork', q: 'O que ainda falta para você conseguir usar isso em uma obra real?', placeholder: 'Medidas precisas? Mais fotos?' },
  ];

  return (
    <div className="space-y-8">
       <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Validação do Projeto</h2>
          <p className="text-slate-500 text-sm">Seu feedback ajuda a tornar o ArchiWizard uma ferramenta profissional para obras reais.</p>
       </div>

       <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
               <label className="text-xs font-black text-slate-600 uppercase tracking-tight ml-1">{q.q}</label>
               <textarea 
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:border-brand-accent/30 outline-none min-h-[80px]"
                 placeholder={q.placeholder}
                 value={(answers as any)[q.id]}
                 onChange={(e) => {
                   const next = { ...answers, [q.id]: e.target.value };
                   setAnswers(next);
                   updateData({ validationAnswers: next });
                 }}
               />
            </div>
          ))}
       </div>

       <div className="pt-4">
          <button 
            onClick={() => {
              updateData({ validationAnswers: answers });
              alert('Obrigado pelo seu feedback! O ArchiWizard continuará evoluindo para ser seu parceiro ideal em obras e reformas.');
            }}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all"
          >
            Enviar Validação Final
          </button>
       </div>
    </div>
  );
}

// End of file
