
# 🌍 African-CX : Architecture & Product Blueprint

> **Vision :** La plateforme de Customer Experience (CX) de référence pour l'Afrique de l'Ouest, propulsée par l'IA et conçue pour nos réalités locales.

---

## 1. Cible & Problème

**Le Problème :**
Les entreprises africaines (Fintechs, E-commerçants, Retail) croulent sous les messages WhatsApp non structurés. Les outils occidentaux (Zendesk, Intercom) sont trop chers, inadaptés à l'audio/nouchi et complexes à payer (CB vs Mobile Money).

**Segments Cibles :**
1.  **Fintechs (ex: Solimi, Djamo)** : Volume critique, besoin de sécurité & escalade.
2.  **Startups Digitale (ex: Chariow)** : Besoin d'éducation client & Lead Gen.
3.  **Retail Traditionnel (Supermarchés)** : Besoin de vendre via WhatsApp (Catalogue).

---

## 2. L'Offre "African-CX" (MVP)

**Différenciateurs Clés :**
*   🎤 **Voice-First :** Transcription native des notes vocales WhatsApp (Whisper).
*   🗣️ **Local Language Understanding :** Compréhension du Nouchi, Pidgin, Wolof urbain. Prompt system "Ivoirien/Sénégalais Friendly".
*   💬 **WhatsApp Super-App :** Tout se fait dans le chat (Catalogue, Paiement Moneroo, Support).
*   🔒 **Data Residency :** Option hébergement local (Orange Cloud) ou On-Premise.

---

## 3. Architecture Technique : "The Factory"

Nous adoptons une stratégie **Multi-Tenant Isolé (Docker)**.

### A. Structure "Code Modularisé"
Le code est unique (Core), la configuration change.

```typescript
// src/mastra/
├── core/             # Moteur Générique
│   ├── modules/      # Briques Fonctions (Support, Payment, Order)
│   ├── engine/       # Factory (Assemble les agents)
│   └── integrations/ # Connecteurs (Evolution API, Whisper, Postgres)
└── tenants/          # Configuration Clients
    ├── solimi.ts     # Config JSON/TS (Ton, Modules activés, API Keys)
    └── supermarche.ts
```

### B. Déploiement "Container-Per-Tenant"
Chaque client tourne dans son propre conteneur Docker isolé.
*   **Infrastructure :** Docker Compose ou Kubernetes.
*   **Mise à jour :** Image Docker privée + Watchtower (Pull auto).
*   **Sécurité :** Code obfusqué (JS Minifié) dans l'image livrée.

---

## 4. Stack Technologique

*   **IA Framework :** Mastra (Agents, RAG, Workflows).
*   **LLM :** OpenAI GPT-4o (via filtre PII anonymisation).
*   **Canal :** Evolution API (Self-Hosted WhatsApp).
*   **Audio :** OpenAI Whisper (STT).
*   **Database :** PostgreSQL (Une DB par tenant).
*   **Paiement :** Moneroo / CinetPay / Wave (Intégrations natives).

---

## 5. Roadmap

**Phase 1 : Le Moteur (Maintenant)**
*   Mise en place de la "Factory" Multi-Tenant.
*   Création de l'Agent Générique "Support N1" (Texte).

**Phase 2 : L'Intégration WhatsApp (Semaine 2)**
*   Connexion Evolution API.
*   Gestion des webhooks entrants.

**Phase 3 : La "Touch" Locale (Mois 1)**
*   Intégration Whisper (Audio).
*   Fine-tuning des prompts Nouchi.

**Phase 4 : Les Modules Métier (Mois 2+)**
*   Module "Transaction Check" (Fintech).
*   Module "Commande" (Retail).
