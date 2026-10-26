import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Truck, 
  Building2, 
  Calendar, 
  Droplet, 
  FileText, 
  ShieldCheck, 
  Activity,
  Loader2
} from 'lucide-react';
import { PublicRequestTracking, RequestStage } from '../types/index.js';

interface RequestTrackerProps {
  initialTrackingId?: string;
}

export const RequestTracker: React.FC<RequestTrackerProps> = ({ initialTrackingId }) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicRequestTracking | null>(null);

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingId(initialTrackingId);
      handleSearch(initialTrackingId);
    }
  }, [initialTrackingId]);

  const handleSearch = async (idToSearch?: string) => {
    const id = (idToSearch || trackingId).trim();
    if (!id) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(id)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Tracking record not found.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to track request at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const stages: { stage: RequestStage; label: string; desc: string }[] = [
    { stage: 'Submitted', label: '1. Submitted', desc: 'Requisition queued in central dispatch' },
    { stage: 'Triage Review', label: '2. Triage Review', desc: 'Clinical priority and authorization verified' },
    { stage: 'Cross-Match', label: '3. Cross-Match', desc: 'Serological cross-match cleared by lab' },
    { stage: 'Dispatched', label: '4. Dispatched', desc: 'Released to certified cold-chain courier' },
  ];

  const getStageIndex = (stage: RequestStage): number => {
    switch (stage) {
      case 'Submitted': return 0;
      case 'Triage Review': return 1;
      case 'Cross-Match': return 2;
      case 'Dispatched': return 3;
      case 'Rejected': return -1;
      default: return 0;
    }
  };

  const getStatusBadge = (status: string, stage: RequestStage) => {
    if (stage === 'Rejected' || status === 'Rejected') {
      return {
        icon: <XCircle className="w-5 h-5 text-[#F0003C]" />,
        title: 'Requisition Declined',
        desc: 'Request could not be accommodated due to clinical incompatibility or unverified hospital credentials.',
        style: 'bg-rose-50 text-rose-900 border-rose-200'
      };
    }
    if (stage === 'Dispatched' || status === 'Fulfilled') {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        title: 'Dispatched — Temperature-Regulated Cold-Chain Courier',
        desc: 'Verified units released and in active transit to the receiving medical facility (+2°C to +6°C).',
        style: 'bg-emerald-50 text-emerald-900 border-emerald-200'
      };
    }
    if (stage === 'Cross-Match') {
      return {
        icon: <Activity className="w-5 h-5 text-purple-600 animate-pulse" />,
        title: 'Laboratory Cross-Matching & Compatibility Testing',
        desc: 'Blood units allocated from vault storage; serological compatibility screening in progress.',
        style: 'bg-purple-50 text-purple-900 border-purple-200'
      };
    }
    if (stage === 'Triage Review') {
      return {
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        title: 'Clinical Triage Review Complete — Allocation Approved',
        desc: 'Requisition approved by medical director; preparing for laboratory cross-match testing.',
        style: 'bg-blue-50 text-blue-900 border-blue-200'
      };
    }
    return {
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      title: 'Requisition Submitted — Awaiting Medical Review',
      desc: 'Requisition logged in central dispatch queue for priority clinical evaluation.',
      style: 'bg-amber-50 text-amber-900 border-amber-200'
    };
  };

  return (
    <section data-animate="reveal" id="track" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <Truck className="w-3.5 h-3.5 text-[#F0003C]" />
            Verified Chain of Custody Tracker
          </div>
          <h2 className="text-3xl font-extrabold text-[#111B31] tracking-tight">
            Track Blood Requisition Status
          </h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto mt-2">
            Enter your unique Requisition Reference (e.g., REQ-8021 or REQ-8015) to track verified cold-chain progression stages.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Requisition Reference (e.g. REQ-8021)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-[#F0003C]"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSearch()}
            disabled={isLoading || !trackingId.trim()}
            className="px-6 py-3 bg-[#F0003C] hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isLoading ? 'Checking...' : 'Track Requisition'}</span>
          </motion.button>
        </div>

        {/* Quick Demo Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 mt-3">
          <span>Quick verification examples:</span>
          <button
            onClick={() => {
              setTrackingId('REQ-8021');
              handleSearch('REQ-8021');
            }}
            className="text-[#F0003C] hover:underline font-mono cursor-pointer"
          >
            REQ-8021 (Triage Review)
          </button>
          <span>·</span>
          <button
            onClick={() => {
              setTrackingId('REQ-8019');
              handleSearch('REQ-8019');
            }}
            className="text-[#F0003C] hover:underline font-mono cursor-pointer"
          >
            REQ-8019 (Cross-Match)
          </button>
          <span>·</span>
          <button
            onClick={() => {
              setTrackingId('REQ-8015');
              handleSearch('REQ-8015');
            }}
            className="text-[#F0003C] hover:underline font-mono cursor-pointer"
          >
            REQ-8015 (Dispatched)
          </button>
        </div>

        {/* Error with AnimatePresence */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[#F0003C] shrink-0" />
              <div>
                <span className="font-semibold">Tracking Notice: </span>
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card with AnimatePresence */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8"
            >
              {/* Status Header Banner */}
              {(() => {
                const statusInfo = getStatusBadge(result.status, result.currentStage);
                return (
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 mb-6 ${statusInfo.style}`}>
                    <div className="shrink-0 mt-0.5">{statusInfo.icon}</div>
                    <div>
                      <h4 className="font-bold text-sm">{statusInfo.title}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{statusInfo.desc}</p>
                    </div>
                  </div>
                );
              })()}

              {/* 4 Workflow Stages Stepper */}
              <div className="py-5 mb-6 border-y border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {stages.map((stg, i) => {
                    const currentIndex = getStageIndex(result.currentStage);
                    const isCompleted = currentIndex > i;
                    const isCurrent = currentIndex === i;
                    const isRejected = result.currentStage === 'Rejected';

                    return (
                      <div key={stg.stage} className="space-y-1">
                        <div className={`w-8 h-8 mx-auto rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                          isRejected
                            ? 'bg-rose-100 text-rose-700'
                            : isCurrent
                            ? 'bg-[#F0003C] text-white ring-4 ring-rose-100 shadow-xs'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? '✓' : i + 1}
                        </div>
                        <div className={`text-xs font-semibold ${isCurrent ? 'text-[#F0003C] font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                          {stg.label}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                          {stg.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified Clinical Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Receiving Institution
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{result.hospitalName}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-[#F0003C]" /> Blood Phenotype & Volume
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {result.units} units of <span className="text-[#F0003C] font-bold">{result.bloodGroup}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Logged Timestamp
                  </div>
                  <div className="font-medium text-slate-800">
                    {new Date(result.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Urgency Level
                  </div>
                  <div>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      result.urgency === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {result.urgency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custody History Log */}
              {result.statusHistory && result.statusHistory.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Progression Timeline:
                  </div>
                  <div className="space-y-2">
                    {result.statusHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-600 text-[11px]">
                        <span className="font-semibold text-slate-800 shrink-0">{entry.stage}:</span>
                        <span className="flex-1">{entry.notes || 'Stage confirmed'}</span>
                        <span className="text-slate-400 shrink-0">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin courier notes */}
              {result.adminNotes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900 flex items-center gap-1 mb-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Laboratory & Dispatch Remarks:
                  </div>
                  <p>{result.adminNotes}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
