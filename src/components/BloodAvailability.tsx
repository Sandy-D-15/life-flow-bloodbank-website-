import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw,
  AlertTriangle,
  Lock,
  Heart,
  ExternalLink
} from 'lucide-react';
import { BloodStockItem, BloodGroup } from '../types/index.js';
import { BloodCharts } from './BloodCharts.js';

interface BloodAvailabilityProps {
  inventory: BloodStockItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onRequestBlood: (group?: BloodGroup) => void;
  onBecomeDonor: (group?: BloodGroup) => void;
}

// Medical Compatibility Reference
const COMPATIBILITY_MAP: Record<BloodGroup, { canGiveTo: string[]; canReceiveFrom: string[]; notes: string }> = {
  'O-': {
    canGiveTo: ['All Blood Types (Universal Red Cell Donor)'],
    canReceiveFrom: ['O- only'],
    notes: 'Crucial in trauma situations when recipient blood type is unverified.'
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    notes: 'Most common blood type in global populations; consistently high hospital demand.'
  },
  'A-': {
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    notes: 'Important for pediatric and emergency transfusions.'
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    notes: 'Second most common group; vital for surgical and oncology patients.'
  },
  'B-': {
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    notes: 'One of the rarest blood groups, frequently operating near critical thresholds.'
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    notes: 'Essential for patients with sickle cell disease and thalassemia.'
  },
  'AB-': {
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    notes: 'Rarest blood group (< 1% of population). Universal plasma donor.'
  },
  'AB+': {
    canGiveTo: ['AB+ only'],
    canReceiveFrom: ['All Blood Types (Universal Red Cell Recipient)'],
    notes: 'Universal recipient for red blood cells; universal donor for fresh frozen plasma.'
  }
};

export const BloodAvailability: React.FC<BloodAvailabilityProps> = ({
  inventory,
  isLoading,
  onRefresh,
  onRequestBlood,
  onBecomeDonor
}) => {
  const [showMatrix, setShowMatrix] = useState(false);

  const getStatus = (units: number) => {
    if (units < 5) {
      return { 
        label: 'Critical Alert', 
        color: 'text-[#F0003C] bg-rose-50 border-rose-200 ring-rose-200', 
        dot: 'bg-[#F0003C] animate-ping', 
        severity: 'critical' 
      };
    }
    if (units < 12) {
      return { 
        label: 'Low Reserve', 
        color: 'text-amber-800 bg-amber-50 border-amber-200 ring-amber-200', 
        dot: 'bg-amber-500', 
        severity: 'low' 
      };
    }
    return { 
      label: 'Sufficient Stock', 
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200 ring-emerald-200', 
      dot: 'bg-emerald-500', 
      severity: 'sufficient' 
    };
  };

  const totalAvailable = inventory.reduce((acc, curr) => acc + curr.unitsAvailable, 0);
  const totalReserved = inventory.reduce((acc, curr) => acc + (curr.reservedUnits || 0), 0);

  return (
    <section data-animate="reveal" id="availability" className="py-14 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-[#F0003C] text-xs font-semibold tracking-wide uppercase">
              <Droplet className="w-3.5 h-3.5 fill-[#F0003C]" />
              Real-Time Cold Storage Bank
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111B31] tracking-tight mt-1">
              Live Blood Group Availability
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mt-1 leading-relaxed">
              Dynamic inventory tracked directly from certified thermal vaults (+2°C to +6°C). Quantities update instantaneously upon donor intake and hospital requisition dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F0003C]' : 'text-slate-500'}`} />
              <span>{isLoading ? 'Updating...' : 'Sync Stock'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMatrix(!showMatrix)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#111B31] hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{showMatrix ? 'Hide Compatibility' : 'Compatibility Guide'}</span>
            </motion.button>
          </div>
        </div>

        {/* Global Stock Status Summary Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-8 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500">Total Unreserved Stock: </span>
              <span className="font-extrabold text-[#111B31] text-sm ml-1">{totalAvailable} units</span>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">Reserved for Trauma Dispatch: </span>
              <span className="font-bold text-amber-600 ml-1">{totalReserved} units</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Sufficient (&gt;12)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Low (5-12)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F0003C]"></span> Critical (&lt;5)
            </span>
          </div>
        </div>

        {/* Compatibility Matrix Drawer (Collapsible with AnimatePresence) */}
        <AnimatePresence>
          {showMatrix && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#111B31]">ABO & Rh Transfusion Compatibility Matrix</h3>
                  <p className="text-xs text-slate-500">Clinical reference for whole blood and packed red blood cell (pRBC) compatibility</p>
                </div>
                <span className="text-xs font-semibold text-[#F0003C] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                  Medical Standard
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {(Object.keys(COMPATIBILITY_MAP) as BloodGroup[]).map(group => {
                  const info = COMPATIBILITY_MAP[group];
                  return (
                    <div key={group} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg font-black text-[#F0003C]">{group}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Phenotype</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-slate-500 font-medium">Can Donate: </span>
                          <span className="text-slate-800 font-semibold">{info.canGiveTo.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Can Receive: </span>
                          <span className="text-slate-800 font-semibold">{info.canReceiveFrom.join(', ')}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5 italic">
                        {info.notes}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                  <div className="w-20 h-5 bg-slate-100 rounded-md" />
                </div>
                <div className="w-24 h-6 bg-slate-100 rounded" />
                <div className="w-full h-2 bg-slate-100 rounded-full" />
                <div className="w-full h-8 bg-slate-50 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* 8 Blood Group Cards Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {inventory.map((item) => {
              const status = getStatus(item.unitsAvailable);
              const compat = COMPATIBILITY_MAP[item.bloodGroup];
              const targetCapacity = 35;
              const fillPct = Math.min(100, Math.round((item.unitsAvailable / targetCapacity) * 100));

              return (
                <motion.div
                  key={item.bloodGroup}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group ${
                    status.severity === 'critical' ? 'border-rose-200 ring-1 ring-rose-100/80' : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    {/* Card Top: Group & Status */}
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="text-2xl font-black text-[#F0003C] tracking-tight">
                          {item.bloodGroup}
                        </span>
                      </div>

                      <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        <span>{status.label}</span>
                      </div>
                    </div>

                    {/* Quantity Counter */}
                    <div className="mt-5">
                      <div className="text-xs font-medium text-slate-500">Unreserved Available Stock</div>
                      <div className="text-3xl font-extrabold text-[#111B31] mt-0.5 flex items-baseline gap-1.5">
                        <span>{item.unitsAvailable}</span>
                        <span className="text-xs font-normal text-slate-400">units (450ml)</span>
                      </div>

                      {/* Reserved indicator */}
                      {item.reservedUnits > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-1">
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>{item.reservedUnits} unit(s) reserved for pending trauma dispatch</span>
                        </div>
                      )}

                      {/* Progress Bar of Safety Threshold */}
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            status.severity === 'critical'
                              ? 'bg-[#F0003C]'
                              : status.severity === 'low'
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Compatibility Snippet */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
                      <div className="flex items-baseline justify-between text-slate-600">
                        <span className="text-slate-400">Can give to:</span>
                        <span className="font-medium text-slate-800 text-right truncate max-w-[150px]">
                          {compat.canGiveTo.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-slate-600">
                        <span className="text-slate-400">Receives from:</span>
                        <span className="font-medium text-slate-800 text-right truncate max-w-[150px]">
                          {compat.canReceiveFrom.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onBecomeDonor(item.bloodGroup)}
                      className="w-full py-2 px-2 text-xs font-semibold text-[#F0003C] bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Heart className="w-3 h-3 fill-[#F0003C]" />
                      <span>Donate {item.bloodGroup}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onRequestBlood(item.bloodGroup)}
                      className="w-full py-2 px-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Droplet className="w-3 h-3 text-[#F0003C]" />
                      <span>Request Unit</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Visual Analytics Chart.js Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#111B31]">Inventory Distribution Visualizer</h3>
            <p className="text-xs text-slate-500">Live graphical breakdown across all thermal vault reserves</p>
          </div>
          <BloodCharts inventory={inventory} />
        </div>

      </div>
    </section>
  );
};
