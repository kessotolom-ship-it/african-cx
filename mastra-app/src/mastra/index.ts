
import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { AfricanCXFactory } from './core/engine/factory';
import { solimiConfig } from './tenants/solimi';

// ==========================================================
// AFRICAN-CX : SINGLE TENANT ENTRY POINT
// ==========================================================

// Charger la config du tenant (Solimi par défaut)
const currentTenant = solimiConfig;

// Setup Store PostgreSQL (stockage persistant pour threads, messages, etc.)
export const pgStore = new PostgresStore({
    id: 'solimi-storage',
    connectionString: process.env.DATABASE_URL!,
});

// Setup Memory (mémoire conversationnelle partagée pour les agents)
export const memory = new Memory({
    storage: pgStore,
    options: {
        lastMessages: 20, // Garder les 20 derniers messages dans le contexte
        semanticRecall: false, // Désactivé pour l'instant (pas de vector/embedder configuré)
        workingMemory: {
            enabled: false,
        },
    },
});

// LA FACTORY : Générer les agents dynamiquement AVEC la mémoire
const factoryResult = AfricanCXFactory.createTenant(currentTenant, memory);

// Assembler les agents dans un objet plat pour Mastra
const agents: Record<string, any> = {
    [`${currentTenant.id}_support`]: factoryResult.mainAgent,
    ...factoryResult.specialistAgents
};

console.log("[INIT] Agents générés:", Object.keys(agents));

export const mastra = new Mastra({
    agents: agents,
    storage: pgStore,
});

export default mastra;
