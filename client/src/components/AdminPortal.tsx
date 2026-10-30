import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Droplet, 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Equal,
  ArrowUpDown, 
  LogOut, 
  History, 
  Download, 
  Check, 
  Lock,
  Flame,
  Send,
  AlertCircle,
  KeyRound,
  ChevronRight,
  Home,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  BloodStockItem, 
  Donor, 
  BloodRequest, 
  StockTransaction, 
  DashboardStats, 
  AdminUser, 
  BloodGroup,
  RequestStatus,
  RequestStage,
  InventoryOperation
} from '../types/index.js';

interface AdminPortalProps {
  adminUser: AdminUser | null;
  authToken: string | null;
  onLogin: (token: string, user: AdminUser) => void;
  onLogout: () => void;
  inventory: BloodStockItem[];
  onRefreshInventory: () => void;
  onBackToPublic?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminUser,
  authToken,
  onLogin,
  onLogout,
  inventory,
  onRefreshInventory,
  onBackToPublic
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRolePreset, setSelectedRolePreset] = useState<'admin' | 'staff'>('admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tab inside Admin Portal
  const [adminTab, setAdminTab] = useState<'requests' | 'inventory' | 'donors' | 'audit' | 'security'>('requests');
  const isStaff = adminUser?.role === 'staff';

  useEffect(() => {
    if (adminUser?.role === 'staff' && (adminTab === 'requests' || adminTab === 'audit' || adminTab === 'security')) {
      setAdminTab('donors');
    }
  }, [adminUser, adminTab]);

  // Data states
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters & Search
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [requestUrgencyFilter, setRequestUrgencyFilter] = useState<string>('all');

  const [donorSearch, setDonorSearch] = useState('');
  const [donorGroupFilter, setDonorGroupFilter] = useState<string>('all');

  // Inventory mutation state: Explicit (+), (-), (=)
  const [mutateGroup, setMutateGroup] = useState<BloodGroup>('O+');
  const [mutateOp, setMutateOp] = useState<InventoryOperation>('+');
  const [mutateUnits, setMutateUnits] = useState<string>('5');
  const [mutateReason, setMutateReason] = useState<string>('Mobile blood drive certified intake');
  const [isMutating, setIsMutating] = useState(false);
  const [mutateAlert, setMutateAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal for Viewing Full Requisition Details & Stage Stepper
  const [activeRequestDetail, setActiveRequestDetail] = useState<BloodRequest | null>(null);
  const [stageNotes, setStageNotes] = useState('');
  const [isTransitioningStage, setIsTransitioningStage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stageSuccess, setStageSuccess] = useState<string | null>(null);

  // Security password change form
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [secAlert, setSecAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLogin(data.token, data.user);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetLockout = async () => {
    try {
      await fetch('/api/auth/reset-limits', { method: 'POST' });
      setLoginError(null);
    } catch {
      setLoginError(null);
    }
  };

  // Fetch Admin Data
  const fetchAdminData = async () => {
    if (!authToken) return;
    setIsLoadingData(true);
    setActionError(null);

    try {
      const [reqRes, dnrRes, txRes] = await Promise.all([
        fetch('/api/requests', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch('/api/donors', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch('/api/transactions', { headers: { Authorization: `Bearer ${authToken}` } })
      ]);

      if (reqRes.ok) setRequests(await reqRes.json());
      if (dnrRes.ok) setDonors(await dnrRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } catch (err) {
      console.error('Error loading admin records:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchAdminData();
    }
  }, [authToken]);

  // Stage Progression Handler
  const handleTransitionStage = async (requestId: string, newStage: RequestStage, notes?: string) => {
    if (!authToken) return;
    setIsTransitioningStage(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/requests/${requestId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          stage: newStage,
          notes: notes || stageNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Stage transition failed');
      }

      await fetchAdminData();
      onRefreshInventory();
      // Provide immediate in-place confirmation without a disruptive full-screen modal
      setStageSuccess(`Requisition ${requestId} successfully updated to "${newStage}". Status: ${data.request?.status || 'Updated'}. Vault inventory adjusted.`);
      setTimeout(() => setStageSuccess(null), 7000);
      setStageNotes('');
    } catch (err: any) {
      setActionError(err.message || 'Workflow transition blocked');
    } finally {
      setIsTransitioningStage(false);
    }
  };

  // Explicit Inventory Mutation: (+), (-), (=)
  const handleInventoryMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setIsMutating(true);
    setMutateAlert(null);

    try {
      const res = await fetch('/api/inventory/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bloodGroup: mutateGroup,
          operation: mutateOp,
          quantity: parseInt(mutateUnits, 10),
          reason: mutateReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Stock mutation rejected.');
      }

      setMutateAlert({
        type: 'success',
        msg: `Balance updated for ${mutateGroup}: ${data.previousBalance} → ${data.resultingBalance} units.`
      });
      onRefreshInventory();
      await fetchAdminData();
      setMutateUnits('5');
    } catch (err: any) {
      setMutateAlert({ type: 'error', msg: err.message || 'Mutation failed' });
    } finally {
      setIsMutating(false);
    }
  };

  // Password Rotation
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setSecAlert(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: currPassword,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      setSecAlert({ type: 'success', msg: 'Admin credentials rotated successfully.' });
      setCurrPassword('');
      setNewPassword('');
    } catch (err: any) {
      setSecAlert({ type: 'error', msg: err.message });
    }
  };

  // Export Donors CSV
  const handleExportDonors = () => {
    if (!donors.length) return;
    const headers = ['Donor ID', 'Name', 'Blood Group', 'Age', 'Weight', 'Email', 'Phone', 'City', 'Status', 'Last Donated', 'Donation Center', 'Preferred Date', 'Alternate Date'];
    const rows = donors.map(d => [
      d.id,
      `"${d.fullName}"`,
      d.bloodGroup,
      d.age,
      d.weight,
      d.email,
      `"${d.phone}"`,
      `"${d.city}"`,
      d.status,
      d.lastDonationDate || 'First Time',
      `"${d.donationCenter || 'Central Hub'}"`,
      `"${d.preferredDonationDate || 'Pending'}"`,
      `"${d.alternateDonationDate || 'None'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lifeflow_donors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredRequests = requests.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.hospitalName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.patientName && r.patientName.toLowerCase().includes(requestSearch.toLowerCase())) ||
      r.contactPerson.toLowerCase().includes(requestSearch.toLowerCase());
    const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;
    const matchesUrgency = requestUrgencyFilter === 'all' || r.urgency === requestUrgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const filteredDonors = donors.filter(d => {
    const matchesSearch =
      d.fullName.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.email.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.city.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.id.toLowerCase().includes(donorSearch.toLowerCase());
    const matchesGroup = donorGroupFilter === 'all' || d.bloodGroup === donorGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const criticalPending = requests.filter(r => r.urgency === 'Critical' && r.status === 'Pending');

  // If Not Logged In, Render Secure Login Form with Role Presets
  if (!adminUser || !authToken) {
    return (
      <section className="py-20 bg-slate-100 min-h-[600px] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-900">LifeFlow Operations Portal</h2>
          <p className="text-xs text-center text-slate-500 mt-1 mb-5">
            Role-Based Access for Camp Staff & Medical Directors
          </p>

          {/* Role Preset Selector */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => {
                setSelectedRolePreset('admin');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedRolePreset === 'admin'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Medical Director</span>
              </div>
              <div className={`text-[10px] ${selectedRolePreset === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>
                Full trauma triage & audit ledger
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRolePreset('staff');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedRolePreset === 'staff'
                  ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-rose-200" />
                <span>Camp Staff</span>
              </div>
              <div className={`text-[10px] ${selectedRolePreset === 'staff' ? 'text-rose-100' : 'text-slate-500'}`}>
                Donor check-in & camp intake (+)
              </div>
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
              {loginError.includes('Too many') && (
                <button
                  type="button"
                  onClick={handleResetLockout}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold shrink-0 cursor-pointer shadow-sm transition-colors"
                >
                  Clear Lock
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
            {/* Decoy fields to intercept aggressive browser password manager autofill */}
            <input type="text" name="fake_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="fake_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                name="portal_username"
                id="portal_username"
                autoComplete="off"
                data-lpignore="true"
                required
                value={username}
                placeholder="Enter username"
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="portal_password"
                  id="portal_password"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  required
                  value={password}
                  placeholder="Enter password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-3 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                selectedRolePreset === 'staff' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {selectedRolePreset === 'staff' ? (
                <Users className="w-4 h-4 text-white" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isLoggingIn ? 'Authenticating...' : `Sign In as ${selectedRolePreset === 'staff' ? 'Camp Staff' : 'Medical Director'}`}</span>
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-slate-100/70 border-b border-slate-200 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
              isStaff ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
            }`}>
              {isStaff ? (
                <Users className="w-6 h-6 text-white" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isStaff ? 'Camp Phlebotomy & Intake Station' : 'Medical Director Operations Command'}
                </h1>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  isStaff ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isStaff ? 'Camp Field Staff' : 'Director Authorized'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-semibold text-slate-800">{adminUser.name}</span> ({adminUser.role === 'staff' ? 'Camp Phlebotomist' : 'Superadmin'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onBackToPublic && (
              <button
                type="button"
                onClick={onBackToPublic}
                className="px-3.5 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Return to public blood bank homepage"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Public Website</span>
              </button>
            )}
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={isLoadingData}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Sync Records
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Error Notice */}
        {actionError && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs rounded-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-[#F0003C] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-[#111B31]">Action Blocked by Inventory Integrity Guard:</h4>
              <p className="mt-0.5">{actionError}</p>
            </div>
            <button 
              type="button"
              onClick={() => setActionError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stage Progression Success Notice */}
        {stageSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs rounded-xl flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-emerald-950">Workflow State Updated Successfully:</h4>
              <p className="mt-0.5 text-emerald-800 font-medium">{stageSuccess}</p>
            </div>
            <button 
              type="button"
              onClick={() => setStageSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Critical Emergency Banner (Clear, Non-blinking High Priority) */}
        {criticalPending.length > 0 && (
          <div className="mb-8 p-4 bg-[#F0003C] text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {criticalPending.length} Critical Emergency Trauma Requisition(s) Pending Action!
                </h3>
                <p className="text-xs text-rose-100">
                  Immediate triage required for: {criticalPending.map(c => `${c.hospitalName} (${c.bloodGroup} x${c.units})`).join('; ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAdminTab('requests');
                setRequestUrgencyFilter('Critical');
                setRequestStatusFilter('Pending');
              }}
              className="px-3.5 py-2 bg-white text-[#F0003C] hover:bg-rose-50 text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer transition-colors"
            >
              Review Trauma Cases
            </button>
          </div>
        )}

        {/* Operational Statistics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
            <div className="text-xs text-slate-500 font-medium">Requisitions Queue</div>
            <div className="text-2xl font-bold text-[#111B31] mt-1">{requests.length}</div>
            <div className="text-[11px] text-amber-600 mt-1 font-medium">
              {requests.filter(r => r.status === 'Pending').length} pending review
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
            <div className="text-xs text-slate-500 font-medium">Voluntary Donors</div>
            <div className="text-2xl font-bold text-[#111B31] mt-1">{donors.length}</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              {donors.filter(d => d.status === 'Active').length} active donors
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
            <div className="text-xs text-slate-500 font-medium">Total Storage Reserve</div>
            <div className="text-2xl font-bold text-[#111B31] mt-1">
              {inventory.reduce((a, b) => a + b.unitsAvailable, 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Confirmed units in thermal vault</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
            <div className="text-xs text-slate-500 font-medium">Completed Dispatches</div>
            <div className="text-2xl font-bold text-[#111B31] mt-1">
              {requests.filter(r => r.status === 'Fulfilled').length}
            </div>
            <div className="text-[11px] text-blue-600 mt-1 font-medium">Hospital shipments fulfilled</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto">
          {!isStaff && (
            <button
              onClick={() => setAdminTab('requests')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
                adminTab === 'requests'
                  ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Requisition Triage ({requests.length})
            </button>
          )}

          <button
            onClick={() => setAdminTab('donors')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
              adminTab === 'donors'
                ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {isStaff ? `Camp Donor Check-in (${donors.length})` : `Donor Registry (${donors.length})`}
          </button>

          <button
            onClick={() => setAdminTab('inventory')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
              adminTab === 'inventory'
                ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {isStaff ? 'Camp Collection Intake (+)' : 'Inventory Operations (+, -, =)'}
          </button>

          {!isStaff && (
            <>
              <button
                onClick={() => setAdminTab('audit')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
                  adminTab === 'audit'
                    ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Audit Log ({transactions.length})
              </button>
              <button
                onClick={() => setAdminTab('security')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
                  adminTab === 'security'
                    ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Security & Credentials
              </button>
            </>
          )}
        </div>

        {/* TAB 1: REQUISITIONS MANAGEMENT */}
        {adminTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {/* Header within Requisition Tab */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Hospital Emergency Requisitions Triage & Dispatch Queue</span>
                </h3>
                <p className="text-[11px] text-slate-500">Live order allocation with automated cold-chain inventory reconciliation</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                  {filteredRequests.length} Orders
                </span>
                {onBackToPublic && (
                  <button
                    type="button"
                    onClick={onBackToPublic}
                    className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>← Public Website</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search hospital, ID, contact..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Fulfilled">Fulfilled</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={requestUrgencyFilter}
                  onChange={(e) => setRequestUrgencyFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
                >
                  <option value="all">All Urgencies</option>
                  <option value="Critical">Critical</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Hospital & Contact</th>
                    <th className="py-3 px-3">Group / Units</th>
                    <th className="py-3 px-3">Urgency</th>
                    <th className="py-3 px-3">Stage & Status</th>
                    <th className="py-3 px-3 text-right">Workflow Progression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No requisitions matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => {
                      const stockAvailable = inventory.find(i => i.bloodGroup === r.bloodGroup)?.unitsAvailable || 0;
                      const hasEnough = stockAvailable >= r.units;
                      const currentStage = r.currentStage || 'Submitted';

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setActiveRequestDetail(r)}
                              className="font-mono font-bold text-slate-900 hover:text-rose-600 hover:underline cursor-pointer"
                            >
                              {r.id}
                            </button>
                            <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{r.hospitalName}</div>
                            <div className="text-[11px] text-slate-500">
                              {r.contactPerson} · {r.contactPhone}
                            </div>
                            {r.reason && (
                              <div className="text-[11px] text-slate-400 italic truncate max-w-xs">
                                Indication: {r.reason}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-rose-600 text-sm">{r.bloodGroup}</span>
                            <span className="text-slate-800 ml-1">({r.units} units)</span>
                            <div className="text-[10px] text-slate-400">
                              Vault stock: <span className={hasEnough ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{stockAvailable}u</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              r.urgency === 'Critical'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : r.urgency === 'Urgent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.urgency}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{currentStage}</div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              r.status === 'Fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                              r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {currentStage === 'Submitted' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTransitionStage(r.id, 'Triage Review', 'Triage review completed and approved.');
                                  }}
                                  disabled={isTransitioningStage}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold border border-blue-200 cursor-pointer"
                                >
                                  Triage Review →
                                </button>
                              )}

                              {currentStage === 'Triage Review' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTransitionStage(r.id, 'Cross-Match', 'Cross-match laboratory processing initiated.');
                                  }}
                                  disabled={isTransitioningStage}
                                  className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-semibold border border-purple-200 cursor-pointer"
                                >
                                  Cross-Match →
                                </button>
                              )}

                              {currentStage !== 'Dispatched' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!hasEnough) {
                                      setActionError(
                                        `Dispatch blocked: Vault has only ${stockAvailable} unit(s) of ${r.bloodGroup}, but ${r.units} units are required for ${r.id}. Collect or intake stock before dispatch.`
                                      );
                                      return;
                                    }
                                    handleTransitionStage(r.id, 'Dispatched', 'Confirmed courier dispatch; stock verified and deducted.');
                                  }}
                                  disabled={isTransitioningStage}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                                    hasEnough
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                  title={hasEnough ? 'Confirm courier dispatch & deduct stock' : 'Insufficient stock'}
                                >
                                  Dispatch ({r.units}u)
                                </button>
                              )}

                              {currentStage !== 'Rejected' && currentStage !== 'Dispatched' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTransitionStage(r.id, 'Rejected', 'Requisition declined during triage.');
                                  }}
                                  disabled={isTransitioningStage}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold border border-rose-200 cursor-pointer"
                                >
                                  Reject
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRequestDetail(r);
                                }}
                                className="px-1.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY OPERATIONS (+, -, =) */}
        {adminTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Vault Monitor */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Blood Vault Real-Time Quantities</h3>
                  <p className="text-xs text-slate-500">Live counts tracked with atomic concurrency protection</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                  Total: {inventory.reduce((a, b) => a + b.unitsAvailable, 0)} Units
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {inventory.map(item => (
                  <div key={item.bloodGroup} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xl font-black text-rose-700">{item.bloodGroup}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        item.unitsAvailable < item.minThreshold ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.unitsAvailable < item.minThreshold ? 'Critical' : 'Sufficient'}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {item.unitsAvailable} <span className="text-xs font-normal text-slate-500">units</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Threshold: {item.minThreshold}u</span>
                      <span>Reserved: {item.reservedUnits}u</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atomic Operation Form: (+), (-), (=) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Authorized Inventory Mutation</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Execute Intake (+), Dispatch (-), or Physical Count (=) with mandatory audit justification.
              </p>

              {mutateAlert && (
                <div className={`p-3 rounded-lg text-xs mb-4 ${
                  mutateAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {mutateAlert.msg}
                </div>
              )}

              <form onSubmit={handleInventoryMutation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Phenotype</label>
                  <select
                    value={mutateGroup}
                    onChange={(e) => setMutateGroup(e.target.value as BloodGroup)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-rose-700"
                  >
                    {inventory.map(i => (
                      <option key={i.bloodGroup} value={i.bloodGroup}>
                        {i.bloodGroup} (Current: {i.unitsAvailable} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Explicit Operation</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMutateOp('+')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                        mutateOp === '+'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Intake (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMutateOp('-')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                        mutateOp === '-'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" /> Dispatch (−)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMutateOp('=')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                        mutateOp === '='
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Equal className="w-3.5 h-3.5" /> Count (=)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {mutateOp === '=' ? 'Reconciled Physical Balance' : 'Units Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    required
                    value={mutateUnits}
                    onChange={(e) => setMutateUnits(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Justification Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile Drive Intake, QC Disposal, Physical audit..."
                    value={mutateReason}
                    onChange={(e) => setMutateReason(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isMutating}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isMutating ? 'Recording to Ledger...' : 'Commit Mutation to Ledger'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* TAB 3: DONOR REGISTRY */}
        {adminTab === 'donors' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search donor name, city, ID..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={donorGroupFilter}
                  onChange={(e) => setDonorGroupFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium"
                >
                  <option value="all">All Phenotypes</option>
                  {inventory.map(i => (
                    <option key={i.bloodGroup} value={i.bloodGroup}>
                      {i.bloodGroup}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleExportDonors}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Donor ID</th>
                    <th className="py-3 px-3">Full Legal Name</th>
                    <th className="py-3 px-3">Group</th>
                    <th className="py-3 px-3">Age / Weight</th>
                    <th className="py-3 px-3">Appointment & Center</th>
                    <th className="py-3 px-3">Contact Information</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Clinical Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No donors matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDonors.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{d.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{d.fullName}</div>
                          <div className="text-[11px] text-slate-400">{d.city}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-600 text-sm">{d.bloodGroup}</td>
                        <td className="py-3 px-3 text-slate-600">{d.age} yrs · {d.weight} kg</td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-medium text-slate-900">{d.donationCenter || 'Central Transfusion Hub'}</div>
                          <div className="text-[11px] text-slate-500">
                            {d.preferredDonationDate ? `📅 ${d.preferredDonationDate}` : 'Date pending'}
                          </div>
                          {d.alternateDonationDate && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                              Alt: {d.alternateDonationDate}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{d.email}</div>
                          <div className="text-[11px] text-slate-400">{d.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            d.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs">
                          {d.eligibilityNotes || 'Baseline demographics cleared.'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOG (IMMUTABLE RECORD) */}
        {adminTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Append-Only Stock Audit Ledger</h3>
                <p className="text-xs text-slate-500">Every intake, dispatch, and physical reconciliation with before/after balances</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded font-semibold">
                Audit Trail Protected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Audit Tx ID</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Phenotype</th>
                    <th className="py-3 px-3">Op</th>
                    <th className="py-3 px-3">Previous</th>
                    <th className="py-3 px-3">Resulting</th>
                    <th className="py-3 px-3">Reason / Reference</th>
                    <th className="py-3 px-3">Authorized Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{tx.id}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-rose-600">{tx.bloodGroup}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          tx.operation === '+' ? 'bg-emerald-100 text-emerald-800' :
                          tx.operation === '-' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {tx.operation || (tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : '=')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{tx.previousBalance ?? '—'} units</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{tx.resultingBalance ?? '—'} units</td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{tx.reason}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{tx.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & CREDENTIALS */}
        {adminTab === 'security' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-bold text-slate-900">Administrator Security & Password Rotation</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Rotate administrative credentials safely using PBKDF2 with SHA-512 cryptographic salting.
            </p>

            {secAlert && (
              <div className={`p-3 rounded-lg text-xs mb-4 ${
                secAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {secAlert.msg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Master Password</label>
                <input
                  type="password"
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Minimum 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Rotate Master Password
              </button>
            </form>
          </div>
        )}

        {/* Requisition Detail & Stage Stepper Modal */}
        {activeRequestDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-rose-600">{activeRequestDetail.id}</span>
                  <h3 className="text-lg font-bold text-slate-900">{activeRequestDetail.hospitalName}</h3>
                </div>
                <button
                  onClick={() => setActiveRequestDetail(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* 4-Stage Stepper View */}
              <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-3">Requisition Chain of Custody Stages:</div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {(['Submitted', 'Triage Review', 'Cross-Match', 'Dispatched'] as RequestStage[]).map((stg, i) => {
                    const isReached = 
                      stg === activeRequestDetail.currentStage ||
                      (activeRequestDetail.statusHistory && activeRequestDetail.statusHistory.some(h => h.stage === stg));
                    const isCurrent = activeRequestDetail.currentStage === stg;

                    return (
                      <div key={stg} className="space-y-1">
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                          isCurrent
                            ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                            : isReached
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {i + 1}
                        </div>
                        <div className={`text-[11px] font-medium ${isCurrent ? 'font-bold text-rose-700' : 'text-slate-600'}`}>
                          {stg}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History Log */}
              <div className="space-y-2 mb-6">
                <div className="text-xs font-semibold text-slate-700">Audit Progression Log:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                  {activeRequestDetail.statusHistory && activeRequestDetail.statusHistory.map((h, idx) => (
                    <div key={idx} className="text-xs p-2 bg-white rounded border border-slate-100 shadow-2xs">
                      <div className="flex justify-between items-center text-slate-500 text-[10px]">
                        <span className="font-semibold text-slate-800">{h.stage}</span>
                        <span>{new Date(h.timestamp).toLocaleString()} by {h.actor}</span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{h.notes}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveRequestDetail(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
