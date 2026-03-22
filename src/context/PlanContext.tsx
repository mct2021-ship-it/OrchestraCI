import React, { createContext, useContext } from 'react';

export type PlanType = 'starter' | 'professional' | 'enterprise';

export interface PlanDetails {
  name: string;
  maxActiveProjects: number;
  maxProjectCreationsPerYear: number;
  maxGlobalPersonas: number;
  maxPersonasPerProject: number;
  maxJourneysPerProject: number;
  aiCreditsPerMonth: number;
  isFixedPricing?: boolean;
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  starter: {
    name: 'Starter',
    maxActiveProjects: 3,
    maxProjectCreationsPerYear: 10,
    maxGlobalPersonas: 5,
    maxPersonasPerProject: 3,
    maxJourneysPerProject: 3,
    aiCreditsPerMonth: 1000
  },
  professional: {
    name: 'Professional',
    maxActiveProjects: 15,
    maxProjectCreationsPerYear: 50,
    maxGlobalPersonas: 25,
    maxPersonasPerProject: 10,
    maxJourneysPerProject: 1000,
    aiCreditsPerMonth: 50000
  },
  enterprise: {
    name: 'Enterprise / Public Sector',
    maxActiveProjects: 1000,
    maxProjectCreationsPerYear: 1000,
    maxGlobalPersonas: 1000,
    maxPersonasPerProject: 1000,
    maxJourneysPerProject: 1000,
    aiCreditsPerMonth: 1000000,
    isFixedPricing: true
  }
};

interface PlanContextType {
  plan: PlanType;
  details: PlanDetails;
}

export const PlanContext = createContext<PlanContextType>({ 
  plan: 'professional',
  details: PLAN_DETAILS.professional
});

export const usePlan = () => useContext(PlanContext);
