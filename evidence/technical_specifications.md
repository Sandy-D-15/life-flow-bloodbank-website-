# LifeFlow Blood Bank — Technical Evidence & System Specification

**Compilation Date:** 2026-10-24  
**Target Submission:** B.Sc. (Computer Science), Semester V — University of Mumbai  
**Host Institution:** Jan Seva Sangh's Shri Ram College Of Commerce  
**Verification Status:** Live Test Verified (16/16 Automated Tests Passing; Lint 0 Errors)

---

## 1. Verified Runtime Dependencies & Versions

Source: [`package.json`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/package.json)

| Package | Version | Type | Architectural Purpose |
|---|---|---|---|
| `react` | 19.0.1 | Production | Core UI component framework (SPA) |
| `react-dom` | 19.0.1 | Production | DOM rendering engine for React |
| `vite` | 8.3.0 | Production | Frontend build tooling & dev server middleware |
| `@vitejs/plugin-react` | 6.1.1 | Production | React Fast Refresh plugin for Vite |
| `express` | 4.21.2 | Production | RESTful backend HTTP application framework |
| `mongodb` | 7.7.0 | Production | Official MongoDB native driver (optional Atlas sync) |
| `nodemailer` | 10.1.7 | Production | SMTP email notification engine |
| `chart.js` | 4.5.1 | Production | Canvas-based data visualization library |
| `react-chartjs-2` | 5.3.1 | Production | React wrapper for Chart.js components |
| `gsap` | 3.14.2 | Production | High-performance animation runtime |
| `@gsap/react` | 2.1.2 | Production | GSAP hook bindings for React lifecycle |
| `motion` | 12.23.24 | Production | Declarative spring motion & presence transitions |
| `lucide-react` | 0.546.0 | Production | Clean SVG clinical icon library |
| `dotenv` | 17.2.3 | Production | Environment variable injector from `.env` |
| `three` | 0.186.1 | Production | WebGL 3D rendering engine (blood drop hero element) |
| `@tailwindcss/vite` | 4.3.3 | Production | Tailwind CSS v4 Vite integration |
| `tailwindcss` | 4.3.3 | DevDependency | Utility-first styling framework |
| `typescript` | 7.0.2 | DevDependency | Static type checker and compiler |
| `tsx` | 4.21.0 | DevDependency | TypeScript execution engine for Node.js runtime |
| `esbuild` | 0.27.0 | DevDependency | Server bundling engine for production builds |
| `@types/node` | 22.14.0 | DevDependency | TypeScript type definitions for Node.js |
| `@types/express` | 4.17.21 | DevDependency | TypeScript type definitions for Express |

---

## 2. API Routing & Endpoint Specification

Extracted directly from [`server.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server.ts):

| Endpoint | HTTP Method | Access Level | Request Payload | Response Status & Structure | Implementation Lines |
|---|---|---|---|---|---|
| `/api/health` | `GET` | Public | None | `200 OK`: `{ status: 'ok', service: string, version: '2.1.0', timestamp: string }` | L85–L92 |
| `/api/stats` | `GET` | Public | None | `200 OK`: `DashboardStats` (`totalDonors`, `totalRequests`, `totalUnitsAvailable`, `pendingRequests`, `criticalRequests`, `fulfilledRequests`) | L95–L102 |
| `/api/auth/login` | `POST` | Public | `{ username, password }` | `200 OK`: `{ token, user: { username, name, role } }`<br>`400 Bad Request`: Missing fields<br>`401 Unauthorized`: Bad credentials | L105–L152 |
| `/api/auth/verify` | `GET` | Public / Bearer | Header: `Authorization: Bearer <token>` | `200 OK`: `{ authenticated: true, user }`<br>`401 Unauthorized`: `{ authenticated: false }` | L155–L179 |
| `/api/auth/logout` | `POST` | Public / Bearer | Header: `Authorization: Bearer <token>` | `200 OK`: `{ success: true }` | L182–L189 |
| `/api/auth/change-password` | `POST` | Admin Only | Header: `Bearer <token>`<br>Body: `{ currentPassword, newPassword }` | `200 OK`: `{ success: true, message: string }`<br>`400 Bad Request`: New password < 8 chars<br>`401 Unauthorized`: Current password wrong | L192–L213 |
| `/api/inventory` | `GET` | Public | None | `200 OK`: `BloodStockItem[]` (all 8 phenotypes) | L216–L223 |
| `/api/inventory/mutate` | `POST` | Admin Only | Header: `Bearer <token>`<br>Body: `{ bloodGroup, operation: '+'\|'-'\|'=', quantity, reason }` | `200 OK`: `{ success: true, item, previousBalance, resultingBalance, transaction, allInventory }`<br>`400 Bad Request`: Invalid group/op, oversell, or missing reason | L226–L275 |
| `/api/donors` | `GET` | Admin Only | Header: `Bearer <token>`<br>Query: `bloodGroup`, `status`, `search` | `200 OK`: `Donor[]` | L305–L334 |
| `/api/donors` | `POST` | Public | Form data: `{ fullName, bloodGroup, age, weight, email, phone, city, lastDonationDate, preferredDonationDate, alternateDonationDate, donationSlot, donationCenter, flexibleAvailability, notes }` | `201 Created`: `{ success: true, message, donor }`<br>`400 Bad Request`: Invalid age (<18 or >65), weight (<50kg), email, or phone | L337–L467 |
| `/api/requests` | `GET` | Admin Only | Header: `Bearer <token>`<br>Query: `status`, `urgency`, `bloodGroup`, `search` | `200 OK`: `BloodRequest[]` | L470–L502 |
| `/api/requests/:id` | `GET` | Public (Rate-Limited) | URL Param: `id` | `200 OK`: `PublicRequestTracking` (sanitized)<br>`404 Not Found`: Reference not found<br>`429 Too Many Requests`: Exceeded 60 req/min | L505–L548 |
| `/api/requests` | `POST` | Public | Body: `{ hospitalName, patientName, bloodGroup, units, urgency, reason, contactPerson, contactPhone, contactEmail }` | `201 Created`: `{ success: true, message, request }`<br>`400 Bad Request`: Missing hospital, units outside 1–50, invalid blood group | L551–L649 |
| `/api/requests/:id/stage` | `PATCH` | Admin Only | Header: `Bearer <token>`<br>Body: `{ stage: RequestStage, notes?: string }` | `200 OK`: `{ success: true, request, inventory }`<br>`400 Bad Request`: Invalid stage or insufficient stock for dispatch | L652–L796 |
| `/api/transactions` | `GET` | Admin Only | Header: `Bearer <token>` | `200 OK`: `StockTransaction[]` (latest 100 entries) | L875–L882 |

---

## 3. Database Schema & Field Matrix

Source: [`src/types/index.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/src/types/index.ts) and [`server/db.ts`](file:///c:/Users/Owner/Downloads/lifeflow-human-motion-refinement/server/db.ts)

### 3.1 Entity: `BloodStockItem`
- `bloodGroup`: `BloodGroup` (`'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'`) — Primary Key
- `unitsAvailable`: `number` (non-negative integer) — Current vault balance
- `reservedUnits`: `number` (non-negative integer) — Units allocated for pending cross-matches
- `minThreshold`: `number` (integer) — Low-stock warning trigger threshold
- `lastUpdated`: `string` (ISO 8601 timestamp) — Last modification time

### 3.2 Entity: `Donor`
- `id`: `string` (Format: `DNR-xxxx`, collision-safe) — Primary Key
- `fullName`: `string` — Full legal donor name
- `bloodGroup`: `BloodGroup` — Phenotype
- `age`: `number` (18 $\le$ age $\le$ 65) — Donor age in years
- `weight`: `number` (weight $\ge$ 50 kg / 110 lbs) — Body mass
- `email`: `string` (RFC 5322 regex validated) — Contact email
- `phone`: `string` (digits $\ge$ 8) — Contact telephone
- `city`: `string` — Residential city or district
- `lastDonationDate`: `string | null` (YYYY-MM-DD) — Prior donation date
- `preferredDonationDate`: `string | undefined` — Primary scheduled date
- `alternateDonationDate`: `string | undefined` — Backup scheduled date
- `donationSlot`: `string | undefined` — Preferred time slot
- `alternateDonationSlot`: `string | undefined` — Backup time slot
- `donationCenter`: `string | undefined` — Selected clinical center name
- `donationCenterAddress`: `string | undefined` — Physical address of center
- `flexibleAvailability`: `boolean` — Willingness for emergency callout
- `registeredAt`: `string` (ISO 8601 timestamp) — Registration creation timestamp
- `status`: `DonorStatus` (`'Active' | 'Deferred' | 'Pending Review'`)
- `totalDonations`: `number` (integer) — Historical count of completed donations
- `notes`: `string | undefined` — Special clinical notes or preferences
- `eligibilityNotes`: `string | undefined` — Automated 56-day rule guidance text

### 3.3 Entity: `BloodRequest`
- `id`: `string` (Format: `REQ-xxxx`, collision-safe) — Primary Key
- `hospitalName`: `string` — Hospital or healthcare facility
- `patientName`: `string | undefined` — Anonymized patient / ward reference
- `bloodGroup`: `BloodGroup` — Requested phenotype
- `units`: `number` (1 $\le$ units $\le$ 50) — Requested whole-blood units
- `urgency`: `UrgencyLevel` (`'Normal' | 'Urgent' | 'Critical'`)
- `reason`: `string | undefined` — Clinical diagnosis / surgical procedure
- `contactPerson`: `string` — Authorized hospital physician or liaison
- `contactPhone`: `string` — Emergency contact telephone
- `contactEmail`: `string` — Emergency contact email
- `status`: `RequestStatus` (`'Pending' | 'Approved' | 'Fulfilled' | 'Rejected'`)
- `currentStage`: `RequestStage` (`'Submitted' | 'Triage Review' | 'Cross-Match' | 'Dispatched' | 'Rejected'`)
- `statusHistory`: `StatusHistoryEntry[]` (JSON array: stage, status, timestamp, actor, notes)
- `adminNotes`: `string | undefined` — Administrative triage comments
- `fulfilledAt`: `string | undefined` (ISO 8601 timestamp) — Dispatch timestamp
- `createdAt`: `string` (ISO 8601 timestamp)
- `updatedAt`: `string` (ISO 8601 timestamp)

### 3.4 Entity: `StockTransaction` (Append-Only Audit Ledger)
- `id`: `string` (Format: `TX-xxxxxx-xx`) — Primary Key
- `bloodGroup`: `BloodGroup` — Mutated phenotype
- `operation`: `InventoryOperation` (`'+' | '-' | '='`)
- `type`: `'IN' | 'OUT' | 'ADJUST'`
- `units`: `number` — Magnitude of units changed
- `previousBalance`: `number` — Vault count before mutation
- `resultingBalance`: `number` — Vault count after mutation
- `reason`: `string` — Mandatory clinical/administrative justification
- `referenceId`: `string | undefined` — Associated requisition ID (e.g., `REQ-8015`)
- `recordedBy`: `string` — Authenticated administrator name/username
- `timestamp`: `string` (ISO 8601 timestamp)

---

## 4. Security Controls & Architecture

1. **Password Storage:** Node.js native `crypto.pbkdf2Sync` (SHA-512, 10,000 iterations, 16-byte random salt). Zero plaintext storage.
2. **Session Authentication:** Cryptographically strong 32-byte hexadecimal bearer tokens (`crypto.randomBytes(32)`), tracked in server memory with 24-hour expiration (`activeTokens: Map`).
3. **Public Rate Limiting:** In-memory sliding window IP rate limiter on `/api/requests/:id` capping queries at 60 requests per minute per IP to prevent automated brute-force reconnaissance.
4. **Data Sanitization:** Public tracking responses project `BloodRequest` into `PublicRequestTracking`, strictly stripping private hospital contact emails, doctor phone numbers, and patient details.
5. **Concurrency & Atomicity:** Asynchronous promise-chain mutex `withTransactionLock` guarantees atomic reads and writes on inventory during hospital orders and manual mutations.
6. **Oversell Prevention:** The server strictly checks `unitsAvailable < request.units` and returns `400 Bad Request` if insufficient unreserved units exist, completely blocking false fulfillment.
