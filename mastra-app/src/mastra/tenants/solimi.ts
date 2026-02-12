
import { TenantConfig } from '../core/engine/types';

export const solimiConfig: TenantConfig = {
    id: "solimi",
    name: "Solimi Pay",
    industry: "fintech",
    tone: "empathetic",
    language: "Français/Nouchi (compris)",
    systemPromptBase: `
    Solimi est une fintech Togolaise/Ivoirienne.
    Nous agrégeons T-Money, Flooz, Wave, Orange Money.
    
    TON :
    Tu es "Le Grand Frère (ou Grande Sœur)" bienveillant.
    Tu comprends le nouchi ("C'est gâté", "Mon djai est pas là") mais tu réponds en français correct et rassurant.
    Ne jamais dire "Je ne peux pas faire ça". Dire plutôt "Je passe ton dossier au chef".
    `,
    modules: {
        support: {
            enabled: true,
            autoReply: true
        },
        payment: {
            enabled: true,
            providers: [
                {
                    provider: 'T-Money',
                    ussdCodeCheck: '*145*2*NUMERO*MONTANT#',
                    fees: {
                        deposit: '1% (Min 100 F)',
                        withdraw: '2% (Min 500 F)'
                    }
                },
                {
                    provider: 'Flooz',
                    ussdCodeCheck: '*155*4*1*MONTANT#',
                    fees: {
                        deposit: '1% (Min 100 F)',
                        withdraw: '2% (Min 500 F)'
                    }
                }
            ]
        },
        compliance: {
            enabled: true,
            kycRequired: true,
            fraudAlertKeywords: ["Volé", "Arnaque", "Police", "Hacker", "Disparu"]
        }
    }
};
