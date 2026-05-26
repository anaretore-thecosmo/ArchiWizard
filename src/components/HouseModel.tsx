import React, { useMemo } from 'react';
import { Box } from '@react-three/drei';

export interface HouseModelProps {
  projectCategory: string;
  wallColor?: string;
  roofColor?: string;
  roofStyleId?: string;
  houseTypeId?: 'single' | 'double';
  luxuryLevel?: 'standard' | 'premium' | 'luxury';
  isHologram?: boolean;
  hologramColor?: string;
  activePart?: 'wall' | 'roof' | null;
  onPartClick?: (part: 'wall' | 'roof' | null) => void;
  showLandscaping?: boolean;
}

const ROOF_STYLES = [
  { id: 'classic', roughness: 0.8, metalness: 0.1 },
  { id: 'metallic', roughness: 0.3, metalness: 0.8 },
  { id: 'glass', roughness: 0.1, metalness: 0.9, opacity: 0.4 },
  { id: 'none', roughness: 1.0, metalness: 0.0 }
];

export function HouseModel({
  projectCategory,
  wallColor = '#f8fafc',
  roofColor = '#ef4444',
  roofStyleId = 'classic',
  houseTypeId = 'single',
  luxuryLevel = 'standard',
  isHologram = false,
  hologramColor = '#22d3ee', // Cyan default
  activePart = null,
  onPartClick,
  showLandscaping = true
}: HouseModelProps) {
  
  const roofStyle = useMemo(() => ROOF_STYLES.find(s => s.id === roofStyleId) || ROOF_STYLES[0], [roofStyleId]);

  // Dynamic Hologram / Real Material constructor
  const getMaterial = (type: string, baseColor?: string, extraProps?: any) => {
    if (isHologram) {
      // Return beautiful glowing neon holographic material
      const opacity = type === 'window' ? 0.25 : 0.6;
      return (
        <meshStandardMaterial
          color={hologramColor}
          emissive={hologramColor}
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={opacity}
          wireframe={type === 'wireframe'}
          {...extraProps}
        />
      );
    }

    // Standard high-quality materials matching original design:
    switch (type) {
      case 'wall':
        const dynamicEmissive = activePart === 'wall' ? wallColor : '#000000';
        return (
          <meshStandardMaterial
            color={wallColor}
            emissive={dynamicEmissive}
            emissiveIntensity={activePart === 'wall' ? 0.25 : 0}
            roughness={0.65}
            metalness={luxuryLevel === 'luxury' ? 0.1 : 0.05}
            envMapIntensity={luxuryLevel === 'luxury' ? 1.5 : 1.2}
            {...extraProps}
          />
        );
      case 'roof':
        const roofEmissive = activePart === 'roof' ? roofColor : '#000000';
        return (
          <meshStandardMaterial
            color={roofColor}
            emissive={roofEmissive}
            emissiveIntensity={activePart === 'roof' ? 0.25 : 0}
            roughness={roofStyle.roughness}
            metalness={roofStyle.metalness}
            {...extraProps}
          />
        );
      case 'window':
        return (
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.8}
            roughness={0.1}
            transparent
            opacity={0.6}
            {...extraProps}
          />
        );
      case 'windowFrame':
        return <meshStandardMaterial color="#f1f5f9" roughness={0.8} {...extraProps} />;
      case 'door':
        return <meshStandardMaterial color={luxuryLevel === 'luxury' ? '#0f172a' : '#451a03'} metalness={0.4} {...extraProps} />;
      case 'doorHandle':
        return <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0} {...extraProps} />;
      case 'foundation':
        return <meshStandardMaterial color="#64748b" roughness={0.9} {...extraProps} />;
      case 'grass':
        return <meshStandardMaterial color="#34d399" roughness={1} {...extraProps} />;
      case 'podcast_desk':
        return <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.2} {...extraProps} />;
      case 'podcast_mic':
        return <meshStandardMaterial color="#000000" {...extraProps} />;
      case 'podcast_mic_head':
        return <meshStandardMaterial color="#334155" wireframe {...extraProps} />;
      case 'podcast_panels':
        return <meshStandardMaterial color="#334155" roughness={1} {...extraProps} />;
      case 'health_bed':
        return <meshStandardMaterial color="#f8fafc" roughness={0.5} {...extraProps} />;
      case 'health_pillow':
        return <meshStandardMaterial color="#e2e8f0" {...extraProps} />;
      case 'health_legs':
        return <meshStandardMaterial color="#94a3b8" metalness={0.8} {...extraProps} />;
      case 'health_panel':
        return <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} {...extraProps} />;
      case 'comm_counter':
        return <meshStandardMaterial color="#0f172a" {...extraProps} />;
      case 'comm_neon':
        return <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} {...extraProps} />;
      case 'comm_glass':
        return <meshStandardMaterial color="#ffffff" transparent opacity={0.2} metalness={1} roughness={0} {...extraProps} />;
      default:
        return <meshStandardMaterial color={baseColor || '#cccccc'} {...extraProps} />;
    }
  };

  const Tree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        {isHologram ? getMaterial('wireframe') : <meshStandardMaterial color="#451a03" roughness={0.9} envMapIntensity={0.5} />}
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.5, 1.2, 8]} />
        {isHologram ? getMaterial('solid') : <meshStandardMaterial color="#064e3b" roughness={0.8} envMapIntensity={0.5} />}
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.6, 1, 8]} />
        {isHologram ? getMaterial('solid') : <meshStandardMaterial color="#065f46" roughness={0.8} envMapIntensity={0.5} />}
      </mesh>
    </group>
  );

  const Bush = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
    <mesh position={position} scale={[scale, scale, scale]}>
      <sphereGeometry args={[0.25, 12, 12]} />
      {isHologram ? getMaterial('solid') : <meshStandardMaterial color="#059669" roughness={0.9} envMapIntensity={0.5} />}
    </mesh>
  );

  return (
    <group>
      {/* Landscaping */}
      {showLandscaping && (
        <group>
          {/* Grass/Plot Base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <circleGeometry args={[6, 32]} />
            {getMaterial('grass')}
          </mesh>

          <Tree position={[-3.5, 0, -2]} scale={1.2} />
          <Tree position={[3, 0, -3.5]} scale={0.9} />
          <Tree position={[4, 0, 1.5]} scale={1.1} />
          
          <Bush position={[0.8, 0.1, 1.8]} scale={0.8} />
          <Bush position={[-0.8, 0.1, 1.8]} scale={0.7} />
          <Bush position={[1.2, 0.1, 1.6]} scale={0.6} />
          <Bush position={[-1.2, 0.1, 1.6]} scale={0.9} />
        </group>
      )}

      {/* Foundation */}
      <Box args={[4.5, 0.1, 4.5]} position={[0, 0.05, 0]} receiveShadow>
        {getMaterial('foundation')}
      </Box>

      {/* Journey Specific Interior/Exterors */}
      {projectCategory === 'podcast' && (
        <group position={[0, 0.5, 0]}>
          {/* Studio Desk */}
          <Box args={[2, 0.05, 0.8]} position={[0, 0.35, 0]} castShadow>
            {getMaterial('podcast_desk')}
          </Box>
          <Box args={[0.05, 0.7, 0.05]} position={[-0.9, 0, 0.3]}>
            {getMaterial('podcast_desk')}
          </Box>
          <Box args={[0.05, 0.7, 0.05]} position={[0.9, 0, 0.3]}>
            {getMaterial('podcast_desk')}
          </Box>
          
          {/* Microphone */}
          <group position={[0, 0.5, -0.1]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.2]} />
              {getMaterial('podcast_mic')}
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.06]} />
              {getMaterial('podcast_mic_head')}
            </mesh>
          </group>

          {/* Acoustic Panels */}
          <Box args={[3, 2, 0.1]} position={[0, 1, -1.8]} receiveShadow>
            {getMaterial('podcast_panels')}
          </Box>
        </group>
      )}

      {projectCategory === 'health' && (
        <group position={[0, 0.4, 0]}>
          {/* Clinical Bed */}
          <group position={[0, 0.3, 0]}>
            <Box args={[1.8, 0.15, 0.7]} castShadow>
              {getMaterial('health_bed')}
            </Box>
            <Box args={[0.6, 0.2, 0.7]} position={[-0.6, 0.1, 0]}>
              {getMaterial('health_pillow')}
            </Box>
            {/* Legs */}
            {[[-0.8, -0.35, 0.3], [0.8, -0.35, 0.3], [-0.8, -0.35, -0.3], [0.8, -0.35, -0.3]].map((pos, i) => (
              <Box key={i} args={[0.05, 0.6, 0.05]} position={pos as [number, number, number]}>
                {getMaterial('health_legs')}
              </Box>
            ))}
          </group>
          {/* Divider */}
          <Box args={[0.05, 2, 2.5]} position={[-1.8, 1, 0]}>
            {getMaterial('health_panel')}
          </Box>
        </group>
      )}

      {projectCategory === 'commercial' && (
        <group position={[0, 0.6, 0]}>
          {/* Service Counter */}
          <group position={[0, 0.2, 1]}>
            <Box args={[2.5, 0.8, 0.6]} castShadow>
              {getMaterial('comm_counter')}
            </Box>
            <Box args={[2.6, 0.05, 0.7]} position={[0, 0.4, 0]}>
              {getMaterial('comm_neon')}
            </Box>
          </group>
          {/* Display window */}
          <Box args={[3.2, 1.8, 0.1]} position={[0, 0.8, 1.6]}>
            {getMaterial('comm_glass')}
          </Box>
        </group>
      )}

      {/* Ground Floor Walls */}
      <group position={[0, 0.7, 0]}>
        <Box 
          args={[3.2, 1.2, 3.2]} 
          castShadow 
          receiveShadow
          onClick={(e) => { 
            if (onPartClick) {
              e.stopPropagation(); 
              onPartClick('wall'); 
            }
          }}
        >
          {getMaterial('wall')}
        </Box>
        
        {/* Windows - Ground */}
        <Box args={[0.8, 0.8, 0.1]} position={[0, 0, 1.61]}>
          {getMaterial('window')}
        </Box>
        <Box args={[0.9, 0.9, 0.05]} position={[0, 0, 1.58]}>
          {getMaterial('windowFrame')}
        </Box>

        {/* Main Door */}
        <group position={[-0.9, -0.1, 1.61]}>
          <Box args={[0.7, 1.0, 0.05]}>
            {getMaterial('door')}
          </Box>
          {luxuryLevel === 'luxury' && (
            <Box args={[0.05, 0.4, 0.05]} position={[0.3, 0, 0.03]}>
              {getMaterial('doorHandle')}
            </Box>
          )}
        </group>
      </group>

      {/* Second Floor (Sobrado) */}
      {houseTypeId === 'double' && (
        <group position={[0, 1.9, 0]}>
          <Box 
            args={[3.2, 1.2, 3.2]} 
            castShadow 
            receiveShadow 
            onClick={(e) => { 
              if (onPartClick) {
                e.stopPropagation(); 
                onPartClick('wall'); 
              }
            }}
          >
            {getMaterial('wall')}
          </Box>
          
          {/* Luxury Balcony / Glass */}
          {luxuryLevel !== 'standard' && (
            <group position={[0, -0.6, 1.61]}>
              <Box args={[2.8, 0.8, 0.05]} castShadow>
                {getMaterial('window')}
              </Box>
              <Box args={[3.2, 0.1, 1.2]} position={[0, -0.05, -0.6]}>
                {getMaterial('health_legs')}
              </Box>
            </group>
          )}

          {/* Upper Windows */}
          <Box args={luxuryLevel === 'luxury' ? [2.8, 1.0, 0.1] : [1.2, 0.8, 0.1]} position={[0, 0, 1.61]}>
            {getMaterial('window')}
          </Box>
        </group>
      )}

      {/* Dynamic Roof */}
      <group position={[0, houseTypeId === 'double' ? 2.5 : 1.3, 0]}>
        <mesh 
          rotation={[0, Math.PI / 4, 0]} 
          castShadow
          onClick={(e) => { 
            if (onPartClick) {
              e.stopPropagation(); 
              onPartClick('roof'); 
            }
          }}
        >
          <coneGeometry args={[3.0, 1.4, 4]} />
          {getMaterial('roof')}
        </mesh>
        
        {/* Modern Flat Roof Option */}
        {luxuryLevel === 'luxury' && houseTypeId === 'double' && (
          <Box args={[3.4, 0.2, 3.4]} position={[0, -0.6, 0]}>
            {getMaterial('podcast_desk')}
          </Box>
        )}
      </group>

      {/* Side Windows - Left */}
      <group position={[-1.51, 1.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Box args={[0.7, 0.7, 0.05]}>{getMaterial('windowFrame')}</Box>
        <Box args={[0.6, 0.6, 0.06]} position={[0, 0, 0.01]}>{getMaterial('window')}</Box>
      </group>

      {/* Side Windows - Right */}
      <group position={[1.51, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Box args={[0.7, 0.7, 0.05]}>{getMaterial('windowFrame')}</Box>
        <Box args={[0.6, 0.6, 0.06]} position={[0, 0, 0.01]}>{getMaterial('window')}</Box>
      </group>

      {/* Back Window */}
      <group position={[0, 1.2, -1.51]} rotation={[0, Math.PI, 0]}>
        <Box args={[1.2, 0.7, 0.05]}>{getMaterial('windowFrame')}</Box>
        <Box args={[1.1, 0.6, 0.06]} position={[0, 0, 0.01]}>{getMaterial('window')}</Box>
      </group>

      {/* Hologram details like a circular grids or ground scanner lines */}
      {isHologram && (
        <group position={[0, 0.02, 0]}>
          {/* Horizontal scanning lines or grid rings */}
          {[1.5, 3.0, 4.5].map((radius, index) => (
            <mesh key={index} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[radius - 0.02, radius + 0.02, 32]} />
              <meshBasicMaterial color={hologramColor} transparent opacity={0.3 + index * 0.15} />
            </mesh>
          ))}
          {/* Outer coordinate indicator arcs */}
          <group rotation={[0, Date.now() * 0.0001, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[5.2, 5.3, 32, 1, 0, Math.PI / 2]} />
              <meshBasicMaterial color={hologramColor} transparent opacity={0.6} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[5.2, 5.3, 32, 1, Math.PI, Math.PI / 2]} />
              <meshBasicMaterial color={hologramColor} transparent opacity={0.6} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
