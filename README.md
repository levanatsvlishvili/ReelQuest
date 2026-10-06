# ReelQuest 🎬🕹️
> **Enterprise Serverless Movie Gaming Platform**  
> High-performance actor-movie graph discovery, real-time leaderboards, and resilient cloud-native architecture.

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless%20Architecture-232F3E.svg)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC.svg)](https://www.terraform.io/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg)](https://reactjs.org/)

---

## 🌟 Key Architecture Highlights

1. **Graph Traversal Engine (Bidirectional BFS):**
   * Computes shortest path connections between any two actors across ~30,000 films and ~70,000 actors in `< 30ms`.
   * Reduces search state space by **>99.6%** compared to unidirectional BFS ($O(2 \cdot b^{d/2})$ vs $O(b^d)$).

2. **Distributed Idempotency Engine:**
   * Safe request retries on game score submissions and billing actions.
   * DynamoDB conditional write locking with 24-hour TTL expiration.

3. **Transactional Outbox Pattern (CDC):**
   * Dual-write consistency without 2PC.
   * Game sessions and Outbox events are committed atomically via `TransactWriteItems`.
   * DynamoDB Streams triggers an Outbox Relay Lambda to publish domain events to Amazon EventBridge.

4. **SAGA Distributed Transaction Pattern:**
   * Freemium subscription upgrade workflow with compensating transactions.
   * Decoupled integration with Stripe Sandbox webhooks and AWS Cognito role management.

5. **FinOps Optimized (AWS Free Tier):**
   * Engineered to operate entirely within the **AWS Free Tier ($0/month)**.

---

## 📁 Repository Structure

```text
reelquest/
├── backend/                  # Java 21 Multi-Module Serverless Engine
│   ├── core-domain/          # Graph BFS algorithms, domain entities (Hexagonal Core)
│   ├── game-service/         # Game REST API Lambda (AWS SnapStart enabled)
│   ├── outbox-relay/         # DynamoDB Streams -> EventBridge dispatcher Lambda
│   └── billing-service/      # SAGA orchestrator for subscriptions & webhooks
├── frontend/                 # React 18 + Vite + Tailwind CSS + React Flow SPA
├── infra/                    # Terraform Modules (DynamoDB, Cognito, EventBridge, Lambda, CDN)
│   ├── environments/         # dev / prod environment configurations
│   └── modules/              # Reusable Terraform modules
├── scripts/                  # Data ingestion pipeline (IMDb/TMDB Top 30K graph builder)
└── .github/workflows/        # Automated CI/CD pipelines
```

---

## 🚀 Getting Started

### Prerequisites
* Java 21 LTS
* Apache Maven 3.9+
* Node.js 20+ & npm
* Terraform 1.6+
* AWS CLI v2 configured

### Build Backend
```bash
cd backend
mvn clean install
```

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
