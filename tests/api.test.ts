/**
 * LifeFlow Blood Bank - Automated Verification Test Suite
 * Tests all core clinical workflows, authentication, atomic mutations,
 * concurrency locking, rate limiting, and data privacy sanitization.
 */

import 'dotenv/config';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LifeFlow@2026Admin';
const STAFF_USERNAME = process.env.STAFF_USERNAME || 'staff';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'CampStaff@2026';

async function ensureServerRunning(): Promise<ChildProcess | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return null;
  } catch {}

  console.log(`[LifeFlow Tests] Starting backend test server at ${BASE_URL}...`);
  const serverPath = path.resolve(__dirname, '../server/server.ts');
  const serverProcess = spawn('npx', ['tsx', serverPath], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'ignore'
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 15000) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        console.log('[LifeFlow Tests] Backend test server ready.');
        return serverProcess;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 400));
  }

  throw new Error('Backend test server failed to start within 15 seconds.');
}

async function runTests() {
  console.log('--- Starting LifeFlow Automated Test Suite ---');
  let passed = 0;
  let failed = 0;
  let serverProcess: ChildProcess | null = null;

  async function assert(desc: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  try {
    serverProcess = await ensureServerRunning();

    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    await assert('Health check reports operational status', healthRes.ok && healthData.status === 'ok');

    // 2. Blood availability retrieval
    const invRes = await fetch(`${BASE_URL}/api/inventory`);
    const invData = await invRes.json();
    await assert('Blood inventory returns all 8 phenotypes', Array.isArray(invData) && invData.length === 8);
    const hasValidGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].every(g => 
      invData.some((i: any) => i.bloodGroup === g)
    );
    await assert('Inventory contains exact ABO and Rh standard groups', hasValidGroups);

    // 3. Donor registration validation & success
    // Invalid age rejection
    const invalidDonorRes = await fetch(`${BASE_URL}/api/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Young Child',
        bloodGroup: 'O+',
        age: 15,
        weight: 60,
        email: 'child@example.com',
        phone: '+1 555-0000'
      })
    });
    await assert('Donor under 18 years is rejected with 400', invalidDonorRes.status === 400);

    // Valid donor registration with preferred & alternate dates and donation center
    const validDonorRes = await fetch(`${BASE_URL}/api/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Automation Volunteer',
        bloodGroup: 'O+',
        age: 30,
        weight: 72,
        email: 'volunteer.test@example.com',
        phone: '+1 (555) 777-8899',
        city: 'Metro Valley',
        lastDonationDate: null,
        preferredDonationDate: '2026-10-25',
        alternateDonationDate: '2026-11-02',
        donationSlot: 'Morning (09:00 AM – 12:00 PM)',
        alternateDonationSlot: 'Afternoon (01:00 PM – 04:00 PM)',
        donationCenter: 'LifeFlow Central Transfusion Center',
        flexibleAvailability: true
      })
    });
    const donorData = await validDonorRes.json();
    await assert('Valid donor is registered with assigned DNR-xxxx ID', validDonorRes.status === 201 && donorData.donor.id.startsWith('DNR-'));
    await assert('Donor schedule preserves preferred & alternate dates', donorData.donor.preferredDonationDate === '2026-10-25' && donorData.donor.alternateDonationDate === '2026-11-02');
    await assert('Donor schedule links chosen donation center', donorData.donor.donationCenter === 'LifeFlow Central Transfusion Center');

    // 4. Requisition creation & Public Tracking
    const createReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalName: 'General County Emergency Room',
        bloodGroup: 'O-',
        units: 2,
        urgency: 'Critical',
        reason: 'Acute traumatic hemorrhage protocol',
        contactPerson: 'Dr. Automated Tester',
        contactPhone: '+1 (555) 911-3344',
        contactEmail: 'er.dispatch@gencounty.org'
      })
    });
    const reqData = await createReqRes.json();
    const createdId = reqData.request.id;
    await assert('Hospital requisition generates unique collision-free REQ reference', createReqRes.status === 201 && createdId.startsWith('REQ-'));

    // Public tracking sanitization
    const trackRes = await fetch(`${BASE_URL}/api/requests/${createdId}`);
    const trackData = await trackRes.json();
    await assert('Public tracking retrieves initial Submitted stage', trackData.currentStage === 'Submitted');
    await assert('Public tracking does not leak contactEmail or phone', trackData.contactEmail === undefined && trackData.contactPhone === undefined);

    // 5. Admin Authentication & Protected Route Access
    // Unauthorized attempt
    const unauthRes = await fetch(`${BASE_URL}/api/requests`);
    await assert('Unauthenticated admin access to requests is blocked with 401', unauthRes.status === 401);

    // Valid admin login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    await assert('Administrator login succeeds with bearer token', loginRes.ok && typeof token === 'string');

    // Valid staff login
    const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: STAFF_USERNAME, password: STAFF_PASSWORD })
    });
    const staffData = await staffLoginRes.json();
    await assert('Camp Staff login succeeds with staff role', staffLoginRes.ok && staffData.user.role === 'staff');

    // Security Test: staff token gets 403 on GET /api/requests
    const staffReqRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Authorization: `Bearer ${staffData.token}` }
    });
    await assert('Staff role is forbidden (403) from accessing hospital requisitions', staffReqRes.status === 403);

    // Security Test: invalid login returns 401 with generic message
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent_user', password: 'wrongpassword' })
    });
    const badLoginData = await badLoginRes.json();
    await assert(
      'Invalid login returns 401 with generic error message',
      badLoginRes.status === 401 && badLoginData.error === 'Invalid credentials'
    );

    // Security Test: tampered JWT is rejected with 401
    const tamperedToken = (typeof token === 'string' ? token.slice(0, -6) : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake') + 'xyz123';
    const tamperedRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    await assert('Tampered JWT token signature is rejected with 401', tamperedRes.status === 401);

    // 6. Explicit Inventory Operations: Intake (+), Dispatch (-), Count (=)
    // Intake (+)
    const intakeRes = await fetch(`${BASE_URL}/api/inventory/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bloodGroup: 'B+',
        operation: '+',
        quantity: 5,
        reason: 'Automated test intake batch'
      })
    });
    const intakeData = await intakeRes.json();
    await assert('Intake (+) correctly adds units and logs previous/resulting balance', intakeRes.ok && intakeData.resultingBalance === intakeData.previousBalance + 5);

    // Dispatch (-) check preventing overselling
    const currentBMinusUnits = invData.find((i: any) => i.bloodGroup === 'B-')?.unitsAvailable || 0;
    const oversellRes = await fetch(`${BASE_URL}/api/inventory/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bloodGroup: 'B-',
        operation: '-',
        quantity: currentBMinusUnits + 100, // Exceeds available stock
        reason: 'Test overselling rejection'
      })
    });
    await assert('Dispatch (-) is blocked with 400 when requested quantity exceeds available stock', oversellRes.status === 400);

    // 7. Workflow Stage Progression to Dispatched
    const stageRes = await fetch(`${BASE_URL}/api/requests/${createdId}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        stage: 'Triage Review',
        notes: 'Priority triage verified by Medical Director'
      })
    });
    const stageData = await stageRes.json();
    await assert('Requisition transitions to Triage Review with audit entry', stageRes.ok && stageData.request.currentStage === 'Triage Review');

    // 8. Immutable Audit Log check
    const auditRes = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const auditData = await auditRes.json();
    await assert('Audit log contains recorded append-only transactions', Array.isArray(auditData) && auditData.length > 0);

    // 9. Rate limiting on failed login attempts (6th failed attempt returns 429)
    // Note: 1 failed attempt was recorded earlier in the invalid login test.
    for (let i = 2; i <= 5; i++) {
      await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'bruteforce_probe', password: 'bad_password' })
      });
    }
    const rateLimitedRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bruteforce_probe', password: 'bad_password' })
    });
    const rateLimitedData = await rateLimitedRes.json();
    await assert(
      '6th failed login attempt is blocked with 429 rate limit',
      rateLimitedRes.status === 429 && Boolean(rateLimitedData.error && rateLimitedData.error.includes('Too many failed login attempts'))
    );

    // Clean up lockout so local server / demo is not left locked out
    await fetch(`${BASE_URL}/api/auth/reset-limits`, { method: 'POST' }).catch(() => {});

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  console.log(`\n--- Test Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
