import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initMongo } from './server/mongo.js';
import { sendDonorConfirmationEmail, sendRequisitionStatusEmail } from './server/notifications.js';
import { 
  getDb, 
  saveDb, 
  getStats, 
  hashPassword, 
  generateSalt,
  mutateInventoryAtomically, 
  generateUniqueRequisitionId, 
  generateUniqueDonorId,
  withTransactionLock
} from './server/db.js';
import { 
  BloodGroup, 
  UrgencyLevel, 
  BloodRequest, 
  Donor, 
  InventoryOperation, 
  RequestStage, 
  RequestStatus,
  PublicRequestTracking
} from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json());

// In-memory active tokens mapped to username and expiry
const activeTokens = new Map<string, { username: string; expiresAt: number; role: string; name: string }>();

// Simple in-memory rate limiter for public endpoints (to prevent tracking brute force)
const trackingRateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = trackingRateLimiter.get(ip);
  if (!entry || entry.resetAt < now) {
    trackingRateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Auth middleware helper
function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeTokens.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeTokens.delete(token);
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  (req as any).user = session;
  next();
}

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'LifeFlow Blood Bank Engine', 
    version: '2.1.0',
    timestamp: new Date().toISOString() 
  });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve stats', message: err.message });
  }
});

// Admin and Staff login with Role-Based Access Control
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const db = getDb();
  const lowerUser = username.toLowerCase().trim();

  // 1. Check if Camp Staff / Phlebotomist account
  const isStaffUser = lowerUser === 'staff' || lowerUser === 'staff@lifeflow.org' || lowerUser === 'nurse';
  if (isStaffUser) {
    const isStaffPass = password === 'CampStaff@2026' || password === 'staff123';
    if (!isStaffPass) {
      res.status(401).json({ error: 'Invalid staff credentials' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const staffUser = {
      username: 'staff',
      name: 'Nurse Station / Camp Phlebotomist',
      role: 'staff' as const,
    };
    activeTokens.set(token, {
      username: staffUser.username,
      expiresAt,
      role: staffUser.role,
      name: staffUser.name,
    });

    res.json({ token, user: staffUser });
    return;
  }

  // 2. Check if Medical Director / Superadmin account
  const configuredUser = process.env.ADMIN_USERNAME || db.admin.username;
  const configuredEmail = process.env.ADMIN_EMAIL || 'admin@lifeflow.org';
  const matchesAdmin = lowerUser === configuredUser.toLowerCase() || 
                       lowerUser === db.admin.username.toLowerCase() ||
                       lowerUser === configuredEmail.toLowerCase();

  if (!matchesAdmin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const computedHash = hashPassword(password, db.admin.salt);
  const isValidPassword = 
    computedHash === db.admin.hash ||
    (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);

  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Generate secure token valid for 24 hours
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  activeTokens.set(token, { 
    username: db.admin.username, 
    expiresAt, 
    role: db.admin.role,
    name: db.admin.name 
  });

  res.json({
    token,
    user: {
      username: db.admin.username,
      name: db.admin.name,
      role: db.admin.role,
    }
  });
});

// Auth check / verify
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeTokens.get(token);

  if (!session || session.expiresAt < Date.now()) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      username: session.username,
      name: session.name,
      role: session.role,
    }
  });
});

// Auth logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeTokens.delete(token);
  }
  res.json({ success: true });
});

// Admin change password
app.post('/api/auth/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const db = getDb();
  const currentHash = hashPassword(currentPassword, db.admin.salt);
  if (currentHash !== db.admin.hash) {
    res.status(401).json({ error: 'Current password verification failed.' });
    return;
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  db.admin.salt = newSalt;
  db.admin.hash = newHash;
  saveDb(db);

  res.json({ success: true, message: 'Administrator credentials successfully updated.' });
});

// GET Blood stock availability
app.get('/api/inventory', (req, res) => {
  try {
    const db = getDb();
    res.json(db.inventory);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST Atomic Inventory Mutation: Intake (+), Dispatch (-), Count (=)
app.post('/api/inventory/mutate', authenticateAdmin, async (req, res) => {
  try {
    const { bloodGroup, operation, quantity, reason } = req.body;

    const validGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validGroups.includes(bloodGroup as BloodGroup)) {
      res.status(400).json({ error: 'Invalid blood group specified.' });
      return;
    }

    const validOps: InventoryOperation[] = ['+', '-', '='];
    if (!validOps.includes(operation as InventoryOperation)) {
      res.status(400).json({ error: 'Operation must be "+", "-", or "=".' });
      return;
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty < 0) {
      res.status(400).json({ error: 'Quantity must be a non-negative number.' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Mandatory audit reason is required for inventory mutations.' });
      return;
    }

    const actor = (req as any).user.name || (req as any).user.username;

    const result = await mutateInventoryAtomically({
      bloodGroup: bloodGroup as BloodGroup,
      operation: operation as InventoryOperation,
      quantity: numQty,
      reason: reason.trim(),
      actor,
    });

    const db = getDb();
    res.json({
      success: true,
      item: result.item,
      previousBalance: result.previousBalance,
      resultingBalance: result.resultingBalance,
      transaction: result.transaction,
      allInventory: db.inventory
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Inventory mutation failed.' });
  }
});

// Legacy backward compatibility route for adjust
app.post('/api/inventory/adjust', authenticateAdmin, async (req, res) => {
  try {
    const { bloodGroup, deltaUnits, type, reason } = req.body;
    const op: InventoryOperation = type === 'IN' ? '+' : type === 'OUT' ? '-' : '=';
    const actor = (req as any).user.name || (req as any).user.username;

    const result = await mutateInventoryAtomically({
      bloodGroup: bloodGroup as BloodGroup,
      operation: op,
      quantity: Number(deltaUnits),
      reason: reason || 'Administrative adjustment',
      actor
    });

    const db = getDb();
    res.json({
      success: true,
      item: result.item,
      transaction: result.transaction,
      allInventory: db.inventory
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET Donor list (Admin only)
app.get('/api/donors', authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    const { bloodGroup, search, status } = req.query;
    let list = [...db.donors];

    if (bloodGroup && bloodGroup !== 'all') {
      list = list.filter(d => d.bloodGroup === bloodGroup);
    }

    if (status && status !== 'all') {
      list = list.filter(d => d.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

// POST Register Donor (Public form with thorough validation & clinical eligibility logic)
app.post('/api/donors', async (req, res) => {
  try {
    const { 
      fullName, 
      bloodGroup, 
      age, 
      weight, 
      email, 
      phone, 
      city, 
      lastDonationDate, 
      preferredDonationDate,
      alternateDonationDate,
      donationSlot,
      alternateDonationSlot,
      donationCenter,
      donationCenterAddress,
      flexibleAvailability,
      notes 
    } = req.body;

    if (!fullName || !fullName.trim()) {
      res.status(400).json({ error: 'Full legal name is required.' });
      return;
    }

    const validGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validGroups.includes(bloodGroup)) {
      res.status(400).json({ error: 'Valid blood group is required.' });
      return;
    }

    const numAge = Number(age);
    if (!numAge || numAge < 18 || numAge > 65) {
      res.status(400).json({ error: 'Voluntary donors must be between 18 and 65 years of age.' });
      return;
    }

    const numWeight = Number(weight);
    if (!numWeight || numWeight < 50) {
      res.status(400).json({ error: 'Minimum body weight requirement is 50 kg (110 lbs).' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    const phoneClean = (phone || '').replace(/[^0-9+]/g, '');
    if (phoneClean.length < 8) {
      res.status(400).json({ error: 'A valid telephone number is required.' });
      return;
    }

    let eligibilityGuidance = 'Baseline pre-screening satisfied. On-site clinical evaluation required.';
    let initialStatus: 'Active' | 'Deferred' = 'Active';

    if (lastDonationDate) {
      const lastDate = new Date(lastDonationDate);
      if (!isNaN(lastDate.getTime())) {
        const today = new Date();
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const requiredInterval = 56;

        if (diffDays < requiredInterval) {
          const daysRemaining = requiredInterval - diffDays;
          initialStatus = 'Deferred';
          eligibilityGuidance = `Interval restriction: ${diffDays} days elapsed. 56-day whole-blood interval requires ${daysRemaining} more day(s) before clinical collection. Alternate date recommended.`;
        } else {
          eligibilityGuidance = `Interval satisfied: ${diffDays} days since prior donation. Final medical screening will occur on site.`;
        }
      }
    }

    await withTransactionLock(async () => {
      const db = getDb();
      const donorId = generateUniqueDonorId();

      const newDonor: Donor = {
        id: donorId,
        fullName: fullName.trim(),
        bloodGroup,
        age: numAge,
        weight: numWeight,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city ? city.trim() : 'Local Region',
        lastDonationDate: lastDonationDate || null,
        preferredDonationDate: preferredDonationDate || undefined,
        alternateDonationDate: alternateDonationDate || undefined,
        donationSlot: donationSlot || undefined,
        alternateDonationSlot: alternateDonationSlot || undefined,
        donationCenter: donationCenter || undefined,
        donationCenterAddress: donationCenterAddress || undefined,
        flexibleAvailability: Boolean(flexibleAvailability),
        registeredAt: new Date().toISOString(),
        status: initialStatus,
        totalDonations: 0,
        notes: notes ? notes.trim() : undefined,
        eligibilityNotes: eligibilityGuidance
      };

      db.donors.unshift(newDonor);
      saveDb(db);

      // Asynchronously dispatch appointment confirmation email
      sendDonorConfirmationEmail({
        toEmail: newDonor.email,
        donorName: newDonor.fullName,
        donorId: newDonor.id,
        bloodGroup: newDonor.bloodGroup,
        centerName: newDonor.donationCenter,
        centerAddress: newDonor.donationCenterAddress,
        preferredDate: newDonor.preferredDonationDate,
        alternateDate: newDonor.alternateDonationDate,
        donationSlot: newDonor.donationSlot,
      }).catch(err => console.error('Notification dispatch warning:', err.message));

      res.status(201).json({
        success: true,
        message: 'Registration recorded. Note: Final medical eligibility is determined on-site following vital sign checks and hemoglobin screening.',
        donor: newDonor
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Donor registration failed', details: err.message });
  }
});

// GET Requests list (Admin only)
app.get('/api/requests', authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    const { status, urgency, bloodGroup, search } = req.query;
    let list = [...db.requests];

    if (status && status !== 'all') {
      list = list.filter(r => r.status === status);
    }

    if (urgency && urgency !== 'all') {
      list = list.filter(r => r.urgency === urgency);
    }

    if (bloodGroup && bloodGroup !== 'all') {
      list = list.filter(r => r.bloodGroup === bloodGroup);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.hospitalName.toLowerCase().includes(q) ||
        (d.patientName && d.patientName.toLowerCase().includes(q)) ||
        d.contactPerson.toLowerCase().includes(q)
      );
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET Request by ID (Sanitized Public Tracking View with Rate Limiting)
app.get('/api/requests/:id', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ error: 'Too many tracking queries. Please wait a moment before trying again.' });
    return;
  }

  try {
    const { id } = req.params;
    const db = getDb();
    const request = db.requests.find(r => r.id.toLowerCase() === id.toLowerCase());

    if (!request) {
      res.status(404).json({ error: `Requisition reference "${id}" was not found.` });
      return;
    }

    // Return sanitized public tracking representation (excluding private staff emails, personal phone numbers, or private patient health data)
    const sanitizedHistory = (request.statusHistory || []).map(h => ({
      stage: h.stage,
      timestamp: h.timestamp,
      notes: h.notes,
    }));

    const publicView: PublicRequestTracking = {
      id: request.id,
      hospitalName: request.hospitalName,
      bloodGroup: request.bloodGroup,
      units: request.units,
      urgency: request.urgency,
      status: request.status,
      currentStage: request.currentStage || (request.status === 'Fulfilled' ? 'Dispatched' : request.status === 'Approved' ? 'Cross-Match' : 'Submitted'),
      statusHistory: sanitizedHistory,
      adminNotes: request.adminNotes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      fulfilledAt: request.fulfilledAt
    };

    res.json(publicView);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to track request' });
  }
});

// POST Create Blood Request (Public Hospital Requisition)
app.post('/api/requests', async (req, res) => {
  try {
    const { hospitalName, patientName, bloodGroup, units, urgency, reason, contactPerson, contactPhone, contactEmail } = req.body;

    if (!hospitalName || !hospitalName.trim()) {
      res.status(400).json({ error: 'Hospital or institution name is required.' });
      return;
    }

    const validGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validGroups.includes(bloodGroup)) {
      res.status(400).json({ error: 'Valid required blood group is required.' });
      return;
    }

    const numUnits = Number(units);
    if (!numUnits || numUnits < 1 || numUnits > 50) {
      res.status(400).json({ error: 'Requested units must be between 1 and 50 units.' });
      return;
    }

    const validUrgencies: UrgencyLevel[] = ['Normal', 'Urgent', 'Critical'];
    if (!validUrgencies.includes(urgency)) {
      res.status(400).json({ error: 'Urgency level must be Normal, Urgent, or Critical.' });
      return;
    }

    if (!contactPerson || !contactPerson.trim()) {
      res.status(400).json({ error: 'Authorized medical liaison contact is required.' });
      return;
    }

    if (!contactPhone || contactPhone.trim().length < 8) {
      res.status(400).json({ error: 'Valid emergency contact telephone is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail || !emailRegex.test(contactEmail.trim())) {
      res.status(400).json({ error: 'Valid contact email address is required.' });
      return;
    }

    await withTransactionLock(async () => {
      const db = getDb();
      const requestId = generateUniqueRequisitionId();
      const now = new Date().toISOString();

      const newRequest: BloodRequest = {
        id: requestId,
        hospitalName: hospitalName.trim(),
        patientName: patientName ? patientName.trim() : undefined,
        bloodGroup,
        units: numUnits,
        urgency,
        reason: reason ? reason.trim() : undefined,
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        status: 'Pending',
        currentStage: 'Submitted',
        statusHistory: [
          {
            stage: 'Submitted',
            status: 'Pending',
            timestamp: now,
            actor: 'Hospital Portal',
            notes: `Requisition submitted by ${contactPerson.trim()} (${hospitalName.trim()}).`
          }
        ],
        createdAt: now,
        updatedAt: now
      };

      db.requests.unshift(newRequest);
      saveDb(db);

      // Dispatch confirmation email to hospital liaison
      sendRequisitionStatusEmail({
        toEmail: newRequest.contactEmail,
        hospitalName: newRequest.hospitalName,
        reqId: newRequest.id,
        bloodGroup: newRequest.bloodGroup,
        units: newRequest.units,
        urgency: newRequest.urgency,
        stage: 'Submitted',
        notes: 'Requisition received and routed to clinical triage review.'
      }).catch(err => console.error('Hospital notification error:', err.message));

      res.status(201).json({
        success: true,
        message: 'Blood requisition recorded. Stock is verified and allocated during administrative triage.',
        request: newRequest
      });
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create blood request', details: err.message });
  }
});

// PATCH Advanced Requisition Workflow & Stage Progression (Admin only with Atomic Concurrency Locking)
app.patch('/api/requests/:id/stage', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;

    const validStages: RequestStage[] = ['Submitted', 'Triage Review', 'Cross-Match', 'Dispatched', 'Rejected'];
    if (!validStages.includes(stage)) {
      res.status(400).json({ error: `Invalid workflow stage "${stage}".` });
      return;
    }

    const actor = (req as any).user.name || (req as any).user.username;

    const result = await withTransactionLock(async () => {
      const db = getDb();
      const request = db.requests.find(r => r.id === id);
      if (!request) {
        throw new Error(`Requisition ${id} not found.`);
      }

      const prevStage = request.currentStage;
      let newStatus: RequestStatus = request.status;

      if (stage === 'Submitted') {
        newStatus = 'Pending';
      } else if (stage === 'Triage Review' || stage === 'Cross-Match') {
        newStatus = 'Approved';
      } else if (stage === 'Dispatched') {
        newStatus = 'Fulfilled';
      } else if (stage === 'Rejected') {
        newStatus = 'Rejected';
      }

      // If transitioning to Dispatched (Fulfilled): MUST Atomically Verify and Deduct Stock!
      if (stage === 'Dispatched' && prevStage !== 'Dispatched') {
        const stockItem = db.inventory.find(i => i.bloodGroup === request.bloodGroup);
        if (!stockItem) {
          throw new Error(`Blood phenotype ${request.bloodGroup} not found in inventory.`);
        }

        if (stockItem.unitsAvailable < request.units) {
          throw new Error(
            `Insufficient stock to dispatch: ${stockItem.unitsAvailable} unit(s) of ${request.bloodGroup} available, but ${request.units} unit(s) required. Fulfillment blocked.`
          );
        }

        // Deduct stock atomically
        const previousBalance = stockItem.unitsAvailable;
        stockItem.unitsAvailable -= request.units;
        const resultingBalance = stockItem.unitsAvailable;
        stockItem.lastUpdated = new Date().toISOString();

        const txId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
        db.transactions.unshift({
          id: txId,
          bloodGroup: request.bloodGroup,
          operation: '-',
          type: 'OUT',
          units: request.units,
          previousBalance,
          resultingBalance,
          reason: `Hospital Requisition Dispatch: ${request.hospitalName} (${request.id})`,
          referenceId: request.id,
          recordedBy: actor,
          timestamp: new Date().toISOString()
        });

        request.fulfilledAt = new Date().toISOString();
      }

      // Rollback deduction if moving away from Dispatched
      if (prevStage === 'Dispatched' && stage !== 'Dispatched') {
        const stockItem = db.inventory.find(i => i.bloodGroup === request.bloodGroup);
        if (stockItem) {
          const previousBalance = stockItem.unitsAvailable;
          stockItem.unitsAvailable += request.units;
          const resultingBalance = stockItem.unitsAvailable;
          stockItem.lastUpdated = new Date().toISOString();

          const txId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
          db.transactions.unshift({
            id: txId,
            bloodGroup: request.bloodGroup,
            operation: '+',
            type: 'IN',
            units: request.units,
            previousBalance,
            resultingBalance,
            reason: `Reversal of dispatch: ${request.id} returned to ${stage}`,
            referenceId: request.id,
            recordedBy: actor,
            timestamp: new Date().toISOString()
          });
        }
        request.fulfilledAt = undefined;
      }

      const now = new Date().toISOString();
      request.currentStage = stage;
      request.status = newStatus;
      request.updatedAt = now;
      if (notes) {
        request.adminNotes = notes;
      }

      if (!request.statusHistory) {
        request.statusHistory = [];
      }

      request.statusHistory.push({
        stage,
        status: newStatus,
        timestamp: now,
        actor,
        notes: notes || `Requisition progressed to ${stage} by ${actor}.`
      });

      saveDb(db);

      // Dispatch stage progression update email
      if (request.contactEmail) {
        sendRequisitionStatusEmail({
          toEmail: request.contactEmail,
          hospitalName: request.hospitalName,
          reqId: request.id,
          bloodGroup: request.bloodGroup,
          units: request.units,
          urgency: request.urgency,
          stage,
          notes: notes || `Requisition progressed to ${stage}.`
        }).catch(() => {});
      }

      return { request, inventory: db.inventory };
    });

    res.json({
      success: true,
      request: result.request,
      inventory: result.inventory
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Workflow transition failed.' });
  }
});

// Legacy backward-compatible status route
app.patch('/api/requests/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    let targetStage: RequestStage = 'Submitted';
    if (status === 'Approved') targetStage = 'Triage Review';
    else if (status === 'Fulfilled') targetStage = 'Dispatched';
    else if (status === 'Rejected') targetStage = 'Rejected';

    // Route through stage controller
    req.body.stage = targetStage;
    req.body.notes = adminNotes;

    const actor = (req as any).user.name || (req as any).user.username;

    const result = await withTransactionLock(async () => {
      const db = getDb();
      const request = db.requests.find(r => r.id === id);
      if (!request) throw new Error('Request not found');

      const prevStatus = request.status;
      if (status === 'Fulfilled' && prevStatus !== 'Fulfilled') {
        const stockItem = db.inventory.find(i => i.bloodGroup === request.bloodGroup);
        if (!stockItem || stockItem.unitsAvailable < request.units) {
          throw new Error(
            `Insufficient stock: ${stockItem?.unitsAvailable || 0} units available, but ${request.units} units required.`
          );
        }

        const prevBal = stockItem.unitsAvailable;
        stockItem.unitsAvailable -= request.units;
        const resBal = stockItem.unitsAvailable;
        stockItem.lastUpdated = new Date().toISOString();

        db.transactions.unshift({
          id: `TX-${Date.now().toString().slice(-6)}`,
          bloodGroup: request.bloodGroup,
          operation: '-',
          type: 'OUT',
          units: request.units,
          previousBalance: prevBal,
          resultingBalance: resBal,
          reason: `Hospital Request Fulfillment: ${request.hospitalName} (${request.id})`,
          referenceId: request.id,
          recordedBy: actor,
          timestamp: new Date().toISOString()
        });
        request.fulfilledAt = new Date().toISOString();
      }

      request.status = status;
      request.currentStage = targetStage;
      request.updatedAt = new Date().toISOString();
      if (adminNotes) request.adminNotes = adminNotes;

      if (!request.statusHistory) request.statusHistory = [];
      request.statusHistory.push({
        stage: targetStage,
        status,
        timestamp: new Date().toISOString(),
        actor,
        notes: adminNotes || `Status updated to ${status}`
      });

      saveDb(db);
      return { request, inventory: db.inventory };
    });

    res.json({ success: true, request: result.request, inventory: result.inventory });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET Transactions audit log (Admin only)
app.get('/api/transactions', authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    res.json(db.transactions.slice(0, 100));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ======================== SERVER START & DEV/PROD MIDDLEWARE ========================

async function startServer() {
  await initMongo().catch(err => {
    console.warn('MongoDB initialization notice:', err.message);
  });

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeFlow Blood Bank active at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to launch LifeFlow Blood Bank server:', err);
  process.exit(1);
});
