# CHAPTER 4: REQUIREMENT SPECIFICATION

## 4.1 Introduction

A requirement specification represents the foundational contract between clinical stakeholders, administrative end-users, software engineers, and quality assurance evaluators. In the context of life-critical healthcare systems such as blood banking and transfusion medicine, requirement elicitation demands an exceptional degree of rigorous precision. Blood products cannot be synthesized synthetically; they represent perishable, life-saving biological assets subject to rigorous physiological constraints, strict cold-chain surveillance protocols (+2°C to +6°C for whole blood), and zero-tolerance policies regarding inventory falsification.

The LifeFlow Blood Bank Management System requirement specification articulates both the behavioural capabilities (functional requirements) and the operational quality attributes (non-functional requirements) of the platform. This specification reflects the active production build (React 19, TypeScript, Express, and JSON/MongoDB dual-storage architecture) as well as the formal architectural designs established for secondary phased integration. The following sub-sections delineate the precise functional requirements categorised by clinical and operational modules, the measurable non-functional constraints, the exact software and hardware specifications, actor profiles, and environmental operational dependencies.

---

## 4.2 Functional Requirements

Functional requirements define the core operational features, data transformations, administrative workflows, and business validation rules enforced by the system. The functional requirements for LifeFlow are organized systematically across five key operational domains: Public Blood Availability & Compatibility Matrix, Donor Pre-Screening & Registration, Hospital Emergency Blood Requisitions, Administrative Command & Atomic Stock Mutations, and Chain-of-Custody Tracking.

Table 4.1 outlines the complete functional requirements matrix, specifying the unique identifier, functional scope, interacting primary actor, and operational priority (categorized as High, Medium, or Low).

### Table 4.1: Functional Requirements Specification Matrix

| FR-ID | Requirement Description | Interacting Actor | Operational Priority |
|---|---|---|---|
| **FR-01** | **Live 8-Phenotype Stock Retrieval:** The system shall retrieve and render current available unit balances across all eight standard ABO and Rh phenotypes (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) via a public unauthenticated REST API endpoint (`GET /api/inventory`). | Public / Hospital / Donor | High |
| **FR-02** | **Visual Shortage Threshold Classification:** The system shall classify and visually distinguish inventory items into three clinical threshold tiers: Critical Alert ($< 5$ units, pulsating highlight), Low Reserve ($5$ to $12$ units), and Adequate Stock ($> 12$ units). | Public / Administrator | High |
| **FR-03** | **ABO/Rh Compatibility Guidance:** The system shall provide an interactive 8×8 transfusion compatibility matrix indicating safe donor-to-recipient whole blood and red cell transfusion pathways, coupled with an explicit clinical disclaimer distinguishing educational guidance from laboratory serological cross-matching. | Public / Clinical Staff | Medium |
| **FR-04** | **Voluntary Donor Pre-Screening Validation:** The system shall validate voluntary donor registration inputs against mandatory clinical parameters: legal age between 18 and 65 years, minimum body weight of 50 kg (110 lbs), RFC 5322-compliant email address, and an active phone number ($\ge 8$ digits). Rejection with HTTP 400 must occur if any parameter fails. | Voluntary Donor | High |
| **FR-05** | **Dynamic 56-Day Whole-Blood Interval Evaluation:** The system shall calculate the number of elapsed days since a donor's reported last donation date. If the interval is under 56 days, the system shall compute remaining recovery days, automatically assign `Deferred` status, recommend the earliest eligible future date, and record explanatory clinical guidance. | Voluntary Donor | High |
| **FR-06** | **Donation Center & Geospatial Mapping Selection:** The system shall present an interactive geospatial catalog of affiliated regional donation centers with physical addresses, operating schedules, daily capacities, and direct external routing links to Google Maps. | Voluntary Donor | Medium |
| **FR-07** | **Dual Date Scheduling (Primary & Alternate):** The system shall permit voluntary donors to book a primary preferred appointment date and time slot, with an optional backup alternate date and time slot to facilitate agile scheduling during emergency donation callouts. | Voluntary Donor | Medium |
| **FR-08** | **Digital Verified Donor Pass Generation:** Upon successful registration, the system shall render a client-side verified donor pass containing an assigned collision-safe `DNR-xxxx` identifier, phenotype badge, selected center details, dynamic Google Calendar link, and print-ready CSS layout. | Voluntary Donor | Medium |
| **FR-09** | **Automated Donor Confirmation Email:** The system shall asynchronously compile and dispatch an automated HTML appointment confirmation email to the voluntary donor containing full schedule parameters and dietary preparation instructions via SMTP (`nodemailer`). | Voluntary Donor / System | High |
| **FR-10** | **Hospital Blood Requisition Ingestion:** The system shall capture emergency hospital requisitions via `POST /api/requests`, capturing hospital identity, patient reference, phenotype, requested units ($1$ to $50$), urgency tier (`Normal`, `Urgent`, `Critical`), authorized medical contact details, and clinical justification. | Hospital Liaison | High |
| **FR-11** | **Collision-Safe Requisition Identifier Generation:** The system shall generate an algorithmic, collision-safe alphanumeric identifier (e.g., `REQ-8021`) for each hospital requisition to ensure instantaneous phone and radio traceability between trauma wards and the blood bank. | System | High |
| **FR-12** | **4-Stage Requisition Custody Progression:** The system shall maintain an authenticated state transition pipeline allowing authorized administrators to progress requisitions sequentially across four distinct stages: `Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched` (or `Rejected`). | Administrator | High |
| **FR-13** | **Atomic Inventory Stock Deduction on Dispatch:** When an administrator transitions a requisition to the `Dispatched` stage, the system shall verify that sufficient unreserved stock exists. If stock is sufficient, the system shall atomically deduct the units and record an `OUT` ledger entry; if stock is insufficient, fulfillment must be strictly blocked with HTTP 400. | Administrator / System | High |
| **FR-14** | **Requisition Stage Reversal Stock Rollback:** If a previously dispatched requisition is reverted to an earlier stage, the system shall automatically reinstate the deducted units into available inventory and append a compensatory `IN` transaction entry to the ledger. | Administrator / System | High |
| **FR-15** | **Sanitized Public Chain-of-Custody Tracking:** The system shall expose a public tracking endpoint (`GET /api/requests/:id`) returning requisition status, current workflow stage, administrative notes, and chronological transition history while strictly redacting private physician emails, phone numbers, and patient clinical identifiers. | Hospital Liaison / Public | High |
| **FR-16** | **Explicit Three-Mode Stock Mutation:** The system shall provide an administrative inventory management interface supporting three explicit mathematical operations: `+` (Intake/blood drive receipt), `-` (Dispatch/release), and `=` (Reconciled physical audit count), requiring a mandatory justification reason for every action. | Administrator | High |
| **FR-17** | **Append-Only Immutable Audit Ledger:** The system shall append an immutable audit record to `db.transactions` for every stock modification, logging unique transaction ID, phenotype, operation type, units, previous balance, resulting balance, justification, operator name, and ISO 8601 timestamp. | Administrator / Auditor | High |
| **FR-18** | **Administrative Password Rotation:** The system shall provide an in-app credential rotation mechanism requiring verification of the existing password, enforcement of minimum 8-character length, and automatic regeneration of a high-entropy cryptographic salt. | Administrator | Medium |

---

## 4.3 Non-Functional Requirements

Non-functional requirements specify the architectural quality benchmarks, performance criteria, security constraints, and operational reliability standards governing the LifeFlow platform. These requirements ensure that the system executes securely, responsively, and reliably under real-world clinical demands.

### 4.3.1 Performance Requirements
- **NFR-01 (API Response Latency):** Under baseline local network execution, all read operations (`GET /api/inventory`, `GET /api/stats`, `GET /api/requests/:id`) shall achieve a 95th percentile response latency ($T_{resp}$) of less than $150\text{ ms}$.
- **NFR-02 (Atomic Mutation Execution):** Concurrently queued inventory mutations processed under the promise-chaining mutex lock (`withTransactionLock`) shall complete within $50\text{ ms}$ per operation, preventing thread starvation during simultaneous hospital orders.
- **NFR-03 (Client Asset Load Optimization):** The production bundle compiled via Vite and esbuild shall remain under $1.5\text{ MB}$ uncompressed, enabling fast initial contentful paint (FCP $< 1.2\text{ s}$) over standard broadband connections.

### 4.3.2 Security Requirements
- **NFR-04 (Cryptographic Password Hashing):** Administrative master passwords must never be stored in plaintext. Passwords must be hashed using Node.js native `crypto.pbkdf2Sync` configured with SHA-512, 10,000 iterations, and a cryptographically secure 16-byte random salt generated via `crypto.randomBytes(16)`.
- **NFR-05 (Session Token Security):** Successful administrator authentication shall issue a cryptographically random 32-byte hexadecimal bearer token (256 bits of entropy) stored in server memory (`activeTokens`) with a strict 24-hour expiration lifetime. Tokens must be transmitted via standard HTTP `Authorization: Bearer <token>` headers.
- **NFR-06 (Public Reconnaissance Throttling):** The public tracking endpoint (`GET /api/requests/:id`) must enforce sliding-window IP rate limiting capped at 60 requests per minute per IP address, responding with HTTP `429 Too Many Requests` when breached to mitigate automated identifier enumeration.
- **NFR-07 (Data Sanitization & Privacy):** In strict accordance with healthcare data protection principles, public tracking projections must exclude private physician contact emails, telephone numbers, and specific patient diagnostic notes.

### 4.3.3 Reliability & Availability Requirements
- **NFR-08 (Zero Inventory Overselling):** The system shall mathematically guarantee that inventory units available never drop below zero. Any mutation or dispatch command that attempts to allocate more units than exist in physical reserve must be intercepted and rejected with an explicit error message.
- **NFR-09 (Storage Resilience & Fallback):** The data access layer shall operate resiliently. If the optional cloud MongoDB Atlas cluster encounters network latency or SSL negotiation failures, the system must seamlessly fall back to local disk persistence (`data/lifeflow_db.json`) without terminating server execution.

### 4.3.4 Usability & Accessibility Requirements
- **NFR-10 (Restrained Animation & Accessibility):** Dynamic UI reveals implemented via GSAP and Motion must query the browser's `prefers-reduced-motion` media feature. If reduced motion is requested, transition animations must be disabled, displaying all clinical data immediately without motion effects.
- **NFR-11 (Responsive Clinical Interface):** All user interfaces must adapt responsively across standard desktop viewports (1440 × 900, 1920 × 1080), tablet displays (768 × 1024), and mobile devices (375 × 667), maintaining touch-target sizes $\ge 44 × 44\text{ px}$.

### 4.3.5 Maintainability & Portability Requirements
- **NFR-12 (Static Type Safety):** All backend controllers, data models, and frontend components must strictly adhere to TypeScript 7.0 standards with zero unhandled `tsc --noEmit` compiler warnings.
- **NFR-13 (Platform Independence):** The backend runtime must operate uniformly across Windows, macOS, and Linux operating systems running Node.js runtime version 20.x or higher.

---

## 4.4 Software Requirements

The software dependencies utilized by LifeFlow have been verified against the active project manifest [`package.json`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/package.json). All core runtime technologies, development toolchains, and utility packages are open-source and free of commercial licensing fees.

### Table 4.2: Verified Software Requirements and Dependencies

| Software Component | Technology / Library | Version | License | Architectural Function |
|---|---|---|---|---|
| **Client UI Framework** | React | 19.0.1 | MIT | Declarative component tree & state management |
| **DOM Renderer** | React DOM | 19.0.1 | MIT | Virtual DOM reconciliation and browser rendering |
| **Build & Dev Server** | Vite | 8.3.0 | MIT | Next-generation frontend tooling and HMR |
| **Frontend Plugin** | `@vitejs/plugin-react` | 6.1.1 | MIT | Babel/SWC Fast Refresh integration for React |
| **Backend Web Server** | Express | 4.21.2 | MIT | RESTful routing, middleware pipeline, and HTTP parsing |
| **TypeScript Runtime** | `tsx` | 4.21.0 | MIT | Direct TypeScript execution for Node.js |
| **Static Compiler** | TypeScript | 7.0.2 | Apache-2.0 | Static type validation and interface verification |
| **Server Bundler** | `esbuild` | 0.27.0 | MIT | High-performance bundling for production server bundle |
| **Database Driver** | `mongodb` | 7.7.0 | Apache-2.0 | Native MongoDB client driver for Atlas cloud sync |
| **Email Dispatcher** | `nodemailer` | 10.1.7 | MIT | SMTP transport client for automated email notices |
| **Data Visualization** | `chart.js` | 4.5.1 | MIT | Canvas charting for inventory distribution & trends |
| **Chart Wrapper** | `react-chartjs-2` | 5.3.1 | MIT | React lifecycle wrapper for Chart.js instances |
| **Animation Engine** | `gsap` | 3.14.2 | Standard | Scroll-triggered entrance animations and layout reveals |
| **GSAP React Bridge** | `@gsap/react` | 2.1.2 | Standard | Scoped animation cleanup for React components |
| **Micro-Interactions** | `motion` | 12.23.24 | MIT | Declarative modal entrances and toast notification springs |
| **Iconography** | `lucide-react` | 0.546.0 | ISC | Scalable clinical SVG vector icons |
| **CSS Utility Engine** | `tailwindcss` | 4.3.3 | MIT | Modern utility-first CSS design framework |
| **CSS Compiler** | `autoprefixer` | 10.4.21 | MIT | Vendor prefix injection for cross-browser CSS |
| **Environment Loader** | `dotenv` | 17.2.3 | BSD-2-Clause | Injects configuration variables from `.env` file |
| **3D Graphic Engine** | `three` | 0.186.1 | MIT | WebGL canvas rendering for decorative blood drop hero |

---

## 4.5 Hardware Requirements

LifeFlow's lightweight full-stack architecture requires minimal computing overhead, ensuring high performance even on entry-level clinical hardware or virtualized community hospital infrastructure.

### Table 4.3: Hardware Requirements Specification

| Dimension | Minimum Specification | Recommended Specification |
|---|---|---|
| **Server-Side CPU** | Dual-Core x86-64 or ARM64 processor, 2.0 GHz | Quad-Core x86-64 or ARM64 (e.g., Intel i5 / Apple M-series / AMD Ryzen 5) |
| **Server-Side RAM** | 2.0 GB System RAM | 8.0 GB System RAM |
| **Server-Side Storage** | 500 MB free solid-state storage (SSD) | 5.0 GB NVMe SSD (to accommodate growing transaction logs and backups) |
| **Server-Side Network** | 10 Mbps broadband / local LAN | 100 Mbps symmetrical high-speed connection |
| **Client-Side CPU** | 1.6 GHz dual-core processor | 2.4 GHz quad-core processor |
| **Client-Side RAM** | 2.0 GB System RAM | 4.0 GB or higher System RAM |
| **Client Display** | 1280 × 720 resolution (HD) | 1920 × 1080 Full HD display (or 1440 × 900 laptop display) |
| **Client Peripherals** | Keyboard, standard pointing device / touchscreen | Keyboard, mouse, standard office thermal/laser printer (for passes/reports) |

---

## 4.6 User Requirements

User requirements define the expectations, privileges, technical capabilities, and operational goals of the distinct actors interacting with the LifeFlow platform. The system accommodates three primary classes of users:

### 4.6.1 Voluntary Blood Donors
- **Primary Goal:** Identify nearby donation facilities, verify medical eligibility, schedule an appointment without long queue delays, and receive verified confirmation passes.
- **User Capabilities:**
  - View real-time blood stock levels to identify which phenotypes face acute regional shortages.
  - Complete the online pre-screening form to evaluate weight, age, and 56-day rest intervals prior to travelling to a collection center.
  - Explore donation centers on an interactive map with operating hours and daily capacity indicators.
  - Select preferred and alternate donation appointment dates and time slots.
  - Receive an automated email confirmation and print or save a digital verified donor pass.

### 4.6.2 Hospital Clinical Liaisons & Trauma Personnel
- **Primary Goal:** Submit emergency blood requisitions during acute trauma resuscitations or scheduled surgeries with zero administrative friction, and track order fulfillment in real time.
- **User Capabilities:**
  - Submit structured blood requisition forms with required units, urgency classification, and clinical justification.
  - Receive an automated collision-safe tracking reference (e.g., `REQ-8021`) immediately upon submission.
  - Monitor the 4-stage chain of custody (`Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched`) via the public tracker.
  - View cold-chain courier dispatch details and estimated delivery logistics.

### 4.6.3 Blood Bank Medical Directors & Inventory Administrators
- **Primary Goal:** Enforce strict biological asset integrity, prevent stock overselling, maintain immutable audit ledgers, review triage queues, and perform verified inventory reconciliations.
- **User Capabilities:**
  - Authenticate securely via encrypted master credentials with 24-hour bearer session management.
  - Review the comprehensive requisition triage queue, filter by urgency/status, and progress orders across workflow stages.
  - Execute explicit inventory mutations (`+` intake, `-` dispatch, `=` count) with mandatory justification logging.
  - Query and audit the complete chronological transaction history ledger.
  - Search, filter, and export the voluntary donor registry to standard CSV format for clinical outreach.
  - Rotate administrative master credentials safely within the portal.

---

## 4.7 System Requirements

The system environment requirements govern the software operating platforms, browsers, network topologies, and runtime configurations necessary to host and access the LifeFlow platform.

- **Host Operating System:** Microsoft Windows 10/11 (64-bit), Ubuntu Linux 20.04/22.04 LTS, Debian 12, or macOS 12+ (Monterey or later).
- **Runtime Environment:** Node.js version 20.12.0 LTS or higher, with `npm` version 10.x or `tsx` version 4.21.0.
- **Client Web Browsers:** Google Chrome version 110+, Mozilla Firefox version 115+ (ESR), Microsoft Edge version 110+, or Apple Safari version 16.4+. Web browsers must have JavaScript enabled and support modern ECMAScript 2022 standards.
- **Network Protocol Requirements:** Standard HTTP/1.1 or HTTP/2 transport over TCP port 5000 (configurable via `PORT` environment variable). Outbound TCP port 587 or 465 required for SMTP email notifications via `nodemailer`.
- **Database Engine Options:** Local filesystem storage requiring standard read/write permissions in `./data/lifeflow_db.json`, or an outbound connection string to MongoDB Atlas Cluster (version 6.0+) over TCP port 27017.

---

## 4.8 Requirement Summary

The requirement specification established for the LifeFlow Blood Bank Management System establishes an uncompromising standard of clinical accuracy and operational data integrity. By translating life-saving medical protocols—such as the 56-day whole-blood interval, mandatory cold-chain thermal custody, and non-negotiable inventory allocation limits—into concrete functional requirements, the system prevents the systemic errors inherent in manual paper registers and fragmented telephone communications.

The combination of 18 granular functional requirements, 13 measurable non-functional benchmarks, and comprehensive actor profiles provides a rigorous engineering baseline. This baseline directly governs the architectural design in Chapter 5, the database schema in Chapter 6, and the comprehensive automated testing suite detailed in Chapter 10.
