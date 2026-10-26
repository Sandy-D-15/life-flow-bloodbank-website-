# CHAPTER 5: SYSTEM DESIGN

## 5.1 Introduction

System design is the transformative engineering phase where conceptual clinical requirements are translated into a cohesive, robust, and scalable software architecture. In medical software engineering, system design must bridge user experience ergonomics with rigorous fail-safe mechanisms: ensuring that voluntary blood donors experience zero registration friction while clinical trauma teams can requisition critical biological assets with instantaneous, unassailable data integrity.

The design of the LifeFlow Blood Bank Management System follows a modern, decoupled **3-Tier Client-Server Architecture** constructed with React 19, TypeScript, Vite, Express, and a resilient dual-tier persistence layer. This chapter articulates the structural layers of the system, module responsibilities, granular input validation rules, output interfaces, role-based navigation hierarchies, and the comprehensive multi-layered security framework that safeguards life-critical health operations.

---

## 5.2 System Architecture

The architectural topology of LifeFlow strictly aligns with the authoritative **3-Tier System Architecture Diagram** from the project design specification. The platform is segregated into three cleanly decoupled tiers, augmented by external cloud services, as illustrated in Figure 5.1:

![Figure 5.1: 3-Tier System Architecture Diagram](diagrams_native/img-012.png)

### 5.2.1 Presentation Layer (Client Tier)
The presentation layer executes entirely within the end-user's web browser as a Single Page Application (SPA) powered by React 19 and compiled via Vite 8.3. The user interface leverages Tailwind CSS v4 design tokens to achieve a clean, clinical aesthetic centered on the deep blood-red accent (`#F0003C` / `#B71C1C`) set against slate neutrals (`#0F172A`, `#F8FAFC`). Dynamic layout animations and reveals are managed via GSAP and ScrollTrigger, adhering strictly to the `prefers-reduced-motion` accessibility standard. Client-side charting for inventory balances and 7-day usage trends is rendered via HTML5 Canvas using Chart.js and `react-chartjs-2`.

### 5.2.2 Application Layer (Middleware & Business Logic Tier)
The application layer runs on a Node.js 20+ runtime utilizing the Express 4.21 web application framework. It orchestrates all business logic, clinical calculations, and security guardrails:
- **Authentication & Session Gatekeeper:** Validates administrative bearer tokens against an active in-memory session registry (`activeTokens: Map`), ensuring 24-hour expiration and immediate server-side revocation on logout.
- **Concurrency Mutex (`withTransactionLock`):** Serializes read-modify-write operations across asynchronous execution contexts, ensuring zero race conditions during simultaneous hospital trauma orders.
- **Clinical Validation Engines:** Enforces demographic criteria (age 18–65, weight $\ge 50\text{ kg}$), evaluates the 56-day whole-blood recovery interval, and strictly prevents inventory overselling during requisition dispatch.
- **Notification Dispatcher:** Integrates with `nodemailer` to compile responsive HTML templates and transmit transactional booking confirmations and triage updates over secure SMTP.

### 5.2.3 Data Layer (Persistence Tier)
The data layer maintains structured entity state across a dual-tier storage system:
- **Local JSON Data Store (`data/lifeflow_db.json`):** Serves as the primary operational store, written atomically to disk on every state mutation to guarantee complete offline operability, rapid evaluation, and zero external network latency.
- **Cloud MongoDB Atlas Cluster:** Managed through the official native `mongodb` driver (`MongoClient`), providing automated cloud replication when configured, with seamless, silent fallback to local storage if network or SSL failures occur.

### 5.2.4 External Services
- **Google Maps Platform:** Provides interactive geographical mapping, location geocoding, and driving directions for voluntary donors navigating to affiliated regional blood centers.
- **Gmail SMTP Relay:** Manages outgoing clinical email notifications across TLS-encrypted connections.

---

## 5.3 System Modules & Component Responsibilities

The functional capabilities of LifeFlow are partitioned into modular, highly cohesive components across both client and server codebases.

### Table 5.1: System Modules and Technical Responsibilities

| Module Name | Primary Responsibility | Primary Implementation Files | Interacting Roles |
|---|---|---|---|
| **Public Portal & Router** | Serves as the root UI layout, navigation bar, hero banner, emergency ticker, and top-level tab switcher. | [`src/App.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/App.tsx)<br>[`src/components/Navbar.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/Navbar.tsx)<br>[`src/components/Hero.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/Hero.tsx) | All Users |
| **Live Blood Availability** | Displays 8-phenotype real-time balances, threshold alert badges, Chart.js doughnut/bar visuals, and educational ABO/Rh compatibility matrix. | [`src/components/LiveInventoryOverview.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/LiveInventoryOverview.tsx)<br>[`src/components/BloodAvailability.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/BloodAvailability.tsx)<br>[`src/components/BloodCharts.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/BloodCharts.tsx) | Public / Clinical Staff |
| **Donor Registration & Pre-Screening** | Collects donor demographics, executes client-side clinical validation, computes 56-day interval deferrals, captures primary/alternate dates, and renders verified digital passes. | [`src/components/DonorRegistration.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/DonorRegistration.tsx)<br>[`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts) (L337–467) | Voluntary Donor |
| **Donation Center Locator** | Renders interactive directory of collection centers with geospatial coordinates, operating hours, daily capacity, and external Google Maps routing. | [`src/components/DonationCenterMap.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/DonationCenterMap.tsx) | Voluntary Donor |
| **Hospital Requisition Engine** | Captures emergency hospital blood orders, urgency levels, contact liaisons, and initiates the automated order tracking reference. | [`src/components/BloodRequestForm.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/BloodRequestForm.tsx)<br>[`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts) (L551–649) | Hospital Trauma Staff |
| **Chain-of-Custody Tracker** | Provides a sanitized, rate-limited public tracking portal rendering the 4-stage stepper, time log, and administrative triage notes. | [`src/components/RequestTracker.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/RequestTracker.tsx)<br>[`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts) (L505–548) | Hospital Liaison / Public |
| **Admin Command Dashboard** | Authenticated administration interface for triage progression, atomic inventory mutation (`+`/`-`/`=`), donor registry search, and CSV export. | [`src/components/AdminPortal.tsx`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/components/AdminPortal.tsx)<br>[`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts) (L652–882) | Administrator / Director |
| **Atomic Concurrency Engine** | Manages promise-chain mutex locking, atomic file serialization, collision-safe ID generation, and append-only transaction ledger logging. | [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts)<br>[`server/mongo.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/mongo.ts) | Backend Core |
| **Notification Pipeline** | Formats responsive HTML email notifications and manages SMTP transmission via Nodemailer with console logging fallbacks. | [`server/notifications.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/notifications.ts) | System Services |

---

## 5.4 Input Design & Clinical Form Validations

Input design governs how human data is gathered, formatted, sanitized, and verified before database persistence. To prevent invalid clinical data from entering the database, LifeFlow implements a **dual-layer validation strategy** where inputs are validated instantaneously in the browser via React state hooks and re-verified deterministically on the Express server.

### Table 5.2: Granular Input Design and Validation Matrix

| Form Name | Field Name | Input Type | Validation Rules (Client & Server) | Error Handling & Feedback |
|---|---|---|---|---|
| **Donor Registration** | `fullName` | Text | Required; non-empty string; trimmed; $\le 100$ characters. | Red border; "Full legal name is required." |
| **Donor Registration** | `bloodGroup` | Select | Required; must match one of 8 ABO/Rh tokens (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`). | Rejection with HTTP 400 if tampered. |
| **Donor Registration** | `age` | Numeric | Required integer; $18 \le \text{age} \le 65$. | "Voluntary donors must be between 18 and 65 years of age." |
| **Donor Registration** | `weight` | Numeric | Required number; $\ge 50.0\text{ kg}$ (110 lbs). | "Donors must weigh at least 50 kg for cardiovascular safety." |
| **Donor Registration** | `email` | Email | Required; RFC 5322 regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. | "Please enter a valid email address." |
| **Donor Registration** | `phone` | Tel | Required; cleaned numeric digits $\ge 8$. | "Please enter a valid telephone contact number." |
| **Donor Registration** | `lastDonationDate` | Date | Optional; must not be in the future; if provided, evaluated against 56-day rule. | If $< 56$ days: displays amber badge with remaining days and assigns `Deferred`. |
| **Donor Registration** | `preferredDonationDate` | Date | Default tomorrow; must be future date; ISO YYYY-MM-DD. | Enforced by HTML5 min date attribute. |
| **Hospital Requisition** | `hospitalName` | Text | Required; non-empty string; trimmed; $\le 150$ characters. | "Hospital or institution name is required." |
| **Hospital Requisition** | `bloodGroup` | Select | Required; valid ABO/Rh phenotype token. | "Valid required blood group is required." |
| **Hospital Requisition** | `units` | Number | Required integer; $1 \le \text{units} \le 50$. | "Requested units must be between 1 and 50 units." |
| **Hospital Requisition** | `urgency` | Radio / Select | Required; one of `Normal`, `Urgent`, `Critical`. | "Urgency level must be Normal, Urgent, or Critical." |
| **Hospital Requisition** | `contactPerson` | Text | Required; authorized medical contact; non-empty. | "Authorized medical liaison contact is required." |
| **Hospital Requisition** | `contactPhone` | Tel | Required; phone format; $\ge 8$ digits. | "Valid emergency contact telephone is required." |
| **Hospital Requisition** | `contactEmail` | Email | Required; RFC 5322 regex format. | "Valid contact email address is required." |
| **Inventory Mutation** | `bloodGroup` | Select | Required; valid ABO/Rh phenotype token. | Rejection with HTTP 400. |
| **Inventory Mutation** | `operation` | Select | Required; exact token: `+` (Intake), `-` (Dispatch), `=` (Count). | "Operation must be '+', '-', or '='." |
| **Inventory Mutation** | `quantity` | Number | Required; non-negative integer ($\ge 0$); if `-`, cannot exceed available stock. | If oversold: "Insufficient stock: X units available, but Y requested." |
| **Inventory Mutation** | `reason` | Text | Required; mandatory clinical/audit justification; non-empty. | "Mandatory audit reason is required for inventory mutations." |
| **Admin Login** | `username` | Text | Required; matches `admin` or configured environment identifier. | "Invalid admin credentials" (HTTP 401). |
| **Admin Login** | `password` | Password | Required; matched against PBKDF2 salt/hash. | "Invalid admin credentials" (HTTP 401). |
| **Password Change** | `currentPassword` | Password | Required; must match current stored PBKDF2 hash. | "Current password verification failed." |
| **Password Change** | `newPassword` | Password | Required; string length $\ge 8$ characters. | "New password must be at least 8 characters long." |

---

## 5.5 Output Design & Visualization Architecture

Output design ensures that clinical metrics, order statuses, and administrative reports are communicated unambiguously to clinical staff and voluntary donors across both visual and electronic mediums.

1. **Live 8-Phenotype Stock Dashboard:** Formats vault stock into eight distinct clinical cards, displaying current units, reserved units, and color-coded threshold badges (pulsing red for critical shortages under 5 units, amber for low reserves 5–12 units, and emerald for adequate reserves over 12 units).
2. **Chart.js Visualizations:** Employs Chart.js canvas renderers to display real-time inventory distribution (doughnut chart) and 7-day retrospective clinical utilization trends (line/bar chart), enabling rapid visual capacity planning.
3. **Interactive Compatibility Matrix:** Renders an 8×8 grid mapping red cell and plasma compatibility, allowing clinical personnel to click any phenotype to highlight all valid donor and recipient types.
4. **Sanitized Public Requisition Tracker:** Displays an intuitive 4-stage visual stepper (`Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched`), accompanied by an audit timestamp log and cold-chain courier transport notices.
5. **Verified Digital Donor Pass:** Renders an on-screen pass complete with an SVG QR token, donor ID, scheduled date/slot, selected donation center address, and print-ready CSS layout for rapid check-in at physical centers.
6. **Donor Registry CSV Export:** Generates standard RFC 4180-compliant comma-separated values (CSV) files on the client side, allowing administrators to export donor demographics, blood groups, and contact records directly into hospital EHR spreadsheets.
7. **Automated Transactional Emails:** Compiles inline CSS-styled HTML email notifications dispatched via SMTP, providing donors with comprehensive appointment briefings and hospital personnel with immediate order status updates.

---

## 5.6 Navigation Structure & Site Architecture

LifeFlow is organized as an intuitive Single Page Application with clean, role-segmented navigation paths. Figure 5.2 depicts the hierarchical navigation structure across public and administrative portals:

![Figure 5.2: Hierarchical Site Navigation Tree](diagrams_native/fig_5_2_navigation_tree.png)

---

## 5.7 Security Architecture & Guardrails

LifeFlow incorporates a defence-in-depth security model engineered to protect sensitive biological inventory and clinical metadata against malicious tampering, unauthorized access, and data leaks.

### 5.7.1 Password Storage & Cryptographic Salting
Administrative authentication adheres to modern cryptographic standards. Passwords are never stored in plaintext or reversible formats. In [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts#L34-L43), the system utilizes Node.js native `crypto.pbkdf2Sync` configured with:
- **Hashing Algorithm:** SHA-512
- **Iteration Count:** 10,000 rounds
- **Salt Generation:** 16 bytes of high-entropy random data via `crypto.randomBytes(16).toString('hex')`
- **Key Length:** 64 bytes (128 hexadecimal characters)

### 5.7.2 Bearer Session Token Management
Upon successful login verification, [`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts#L135-L142) generates a cryptographically random 32-byte hexadecimal bearer token (256 bits of entropy) via `crypto.randomBytes(32).toString('hex')`. The token is mapped in server memory (`activeTokens`) with a strict 24-hour expiration timestamp. This server-side mapping ensures that:
- Tokens cannot be forged or forged offline.
- When an administrator logs out via `POST /api/auth/logout`, the token is immediately purged from the server map, guaranteeing instantaneous revocation.

### 5.7.3 Public Endpoint Rate Limiting & Reconnaissance Throttling
To prevent malicious automated crawlers from discovering valid hospital requisition IDs via brute-force enumeration, the public tracking route (`GET /api/requests/:id`) is guarded by an in-memory sliding-window IP rate limiter (`checkRateLimit`). Each client IP is allocated a maximum of 60 requests per 60-second window; exceeding this threshold triggers an immediate HTTP `429 Too Many Requests` response.

### 5.7.4 Privacy Protection & Clinical Data Sanitization
In strict compliance with healthcare confidentiality standards, public tracking queries return a sanitized projection (`PublicRequestTracking`) in [`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts#L529-L543). The server explicitly strips the following private data elements before sending the JSON response:
- Private hospital contact physician email addresses
- Emergency contact telephone numbers
- Patient names, trauma room codes, and internal medical justifications

### 5.7.5 Atomic Concurrency Guardrails & Oversell Blocking
All inventory state mutations—including administrative reconciliations and hospital order dispatches—are locked inside the `withTransactionLock` promise mutex in [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts#L338-L345). Furthermore, in [`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts#L692-L696), the stage transition controller verifies:
```typescript
if (stockItem.unitsAvailable < request.units) {
  throw new Error(`Insufficient stock to dispatch: ${stockItem.unitsAvailable} unit(s) available, but ${request.units} required. Fulfillment blocked.`);
}
```
This check ensures that it is mathematically impossible for an operator to dispatch blood units that do not physically exist in the thermal vault.

---

## 5.8 Advantages of the System Design

1. **Clinical Asset Integrity:** Synchronized locking and oversell protection guarantee that physical inventory and digital balances remain perfectly reconciled.
2. **Deterministic Auditability:** The append-only immutable ledger logs every mutation with operator identity, before/after balances, and justification, providing total transparency for regulatory audits.
3. **Zero Deployment Overhead:** The dual-tier persistence model enables instant local execution with zero database setup while supporting cloud MongoDB scaling.
4. **Public Privacy by Design:** Sanitized public tracking allows hospital trauma teams to track shipments in real time without exposing confidential patient or physician data.
5. **Human-Centered Scheduling:** Dual-date booking and dynamic 56-day rest calculations respect donor physiological recovery while maximizing retention.

---

## 5.9 System Design Summary

The system design of LifeFlow Blood Bank bridges life-critical clinical rigor with modern web engineering standards. By coupling a reactive, responsive presentation layer with an Express application tier governed by atomic mutex locks and PBKDF2 cryptography, the platform delivers high operational velocity without sacrificing safety. The detailed input matrices, output specifications, and security guardrails established in this chapter provide a verifiable architectural blueprint that directly guides the database implementation in Chapter 6 and source code development in Chapter 11.
