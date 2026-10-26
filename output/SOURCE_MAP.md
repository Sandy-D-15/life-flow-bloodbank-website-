# LifeFlow Blood Bank — Source Map & Technical Claim Traceability

**Standard:** University of Mumbai B.Sc. (Computer Science) Submission Standard  
**Document Purpose:** Complete evidentiary audit linking every technical claim, feature description, architecture model, database table, and security control in the Project Report to its exact file location, line range, or authoritative diagram page.

---

## 1. System Architecture & High-Level Design Claims

| Report Section | Technical Claim / Specification | Primary Source Reference | Verification Details |
|---|---|---|---|
| **Ch. 1 (1.1–1.4)** | LifeFlow 8-phenotype management (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) | `src/types/index.ts` L1–L2<br>`server/db.ts` L46–L55 | Union type definition and initialization of 8 ABO/Rh groups. |
| **Ch. 1 (1.3)** | 56-day whole-blood rest interval pre-screening | `src/components/DonorRegistration.tsx` L87–L118<br>`server.ts` L396–L413 | Mathematical calculation: `Math.floor(diffTime / 86400000) < 56` flags `Deferred`. |
| **Ch. 2 (2.1.1)** | Public Portal modules (Availability, Donor Registration, Requisition, Tracking) | `src/App.tsx` L224–L350 | Client-side tab router switching between `home`, `availability`, `donor`, `request`, `track`, `admin`. |
| **Ch. 2 (2.1.2)** | Dual-date donation scheduling with Google Calendar deep link | `src/components/DonorRegistration.tsx` L53–L67, L389–L395 | Primary & backup dates/slots with dynamic Google Calendar template generator. |
| **Ch. 2 (2.1.3)** | 4-Stage Hospital Requisition chain of custody | `src/types/index.ts` L7–L8<br>`server.ts` L657–L684 | Stages: `Submitted`, `Triage Review`, `Cross-Match`, `Dispatched`, `Rejected`. |
| **Ch. 2 (2.1.4)** | Admin Portal operations (triage, atomic mutation, donor registry, CSV export) | `src/components/AdminPortal.tsx` L65–L67 | Sub-tabs: `requests`, `inventory`, `donors`, `audit`, `security`. |
| **Ch. 2 (2.2)** | Atomic Stock Mutation with `+`, `-`, `=` modes | `server/db.ts` L414–L490<br>`server.ts` L226–L275 | Explicit operations with input validation and previous/resulting balance logging. |
| **Ch. 2 (2.2)** | Append-Only Immutable Transaction Ledger | `server/db.ts` L479–L482<br>`server.ts` L874–L882 | `db.transactions.unshift(transaction)` with `TX-xxxxxx-xx` ID generation. |
| **Ch. 2 (2.2)** | Rate-limited and sanitized public request tracker | `server.ts` L44–L59, L504–L548 | IP sliding-window limiter (60 req/min) and redaction of doctor/patient contact fields. |
| **Ch. 3 (3.5)** | Project Schedule: August 2026 to October 2026 (Weeks 32 to 41) | Diagram 12 (PDF Page 20) | Gantt chart mapping requirements through final review. |
| **Ch. 5 (5.2)** | 3-Tier Layered Architecture | Diagram 8.12 (PDF Page 13)<br>`server.ts` L35–L40 | Presentation (React+Tailwind), Application (Node/Express), Data (db.json/Mongo). |
| **Ch. 5 (5.7)** | PBKDF2 Password Hashing (SHA-512, 10,000 rounds, 16-byte salt) | `server/db.ts` L34–L43 | Zero plaintext passwords; high-entropy PBKDF2 cryptographic derivation. |
| **Ch. 5 (5.7)** | 24-Hour Cryptographically Secure Bearer Token | `server.ts` L135–L142 | `crypto.randomBytes(32).toString('hex')` stored in memory map with expiration. |
| **Ch. 5 (5.7)** | Asynchronous Concurrency Mutex (`withTransactionLock`) | `server/db.ts` L338–L345 | Promise chaining mutex prevents race conditions on database mutations. |

---

## 2. Database Entities & Implementation Traceability

| Report Section | Database Entity / Schema | Source Code File & Lines | Authoritative Diagram Page |
|---|---|---|---|
| **Ch. 6 (6.2.1)** | `BloodStockItem` (Phenotype Inventory) | `src/types/index.ts` L11–L17<br>`server/db.ts` L46–L55 | Diagram 8.1 (Class), 8.3 (ER) |
| **Ch. 6 (6.2.2)** | `Donor` (Voluntary Donor Registry) | `src/types/index.ts` L27–L50<br>`server/db.ts` L56–L137 | Diagram 8.1 (Class), 8.3 (ER) |
| **Ch. 6 (6.2.3)** | `BloodRequest` (Hospital Requisition) | `src/types/index.ts` L51–L70<br>`server/db.ts` L138–L286 | Diagram 8.1 (Class), 8.3 (ER) |
| **Ch. 6 (6.2.4)** | `StockTransaction` (Audit Ledger) | `src/types/index.ts` L73–L85<br>`server/db.ts` L287–L325 | Category B feature (Documented in Ch. 6) |
| **Ch. 6 (6.2.5)** | `AdminUser` (Administrator Account) | `src/types/index.ts` L96–L101<br>`server/db.ts` L326–L332 | Diagram 8.1 (Class), 8.3 (ER) |
| **Ch. 6 (6.2.6)** | `Appointment` (Designed Entity) | `src/components/DonationCenterMap.tsx`<br>`src/components/DonorRegistration.tsx` | Diagram 8.1 (Class), 8.3 (ER), 8.6(a), 8.16 |
| **Ch. 6 (6.2.7)** | `OtpRecord` (Designed Entity) | Section 2 (Mismatch Report A-2) | Diagram 8.1 (Class), 8.3 (ER), 8.13 (DFD 2) |
| **Ch. 6 (6.2.8)** | `Certificate` (Designed Entity) | Section 2 (Mismatch Report A-3) | Diagram 8.1 (Class), 8.3 (ER), 8.6(b), 8.18 |
| **Ch. 6 (6.3)** | File Persistence & Atomic Save Engine | `server/db.ts` L347–L378 | `getDb()`, `saveDb()` with JSON serialization to `data/lifeflow_db.json`. |
| **Ch. 6 (6.3)** | MongoDB Atlas Sync Engine | `server/mongo.ts` L8–L64 | `initMongo()`, `syncToMongo()` using official `mongodb` client. |

---

## 3. System Diagrams Traceability (Authoritative Diagrams PDF)

| Diagram No. | Diagram Title | PDF Page | Architectural Scope Covered |
|---|---|---|---|
| **Figure 8.1** | Class Diagram | Page 2 | Object-oriented class relationships (User, Admin, Donor, Appointment, OtpRecord, Certificate, BloodRequest, BloodInventory). |
| **Figure 8.2** | Object Diagram | Page 3 | Snapshot instance diagram during an active completed donation (`appt1`, `jane`, `admin1`, `center1`, `otp1`, `cert1`). |
| **Figure 8.3** | Entity Relationship (ER) Diagram | Page 4 | Relational data schema across 8 entities with primary/foreign key mappings. |
| **Figure 8.4** | Use Case Diagram | Page 5 | Actor interactions: Donor, Hospital/Patient, Admin, Public Verifier across 13 use cases. |
| **Figure 8.5** | Activity Diagram | Page 6 | End-to-end donation workflow: booking, slot check, admin OTP verification, stock update, PDF issuance. |
| **Figure 8.6** | State Machine Diagrams | Page 7 | (a) Appointment lifecycle (`Scheduled` $\rightarrow$ `OtpSent` $\rightarrow$ `Verified` $\rightarrow$ `Donated`); (b) Certificate lifecycle (`Valid` $\rightarrow$ `Revoked`). |
| **Figure 8.7** | Component Diagram | Page 8 | Client browser, Express server components, security middlewares, mailer, SMS, OTP, and data stores. |
| **Figure 8.8** | Deployment Diagram | Page 9 | Client web browser, Render cloud server, persistent storage volumes, and external cloud services. |
| **Figure 8.9** | Package Diagram | Page 10 | Frontend package structure, backend routing controllers, middleware packages, and data packages. |
| **Figure 8.10**| Data Flow Diagram (Level 0) | Page 11 | Context-level DFD showing external entities (Donor, Admin, Hospital, Verifier) interacting with Process 0. |
| **Figure 8.11**| Data Flow Diagram (Level 1) | Page 12 | Sub-processes: 1.0 Booking, 2.0 Admin Auth, 3.0 OTP Verification, 4.0 Complete Donation, 5.0 Certificate Management. |
| **Figure 8.12**| System Architecture Diagram | Page 13 | 3-tier architectural breakdown: Presentation Layer, Application Layer, Data Layer, and External Services. |
| **Figure 8.13**| DFD Level 2 (OTP Verification) | Page 14 | Micro-level data flow for Process 3.0: request validation, HMAC generation, transmission, validation, token issuance. |
| **Figure 8.14**| Communication Diagram | Page 15 | Message sequences between Frontend, ExpressServer, DataStore, CertificateService, and Mailer on donation completion. |
| **Figure 8.15**| Sequence: Donation Verification | Page 16 | Message lifeline sequence for Admin OTP generation, verification, and PDF certificate creation. |
| **Figure 8.16**| Sequence: Book Appointment | Page 17 | Message lifeline sequence for Donor appointment booking, capacity checks (`409`), and email confirmation. |
| **Figure 8.17**| Sequence: Admin Login | Page 18 | Message lifeline sequence for Admin login, Bcrypt credential comparison, and JWT generation (8h). |
| **Figure 8.18**| Sequence: Certificate Verification | Page 19 | Message lifeline sequence for QR code public scanning and certificate validation. |
| **Figure 12.1**| Project Gantt Chart | Page 20 | Detailed development lifecycle across Weeks 32 to 41 (August 2026 to October 2026). |

---

## 4. Source Code Extracts Traceability (Chapter 11)

| Sub-section | Source Code Topic | File Path | Line Range | Key Architectural Concept Demonstrated |
|---|---|---|---|---|
| **11.1** | Server Bootstrap & Security Middleware | `server.ts` | L35–L80 | Express initialization, rate limiter, admin Bearer auth middleware. |
| **11.2** | Admin Login & Cryptographic Token Issuance | `server.ts` | L105–L152 | PBKDF2 hash comparison and 24-hour token generation. |
| **11.3** | Administrative Credential Rotation | `server.ts` | L192–L213 | Current password verification, salt regeneration, credential persistence. |
| **11.4** | Atomic Inventory Mutation Engine | `server/db.ts` | L414–L490 | Asynchronous mutex locking, `+`/`-`/`=` operation parsing, oversell check. |
| **11.5** | Donor Registration & Interval Screening | `server.ts` | L337–L467 | Demographic bounds validation, 56-day interval evaluation, email trigger. |
| **11.6** | Hospital Requisition Creation | `server.ts` | L551–L649 | Unique ID generation (`REQ-xxxx`), urgency tagging, notification dispatch. |
| **11.7** | Requisition Stage Transition & Stock Deduction | `server.ts` | L652–L796 | State machine transition, atomic inventory deduction upon dispatch. |
| **11.8** | Sanitized Public Tracking Endpoint | `server.ts` | L505–L548 | Rate limiting and projection to `PublicRequestTracking`. |
| **11.9** | Asynchronous Notification Engine | `server/notifications.ts`| L42–L144 | Nodemailer HTML template compilation and SMTP transport dispatch. |
| **11.10** | Database Persistence & Lock Management | `server/db.ts` | L338–L378 | `withTransactionLock`, JSON reading/writing, fallback caching. |
| **11.11** | Shared TypeScript Type Definitions | `src/types/index.ts` | L1–L122 | Strong type contracts across client and server. |
| **11.12** | Navigation Bar & Live Emergency Badge | `src/components/Navbar.tsx`| L1–L120 | Responsive header, tab routing, critical shortage ticker. |
| **11.13** | Hero Component & Live KPI Metrics | `src/components/Hero.tsx` | L1–L140 | Hero presentation, live stat counters, call-to-action handlers. |
| **11.14** | Donor Registration & Pre-Screening UI | `src/components/DonorRegistration.tsx`| L87–L214 | Client-side validation, 56-day interval calculator, center selector. |
| **11.15** | Hospital Blood Requisition Form UI | `src/components/BloodRequestForm.tsx` | L1–L150 | Multi-level clinical request form with units limit and urgency styles. |
| **11.16** | Public Requisition Tracker UI | `src/components/RequestTracker.tsx` | L1–L140 | 4-stage visual stepper, time log, sanitized status metadata. |
| **11.17** | Admin Dashboard & Triage Interface | `src/components/AdminPortal.tsx` | L1–L150 | Tabbed administration command center. |
| **11.18** | Transfusion Matrix & Chart.js Visuals | `src/components/BloodAvailability.tsx`| L1–L160 | ABO/Rh compatibility matrix and Chart.js inventory visualizers. |
| **11.19** | Donation Center Geospatial Selector | `src/components/DonationCenterMap.tsx`| L44–L110 | Center directory, coordinates, hours, and slot availability. |
| **11.20** | Automated Test Suite | `tests/api.test.ts` | L1–L191 | 16 end-to-end automated API assertions. |

---

## 5. Automated & Manual Test Cases Traceability (Chapter 10)

| Test ID | Module | Verification Scope | Source File Reference | Actual Real-World Outcome |
|---|---|---|---|---|
| **TC-01** | System Core | Service Health Check | `tests/api.test.ts` L26–L29 | `PASS` (`200 OK`, `status: 'ok'`) |
| **TC-02** | Inventory | 8 Phenotypes Retrieval | `tests/api.test.ts` L31–L34 | `PASS` (`200 OK`, array length = 8) |
| **TC-03** | Inventory | Standard ABO/Rh Conformance | `tests/api.test.ts` L35–L39 | `PASS` (All 8 phenotypes verified) |
| **TC-04** | Donor Portal | Minor Under-Age (<18) Rejection | `tests/api.test.ts` L42–L55 | `PASS` (`400 Bad Request`, age rejected) |
| **TC-05** | Donor Portal | Valid Registration & DNR ID | `tests/api.test.ts` L57–L78 | `PASS` (`201 Created`, ID starts with `DNR-`) |
| **TC-06** | Donor Portal | Primary & Alternate Schedule | `tests/api.test.ts` L79 | `PASS` (Dates preserved in database) |
| **TC-07** | Donor Portal | Donation Center Association | `tests/api.test.ts` L80 | `PASS` (Center linked in profile) |
| **TC-08** | Hospital Portal | Requisition Generation (REQ-xxxx) | `tests/api.test.ts` L83–L100 | `PASS` (`201 Created`, ID starts with `REQ-`) |
| **TC-09** | Public Tracker | Initial 'Submitted' Stage | `tests/api.test.ts` L102–L104 | `PASS` (`200 OK`, stage = `Submitted`) |
| **TC-10** | Public Tracker | Privacy Redaction Verification | `tests/api.test.ts` L105 | `PASS` (Doctor email/phone strictly undefined) |
| **TC-11** | Security | Unauthenticated Admin Block | `tests/api.test.ts` L109–L110 | `PASS` (`401 Unauthorized` without token) |
| **TC-12** | Security | Administrator Login | `tests/api.test.ts` L112–L121 | `PASS` (`200 OK`, 32-byte hex token returned) |
| **TC-13** | Inventory | Explicit Intake Mutation (+) | `tests/api.test.ts` L124–L139 | `PASS` (`200 OK`, balance accurately incremented) |
| **TC-14** | Inventory | Oversell Rejection Protection (-) | `tests/api.test.ts` L141–L156 | `PASS` (`400 Bad Request`, dispatch blocked) |
| **TC-15** | Workflow | Requisition Stage Progression | `tests/api.test.ts` L158–L171 | `PASS` (`200 OK`, moved to `Triage Review`) |
| **TC-16** | Audit Ledger | Immutable Transaction Recording | `tests/api.test.ts` L173–L178 | `PASS` (`200 OK`, transaction log contains entry) |
