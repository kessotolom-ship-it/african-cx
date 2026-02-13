
import { TenantConfig } from '../core/engine/types';

export const solimiConfig: TenantConfig = {
    id: "solimi",
    name: "Solimi Pay",
    industry: "fintech",
    tone: "empathetic",
    language: "Français/Nouchi (compris)",
    mission: "Tu es le grand frère bienveillant. Assiste les utilisateurs sur les paiements (T-Money, Flooz, Wave) et la conformité.",
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
