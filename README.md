# LifeFlow Blood Bank — Master Architecture & Documentation

> **Tagline:** “Saving Lives, One Drop at a Time”  
> **System:** LifeFlow Verified Blood Bank Management & Hospital Requisition Engine  
> **Status:** Fully Operational & Automated Test Verified (14/14 tests passing)

---

## 1. Executive Summary

LifeFlow Blood Bank is a production-grade, full-stack healthcare platform engineered to bridge voluntary blood donors, emergency hospital trauma centers, transfusion medicine laboratories, and administrative dispatch operators.

The system enforces strict data integrity rules:
- **Zero Inventory Falsification:** Requisitions can never be marked as fulfilled or dispatched unless confirmed, unreserved stock actually exists in the thermal vault.
- **Atomic Concurrency Protection:** Synchronized transaction locking prevents race conditions and inventory overselling during simultaneous hospital trauma orders.
- **Append-Only Immutable Ledger:** Every intake, dispatch, and physical recount logs before/after balances with authorized operator identity.
- **Data Privacy & Sanitization:** Public tracking endpoints are rate-limited and stripped of private donor records, physician phone numbers, and sensitive patient clinical identifiers.

---

## 2. Administrator Authentication & Evaluation Credentials

- **Username:** `admin`
- **Master Password:** `LifeFlow@2026Admin`
- **Role:** `superadmin` / Medical Director (`Dr. Victoria Shaw`)
- **Session Lifespan:** 24-Hour Bearer Token, cryptographically generated with SHA-512 PBKDF2 salting.

---

## 3. Core Modules & Clinical Workflows

### 3.1 Live Blood Availability Dashboard
- Real-time inventory tracking across all 8 standard phenotypes: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
- Dynamic status thresholding:
  - **Critical Alert:** $< 5$ units (triggers urgent visual pulse).
  - **Low Reserve:** $5$ to $12$ units.
  - **Sufficient Stock:** $> 12$ units.
- Interactive Chart.js bar and doughnut chart visualizations.
- Educational **ABO & Rh Transfusion Compatibility Matrix** with explicit clinical disclaimer distinguishing educational guidelines from lab cross-matching.

### 3.2 Donor Registration & Pre-Screening
- Dual-layer validation (frontend and backend).
- Strict demographic bounds: age 18–65, weight $\ge$ 50 kg (110 lbs), valid email, and telephone.
- Dynamic 56-day whole-blood rest interval calculator.
- **Clinical Eligibility Notice:** Clearly informs donors that demographic forms provide preliminary pre-screening only; official clearance is determined on-site via hemoglobin testing ($\ge$ 12.5 g/dL) and vital sign evaluation.

### 3.3 Hospital Requisition Engine
- Priority triage classifications: `Normal`, `Urgent`, and `Critical`.
- Collision-safe unique reference generation (`REQ-8021`).
- Atomic stock reservation and deduction upon confirmed dispatch.

### 3.4 Public Requisition Tracker
- Sanitized public tracking displaying the 4-stage chain of custody:
  1. **Submitted:** Requisition queued in triage.
  2. **Triage Review:** Medical director verified clinical authorization.
  3. **Cross-Match:** Laboratory serological cross-match in progress.
  4. **Dispatched:** Handed to certified cold-chain courier (+2°C to +6°C).
- Rate-limited to prevent brute-force reconnaissance.

### 3.5 Administrative Command Operations
- **Explicit Inventory Operations:**
  - `Intake (+)`: Verified incoming donations or blood drive shipments.
  - `Dispatch (-)`: Verified courier release (blocks if stock is insufficient).
  - `Count (=)`: Physical vault audit reconciliation.
- **Append-Only Audit Ledger:** Records operation, units, previous balance, resulting balance, reason, timestamp, and authenticated operator.
- **Donor Registry:** Search, filter by phenotype, and export to CSV.
- **Credential Rotation:** Built-in password rotation mechanism.

---

## 4. Entity-Relationship (ER) Architecture

```
+------------------------------------+
|               Donor                |
+------------------------------------+
| id (PK, VARCHAR)                   |
| fullName (VARCHAR)                 |
| bloodGroup (VARCHAR)               |
| age, weight (NUMERIC)              |
| email, phone (VARCHAR)             |
| city (VARCHAR)                     |
| lastDonationDate (DATE/NULL)       |
| registeredAt (TIMESTAMP)           |
| status (Active|Deferred)           |
| totalDonations (INTEGER)           |
| eligibilityNotes (TEXT)            |
+-----------------+------------------+
                  |
                  | registered via public portal
                  v
+-----------------+------------------+            +------------------------------------+
|          BloodStockItem            |            |          StockTransaction          |
+------------------------------------+            +------------------------------------+
| bloodGroup (PK, VARCHAR)           |<-----------| id (PK, VARCHAR)                   |
| unitsAvailable (INTEGER)           |  mutates   | bloodGroup (FK, VARCHAR)           |
| reservedUnits (INTEGER)            |  ledger    | operation (+|-|=)                  |
| minThreshold (INTEGER)             |            | type (IN|OUT|ADJUST)               |
| lastUpdated (TIMESTAMP)            |            | units (INTEGER)                    |
+-----------------+------------------+            | previousBalance (INTEGER)          |
                  ^                               | resultingBalance (INTEGER)         |
                  | deducted upon dispatch        | reason (TEXT)                      |
+-----------------+------------------+            | referenceId (FK, VARCHAR/NULL)     |
|           BloodRequest             |            | recordedBy (VARCHAR)               |
+------------------------------------+            | timestamp (TIMESTAMP)              |
| id (PK, VARCHAR)                   |            +------------------------------------+
| hospitalName (VARCHAR)             |
| bloodGroup (FK, VARCHAR)           |
| units (INTEGER)                    |
| urgency (Normal|Urgent|Critical)   |
| currentStage (RequestStage)        |
| status (Pending|Approved|Fulfilled)|
| statusHistory (JSON Array)         |
| contactPerson, contactPhone, email |
| createdAt, updatedAt, fulfilledAt  |
+------------------------------------+
```

---

## 5. API Reference

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Service health and uptime |
| `/api/stats` | GET | Public | Operational dashboard KPI metrics |
| `/api/inventory` | GET | Public | Available units for all 8 blood groups |
| `/api/inventory/mutate` | POST | Admin | Atomic `+`, `-`, or `=` stock mutation with audit |
| `/api/donors` | POST | Public | Voluntary donor pre-screening registration |
| `/api/donors` | GET | Admin | Searchable and filterable donor registry |
| `/api/requests` | POST | Public | Hospital emergency requisition order |
| `/api/requests` | GET | Admin | Comprehensive requisition triage queue |
| `/api/requests/:id` | GET | Public | Sanitized, rate-limited chain-of-custody tracker |
| `/api/requests/:id/stage` | PATCH | Admin | Progresses order stage with atomic stock deduction |
| `/api/transactions` | GET | Admin | Immutable append-only audit trail |
| `/api/auth/login` | POST | Public | Authenticates admin and returns Bearer token |
| `/api/auth/change-password` | POST | Admin | Rotates master credentials with salt regeneration |

---

## 6. Automated Testing Report

Execute the automated test suite at any time:
```bash
npm test
```

### Test Suite Execution Output
```
> tsx tests/api.test.ts
--- Starting LifeFlow Automated Test Suite ---
  ✓ Health check reports operational status
  ✓ Blood inventory returns all 8 phenotypes
  ✓ Inventory contains exact ABO and Rh standard groups
  ✓ Donor under 18 years is rejected with 400
  ✓ Valid donor is registered with assigned DNR-xxxx ID
  ✓ Hospital requisition generates unique collision-free REQ reference
  ✓ Public tracking retrieves initial Submitted stage
  ✓ Public tracking does not leak contactEmail or phone
  ✓ Unauthenticated admin access to requests is blocked with 401
  ✓ Administrator login succeeds with bearer token
  ✓ Intake (+) correctly adds units and logs previous/resulting balance
  ✓ Dispatch (-) is blocked with 400 when requested quantity exceeds available stock
  ✓ Requisition transitions to Triage Review with audit entry
  ✓ Audit log contains recorded append-only transactions

--- Test Results: 14 passed, 0 failed ---
```

---

## 7. Execution & Deployment Instructions

### Development Mode
```bash
npm install
npm run dev
# Server listening on http://localhost:5000 (configurable via PORT env)
```

### Production Build & Launch
```bash
npm run build
npm start
```


## Animation approach (LifeFlow refinement)

This project uses GSAP + ScrollTrigger for restrained entrance/reveal motion on real interface sections. The animation system intentionally avoids constant floating widgets, random particles, fake live metrics, and exaggerated page transitions so the blood-bank workflow remains credible and easy to use. The existing Motion dependency remains available for component-level interactions where it adds value; avoid adding another library unless a specific interaction needs it. Reduced-motion preferences are respected.

Run locally with `npm install` then `npm run dev`. Validate with `npm run lint`, `npm run build`, and `npm test` before deployment.
