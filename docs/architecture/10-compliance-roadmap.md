# 10 — Compliance Roadmap

> Phased compliance implementation plan. Sanctions screening is the highest-priority item.

---

## Compliance Principles

1. **Regulatory First**: No feature ships that creates regulatory exposure without a mitigation plan.
2. **Jurisdiction-Aware**: WCN operates across US (SEC/CFTC/OFAC), EU (MiCA/GDPR), Singapore (MAS), Dubai (VARA).
3. **Evidence-Based**: Every compliance action is logged in the audit system.
4. **Progressive**: Compliance requirements scale with network activity and geographic reach.

---

## Phase 1 — P0: Sanctions Screening (Immediate Priority)

### Requirements
- Screen all new node applications against OFAC SDN, EU consolidated sanctions, UN Security Council lists
- Screen on: application submission, node activation, periodic re-check (weekly)
- Block sanctioned entities from proceeding through the node lifecycle

### Architecture
Integration point: `lib/modules/nodes/service.ts` at the application approval step.

**Option A (Recommended):** Third-party API integration
- Providers: Chainalysis KYT, Elliptic Lens, ComplyAdvantage
- Pros: Maintained lists, faster deployment, reduced liability
- Cons: Per-query cost, vendor dependency

**Option B (Fallback):** Self-hosted list import
- Download OFAC SDN CSV/XML → parse → store in PostgreSQL → fuzzy match
- Pros: No per-query cost, full control
- Cons: Maintenance burden, update lag, false positive tuning

### Data Flow
1. Application submitted → event `APPLICATION_SUBMITTED`
2. Before `APPROVED` transition: call sanctions screening API
3. If flagged: transition to `NEED_MORE_INFO`, create `RiskAlert` with severity CRITICAL
4. If clear: proceed to `APPROVED`
5. Weekly cron: re-screen all LIVE nodes

### Implementation Checklist
- [ ] Select sanctions screening provider and sign contract
- [ ] Add `SanctionsCheck` model to Prisma schema (entityType, entityId, provider, result, checkedAt)
- [ ] Create `lib/modules/risk/sanctions.ts` service
- [ ] Wire into node application review flow (before status transition to APPROVED)
- [ ] Wire into user creation flow (KYC stub)
- [ ] Add weekly cron job for periodic re-screening of active nodes
- [ ] Create RiskAlert on positive match
- [ ] Add admin UI panel for reviewing sanctions flags
- [ ] Add audit trail for all screening decisions

### Estimated Effort
- API integration: 3-5 days
- UI + admin panel: 2-3 days
- Testing + QA: 2-3 days

---

## Phase 2 — P1: KYC/KYB Framework (Target: Q2 2026)

### Requirements
- Identity verification for individual node operators (KYC)
- Business verification for organizational nodes (KYB)
- Document verification (passport, business registration, proof of address)

### Architecture
- Integration with KYC provider (Sumsub, Onfido, Jumio)
- Verification status tracked on User model: PENDING_KYC, KYC_APPROVED, KYC_FAILED
- Node activation gated on KYC completion for operator

### Implementation Checklist
- [ ] Select KYC/KYB provider
- [ ] Add KYC status fields to User and Node models
- [ ] Create verification flow UI
- [ ] Wire KYC completion into node activation gate
- [ ] Handle KYC failure / document re-submission flow

---

## Phase 3 — P1: Transaction Monitoring (Target: Q3 2026)

### Requirements
- Monitor settlement distributions for suspicious patterns
- AML threshold reporting (large value transactions)
- Velocity checks on deal creation and settlement frequency

### Architecture
- Extend `lib/modules/risk/` with transaction monitoring rules
- New RiskRule types: LARGE_SETTLEMENT, HIGH_FREQUENCY_DEALS, UNUSUAL_ATTRIBUTION
- Automated STR (Suspicious Transaction Report) generation

### Implementation Checklist
- [ ] Define AML thresholds per jurisdiction
- [ ] Add transaction monitoring risk rules
- [ ] Create STR report generation system
- [ ] Add compliance officer review workflow
- [ ] Integrate with settlement cycle approval gate

---

## Phase 4 — P2: Full Regulatory Reporting (Target: Q4 2026)

### Requirements
- GDPR: Data Subject Access Request (DSAR) automation
- MiCA: Crypto-asset service provider reporting
- SEC: Record retention (7-year audit log policy — already in place via audit module)
- SOC 2: Automated control evidence collection

### Implementation Checklist
- [ ] Build DSAR automation (data export, right to erasure with audit trail)
- [ ] Create MiCA compliance reporting module
- [ ] Verify 7-year audit retention policy enforcement
- [ ] SOC 2 control evidence dashboard

---

## Jurisdictional Matrix

| Jurisdiction | Regulator | Key Requirements | WCN Impact | Phase |
|---|---|---|---|---|
| US | OFAC/FinCEN | Sanctions screening, AML/BSA | Node onboarding, settlements | 1-3 |
| US | SEC | Securities registration (if applicable) | Token design, settlement methods | 4 |
| EU | MiCA/ESMA | CASP registration | Service classification | 4 |
| EU | GDPR/DPA | Data protection, DSAR | User data handling, audit logs | 4 |
| Singapore | MAS/DPT | Digital payment token services | Settlement, token design | 3 |
| Dubai | VARA | Virtual asset regulation | Regional node compliance | 3 |

---

## Risk Matrix

| Risk | Impact | Likelihood | Mitigation | Phase |
|---|---|---|---|---|
| Sanctioned entity onboarded | Critical | Medium | Sanctions screening at onboarding + periodic re-check | 1 |
| Unverified identity operates node | High | Medium | KYC/KYB gating | 2 |
| Money laundering via settlements | Critical | Low | Transaction monitoring + STR reporting | 3 |
| GDPR non-compliance (data breach) | High | Medium | DSAR automation + data minimization | 4 |
| Securities law violation | Critical | Low | Legal review of token design before Phase 5 | 4 |

---

## References

- OFAC SDN List: https://sanctionssearch.ofac.treas.gov/
- EU Consolidated Sanctions: https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions
- MiCA Regulation: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023R1114
- Singapore Payment Services Act: https://www.mas.gov.sg/regulation/acts/payment-services-act
