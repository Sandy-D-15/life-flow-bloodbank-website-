import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { 
  BloodStockItem, 
  Donor, 
  BloodRequest, 
  StockTransaction, 
  DashboardStats, 
  BloodGroup,
  RequestStage,
  RequestStatus,
  InventoryOperation
} from './types/index.js';
import { syncToMongo } from './mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateDataDirs = [
  path.resolve(__dirname, 'data'),
  path.resolve(__dirname, '..', 'data'),
  path.resolve(process.cwd(), 'server', 'data'),
  path.resolve(process.cwd(), 'data')
];
const DATA_DIR = candidateDataDirs.find(d => fs.existsSync(d)) || candidateDataDirs[0];
const DB_FILE = path.join(DATA_DIR, 'lifeflow_db.json');

export interface DatabaseSchema {
  inventory: BloodStockItem[];
  donors: Donor[];
  requests: BloodRequest[];
  transactions: StockTransaction[];
  admin: {
    username: string;
    salt: string;
    hash: string;
    role: string;
    name: string;
  };
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export const defaultSalt = '8a7e32c10b4f65d9e8a7e32c10b4f65d';
export const defaultHash = hashPassword('LifeFlow@2026Admin', defaultSalt);

export function validateAdminCredentials(): void {
  const db = getDb();
  const adminPass = process.env.ADMIN_PASSWORD || 'LifeFlow@2026Admin';
  const adminUser = process.env.ADMIN_USERNAME || 'admin';

  if (!db.admin || !db.admin.hash || process.env.ADMIN_PASSWORD) {
    const salt = (db.admin && db.admin.salt) ? db.admin.salt : generateSalt();
    db.admin = {
      username: adminUser,
      salt: salt,
      hash: hashPassword(adminPass, salt),
      role: 'superadmin',
      name: 'System Administrator'
    };
    saveDb(db);
  }
}

const INITIAL_DB: DatabaseSchema = {
  inventory: [
    { bloodGroup: 'A+', unitsAvailable: 28, reservedUnits: 3, minThreshold: 10, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'A-', unitsAvailable: 7, reservedUnits: 1, minThreshold: 8, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'B+', unitsAvailable: 22, reservedUnits: 2, minThreshold: 10, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'B-', unitsAvailable: 4, reservedUnits: 0, minThreshold: 8, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'AB+', unitsAvailable: 14, reservedUnits: 1, minThreshold: 6, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'AB-', unitsAvailable: 3, reservedUnits: 0, minThreshold: 5, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'O+', unitsAvailable: 36, reservedUnits: 4, minThreshold: 15, lastUpdated: new Date().toISOString() },
    { bloodGroup: 'O-', unitsAvailable: 6, reservedUnits: 2, minThreshold: 10, lastUpdated: new Date().toISOString() },
  ],
  donors: [
    {
      id: 'DNR-1001',
      fullName: 'Marcus Vance',
      bloodGroup: 'O-',
      age: 32,
      weight: 78,
      email: 'm.vance@example.com',
      phone: '+1 (555) 234-5678',
      city: 'Metro City',
      lastDonationDate: '2026-06-15',
      registeredAt: '2026-06-15T09:30:00Z',
      status: 'Active',
      totalDonations: 4,
      notes: 'Universal donor. Regular plasma & whole blood participant.',
      eligibilityNotes: 'Medically cleared for routine 56-day cycle.'
    },
    {
      id: 'DNR-1002',
      fullName: 'Elena Rostova',
      bloodGroup: 'A+',
      age: 28,
      weight: 62,
      email: 'elena.rostova@example.com',
      phone: '+1 (555) 345-6789',
      city: 'North River',
      lastDonationDate: '2026-08-02',
      registeredAt: '2026-08-02T11:15:00Z',
      status: 'Active',
      totalDonations: 2,
      notes: 'Veins accessible, pleasant donation experience.',
      eligibilityNotes: 'Next eligible window open.'
    },
    {
      id: 'DNR-1003',
      fullName: 'Dr. David Chen',
      bloodGroup: 'B+',
      age: 45,
      weight: 84,
      email: 'dchen.md@example.com',
      phone: '+1 (555) 456-7890',
      city: 'Harbor Point',
      lastDonationDate: '2026-09-01',
      registeredAt: '2026-09-01T14:00:00Z',
      status: 'Active',
      totalDonations: 7,
      notes: 'Hospital clinician donor advocate.',
      eligibilityNotes: 'Standard 56-day recovery window active.'
    },
    {
      id: 'DNR-1004',
      fullName: 'Amara Okafor',
      bloodGroup: 'AB+',
      age: 24,
      weight: 58,
      email: 'amara.okafor@example.com',
      phone: '+1 (555) 567-8901',
      city: 'Central Valley',
      lastDonationDate: null,
      registeredAt: '2026-10-05T16:20:00Z',
      status: 'Active',
      totalDonations: 0,
      notes: 'First-time voluntary donor registration.',
      eligibilityNotes: 'Initial physical check and hemoglobin screening required on arrival.'
    },
    {
      id: 'DNR-1005',
      fullName: 'Julian Hayes',
      bloodGroup: 'B-',
      age: 39,
      weight: 71,
      email: 'jhayes@example.com',
      phone: '+1 (555) 678-9012',
      city: 'Metro City',
      lastDonationDate: '2026-05-12',
      registeredAt: '2026-05-12T10:00:00Z',
      status: 'Active',
      totalDonations: 5,
      notes: 'Rare B- donor on priority on-call list.',
      eligibilityNotes: 'Eligible for callout.'
    }
  ],
  requests: [
    {
      id: 'REQ-8021',
      hospitalName: 'St. Jude Metropolitan Trauma Center',
      patientName: 'Emergency Trauma Room #4',
      bloodGroup: 'O-',
      units: 3,
      urgency: 'Critical',
      reason: 'Multi-vehicle collision acute internal hemorrhage',
      contactPerson: 'Dr. Sarah Connor (Trauma Lead)',
      contactPhone: '+1 (555) 911-0022',
      contactEmail: 'trauma.dispatch@stjudemetro.org',
      status: 'Pending',
      currentStage: 'Triage Review',
      statusHistory: [
        {
          stage: 'Submitted',
          status: 'Pending',
          timestamp: '2026-10-12T01:15:00Z',
          actor: 'System Ingestion',
          notes: 'Emergency requisition submitted by trauma department.'
        },
        {
          stage: 'Triage Review',
          status: 'Pending',
          timestamp: '2026-10-12T01:20:00Z',
          actor: 'Dr. Victoria Shaw (Medical Director)',
          notes: 'Triaged as priority level 1 trauma requisition.'
        }
      ],
      adminNotes: 'Prioritized for immediate courier dispatch once cross-match clears.',
      createdAt: '2026-10-12T01:15:00Z',
      updatedAt: '2026-10-12T01:20:00Z'
    },
    {
      id: 'REQ-8019',
      hospitalName: 'Children & Family Specialty Hospital',
      patientName: 'Pediatric Oncology Ward B',
      bloodGroup: 'A+',
      units: 4,
      urgency: 'Urgent',
      reason: 'Post-chemotherapy severe thrombocytopenia/anemia',
      contactPerson: 'Nurse Supervisor Kevin Walsh',
      contactPhone: '+1 (555) 911-4433',
      contactEmail: 'oncology@cfshospital.org',
      status: 'Approved',
      currentStage: 'Cross-Match',
      statusHistory: [
        {
          stage: 'Submitted',
          status: 'Pending',
          timestamp: '2026-10-11T19:40:00Z',
          actor: 'System Ingestion',
          notes: 'Requisition submitted.'
        },
        {
          stage: 'Triage Review',
          status: 'Approved',
          timestamp: '2026-10-11T20:00:00Z',
          actor: 'Dr. Victoria Shaw',
          notes: 'Approved for pediatric allocation.'
        },
        {
          stage: 'Cross-Match',
          status: 'Approved',
          timestamp: '2026-10-11T20:10:00Z',
          actor: 'Lab Serologist #3',
          notes: 'Cross-matching in progress with Batch #A-2026-10.'
        }
      ],
      adminNotes: 'Allocated from Batch #A-2026-10.',
      createdAt: '2026-10-11T19:40:00Z',
      updatedAt: '2026-10-11T20:10:00Z'
    },
    {
      id: 'REQ-8015',
      hospitalName: 'General Memorial Surgical Wing',
      patientName: 'Cardiac Surgery Patient 904',
      bloodGroup: 'O+',
      units: 5,
      urgency: 'Normal',
      reason: 'Elective coronary artery bypass graft (CABG)',
      contactPerson: 'OR Coordinator Maria Santos',
      contactPhone: '+1 (555) 911-7788',
      contactEmail: 'or.logistics@genmemorial.org',
      status: 'Fulfilled',
      currentStage: 'Dispatched',
      statusHistory: [
        {
          stage: 'Submitted',
          status: 'Pending',
          timestamp: '2026-10-10T11:20:00Z',
          actor: 'System Ingestion',
          notes: 'Requisition received for scheduled cardiac surgery.'
        },
        {
          stage: 'Triage Review',
          status: 'Approved',
          timestamp: '2026-10-10T12:00:00Z',
          actor: 'Dr. Victoria Shaw',
          notes: 'Approved standard allocation.'
        },
        {
          stage: 'Cross-Match',
          status: 'Approved',
          timestamp: '2026-10-11T09:00:00Z',
          actor: 'Lab Staff',
          notes: 'Serology cross-match non-reactive, cleared.'
        },
        {
          stage: 'Dispatched',
          status: 'Fulfilled',
          timestamp: '2026-10-11T14:30:00Z',
          actor: 'Admin (Cold-Chain Dispatch)',
          notes: 'Handed to certified thermal transport courier #44.'
        }
      ],
      adminNotes: 'Delivered via certified cold-chain courier #44.',
      fulfilledAt: '2026-10-11T14:30:00Z',
      createdAt: '2026-10-10T11:20:00Z',
      updatedAt: '2026-10-11T14:30:00Z'
    },
    {
      id: 'REQ-8012',
      hospitalName: 'University Medical Center ICU',
      patientName: 'ICU Bed 12',
      bloodGroup: 'AB-',
      units: 2,
      urgency: 'Critical',
      reason: 'Disseminated intravascular coagulation (DIC)',
      contactPerson: 'Dr. Raymond Holt',
      contactPhone: '+1 (555) 911-3321',
      contactEmail: 'rholt@unicenter.edu',
      status: 'Pending',
      currentStage: 'Submitted',
      statusHistory: [
        {
          stage: 'Submitted',
          status: 'Pending',
          timestamp: '2026-10-12T02:45:00Z',
          actor: 'System Ingestion',
          notes: 'Requisition submitted.'
        }
      ],
      adminNotes: 'AB- stock is constrained; review compatibility alternatives if needed.',
      createdAt: '2026-10-12T02:45:00Z',
      updatedAt: '2026-10-12T02:45:00Z'
    }
  ],
  transactions: [
    {
      id: 'TX-9001',
      bloodGroup: 'O+',
      operation: '-',
      type: 'OUT',
      units: 5,
      previousBalance: 41,
      resultingBalance: 36,
      reason: 'Hospital fulfillment: General Memorial Surgical Wing (REQ-8015)',
      referenceId: 'REQ-8015',
      recordedBy: 'Admin (Cold-Chain Dispatch)',
      timestamp: '2026-10-11T14:30:00Z'
    },
    {
      id: 'TX-9002',
      bloodGroup: 'O+',
      operation: '+',
      type: 'IN',
      units: 12,
      previousBalance: 29,
      resultingBalance: 41,
      reason: 'Mobile Blood Drive #42 at Metro Community Center',
      recordedBy: 'System Blood Drive Ingestion',
      timestamp: '2026-10-10T18:00:00Z'
    },
    {
      id: 'TX-9003',
      bloodGroup: 'A+',
      operation: '+',
      type: 'IN',
      units: 8,
      previousBalance: 20,
      resultingBalance: 28,
      reason: 'Voluntary on-site donor intake',
      recordedBy: 'Nurse Station #2',
      timestamp: '2026-10-11T10:00:00Z'
    }
  ],
  admin: {
    username: 'admin',
    salt: defaultSalt,
    hash: defaultHash,
    role: 'superadmin',
    name: 'Dr. Victoria Shaw (Medical Director)'
  }
};

let dbCache: DatabaseSchema | null = null;
let transactionLock: Promise<void> = Promise.resolve();

// Synchronized lock for atomic mutations
export function withTransactionLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const resultPromise = transactionLock.then(async () => {
    return await fn();
  });
  transactionLock = resultPromise.then(() => {}, () => {});
  return resultPromise;
}

export function getDb(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
    dbCache = JSON.parse(JSON.stringify(INITIAL_DB));
    return dbCache!;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    return dbCache!;
  } catch (err) {
    console.error('Failed to read db file, recreating fallback:', err);
    dbCache = JSON.parse(JSON.stringify(INITIAL_DB));
    return dbCache!;
  }
}

export function saveDb(data: DatabaseSchema): void {
  dbCache = data;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  syncToMongo(data).catch(() => {});
}

// Generate collision-safe Requisition Reference (e.g., REQ-8025)
export function generateUniqueRequisitionId(): string {
  const db = getDb();
  let candidateId = '';
  let attempts = 0;
  do {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    candidateId = `REQ-${randomNum}`;
    attempts++;
  } while (db.requests.some(r => r.id === candidateId) && attempts < 100);

  if (attempts >= 100) {
    candidateId = `REQ-${Date.now().toString().slice(-4)}`;
  }
  return candidateId;
}

// Generate collision-safe Donor ID (e.g., DNR-1008)
export function generateUniqueDonorId(): string {
  const db = getDb();
  let candidateId = '';
  let attempts = 0;
  do {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    candidateId = `DNR-${randomNum}`;
    attempts++;
  } while (db.donors.some(d => d.id === candidateId) && attempts < 100);

  if (attempts >= 100) {
    candidateId = `DNR-${Date.now().toString().slice(-4)}`;
  }
  return candidateId;
}

// Atomic inventory mutation with append-only audit trail
export async function mutateInventoryAtomically(params: {
  bloodGroup: BloodGroup;
  operation: InventoryOperation;
  quantity: number;
  reason: string;
  actor: string;
  referenceId?: string;
}): Promise<{
  item: BloodStockItem;
  previousBalance: number;
  resultingBalance: number;
  transaction: StockTransaction;
}> {
  return withTransactionLock(async () => {
    const db = getDb();
    const item = db.inventory.find(i => i.bloodGroup === params.bloodGroup);
    if (!item) {
      throw new Error(`Blood group ${params.bloodGroup} does not exist in inventory.`);
    }

    const previousBalance = item.unitsAvailable;
    let resultingBalance = previousBalance;
    const qty = Math.round(params.quantity);

    if (params.operation === '+') {
      if (qty <= 0) throw new Error('Intake quantity must be greater than zero.');
      resultingBalance = previousBalance + qty;
    } else if (params.operation === '-') {
      if (qty <= 0) throw new Error('Dispatch quantity must be greater than zero.');
      if (previousBalance < qty) {
        throw new Error(
          `Insufficient stock: ${params.bloodGroup} has only ${previousBalance} units in bank, but ${qty} units requested for dispatch.`
        );
      }
      resultingBalance = previousBalance - qty;
    } else if (params.operation === '=') {
      if (qty < 0) throw new Error('Reconciled count cannot be negative.');
      resultingBalance = qty;
    } else {
      throw new Error(`Invalid inventory operation "${params.operation}". Must be +, -, or =.`);
    }

    // Apply update
    item.unitsAvailable = resultingBalance;
    item.lastUpdated = new Date().toISOString();

    const txType: 'IN' | 'OUT' | 'ADJUST' = 
      params.operation === '+' ? 'IN' : params.operation === '-' ? 'OUT' : 'ADJUST';

    const txId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
    const transaction: StockTransaction = {
      id: txId,
      bloodGroup: params.bloodGroup,
      operation: params.operation,
      type: txType,
      units: Math.abs(resultingBalance - previousBalance),
      previousBalance,
      resultingBalance,
      reason: params.reason,
      referenceId: params.referenceId,
      recordedBy: params.actor,
      timestamp: new Date().toISOString()
    };

    // Immutable append-only audit record
    db.transactions.unshift(transaction);
    saveDb(db);

    return {
      item,
      previousBalance,
      resultingBalance,
      transaction
    };
  });
}

export function getStats(): DashboardStats {
  const db = getDb();
  const totalDonors = db.donors.length;
  const totalRequests = db.requests.length;
  const totalUnitsAvailable = db.inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
  const pendingRequests = db.requests.filter(r => r.status === 'Pending').length;
  const criticalRequests = db.requests.filter(r => r.urgency === 'Critical' && r.status !== 'Fulfilled' && r.status !== 'Rejected').length;
  const fulfilledRequests = db.requests.filter(r => r.status === 'Fulfilled').length;

  return {
    totalDonors,
    totalRequests,
    totalUnitsAvailable,
    pendingRequests,
    criticalRequests,
    fulfilledRequests
  };
}
