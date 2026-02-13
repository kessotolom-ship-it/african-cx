
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { TenantConfig, AgentFactoryResult } from './types';
import { dateTimeTool, transactionStatusTool, kycCheckTool, logDisputeTool, searchDocsTool } from '../tools/index';
import type { MastraMemory } from '@mastra/core/memory';

export class AfricanCXFactory {

    static createTenant(config: TenantConfig, memory?: MastraMemory): AgentFactoryResult {
        // 1. Définition des Agents Spécialistes (Hub & Spoke)
        const specialists: Record<string, Agent<any, any, any, any>> = {};

        // --- Agent A: Documentation (Le Bibliothécaire) ---
        // Seul lui a accès au RAG (searchDocsTool)
        specialists['info'] = new Agent({
            id: `${config.id}-info-agent`,
            name: `${config.name} Info`,
            instructions: `ROLE: Bibliothécaire ${config.name}. MISSION: Répondre aux questions FAQ avec 'search_documentation'. SI pas d'info, dis "Je ne sais pas".`,
            model: openai('gpt-4o'),
            tools: { searchDocsTool },
            memory,
        });

        if (config.modules.compliance?.enabled) {
            specialists['compliance'] = new Agent({
                id: `${config.id}-compliance-agent`,
                name: `${config.name} Conformité`,
                instructions: this.generateCompliancePrompt(config),
                model: openai('gpt-4o'),
                tools: { kycCheckTool },
                memory,
            });
        }

        if (config.modules.payment?.enabled) {
            specialists['payment'] = new Agent({
                id: `${config.id}-payment-agent`,
                name: `${config.name} Transactions`,
                instructions: this.generatePaymentPrompt(config),
                model: openai('gpt-4o'),
                tools: { transactionStatusTool, logDisputeTool },
                memory,
            });
        }

        // 2. Agent Principal = ORCHESTRATEUR (Dispatcher)
        // IL N'A AUCUN OUTIL. Son seul job est de comprendre et router.
        const mainAgent = new Agent({
            id: `${config.id}-main-agent`, // Dispatcher
            name: `${config.name} Accueil`,
            instructions: this.generateDispatcherPrompt(config),
            model: openai('gpt-4o'),
            tools: {}, // AUCUN OUTIL MÉTIER ICI
            memory, // Le dispatcher a aussi la mémoire pour le contexte
        });

        return { mainAgent, specialistAgents: specialists };
    }

    private static generateDispatcherPrompt(config: TenantConfig): string {
        return `
ROLE: Dispatcheur / Accueil pour ${config.name}.
MISSION: Comprendre l'intention de l'utilisateur et l'orienter vers le bon spécialiste.
CONTEXTE: Tu es le premier point de contact. Tu ne résous RIEN toi-même.

AGENTS DISPONIBLES :
1. [info]: Pour TOUTE question générale, FAQ, tarifs, "comment faire", horaires.
2. [payment]: Pour TOUT problème d'argent, transaction échouée, retrait, dépôt, solde.
3. [compliance]: Pour TOUT ce qui concerne l'identité, KYC, CNI, plafonds, blocage de compte administratif.

RÈGLE D'OR:
Analyse la demande et réponds UNIQUEMENT par le nom de l'agent entre crochets, ex: "[info]" ou "[payment]". 
Si "Bonjour" simple -> Réponds "[info]".
`;
    }

    // --- Générateurs de Prompts Spécifiques ---

    private static generatePaymentPrompt(config: TenantConfig): string {
        return `
ROLE: Expert Mobile Money ${config.name}.
MISSION: Diagnostiquer les problèmes de transactions.

PROCÉDURE:
1. Demande la Référence Transaction (ID) si absente.
2. Utilise 'check_transaction_status' avec l'ID.
3. Analyse du Statut:
   - SUCCÈS: Rassure le client, donne le montant confirmé.
   - ÉCHEC: Ouvre un dossier de contentieux avec 'log_dispute_ticket'. Explique qu'un humain va valider.
   - ATTENTE: Demande de patienter 30min max.

Règle d'Or: NE JAMAIS DIRE "REMBOURSEMENT EFFECTUÉ". Dire "DOSSIER OUVERT" ou "EN COURS D'ANALYSE".
`;
    }

    private static generateCompliancePrompt(config: TenantConfig): string {
        return `
ROLE: Agent Conformité (KYC) ${config.name}.
MISSION: Valider l'identité et prévenir la fraude.

PROCÉDURE:
1. Vérifie le statut actuel avec 'check_kyc_status'.
2. Si NON VÉRIFIÉ: Liste les documents manquants (CNI, Selfie).
3. Si VÉRIFIÉ: Confirme les plafonds débloqués.
4. Si Fraude: Arrête tout et notifie un superviseur humain.
`;
    }
}
