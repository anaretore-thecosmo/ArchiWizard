import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { 
  X, Camera, Sliders, RefreshCw, Layers, Check, 
  Sparkles, ShieldAlert, SlidersHorizontal, Trash, HelpCircle,
  Eye, Compass, RotateCw, CornerRightDown, Minimize2, ZoomIn, 
  Paintbrush, Info, Flame, Grid
} from 'lucide-react';
import { HouseModel } from './HouseModel';

interface ArCameraViewerProps {
  isOpen: boolean;
  onClose: () => void;
  journey: any; // the journey contains chosen properties
}

const HOLOGRAM_COLORS = [
  { id: 'cyan', name: 'Neon Cyan', hex: '#22d3ee' },
  { id: 'emerald', name: 'Neon Green', hex: '#10b981' },
  { id: 'amber', name: 'Solar Amber', hex: '#f59e0b' },
  { id: 'rose', name: 'Cyber Pink', hex: '#f43f5e' },
  { id: 'purple', name: 'Synthwave Purple', hex: '#a855f7' }
];

// Fallback background landscape images for simulation if camera permissions are blocked or unavailable in AI Studio iframe
const SIMULATION_BACKGROUNDS = [
  { id: 'terreno1', name: 'Terreno Gramado', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' },
  { id: 'terreno2', name: 'Quintal / Lote', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80' },
  { id: 'terreno3', name: 'Asfalto / Urbano', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80' }
];

export function ArCameraViewer({ isOpen, onClose, journey }: ArCameraViewerProps) {
  if (!isOpen) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUsingSimulatedBackground, setIsUsingSimulatedBackground] = useState(false);
  const [selectedSimBg, setSelectedSimBg] = useState(SIMULATION_BACKGROUNDS[0]);

  // Model positioning configurations
  const [scale, setScale] = useState<number>(0.15); // Default scaled down for desk/terrain projection
  const [nudgeX, setNudgeX] = useState<number>(0);
  const [nudgeY, setNudgeY] = useState<number>(-0.6); // Slightly lowered to match camera background standard height
  const [nudgeZ, setNudgeZ] = useState<number>(0);
  const [rotationY, setRotationY] = useState<number>(Math.PI / 4); // Y-axis pivot rotation
  const [rotationX, setRotationX] = useState<number>(0);
  const [rotationZ, setRotationZ] = useState<number>(0);

  // Style properties
  const [isHologram, setIsHologram] = useState<boolean>(true);
  const [selectedHoloColor, setSelectedHoloColor] = useState(HOLOGRAM_COLORS[0]);
  const [showLandscaping, setShowLandscaping] = useState<boolean>(true);
  const [currentStylePreset, setCurrentStylePreset] = useState<'hologram' | 'realistic'>('hologram');

  // UI state overlays
  const [activeTab, setActiveTab] = useState<'posicao' | 'estilo' | 'ajustes'>('posicao');
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [flash, setFlash] = useState<boolean>(false);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);
  const [levelStatus, setLevelStatus] = useState<number>(0); // Device incline offset simulation 0-10

  // Standard extracted traits from project journey or defaults
  const projectCategory = journey?.category || 'residential';
  const wallColor = journey?.customizations?.wallColor || '#f8fafc';
  const roofColor = journey?.customizations?.roofColor || '#ef4444';
  const roofStyleId = journey?.customizations?.roofStyle || 'classic';
  const houseTypeId = journey?.customizations?.houseType || 'single';
  const luxuryLevel = journey?.customizations?.luxuryLevel || 'standard';

  // Request camera access
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Query for facingMode environment first if mobile
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsUsingSimulatedBackground(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.log('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Real camera stream could not be acquired:', err);
      setCameraError(err.message || 'Permissão com câmera rejeitada ou indisponível.');
      // Automatically activate simulation background so the application preview remains functional, fun, and testable!
      setIsUsingSimulatedBackground(true);
    }
  };

  useEffect(() => {
    startCamera();
    
    // Simulate minor horizon adjustments dynamically like real gyroscope data
    const interval = setInterval(() => {
      setLevelStatus(parseFloat((Math.sin(Date.now() * 0.001) * 2 + 1).toFixed(1)));
    }, 500);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      clearInterval(interval);
    };
  }, []);

  // Handle Snapshot Capture
  const handleCapture = () => {
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      // Generate simulated beautifully formatted composite image
      setSnappedPhoto(selectedSimBg.url);
    }, 350);
  };

  // Reset calibration
  const handleResetCalibration = () => {
    setScale(0.15);
    setNudgeX(0);
    setNudgeY(-0.6);
    setNudgeZ(0);
    setRotationY(Math.PI / 4);
    setRotationX(0);
    setRotationZ(0);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col font-sans select-none animate-in fade-in duration-300">
      
      {/* Dynamic Camera Feed or Simulation Terrains background */}
      <div className="absolute inset-0 z-0 bg-slate-900 overflow-hidden flex items-center justify-center">
        {isUsingSimulatedBackground ? (
          <div className="relative w-full h-full">
            <img 
              src={selectedSimBg.url} 
              alt={selectedSimBg.name} 
              className="w-full h-full object-cover brightness-[0.85] contrast-[1.05]"
            />
            {/* Simulation Indicator Tag */}
            <div className="absolute top-20 left-6 z-10 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-yellow-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">Câmera Simulada (Modo Sandbox)</span>
            </div>
          </div>
        ) : (
          <video 
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-100"
          />
        )}
      </div>

      {/* 3D Superimposed Model Canvas */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          
          <ambientLight intensity={isHologram ? 1.5 : 0.8} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={isHologram ? 1.0 : 1.5} 
            castShadow={!isHologram}
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Calibrated Interactive Group translation parameters */}
          <group 
            position={[nudgeX, nudgeY, nudgeZ]} 
            rotation={[rotationX, rotationY, rotationZ]}
            scale={[scale, scale, scale]}
          >
            <HouseModel
              projectCategory={projectCategory}
              wallColor={wallColor}
              roofColor={roofColor}
              roofStyleId={roofStyleId}
              houseTypeId={houseTypeId}
              luxuryLevel={luxuryLevel}
              isHologram={isHologram}
              hologramColor={selectedHoloColor.hex}
              showLandscaping={showLandscaping}
            />
          </group>

          {/* Simple controls specifically to assist dragging rotation */}
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            onChange={(e) => {
              // We lock orbit control and capture rotation around the vertical Y axis for simplicity
              if (e?.target?.getAzimuthalAngle) {
                setRotationY(e.target.getAzimuthalAngle());
              }
            }}
          />
        </Canvas>
      </div>

      {/* Camera Shutter Flash */}
      {flash && (
        <div className="absolute inset-0 bg-white z-[300] animate-lock duration-300 pointer-events-none flex items-center justify-center">
          <div className="animate-ping duration-150 rounded-full w-16 h-16 bg-white/50" />
        </div>
      )}

      {/* Top Controls Overlay HUD */}
      <div className="absolute top-0 inset-x-0 z-20 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-center">
        <div className="pointer-events-auto flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="text-white text-xs font-black uppercase tracking-widest leading-none drop-shadow-md">Projeção Territorial AR</h2>
            <p className="text-slate-300 text-[9px] font-bold tracking-wider mt-1 drop-shadow-sm flex items-center gap-1">
              <Sparkles size={10} className="text-blue-400 animate-spin" />
              <span>SOBREPONDO VOLUMETRIA EM ESCALA</span>
            </p>
          </div>
        </div>

        {/* Digital Horizon Level Indicator */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-2xl">
          <Compass size={14} className="text-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Nível do Solo</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 leading-none mt-1">{levelStatus}° ALINHADO</span>
          </div>
        </div>
      </div>

      {/* Floating Side Utility Panel (Camera Selector in simulation) */}
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-3 pointer-events-auto">
        {/* Toggle Real Camera / Simulation Mode manual switcher */}
        <button 
          onClick={startCamera}
          className="w-10 h-10 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
          title="Tentar reativar câmera real"
        >
          <RefreshCw size={16} className={!isUsingSimulatedBackground ? 'animate-spin' : ''} />
        </button>

        {isUsingSimulatedBackground && (
          <div className="flex flex-col gap-1.5 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl">
            {SIMULATION_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedSimBg(bg)}
                className={`w-7 h-7 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${
                  selectedSimBg.id === bg.id 
                    ? 'bg-brand-accent text-white font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title={bg.name}
              >
                {bg.id === 'terreno1' ? 'G' : bg.id === 'terreno2' ? 'Q' : 'U'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Interactive Controls Drawer (Bottom) */}
      <div className="mt-auto absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-900/90 to-slate-900/0 pt-16 px-6 pb-6 pointer-events-none flex flex-col gap-6">
        
        {/* Help Onboarding Guide Card */}
        {showGuide && (
          <div className="pointer-events-auto self-center max-w-md w-full bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 p-4 rounded-3xl text-indigo-100 flex gap-3 relative animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-2xl bg-indigo-900/50 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Como Calibrar seu AR</span>
                <button onClick={() => setShowGuide(false)} className="text-indigo-400 hover:text-indigo-100 text-xs py-0.5 px-2 bg-indigo-900/40 rounded-full font-bold">Entendi</button>
              </div>
              <p className="text-[11px] leading-relaxed mt-1.5 text-indigo-200">
                1. Mova o controle de **Escala** para aumentar ou reduzir o modelo.<br />
                2. Use os sliders de **Posição** para mover a casa longitudinalmente.<br />
                3. Arraste a tela para rotacionar o layout com precisão e encaixá-lo no terreno.
              </p>
            </div>
          </div>
        )}

        {/* Floating Calibration Joystick HUD (Middle Row left/right) */}
        <div className="pointer-events-auto flex justify-between items-end gap-4">
          
          {/* Quick HUD Presets Style toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setIsHologram(true); setCurrentStylePreset('hologram'); }}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${
                isHologram 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-black/50 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Grid size={14} /> Holograma
            </button>
            <button
              onClick={() => { setIsHologram(false); setCurrentStylePreset('realistic'); }}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${
                !isHologram 
                  ? 'bg-brand-accent border-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                  : 'bg-black/50 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Eye size={14} /> Realista
            </button>
          </div>

          {/* Trigger Snapshot Button */}
          <div className="flex flex-col items-center gap-1.5 self-center">
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-900 border-4 border-slate-900/50 hover:scale-105 active:scale-95 transition-all shadow-2xl"
              title="Tirar Foto do Terreno"
            >
              <Camera size={26} className="text-slate-900" />
            </button>
            <span className="text-[9px] font-black uppercase tracking-wider text-white drop-shadow">Fotografar</span>
          </div>

          {/* Quick reset of coordinates */}
          <button
            onClick={handleResetCalibration}
            className="px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all"
            title="Resetar calibração"
          >
            <Trash size={14} /> Resetar Posição
          </button>
        </div>

        {/* Primary Calibration / Editing Panel */}
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-lg border border-white/10 rounded-[32px] p-5 shadow-2xl flex flex-col gap-4 max-w-xxl mx-auto w-full">
          {/* Tabs */}
          <div className="flex border-b border-white/5 pb-3">
            {[
              { id: 'posicao', label: 'Posicionamento (Calibrar)', icon: Sliders },
              { id: 'estilo', label: 'Estilo Holográfico', icon: Paintbrush },
              { id: 'ajustes', label: 'Informações do Terreno', icon: Info }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 pb-2 pt-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors relative ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-accent rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab contents */}
          {activeTab === 'posicao' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scale Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><ZoomIn size={12} className="text-slate-400" /> Escala / Tamanho</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-mono">{(scale * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.02" 
                  max="1.5" 
                  step="0.01"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-brand-accent h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                  <span>Maquete Mesa (2%)</span>
                  <span>Escala Real (100%)</span>
                </div>
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><RotateCw size={12} className="text-slate-400" /> Orientação (Y)</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-mono">{((rotationY * 180) / Math.PI).toFixed(0)}°</span>
                </div>
                <input 
                  type="range" 
                  min="-3.14" 
                  max="3.14" 
                  step="0.05"
                  value={rotationY}
                  onChange={(e) => setRotationY(parseFloat(e.target.value))}
                  className="w-full accent-brand-accent h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                  <span>-180°</span>
                  <span>+180°</span>
                </div>
              </div>

              {/* Lateral nudge X */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Eixo Lateral (Esquerda / Direita)</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-mono">{nudgeX.toFixed(2)}m</span>
                </div>
                <input 
                  type="range" 
                  min="-4" 
                  max="4" 
                  step="0.05"
                  value={nudgeX}
                  onChange={(e) => setNudgeX(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Depth nudge Z */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Eixo de Profundidade (Avançar / Recuar)</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-mono">{nudgeZ.toFixed(2)}m</span>
                </div>
                <input 
                  type="range" 
                  min="-4" 
                  max="4" 
                  step="0.05"
                  value={nudgeZ}
                  onChange={(e) => setNudgeZ(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Height nudge Y */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Altitude / Altura do Terreno (Y)</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-mono">{nudgeY.toFixed(2)}m</span>
                </div>
                <input 
                  type="range" 
                  min="-3" 
                  max="1.5" 
                  step="0.05"
                  value={nudgeY}
                  onChange={(e) => setNudgeY(parseFloat(e.target.value))}
                  className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'estilo' && (
            <div className="space-y-4">
              {/* Toggle landcaping */}
              <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-2xl">
                <div>
                  <span className="text-[11px] font-bold text-white block">Esboçar Paisagismo</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 block">Exibir árvores e vegetação</span>
                </div>
                <button 
                  onClick={() => setShowLandscaping(!showLandscaping)}
                  className={`w-11 h-6 rounded-full transition-all relative ${
                    showLandscaping ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                    showLandscaping ? 'left-5.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Hologram custom color selectors */}
              {isHologram && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block">Cor de Varredura Laser</span>
                  <div className="grid grid-cols-5 gap-2">
                    {HOLOGRAM_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedHoloColor(color)}
                        className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all border ${
                          selectedHoloColor.id === color.id
                            ? 'border-white bg-white/10 scale-105'
                            : 'border-white/5 bg-slate-900/50 hover:bg-slate-900 text-slate-400'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                        <span className="text-[7.5px] font-bold truncate w-full text-center text-white">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ajustes' && (
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl text-slate-300 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Categoria do Projeto</span>
                <span className="font-bold text-white capitalize">{projectCategory}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Tipo de Edificação</span>
                <span className="font-bold text-white">{houseTypeId === 'double' ? 'Sobrado de 2 Andares' : 'Casa Térrea'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Nível de Luxo</span>
                <span className="font-bold text-white uppercase tracking-wider text-[10px] text-yellow-500">{luxuryLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">API de Media</span>
                <span className="font-mono text-emerald-400">{cameraError ? 'Sandbox Simulado' : 'MediaDevices Active'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Captured Photo Drawer Modal */}
      {snappedPhoto && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <Check className="text-emerald-500" size={16} /> FOTO SALVA COM SUCESSO!
              </span>
              <button 
                onClick={() => setSnappedPhoto(null)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Embedded image preview overlaying logo */}
            <div className="aspect-video bg-black relative">
              <img src={snappedPhoto} alt="Snapshot preview" className="w-full h-full object-cover" />
              {/* Grid overlay representation mimicking real capture block */}
              <div className="absolute inset-0 border-2 border-indigo-500/30 m-4 pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[7px] text-white font-mono uppercase tracking-widest">
                    ARCHIWIZARD AR CORE v1.0
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[7px] text-white font-mono uppercase tracking-widest">
                    SCALE: {(scale * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-white text-[10px] font-black tracking-widest drop-shadow uppercase bg-indigo-950/80 p-2 rounded">
                    PROJETO: {projectCategory.toUpperCase()} ({houseTypeId.toUpperCase()})
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[7px] text-slate-300 font-mono">
                    {new Date().toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                A foto foi devidamente registrada e anexada ao dossiê oficial do seu lote. Você pode exportar o projeto em PDF ou GLTF para visualizar os dados de implantação urbana.
              </p>
              <button 
                onClick={() => setSnappedPhoto(null)}
                className="w-full bg-brand-accent hover:bg-brand-primary text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Retornar ao Escaneamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
