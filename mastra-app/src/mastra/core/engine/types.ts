
import { Agent } from '@mastra/core';

export type TenantTone = 'formal' | 'friendly' | 'empathetic' | 'direct';
export type TenantIndustry = 'fintech' | 'retail' | 'startup';

export interface MobileMoneyConfig {
    provider: 'T-Money' | 'Flooz' | 'Wave' | 'Orange Money';
    ussdCodeCheck?: string; // Ex: *145*...
    fees?: {
        deposit: string; // Ex: "1% min 100 FCFA"
        withdraw: string; // Ex: "2% min 500 FCFA"
    };
}

export interface TenantModules {
    support: {
        enabled: boolean;
        autoReply: boolean;
    };
    payment?: {
        enabled: boolean;
        providers: MobileMoneyConfig[];
    };
    compliance?: {
        enabled: boolean;
        kycRequired: boolean;
        fraudAlertKeywords: string[]; // Ex: ["Volé", "Arnaque"]
    };
}

export interface TenantConfig {
    id: string;          // ex: 'solimi'
    name: string;        // ex: 'Solimi Pay'
    industry: TenantIndustry;
    tone: TenantTone;
    language: string;    // ex: 'fr-CI' (Français Ivoirien)

    // Prompt Système Base
    systemPromptBase: string;

    // Configuration des Modules
    modules: TenantModules;
}

// Type pour la Factory
export type AgentFactoryResult = {
    mainAgent: Agent<any, any, any, any>;
    specialistAgents?: Record<string, Agent<any, any, any, any>>;
};
