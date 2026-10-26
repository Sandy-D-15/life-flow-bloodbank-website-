import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  Phone, 
  Mail, 
  FileText, 
  ArrowRight, 
  Flame, 
  Search, 
  Lock,
  Loader2
} from 'lucide-react';
import { BloodGroup, UrgencyLevel, BloodRequest, BloodStockItem } from '../types/index.js';

interface BloodRequestFormProps {
  initialBloodGroup?: BloodGroup;
  inventory: BloodStockItem[];
  onSuccess: (request: BloodRequest) => void;
  onTrackRequest: (id: string) => void;
}

export const BloodRequestForm: React.FC<BloodRequestFormProps> = ({
  initialBloodGroup,
  inventory,
  onSuccess,
  onTrackRequest
}) => {
  const [hospitalName, setHospitalName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(initialBloodGroup || 'O+');
  const [units, setUnits] = useState<string>('2');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Urgent');
  const [reason, setReason] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<BloodRequest | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Current inventory item check for user context
  const currentStock = inventory.find(i => i.bloodGroup === bloodGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hospitalName.trim()) {
      setErrorMessage('Hospital or clinical institution name is required.');
      return;
    }

    const unitsNum = parseInt(units, 10);
    if (isNaN(unitsNum) || unitsNum < 1 || unitsNum > 50) {
      setErrorMessage('Requested units must be between 1 and 50 units.');
      return;
    }

    if (!contactPerson.trim()) {
      setErrorMessage('Authorized medical officer or liaison contact name is required.');
      return;
    }

    if (!contactPhone || contactPhone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMessage('Valid 24/7 emergency telephone number is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail || !emailRegex.test(contactEmail.trim())) {
      setErrorMessage('Valid official contact email address is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: hospitalName.trim(),
          patientName: patientName ? patientName.trim() : undefined,
          bloodGroup,
          units: unitsNum,
          urgency,
          reason: reason ? reason.trim() : undefined,
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit blood requisition');
      }

      setSubmittedRequest(data.request);
      onSuccess(data.request);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with dispatch server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRequest(null);
    setHospitalName('');
    setPatientName('');
    setUnits('2');
    setReason('');
    setContactPerson('');
    setContactPhone('');
    setContactEmail('');
  };

  return (
    <section data-animate="reveal" id="request" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-200 mb-2">
            <Droplet className="w-3.5 h-3.5 fill-[#F0003C] text-[#F0003C]" />
            Hospital & Emergency Requisition
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111B31] tracking-tight">
            Hospital Blood Request Order
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">
            Emergency trauma rooms, surgical centers, and regional clinics can submit verified blood supply requisitions for cold-chain courier dispatch.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submittedRequest ? (
            /* Confirmation Screen */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-sm text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-[#F0003C] rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold text-[#111B31]">Requisition Successfully Logged</h3>
              <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                Your blood request has been queued in the LifeFlow dispatch system under priority review.
              </p>

              <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 max-w-lg mx-auto text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Tracking Reference Number</span>
                  <span className="font-mono text-base font-bold text-[#F0003C]">{submittedRequest.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Hospital / Institution</span>
                  <span className="font-semibold text-slate-900">{submittedRequest.hospitalName}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Requested Group & Units</span>
                  <span className="font-semibold text-slate-900">
                    {submittedRequest.units} unit(s) of <span className="text-[#F0003C] font-bold">{submittedRequest.bloodGroup}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Urgency Classification</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    submittedRequest.urgency === 'Critical' 
                      ? 'bg-rose-100 text-rose-800' 
                      : submittedRequest.urgency === 'Urgent' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {submittedRequest.urgency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-500 font-medium">Live Order Status</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {submittedRequest.status}
                  </span>
                </div>
              </div>

              {/* Verification Guarantee Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-lg mx-auto text-left text-xs text-amber-900 mb-6 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Dispatch & Chain of Custody Protocol:
                </div>
                <p>
                  In strict adherence to clinical standards, blood units are never declared fulfilled until verified stock is physically cross-matched and assigned to a temperature-regulated courier (+2°C to +6°C).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTrackRequest(submittedRequest.id)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#F0003C] hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Track Live Requisition Status
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Submit Another Request
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Form Content */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10"
            >
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 text-[#F0003C] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Requisition Error: </span>
                      {errorMessage}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Institution Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Hospital / Institution Name <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metro University Hospital ICU"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Patient / Case Reference ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Case #TR-409 / Ward 3B"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                    />
                  </div>
                </div>

                {/* Blood Group, Units, Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Required Blood Group <span className="text-[#F0003C]">*</span>
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                      className="w-full py-2.5 px-3.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl font-bold text-[#F0003C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all cursor-pointer"
                    >
                      {bloodGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {currentStock && (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Currently {currentStock.unitsAvailable} unit(s) in bank.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Required Units (450ml) <span className="text-[#F0003C]">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Urgency Level <span className="text-[#F0003C]">*</span>
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                      className={`w-full py-2.5 px-3.5 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] cursor-pointer ${
                        urgency === 'Critical'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : urgency === 'Urgent'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-slate-50 text-slate-800'
                      }`}
                    >
                      <option value="Normal">Normal (Scheduled Procedure)</option>
                      <option value="Urgent">Urgent (Within 12-24 Hours)</option>
                      <option value="Critical">Critical (Immediate Trauma / Hemorrhage)</option>
                    </select>
                  </div>
                </div>

                {/* Urgency Alert Box */}
                {urgency === 'Critical' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                    <Flame className="w-4 h-4 text-[#F0003C] shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold">Critical Priority Flagged: </span>
                      Requisition will trigger immediate telemetry on the administrative command board. If patient requires immediate uncrossed emergency transfusion, also call dispatch line at +1 (800) 555-FLOW.
                    </div>
                  </div>
                )}

                {/* Medical Indication / Diagnosis */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Clinical Diagnosis / Requisition Reason
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      placeholder="e.g. Acute gastrointestinal hemorrhage, massive transfusion protocol activated, post-partum hemorrhage..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                    />
                  </div>
                </div>

                {/* Authorized Medical Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Authorized Medical Contact <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. H. Vance"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Emergency Phone <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 911-0000"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Institution Email <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="dispatch@hospital.org"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Requisitions are cryptographically signed and tracked for hospital audit accountability.</span>
                </div>

                {/* Submit CTA */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={isSubmitting ? {} : { scale: 1.01, y: -1 }}
                  whileTap={isSubmitting ? {} : { scale: 0.98 }}
                  className="w-full py-3.5 px-6 bg-[#111B31] hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      <span>Transmitting Requisition to Cold-Chain Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Droplet className="w-4 h-4 text-[#F0003C]" />
                      <span>Submit Blood Requisition Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
