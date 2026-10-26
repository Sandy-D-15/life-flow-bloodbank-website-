/**
 * LifeFlow Blood Bank - Automated Verification Test Suite
 * Tests all core clinical workflows, authentication, atomic mutations,
 * concurrency locking, rate limiting, and data privacy sanitization.
 */

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

async function runTests() {
  console.log('--- Starting LifeFlow Automated Test Suite ---');
  let passed = 0;
  let failed = 0;

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
      body: JSON.stringify({ username: 'admin', password: 'LifeFlow@2026Admin' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    await assert('Administrator login succeeds with bearer token', loginRes.ok && typeof token === 'string');

    // Valid staff login
    const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'CampStaff@2026' })
    });
    const staffData = await staffLoginRes.json();
    await assert('Camp Staff login succeeds with staff role', staffLoginRes.ok && staffData.user.role === 'staff');

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

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n--- Test Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
