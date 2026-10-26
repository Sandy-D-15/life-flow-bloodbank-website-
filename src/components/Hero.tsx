import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  ArrowRight, 
  Activity, 
  Droplet, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Calendar,
  Building2,
  X,
  Sparkles,
  Send,
  Users
} from 'lucide-react';
import { BloodDropFlow } from './BloodDropFlow.js';
import { DashboardStats } from '../types/index.js';

interface HeroProps {
  stats: DashboardStats | null;
  onNavigate: (tab: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ stats, onNavigate }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const headingStage1Ref = useRef<HTMLSpanElement | null>(null);
  const headingStage2Ref = useRef<HTMLSpanElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const ctaGroupRef = useRef<HTMLDivElement | null>(null);
  const dropletBoxRef = useRef<HTMLDivElement | null>(null);
  const commandCardRef = useRef<HTMLDivElement | null>(null);
  const metricsGridRef = useRef<HTMLDivElement | null>(null);

  // Host a Camp Modal State
  const [hostCampModalOpen, setHostCampModalOpen] = useState(false);
  const [campFormData, setCampFormData] = useState({
    organizationName: '',
    coordinatorName: '',
    email: '',
    phone: '',
    proposedDate: '2026-10-30',
    expectedDonors: '100–150',
    city: 'Mumbai',
    venueAddress: "Jan Seva Sangh's Shri Ram College Auditorium",
    notes: ''
  });
  const [campSubmitted, setCampSubmitted] = useState(false);

  // GSAP Coordinated Entrance Sequence (Sections 3 & 4)
  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Content remains immediately visible without delay
      return;
    }

    const tl = gsap.timeline({ 
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        gsap.set([
          badgeRef.current, 
          headingStage1Ref.current, 
          headingStage2Ref.current, 
          descRef.current, 
          ctaGroupRef.current, 
          dropletBoxRef.current, 
          commandCardRef.current
        ], { clearProps: 'all' });
      }
    });

    // 1. Verification badge fades in with a small upward movement
    if (badgeRef.current) {
      tl.from(badgeRef.current, { y: 10, opacity: 0, duration: 0.35, clearProps: 'opacity,transform' });
    }

    // 2. The heading enters in two coordinated stages
    if (headingStage1Ref.current) {
      tl.from(headingStage1Ref.current, { y: 12, opacity: 0, duration: 0.35, clearProps: 'opacity,transform' }, '-=0.2');
    }
    if (headingStage2Ref.current) {
      tl.from(headingStage2Ref.current, { y: 12, opacity: 0, duration: 0.35, clearProps: 'opacity,transform' }, '-=0.25');
    }

    // 3. The description appears with a short delay
    if (descRef.current) {
      tl.from(descRef.current, { y: 10, opacity: 0, duration: 0.35, clearProps: 'opacity,transform' }, '-=0.2');
    }

    // 4. The CTA buttons enter with a subtle stagger
    if (ctaGroupRef.current) {
      tl.from(ctaGroupRef.current, { y: 10, opacity: 0, duration: 0.3, clearProps: 'opacity,transform' }, '-=0.15');
    }

    // 5. The blood-drop illustration becomes visible
    if (dropletBoxRef.current) {
      tl.from(dropletBoxRef.current, { scale: 0.95, opacity: 0, duration: 0.35, clearProps: 'opacity,transform' }, '-=0.2');
    }

    // 6. The command center card enters
    if (commandCardRef.current) {
      tl.from(commandCardRef.current, { y: 12, opacity: 0, duration: 0.35, clearProps: 'opacity,transform' }, '-=0.2');
    }

  }, { scope: containerRef, dependencies: [] });

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-b from-[#FFF5F6] via-[#FFF9F9] to-white border-b border-slate-100 pt-10 pb-12 lg:pt-14 lg:pb-16"
    >
      {/* Background Soft Ambient Medical Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-tr from-rose-100/25 via-red-50/15 to-transparent blur-3xl rounded-full -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline and Call-to-actions */}
          <div className="lg:col-span-5 space-y-5 text-center lg:text-left z-10">
            {/* 1. Regional verification badge with upcoming camp ticker */}
            <div 
              ref={badgeRef}
              className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200/90 text-[#F0003C] text-[11px] font-semibold tracking-wide shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#F0003C] animate-pulse"></span>
              <span className="font-bold text-rose-800">Next Mega Blood Camp:</span>
              <span className="text-slate-700">Shri Ram College Campus (Oct 30 • 09:00 AM)</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <button 
                onClick={() => onNavigate('donor')}
                className="text-[#F0003C] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Book Slot &rarr;
              </button>
            </div>

            {/* 2. Headline in two coordinated stages */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111B31] tracking-tight leading-[1.12]">
              <span ref={headingStage1Ref} className="block">
                Community Blood Camps,
              </span>
              <span ref={headingStage2Ref} className="block text-[#F0003C]">
                Saving Lives Together.
              </span>
            </h1>

            {/* 3. Description */}
            <p 
              ref={descRef}
              className="text-sm sm:text-[15px] text-[#475569] max-w-xl leading-relaxed mx-auto lg:mx-0"
            >
              Connecting voluntary donors, college student drives, and community organizers with certified hospital trauma centers. Schedule your blood camp slot, verify 56-day rest eligibility, and track life-saving cold-chain transit.
            </p>

            {/* 4. CTA Buttons with subtle stagger & Motion hover/press */}
            <div 
              ref={ctaGroupRef}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('donor')}
                className="w-full sm:w-auto px-5 py-3 bg-[#F0003C] hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Register for Camp</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHostCampModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-rose-50/50 text-slate-800 font-semibold text-xs rounded-xl border border-rose-200/90 shadow-xs transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#F0003C]" />
                <span>Host a Drive</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('request')}
                className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Droplet className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Emergency Order</span>
              </motion.button>
            </div>
          </div>

          {/* Center Column: 5. Living Continuous Blood Drop Flow with Dripping Physics & Expanding Ripples */}
          <div 
            ref={dropletBoxRef}
            className="lg:col-span-3 flex flex-col items-center justify-center relative py-2 lg:py-0"
          >
            <BloodDropFlow />
          </div>

          {/* Right Column: 6. Blood Command Center Telemetry Card */}
          <div className="lg:col-span-4 z-10">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Card */}
              <div 
                ref={commandCardRef}
                className="lf-command-card bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-5 sm:p-6 relative z-10"
              >
                {/* Header of card */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F0003C] flex items-center justify-center text-white shadow-xs shadow-rose-600/30">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#111B31] text-sm">Blood Command Center</h3>
                      <p className="text-[11px] text-slate-400">Live operational telemetry</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Operational
                  </span>
                </div>

                {/* Metric Grid (2x2) */}
                <div 
                  ref={metricsGridRef}
                  className="grid grid-cols-2 gap-3 my-4"
                >
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 transition-colors hover:border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Total In Storage</div>
                    <div className="text-xl font-bold text-[#111B31] mt-0.5 flex items-baseline gap-1">
                      {stats ? stats.totalUnitsAvailable : '130'}
                      <span className="text-[11px] font-normal text-slate-500">units</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tested & available
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 transition-colors hover:border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Active Donors</div>
                    <div className="text-xl font-bold text-[#111B31] mt-0.5 flex items-baseline gap-1">
                      {stats ? stats.totalDonors : '7'}
                      <span className="text-[11px] font-normal text-slate-500">volunteers</span>
                    </div>
                    <div className="text-[10px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <Heart className="w-3 h-3 fill-rose-600" /> Community heroes
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 transition-colors hover:border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Fulfilled Requisitions</div>
                    <div className="text-xl font-bold text-[#111B31] mt-0.5 flex items-baseline gap-1">
                      {stats ? stats.fulfilledRequests : '1'}
                      <span className="text-[11px] font-normal text-slate-500">cases</span>
                    </div>
                    <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
                      <Truck className="w-3 h-3" /> Dispatched
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3 transition-colors hover:border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Pending Review</div>
                    <div className="text-xl font-bold text-[#111B31] mt-0.5 flex items-baseline gap-1">
                      {stats ? stats.pendingRequests : '2'}
                      <span className="text-[11px] font-normal text-slate-500">hospitals</span>
                    </div>
                    <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> Queue priority
                    </div>
                  </div>
                </div>

                {/* Priority alert matching reference styling */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onNavigate('request')}
                  className="bg-rose-50/80 hover:bg-rose-50 border border-rose-200/90 rounded-xl p-3 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#F0003C] shrink-0" />
                    <span className="text-[11px] text-rose-800 font-medium">
                      <span className="font-bold text-rose-900">
                        {stats && stats.criticalRequests > 0 ? stats.criticalRequests : 4} Critical trauma requisition(s) pending:
                      </span>{' '}
                      Immediate priority dispatch active.
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </motion.div>

              </div>

              {/* Decorative card backdrop */}
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl opacity-10 blur-lg -z-0"></div>
            </div>
          </div>

        </div>
      </div>

      {/* Host a Blood Drive Organizer Modal */}
      <AnimatePresence>
        {hostCampModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              {campSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Blood Camp Proposal Registered!</h3>
                    <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                      Thank you for volunteering to host a community blood drive for <strong className="text-slate-800">{campFormData.organizationName || 'your organization'}</strong>. Reference code: <strong className="text-rose-600 font-mono">CAMP-2026-DRIVE</strong>.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 text-[11px] text-slate-600 text-left space-y-1.5 border border-slate-100">
                    <div><strong>Proposed Date:</strong> {campFormData.proposedDate}</div>
                    <div><strong>Expected Donors:</strong> {campFormData.expectedDonors} units</div>
                    <div><strong>Venue:</strong> {campFormData.venueAddress || campFormData.city}</div>
                    <div className="text-rose-600 pt-1">
                      ℹ Our community medical outreach van & certified phlebotomy officers will contact coordinator {campFormData.coordinatorName} within 24 hours.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCampSubmitted(false);
                      setHostCampModalOpen(false);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Host a Blood Drive at Your Institution</h3>
                        <p className="text-[11px] text-slate-400">For Colleges, NSS Units, Corporates & Housing Societies</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHostCampModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCampSubmitted(true);
                    }}
                    className="mt-4 space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        College / Company / Institution Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={campFormData.organizationName}
                        onChange={(e) => setCampFormData({...campFormData, organizationName: e.target.value})}
                        placeholder="e.g. Shri Ram College NSS Unit / Tech Corp"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Coordinator / Head Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={campFormData.coordinatorName}
                          onChange={(e) => setCampFormData({...campFormData, coordinatorName: e.target.value})}
                          placeholder="Dr. / Prof. / Mr. Name"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Coordinator Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={campFormData.phone}
                          onChange={(e) => setCampFormData({...campFormData, phone: e.target.value})}
                          placeholder="+91 98765-43210"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Proposed Camp Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={campFormData.proposedDate}
                          onChange={(e) => setCampFormData({...campFormData, proposedDate: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Expected Donors
                        </label>
                        <select
                          value={campFormData.expectedDonors}
                          onChange={(e) => setCampFormData({...campFormData, expectedDonors: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="50–80">50 – 80 Donors (Mini Drive)</option>
                          <option value="100–150">100 – 150 Donors (College Camp)</option>
                          <option value="200+">200+ Donors (Mega Drive)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Camp Venue / Auditorium Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={campFormData.venueAddress}
                        onChange={(e) => setCampFormData({...campFormData, venueAddress: e.target.value})}
                        placeholder="e.g. College Auditorium, Ground Floor, Station Road"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 text-[11px] text-rose-800 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-rose-900">
                        <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                        What LifeFlow Provides (Zero Cost):
                      </div>
                      <div>• Air-conditioned mobile collection van & sterile beds</div>
                      <div>• Licensed phlebotomists, medical director & rapid hemoglobin testing</div>
                      <div>• Refreshments & digital donor recognition certificates</div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setHostCampModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#F0003C] hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Proposal</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
