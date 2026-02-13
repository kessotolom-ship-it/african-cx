
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { TenantConfig, AgentFactoryResult } from './types';
import { dateTimeTool, transactionStatusTool, kycCheckTool, startRefundTool, searchDocsTool } from '../tools/index';

export class AfricanCXFactory {

    static createTenant(config: TenantConfig): AgentFactoryResult {
        // 1. Rassembler les outils dynamiquement selon la config
        // 1. Rassembler les outils dynamiquement selon la config
        const mainAgentTools: any = { searchDocsTool }; // RAG Obligatoire

        if (config.modules.payment?.enabled) {
            mainAgentTools['transactionStatusTool'] = transactionStatusTool;
            mainAgentTools['startRefundTool'] = startRefundTool;
        }

        if (config.modules.compliance?.enabled) {
            mainAgentTools['kycCheckTool'] = kycCheckTool;
        }

        // 2. Construire le Prompt Système dynamique (enrichi avec les nouveaux outils)
        const systemPrompt = this.generateSystemPrompt(config);

        // 3. Créer l'Agent Principal (Super Agent MVP)
        const mainAgent = new Agent({
            id: `${config.id}-main-agent`,
            name: `${config.name} Support (N1)`,
            instructions: systemPrompt,
            model: openai('gpt-4o'),
            tools: mainAgentTools, // Tous les outils sont ici !
        });

        // 4. (Optionnel) Créer des Agents Spécialistes si activés (au cas où on veut tester l'isolation)
        const specialists: Record<string, Agent<any, any, any, any>> = {};

        if (config.modules.compliance?.enabled) {
            specialists['compliance'] = new Agent({
                id: `${config.id}-compliance-agent`,
                name: `${config.name} KYC & Fraude`,
                instructions: this.generateCompliancePrompt(config),
                model: openai('gpt-4o'),
                tools: { kycCheckTool },
            });
        }

        if (config.modules.payment?.enabled) {
            specialists['payment'] = new Agent({
                id: `${config.id}-payment-agent`,
                name: `${config.name} Mobile Money Guide`,
                instructions: this.generatePaymentPrompt(config),
                model: openai('gpt-4o'),
                tools: { transactionStatusTool, startRefundTool },
            });
        }

        return { mainAgent, specialistAgents: specialists };
    }

    private static generateSystemPrompt(config: TenantConfig): string {
        const toneMap: Record<string, string> = {
            'friendly': "Ton: Chaleureux, empathique.",
            'formal': "Ton: Professionnel, direct.",
            'direct': "Ton: Bref, efficace.",
            'empathetic': "Ton: Rassurant, patient."
        };

        return `
ROLE: Assistant Virtuel N1 pour ${config.name} (${config.industry}).
OBJECTIF: Résoudre le problème au 1er contact ou escalader.

${toneMap[config.tone] || toneMap['formal']}
LANGUE: ${config.language}.

MISSION:
${config.mission}

PROCÉDURE (A SUIVRE STRICTEMENT):
1. ANLAYSE: Identifie l'intention (Paiement, Info, Conformité).
2. ACTION:
   - Question Générale (FAQ, Tarifs, Comment faire) -> Utilise TOUJOURS 'search_documentation'. NE JAMAIS INVENTER.
   - Problème Transaction -> Utilise 'check_transaction_status'.
     * Si ÉCHEC -> Propose 'start_refund_process'.
   - Demande Augmentation Plafond -> Utilise 'check_kyc_status'.
3. RÉPONSE:
   - Si l'info est trouvée -> Réponds poliment.
   - Si l'info manque ou doute -> Dis "Je ne sais pas, je demande à un humain".
   - Si Fraude suspectée (mots clés ${config.modules.compliance?.fraudAlertKeywords?.join(', ')}) -> Escalade immédiate.

Note: Ne donne JAMAIS ton avis personnel. Réfère-toi aux outils.
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
   - ÉCHEC: Lance 'start_refund_process' immédiatement.
   - ATTENTE: Demande de patienter 30min max.

Règle d'Or: Ne jamais promettre un remboursement si le statut n'est pas 'FAILED'.
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
