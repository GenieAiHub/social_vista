---
name: Social Vista AI chat agent
description: How the "Powered by GNX AI" chat agent is grounded in the platform's services.
---

# Social Vista AI chat agent

The chat agent (Groq `llama-3.3-70b-versatile`, route `POST /chat` in api-server) is grounded in the agency's services at request time, not from a hardcoded list.

**Knowledge source split:** the DB `servicesTable` is the source of truth for *which* services exist (so admin add/edit/disable shows up with no redeploy). Rich per-service detail (tagline/summary/benefits/deliverables/idealFor) lives in `artifacts/api-server/src/lib/services-knowledge.ts`, keyed by `normalizeKey(title)`. The route fetches active DB services, merges each with the knowledge entry, and builds the system prompt. If no knowledge entry matches, it falls back to the DB `description`.

**Drift risk:** enrichment keys are derived from the mutable service title. Renaming a service title (wording/punctuation) can break the knowledge match and degrade answer quality (falls back to description). If this becomes a problem, store a stable `slug`/`knowledgeKey` column instead of deriving from title. Note: `normalizeKey` mirrors the frontend `slugify` in `services-content.ts` — keep them consistent.

**Conversation memory:** `ChatMessageInput.history` (array of `ChatTurn {role: user|assistant, content}`) carries prior turns; backend forwards the last 8 to the model. Input limits in the OpenAPI spec: message/content maxLength 2000, history maxItems 20.

**Trust note:** client-supplied history is untrusted but the role enum blocks any `system` injection; residual risk (a client faking its own prior assistant turns) only affects that caller's session — acceptable for a public marketing bot with no tools/private data.

**Prompt guardrails:** answer only from the knowledge base, never invent pricing/timelines, always steer to the contact form / free consultation, keep replies ~150 words.

**Lead-save idempotency (important):** the model re-calls `save_consultation_lead` on every new detail during a multi-turn booking, and the forwarded history is plain text only — the model has no memory that it already saved. So the save MUST be idempotent server-side, or each turn creates a duplicate lead. The route dedups by matching a recent (`createdAt` within ~6h) `source='chat'` lead on email OR phone and UPDATEs it in place, only inserting (+`created` activity) when no match. **Why:** prompt instructions alone ("only call once") don't stop the model. Don't switch to insert-only without re-introducing duplicates.
