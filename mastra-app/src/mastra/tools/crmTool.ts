import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Outil CRM Simulé (Niveau 2 - Escalade)
 * En production, remplacer les console.log par des appels axios vers Zendesk/Salesforce/HubSpot.
 */
export const crmTool = createTool({
    id: 'create-crm-ticket',
    description: 'Crée un ticket de support dans le CRM (Zendesk) pour escalader une conversation vers un agent humain.',
    inputSchema: z.object({
        subject: z.string().describe('Le sujet court du ticket (ex: "Erreur paiement Mobile Money")'),
        description: z.string().describe('Le résumé complet du problème et l\'historique pertinent de la conversation.'),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).describe('La priorité jugée par l\'IA.'),
        category: z.enum(['billing', 'technical', 'fraud', 'general']).describe('La catégorie du ticket.'),
        customerSentiment: z.string().describe('Sentiment détecté (ex: "Angry", "Confused", "Neutral").'),
    }),
    execute: async ({ context }) => {
        console.log('--- 🎫 CRM TICKET CRÉATION ---');
        console.log('Sujet:', context.subject);
        console.log('Priorité:', context.priority);
        console.log('Sentiment:', context.customerSentiment);
        console.log('Description:', context.description.substring(0, 50) + '...');

        // Simulation d'appel API (Latence réseau)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Générer un faux ID de ticket
        const ticketId = `TICKET-${Math.floor(Math.random() * 10000)}`;

        console.log(`✅ Ticket créé avec succès: ${ticketId}`);
        console.log('------------------------------');

        return {
            success: true,
            ticketId: ticketId,
            message: `Le ticket de support ${ticketId} a été créé pour l'équipe humaine.`,
            estimatedWaitTime: '2 heures'
        };
    },
});
