# CHAPTER 8: SYSTEM DIAGRAMS

This chapter presents the complete suite of eighteen authoritative architectural models generated via PlantUML from the LifeFlow project design specification (`LifeFlow-Blood-Bank-Diagrams.pdf`). These diagrams represent both the structural topology (Class, Object, ER, Component, Deployment, Package) and dynamic behavioural workflows (Use Case, Activity, State Machine, Data Flow Diagrams, Communication, and Sequence models) governing the platform. Each diagram is embedded in high resolution (rasterized at 200 DPI with headers and footers cleanly cropped), accompanied by an exhaustive technical narrative detailing interacting actors, execution lifelines, decision logic, and key architectural observations.

---

## 8.1 Class Diagram

The Class Diagram establishes the object-oriented domain model of the LifeFlow Blood Bank system, mapping the structural contracts, attributes, and public interface methods governing all biological assets and actors.

![Figure 8.1: Class Diagram](diagrams_native/img-000.png)

### Architectural Explanation
The class diagram models the structural domain entities across administrative, clinical, and donor workflows. The central hierarchy begins with the generalized `User` class (capturing `name`, `email`, `password`, and `role`), specialized into the `Admin` entity which encapsulates operational command methods including `login()`, `sendOtp()`, `verifyOtp()`, `completeDonation()`, `resendCertificate()`, and `revokeCertificate()`. The `Donor` entity maintains donor demographics and invokes `registerDonor()`. A donor establishes a 1-to-many relationship with the `Appointment` class, which is simultaneously hosted by a `DonationCenter` (capturing physical geolocation, operational schedules, and telephone contacts). The `Appointment` class manages booking states through `book()`, `cancel()`, and `markNoShow()`. 

Crucially, an appointment is verified through an associated `OtpRecord` containing cryptographic HMAC digests and attempt counters (`validateOtp()`, `canResend()`). When a donation is completed, the appointment increments stock within the `BloodInventory` entity (`bloodType`, `units`, `expiryDate`, `addUnits()`) and results in the issuance of a verifiable `Certificate` entity (`verifyKey`, `units`, `donationDate`, `status`). Emergency hospital requisitions are modeled through `BloodRequest` (`hospital`, `bloodType`, `units`, `status`, `submitRequest()`), which draws directly from the shared `BloodInventory`.

### Key Observations
- Strict encapsulation separates public donor attributes from privileged administrative and inventory mutation methods.
- The `OtpRecord` entity stores only the cryptographic HMAC hash of the 6-digit verification code, ensuring that plaintext tokens are never stored in the database.
- Bidirectional traceability is enforced: completed appointments directly link the contributing donor, collection center, verified units, and resultant public certificate serial.

---

## 8.2 Object Diagram

The Object Diagram illustrates a concrete snapshot of interconnected runtime instances at a specific point in time during an active, verified blood donation session.

![Figure 8.2: Object Diagram](diagrams_native/img-001.png)

### Architectural Explanation
This runtime object snapshot depicts the operational state of the platform immediately following the successful completion and verification of a voluntary donation. The instance `jane : Donor` represents an active voluntary donor with attributes `donorName = "Jane Doe"`, `email = "janedoe@example.com"`, and phenotype `bloodType = "O+"`. Jane has booked an appointment instance designated `appt1 : Appointment` with unique identifier `id = "test-appt-1791022010620"`, scheduled for `appointmentDate = "2026-10-03"` during the time window `appointmentTime = "10:00 AM - 11:00 AM"`. The appointment has successfully transitioned to `status = "donated"` with `donatedUnits = 1`. 

The appointment is linked to the physical collection facility instance `center1 : DonationCenter` (`id = "center-001"`, `name = "LifeFlow Main Blood Centre"`, `phone = "080-22001100"`). Verification was orchestrated by `admin1 : Admin` (`username = "admin"`, `role = "admin"`), who entered the verification code authenticated by `otp1 : OtpRecord` (`attempts = 1`, `sendCount = 1`, `usedAt = "set after verification"`). As a direct result of this successful verification, a certificate object `cert1 : Certificate` has been instantiated with permanent registration serial `id = "LF-2026-000001"`, recording `bloodType = "O+"`, `units = 1`, and `status = "valid"`.

### Key Observations
- Demonstrates the instantiation and resolution of foreign keys across runtime entities.
- Captures the exact state transitions: the OTP record's `usedAt` timestamp is populated, the appointment status shifts to `donated`, and a valid certificate is generated.
- Illustrates how real-world clinical actions (blood collection) are serialized into deterministic digital records.

---

## 8.3 Entity Relationship (ER) Diagram

The Entity Relationship (ER) Diagram delineates the relational database schema, cardinalities, primary keys, and foreign key dependencies governing persistent storage.

![Figure 8.3: Entity Relationship (ER) Diagram](diagrams_native/img-002.png)

### Architectural Explanation
The ER diagram defines eight core persistent entities structured to eliminate data redundancy while maintaining relational integrity. The `USERS` entity serves as the root authentication store, tracking `_id` (ObjectId PK), `email` (unique constraint), hashed `password`, and access `role` (`admin`, `staff`, or `donor`). Registered voluntary donors are stored in `DONORS` (`_id`, `donor_name`, `email`, `contact`, `blood_type`), maintaining a 1-to-many relationship with `APPOINTMENTS`. Collection facilities are maintained in `DONATION_CENTERS` (`id` PK, `name`, `address`, `lat`, `lng`, `phone`, `hours`), which hosts appointments via a 1-to-many cardinality.

The `APPOINTMENTS` entity (`id` PK, `center_id` FK, `name`, `email`, `phone`, `blood_type`, `appointment_date`, `appointment_time`, `status`, `certificateId` FK, `donatedUnits`) serves as the relational hub. Each appointment has a 1-to-1 relationship with `OTPS` (`appointmentId` PK/FK, `hmac`, `expiresAt`, `attempts`, `usedAt`, `sendCount`). Upon successful completion, an appointment issues a record in `CERTIFICATES` (`id` PK, `appointmentId` FK, `verifyKey`, `donorName`, `bloodType`, `units`, `donationDate`, `status`). Concurrently, completed donations increment stock in `INVENTORY` (`id` PK, `blood_type`, `units`, `expiry_date`). Hospital emergency orders are captured in `BLOOD_REQUESTS` (`id` PK, `hospital`, `blood_type`, `units`, `status`, `date`), which draws directly from the shared `INVENTORY`.

### Key Observations
- All primary keys (`PK`) and foreign keys (`FK`) enforce strict referential integrity across relational tables.
- Cardinality constraints clearly show that one donation center hosts multiple appointments, while each appointment corresponds to at most one OTP record and one resultant certificate.
- The inventory entity acts as the centralized supply sink, incremented by verified appointments and decremented by fulfilled hospital requisitions.

---

## 8.4 Use Case Diagram

The Use Case Diagram defines the functional boundary of the LifeFlow system, illustrating the interactions between human/external actors and system use cases.

![Figure 8.4: Use Case Diagram](diagrams_native/img-003.png)

### Architectural Explanation
The use case model defines the functional interactions of four distinct actors: `Hospital / Patient`, `Public Verifier`, `Donor`, and `Admin`. The `Hospital / Patient` actor initiates the `Request Blood` use case to requisition critical whole-blood units during medical emergencies. The `Public Verifier` actor interacts exclusively with the public `Scan QR / Verify Certificate` use case to validate the legitimacy of issued donor credentials. The voluntary `Donor` actor engages with multiple public services: `Browse Donation Centres` (locating nearby collection hubs), `Register as Donor` (submitting demographic and health pre-screening details), `Book Appointment` (selecting dates and time slots), and `Check My Certificate`. Crucially, `Book Appointment` includes the `Receive Confirmation Email` use case.

The privileged `Admin` actor exercises comprehensive administrative control, authenticated via `Admin Login`. The administrator executes `View / Filter Appointments`, triggers `Send OTP`, and executes `Mark as Donated`. The `Mark as Donated` use case includes `Issue Certificate` (which in turn includes `Email Certificate PDF`) and is extended by the conditional `Verify OTP` use case. Additionally, the administrator manages clinical operations through `Resend / Revoke Certificate`, `Manage Blood Requests`, and `Manage Inventory`.

### Key Observations
- UML `<<include>>` stereotypes model mandatory automated side-effects, such as email confirmation dispatch upon booking and PDF generation upon certificate issuance.
- The `<<extend>>` relationship models optional or conditional workflows, such as OTP verification extending donation completion.
- Actor role separation enforces the principle of least privilege, ensuring public users cannot access vault inventory or triage functions.

---

## 8.5 Activity Diagram

The Activity Diagram models the step-by-step procedural workflow and decision pathways of the end-to-end donation and verification lifecycle across three swimlane partitions.

![Figure 8.5: Activity Diagram](diagrams_native/img-004.png)

### Architectural Explanation
The activity diagram structures the donation process across three swimlane partitions: `Donor`, `System`, and `Admin`. The workflow begins in the `Donor` swimlane: the donor opens the LifeFlow portal, browses donation centers on an interactive map, selects a center, date, and slot, inputs personal details, and submits the booking. Control shifts to the `System` swimlane to validate inputs and perform a capacity check: "Slot available?". If the slot is full, the system rejects the booking with an HTTP 409 error and terminates; if available, the system saves the appointment (`status = scheduled`) and dispatches a confirmation email.

On the appointment day, the donor visits the center. In the `Admin` swimlane, staff logs in with master credentials and clicks "Send OTP". The system generates a 6-digit OTP, stores its HMAC-SHA256 hash, transmits the plaintext code via email and SMS, and updates status to `otp_sent`. The donor verbally shares the received code with staff, who inputs it into the portal. The system evaluates: "OTP valid, not expired, attempts < 5?". If invalid, an error is displayed with a resend option; if valid, status shifts to `verified` and a verification JWT is issued. Staff clicks "Mark as Donated", the system validates the JWT token, instantiates a certificate, updates status to `donated`, increments blood inventory, generates a PDF with embedded QR code, and emails the certificate to the donor.

### Key Observations
- Incorporates explicit decision diamonds representing clinical capacity caps (409 rejection) and cryptographic OTP authentication.
- Swimlane partitioning clearly demarcates human responsibilities from automated server-side background tasks.
- Emphasizes the transient nature of verification credentials: the plaintext OTP is never persisted, and the JWT token authorizes only the immediate donation completion step.

---

## 8.6 State Machine Diagrams

The State Machine Diagrams model the discrete lifecycle states, events, and allowable transitions for both Appointment entities and Certificate entities.

![Figure 8.6: State Machine Diagrams](diagrams_native/img-005.png)

### Architectural Explanation
Figure 8.6 presents two coupled finite state machines (FSM):
1. **(a) Appointment Status State Machine:** An appointment enters the initial pseudo-state upon creation, transitioning to `Scheduled` when booked by a donor. From `Scheduled`, three transitions are possible: the donor may `Cancel` (moving to terminal state `Cancelled`), the donor may fail to appear (`Donor absent` transitioning to terminal state `NoShow`), or the administrator may initiate verification (`Admin sends OTP` transitioning to `OtpSent`). From `OtpSent`, the appointment may be cancelled, marked as `NoShow`, or successfully verified (`OTP verified` moving to `Verified`). From `Verified`, the administrator executes `Mark as donated`, transitioning the appointment to its final successful terminal state `Donated`.
2. **(b) Certificate Status State Machine:** Instantiated upon successful donation completion, entering the initial active state `Valid`. While in the `Valid` state, an administrator may execute `Resend email`, which executes an internal self-transition returning to `Valid`. If clinical or regulatory non-compliance is subsequently discovered, the administrator may invoke `Admin revokes with reason`, transitioning the certificate irreversibly to the terminal `Revoked` state.

### Key Observations
- State transitions are strictly unidirectional toward terminal states, preventing an appointment from being re-opened once marked as `Cancelled`, `NoShow`, or `Donated`.
- The certificate state machine provides explicit support for administrative revocation, safeguarding regulatory drug control compliance.
- Internal transitions (such as email resending) preserve valid status without mutating underlying verification keys.

---

## 8.7 Component Diagram

The Component Diagram details the modular structural breakdown of the client, backend application server, security middlewares, and external service adapters.

![Figure 8.7: Component Diagram](diagrams_native/img-007.png)

### Architectural Explanation
The component diagram organizes LifeFlow into distinct, loosely coupled architectural modules executing across client and server boundaries. The `Client (Browser)` subsystem incorporates the `Frontend UI (index.html / React)`, the `Google Maps Picker` component, and `LocalDB (localStorage)` for client-side state caching. Communication with the backend occurs over standard HTTP REST APIs. The `Express Server (Node.js)` encapsulates security boundaries: incoming requests pass through `Security Middleware (Helmet, CORS, Rate Limit)`.

Within the server application layer, business logic is separated into specialized components: the `Auth Module (bcrypt + JWT)`, the `Appointment Module`, and the `Donation Module (send / verify / complete)`. These controllers interact with supporting utility libraries: the `Mailer (Nodemailer)` adapter, the `SMS Service (Twilio / Fast2SMS)` adapter, the `OTP Service (lib/otp.js)`, and the `Certificate Service (PDFKit + QRCode)`. Persistence operations are centralized through the `Data Store (lib/store.js)` component, which performs file-based I/O on `db.json` and `centers.json`.

### Key Observations
- Clean separation of concerns between presentation, routing controllers, business services, and data persistence layers.
- Security middleware intercepts all traffic at the perimeter before routing requests to internal domain controllers.
- External cloud communication (email, SMS, mapping) is mediated through dedicated service adapters, isolating third-party API dependencies.

---

## 8.8 Deployment Diagram

The Deployment Diagram models the physical and virtual hardware nodes, network topologies, and hosting execution environments supporting the platform.

![Figure 8.8: Deployment Diagram](diagrams_native/img-008.png)

### Architectural Explanation
The deployment topology models the runtime distribution of LifeFlow across client nodes, cloud hosting infrastructure, and third-party APIs. The `User Device` (desktop, laptop, or mobile workstation) executes a standard `Web Browser` supporting both voluntary donor and administrator workflows. Communication with the host server is established over secure `HTTPS REST API` and static `HTTPS` asset requests.

The server infrastructure is deployed as a containerized web service on the `Render Cloud Server`. Within this virtualized Linux environment, Node.js hosts the unified application bundle comprising `Express.js + Node.js (server.js)` and the compiled `Static Frontend (index.html)`. Application data is written to a persistent mounted volume hosting `data/db.json`. For scalable cloud persistence, the deployment diagram models an optional Mongoose connection (`backend-v2`) linking the server to a cloud-hosted `MongoDB Atlas` cluster. External integration lifelines connect the server to `Gmail SMTP` (email delivery), `Twilio / Fast2SMS` (cellular SMS delivery), and direct browser connections to the `Google Maps JavaScript API` for map tile rendering.

### Key Observations
- All external client and server traffic is encrypted using Transport Layer Security (HTTPS/TLS).
- State persistence utilizes a hybrid model supporting local persistent disk volumes and cloud MongoDB Atlas synchronization.
- Decouples static frontend asset delivery from transactional backend REST controllers within a unified Node.js deployment pod.

---

## 8.9 Package Diagram

The Package Diagram organizes the project's source code into logical namespaces, subsystem packages, and inter-package dependency hierarchies.

![Figure 8.9: Package Diagram](diagrams_native/img-009.png)

### Architectural Explanation
The package architecture establishes strict dependency boundaries across three primary layers: `Frontend`, `Backend`, and `External Services`. The `Frontend` package groups user-facing presentation components: `Centres Map`, `Book Appointment`, `Home / Hero`, `Certificate Check`, `Inventory and Requests`, and `Admin Dashboard`. The frontend communicates with the backend exclusively via asynchronous HTTP REST API calls.

The `Backend` package is internally decomposed into four cohesive sub-packages:
1. `Routes`: Contains specialized route handlers (`Auth Routes`, `Appointment Routes`, `Certificate Routes`, `Donation Routes`).
2. `Middleware`: Implements cross-cutting concerns including `Rate Limiters`, `requireAdmin (JWT)` authorization guards, and `Helmet / CORS` headers.
3. `lib`: Encapsulates reusable utility engines: `certificate.js` (PDFKit document compiler), `otp.js` (HMAC cryptographic generator), `store.js` (file I/O manager), and `mailer.js` (SMTP transport).
4. `Data`: Houses persistent file stores `db.json` and `centers.json`.

The `External Services` package abstracts external integrations including `Twilio / Fast2SMS`, `Gmail SMTP`, and the `Google Maps API`.

### Key Observations
- Circular dependencies are entirely eliminated; routing packages depend on middleware and libraries, which in turn access data stores.
- Middleware packages act as gatekeepers, ensuring unauthenticated requests cannot penetrate domain libraries.
- The package structure mirrors standard enterprise Node.js/TypeScript architectural patterns.

---

## 8.10 Data Flow Diagram (Level 0 — Context Diagram)

The Level 0 Data Flow Diagram (Context Diagram) establishes the high-level system boundary, identifying all external entities and high-level data flows into and out of LifeFlow.

![Figure 8.10: Data Flow Diagram (Level 0)](diagrams_native/img-010.png)

### Architectural Explanation
The Level 0 context diagram abstracts the entire LifeFlow platform into a central process bubble: `0 LifeFlow Blood Bank System`. Four external entities interact with this boundary:
- `DONOR`: Transmits `Register / Book appointment` data into the system, and in return receives booking `Confirmation` notices and official `Certificate PDF` documents.
- `ADMIN`: Submits administrative commands (`Login, OTP, Mark donated`) and receives comprehensive monitoring feeds (`Appointments, Status`).
- `HOSPITAL`: Submits emergency `Blood request` orders and receives real-time `Availability / Request status` tracking updates.
- `PUBLIC VERIFIER`: Transmits certificate QR scan requests to receive authenticated validation credentials.

Internally, Process 0 interacts bidirectionally with three core data stores: `D1 Appointments` (saving and querying appointment schedules), `D2 Certificates` (persisting certificate records), and `D3 Inventory and Requests` (reading stock levels, recording incoming blood requests, and updating vault inventory).

### Key Observations
- Clearly establishes the system boundary and proves that no external entity can access internal data stores directly.
- Demonstrates balanced data flows: every input request generates an authenticated, structured informational output.
- Highlights the centralized role of the core engine in synchronizing public donor actions with clinical hospital requisitions.

---

## 8.11 Data Flow Diagram (Level 1)

The Level 1 Data Flow Diagram decomposes the primary system process into five major functional sub-processes, detailing intermediate data transformations and datastore interactions.

![Figure 8.11: Data Flow Diagram (Level 1)](diagrams_native/img-011.png)

### Architectural Explanation
The Level 1 DFD decomposes the system into five discrete operational processes:
- `1.0 Book Appointment`: Ingests units, preferred dates, and personal contact details from `DONOR`, queries `D4 Centres / Inventory` for operating parameters, writes the confirmed booking to `D1 Appointments`, and returns a booking confirmation email.
- `2.0 Admin Authentication`: Receives username and password from `ADMIN`, validates credentials against administrative stores, and issues an authenticated `JWT token`.
- `3.0 OTP Verification`: Upon admin request, generates a 6-digit OTP, saves the HMAC record to `D2 OTPs`, transmits the code via email/SMS to `DONOR`, accepts the entered OTP from `ADMIN`, validates the hash, and updates the appointment status in `D1 Appointments` to `verified`.
- `4.0 Complete Donation`: Triggered by `ADMIN` for a verified appointment; updates appointment status in `D1 Appointments` to `donated`, increments vault inventory in `D4 Centres / Inventory`, creates a certificate record in `D3 Certificates`, and dispatches the certificate PDF via email to `DONOR`.
- `5.0 Certificate Management`: Interacts with `PUBLIC VERIFIER` to validate scanned certificates against `D3 Certificates`, displaying `Valid` or `Revoked` status.

### Key Observations
- Granular decomposition exposes the strict sequential pipeline: Process 1.0 $\rightarrow$ Process 3.0 $\rightarrow$ Process 4.0 $\rightarrow$ Process 5.0.
- Data stores are cleanly segregated by domain: appointments (`D1`), OTP digests (`D2`), certificates (`D3`), and center inventory (`D4`).
- Illustrates that inventory increments (Process 4.0) occur only after complete OTP verification.

---

## 8.12 System Architecture Diagram (3-Tier)

The System Architecture Diagram illustrates the comprehensive multi-layered hardware, runtime, framework, and service topology linking client browsers to backend infrastructure.

![Figure 8.12: System Architecture Diagram](diagrams_native/img-012.png)

### Architectural Explanation
Figure 8.12 provides an architectural blueprint of the LifeFlow enterprise platform, structured across three distinct tiers:
1. **Presentation Layer (Client):** Executes on user devices within standard web browsers. It comprises the `HTML / CSS / JavaScript UI (Tailwind)`, the compiled `React + Vite (frontend-v2)` application, the `Google Maps Location Picker`, and the `Admin Dashboard (Stock charts, Requests)`. All communication flows downward via encrypted `HTTPS / REST (JSON)`.
2. **Application Layer (Node.js + Express):** Houses the core business engines: the `Security (Helmet, CORS, Rate Limiting, JWT)` boundary, the `Appointment Service`, the cryptographic `OTP Service (HMAC-SHA256)`, the `Certificate Service (PDFKit + QR)`, and the `Notification Service (Email + SMS)`.
3. **Data Layer & External Services:** The server executes read/write operations against flat files `db.json (appointments, otps, certificates)` and `centers.json`, with optional clustering to `MongoDB Atlas (backend-v2)`. External API connectors link the application tier to `Gmail SMTP`, `Twilio / Fast2SMS`, and the `Google Maps API`.

### Key Observations
- Strict architectural layering: presentation logic cannot bypass the Express application boundary to access persistence stores.
- Demonstrates high modularity: notification, certification, and OTP services operate as independent functional subsystems.
- Emphasizes the hybrid data layer architecture, supporting both local zero-configuration JSON storage and scalable cloud MongoDB hosting.

---

## 8.13 Data Flow Diagram (Level 2 — OTP Verification)

The Level 2 Data Flow Diagram provides an exhaustive functional breakdown of Process 3.0 (OTP Verification), detailing sub-process validation routines and cryptographic token flows.

![Figure 8.13: Data Flow Diagram (Level 2) - OTP Verification](diagrams_native/img-013.png)

### Architectural Explanation
This Level 2 DFD zooms into the micro-processes executing within the OTP verification subsystem:
- `3.1 Validate Request and Check Status`: Ingests the admin's OTP request, queries `D1 Appointments`, and verifies that the appointment is in an eligible `scheduled` state.
- `3.2 Generate OTP and Hash (HMAC)`: Algorithmically generates a random 6-digit numerical OTP. It computes an HMAC-SHA256 digest using a server secret and writes the digest, expiration time (10 min), and attempt counter to `D2 OTPs`. The plaintext OTP is never persisted.
- `3.3 Send OTP (Email / SMS)`: Transmits the temporary plaintext OTP over SMTP email and cellular SMS to `DONOR`, while simultaneously updating the appointment status in `D1 Appointments` to `otp_sent`.
- `3.4 Validate OTP`: Ingests the code entered by `ADMIN`, queries `D2 OTPs`, compares HMAC hashes, verifies that attempts $< 5$, and checks that the timestamp has not expired. If valid, it updates the appointment in `D1 Appointments` to `status = verified`.
- `3.5 Issue Verification Token (JWT)`: Instantiates a short-lived, digitally signed verification JWT transmitted back to `ADMIN`, authorizing the subsequent donation completion call.

### Key Observations
- Exemplifies the security principle of zero-trust storage: plaintext OTPs exist only transiently in memory during transmission.
- Incorporates explicit brute-force mitigation: attempt counters are incremented in `D2 OTPs`, permanently invalidating codes after 5 failures.
- Issues a digitally signed JWT token upon verification to cryptographically authorize the donation completion step.

---

## 8.14 Communication (Collaboration) Diagram

The Communication Diagram models the structural relationships and numbered runtime message passing between software objects during the donation completion sequence.

![Figure 8.14: Communication (Collaboration) Diagram](diagrams_native/img-014.png)

### Architectural Explanation
The communication diagram details the collaborative runtime message sequence triggered when an administrator finalizes a donation. The interaction begins with actor `Admin`, who executes message `1: clickMarkAsDonated()` on the `:Frontend` component. The `:Frontend` component converts this UI interaction into an asynchronous HTTP network request: `2: POST /api/donation/complete` routed to the `:ExpressServer`.

Upon receiving the request, the `:ExpressServer` orchestrates four sequential backend operations:
- It queries the database component `:DataStore` via message `3: findAppointment()` to retrieve the verified appointment record.
- It inserts a new certificate entity via message `4: insertCertificate()`.
- It mutates the appointment record via message `5: updateStatus(donated)`.
- It invokes the internal `:CertificateService` component via message `6: generatePdf(cert)` to render the cryptographic PDF document.

Following PDF compilation, the `:ExpressServer` delegates message `7: sendEmail(pdf)` to the `:Mailer` component, which finally transmits message `8: certificate email` directly to the `Donor` actor.

### Key Observations
- Explicit message numbering ($1 \rightarrow 2 \rightarrow 3 \rightarrow 4 \rightarrow 5 \rightarrow 6 \rightarrow 7 \rightarrow 8$) proves the exact deterministic sequence of execution.
- Illustrates loose coupling: the Express server acts as a central mediator between data storage, document rendering, and mail dispatchers.
- Demonstrates that the donor receives the certificate PDF as the final automated outcome of the administrative completion command.

---

## 8.15 Sequence Diagram — Donation Verification

The Sequence Diagram for Donation Verification details the chronological lifeline interactions and return messages between actors and system components during the arrival and verification phase.

![Figure 8.15: Sequence Diagram - Donation Verification](diagrams_native/img-015.png)

### Architectural Explanation
This sequence diagram models the temporal lifeline interactions across seven entities: `Admin`, `Frontend`, `Express Server`, `OTP Service`, `Data Store`, `Mailer / SMS`, and `Donor`. The sequence begins when `Admin` clicks "Send OTP". `Frontend` dispatches `POST /api/donation/send-otp` to `Express Server`, which calls `find appointment` on `Data Store`. It then requests `generateOtpRecord()` from `OTP Service`, receiving a plaintext OTP and an HMAC record. The server writes the HMAC record and status `otp_sent` to `Data Store`, and commands `Mailer / SMS` to transmit the code via Email and SMS to `Donor`.

Next, `Donor` verbally shares the OTP in person with `Admin`, who inputs the code into `Frontend`. `Frontend` sends `POST /api/donation/verify-otp` to `Express Server`, which delegates `validateOtp()` to `OTP Service`. Upon validating the code, `Express Server` updates the appointment status to `verified` in `Data Store` and returns a `verification JWT` to `Frontend`. Finally, `Admin` clicks "Mark as Donated", sending `POST /api/donation/complete` with the JWT. `Express Server` verifies the JWT, creates a certificate record, marks the appointment as `donated`, and triggers `Mailer / SMS` to email the certificate PDF with embedded QR code to `Donor`, returning a `Success` confirmation to `Admin`.

### Key Observations
- Clearly illustrates the human-in-the-loop clinical workflow: the donor must physically arrive at the center to share the received OTP code.
- Cryptographic tokens maintain stateless security: the verification JWT issued by the server proves that OTP verification occurred before donation completion is permitted.
- Complete auditability is preserved across the entire chronological lifeline.

---

## 8.16 Sequence Diagram — Book Appointment

The Sequence Diagram for Appointment Booking illustrates the message flow, validation checks, slot capacity evaluations, and confirmation mechanisms executed during donor registration.

![Figure 8.16: Sequence Diagram - Book Appointment](diagrams_native/img-016.png)

### Architectural Explanation
This sequence diagram illustrates the temporal interactions between `Donor`, `Frontend`, `Express Server`, `Data Store`, and `Mailer` during voluntary appointment booking. The process initiates when `Donor` selects a collection center, date, and time slot, inputs demographic and clinical details, and triggers submission on `Frontend`. `Frontend` transmits an asynchronous HTTP request: `POST /api/appointments` to `Express Server`.

The `Express Server` immediately validates the input parameters (legal name, email syntax, phone digits, and ABO/Rh blood type). Next, it queries `Data Store` via `Load centre, count bookings for slot`. The execution enters an alternative combined fragment (`alt`):
- **Alternative 1 [Slot full (count $\ge$ MAX_PER_SLOT)]:** If the number of existing bookings reaches the center's maximum capacity cap, the server returns an HTTP `409 Slot fully booked` error response. `Frontend` displays a clear error alert instructing the donor to select an alternate date or time window.
- **Alternative 2 [Slot available]:** If capacity exists, the server instructs `Data Store` to `Insert appointment (status = scheduled)`, commands `Mailer` to `sendEmail(booking confirmation)` to the donor, and returns an HTTP 201 `success + appointmentId` payload. `Frontend` renders a verified confirmation screen.

### Key Observations
- Models defensive programming: capacity overflow is intercepted and rejected with an explicit HTTP 409 status code.
- Ensures data consistency: appointments are persisted with `status = scheduled` only after slot availability is verified.
- Confirmation emails are dispatched asynchronously, ensuring fast sub-200ms API response times for the donor.

---

## 8.17 Sequence Diagram — Admin Login

The Sequence Diagram for Admin Login details the authentication lifeline, cryptographic password comparison, session token generation, and storage handling.

![Figure 8.17: Sequence Diagram - Admin Login](diagrams_native/img-017.png)

### Architectural Explanation
This sequence diagram specifies the authentication handshake securing the administrator command portal. The sequence involves three primary entities: `Admin`, `Frontend`, and `Express Server`. The interaction begins when `Admin` inputs administrative credentials into the login modal and submits the form. `Frontend` dispatches an asynchronous network payload: `POST /api/admin/login` to `Express Server`.

The `Express Server` performs two verification steps:
1. It compares the submitted username against `ADMIN_USERNAME` configured in environment variables or database records.
2. It executes a cryptographic hash evaluation via `bcrypt.compare(password, ADMIN_PASSWORD_HASH)`.

The execution branches into an alternative fragment (`alt`):
- **Alternative 1 [Credentials valid]:** The server invokes `jwt.sign(role = admin, expires 8h)` to generate an encrypted JSON Web Token valid for 8 hours. The server returns HTTP 200 with `success + token`. `Frontend` saves the token in `sessionStorage` (preventing persistent cross-session leakage) and renders the administrative dashboard.
- **Alternative 2 [Invalid credentials]:** The server rejects the attempt, returning HTTP `401 Invalid username or password`. `Frontend` displays an explicit error message and maintains the secure login barrier.

### Key Observations
- Passwords are verified exclusively using one-way cryptographic hashing; plaintext passwords never leave the authentication controller.
- Successful sessions receive a time-bounded token (8-hour expiration) stored securely in `sessionStorage`.
- Constant-time comparison semantics mitigate timing attacks during credential evaluation.

---

## 8.18 Sequence Diagram — Certificate Verification (QR Scan)

The Sequence Diagram for Certificate Verification details the public authentication lifeline executed when a third-party verifier scans a certificate's embedded QR code.

![Figure 8.18: Sequence Diagram - Certificate Verification (QR Scan)](diagrams_native/img-018.png)

### Architectural Explanation
This sequence diagram models the public verification workflow that enables employers, universities, healthcare regulators, or sports bodies to authenticate a LifeFlow donation certificate. The sequence involves four entities: `Public Verifier`, `Browser`, `Express Server`, and `Data Store`. The interaction initiates when `Public Verifier` scans the QR code embedded on a donor's certificate using a smartphone camera, which resolves to an HTTP request: `GET /verify/:certificateId?k=verifyKey` opened in the `Browser`.

The `Browser` transmits the request to `Express Server`, which executes `findOne(certificate)` against `Data Store`. The server evaluates the returned record across an alternative fragment (`alt`):
- **Alternative 1 [Not found or key does not match]:** If the certificate ID does not exist or the URL cryptographic key `k` does not match the stored `verifyKey`, the server returns an HTTP `404 Certificate Not Found` error page.
- **Alternative 2 [Certificate revoked]:** If the record exists but its status has been set to revoked by an administrator, the server renders an explicit `Certificate Revoked page` detailing revocation status.
- **Alternative 3 [Certificate valid]:** If the record is valid and authenticated, the server renders a `Valid Certificate` screen displaying verified non-sensitive clinical data: donor initials, blood phenotype, collected units, collection center, and donation date.

### Key Observations
- Protects donor privacy by design: the public verification screen displays only donor initials rather than full legal names.
- Two-factor cryptographic verification: authenticating a certificate requires both the public serial ID and the high-entropy validation key `k` embedded in the QR matrix.
- Provides immediate transparency regarding administrative revocations, preventing the circulation of fraudulent or recalled blood certificates.
