/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Building2, Stethoscope, Mic, Layout, Search, Zap, AlertTriangle, FileCheck } from 'lucide-react';

export const PROJECT_JOURNEYS = [
  { 
    id: 'residential', 
    label: 'Residencial', 
    icon: Home, 
    description: 'Casas, sobrados e reformas residenciais.',
    goal: 'Transformar desejos de moradia em briefing estruturado.',
    components: ['Janelas', 'Portas', 'Telhados', 'Muros', 'Jardins'],
    environments: ['Sala', 'Cozinha', 'Suíte', 'Varanda Gourmet', 'Escritório'],
    risks: ['Plano Diretor', 'Recuos Obrigatórios', 'Estrutural'],
  },
  { 
    id: 'commercial', 
    label: 'Reforma Comercial', 
    icon: Building2, 
    description: 'Lojas, escritórios e pontos de venda.',
    goal: 'Otimizar fluxo operacional e impacto visual de marca.',
    components: ['Fachada', 'Letreiro', 'Vitrine', 'Balcão', 'Circulação'],
    environments: ['Área de Venda', 'Estoque', 'Provador', 'Copa', 'Banheiro PCD'],
    risks: ['Normas de Incêndio', 'Acessibilidade', 'Carga Elétrica'],
  },
  { 
    id: 'health', 
    label: 'Clínica de Saúde', 
    icon: Stethoscope, 
    description: 'Consultórios e clínicas de fisioterapia.',
    goal: 'Equilibrar normas técnicas sanitárias com acolhimento.',
    components: ['Maca', 'Divisórias', 'Pia Técnica', 'Sinalização'],
    environments: ['Recepção', 'Sala de Exame', 'Área de Espera', 'DML'],
    risks: ['ANVISA RDC 50', 'Acessibilidade', 'Impermeabilização'],
  },
  { 
    id: 'podcast', 
    label: 'Estúdio de Podcast', 
    icon: Mic, 
    description: 'Espaços para gravação de áudio e vídeo.',
    goal: 'Garantir performance acústica e estética de vídeo.',
    components: ['Painel Acústico', 'Iluminação LED', 'Mesa de Som'],
    environments: ['Set de Gravação', 'Técnica', 'Lounge'],
    risks: ['Isolamento Acústico', 'Ventilação Silenciosa', 'Reflexão Sonora'],
  },
];

export const PROJECT_TYPES = PROJECT_JOURNEYS.map(j => ({
  id: j.id,
  label: j.label,
  icon: j.icon,
  description: j.description
}));

export const ENVIRONMENTS = {
  residential: ['Gourmet', 'Sala', 'Quarto', 'Banheiro', 'Suíte', 'Lavanderia', 'Fachada', 'Varanda', 'Cozinha', 'Escritório', 'Jardim', 'Piscina'],
  commercial: ['Área de Venda', 'Estoque', 'Provador', 'Copa', 'Banheiro PCD', 'Escritório', 'Fachada', 'Vitrine', 'Recepção'],
  health: ['Recepção', 'Sala de Exame', 'Área de Espera', 'DML', 'Consultório', 'Copa', 'Banheiro PCD', 'Expurgo'],
  podcast: ['Set de Gravação', 'Técnica', 'Lounge', 'Estúdio A', 'Estúdio B', 'Recepção', 'Copa'],
};

export const DATA_ENTRY_METHODS = [
  { id: 'medidas', label: 'Digitar medidas' },
  { id: 'pdf', label: 'Upload PDF (Referência)' },
  { id: 'media', label: 'IA Vision (Análise de Foto)' },
];

export const REFERENCE_STYLES = [
  { id: 'fiel', label: 'Copiar fielmente', description: 'Seguir exatamente a referência.' },
  { id: 'inspirado', label: 'Inspirado', description: 'Captar a essência da referência.' },
  { id: 'misturado', label: 'Misturar', description: 'Combinar diferentes tendências.' },
];
