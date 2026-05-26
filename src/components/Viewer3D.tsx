/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  ContactShadows, 
  Environment, 
  Float, 
  Box,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
  BakeShadows,
  PerformanceMonitor
} from '@react-three/drei';
import { 
  Palette, Home, Paintbrush, Share2, Download, Link, 
  MessageCircle, Twitter, Copy, Check, X, Facebook, 
  Linkedin, Camera, Save, Sun, Moon, Sunrise, Sunset, 
  Sliders, Layers, Building2, Upload, Scan, Stethoscope, 
  Mic, Plus, Info 
} from 'lucide-react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { HouseModel } from './HouseModel';
import { ArCameraViewer } from './ArCameraViewer';

const WALL_COLORS = ['#f8fafc', '#f1f5f9', '#e2e8f0', '#fae8ff', '#fef9c3', '#dcfce7'];
const ROOF_COLORS = ['#ef4444', '#b91c1c', '#475569', '#1e293b', '#78350f', '#064e3b'];
const ROOF_STYLES = [
  { id: 'classic', name: 'Clássico', roughness: 0.8, metalness: 0.1 },
  { id: 'metallic', name: 'Metálico', roughness: 0.3, metalness: 0.8 },
  { id: 'glass', name: 'Vidro/Pergolado', roughness: 0.1, metalness: 0.9, opacity: 0.4 },
  { id: 'none', name: 'Laje/Sem telhado', roughness: 1.0, metalness: 0.0 }
];

const TIME_PRESETS = {
  morning: {
    label: 'Manhã',
    ambient: 0.4,
    direct: 0.8,
    color: '#ffedd5',
    position: [10, 5, 2] as [number, number, number],
    background: '#f1f5f9'
  },
  afternoon: {
    label: 'Tarde',
    ambient: 0.6,
    direct: 1.5,
    color: '#ffffff',
    position: [10, 15, 10] as [number, number, number],
    background: '#f8fafc'
  },
  night: {
    label: 'Noite',
    ambient: 0.15,
    direct: 0.3,
    color: '#1e293b',
    position: [-5, 10, -5] as [number, number, number],
    background: '#0f172a'
  }
};

const STAGES = [
  { id: 'journey', name: 'Jornada', icon: Home },
  { id: 'lib', name: 'Biblioteca', icon: Plus },
  { id: 'arch', name: 'Arquitetura', icon: Building2 },
  { id: 'standard', name: 'Padrão', icon: Layers },
  { id: 'style', name: 'Estilo', icon: Palette },
  { id: 'atmos', name: 'Atmosfera', icon: Sun }
];

const HOUSE_TYPES = [
  { id: 'single', name: 'Térreo', icon: Home, floors: 1 },
  { id: 'double', name: 'Sobrado', icon: Layers, floors: 2 }
];

const LUXURY_STANDARDS = [
  { id: 'standard', name: 'Econômico', detail: 'Foco em custo-benefício' },
  { id: 'premium', name: 'Premium', detail: 'Acabamentos superiores' },
  { id: 'luxury', name: 'Alto Padrão', detail: 'Máximo refinamento' }
];

const JOURNEY_COMPONENTS = {
  residential: ['Janelas', 'Portas', 'Telhados', 'Muros', 'Varandas', 'Jardins', 'Pergolados', 'Iluminação Externa'],
  commercial: ['Fachada', 'Letreiro', 'Vitrine', 'Balcão', 'Área de Espera', 'Ponto Focal'],
  health: ['Maca', 'Sala Atendimento', 'Pia Técnica', 'Divisórias', 'Acessibilidade', 'Sinalização'],
  podcast: ['Mesa Studio', 'Microfone', 'Painel Acústico', 'LED RGB', 'Câmera', 'Estante']
};

const PROJECT_CATEGORIES = [
  { id: 'residential', name: 'Residencial', detail: 'Briefing de Moradia', icon: Home },
  { id: 'commercial', name: 'Comercial', detail: 'Reforma de Negócios', icon: Building2 },
  { id: 'health', name: 'Saúde', detail: 'Clínica & Consultório', icon: Stethoscope },
  { id: 'podcast', name: 'Podcast', detail: 'Estúdio de Mídia', icon: Mic },
];

export function Viewer3D({ journey: propJourney }: { journey?: string }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [projectCategory, setProjectCategory] = useState(() => {
    if (propJourney) return propJourney;
    try {
      const saved = localStorage.getItem('archiwizard_current_project');
      return saved ? JSON.parse(saved).journey : 'residential';
    } catch {
      return 'residential';
    }
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [metragem, setMetragem] = useState('50');
  const [wallColor, setWallColor] = useState(() => localStorage.getItem('archi_wall_color') || '#f8fafc');
  const [roofColor, setRoofColor] = useState(() => localStorage.getItem('archi_roof_color') || '#ef4444');
  const [roofStyleId, setRoofStyleId] = useState(() => localStorage.getItem('archi_roof_style') || 'classic');
  const [houseTypeId, setHouseTypeId] = useState<'single' | 'double'>('single');
  const [luxuryLevel, setLuxuryLevel] = useState<'standard' | 'premium' | 'luxury'>('standard');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'night'>('afternoon');
  const [ambientIntensity, setAmbientIntensity] = useState(0.6);
  const [activePart, setActivePart] = useState<'wall' | 'roof' | null>(null);
  const [showLightingMenu, setShowLightingMenu] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isArOpen, setIsArOpen] = useState(false);
  
  const houseRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const roofStyle = useMemo(() => ROOF_STYLES.find(s => s.id === roofStyleId) || ROOF_STYLES[0], [roofStyleId]);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('archi_wall_color', wallColor);
    localStorage.setItem('archi_roof_color', roofColor);
    localStorage.setItem('archi_roof_style', roofStyleId);
    
    // Simulate a brief save state for feedback
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const handleExportGLTF = () => {
    if (!houseRef.current) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      houseRef.current,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'house-model.gltf';
        link.click();
      },
      (error) => console.error('Error exporting GLTF:', error),
      { binary: false }
    );
  };

  const handleExportOBJ = () => {
    if (!houseRef.current) return;
    const exporter = new OBJExporter();
    const result = exporter.parse(houseRef.current);
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'house-model.obj';
    link.click();
  };

  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'house-preview.png';
    link.click();
  };

  const handleTimePreset = (preset: 'morning' | 'afternoon' | 'night') => {
    setTimeOfDay(preset);
    setAmbientIntensity(TIME_PRESETS[preset].ambient);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareSocial = (platform: 'twitter' | 'whatsapp' | 'facebook' | 'linkedin') => {
    const text = 'Confira este projeto 3D incrível que criei no ArchiWizard!';
    const url = window.location.href;
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    window.open(links[platform], '_blank');
  };

  // Memoize materials to prevent unnecessary re-allocations
  const sharedMaterials = useMemo(() => ({
    door: <meshStandardMaterial color="#475569" roughness={0.6} />,
    doorFrame: <meshStandardMaterial color="#1e293b" roughness={0.9} />,
    doorHandle: <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />,
    window: <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.1} transparent opacity={0.6} />,
    windowFrame: <meshStandardMaterial color="#f1f5f9" roughness={0.8} />,
    foundation: <meshStandardMaterial color="#64748b" roughness={0.9} />,
    chimney: <meshStandardMaterial color="#7c2d12" roughness={0.9} />,
    grass: <meshStandardMaterial color="#34d399" roughness={1} />,
    trunk: <meshStandardMaterial color="#78350f" roughness={0.9} />,
    leaves: <meshStandardMaterial color="#065f46" roughness={0.8} />,
    bush: <meshStandardMaterial color="#059669" roughness={0.9} />
  }), []);

  const Tree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} envMapIntensity={0.5} />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.5, 1.2, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.6, 1, 8]} />
        <meshStandardMaterial color="#065f46" roughness={0.8} envMapIntensity={0.5} />
      </mesh>
    </group>
  );

  const Bush = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
    <mesh position={position} scale={[scale, scale, scale]} castShadow>
      <sphereGeometry args={[0.25, 12, 12]} />
      <meshStandardMaterial color="#059669" roughness={0.9} envMapIntensity={0.5} />
    </mesh>
  );

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-3xl overflow-hidden relative group/canvas">
      <Canvas 
        shadows 
        dpr={dpr} 
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
          preserveDrawingBuffer: true
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        <color attach="background" args={[TIME_PRESETS[timeOfDay].background]} />
        
        <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={30} />
        
        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 1.75} 
          enableDamping 
          dampingFactor={0.05}
          autoRotate={isCinemaMode || !activePart}
          autoRotateSpeed={isCinemaMode ? 1.5 : 0.3}
        />
        
        <ambientLight intensity={ambientIntensity} color={TIME_PRESETS[timeOfDay].color} />
        <spotLight 
          position={TIME_PRESETS[timeOfDay].position}
          angle={0.2} 
          penumbra={1} 
          intensity={TIME_PRESETS[timeOfDay].direct}
          color={TIME_PRESETS[timeOfDay].color}
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 5, -10]} intensity={ambientIntensity * 0.8} color={TIME_PRESETS[timeOfDay].color} />
        
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.1}>
            <group position={[0, -0.5, 0]} ref={houseRef}>
              <HouseModel
                projectCategory={projectCategory}
                wallColor={wallColor}
                roofColor={roofColor}
                roofStyleId={roofStyleId}
                houseTypeId={houseTypeId}
                luxuryLevel={luxuryLevel}
                activePart={activePart}
                onPartClick={(part) => setActivePart(part)}
                showLandscaping={true}
              />
            </group>
          </Float>
          
          <ContactShadows 
            position={[0, 0, 0]} 
            opacity={0.4} 
            scale={15} 
            blur={2.5} 
            far={5} 
            color="#000000" 
            resolution={512}
          />
          <Environment preset="city" />
          <BakeShadows />
          <Preload all />
        </Suspense>
      </Canvas>
      
      {/* HUD - Settings Overlay */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        <div className="glass-panel px-4 py-2 rounded-full text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] pointer-events-none flex items-center gap-3">
          <Palette size={14} className="text-brand-accent" />
          ArchiWizard <span className="text-brand-accent/50">Pro</span>
        </div>
        
        <div className="glass-panel p-0 rounded-[2.5rem] border border-white/40 shadow-2xl animate-in slide-in-from-left-6 fade-in duration-500 w-80 h-[calc(100%-140px)] flex flex-col overflow-hidden">
          {/* Progress Header */}
          <div className="px-6 pt-6 pb-4 bg-white/30 backdrop-blur-sm border-b border-white/20">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                {React.createElement(STAGES[currentStage].icon, { size: 14, className: "text-brand-accent" })}
                Fase {currentStage + 1}: {STAGES[currentStage].name}
              </span>
              <span className="text-[9px] font-black text-slate-400">{Math.round(((currentStage + 1) / STAGES.length) * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-200/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-accent transition-all duration-500 ease-out" 
                style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Stage 0: Journey Setup */}
            {currentStage === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Escolha a Jornada</span>
                <div className="grid grid-cols-1 gap-3">
                  {PROJECT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setProjectCategory(cat.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all border ${
                        projectCategory === cat.id 
                          ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20 scale-[1.02]' 
                          : 'bg-white/50 border-slate-100 text-slate-500 hover:bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${projectCategory === cat.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                        <cat.icon size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] font-black uppercase block">{cat.name}</span>
                        <span className="text-[9px] opacity-70">{cat.detail}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 1: Components Library */}
            {currentStage === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Biblioteca de Componentes</span>
                <div className="grid grid-cols-1 gap-2">
                   {JOURNEY_COMPONENTS[projectCategory as keyof typeof JOURNEY_COMPONENTS]?.map(comp => (
                     <div key={comp} className="bg-white/50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:border-brand-accent transition-all">
                        <span className="text-xs font-bold text-slate-700">{comp}</span>
                        <button className="p-2 bg-slate-900 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={14} />
                        </button>
                     </div>
                   ))}
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                  <Info size={18} className="text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                    Arraste componentes para o projeto para visualizar a volumetria e layout preliminar.
                  </p>
                </div>
              </div>
            )}

            {/* Stage 2: Architecture */}
            {currentStage === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Selecione a Estrutura</span>
                <div className="space-y-3">
                  {HOUSE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setHouseTypeId(type.id as any)}
                      className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all border ${
                        houseTypeId === type.id 
                          ? 'bg-brand-accent text-white border-brand-accent shadow-xl shadow-brand-accent/20 scale-[1.02]' 
                          : 'bg-white/50 border-slate-100 text-slate-500 hover:bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${houseTypeId === type.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                        <type.icon size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] font-black uppercase block">{type.name}</span>
                        <span className="text-[9px] opacity-70">Design {type.floors > 1 ? 'Vertical' : 'Horizontal'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 3: Luxury Standard */}
            {currentStage === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Padrão de Construção</span>
                <div className="space-y-3">
                  {LUXURY_STANDARDS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setLuxuryLevel(level.id as any)}
                      className={`w-full flex flex-col items-start p-5 rounded-3xl transition-all border ${
                        luxuryLevel === level.id 
                          ? 'bg-brand-primary text-white border-brand-primary shadow-2xl' 
                          : 'bg-white/50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between w-full mb-1">
                        <span className="text-[12px] font-black uppercase">{level.name}</span>
                        {luxuryLevel === level.id && <Check size={14} />}
                      </div>
                      <span className="text-[9px] opacity-70 leading-relaxed font-medium">{level.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 4: Style (Colors & Materials) */}
            {currentStage === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                {/* Wall Choice */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cores das Paredes</span>
                    <Home size={12} className="text-brand-accent" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {WALL_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => { setWallColor(color); setActivePart('wall'); }}
                        className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                          wallColor === color ? 'border-brand-accent ring-4 ring-brand-accent/10 shadow-lg scale-110' : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </section>

                {/* Roof Choice */}
                <section className="pt-6 border-t border-slate-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telhado & Materiais</span>
                    <Paintbrush size={12} className="text-brand-accent" />
                  </div>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {ROOF_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => { setRoofColor(color); setActivePart('roof'); }}
                        className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                          roofColor === color ? 'border-brand-accent ring-4 ring-brand-accent/10 shadow-lg scale-110' : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOF_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setRoofStyleId(style.id)}
                        className={`px-3 py-2.5 rounded-2xl text-[9px] font-bold transition-all border ${
                          roofStyleId === style.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Stage 5: Atmosphere */}
            {currentStage === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <section>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Estação do Dia</span>
                  <div className="grid grid-cols-1 gap-3">
                    {(Object.keys(TIME_PRESETS) as Array<keyof typeof TIME_PRESETS>).map((preset) => (
                      <button 
                        key={preset}
                        onClick={() => handleTimePreset(preset)}
                        className={`flex items-center justify-between p-4 rounded-3xl transition-all border ${
                          timeOfDay === preset 
                            ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-lg shadow-amber-200/20' 
                            : 'bg-white/50 border-slate-100 text-slate-500 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${timeOfDay === preset ? 'bg-amber-100' : 'bg-slate-100'}`}>
                            {preset === 'morning' ? <Sunrise size={18} /> : preset === 'afternoon' ? <Sun size={18} /> : <Moon size={18} />}
                          </div>
                          <span className="text-[11px] font-black uppercase text-left">{TIME_PRESETS[preset].label}</span>
                        </div>
                        {timeOfDay === preset && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="pt-6 border-t border-slate-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Intensidade de Luz</span>
                    <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{Math.round(ambientIntensity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.05" 
                    value={ambientIntensity} 
                    onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-accent mb-2"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Mínima</span>
                    <span>Máxima</span>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="p-6 bg-white/30 backdrop-blur-md border-t border-white/20 flex gap-3">
            {currentStage > 0 && (
              <button
                onClick={() => setCurrentStage(prev => prev - 1)}
                className="flex-[0.4] py-4 rounded-2xl bg-white/80 border border-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => {
                if (currentStage < STAGES.length - 1) {
                  setCurrentStage(prev => prev + 1);
                } else {
                  handleSave();
                }
              }}
              className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                currentStage === STAGES.length - 1 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                  : 'bg-brand-primary text-white shadow-brand-primary/20 hover:bg-brand-accent'
              }`}
            >
              {currentStage === STAGES.length - 1 ? (
                <>Finalizar Projeto <Save size={14} /></>
              ) : (
                <>Próximo Passo <Sliders size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 pointer-events-none">
        <div className="glass-panel px-4 py-2 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-medium italic font-serif">
            {activePart ? '"A simplicidade é o último grau de sofisticação."' : 'Selecione um elemento para começar sua obra prima.'}
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-[9px] text-slate-400 font-bold uppercase transition-opacity group-hover/canvas:opacity-100 opacity-20 pointer-events-none">
        Orbitar • Zoom • Pan
      </div>

      {/* Share & Export Buttons - Top Right */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3 text-slate-700">
        <div className="flex gap-3">
          {/* AI Consultant Button */}
          <div className="relative group/ai">
            <button 
              className="p-2.5 rounded-2xl glass-button flex items-center justify-center text-brand-accent hover:bg-brand-accent hover:text-white group-hover/ai:ring-4 group-hover/ai:ring-brand-accent/10"
              title="Consultor IA de Design"
            >
              <Palette size={20} className="animate-pulse" />
            </button>
            <div className="absolute right-0 mt-3 w-72 glass-panel rounded-3xl p-5 z-50 invisible group-hover/ai:visible opacity-0 group-hover/ai:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/ai:translate-y-0">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em]">IA Design Consultant</span>
               </div>
               <p className="text-[11px] font-medium leading-relaxed italic font-serif text-slate-600 mb-4 px-1">
                 "Com base na sua seleção de <span className="font-bold text-brand-primary uppercase">{wallColor}</span>, sugiro um paisagismo com tons de lavanda e iluminação de <span className="font-bold text-brand-primary uppercase">Golden Hour</span> para maximizar o apelo visual."
               </p>
               <div className="h-px bg-slate-100 mb-3" />
               <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 <span>Gemini 1.5 Pro</span>
                 <span className="flex items-center gap-1"><Sliders size={10} /> Otimizando...</span>
               </div>
            </div>
          </div>

          {/* Cinema Mode Button */}
          <button 
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            className={`p-2.5 rounded-2xl glass-button flex items-center justify-center ${
              isCinemaMode ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-600/10' : 'text-slate-600 hover:text-indigo-600'
            }`}
            title="Modo Apresentação"
          >
            <Camera size={20} className={isCinemaMode ? 'animate-pulse' : ''} />
          </button>

          {/* AR Mode Button */}
          <button 
            onClick={() => setIsArOpen(true)}
            className="p-2.5 rounded-2xl glass-button flex items-center justify-center text-brand-primary hover:text-brand-accent hover:bg-slate-50 transition-colors"
            title="Projetar em Realidade Aumentada (AR)"
          >
            <Scan size={20} className="animate-pulse" />
          </button>

          {/* Lighting Settings Button */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowLightingMenu(!showLightingMenu);
                setShowShareMenu(false);
                setShowExportMenu(false);
              }}
              className={`p-2.5 rounded-2xl glass-button flex items-center justify-center ${
                showLightingMenu ? 'bg-amber-100 border-amber-200 text-amber-600' : 'text-slate-600 hover:text-amber-500'
              }`}
              title="Ambiente"
            >
              <Sun size={20} />
            </button>

            {showLightingMenu && (
              <div className="absolute right-0 mt-3 w-64 glass-panel rounded-3xl p-5 z-50 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Atmosfera</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleTimePreset('morning')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${
                        timeOfDay === 'morning' ? 'border-amber-200 bg-amber-50 text-amber-600 shadow-sm' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <Sunrise size={18} />
                      <span className="text-[9px] font-black uppercase">Manhã</span>
                    </button>
                    <button 
                      onClick={() => handleTimePreset('afternoon')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${
                        timeOfDay === 'afternoon' ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <Sun size={18} />
                      <span className="text-[9px] font-black uppercase">Tarde</span>
                    </button>
                    <button 
                      onClick={() => handleTimePreset('night')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${
                        timeOfDay === 'night' ? 'border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <Moon size={18} />
                      <span className="text-[9px] font-black uppercase">Noite</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exposição</span>
                    <span className="text-[10px] font-black text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">{Math.round(ambientIntensity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.05" 
                    value={ambientIntensity} 
                    onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-accent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`p-2.5 rounded-2xl glass-button flex items-center justify-center transition-all ${
              isSaving 
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-600 hover:text-emerald-500'
            }`}
            title="Salvar Projeto"
          >
            {isSaving ? <Check size={20} className="animate-in zoom-in duration-300" /> : <Save size={20} />}
          </button>

          {/* Export Button */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowShareMenu(false);
                setShowLightingMenu(false);
              }}
              className={`p-2.5 rounded-2xl glass-button flex items-center justify-center ${
                showExportMenu ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-md' : 'text-slate-600 hover:text-indigo-600'
              }`}
              title="Baixar Modelo"
            >
              <Download size={20} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 glass-panel rounded-3xl p-3 z-50 animate-in fade-in zoom-in-95 duration-300">
                <div className="px-3 py-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Entregáveis</span>
                </div>
                <div className="space-y-1">
                  <button 
                    onClick={() => { handleSnapshot(); setShowExportMenu(false); }}
                    className="w-full flex items-center justify-between p-3 hover:bg-rose-50 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                        <Camera size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Captura PNG</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => { handleExportGLTF(); setShowExportMenu(false); }}
                    className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <Download size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">Modelo GLTF</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Share Button (Isolated) */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowShareMenu(!showShareMenu);
              setShowExportMenu(false);
              setShowLightingMenu(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-button text-[11px] font-black uppercase tracking-widest ${
              showShareMenu ? 'bg-brand-accent text-white border-brand-accent shadow-lg shadow-brand-accent/20' : 'text-slate-600 hover:text-brand-accent'
            }`}
          >
            <Share2 size={16} />
            Compartilhar
          </button>
          
          {showShareMenu && (
            <div className="absolute right-0 mt-3 w-56 glass-panel rounded-3xl p-3 z-50 animate-in fade-in zoom-in-95 duration-300">
              <button 
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 rounded-2xl transition-colors group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
              <div className="h-px bg-slate-100 my-2 mx-3" />
              <div className="grid grid-cols-4 gap-1 p-1">
                {[
                  { id: 'twitter', icon: Twitter, color: 'text-sky-500', bg: 'hover:bg-sky-50' },
                  { id: 'whatsapp', icon: MessageCircle, color: 'text-emerald-500', bg: 'hover:bg-emerald-50' },
                  { id: 'facebook', icon: Facebook, color: 'text-blue-600', bg: 'hover:bg-blue-50' },
                  { id: 'linkedin', icon: Linkedin, color: 'text-indigo-600', bg: 'hover:bg-indigo-50' }
                ].map((social) => (
                  <button 
                    key={social.id}
                    onClick={() => shareSocial(social.id as any)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${social.bg} ${social.color}`}
                  >
                    <social.icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ArCameraViewer 
        isOpen={isArOpen} 
        onClose={() => setIsArOpen(false)} 
        journey={{
          category: projectCategory,
          customizations: {
            wallColor,
            roofColor,
            roofStyle: roofStyleId,
            houseType: houseTypeId,
            luxuryLevel
          }
        }}
      />
    </div>
  );
}
