
import { mastra } from '../../../mastra/index';

export const maxDuration = 30; // Pour Vercel (limite 10s par défaut)

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. MÉMOIRE CRITIQUE : Transformer l'historique en contexte
        // On prend les 10 derniers échanges pour garder le fil sans exploser le contexte
        const history = messages.slice(-10).map((m: any) =>
            `${m.role === 'user' ? 'Client' : 'Toi'}: ${m.content}`
        ).join('\n\n');

        // Instruction de Guidage Mémoire
        const promptWithMemory = `
--- DÉBUT DE L'HISTORIQUE DE CONVERSATION ---
${history}
--- FIN DE L'HISTORIQUE ---

INSTRUCTION :
Réponds au dernier message du Client en tenant compte du contexte ci-dessus.
Si l'historique contient des informations (comme son nom ou le problème), utilise-les !
`;

        console.log("Calling Mastra Agent with Memory...");

        // 2. Appel de l'Agent "Solimi Support" (Super Agent)
        const agent = mastra.getAgent("solimi_support");
        const result = await agent.generate(promptWithMemory);

        // 3. Extraction de la réponse texte
        // Mastra v1 renvoie un objet GenerateResult. On cherche .text
        const textResponse = result.text;

        return new Response(textResponse);

    } catch (error: any) {
        console.error("Mastra Error:", error);
        return new Response(`Erreur Agent: ${error.message}`, { status: 500 });
    }
}
