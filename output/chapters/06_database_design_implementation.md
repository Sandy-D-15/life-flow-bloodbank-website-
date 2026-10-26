# CHAPTER 6: DATABASE DESIGN & IMPLEMENTATION

## 6.1 Database Overview

In a clinical blood bank and transfusion management platform, the database architecture represents the single source of truth for living inventory, patient requisitions, and donor health histories. The persistence layer must satisfy two fundamentally competing demands: extreme high availability during life-threatening emergency trauma resuscitations, and uncompromising transactional consistency to eliminate race conditions, double allocations, or data corruption.

To achieve both rapid zero-configuration local deployment and scalable cloud operability, LifeFlow implements a **resilient dual-tier hybrid persistence architecture**:
1. **Local Disk-Backed ACID Store (`data/lifeflow_db.json`):** Powered by Node.js native filesystem I/O and serialized via an asynchronous promise-chaining mutex lock (`withTransactionLock`). This local engine provides zero-latency synchronous reading, offline resilience, and guaranteed portability across all development, testing, and air-gapped hospital environments.
2. **Cloud Document Database Sync (`server/mongo.ts`):** Utilizing the official native `mongodb` driver (`MongoClient`), the system connects to a cloud-hosted MongoDB Atlas cluster. When connected, all state mutations are mirrored asynchronously across dedicated database collections (`inventory`, `donors`, `requests`, `transactions`).
3. **Resilient Fallback Mode (`USE_JSON_FALLBACK`):** In the event of network disruption, cloud cluster outage, or SSL handshake anomalies during hospital intranet deployment, the platform automatically activates its local fallback mechanism, guaranteeing uninterrupted 24/7 clinical operations without server termination.

The data models enforce strong static typing via TypeScript interfaces defined in [`src/types/index.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/types/index.ts), bridging client-side components and server-side route controllers with absolute schema fidelity.

---

## 6.2 Database Tables & Entity Schemas

This section presents the detailed structural schema for all entities maintained within the LifeFlow system. In accordance with the Phase 1 Reconciliation Gate decisions, this includes the five actively implemented database collections (`BloodStockItem`, `Donor`, `BloodRequest`, `StockTransaction`, and `AdminUser`) as well as the three formally specified architectural design entities (`Appointment`, `OtpRecord`, and `Certificate`).

### 6.2.1 BloodStockItem (Inventory Collection)
- **Entity Purpose:** Tracks real-time vault balances, reserved units, and critical shortage thresholds across all eight human blood phenotypes.
- **Primary Key:** `bloodGroup` (Natural Key, ABO/Rh Phenotype)

#### Table 6.1: BloodStockItem Schema

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `bloodGroup` | `VARCHAR(3)` / `Enum` | Primary Key, Not Null | One of 8 ABO/Rh phenotypes: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `unitsAvailable` | `INTEGER` | Not Null, $\ge 0$ | Total number of whole blood units currently verified in cold bank |
| `reservedUnits` | `INTEGER` | Not Null, $\ge 0$ | Units currently held for pending laboratory cross-matches |
| `minThreshold` | `INTEGER` | Not Null, $> 0$ | Safety threshold below which visual shortage alerts are triggered |
| `lastUpdated` | `TIMESTAMP` | Not Null, ISO 8601 | Exact date and time of the last stock mutation |

#### Anonymised Sample Record:
```json
{
  "bloodGroup": "O-",
  "unitsAvailable": 6,
  "reservedUnits": 2,
  "minThreshold": 10,
  "lastUpdated": "2026-10-24T18:30:00.000Z"
}
```

---

### 6.2.2 Donor (Voluntary Donor Registry Collection)
- **Entity Purpose:** Maintains voluntary donor demographics, physical screening parameters, donation histories, multi-date appointment schedules, and 56-day clinical interval calculations.
- **Primary Key:** `id` (Format: `DNR-xxxx`)

#### Table 6.2: Donor Schema

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `VARCHAR(16)` | Primary Key, Unique, Not Null | Collision-safe identifier formatted as `DNR-xxxx` |
| `fullName` | `VARCHAR(100)` | Not Null, Trimmed | Full legal name of voluntary donor |
| `bloodGroup` | `VARCHAR(3)` / `Enum` | Not Null | Donor's ABO and Rh blood group |
| `age` | `INTEGER` | Not Null, $18 \le \text{age} \le 65$ | Donor age in completed years |
| `weight` | `NUMERIC(5,2)` | Not Null, $\ge 50.00$ | Donor body mass in kilograms (minimum 50 kg requirement) |
| `email` | `VARCHAR(120)` | Not Null, RFC 5322 Regex | Contact email address for automated appointment confirmation |
| `phone` | `VARCHAR(20)` | Not Null, Cleaned digits $\ge 8$ | Primary contact telephone number |
| `city` | `VARCHAR(60)` | Not Null | Residential city or district of donor |
| `lastDonationDate`| `DATE` / `VARCHAR(10)`| Nullable | Date of last whole-blood donation (YYYY-MM-DD) or null if first-time |
| `preferredDonationDate` | `DATE` / `VARCHAR(10)` | Optional | Primary scheduled date for donation appointment |
| `alternateDonationDate` | `DATE` / `VARCHAR(10)` | Optional | Backup date if unavailable on primary preferred date |
| `donationSlot` | `VARCHAR(40)` | Optional | Primary chosen time window (e.g., Morning 09:00 AM – 12:00 PM) |
| `alternateDonationSlot`| `VARCHAR(40)`| Optional | Backup chosen time window |
| `donationCenter`| `VARCHAR(100)` | Optional | Designated donation hub (e.g., LifeFlow Central Transfusion Center) |
| `donationCenterAddress`| `VARCHAR(200)`| Optional | Physical street address of selected donation center |
| `flexibleAvailability` | `BOOLEAN` | Default: `true` | Willingness to be contacted for emergency on-call trauma drives |
| `registeredAt` | `TIMESTAMP` | Not Null, ISO 8601 | System registration creation timestamp |
| `status` | `VARCHAR(20)` | Enum: `Active`, `Deferred` | Clinical eligibility status based on age, weight, and 56-day interval |
| `totalDonations` | `INTEGER` | Not Null, $\ge 0$ | Cumulative completed life-time donations |
| `notes` | `TEXT` | Optional | Donor health notes, vein preferences, or past vasovagal reactions |
| `eligibilityNotes`| `TEXT` | Optional | System-generated clinical evaluation text explaining interval status |

#### Anonymised Sample Record:
```json
{
  "id": "DNR-1001",
  "fullName": "Marcus Vance",
  "bloodGroup": "O-",
  "age": 32,
  "weight": 78.0,
  "email": "m.vance@example.com",
  "phone": "+91 (22) 5550-2345",
  "city": "Metro Central",
  "lastDonationDate": "2026-06-15",
  "preferredDonationDate": "2026-10-25",
  "alternateDonationDate": "2026-11-02",
  "donationSlot": "Morning (09:00 AM – 12:00 PM)",
  "alternateDonationSlot": "Afternoon (01:00 PM – 04:00 PM)",
  "donationCenter": "LifeFlow Central Transfusion Center",
  "donationCenterAddress": "104 Health Boulevard, Medical District",
  "flexibleAvailability": true,
  "registeredAt": "2026-10-01T09:30:00.000Z",
  "status": "Active",
  "totalDonations": 4,
  "notes": "Universal donor on emergency trauma callout roster.",
  "eligibilityNotes": "Safe interval satisfied: 118 days since prior donation. Final screening on-site."
}
```

---

### 6.2.3 BloodRequest (Hospital Requisition Collection)
- **Entity Purpose:** Tracks hospital trauma requisitions, authorized clinical liaisons, urgency levels, 4-stage custody progressions, and stock fulfillment links.
- **Primary Key:** `id` (Format: `REQ-xxxx`)

#### Table 6.3: BloodRequest Schema

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `VARCHAR(16)` | Primary Key, Unique, Not Null | Collision-safe hospital order reference (e.g., `REQ-8021`) |
| `hospitalName` | `VARCHAR(150)` | Not Null | Healthcare institution or hospital submitting order |
| `patientName` | `VARCHAR(100)` | Optional | Anonymised emergency room reference, bed number, or trauma code |
| `bloodGroup` | `VARCHAR(3)` / `Enum` | Not Null, FK to BloodStockItem | Required blood phenotype |
| `units` | `INTEGER` | Not Null, $1 \le \text{units} \le 50$ | Whole blood units requested |
| `urgency` | `VARCHAR(15)` | Enum: `Normal`, `Urgent`, `Critical` | Triage priority rating |
| `reason` | `TEXT` | Optional | Clinical diagnosis (e.g., acute hemorrhage, elective surgery) |
| `contactPerson` | `VARCHAR(100)` | Not Null | Authorized physician or trauma nurse coordinator |
| `contactPhone` | `VARCHAR(20)` | Not Null | Emergency verification telephone number |
| `contactEmail` | `VARCHAR(120)` | Not Null | Medical staff email for order status notifications |
| `status` | `VARCHAR(20)` | Enum: `Pending`, `Approved`, `Fulfilled`, `Rejected` | High-level clinical requisition status |
| `currentStage` | `VARCHAR(30)` | Enum: `Submitted`, `Triage Review`, `Cross-Match`, `Dispatched`, `Rejected` | Granular chain-of-custody workflow stage |
| `statusHistory` | `JSON ARRAY` | Not Null | Chronological audit log of stage progressions |
| `adminNotes` | `TEXT` | Optional | Administrative triage notes, batch IDs, or courier data |
| `fulfilledAt` | `TIMESTAMP` | Nullable, ISO 8601 | Timestamp when cold-chain dispatch was confirmed |
| `createdAt` | `TIMESTAMP` | Not Null, ISO 8601 | Requisition submission timestamp |
| `updatedAt` | `TIMESTAMP` | Not Null, ISO 8601 | Last stage modification timestamp |

#### Anonymised Sample Record:
```json
{
  "id": "REQ-8021",
  "hospitalName": "St. Jude Metropolitan Trauma Center",
  "patientName": "Emergency Trauma Room #4",
  "bloodGroup": "O-",
  "units": 3,
  "urgency": "Critical",
  "reason": "Multi-vehicle collision acute internal hemorrhage",
  "contactPerson": "Dr. Sarah Connor (Trauma Lead)",
  "contactPhone": "+91 (22) 5550-9111",
  "contactEmail": "trauma.dispatch@stjudemetro.org",
  "status": "Approved",
  "currentStage": "Cross-Match",
  "statusHistory": [
    {
      "stage": "Submitted",
      "status": "Pending",
      "timestamp": "2026-10-12T01:15:00.000Z",
      "actor": "Hospital Portal",
      "notes": "Emergency requisition submitted by trauma department."
    },
    {
      "stage": "Triage Review",
      "status": "Approved",
      "timestamp": "2026-10-12T01:20:00.000Z",
      "actor": "Dr. Victoria Shaw (Medical Director)",
      "notes": "Triaged as priority level 1 trauma requisition."
    },
    {
      "stage": "Cross-Match",
      "status": "Approved",
      "timestamp": "2026-10-12T01:35:00.000Z",
      "actor": "Lab Serologist #3",
      "notes": "Cross-matching with vault thermal units in progress."
    }
  ],
  "adminNotes": "Allocated from Batch #O-2026-10. Thermal courier on standby.",
  "createdAt": "2026-10-12T01:15:00.000Z",
  "updatedAt": "2026-10-12T01:35:00.000Z"
}
```

---

### 6.2.4 StockTransaction (Immutable Audit Ledger Collection)
- **Entity Purpose:** Enforces financial-grade auditability by recording every intake, dispatch, and physical recount as an immutable append-only ledger entry.
- **Primary Key:** `id` (Format: `TX-xxxxxx-xx`)

#### Table 6.4: StockTransaction Schema

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `VARCHAR(20)` | Primary Key, Unique, Not Null | Unique transaction identifier |
| `bloodGroup` | `VARCHAR(3)` / `Enum` | Not Null, FK to BloodStockItem | Mutated blood phenotype |
| `operation` | `CHAR(1)` | Enum: `+`, `-`, `=` | Mathematical mutation mode |
| `type` | `VARCHAR(10)` | Enum: `IN`, `OUT`, `ADJUST` | Categorical classification of stock event |
| `units` | `INTEGER` | Not Null, $> 0$ | Magnitude of units changed |
| `previousBalance` | `INTEGER` | Not Null, $\ge 0$ | Units available immediately prior to mutation |
| `resultingBalance` | `INTEGER` | Not Null, $\ge 0$ | Units available immediately following mutation |
| `reason` | `TEXT` | Not Null | Mandatory audit explanation entered by operator |
| `referenceId` | `VARCHAR(20)` | Optional, FK to BloodRequest | Related requisition or blood drive reference ID |
| `recordedBy` | `VARCHAR(100)` | Not Null | Identity of authenticated operator executing the change |
| `timestamp` | `TIMESTAMP` | Not Null, ISO 8601 | Precise server timestamp when transaction was committed |

#### Anonymised Sample Record:
```json
{
  "id": "TX-900112-44",
  "bloodGroup": "O-",
  "operation": "-",
  "type": "OUT",
  "units": 3,
  "previousBalance": 9,
  "resultingBalance": 6,
  "reason": "Hospital Requisition Dispatch: St. Jude Metropolitan Trauma Center (REQ-8021)",
  "referenceId": "REQ-8021",
  "recordedBy": "Dr. Victoria Shaw (Medical Director)",
  "timestamp": "2026-10-12T01:50:00.000Z"
}
```

---

### 6.2.5 AdminUser (Administrator Authentication Model)
- **Entity Purpose:** Encapsulates encrypted master credentials, cryptographic salt, administrative role permissions, and operator display metadata.
- **Primary Key:** `username`

#### Table 6.5: AdminUser Schema

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `username` | `VARCHAR(50)` | Primary Key, Unique, Not Null | Unique administrative login handle |
| `salt` | `VARCHAR(64)` | Not Null | 16-byte random hexadecimal salt generated via `crypto.randomBytes(16)` |
| `hash` | `VARCHAR(128)` | Not Null | SHA-512 derived hash computed via PBKDF2 (10,000 iterations) |
| `role` | `VARCHAR(30)` | Not Null | Authorization scope (e.g., `superadmin`, `inventory_manager`) |
| `name` | `VARCHAR(100)` | Not Null | Full professional title and name of medical director |

#### Anonymised Sample Record:
```json
{
  "username": "admin",
  "salt": "8a7e32c10b4f65d9e8a7e32c10b4f65d",
  "hash": "8f3b207e99b0c2...[PBKDF2-SHA512-DERIVED-64-BYTE-HEX]...",
  "role": "superadmin",
  "name": "Dr. Victoria Shaw (Medical Director)"
}
```

---

### 6.2.6 Appointment (Designed Entity — Next Phase Architectural Specification)
- **Entity Purpose:** Architecturally specified in Diagrams 8.1, 8.3, 8.6(a), and 8.16 to model standalone appointment slots, slot capacity caps (`MAX_PER_SLOT`), and attendance statuses.
- **Primary Key:** `id` (Format: `test-appt-xxxx`)

#### Table 6.6: Appointment Schema (Architectural Design Model)

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `VARCHAR(40)` | Primary Key, Unique, Not Null | Standalone appointment booking identifier |
| `center_id` | `VARCHAR(30)` | Not Null, FK to DonationCenter | Identifier of hosting donation center |
| `name` | `VARCHAR(100)` | Not Null | Registered donor legal name |
| `email` | `VARCHAR(120)` | Not Null | Contact email for appointment notices |
| `phone` | `VARCHAR(20)` | Not Null | Telephone number for OTP dispatch |
| `blood_type` | `VARCHAR(3)` | Not Null | Stated phenotype |
| `appointment_date`| `DATE` / `VARCHAR(10)` | Not Null | Calendar appointment date |
| `appointment_time`| `VARCHAR(30)` | Not Null | Scheduled time window |
| `status` | `VARCHAR(20)` | Enum: `scheduled`, `otp_sent`, `verified`, `donated`, `cancelled`, `noshow` | Appointment lifecycle state |
| `certificateId` | `VARCHAR(40)` | Nullable, FK to Certificate | Linked certificate reference upon donation completion |
| `donatedUnits` | `INTEGER` | Default: 0 | Verified units collected (1 or 2) |

---

### 6.2.7 OtpRecord (Designed Entity — Next Phase Architectural Specification)
- **Entity Purpose:** Architecturally modeled in Diagrams 8.1, 8.3, 8.13, and 8.15 to support admin-triggered 6-digit OTP verification upon donor arrival.
- **Primary Key / Foreign Key:** `appointmentId`

#### Table 6.7: OtpRecord Schema (Architectural Design Model)

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `appointmentId` | `VARCHAR(40)` | Primary Key, FK to Appointment | Linked appointment record |
| `hmac` | `VARCHAR(128)` | Not Null | HMAC-SHA256 hash of the generated 6-digit OTP (plaintext never stored) |
| `expiresAt` | `BIGINT` | Not Null, Epoch ms | Expiration timestamp (standard 10-minute validity) |
| `attempts` | `INTEGER` | Not Null, Default: 0 | Failed verification attempt counter (locked at $\ge 5$) |
| `usedAt` | `BIGINT` | Nullable, Epoch ms | Timestamp when successfully verified |
| `lastSentAt` | `BIGINT` | Not Null, Epoch ms | Rate-limiting cooldown timestamp for OTP retransmissions |
| `sendCount` | `INTEGER` | Not Null, Default: 1 | Transmission counter |

---

### 6.2.8 Certificate (Designed Entity — Next Phase Architectural Specification)
- **Entity Purpose:** Architecturally specified in Diagrams 8.1, 8.3, 8.6(b), and 8.18 to issue cryptographically verifiable PDF donation certificates with embedded public QR verification codes.
- **Primary Key:** `id` (Format: `LF-2026-xxxxxx`)

#### Table 6.8: Certificate Schema (Architectural Design Model)

| Field | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `VARCHAR(30)` | Primary Key, Unique, Not Null | Unique certificate registry serial number |
| `appointmentId` | `VARCHAR(40)` | Not Null, FK to Appointment | Linked verified appointment |
| `verifyKey` | `VARCHAR(64)` | Not Null | Cryptographic HMAC validation token embedded in QR URL |
| `donorName` | `VARCHAR(100)` | Not Null | Verified donor name |
| `donorEmail` | `VARCHAR(120)` | Not Null | Recipient email address |
| `bloodType` | `VARCHAR(3)` | Not Null | Collected phenotype |
| `units` | `INTEGER` | Not Null, Typically 1 | Units contributed |
| `donationDate` | `DATE` | Not Null | Clinical collection date |
| `centreName` | `VARCHAR(100)` | Not Null | Certified collection center name |
| `status` | `VARCHAR(15)` | Enum: `valid`, `revoked` | Official certificate status |
| `emailStatus` | `VARCHAR(20)` | Enum: `sent`, `failed` | PDF transmission status |
| `issuedAt` | `TIMESTAMP` | Not Null | Creation timestamp |

---

## 6.3 Database Implementation & Concurrency Management

The database implementation in [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts) and [`server/mongo.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/mongo.ts) realizes a robust, enterprise-grade storage subsystem through several specialized mechanisms:

### 6.3.1 Atomic Concurrency Mutex (`withTransactionLock`)
In a clinical environment where multiple trauma centers may submit emergency requisitions simultaneously, concurrent database mutations can cause race conditions resulting in stock overselling. In [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts#L338-L345), LifeFlow implements an asynchronous promise-chain mutex:

```typescript
let transactionLock: Promise<void> = Promise.resolve();

export function withTransactionLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const resultPromise = transactionLock.then(async () => {
    return await fn();
  });
  transactionLock = resultPromise.then(() => {}, () => {});
  return resultPromise;
}
```
This construct queues all database modifications sequentially. When two trauma orders for `O-` whole blood arrive within milliseconds of each other, the second transaction is guaranteed to evaluate inventory only *after* the first transaction has either successfully reserved units or rolled back.

### 6.3.2 Atomic Storage Persistence & Mongo Mirroring
Reading and writing operations are encapsulated in `getDb()` and `saveDb()`. In [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts#L371-L378), `saveDb()` updates an in-memory memory cache (`dbCache`), synchronously writes a formatted JSON snapshot to disk using atomic filesystem calls, and subsequently initiates an asynchronous synchronization to the cloud MongoDB Atlas cluster via `syncToMongo(data)`. If the MongoDB connection is unconfigured or experiences latency, the asynchronous promise is caught cleanly without degrading API response times.

### 6.3.3 Initial Seed Data & Cold-Start Bootstrapping
When the application starts in an uninitialized environment where `./data/lifeflow_db.json` does not yet exist, [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts#L45-L333) automatically creates the storage directory and writes `INITIAL_DB`. This seed dataset bootstraps all eight blood phenotypes with clinical reserve levels, initializes 5 realistic donor demographic records with varied donation histories, injects 4 pre-configured hospital requisitions across all stages, and records 3 initial ledger transactions, ensuring that evaluators experience a fully populated operational system immediately upon launching `npm run dev`.
