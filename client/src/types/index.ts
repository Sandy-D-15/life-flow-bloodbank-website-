export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'Normal' | 'Urgent' | 'Critical';

export type RequestStatus = 'Pending' | 'Approved' | 'Fulfilled' | 'Rejected';

export type RequestStage = 'Submitted' | 'Triage Review' | 'Cross-Match' | 'Dispatched' | 'Rejected';

export type DonorStatus = 'Active' | 'Deferred' | 'Pending Review';

export interface BloodStockItem {
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  reservedUnits: number;
  minThreshold: number;
  lastUpdated: string;
}

export interface StatusHistoryEntry {
  stage: RequestStage;
  status: RequestStatus;
  timestamp: string;
  actor: string;
  notes?: string;
}

export interface Donor {
  id: string;
  fullName: string;
  bloodGroup: BloodGroup;
  age: number;
  weight: number;
  email: string;
  phone: string;
  city: string;
  lastDonationDate: string | null;
  preferredDonationDate?: string;
  alternateDonationDate?: string;
  donationSlot?: string;
  alternateDonationSlot?: string;
  donationCenter?: string;
  donationCenterAddress?: string;
  flexibleAvailability?: boolean;
  registeredAt: string;
  status: DonorStatus;
  totalDonations: number;
  notes?: string;
  eligibilityNotes?: string;
}

export interface BloodRequest {
  id: string;
  hospitalName: string;
  patientName?: string;
  bloodGroup: BloodGroup;
  units: number;
  urgency: UrgencyLevel;
  reason?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  status: RequestStatus;
  currentStage: RequestStage;
  statusHistory: StatusHistoryEntry[];
  adminNotes?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryOperation = '+' | '-' | '=';

export interface StockTransaction {
  id: string;
  bloodGroup: BloodGroup;
  operation: InventoryOperation;
  type: 'IN' | 'OUT' | 'ADJUST';
  units: number;
  previousBalance: number;
  resultingBalance: number;
  reason: string;
  referenceId?: string;
  recordedBy: string;
  timestamp: string;
}

export interface DashboardStats {
  totalDonors: number;
  totalRequests: number;
  totalUnitsAvailable: number;
  pendingRequests: number;
  criticalRequests: number;
  fulfilledRequests: number;
}

export interface AdminUser {
  username: string;
  name: string;
  role: 'superadmin' | 'inventory_manager' | 'staff';
  token?: string;
}

// Sanitized public view for tracking without leaking sensitive personal/donor data
export interface PublicRequestTracking {
  id: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  units: number;
  urgency: UrgencyLevel;
  status: RequestStatus;
  currentStage: RequestStage;
  statusHistory: {
    stage: RequestStage;
    timestamp: string;
    notes?: string;
  }[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
}
