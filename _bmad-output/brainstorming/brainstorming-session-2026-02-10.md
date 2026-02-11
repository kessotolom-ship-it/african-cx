---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Chatbot IA Support Client & Lead Gen (Afrique de l''Ouest)'
session_goals: 'Définir MVP (Cas Solimi), Stratégie GTM (Build vs Buy), Modèle éco'
selected_approach: 'User-Selected Techniques'
techniques_used: ['SCAMPER', 'Role Playing', 'Six Thinking Hats']
ideas_generated: []
context_file: '_bmad/knowledge/mastra-ai/coding-standards.md, _bmad/knowledge/mastra-ai/overview.md'
---

## Session Overview

**Topic:** Conception et Stratégie de Lancement d'un Chatbot IA de Support et Qualification de Leads (Focus Afrique de l'Ouest)
**Goals:**
1. Définir les fonctionnalités clés d'un MVP robuste pour le cas pilote "Solimi" (Fintech).
2. Élaborer une stratégie "Go-to-Market" pour convaincre des startups techniques (argumentaire "Build vs Buy").
3. Identifier des modèles de monétisation viables pour startups et grandes entreprises.

### Context Guidance

**Mastra AI Framework:** Le projet vise une robustesse technique (production-grade). Nous nous appuierons sur les principes de Mastra (Agents autonomes, Workflows durables, Intégration via MCP) pour justifier la supériorité technique face aux solutions "maison" des clients potentiels.

**Cas Pilote - Solimi:** Fintech togolaise offrant des cartes Visa prépayées (Gnim) rechargeables via Mobile Money. Cible : Étudiants, Entreprises, Grand public. Valeurs : Cashless, Rapidité, Fiabilité. Problème actuel : Service client manuel saturé entraînant des frustrations.

### Session Setup

Nous allons structurer la session pour couvrir à la fois l'aspect produit (MVP), l'aspect business (Business Model) et l'aspect vente (Stratégie commerciale).


# Session de Brainstorming

**Facilitator:** Essotolom
**Date:** 2026-02-10

## Technique Selection

**Approach:** User-Selected Techniques
**Selected Techniques:**

- **SCAMPER**: Pour définir les fonctionnalités clés et différencier le MVP des processus actuels.
- **Role Playing**: Pour simuler une vente B2B "difficile" et forger les arguments "Build vs Buy".
- **Six Thinking Hats**: Pour une analyse holistique du modèle d'affaires et des risques avant production.

**Selection Rationale:** Cette combinaison offre un excellent équilibre entre innovation produit (SCAMPER), stratégie de vente psychologique (Role Play) et analyse critique de viabilité (Six Chapeaux), couvrant ainsi les trois piliers du projet : Produit, Vente, et Business Model.

## Technique Execution Results

**SCAMPER (MVP Definition):**

- **Interactive Focus:** Transformer le support client manuel actuel de Solimi en une solution hybride IA/Humain robuste.
- **Key Breakthroughs:**
    - **Philosophie:** L'IA comme "Super-Assistant" de l'agent humain (augmentation de productivité) plutôt que remplaçant total (trop risqué).
    - **Substitution:** Remplacer l'attente passive par une action immédiate préparée par l'IA (Draft de réponse + Actions contextuelles).
    - **Combinaison:** Lier l'IA aux données client (Solde, Transactions) pour donner du contexte à l'agent humain.
    - **Segmentation Intelligente des Flux:**
        1. **IA 100% (Info/FAQ):** Réponses automatiques sur les procédures standard.
        2. **IA + Validation Humaine (Opérations):** Préparation de réponse, validation par l'agent.
        3. **Escalade Humaine Immédiate (Litiges/Fraude):** Priorité haute, zéro IA sur la décision.
        4. **Fast Track (Revendeurs):** Identification prioritaire pour cash-in/cash-out.
        5. **Lead Gen (B2B):** IA qualifie le prospect (Taille, Volume) avant de passer au commercial.
        6. **Langues Locales:** IA détecte la langue (Audio/Texte) et route vers l'agent compétent (pas de traduction auto pour le MVP).

**Transition:** Avec cette définition claire du MVP, nous passons à la phase de vente. Comment convaincre Solimi d'acheter cette vision ?

**Role Playing (Sales Strategy "Build vs Buy"):**

- **Interactive Focus:** Simuler une confrontation avec un CTO sceptique ("Koffi") qui pense pouvoir développer la solution en interne.
- **Key Breakthroughs:**
    - **L'Argumentaire à 4 Piliers pour Convaincre les Techs:**
        1. **Dette Technique & Maintenance:** Le vrai coût n'est pas le dév initial (le "week-end project"), mais la maintenance 24/7 (API changes, hallucinations, monitoring).
        2. **Focus Métier (Cœur de Métier):** Les devs Fintech doivent se concentrer sur le Core Banking/Sécurité, pas debugger du NLP/RAG. C'est un métier à part entière.
        3. **Time-to-Market (Vitesse):** Problème client *immédiat* vs Dev interne (3 mois min pour stabilité). Perte de clients pendant l'attente.
        4. **Souveraineté des Données (Trust):** Modèle "Processeur" (pas de stockage propriétaire), possibilité de déploiement on-premise/Docker chez le client pour rassurer sur la data.

**Pre-Mortem (Risk Analysis):**

- **Interactive Focus:** Se projeter dans un scénario d'échec à 6 mois pour identifier et prévenir les causes invisibles.
- **Key Breakthroughs & Mitigation Strategies:**
    1. **Sabotage Interne (Facteur Humain):**
        - *Risque:* Agents rejettent l'IA par peur ou complexité.
        - *Solution:* UX "Invisible" (intégration fluide, moindres clics) + Incitation positive (Dashboard de performance valorisant l'usage de l'IA).
    2. **Latence Technique (Facteur Réalité):**
        - *Risque:* Lenteur de réponse IA vs Humain (Agent tape plus vite que l'IA).
        - *Solution:* Indicateur de frappe immédiat ("Solimi écrit...") pour faire patienter + Usage de modèles propriétaires rapides (OpenAI/Anthropic via Mastra) + Déploiement Vercel pour le MVP (Faible coût, haute dispo, pas de VPS docker lourd au début).
    3. **Perte de Confiance (Facteur Client):**
        - *Risque:* IA qui boucle ou hallucine.
        - *Solution:* Escalade immédiate et transparente vers l'humain ("Je passe à mon collègue") dès le moindre doute.

**Persona Journey (User Experience "Terrain"):**

- **Interactive Focus:** Valider le MVP à travers deux cas d'usage locaux critiques (Tech/Stressé vs Non-Tech/Paniqué).
- **Key Scenarios Validated:**
    1. **Komi (L'Étudiant Pressé - 23h - Argot):**
        - *Problème:* Dépôt Mobile Money non visible, deadline minuit. Stress.
        - *Réponse IA:* Ton "Coach/Grand Frère" + Action API Immédiate (Check Transaction Pending) + Rassurance ("C'est en cours, t'inquiète").
        - *Valeur:* Transforme l'angoisse en patience active.
    2. **Tanti Awa (La Commerçante - Panique Vol - Ewe):**
        - *Problème:* Débit suspect 50k FCFA. Ne sait pas lire. Crie au vol.
        - *Réponse IA:* Détection Émotion/Mots-clés (Vol/Panique) + Routage Immédiat vers Agent Humain Ewe. Pas de réponse automatique risquée.
        - *Valeur:* Évite le bad buzz au marché en traitant l'humain par l'humain.

**Decision Tree (Technical Logic & Crisis Management):**

- **Interactive Focus:** Mapper la logique binaire du "Cerveau" IA pour gérer les cas limites (Insultes, Crise, Manque d'infos).
- **Key Breakthroughs:**
    - **Architecture en 3 Niveaux (Filter -> Analyze -> Execute):**
        1. **Niveau 0 (Sécurité & Volume):**
            - *Mode Crise:* Si >100 msg/min (Déni de service/Bug général) -> Circuit court (Message unique "Incident en cours").
            - *Filtre Toxique:* Insultes -> Réponse calme auto + Tag "Client Difficile".
        2. **Niveau 1 (Analyse & Enrichissement):**
            - *OCR:* Lecture automatique des reçus/CNI (Photo).
            - *Slot Filling (Incomplétude):* Si le client ne donne pas la Réf -> IA boucle : "Peux-tu me donner la référence ou la photo du reçu stp ?" (Ne pas appeler API Solimi pour rien).
        3. **Niveau 2 (Exécution & Escalade):**
            - *Succès API:* Réponse rassurante immédiate.
            - *Échec API/Inconnu:* Escalade Agent Humain + Draft pré-rédigé.
            - *Alerte Fraude:* SMS CTO immédiat.

## Idea Organization and Action Plan

**Thematic Organization:**

1. **Produit (MVP "Super-Assistant" Hybride):**
    - *Concept:* L'IA ne remplace pas, elle *augmente*. Elle prépare (Drafts), trie (Routing), et gère le Chaos (Mode Crise).
    - *Stack MVP:* Mastra AI + Vercel (Léger). OCR pour les reçus.
    - *Flux Critique:*
        - **Standard (Slot Filling):** IA demande Réf -> IA check API -> Humain Valide.
        - **Urgence/Litige (Tanti Awa):** IA Alerte -> Humain Appelle.
        - **Tech/Opé (Komi):** IA Check API -> Réponse Rassurante.
        - **Crise/Buzz:** Circuit Court (Message générique).

2. **Vente (Stratégie "Anti-Build"):**
    - *Cible:* CTOs Startups/Fintech.
    - *Argumentaire:* Dette Technique (Maintenance) + Focus Métier (Core Banking) + Vitesse (Time-to-Market) + Trust (Data Sovereignty).

3. **Business (Modèle Hybride):**
    - *Revenus:* Vente Licence (CAPEX) + Maintenance (OPEX faible).
    - *Culture:* Adapté à la préférence locale pour l'investissement One-Shot.

**Prioritized Action Plan:**

1. **Immediate (This Week):**
    - Maquetter les flux UX pour Komi (Réponse Auto) et Tanti Awa (Alerte Agent).
    - Écrire le Pitch Deck "Solimi" avec les 4 arguments clés.
    - Setup Mastra AI sur Vercel (Hello World).

2. **Short Term (Next Month):**
    - Implémenter le Workflow de Triage (Intents Classification: Info vs Litige).
    - Tester avec 2-3 agents "Beta Testeurs".

## Session Summary

**Key Achievements:**
Cette session a transformé une idée de chatbot en une véritable **stratégie produit et commerciale robuste**. Nous avons dépassé le simple "Bot qui répond" pour concevoir un **Système d'Assistance Hybride** adapté aux contraintes réelles de l'Afrique de l'Ouest (Connectivité, Culture d'achat, Confiance, Langues Locales).
Nous avons validé les cas critiques (Komi/Awa), le modèle éco (Licence/Maintenance) et la stack technique (Mastra/Vercel).

**Final Insight:**
Le succès ne viendra pas de la "puissance" de l'IA, mais de son **intégration invisible** et de sa capacité à **s'effacer** intelligemment (Escalade Humaine) quand la situation l'exige (Panique/Litige).


- **Interactive Focus:** Se projeter dans un scénario d'échec à 6 mois pour identifier et prévenir les causes invisibles.
- **Key Breakthroughs & Mitigation Strategies:**
    1. **Sabotage Interne (Facteur Humain):**
        - *Risque:* Agents rejettent l'IA par peur ou complexité.
        - *Solution:* UX "Invisible" (intégration fluide, moindres clics) + Incitation positive (Dashboard de performance valorisant l'usage de l'IA).
    2. **Latence Technique (Facteur Réalité):**
        - *Risque:* Lenteur de réponse IA vs Humain (Agent tape plus vite que l'IA).
        - *Solution:* Indicateur de frappe immédiat ("Solimi écrit...") pour faire patienter + Usage de modèles propriétaires rapides (OpenAI/Anthropic via Mastra) + Déploiement Vercel pour le MVP (Faible coût, haute dispo, pas de VPS docker lourd au début).
    3. **Perte de Confiance (Facteur Client):**
        - *Risque:* IA qui boucle ou hallucine.
        - *Solution:* Escalade immédiate et transparente vers l'humain ("Je passe à mon collègue") dès le moindre doute.


**Six Thinking Hats (Business Model):**

- **Interactive Focus:** Challenger le modèle d'abonnement SaaS classique (inadapté à la région) et sécuriser la propriété intellectuelle.
- **Key Breakthroughs:**
    - **Mort de l'Abonnement SaaS Classique:** En Afrique de l'Ouest, les clients préfèrent l'investissement (CAPEX) aux charges récurrentes (OPEX) et se méfient des prélèvements automatiques.
    - **Nouveau Modèle Hybride ("Coquille chez eux, Cerveau chez vous"):**
        1. **Vente Licence (One-Shot):** Frais d'installation élevés (Cashflow immédiat, sentiment de propriété pour le client).
        2. **Maintenance API (Récurrent Faible):** Frais mensuels minimes pour l'accès à l'intelligence déportée et les mises à jour de sécurité.
    - **Protection Anti-Copie (Security):**
        - **Architecture:** Le client héberge le Front/Connecteur (Docker scellé).
        - **Intelligence Déportée:** Le "Cerveau" (Prompts, Logique RAG) reste sur vos serveurs via API privée.
        - **Kill Switch:** Si l'abonnement coupe, l'API se ferme, le bot devient muet. Impossible de voler la techno.

## Session Conclusion

**Key Takeaways:**
Nous avons défini une roadmap complète pour le lancement du Chatbot IA Solimi :
1. **MVP Robuste:** Une IA hybride qui assiste l'humain (Productivité) et trie intelligemment les flux (Info vs Opérationnel vs Fraude).
2. **Stratégie de Vente:** Un argumentaire "Build vs Buy" bétonné sur 4 piliers (Dette Tech, Focus Métier, Vitesse, Trust).
3. **Business Model:** Un modèle hybride Licence/Maintenance qui sécurise votre IP et s'adapte à la culture d'achat locale (CAPEX > OPEX).

**Next Steps:**
- **Prototypage:** Maquetter l'interface "Super-Assistant" pour l'agent humain.
- **Architecture:** Définir les specs techniques du conteneur Docker "Black Box" et de l'API Brain.
- **Pitch Deck:** Intégrer les 4 arguments "Build vs Buy" dans une présentation pour Solimi.
