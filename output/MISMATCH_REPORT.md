# LifeFlow Blood Bank — Architecture Reconciliation & Mismatch Report

**Document Status:** Complete (Phase 1 Reconciliation Gate)  
**Author:** Technical Documentation & Engineering Team  
**Evaluation Standard:** University of Mumbai, Final-Year B.Sc. (Computer Science)  
**Authority Rule:** All technical claims must be grounded in verified codebase evidence or authoritative architectural design diagrams (LifeFlow-Blood-Bank-Diagrams.pdf). Discrepancies must be transparently reconciled and never silently obscured.

---

## 1. Executive Summary

This report provides a comprehensive, bidirectional architectural audit comparing the **20 authoritative system design diagrams** (`LifeFlow-Blood-Bank-Diagrams.pdf`, covering diagrams 8.1 through 8.18 and Gantt chart 12) against the **active production source code** (`server.ts`, `server/*.ts`, `src/components/*`, `src/types/index.ts`, `tests/api.test.ts`, and `package.json`).

The comparison reveals three key categories of technical differences:
- **Category A (In Diagrams, Not in Code):** Features architecturally specified in UML/DFD models that are not implemented in the current code build (e.g., OTP verification, PDFKit certificate generation, separate appointments table, SMS gateways).
- **Category B (In Code, Not in Diagrams):** High-value clinical and logistical modules actively working in the codebase that were not included in the original diagrams (e.g., 4-stage hospital requisition workflow, atomic inventory mutation with oversell locking, immutable append-only audit ledger, 56-day whole-blood interval calculator).
- **Category C (Technical & Naming Discrepancies):** Differences in naming conventions, cryptographic implementations, authentication schemes, and persistence drivers.

---

## 2. Category A: Features Present in Diagrams, but Absent in Current Codebase

| Item ID | Architectural Element | Diagram Reference(s) | Description in Diagrams | Status in Codebase |
|---|---|---|---|---|
| **A-1** | **Standalone Appointment Entity & Slot Capacity Enforcer** | 8.1, 8.3, 8.4, 8.5, 8.6(a), 8.7, 8.11, 8.16 | `Appointment` is an independent database entity (`id`, `center_id`, `name`, `email`, `phone`, `bloodType`, `appointmentDate`, `appointmentTime`, `status`, `certificateId`, `donatedUnits`). Includes slot capacity tracking returning HTTP `409 Slot fully booked` when bookings reach `MAX_PER_SLOT`. | **Not Implemented as Standalone Entity.** The codebase integrates appointment scheduling directly into `POST /api/donors` (capturing `preferredDonationDate`, `alternateDonationDate`, `donationSlot`, `alternateDonationSlot`, `donationCenter`, `donationCenterAddress`). No separate appointments table or 409 capacity rejection exists. |
| **A-2** | **6-Digit OTP Verification Module with HMAC-SHA256 & Verification JWT** | 8.1, 8.3, 8.4, 8.5, 8.6(a), 8.7, 8.10, 8.11, 8.12, 8.13, 8.14, 8.15 | Admin triggers `POST /api/donation/send-otp`. System generates 6-digit OTP, stores HMAC-SHA256 hash in `OTPS` store (`appointmentId`, `hmac`, `expiresAt`, `attempts`, `usedAt`, `sendCount`), and transmits via email/SMS. Admin inputs OTP via `POST /api/donation/verify-otp`. Upon validation (< 5 attempts), system issues a short-lived `verification JWT`. | **Not Implemented.** Neither `lib/otp.js`, OTP database collection, nor donation OTP verification endpoints exist. No SMS dispatch is present. |
| **A-3** | **Donation Completion & Server-Side PDF Certificate Generation** | 8.1, 8.3, 8.4, 8.5, 8.6(b), 8.7, 8.11, 8.14, 8.15 | Admin invokes `POST /api/donation/complete` with verification JWT and units (1–2). System creates a `Certificate` record, updates stock, renders an official PDF certificate with embedded QR code via `PDFKit` + `QRCode`, emails the PDF to the donor, and supports revocation. | **Not Implemented Server-Side.** `package.json` contains neither `pdfkit` nor `qrcode`. No `Certificate` database entity or `/api/donation/complete` route exists. *(Note: The client-side `DonorRegistration.tsx` displays an on-screen "Verified Donor Pass" with an SVG QR icon, but this is distinct from server-generated cryptographically signed PDF certificates).* |
| **A-4** | **Public Certificate Verification Endpoint (`GET /verify/:certificateId?k=verifyKey`)** | 8.4, 8.5, 8.11, 8.18 | Public QR scan routes to `GET /verify/:certificateId?k=verifyKey`. System validates `verifyKey`, checks revocation status, and renders a verification screen displaying donor initials, blood group, units, and donation center. | **Not Implemented.** No public verification route or verification page exists in the web server or frontend router. |
| **A-5** | **SMS Gateway Integration (Twilio / Fast2SMS)** | 8.7, 8.8, 8.9, 8.12, 8.13, 8.15 | Multi-channel notification pipeline sending appointment confirmations and OTP codes over cellular SMS networks using Twilio or Fast2SMS. | **Not Implemented.** `server/notifications.ts` exclusively utilizes `nodemailer` for email transport. No cellular SMS SDKs, API integrations, or environment keys exist. |
| **A-6** | **Bcrypt Password Hashing & 8-Hour JWT Session Tokens** | 8.1, 8.7, 8.8, 8.9, 8.12, 8.17 | Admin credentials hashed with `bcrypt.compare()`. Successful authentication returns an 8-hour JSON Web Token (`jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' })`). | **Different Mechanism in Code.** The codebase uses Node's standard `crypto.pbkdf2Sync` (SHA-512, 10,000 iterations, 16-byte random salt) and issues 32-byte hexadecimal random bearer tokens valid for 24 hours, tracked in-memory via `activeTokens: Map`. |
| **A-7** | **Cloud Deployment on Render & Mongoose ODM** | 8.8, 8.9, 8.12, 8.13, 12 | System deployed as a containerized/hosted service on Render cloud infrastructure, interacting with MongoDB Atlas via Mongoose ODM. | **Local Execution with Native Driver.** Codebase runs locally on Node.js/Vite on port 5000. Database layer uses native `mongodb` driver (`MongoClient`, not Mongoose) with automated local file storage (`data/lifeflow_db.json`) via `USE_JSON_FALLBACK`. |
| **A-8** | **Isolated `centers.json` Backend File Store** | 8.7, 8.8, 8.9, 8.10, 8.12 | Architecture diagrams show a dedicated `data/centers.json` flat file storing donation center coordinates, operating hours, and capacity limits. | **Static Frontend Definition.** Donation centers are maintained in TypeScript within `src/components/DonationCenterMap.tsx` (`DONATION_CENTERS` array). |

---

## 3. Category B: Features Present in Codebase, but Absent in Diagrams

| Item ID | Codebase Module | Implementation Files | Detailed Technical Capability | Representation in Diagrams |
|---|---|---|---|---|
| **B-1** | **Hospital Requisition 4-Stage Lifecycle Stepper** | `server.ts` (L651–796), `src/components/AdminPortal.tsx`, `src/types/index.ts` | Complete clinical requisition custody chain: `Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched` (or `Rejected`). Maintains full chronological `statusHistory` entries with timestamps, actors, and administrative triage notes. | **Omitted in Diagrams.** Diagrams only show a binary status (`pending` / `fulfilled`) without stage progression or serology cross-match modeling. |
| **B-2** | **Sanitized Public Requisition Tracker with IP Rate Limiting** | `server.ts` (L504–548), `src/components/RequestTracker.tsx` | Secure public tracking endpoint (`GET /api/requests/:id`) enforcing sliding-window IP rate limiting (60 req/min). Returns sanitized `PublicRequestTracking` object that strictly redacts physician emails, personal phone numbers, and private patient clinical identifiers to prevent reconnaissance. | **Omitted in Diagrams.** Diagrams show public tracking only for donor certificates, not hospital blood requisitions. |
| **B-3** | **Explicit Atomic Inventory Operations (`+`, `-`, `=`) with Oversell Locking** | `server.ts` (L225–275), `server/db.ts` (L414–490), `src/components/AdminPortal.tsx` | Administrative stock mutations explicitly segregated into: `+` (Intake/blood drives), `-` (Dispatch to hospital), and `=` (Audit count reconciliation). Powered by `withTransactionLock` promise mutex; strictly blocks dispatch attempts if requested units exceed available unreserved units (HTTP 400). | **Omitted in Diagrams.** Diagrams model only a generic `addUnits()` method and unconstrained stock increments. |
| **B-4** | **Immutable Append-Only Stock Transaction Audit Ledger** | `server/db.ts` (L464–482), `server.ts` (L874–882), `src/components/AdminPortal.tsx` | Every inventory mutation logs an immutable `StockTransaction` record containing `id`, `bloodGroup`, `operation`, `type` (`IN`/`OUT`/`ADJUST`), `units`, `previousBalance`, `resultingBalance`, `reason`, `referenceId`, `recordedBy`, and `timestamp`. Admin portal provides a searchable audit table. | **Omitted in Diagrams.** No transaction history ledger or audit entity exists in the diagrams. |
| **B-5** | **Clinical 56-Day Whole-Blood Rest Interval Calculator** | `server.ts` (L396–413), `src/components/DonorRegistration.tsx` (L86–120) | Validates voluntary donor eligibility against the mandatory 56-day physiological recovery window (WHO/NBTC standards). Automatically calculates elapsed days, days remaining, and earliest eligible date. Automatically assigns `Active` vs `Deferred` clinical status. | **Omitted in Diagrams.** Diagrams show generic donor registration with no interval calculations or medical deferrals. |
| **B-6** | **Dual Date Scheduling (Primary & Alternate) with Center Integration** | `server.ts` (L428–434), `src/components/DonorRegistration.tsx` (L57–67) | Donors can select both a preferred donation date/time-slot and a backup alternate date/slot linked to specific geographic centers, providing flexibility during clinical callouts. | **Omitted in Diagrams.** Diagrams show only a single appointment date and slot. |
| **B-7** | **Interactive Transfusion Compatibility Matrix & Chart.js Visualizations** | `src/components/BloodAvailability.tsx`, `src/components/BloodCharts.tsx`, `src/components/LiveInventoryOverview.tsx` | Dynamic 8×8 ABO & Rh compatibility matrix highlighting reciprocal donor/recipient compatibility rules with explicit medical disclaimers, paired with Chart.js responsive doughnut and bar charts. | **Minimal in Diagrams.** Mentioned only as a generic label ("Stock charts") in the architecture diagram. |
| **B-8** | **Administrative In-App Credential Rotation** | `server.ts` (L191–213), `src/components/AdminPortal.tsx` | Authenticated endpoint (`POST /api/auth/change-password`) allowing administrators to rotate master credentials with old password verification, minimum length enforcement (8+ chars), and automatic cryptographic salt regeneration. | **Omitted in Diagrams.** Not modeled in UML class or sequence diagrams. |

---

## 4. Category C: Naming & Technical Architecture Differences

| Dimension | Architectural Diagrams Specification | Active Codebase Implementation | Technical Justification & Impact |
|---|---|---|---|
| **Blood Group Type** | `bloodType: String` | `bloodGroup: BloodGroup` (TypeScript union: `'A+' \| 'A-' \| 'B+' \| 'B-' \| 'AB+' \| 'AB-' \| 'O+' \| 'O-'`) | TypeScript string literals prevent invalid phenotype entries at compile time and runtime. |
| **Password Cryptography** | `bcrypt` (`bcrypt.compare()`) | `crypto.pbkdf2Sync` (SHA-512, 10,000 iterations, 16-byte cryptographically secure salt) | Zero external native C++ binary dependencies; utilizes high-entropy Node.js native crypto runtime. |
| **Session Token Architecture** | `jsonwebtoken` (JWT, 8-hour expiry) | 32-byte hexadecimal cryptographically secure random token (24-hour expiry) stored in server memory (`activeTokens`) | Provides immediate server-side token invalidation upon logout; prevents stale client-side token reuse. |
| **Database Driver** | MongoDB via Mongoose ODM | Native `mongodb` driver (`MongoClient`) + fallback JSON file store (`data/lifeflow_db.json`) | Allows seamless zero-configuration development and automated offline test execution without requiring a live cloud database cluster. |
| **Entity Identifiers** | MongoDB `_id: ObjectId`, UUIDs | Semantic collision-safe human-readable strings (`DNR-1001`, `REQ-8021`, `TX-9001`) | Facilitates verbal communication and telephone triage between hospital emergency rooms and blood bank dispatchers. |
| **Centers Data Source** | `data/centers.json` | `src/components/DonationCenterMap.tsx` (`DONATION_CENTERS`) | Bundles geospatial coordinates directly into client bundle for instant map rendering without secondary network roundtrips. |

---

## 5. Phase 1 Reconciliation Gate Questions

To ensure the Final-Year Project Report strictly adheres to University of Mumbai guidelines while maintaining 100% intellectual honesty, please provide your decision on the following Category A items:

### Question 1: Standalone Appointments, OTP Verification, and PDF Certificates (Items A-1, A-2, A-3, A-4)
These four modules form an interconnected workflow in Diagrams 8.1–8.18 (Appointment booking $\rightarrow$ 6-digit OTP via email/SMS $\rightarrow$ Verification JWT $\rightarrow$ Complete donation $\rightarrow$ PDFKit certificate with QR code $\rightarrow$ Public QR verify route). In the current code build, appointment booking is handled inside donor registration, and stock is managed via atomic intake/dispatch.

**How should these be treated in the report?**
- **Option 1.1 (Recommended):** Document as **"Designed Module (Detailed Architectural Specification for Next Build Phase)"**. Present diagrams 8.1–8.18 in Chapter 8 with full technical descriptions of the designed OTP, JWT, and PDFKit workflows, while clearly distinguishing them in Chapter 1, 2, 4, 5, and 13 from the currently implemented donor registration and hospital requisition engines. *(Matches prompt rule: "keep in report labelled 'Designed module (not implemented in current build)'")*.
- **Option 1.2:** Implement the backend routes and logic for `/api/appointments`, OTP generation/verification, and PDFKit certificate generation in the codebase first, update automated tests, and then document as fully implemented.
- **Option 1.3:** Mark diagrams 8.1–8.18 as legacy/outdated conceptual designs and document only the current codebase implementation.

### Question 2: Cellular SMS Gateway (Item A-5)
Diagrams 8.7, 8.8, 8.9, 8.12, 8.13 show Twilio / Fast2SMS, whereas `server/notifications.ts` implements SMTP email notifications via Nodemailer.
- **Option 2.1 (Recommended):** Document SMTP email dispatch as the **Implemented Notification Channel** and document SMS gateway integration under **Future Scope (Chapter 14)** and as part of the designed OTP architecture.
- **Option 2.2:** Add mock/stub Twilio/Fast2SMS provider to `server/notifications.ts`.

### Question 3: Bcrypt/JWT vs PBKDF2/Bearer Tokens (Item A-6)
Diagrams specify Bcrypt + JWT (8h), while the codebase implements PBKDF2 (SHA-512) + opaque bearer tokens (24h).
- **Option 3.1 (Recommended):** Transparently document both: explain the implemented PBKDF2 + Bearer token security architecture in Chapter 5 (Security Design) and Chapter 6 (Database Implementation), while acknowledging the Bcrypt/JWT design in the UML diagrams explanation in Chapter 8.
- **Option 3.2:** Refactor `server.ts` to use `bcryptjs` and `jsonwebtoken` to achieve 100% syntactic parity with the diagram labels.

---
*End of Mismatch Report.*
