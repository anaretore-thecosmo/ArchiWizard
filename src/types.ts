/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JourneyType = 'residential' | 'commercial' | 'health' | 'podcast';

export interface ProjectData {
  id: string;
  name: string;
  coverImage?: string;
  step: number;
  journey: JourneyType;
  type: string; // Detail within journey
  environments: string[];
  customEnvironment?: string;
  dataEntryMethods: string[];
  briefing: {
    objectives: string;
    spatialIdentity?: string;
    targetAudience?: string; // For commercial/health
    technicalRisks: string[];
    legalRequirements: string[];
    estimatedMetragem: number;
    terrainArea?: number;
    terrainFormat?: string;
    occupants?: number;
    useFengShui?: boolean;
  };
  references: {
    links: string[];
    images: string[];
    styles: ('fiel' | 'inspirado' | 'misturado')[];
    aiSuggestions?: {
      name: string;
      description: string;
      keyFeatures: string[];
    }[];
    selectedStylePrimary?: string;
    selectedStyleSecondary?: string;
    roomSpecificReferences?: Record<string, string>;
  };
  budget: {
    maxValue: number;
    costPerM2: number;
    minM2: number;
    maxM2: number;
  };
  professionals: {
    architect?: string;
    engineer?: string;
  };
  results?: {
    plan2D: string;
    visual3D: string;
    materials: { name: string; quantity: string; price: number }[];
    estimatedTotal: number;
    dossier?: {
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
      checklist: {
        item: string;
        status: 'ok' | 'pending' | 'recommended';
        description: string;
      }[];
    };
  };
  validationAnswers?: {
    helpedDecide: string;
    revealedProblem: string;
    organizedInfo: string;
    usefulChecklist: string;
    alertsQuality: string;
    dashboardClarity: string;
    missingForRealWork: string;
  };
}

export const INITIAL_DATA: ProjectData = {
  id: 'default',
  name: 'Novo Projeto',
  coverImage: undefined,
  step: 1,
  journey: 'residential',
  type: '',
  environments: [],
  dataEntryMethods: [],
  briefing: {
    objectives: '',
    spatialIdentity: '',
    technicalRisks: [],
    legalRequirements: [],
    estimatedMetragem: 0,
    terrainArea: undefined,
    terrainFormat: '',
    occupants: 1,
  },
  references: {
    links: [],
    images: [],
    styles: ['inspirado'],
  },
  budget: {
    maxValue: 100000,
    costPerM2: 2500,
    minM2: 40,
    maxM2: 200,
  },
  professionals: {},
};
