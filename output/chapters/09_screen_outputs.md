# CHAPTER 9: SCREEN OUTPUTS

This chapter documents the user interface outputs, interactive screens, clinical data visualizations, and administrative command portals of the LifeFlow Blood Bank Management System. In strict adherence to the empirical verification standards of this report, all twelve figures reproduced herein represent unedited 1440 × 900 high-resolution screenshots captured directly from the live application running in the production test environment.

Each screen output section provides:
- A full-width interface figure captioned below in accordance with university report standards.
- **Operational Purpose:** The clinical or logistical objective fulfilled by the interface.
- **User Actions:** The specific interactive controls, inputs, and navigation buttons available to interacting actors.
- **Validations & Feedback Shown:** The real-time visual status indicators, threshold warning alerts, and client/server validation responses displayed to users.

---

## 9.1 Home / Hero Screen

The Home / Hero screen serves as the primary visual landing experience, presenting key institutional operational indicators and high-priority clinical action pathways.

![Figure 9.1: Home / Hero Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.1_home_hero.png)

- **Operational Purpose:** Welcomes voluntary donors and clinical personnel, summarizes real-time network impact metrics, and provides instantaneous navigation to core blood banking workflows.
- **User Actions:** Users can view live KPI summary pills (Total Donors, Active Requests, Verified Vault Units), click "Become a Donor" to initiate pre-screening, click "Request Blood" to submit an emergency hospital requisition, or engage the top sticky navigation bar.
- **Validations & Feedback Shown:** The top navigation bar dynamically calculates active critical shortages; if critical trauma requisitions exist, a pulsating amber alert badge ("Emergency Alert: X Critical Shortage Requisition(s)") is displayed. Smooth entrance reveals are coordinated via GSAP and ScrollTrigger while respecting `prefers-reduced-motion` settings.

---

## 9.2 Live Inventory Overview Screen

The Live Inventory Overview screen provides a high-level visual summary of vault availability across all eight human blood phenotypes.

![Figure 9.2: Live Inventory Overview Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.2_live_inventory_overview.png)

- **Operational Purpose:** Eliminates regional information opacity by delivering immediate 24/7 visibility into available whole-blood reserves without requiring administrative authentication.
- **User Actions:** Users inspect live unit balances for `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, and `O-`, review 7-day retrospective utilization trend curves, click "View All Stock" to navigate to detailed compatibility views, or click direct "Donate" and "Request" shortcuts mapped to specific phenotypes.
- **Validations & Feedback Shown:** Each phenotype card dynamically evaluates units against clinical safety thresholds: balances under 5 units trigger a pulsating red "Critical" alert border; balances between 5 and 12 units render an amber "Low Reserve" badge; balances exceeding 12 units display an emerald "Adequate" indicator.

---

## 9.3 Blood Availability & Compatibility Matrix Screen

The Blood Availability screen provides comprehensive inventory analytics paired with an educational transfusion compatibility guide.

![Figure 9.3: Blood Availability & Compatibility Matrix Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.3_blood_availability_charts.png)

- **Operational Purpose:** Delivers multi-dimensional inventory analytics via Chart.js and guides clinical personnel through safe reciprocal transfusion pathways for whole blood and packed red cells.
- **User Actions:** Users can interact with the dynamic Chart.js doughnut chart (displaying proportional phenotype distribution) and bar chart (vault units vs minimum safety thresholds), click any cell on the 8×8 compatibility matrix to highlight reciprocal donor/recipient groups, and trigger manual inventory refreshes.
- **Validations & Feedback Shown:** Visual green checkmarks and crimson indicators delineate safe biological compatibility pathways. An explicit clinical disclaimer reminds healthcare personnel that educational compatibility matrices do not supersede mandatory laboratory serological cross-matching.

---

## 9.4 Donor Registration & Pre-Screening Screen

The Donor Registration screen guides voluntary donors through a structured demographic and physiological pre-screening assessment.

![Figure 9.4: Donor Registration & Pre-Screening Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.4_donor_registration.png)

- **Operational Purpose:** Pre-qualifies voluntary blood donors prior to collection center arrival, enforcing legal age, minimum body weight, and biological recovery intervals to safeguard donor cardiovascular health.
- **User Actions:** Donors enter legal full name, select blood phenotype, input age and body weight, provide email and telephone contacts, report prior donation dates (or select first-time donor), choose primary and backup donation slots, and check the pre-screening health acknowledgment.
- **Validations & Feedback Shown:** Real-time JavaScript validation prevents submission if age is $<18$ or $>65$, or weight is $<50\text{ kg}$. The dynamic 56-day calculator instantly displays elapsed days and days remaining if a recent donation is detected, automatically assigning `Deferred` status and recommending the earliest safe future appointment date.

---

## 9.5 Donation Center Geospatial Locator Screen

The Donation Center Geospatial Locator screen integrates regional facility profiles with interactive mapping and routing capabilities.

![Figure 9.5: Donation Center Geospatial Locator Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.5_donation_center_map.png)

- **Operational Purpose:** Enables voluntary donors to discover nearby accredited transfusion hubs, check operating hours, inspect daily collection capacities, and plan travel routes.
- **User Actions:** Donors can filter collection centers by category (`Hospital Hub`, `Regional Center`, `Community Clinic`, `Mobile Camp`), inspect verified facility phone numbers and physical street addresses, view available appointment slots for the day, and click "Get Directions" to open Google Maps navigation.
- **Validations & Feedback Shown:** Selecting a center dynamically updates the donor registration profile, automatically pre-filling the center name and physical address for inclusion in the donor's digital appointment pass and confirmation email.

---

## 9.6 Hospital Blood Requisition Form Screen

The Hospital Blood Requisition screen provides authorized medical personnel with an emergency order placement interface.

![Figure 9.6: Hospital Blood Requisition Form Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.6_hospital_request_form.png)

- **Operational Purpose:** Ingests urgent and routine hospital blood orders, establishing immediate clinical triage priority ratings and generating collision-safe tracking references.
- **User Actions:** Medical staff input hospital institution name, optional patient trauma code, required blood phenotype, requested unit volume ($1$ to $50$ units), clinical urgency tier (`Normal`, `Urgent`, `Critical`), authorized physician contact liaison details, and clinical justification.
- **Validations & Feedback Shown:** Client and server-side validators reject submissions with missing hospital credentials or requested units outside the 1–50 safety bounds. Upon successful submission, a toast alert displays the assigned reference (e.g., `REQ-8021`) and provides a direct one-click bridge to the public tracking stepper.

---

## 9.7 Public Chain-of-Custody Request Tracker Screen

The Public Request Tracker screen renders a sanitized, rate-limited visual chain of custody for submitted hospital requisitions.

![Figure 9.7: Public Chain-of-Custody Request Tracker Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.7_request_tracker.png)

- **Operational Purpose:** Provides hospital surgical teams and trauma coordinators with live, transparent tracking of requisition triage, cross-matching, and courier transport without exposing private health data.
- **User Actions:** Users enter a valid requisition reference (e.g., `REQ-8021`) into the search bar and click "Track Order", or arrive pre-filled from an order confirmation link.
- **Validations & Feedback Shown:** Renders a 4-stage visual stepper (`Submitted` $\rightarrow$ `Triage Review` $\rightarrow$ `Cross-Match` $\rightarrow$ `Dispatched`), accompanied by an audit timestamp log and cold-chain courier transport notices. High-frequency queries exceeding 60 requests per minute are throttled with HTTP 429 to mitigate automated reconnaissance.

---

## 9.8 Administrator Authentication Screen

The Administrator Authentication screen provides an encrypted security gateway protecting privileged blood bank command operations.

![Figure 9.8: Administrator Authentication Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.8_admin_login.png)

- **Operational Purpose:** Restricts access to inventory mutations, requisition approvals, donor registries, and audit logs to authorized medical directors and inventory managers.
- **User Actions:** Administrators enter their assigned username and master password, view evaluation credential tooltips, and submit the login form.
- **Validations & Feedback Shown:** Submissions are validated against stored PBKDF2 SHA-512 hashes. Invalid credentials display an immediate red error alert ("Invalid admin credentials"). Successful authentication issues a 24-hour cryptographically secure random Bearer token and redirects to the administrative command dashboard.

---

## 9.9 Administrator Command Dashboard (Requisitions Queue) Screen

The Administrator Command Dashboard serves as the central operational control plane for reviewing and progressing hospital triage orders.

![Figure 9.9: Administrator Command Dashboard Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.9_admin_dashboard.png)

- **Operational Purpose:** Enables the medical director to oversee all incoming hospital blood requisitions, filter orders by urgency or status, inspect clinical justifications, and manage stage progressions.
- **User Actions:** Administrators can filter the triage queue by status (`Pending`, `Approved`, `Fulfilled`, `Rejected`) or urgency (`Critical`, `Urgent`, `Normal`), search by hospital name or patient reference, click any order to open the detailed review modal, record administrative triage notes, and progress the stage.
- **Validations & Feedback Shown:** Critical urgency requisitions display prominent red callout badges. Transitioning an order to `Dispatched` triggers backend verification that unreserved vault stock exists; if stock is inadequate, fulfillment is rejected with an explanatory error.

---

## 9.10 Inventory Mutation & Audit Ledger Modal Screen

The Inventory Mutation interface allows administrators to execute explicit, atomic stock mutations with mandatory audit logging.

![Figure 9.10: Inventory Mutation & Audit Ledger Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.10_inventory_mutation_audit.png)

- **Operational Purpose:** Maintains absolute physical inventory fidelity by supporting explicit Intake (`+`), Dispatch (`-`), and Physical Count Reconciliation (`=`) operations governed by transaction locks.
- **User Actions:** Administrators select a blood phenotype, choose an operation mode (`+`, `-`, `=`), input unit quantity, enter a mandatory clinical/audit justification reason, and execute the mutation.
- **Validations & Feedback Shown:** The interface strictly blocks dispatch mutations (`-`) if the requested quantity exceeds physical vault reserves, displaying an explicit error message. Committing a mutation immediately prepends an immutable entry to the Audit Ledger table below, logging before/after balances, operator identity, and timestamp.

---

## 9.11 Donor Registry & CSV Export Screen

The Donor Registry screen provides administrative tools for searching, filtering, and exporting voluntary donor records for clinical campaigns.

![Figure 9.11: Donor Registry & CSV Export Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.11_donor_registry_csv.png)

- **Operational Purpose:** Facilitates targeted donor recruitment and clinical communications during acute blood shortages while maintaining organized donor records.
- **User Actions:** Administrators can search donors by legal name, city, phone, or assigned `DNR-xxxx` ID, filter the table by blood phenotype, view cumulative lifetime donation tallies, inspect 56-day interval eligibility notes, and click "Export CSV".
- **Validations & Feedback Shown:** The table clearly distinguishes `Active` donors from clinically `Deferred` donors using color-coded status badges. Clicking "Export CSV" generates an instant, client-side RFC 4180-compliant spreadsheet containing all filtered records.

---

## 9.12 Validation & Error Handling States Screen

The Validation & Error Handling screen demonstrates the platform's defensive programming and boundary condition enforcement.

![Figure 9.12: Validation & Error Handling States Screen](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/screenshots/9.12_validation_error_states.png)

- **Operational Purpose:** Verifies that user errors, clinical boundary violations, and malicious inputs are gracefully intercepted, clearly explained, and rejected without system failure.
- **User Actions:** Displayed when a user submits an incomplete registration form, enters an age outside the 18–65 legal bracket, inputs a weight under 50 kg, or attempts an invalid inventory adjustment.
- **Validations & Feedback Shown:** The interface renders high-contrast crimson error alert banners ("Voluntary donors must be between 18 and 65 years of age", "Donors must weigh at least 50 kg for cardiovascular safety", "Mandatory audit reason is required"). Focus is shifted to offending input fields with highlighted red border styling.
