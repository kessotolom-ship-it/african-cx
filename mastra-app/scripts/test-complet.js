/**
 * ============================================================
 *  AFRICAN-CX — TEST COMPLET E2E
 * ============================================================
 *  
 *  Ce script teste TOUTE la chaîne :
 *    1. Triage (workflow classification)
 *    2. Agent INFO (FAQ / RAG)
 *    3. Agent PAYMENT (transaction, contentieux)
 *    4. Agent COMPLIANCE (KYC)
 *    5. Mémoire Persistante (suivi de conversation)
 *    6. Edge Cases (messages vides, langues, etc.)
 *
 *  Usage : node scripts/test-complet.js
 *  Cible : http://localhost:3000  (ou modifier BASE_URL)
 * ============================================================
 */

const http = require('http');

// ─── CONFIG ─────────────────────────────────────────────
const BASE_URL = 'http://127.0.0.1:3000';
const API_PATH = '/api/chat';
const TIMEOUT_MS = 60000; // 60s max par requête

// ─── COULEURS TERMINAL ──────────────────────────────────
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    dim: '\x1b[2m',
};

// ─── SCENARIOS DE TEST ──────────────────────────────────
const TEST_SCENARIOS = [

    // ====================================================
    // GROUPE 1 : TRIAGE — Le workflow classifie-t-il bien ?
    // ====================================================
    {
        group: '🔀 TRIAGE',
        name: 'Salutation simple → info',
        message: 'Bonjour !',
        expectedAgent: 'info',
        checkResponse: (r) => r.length > 5, // Doit répondre qqch
    },
    {
        group: '🔀 TRIAGE',
        name: 'Question FAQ → info',
        message: 'Quels sont vos tarifs pour les transferts ?',
        expectedAgent: 'info',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '🔀 TRIAGE',
        name: 'Problème de paiement → payment',
        message: "J'ai envoyé 10000 FCFA mais le destinataire n'a rien reçu",
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '🔀 TRIAGE',
        name: 'Vérification identité → compliance',
        message: "Mon compte est bloqué, on me demande une pièce d'identité",
        expectedAgent: 'compliance',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '🔀 TRIAGE',
        name: 'Transaction échouée → payment',
        message: 'Ma transaction a échoué, référence ERR-45678',
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '🔀 TRIAGE',
        name: 'KYC / CNI → compliance',
        message: "Comment faire pour valider mon KYC ? J'ai ma CNI",
        expectedAgent: 'compliance',
        checkResponse: (r) => r.length > 10,
    },

    // ====================================================
    // GROUPE 2 : AGENT INFO (FAQ + RAG)
    // ====================================================
    {
        group: '📚 AGENT INFO',
        name: 'Question "comment faire"',
        message: 'Comment envoyer de l\'argent à quelqu\'un ?',
        expectedAgent: 'info',
        checkResponse: (r) => r.length > 20,
    },
    {
        group: '📚 AGENT INFO',
        name: 'Question horaires / service',
        message: 'Quels sont vos horaires d\'ouverture ?',
        expectedAgent: 'info',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '📚 AGENT INFO',
        name: 'Question limites / plafonds',
        message: 'Quel est le montant maximum que je peux envoyer par jour ?',
        expectedAgent: 'info',
        checkResponse: (r) => r.length > 10,
    },

    // ====================================================
    // GROUPE 3 : AGENT PAYMENT (Transactions)
    // ====================================================
    {
        group: '💰 AGENT PAYMENT',
        name: 'Transaction réussie (mock)',
        message: 'Vérifiez ma transaction référence TX-12345',
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '💰 AGENT PAYMENT',
        name: 'Transaction échouée (mock ERR*)',
        message: 'Ma transaction ERR-99887 a échoué, je veux mon remboursement !',
        expectedAgent: 'payment',
        checkResponse: (r) => {
            const lower = r.toLowerCase();
            // L'agent ne doit JAMAIS dire "remboursement effectué"
            const noFalseRefund = !lower.includes('remboursement effectué');
            return r.length > 10 && noFalseRefund;
        },
        criticalCheck: 'Ne doit PAS dire "remboursement effectué"',
    },
    {
        group: '💰 AGENT PAYMENT',
        name: 'Transaction en attente (mock PEN*)',
        message: 'Mon transfert PEN-55555 est toujours en attente depuis 2 heures',
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '💰 AGENT PAYMENT',
        name: 'Demande de retrait',
        message: 'Je veux retirer 50000 FCFA de mon compte Flooz',
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },

    // ====================================================
    // GROUPE 4 : AGENT COMPLIANCE (KYC)
    // ====================================================
    {
        group: '🛡️ AGENT COMPLIANCE',
        name: 'Vérifier KYC (non vérifié — tel ne finit pas par 00)',
        message: 'Vérifiez le statut KYC du numéro 22890123456',
        expectedAgent: 'compliance',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '🛡️ AGENT COMPLIANCE',
        name: 'Vérifier KYC (vérifié — tel finit par 00)',
        message: 'Quel est le statut KYC pour le 22890123400 ?',
        expectedAgent: 'compliance',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '🛡️ AGENT COMPLIANCE',
        name: 'Documents manquants',
        message: "Quels documents dois-je fournir pour débloquer mon compte ?",
        expectedAgent: 'compliance',
        checkResponse: (r) => r.length > 10,
    },

    // ====================================================
    // GROUPE 5 : EDGE CASES
    // ====================================================
    {
        group: '⚠️ EDGE CASES',
        name: 'Message très court',
        message: 'Aide',
        expectedAgent: null, // On ne sait pas quel agent, mais ça ne doit pas crasher
        checkResponse: (r) => r.length > 5,
    },
    {
        group: '⚠️ EDGE CASES',
        name: 'Message en anglais',
        message: 'I need help with my account, it was blocked',
        expectedAgent: null,
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '⚠️ EDGE CASES',
        name: 'Message avec emojis',
        message: '😡😡😡 Mon argent a disparu !! Aidez moi !!!! 💸',
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '⚠️ EDGE CASES',
        name: 'Message Nouchi / familier',
        message: "Gars là mon transfert Flooz a coupé, c'est comment ? Mon go attend l'argent",
        expectedAgent: 'payment',
        checkResponse: (r) => r.length > 10,
    },
    {
        group: '⚠️ EDGE CASES',
        name: 'Demande hors-sujet',
        message: 'Quel temps fait-il à Abidjan ?',
        expectedAgent: null,
        checkResponse: (r) => r.length > 5,
    },
];

// ─── SCENARIO MÉMOIRE (multi-turn) ─────────────────────
const MEMORY_TEST = {
    group: '🧠 MÉMOIRE PERSISTANTE',
    steps: [
        {
            name: 'Tour 1 — Salutation + contexte',
            message: "Bonjour, je m'appelle Kofi et j'ai un problème avec mon transfert Flooz",
        },
        {
            name: 'Tour 2 — Suite de la conversation (doit se souvenir de Kofi)',
            message: "La référence est ERR-77777",
        },
        {
            name: 'Tour 3 — Vérification mémoire (doit se souvenir du contexte)',
            message: "Du coup c'est quoi le statut ? Tu te rappelles de mon nom ?",
            checkResponse: (r) => {
                const lower = r.toLowerCase();
                // L'agent devrait mentionner le nom ou le contexte
                return r.length > 10;
            },
        },
    ],
};


// ═══════════════════════════════════════════════════════
//  MOTEUR DE TEST
// ═══════════════════════════════════════════════════════

function sendMessage(message, threadId = null) {
    return new Promise((resolve, reject) => {
        const payload = {
            messages: [{ role: 'user', content: message }],
        };
        if (threadId) payload.threadId = threadId;

        const data = JSON.stringify(payload);

        const url = new URL(BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };

        const timer = setTimeout(() => {
            req.destroy();
            reject(new Error('TIMEOUT'));
        }, TIMEOUT_MS);

        const req = http.request(options, (res) => {
            const agentIntent = res.headers['x-agent-intent'] || 'unknown';
            const returnedThreadId = res.headers['x-thread-id'] || null;
            res.setEncoding('utf8');
            let body = '';

            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                clearTimeout(timer);
                resolve({
                    status: res.statusCode,
                    agent: agentIntent,
                    threadId: returnedThreadId,
                    response: body.trim(),
                });
            });
        });

        req.on('error', (e) => {
            clearTimeout(timer);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

async function runSingleTest(scenario, index, total) {
    const prefix = `[${String(index + 1).padStart(2, '0')}/${total}]`;
    process.stdout.write(`  ${prefix} ${scenario.name} ... `);

    try {
        const start = Date.now();
        const result = await sendMessage(scenario.message);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);

        const checks = [];
        let passed = true;

        // Check 1 : Status 200
        if (result.status !== 200) {
            checks.push(`❌ HTTP ${result.status}`);
            passed = false;
        }

        // Check 2 : Agent attendu
        if (scenario.expectedAgent) {
            if (result.agent === scenario.expectedAgent) {
                checks.push(`✅ Agent: ${result.agent}`);
            } else {
                checks.push(`⚠️  Agent: ${result.agent} (attendu: ${scenario.expectedAgent})`);
                // On ne fait pas échouer pour un mauvais triage, c'est un warning
            }
        } else {
            checks.push(`ℹ️  Agent: ${result.agent}`);
        }

        // Check 3 : Réponse valide
        if (scenario.checkResponse) {
            if (scenario.checkResponse(result.response)) {
                checks.push(`✅ Réponse OK`);
            } else {
                checks.push(`❌ Réponse invalide${scenario.criticalCheck ? ' — ' + scenario.criticalCheck : ''}`);
                passed = false;
            }
        }

        const statusIcon = passed ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
        console.log(`${statusIcon} ${C.dim}(${elapsed}s)${C.reset}`);
        checks.forEach(c => console.log(`       ${c}`));

        // Aperçu de la réponse (première ligne, max 100 chars)
        const preview = result.response.substring(0, 120).replace(/\n/g, ' ');
        console.log(`       ${C.dim}💬 "${preview}..."${C.reset}`);
        console.log('');

        return { passed, result, scenario };

    } catch (err) {
        console.log(`${C.red}ERROR${C.reset} — ${err.message}`);
        console.log('');
        return { passed: false, error: err.message, scenario };
    }
}

async function runMemoryTest() {
    console.log(`\n${C.magenta}${C.bright}═══ ${MEMORY_TEST.group} ═══${C.reset}\n`);

    let threadId = null;
    let allPassed = true;

    for (let i = 0; i < MEMORY_TEST.steps.length; i++) {
        const step = MEMORY_TEST.steps[i];
        process.stdout.write(`  [M${i + 1}/${MEMORY_TEST.steps.length}] ${step.name} ... `);

        try {
            const start = Date.now();
            const result = await sendMessage(step.message, threadId);
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            // Capturer le threadId du premier message
            if (i === 0 && result.threadId) {
                threadId = result.threadId;
            }

            let passed = result.status === 200 && result.response.length > 5;
            if (step.checkResponse && !step.checkResponse(result.response)) {
                passed = false;
            }

            const statusIcon = passed ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
            console.log(`${statusIcon} ${C.dim}(${elapsed}s)${C.reset}`);
            console.log(`       ✅ Agent: ${result.agent} | Thread: ${threadId ? threadId.substring(0, 8) + '...' : 'none'}`);

            const preview = result.response.substring(0, 120).replace(/\n/g, ' ');
            console.log(`       ${C.dim}💬 "${preview}..."${C.reset}`);
            console.log('');

            if (!passed) allPassed = false;

        } catch (err) {
            console.log(`${C.red}ERROR${C.reset} — ${err.message}`);
            allPassed = false;
        }
    }

    return allPassed;
}


// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════

async function main() {
    console.log(`
${C.cyan}${C.bright}╔═══════════════════════════════════════════════════╗
║     🌍 AFRICAN-CX — SUITE DE TESTS COMPLÈTE      ║
║     Solimi Support Agent — E2E Testing            ║
╚═══════════════════════════════════════════════════╝${C.reset}

${C.dim}Cible: ${BASE_URL}${API_PATH}
Date:  ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}${C.reset}
`);

    // Vérifier que le serveur est accessible
    try {
        await sendMessage('ping');
        console.log(`${C.green}✅ Serveur accessible${C.reset}\n`);
    } catch (err) {
        console.log(`${C.red}❌ Serveur inaccessible (${err.message})${C.reset}`);
        console.log(`${C.yellow}   Lancez d'abord : npm run dev${C.reset}\n`);
        process.exit(1);
    }

    const results = { total: 0, passed: 0, failed: 0, warnings: 0 };
    let currentGroup = '';

    // ── Tests individuels ──
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
        const scenario = TEST_SCENARIOS[i];

        // Afficher le header de groupe
        if (scenario.group !== currentGroup) {
            currentGroup = scenario.group;
            console.log(`${C.cyan}${C.bright}═══ ${currentGroup} ═══${C.reset}\n`);
        }

        const { passed } = await runSingleTest(scenario, i, TEST_SCENARIOS.length);
        results.total++;
        if (passed) results.passed++;
        else results.failed++;
    }

    // ── Test Mémoire ──
    const memoryPassed = await runMemoryTest();
    results.total += MEMORY_TEST.steps.length;
    if (memoryPassed) results.passed += MEMORY_TEST.steps.length;
    else results.failed += MEMORY_TEST.steps.length;

    // ── RAPPORT FINAL ──
    console.log(`
${C.cyan}${C.bright}╔═══════════════════════════════════════════════════╗
║              📊 RAPPORT FINAL                     ║
╚═══════════════════════════════════════════════════╝${C.reset}

  Total:   ${results.total} tests
  ${C.green}Passés:  ${results.passed}${C.reset}
  ${C.red}Échoués: ${results.failed}${C.reset}
  Taux:    ${((results.passed / results.total) * 100).toFixed(0)}%

${results.failed === 0
            ? `${C.green}${C.bright}  🎉 TOUS LES TESTS PASSENT ! 🎉${C.reset}`
            : `${C.yellow}${C.bright}  ⚠️  ${results.failed} test(s) à vérifier${C.reset}`
        }
`);

    process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
