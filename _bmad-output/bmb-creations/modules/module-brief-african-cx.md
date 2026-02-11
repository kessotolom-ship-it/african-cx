# Module Brief: african-cx

**Date:** 2026-02-10
**Author:** Essotolom
**Module Code:** african-cx
**Module Type:** Standalone
**Status:** Ready for Development

---

## Executive Summary

**Vision:**
Devenir la première **Plateforme d'Expérience Client (CX) Pan-Africaine** qui convertit le chaos du support client (panique bancaire, volume élevé) en opportunité de fidélisation et d'inclusion financière. Le module vise à dépasser le simple chatbot pour devenir une interface bancaire invisible, vocale et proactive pour les populations non-bancarisées.

**Module Category:** Fintech / Customer Support / Inclusion
**Target Users:** 
1. **Opérateurs (Solimi) :** Agents de support, CTOs.
2. **End-Users (Clients) :** Komi (Etudiant pressé), Tanti Awa (Commerçante non-tech).
3. **Clients B2B (Futur) :** Banques, Telcos, Services Publics.

**Complexity Level:** High (Mastra AI Framework + OCR + Multi-Tenant Architecture + Crisis Management).

---

## Module Identity

### Module Code & Name

- **Code:** `african-cx`
- **Name:** African Customer Experience Platform (ACX)

### Core Concept

ACX est une suite d'intelligence artificielle hébergée (On-Premise) qui agit comme un "Super-Assistant" pour les équipes de support. Elle utilise le framework **Mastra AI** pour orchestrer des workflows complexes (OCR, Classification, RAG) tout en garantissant la souveraineté des données (Architecture Client-Serveur).

### Personality Theme

**"Customer Success Ops"**
Les agents BMAD qui construisent ce module ont une personnalité "Corporate Fintech & Local Expert" :
- **Role:** Professionnel, Précis, Sécuritaire, mais profondément ancré dans la réalité locale (Ewe, jargon Mobile Money).
- **Vibe:** "On ne joue pas avec l'argent des gens, mais on comprend leurs problèmes."

---

## Module Type

**Type:** Standalone

Ce module est un produit à part entière, destiné à être déployé comme une solution B2B SaaS (ou On-Premise). Il ne s'agit pas d'une extension d'un module existant, mais d'une nouvelle verticale métier.
**Architecture Spécifique :** Séparation stricte entre la configuration BMAD (`agents/*.md`) et le moteur d'exécution Mastra (`mastra-app/`).

---

## Unique Value Proposition

**What makes this module special:**

1. **Proactivité (Reverse Support) :** Le système contacte le client *avant* qu'il ne se plaigne (ex: suite à un échec de transaction), réduisant le volume de tickets de 50%.
2. **Culture-First UX :** Gestion native de la "Panique" et de l'"Escalade Émotionnelle" (ex: Tanti Awa est détectée et redirigée vers un humain immédiatement).
3. **Hybride & Sécurisé :** L'intelligence est dans le Cloud (VPS), mais les données sensibles restent chez le client (Docker On-Premise).

**Why users would choose this module:**

- **Pour Solimi (CTO) :** Réduction de la dette technique (Pas de maintenance AI interne), Sécurité (IP protégée), Coût maîtrisé (BYOK OpenAI).
- **Pour les Agents :** Moins de tâches répétitives, interface simplifiée (1-Tap validation).
- **Pour Tanti Awa :** Quelqu'un s'occupe d'elle, même à minuit, sans lui parler comme un robot.

---

## User Scenarios

### Target Users

- **Primary:** Agents de Support N1 & N2.
- **Secondary:** Managers Operations & Risk (Crisis Control).
- **End-Users:** Clients Mobile Money (Profils variés : Tech-savvy à Illettré).

### Primary Use Case

**Gestion de Crise & Délestage :**
Lors d'une panne majeure ou d'un pic de volume, ACX active son "Circuit Breaker". Il filtre les demandes répétitives, fournit un statut officiel, et capture les leads ("Être notifié quand c'est résolu"), permettant aux agents humains de se concentrer sur les cas critiques (Fraude).

### User Journey (Tanti Awa - Panique)

1. **Signal :** Tanti Awa envoie un audio WhatsApp paniqué : "On a volé mon argent !".
2. **Détection :** ACX analyse l'audio (STT) + Sentiment (Colère/Peur) + Intent (Fraude).
3. **Escalade :** Le Score de Risque explose. Le bot ne tente *pas* de répondre. Il notifie un Agent Humain ("Urgence Fraude").
4. **Réponse Rassurance :** Le bot envoie un message d'attente hyper-court et empathique : "Tanti, on a reçu. Un chef t'appelle tout de suite. Ne quitte pas."
5. **Résolution :** L'agent humain appelle, avec toutes les infos pré-analysées sous les yeux.

---

## Agent Architecture

### Agent Count Strategy

**Multi-Agent (Spécialisation par Rôle Technique vs Métier) :**
Nous utilisons des agents BMAD pour *construire et maintenir* la plateforme Mastra.

### Agent Roster

| Agent | Name | Role | Expertise |
|-------|------|------|-----------|
| `acx-architect` | **Sena** | Lead Architect | Mastra Framework, Docker, Security, System Design. |
| `acx-ux-lead` | **Awa** | UX/Conversation Designer | Local Dialects, Tone Tuning, Empathy Flows, WhatsApp UX. |
| `acx-backend` | **Koffi** | Backend Integration Expert | API Solimi, OCR, Database, Performance Optimization. |
| `acx-sales` | **Fofo** | B2B Product Strategist | Pitch Deck, ROI Calculation, Multi-Tenant Features. |

### Agent Interaction Model

**Hub & Spoke :**
**Sena (Architect)** est le chef d'orchestre. Il valide tout le code produit par **Koffi** et **Awa**. **Fofo** intervient pour valider l'alignement avec la vision "Vente Licence" et "Multi-Tenant".

---

## Workflow Ecosystem

### Core Workflows (Essential)

1.  **`triage-and-routing`** : Le cerveau central. Reçoit le message -> Analyse (Intent/Sentiment/Langue) -> Décide (Bot vs Humain).
2.  **`crisis-circuit-breaker`** : Activation automatique en cas de pic de volume. Mode dégradé pour protéger le système.
3.  **`proactive-outreach`** : (Reverse) Écoute les webhooks "Transaction Failed" -> Envoie message WhatsApp proactif.

### Feature Workflows (Specialized)

1.  **`kyc-ocr-extraction`** : Extraction de données sur photos ID/Reçus pour valider les dossiers sans saisie manuelle.
2.  **`fraud-detection-escalation`** : Analyse de patterns suspects et alerte immédiate (SMS/Slack au Risk Manager).
3.  **`sentiment-tone-tuning`** : Workflow de calibration pour ajuster le ton du bot (plus/moins formel) selon le retour des agents.

### Utility Workflows (Support)

1.  **`deploy-to-vercel`** : Script CI/CD pour pousser le MVP sur Vercel.
2.  **`build-blackbox-docker`** : Pipeline de build pour générer l'image Docker obfusquée pour le déploiement On-Premise.
3.  **`tenant-provisioning`** : Création d'un nouveau client (Tenant) avec sa config isolée.

---

## Tools & Integrations

### MCP Tools

- **Mastra Server :** Outils natifs Mastra pour RAG et Workflow execution.
- **PostgreSQL Adapter :** Pour la mémoire conversationnelle et les logs d'audit.

### External Services

- **OpenAI / Anthropic :** LLM Brain (via Mastra).
- **Evolution API (WhatsApp) :** Connecteur WhatsApp non-officiel (hébergé On-Premise).
- **Solimi Core Banking API :** Pour consulter les soldes et statuts de transaction.

### Integrations with Other Modules

- **`core`** : Utilisation des standards de logging et de configuration BMAD.

---

## Creative Features

### Personality & Theming

**"The Invisible Banker"**
Le système ne doit pas avoir de personnalité "Clown". Il doit être invisible. On ne remarque sa présence que parce que tout devient fluide. C'est l'infrastructure silencieuse de la confiance.

### Easter Eggs & Delighters

- **Mode "Palaver" :** Si le bot détecte que l'utilisateur veut juste discuter (phatic communication), il peut engager une conversation légère et polie (sans engager la banque) pour construire du lien social.

### Module Lore

**"Project Nimbus"**
Dans les commentaires du code, le projet est appelé "Nimbus" (le nuage qui apporte la pluie - l'argent/prospérité). Les logs référencent parfois des proverbes locaux en commentaire.

---

## Next Steps

1.  **Review this brief** — Ensure the vision is clear
2.  **Run create-module workflow** — Build the module structure `_bmad/african-cx`
3.  **Run agent-builder** — Create Sena, Awa, Koffi and Fofo.
4.  **Init Mastra Project** — Initialize `mastra-app` inside the module.
5.  **Prototype Triage Flow** — Code the first Triage Workflow.

---

_brief created on 2026-02-10 by Essotolom using the BMAD Module workflow_
