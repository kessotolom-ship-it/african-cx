
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { TenantConfig, AgentFactoryResult } from './types';
import { dateTimeTool, transactionStatusTool, kycCheckTool, startRefundTool, searchDocsTool } from '../tools/index';

export class AfricanCXFactory {

    static createTenant(config: TenantConfig): AgentFactoryResult {
        // 1. Rassembler les outils dynamiquement selon la config
        // 1. Rassembler les outils dynamiquement selon la config
        const mainAgentTools: any = { dateTimeTool, searchDocsTool }; // Outil de base + RAG

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
            id: `${config.id}-main-agent`, // ID Unique
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
            'friendly': "Utilise un ton chaleureux, accessible. Tu peux utiliser des expressions locales modérées.",
            'formal': "Reste professionnel, concis et vouvoie le client.",
            'direct': "Sois factuel. Pas de blabla inutile.",
            'empathetic': "Montre de l'écoute active. Rassure le client avant de donner la solution (surtout pour l'argent)."
        };

        const emergencyRules = config.modules.compliance?.fraudAlertKeywords
            ? `\n🚨 URGENCE FRAUDE :\nSi l'utilisateur mentionne : [${config.modules.compliance.fraudAlertKeywords.join(', ')}], ne débats pas. Dis : "Je passe votre dossier en priorité au chef." et notifie l'humain.`
            : "";

        return `
CONTEXTE :
Tu es l'assistant virtuel officiel de "${config.name}" (${config.industry}).
Ton rôle est de répondre aux demandes WhatsApp des utilisateurs en Afrique de l'Ouest.

IDENTITÉ & TON :
${toneMap[config.tone] || toneMap['formal']}
Langue : ${config.language}. (Comprends le Nouchi mais réponds en Français standard sauf instruction contraire).

RÈGLES MÉTIER :
${config.systemPromptBase}

${emergencyRules}

GESTION DES ACTIONS (OUTILS) :
1. DÉMARRAGE : Utilise toujours 'get_current_time' au début pour savoir si c'est "Bonjour" ou "Bonsoir".
2. PAIEMENTS : Si un utilisateur se plaint d'une transaction (ID ou Référence), utilise 'check_transaction_status'.
   - Si le statut est 'FAILED' (Échec), propose IMMÉDIATEMENT de lancer le remboursement avec 'start_refund_process'.
3. KYC : Si l'utilisateur veut augmenter ses plafonds, vérifie son statut avec 'check_kyc_status'.
4. QUESTIONS GÉNÉRALES : Si l'utilisateur pose une question sur 'Comment faire X ?' ou 'C'est quoi Y ?', utilise TOUJOURS 'search_documentation' AVANT de répondre pour être précis.

OBJECTIF : 
Résoudre le problème au premier contact ou escalader proprement.
`;
    }

    // --- Générateurs de Prompts Spécifiques ---

    private static generatePaymentPrompt(config: TenantConfig): string {
        if (!config.modules.payment?.providers) return "";
        const providersList = config.modules.payment.providers.map(p => `- ${p.provider} (USSD: ${p.ussdCodeCheck || 'N/A'})`).join('\n');
        return `
Tu es l'expert Mobile Money pour ${config.name}.
Tes opérateurs supportés : ${providersList}
Règles : Cash-In (Dépôt) vs Cash-Out (Retrait).
Outils : 'check_transaction_status', 'start_refund_process'.
`;
    }

    private static generateCompliancePrompt(config: TenantConfig): string {
        return `
Tu es l'agent de conformité (KYC).
Ton but : Valider l'identité du client.
Outils : 'check_kyc_status'.
`;
    }
}
