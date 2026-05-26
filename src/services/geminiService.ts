/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData } from "../types";
import { PROJECT_TYPES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ArchitecturalStyle {
  name: string;
  description: string;
  keyFeatures: string[];
}

export interface ProjectDossier {
  identity: string;
  dominantStyle: string;
  sophisticationLevel: string;
  visualIdentitySummary: string;
  suggestedPalette: string[];
  emotionalMoodboard: string[];
  suggestedMaterials: string[];
  suggestedLighting: string[];
  infeasibilityAlerts: {
    problem: string;
    reason: string;
    impact: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  nextSteps: string[];
  briefingForProfessionals: string;
  checklist: {
    item: string;
    status: 'ok' | 'pending' | 'recommended';
    description: string;
  }[];
  spatialDimensioning: {
    totalAreaRange: { min: number; max: number };
    rooms: { name: string; areaRange: string; reason: string }[];
    tiers: {
      compact: string;
      comfortable: string;
      premium: string;
    };
    circulationEstimate: string;
  };
  spatialHarmony?: {
    analysis: string;
    pointsOfAttention: string[];
    recommendations: string[];
    materialsAndColors: string[];
    symbolicConflicts: string[];
  };
}

export async function getArchitecturalStyleSuggestions(projectData: ProjectData): Promise<ArchitecturalStyle[]> {
  const projectTypeLabel = PROJECT_TYPES.find(t => t.id === projectData.type)?.label || projectData.type;
  const environmentsList = projectData.environments.join(", ");
  
  const prompt = `As an expert architect, suggest 3 architectural styles for a project with the following details:
  - Project Type: ${projectTypeLabel}
  - Environments: ${environmentsList}
  - Custom Environment: ${projectData.customEnvironment || 'None'}
  
  For each style, provide:
  1. Internal Name of the style
  2. A brief 1-sentence description in Portuguese.
  3. 3-4 key features (visual elements, materials, mood) in Portuguese.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the style" },
            description: { type: Type.STRING, description: "One sentence description" },
            keyFeatures: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Key architectural features"
            },
          },
          required: ["name", "description", "keyFeatures"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Error parsing AI response:", e);
    return [];
  }
}

export async function generateProjectDossier(projectData: ProjectData): Promise<ProjectDossier> {
  const prompt = `As a Senior Architectural Strategist and Technical Auditor, generate a "Project Dossier" in Portuguese for this ${projectData.journey} project.
  
  PROJECT CONTEXT:
  - Journey: ${projectData.journey}
  - Objectives: ${projectData.briefing.objectives}
  - Spatial Identity (Intentions, Lifestyle, Aesthetics): ${projectData.briefing.spatialIdentity || 'Não informado'}
  - Room-Specific Intentions: ${JSON.stringify(projectData.references.roomSpecificReferences || {})}
  - Target Area: ${projectData.briefing.estimatedMetragem} m²
  - Style: ${projectData.references.selectedStylePrimary || 'Moderno'}
  - Budget: R$ ${projectData.budget.costPerM2}/m²
  - Environments: ${projectData.environments.join(", ")}
  - Feng Shui/Spatial Harmony Enabled: ${projectData.briefing.useFengShui ? 'SIM' : 'NÃO'}
  
  INTERPRETATION RULES (Identidade Espacial):
  Deeply analyze the user's Spatial Identity and Room-Specific Intentions.
  1. Identify aesthetic language and dominant materials across ALL fragments (rooms).
  2. Map patterns and detectable style shifts between different rooms.
  3. Detect inconsistencies (e.g., a "Industrial" bathroom in an otherwise "Organic/Zen" house).
  4. Evaluate "Visual Density" and "Visual Continuity" between spaces.
  5. Harmonization: If references are fragmented, determine a "Consolidated Identity" that respect all viable parts but warns about outliers.
  
  AUDIT RULES (Mandatory Technical Check):
  Detect incompatibilities, risks, and incoherences objectively.
  1. Detect incompatibilities (e.g., Luxury style with low Budget/m²).
  2. Detect conflicts of architectural language between rooms (e.g., "The gourmet reference is too industrial for the organic identity of the main living area").
  3. Detect excess of information or "style salad" where too many conflicting styles are requested.
  4. Detect maintenance risks (e.g., high-maintenance natural materials for a "low maintenance" request).
  5. Detect journey-specific risks:
     - Residential: Dark materials vs lighting, disproportionate areas.
     - Clinic: Sanitation materials, accessibility (PCD), acoustic privacy (RDC 50).
     - Podcast: Reflection surfaces, electrical points, camera angles.
     - Commercial: Brand visibility, narrow corridors, weak lighting.
  
  AUTOMATIC CHECKLIST:
  Generate a mandatory checklist of 6-7 items specifically for the ${projectData.journey} journey.
  For each item, set a status:
  - "ok": if based on the briefing/environments/identity the item seems addressed.
  - "pending": if it's a critical item that hasn't been detailed yet.
  - "recommended": if it's a value-add item that makes sense for the profile.
  
  Format the response in Portuguese as a JSON object with:
  1. identity: A catchphrase for the project concept (e.g., "Minimalismo Brutalista na Serra").
  2. dominantStyle: One of [rústico, boho, praiano, contemporâneo, industrial, orgânico, mediterrâneo, minimalista] or a clear blend.
  3. sophisticationLevel: A term describing the level of refinement.
  4. visualIdentitySummary: A brief 2-sentence summary of the consolidated visual direction, pattern detection, and room harmonization. Mention materials like [concreto, pedra, madeira, fibras naturais, cimento queimado, vidro, metais].
  5. suggestedPalette: 4 colors with hex codes or names and description of use.
  6. emotionalMoodboard: 4 keywords describing the feeling.
  7. suggestedMaterials: 4 specific materials based on dominant style.
  8. suggestedLighting: 3 lighting strategies.
  9. infeasibilityAlerts: Array of objects { "problem", "reason", "impact", "suggestion", "severity" }. Severity must be 'high', 'medium', or 'low'.
  10. nextSteps: 3 recommended actions.
  11. briefingForProfessionals: Technical summary for an architect or engineer.
  12. checklist: Array of items { "item", "status", "description" }. Status is 'ok', 'pending', or 'recommended'.
  13. spatialDimensioning: Object with totalAreaRange, rooms, tiers, circulationEstimate.
  14. spatialHarmony (Optional): Object { analysis, pointsOfAttention: [], recommendations: [], materialsAndColors: [], symbolicConflicts: [] }. 
      - INCLUDE THIS ALWAYS if multi-room references are provided, even if Feng Shui is disabled. 
      - analysis: Summarize the stylistic coherence across all rooms.
      - symbolicConflicts: List any detected style/material clashes between rooms.
  
  Required keys: [identity, dominantStyle, emotionalMoodboard, suggestedMaterials, suggestedLighting, infeasibilityAlerts, nextSteps, briefingForProfessionals, checklist, spatialDimensioning].
  Optional: [spatialHarmony] if multi-room fragments or Feng Shui are relevant.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identity: { type: Type.STRING },
          dominantStyle: { type: Type.STRING },
          sophisticationLevel: { type: Type.STRING },
          visualIdentitySummary: { type: Type.STRING },
          suggestedPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          emotionalMoodboard: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedLighting: { type: Type.ARRAY, items: { type: Type.STRING } },
          infeasibilityAlerts: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                reason: { type: Type.STRING },
                impact: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              },
              required: ["problem", "reason", "impact", "suggestion", "severity"]
            }
          },
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          briefingForProfessionals: { type: Type.STRING },
          checklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['ok', 'pending', 'recommended'] },
                description: { type: Type.STRING }
              },
              required: ["item", "status", "description"]
            }
          },
          spatialDimensioning: {
            type: Type.OBJECT,
            properties: {
              totalAreaRange: {
                type: Type.OBJECT,
                properties: {
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER }
                },
                required: ["min", "max"]
              },
              rooms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    areaRange: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["name", "areaRange", "reason"]
                }
              },
              tiers: {
                type: Type.OBJECT,
                properties: {
                  compact: { type: Type.STRING },
                  comfortable: { type: Type.STRING },
                  premium: { type: Type.STRING }
                },
                required: ["compact", "comfortable", "premium"]
              },
              circulationEstimate: { type: Type.STRING }
            },
            required: ["totalAreaRange", "rooms", "tiers", "circulationEstimate"]
          },
          spatialHarmony: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              analysis: { type: Type.STRING },
              pointsOfAttention: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              materialsAndColors: { type: Type.ARRAY, items: { type: Type.STRING } },
              symbolicConflicts: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["analysis", "pointsOfAttention", "recommendations", "materialsAndColors", "symbolicConflicts"]
          },
          required: ["identity", "dominantStyle", "emotionalMoodboard", "suggestedMaterials", "suggestedLighting", "infeasibilityAlerts", "nextSteps", "briefingForProfessionals", "checklist", "spatialDimensioning"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Error parsing Dossier response:", e);
    return {
      identity: "Conceito Inicial ArchiWizard",
      dominantStyle: projectData.references.selectedStylePrimary || "Modernista",
      sophisticationLevel: "Simplicidade Funcional",
      visualIdentitySummary: "Direção visual integrada baseada nos padrões detectados nas referências fornecidas.",
      suggestedPalette: ["Branco Neve", "Cinza Cimento", "Madeira Natural"],
      emotionalMoodboard: ["Acolhedor", "Funcional", "Estético", "Decisivo"],
      suggestedMaterials: ["Concreto aparente", "Madeira natural", "Vidro translúcido"],
      suggestedLighting: ["Luz natural abundante", "Iluminação de destaque"],
      infeasibilityAlerts: [{
        problem: "Análise de viabilidade pendente",
        reason: "Erro no processamento da IA",
        impact: "Possível desajuste entre briefing e execução",
        suggestion: "Consulte um profissional para validar as primeiras escolhas",
        severity: "medium"
      }],
      nextSteps: ["Contratar arquiteto para projeto executivo"],
      briefingForProfessionals: "Este é um projeto conceitual gerado pelo ArchiWizard Pro. O objetivo principal é a organização de ideias e viabilidade preliminar. Recomenda-se a contratação de um profissional qualificado para o desenvolvimento do projeto executivo e técnico.",
      checklist: [{
        item: "Validação Técnica",
        status: "pending",
        description: "Necessário validar as premissas deste briefing."
      }],
      spatialDimensioning: {
        totalAreaRange: { min: 80, max: 120 },
        rooms: [],
        tiers: {
          compact: "Foco no essencial",
          comfortable: "Equilíbrio entre área e custo",
          premium: "Amplas áreas e acabamentos superiores"
        },
        circulationEstimate: "10-15%"
      }
    };
  }
}
