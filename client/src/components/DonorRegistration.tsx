import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Scale, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Lock,
  Loader2,
  Clock,
  Sparkles,
  Navigation,
  CalendarCheck,
  CalendarPlus,
  Compass,
  QrCode,
  Printer,
  Calendar as CalendarIcon,
  Check
} from 'lucide-react';
import { BloodGroup, Donor } from '../types/index.js';
import { DonationCenterMap, DONATION_CENTERS, DonationCenter } from './DonationCenterMap.js';

interface DonorRegistrationProps {
  initialBloodGroup?: BloodGroup;
  onSuccess: (donor: Donor) => void;
}

export const DonorRegistration: React.FC<DonorRegistrationProps> = ({
  initialBloodGroup,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(initialBloodGroup || 'O+');
  const [age, setAge] = useState<string>('28');
  const [weight, setWeight] = useState<string>('68');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Donation Scheduling & Alternate Date options
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultPreferredDate = tomorrow.toISOString().split('T')[0];

  const [preferredDonationDate, setPreferredDonationDate] = useState<string>(defaultPreferredDate);
  const [donationSlot, setDonationSlot] = useState<string>('Morning (09:00 AM – 12:00 PM)');
  
  // Alternate Date options (if donor is not available on preferred date)
  const [enableAlternateDate, setEnableAlternateDate] = useState<boolean>(false);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const [alternateDonationDate, setAlternateDonationDate] = useState<string>(nextWeek.toISOString().split('T')[0]);
  const [alternateDonationSlot, setAlternateDonationSlot] = useState<string>('Afternoon (01:00 PM – 04:00 PM)');
  const [flexibleAvailability, setFlexibleAvailability] = useState<boolean>(true);

  // Selected Donation Center & Location Map
  const [selectedCenter, setSelectedCenter] = useState<DonationCenter>(DONATION_CENTERS[0]);

  // Checklist items
  const [healthAck, setHealthAck] = useState(false);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredDonor, setRegisteredDonor] = useState<Donor | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const timeSlots = [
    'Morning (09:00 AM – 12:00 PM)',
    'Afternoon (01:00 PM – 04:00 PM)',
    'Evening (05:00 PM – 08:00 PM)'
  ];

  // Calculate dynamic donation interval guidance & earliest eligible date
  const calculateInterval = () => {
    if (isFirstTime || !lastDonationDate) return null;
    const lastDate = new Date(lastDonationDate);
    if (isNaN(lastDate.getTime())) return null;
    const today = new Date();
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const required = 56;

    const earliestDate = new Date(lastDate.getTime() + required * 24 * 60 * 60 * 1000);
    const earliestDateStr = earliestDate.toISOString().split('T')[0];

    if (diffDays < 0) {
      return { eligible: false, message: 'Date cannot be in the future.', earliestDateStr };
    }
    if (diffDays < required) {
      const daysRemaining = required - diffDays;
      return {
        eligible: false,
        daysPassed: diffDays,
        daysRemaining,
        earliestDateStr,
        message: `${diffDays} days since last donation. WHO & Red Cross safety standards require a 56-day recovery interval. Eligible on or after ${earliestDateStr} (${daysRemaining} day(s) remaining).`
      };
    }
    return {
      eligible: true,
      daysPassed: diffDays,
      earliestDateStr,
      message: `${diffDays} days have elapsed since your last donation. Safe interval requirement met.`
    };
  };

  const intervalResult = calculateInterval();

  const handleApplyEarliestEligibleDate = (target: 'preferred' | 'alternate') => {
    if (!intervalResult?.earliestDateStr) return;
    if (target === 'preferred') {
      setPreferredDonationDate(intervalResult.earliestDateStr);
    } else {
      setEnableAlternateDate(true);
      setAlternateDonationDate(intervalResult.earliestDateStr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!fullName.trim()) {
      setErrorMessage('Full legal name is required.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
      setErrorMessage('Voluntary donors must be between 18 and 65 years of age.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 50) {
      setErrorMessage('Donors must weigh at least 50 kg (110 lbs) for cardiovascular safety.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!phone || phone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMessage('Please enter a valid telephone contact number.');
      return;
    }

    if (!isFirstTime && !lastDonationDate) {
      setErrorMessage('Please provide your last donation date or check "First-Time Donor".');
      return;
    }

    if (!healthAck) {
      setErrorMessage('Please confirm the basic health pre-screening acknowledgment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          bloodGroup,
          age: ageNum,
          weight: weightNum,
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim() || selectedCenter.city,
          lastDonationDate: isFirstTime ? null : lastDonationDate,
          preferredDonationDate,
          alternateDonationDate: enableAlternateDate ? alternateDonationDate : undefined,
          donationSlot,
          alternateDonationSlot: enableAlternateDate ? alternateDonationSlot : undefined,
          donationCenter: selectedCenter.name,
          donationCenterAddress: `${selectedCenter.address}, ${selectedCenter.city}`,
          flexibleAvailability,
          notes: notes.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRegisteredDonor(data.donor);
      onSuccess(data.donor);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRegisteredDonor(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setCity('');
    setLastDonationDate('');
    setIsFirstTime(false);
    setNotes('');
    setHealthAck(false);
    setEnableAlternateDate(false);
  };

  return (
    <section data-animate="reveal" id="donor" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title & Guidance Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#F0003C] text-xs font-semibold border border-rose-100 mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#F0003C]" />
            Voluntary Donor Network
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111B31] tracking-tight">
            Register as a LifeFlow Blood Donor
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">
            One blood donation can save up to three lives. Select your preferred donation center on Google Maps and choose your primary & alternate dates.
          </p>
        </div>

        {/* AnimatePresence for Form vs Confirmation State */}
        <AnimatePresence mode="wait">
          {registeredDonor ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-xs"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-950">Registration Confirmed!</h3>
              <p className="text-emerald-800 text-sm mt-1 max-w-lg mx-auto">
                Thank you, <span className="font-semibold">{registeredDonor.fullName}</span>. Your donor profile and appointment request have been registered.
              </p>

              <div className="my-6 p-5 bg-white rounded-xl border border-emerald-200 max-w-lg mx-auto text-left shadow-xs space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span>Assigned Donor ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{registeredDonor.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 py-1.5 border-b border-slate-100">
                  <span>Blood Phenotype</span>
                  <span className="font-bold text-[#F0003C] text-sm">{registeredDonor.bloodGroup}</span>
                </div>
                
                {/* Donation Center & Google Map Location */}
                <div className="py-1.5 border-b border-slate-100 text-xs text-slate-600">
                  <span className="text-slate-400 block mb-0.5">Donation Center:</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F0003C] shrink-0" />
                    <span>{registeredDonor.donationCenter || selectedCenter.name}</span>
                  </div>
                  {registeredDonor.donationCenterAddress && (
                    <div className="text-[11px] text-slate-500 pl-5 mt-0.5">
                      {registeredDonor.donationCenterAddress}
                    </div>
                  )}
                </div>

                {/* Preferred Date & Slot */}
                <div className="py-1.5 border-b border-slate-100 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Preferred Date & Slot:</span>
                  <span className="font-semibold text-slate-800">
                    {registeredDonor.preferredDonationDate || preferredDonationDate} ({registeredDonor.donationSlot || donationSlot})
                  </span>
                </div>

                {/* Alternate Date if configured */}
                {registeredDonor.alternateDonationDate && (
                  <div className="py-1.5 border-b border-slate-100 text-xs flex justify-between items-center bg-blue-50/50 -mx-2 px-2 rounded">
                    <span className="text-blue-700 font-medium">Backup / Alternate Date:</span>
                    <span className="font-semibold text-blue-900">
                      {registeredDonor.alternateDonationDate} ({registeredDonor.alternateDonationSlot})
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                  <span>Registry Status</span>
                  <span className={`font-semibold ${registeredDonor.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {registeredDonor.status}
                  </span>
                </div>
              </div>

              {/* Digital Donor Pass / Fast Check-In Card */}
              <div className="my-6 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-[#111B31] text-white rounded-2xl max-w-lg mx-auto text-left shadow-lg border border-slate-700/80 relative overflow-hidden">
                {/* Background watermarks */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#F0003C]/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F0003C] text-white tracking-wide uppercase shadow-xs">
                    Verified Donor Pass
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  {/* QR Code graphic */}
                  <div className="p-2.5 bg-white rounded-xl text-slate-900 shrink-0 shadow-xs flex flex-col items-center">
                    <QrCode className="w-16 h-16 text-slate-900" />
                    <span className="text-[9px] font-mono font-bold mt-1 text-slate-500">SCAN AT DESK</span>
                  </div>

                  <div className="flex-1">
                    <div className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider">
                      LifeFlow Health Network
                    </div>
                    <div className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                      {registeredDonor.fullName}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">DONOR ID</span>
                        <span className="font-mono font-bold text-white">{registeredDonor.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">PHENOTYPE</span>
                        <span className="font-bold text-[#F0003C] text-sm">{registeredDonor.bloodGroup}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-300">
                      <span>Center: <strong>{registeredDonor.donationCenter || selectedCenter.name}</strong></span>
                      <div className="text-slate-400 truncate text-[10px]">{registeredDonor.donationCenterAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Appointment Schedule Ribbon */}
                <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Appointment: <strong>{registeredDonor.preferredDonationDate || preferredDonationDate}</strong> ({registeredDonor.donationSlot || donationSlot})</span>
                  </div>
                  {registeredDonor.alternateDonationDate && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                      Alt: {registeredDonor.alternateDonationDate}
                    </span>
                  )}
                </div>

                {/* Email Confirmation Status Notice */}
                <div className="mt-3 text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>A copy of this digital pass has been sent to <strong>{registeredDonor.email}</strong></span>
                </div>
              </div>

              {/* Action Buttons: Print Pass, Add to Google Calendar, Register Another */}
              <div className="flex flex-wrap items-center justify-center gap-3 my-6">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print / Save Pass</span>
                </button>

                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('LifeFlow Blood Donation Appointment')}&dates=${(registeredDonor.preferredDonationDate || preferredDonationDate).replace(/-/g, '')}T040000Z/${(registeredDonor.preferredDonationDate || preferredDonationDate).replace(/-/g, '')}T060000Z&details=${encodeURIComponent(`Donation appointment for ${registeredDonor.fullName} (${registeredDonor.bloodGroup}). Donor ID: ${registeredDonor.id}. Center: ${registeredDonor.donationCenter || selectedCenter.name}`)}&location=${encodeURIComponent(registeredDonor.donationCenterAddress || 'LifeFlow Blood Bank')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Add to Google Calendar</span>
                </a>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-5 py-2 bg-[#111B31] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Register Another Donor
                </motion.button>
              </div>

              {/* Crucial Clinical Protocol Notice */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-lg mx-auto text-left text-xs text-slate-600 space-y-2 mb-6">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  Medical Screening & Next Steps:
                </div>
                <p>
                  Your information has been logged in the system. <strong>Final medical eligibility is determined on-site</strong> by medical personnel through:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Non-invasive Hemoglobin measurement (minimum 12.5 g/dL)</li>
                  <li>Blood pressure and pulse vitals check</li>
                  <li>Confidential donor health questionnaire</li>
                </ul>
                <div className="text-slate-500 pt-1">
                  Present your digital QR pass at reception for expedited check-in.
                </div>
              </div>
            </motion.div>
          ) : (
            /* Registration Form */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10"
            >
              {/* Error Message with AnimatePresence */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 overflow-hidden"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#F0003C] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Validation Notice: </span>
                      {errorMessage}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Row 1: Name and Blood Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Legal Name <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Jordan Adams"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Blood Group <span className="text-[#F0003C]">*</span>
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
                  </div>
                </div>

                {/* Row 2: Age and Weight with Medical Constraints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Age (Years) <span className="text-[#F0003C]">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">Allowed: 18 - 65 yrs</span>
                    </div>
                    <input
                      type="number"
                      min="18"
                      max="65"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                    />
                    {parseInt(age, 10) < 18 || parseInt(age, 10) > 65 ? (
                      <span className="text-[11px] text-[#F0003C] mt-1 block">
                        Age must be strictly between 18 and 65 years.
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Weight (kg) <span className="text-[#F0003C]">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">Minimum: 50 kg (110 lbs)</span>
                    </div>
                    <div className="relative">
                      <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="50"
                        step="0.5"
                        required
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                    {parseFloat(weight) < 50 ? (
                      <span className="text-[11px] text-[#F0003C] mt-1 block">
                        Minimum body weight requirement is 50 kg.
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Row 3: Contact Details (Email & Phone) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="donor@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number <span className="text-[#F0003C]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 012-3456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: City and Last Donation Date with Earliest Calculation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      City / Neighborhood
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Metro Area"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Last Blood Donation Date
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-rose-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={isFirstTime}
                          onChange={(e) => {
                            setIsFirstTime(e.target.checked);
                            if (e.target.checked) setLastDonationDate('');
                          }}
                          className="rounded border-slate-300 text-[#F0003C] focus:ring-rose-500"
                        />
                        <span>First-Time Donor</span>
                      </label>
                    </div>

                    {!isFirstTime && (
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={lastDonationDate}
                          onChange={(e) => setLastDonationDate(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                        />
                      </div>
                    )}

                    {/* Dynamic interval calculation notification & Earliest Date Quick-Select */}
                    {intervalResult && (
                      <div className={`mt-2 p-2.5 rounded-xl text-xs space-y-1.5 ${
                        intervalResult.eligible
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                          <span>{intervalResult.message}</span>
                        </div>
                        
                        {!intervalResult.eligible && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleApplyEarliestEligibleDate('alternate')}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              <span>Set Alternate Date to {intervalResult.earliestDateStr}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= SECTION: GOOGLE MAP & DONATION CENTER ================= */}
                <div className="pt-2">
                  <DonationCenterMap
                    selectedCenterId={selectedCenter.id}
                    onSelectCenter={(c) => {
                      setSelectedCenter(c);
                      if (!city) setCity(c.city);
                    }}
                    onSelectSlotDate={(date, slot) => {
                      setPreferredDonationDate(date);
                      setDonationSlot(slot);
                    }}
                  />
                </div>

                {/* ================= SECTION: PRIMARY & ALTERNATE DATE SCHEDULING ================= */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-[#F0003C] flex items-center justify-center">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Donation Appointment & Alternate Date Option
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Select your primary slot date. If you or the center are unavailable, choose your backup alternate date.
                        </p>
                      </div>
                    </div>

                    {/* Quick Button: Jump to Next Available Slot Date */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreferredDonationDate(selectedCenter.nextAvailableSlotDate);
                        setDonationSlot(selectedCenter.nextAvailableSlotTime);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Next Slot: {selectedCenter.nextAvailableSlotDate}</span>
                    </button>
                  </div>

                  {/* Next Available Slot Date Chips Bar */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Next Available Slot Dates (Quick Select):</span>
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {[1, 2, 3, 4, 7].map((offset) => {
                        const d = new Date();
                        d.setDate(d.getDate() + offset);
                        const dateStr = d.toISOString().split('T')[0];
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const label = offset === 1 ? 'Tomorrow' : `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
                        const isSelected = preferredDonationDate === dateStr;
                        const slotTime = offset % 2 === 0 ? 'Afternoon (01:00 PM – 04:00 PM)' : 'Morning (09:00 AM – 12:00 PM)';

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setPreferredDonationDate(dateStr);
                              setDonationSlot(slotTime);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#F0003C] text-white border-[#F0003C] shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>{label}</span>
                            {offset === 1 && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                Earliest
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Date & Slot Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Preferred Donation Date <span className="text-[#F0003C]">*</span>
                        </label>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {selectedCenter.availableSlotsToday} total slots open
                        </span>
                      </div>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={preferredDonationDate}
                        onChange={(e) => setPreferredDonationDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Time Slot
                      </label>
                      <select
                        value={donationSlot}
                        onChange={(e) => setDonationSlot(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer font-medium"
                      >
                        {timeSlots.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Alternate Date Option Toggle & Form */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableAlternateDate}
                          onChange={(e) => setEnableAlternateDate(e.target.checked)}
                          className="rounded border-slate-300 text-[#F0003C] focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Not available on your preferred date? Add Alternate Date Option
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            If scheduling conflicts or full capacity occur, we will automatically confirm this backup date.
                          </span>
                        </div>
                      </label>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        enableAlternateDate ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {enableAlternateDate ? 'Alternate Enabled' : 'Optional'}
                      </span>
                    </div>

                    {enableAlternateDate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-blue-900">
                              Backup / Alternate Date
                            </label>
                            
                            {/* Quick Next Week Alternate Helper */}
                            <button
                              type="button"
                              onClick={() => {
                                const base = new Date(preferredDonationDate || Date.now());
                                base.setDate(base.getDate() + 7);
                                setAlternateDonationDate(base.toISOString().split('T')[0]);
                              }}
                              className="text-[10px] text-blue-700 underline cursor-pointer"
                              title="Set alternate date to 1 week after preferred date"
                            >
                              +7 Days After Preferred
                            </button>
                          </div>
                          <input
                            type="date"
                            min={preferredDonationDate || new Date().toISOString().split('T')[0]}
                            value={alternateDonationDate}
                            onChange={(e) => setAlternateDonationDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-blue-50/40 border border-blue-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-blue-900 mb-1">
                            Alternate Time Slot
                          </label>
                          <select
                            value={alternateDonationSlot}
                            onChange={(e) => setAlternateDonationSlot(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-blue-50/40 border border-blue-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                          >
                            {timeSlots.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Flexible on-call check */}
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flexibleAvailability}
                      onChange={(e) => setFlexibleAvailability(e.target.checked)}
                      className="rounded border-slate-300 text-[#F0003C] focus:ring-rose-500"
                    />
                    <span>
                      <strong>Flexible availability:</strong> You may also notify me if urgent critical-demand blood shortages arise nearby.
                    </span>
                  </label>
                </div>

                {/* Row 5: Optional notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Additional Notes or Medical Preferences (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Prefer specific arm, past donor reactions, special appointment notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C] transition-all"
                  />
                </div>

                {/* Medical Guidelines & Eligibility Protocol Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-[#F0003C]" />
                    Clinical Eligibility Protocol Notice
                  </div>
                  <p className="leading-relaxed">
                    In accordance with medical blood banking standards, registering here conducts initial demographic pre-screening. <strong>A donor cannot and will not be declared medically eligible solely based on self-reported age and weight.</strong> Complete clearance is performed in-person by trained phlebotomists via hemoglobin test, blood pressure evaluation, and clinical screening.
                  </p>
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        required
                        checked={healthAck}
                        onChange={(e) => setHealthAck(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#F0003C] focus:ring-rose-500 cursor-pointer"
                      />
                      <span>
                        I understand these clinical guidelines, confirm I am currently feeling well with no acute fever or symptoms, and agree to have my confidential contact information stored securely for LifeFlow blood emergency notices.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Data Privacy Shield */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Protected health data: donor details are restricted to authorized clinical staff.</span>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={isSubmitting ? {} : { scale: 1.01, y: -1 }}
                  whileTap={isSubmitting ? {} : { scale: 0.98 }}
                  className="w-full py-3.5 px-6 bg-[#F0003C] hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Appointment & Registering...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Schedule Donation & Register</span>
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
