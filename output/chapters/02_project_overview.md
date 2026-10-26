# CHAPTER 2: PROJECT OVERVIEW

## 2.1 Project Overview & Modular Architecture

The LifeFlow Blood Bank Management System is an enterprise-grade, full-stack healthcare platform engineered to bridge voluntary blood donors, emergency hospital trauma centers, transfusion medicine laboratories, and administrative blood bank dispatchers. The platform resolves the systemic fragmentation, stock opacity, and inventory reconciliation failures that historically characterize manual blood banking operations.

The system is architected into five distinct functional modules, each tailored to the operational demands and access privileges of its interacting actors:

### 2.1.1 Public Portal Module
The Public Portal serves as the primary digital gateway for citizens, patients, and healthcare providers seeking real-time biological asset information without requiring authentication barriers.
- **Live 8-Phenotype Stock Overview:** Renders instantaneous unit balances across all standard ABO/Rh blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) with color-coded shortage thresholds.
- **Transfusion Compatibility Guidance:** Features an interactive 8×8 ABO/Rh compatibility matrix mapping whole blood and packed red cell donor-recipient relationships.
- **Clinical Educational Briefings:** Provides essential public guidance on blood donation safety, the biological regeneration cycle, and transparent cold-chain thermal handling protocols (+2°C to +6°C).
- **Public Emergency Helplines:** Displays centralized contact information and regional blood center telephone numbers for emergency ambulance dispatchers.

### 2.1.2 Voluntary Donor Pre-Screening & Scheduling Module
This module streamlines the recruitment, physiological pre-screening, and appointment scheduling of voluntary donors, transforming passive registrants into an active donor network.
- **Demographic & Physiological Pre-Screening:** Enforces strict clinical bounds on age (18–65 years) and minimum body weight ($\ge 50\text{ kg}$ / 110 lbs) to safeguard donor cardiovascular health.
- **Dynamic 56-Day Whole-Blood Interval Evaluation:** Automatically calculates elapsed days since prior donation, determines remaining recovery days, and assigns `Active` vs `Deferred` status in accordance with WHO and National Blood Transfusion Council (NBTC) guidelines.
- **Geospatial Donation Center Directory:** Integrates a comprehensive catalog of regional transfusion hubs complete with operating schedules, daily capacity indicators, and direct Google Maps navigation deep links.
- **Dual-Date Booking Flexibility:** Allows voluntary donors to configure both a preferred primary appointment slot and a backup alternate slot to facilitate responsive scheduling during clinical callouts.
- **Verified Digital Donor Pass:** Renders an on-screen verified donor pass with an SVG QR token, unique `DNR-xxxx` identifier, print-ready CSS formatting, and a direct "Add to Google Calendar" link.
- **Automated Email Confirmations:** Compiles and dispatches an automated HTML confirmation email via SMTP (`nodemailer`) containing appointment parameters and pre-donation hydration instructions.

### 2.1.3 Hospital Emergency Requisition Module
Engineered specifically for surgical teams, emergency room physicians, and hospital logistics liaisons who require immediate access to compatible blood units during acute trauma events.
- **Structured Emergency Order Ingestion:** Captures critical clinical order parameters including hospital identity, patient reference, requested phenotype, unit volume (1 to 50 units), and urgency tier (`Normal`, `Urgent`, `Critical`).
- **Algorithmic Identifier Generation:** Automatically generates a collision-safe, human-readable requisition reference (e.g., `REQ-8021`) to ensure clear verbal communication over telephone or emergency radio.
- **Chain-of-Custody Tracking:** Connects directly to the public tracker, allowing hospital surgical staff to monitor the preparation and transit of ordered units in real time.
- **Automated Order Dispatch Receipts:** Automatically dispatches email notifications to hospital staff liaisons upon order creation and subsequent stage transitions.

### 2.1.4 Administrative Command & Audit Module
The administrative control plane provides the blood bank medical director and authorized operators with comprehensive supervisory, clinical triage, and vault inventory authority.
- **Requisition Triage & Stage Progression:** Allows medical directors to evaluate incoming requisitions, inspect urgency ratings, record triage notes, and progress orders across the 4-stage custody chain (`Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched` / `Rejected`).
- **Atomic Stock Mutation Command:** Provides dedicated modals for executing explicit inventory operations: Intake (`+`), Dispatch (`-`), and Physical Count Reconciliation (`=`), with mandatory clinical justification logging.
- **Oversell Prevention Guardrail:** Enforces strict backend validation blocking any order dispatch or negative inventory mutation if requested units exceed physical vault stock.
- **Append-Only Immutable Audit Ledger:** Automatically records an immutable transaction entry for every stock change, logging previous balance, resulting balance, operator identity, reason, and ISO 8601 timestamp.
- **Donor Registry Search & CSV Export:** Provides multi-attribute search and filtering across the donor database, with one-click export to standard RFC 4180 CSV files for community outreach.
- **In-App Credential Rotation:** Enables secure administrative password changes with existing password verification, 8+ character length validation, and automated cryptographic salt regeneration.

### 2.1.5 Designed Verification & Certification Module (Architectural Specification)
As documented in Chapter 8 design diagrams (8.1, 8.4, 8.13, 8.15, 8.18) and established during the Phase 1 Reconciliation Gate, this module models the secondary phased integration for physical center operations:
- **Admin-Triggered 6-Digit OTP:** Generates a secure 6-digit one-time password transmitted to the donor upon arrival, verified via HMAC-SHA256 hash matching with a 5-attempt threshold.
- **Verification JWT Generation:** Issues a short-lived JSON Web Token upon successful OTP entry, authorizing staff to mark the donation as completed.
- **Server-Side PDF Certificate Generation:** Compiles a cryptographically signed digital donation certificate via PDFKit featuring an embedded QR code.
- **Public QR Certificate Verification:** Exposes a public route (`GET /verify/:certificateId?k=verifyKey`) enabling employers, universities, or public verifiers to authenticate the certificate's validity and donor initials.

---

## 2.2 Key Features of the System

LifeFlow incorporates several distinctive engineering features that ensure clinical reliability, regulatory compliance, and operational speed:

- **Atomic Stock Mutation:** Every intake (`+`), dispatch (`-`), or count adjustment (`=`) is executed inside an asynchronous promise-chain mutex lock (`withTransactionLock`), ensuring that simultaneous trauma requisitions can never induce race conditions or oversell the same unit.
- **Zero Inventory Falsification:** The application strictly forbids marking any hospital requisition as fulfilled or dispatched unless confirmed, unreserved inventory physically exists in the cold bank.
- **Append-Only Immutable Audit Ledger:** Every stock modification logs an indelible record in `db.transactions` detailing operator identity, previous balance, resulting balance, justification, and timestamp, establishing an unalterable chain of custody.
- **Rate-Limited Public Requisition Tracker:** Hospital personnel track orders across a 4-stage visual stepper (`Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched`), protected by an IP sliding-window rate limiter (60 req/min) to prevent reconnaissance attacks.
- **Data Privacy & Sanitization by Design:** Public tracking endpoints return a sanitized data projection that strictly redacts private physician emails, personal phone numbers, and confidential patient clinical identifiers.
- **Dynamic 56-Day Whole-Blood Rest Interval Evaluation:** The pre-screening engine evaluates previous donation dates against the mandatory 56-day physiological recovery standard, automatically computing remaining recovery days and preventing premature clinical collection.
- **Dual-Date Booking & Center Integration:** Donors select primary and backup appointment dates and times linked to specific geographical transfusion hubs, supported by direct Google Maps and Google Calendar integrations.
- **Interactive Transfusion Compatibility Matrix:** A dynamic 8×8 ABO/Rh matrix visualizes reciprocal donor and recipient compatibility rules, providing essential clinical guidance paired with explicit cross-matching disclaimers.
- **Resilient Hybrid Dual-Tier Persistence Engine:** Combines instant local JSON file storage (`data/lifeflow_db.json`) for zero-configuration offline execution with automated asynchronous cloud mirroring to MongoDB Atlas (`server/mongo.ts`).
- **PBKDF2 Cryptographic Security:** Administrative authentication relies on Node.js native `crypto.pbkdf2Sync` (SHA-512, 10,000 iterations, 16-byte random salt) and 24-hour cryptographically secure random bearer tokens with immediate server-side revocation upon logout.

---

## 2.3 Advantages of the Project

The implementation of LifeFlow introduces transformative operational advantages over traditional manual or uncoordinated blood bank workflows:

- **Elimination of Information Asymmetry:** Replaces chaotic telephone queries and fragmented WhatsApp group broadcasts with a single, verifiable, real-time public dashboard displaying exact stock levels across all eight phenotypes.
- **Prevention of Inventory Overselling:** Guarantees through synchronized transactional mutex locks that emergency trauma dispatches can never over-commit physical blood reserves, eliminating the life-threatening hazard of false dispatch confirmations.
- **Complete Regulatory Auditability:** Provides hospital inspectors, drug control authorities, and blood transfusion committees with an immutable, append-only chronological log of all stock movements and administrative authorizations.
- **Enhanced Voluntary Donor Retention:** Streamlines the donor journey through instant pre-screening, dual-date scheduling, interactive center discovery, digital passes, and automated email briefings, minimizing physical queue fatigue.
- **Protection of Donor Physiological Safety:** Mathematically enforces the WHO-mandated 56-day recovery interval for whole-blood collection, preventing donor iron depletion and premature blood draws.
- **Strict Clinical Confidentiality:** Sanitizes public tracking data to prevent unauthorized reconnaissance while preserving full internal transparency for authorized medical directors.
- **Zero Commercial Licensing Overhead:** Built entirely upon robust, open-source technologies (React 19, Express, TypeScript, Vite, Chart.js, Tailwind CSS, Nodemailer), resulting in a ₹0 software licensing cost for community and charitable blood banks.
- **High Deployment Portability:** Operates uniformly across local air-gapped hospital intranet servers, developer laptops, and modern cloud container runtimes without requiring external proprietary database installations.
