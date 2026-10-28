import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Droplet, 
  Boxes, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  X,
  Heart
} from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const actions = [
    {
      id: 'donor',
      title: 'Register for Blood Camp',
      desc: 'Pre-screen and reserve your spot at upcoming college & mobile drives.',
      icon: User,
      iconColor: 'text-[#F0003C]',
      iconBg: 'bg-rose-100/90',
      cardBg: 'bg-[#fff5f6] hover:bg-[#ffeef0] border-[#fed7dc]',
      arrowColor: 'text-rose-500',
      action: () => onNavigate('donor'),
    },
    {
      id: 'request',
      title: 'Emergency Blood Need',
      desc: 'Submit immediate requisitions for hospital emergency transfusions.',
      icon: Droplet,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-100/90',
      cardBg: 'bg-[#f0f9ff] hover:bg-[#e6f4fe] border-[#bae6fd]',
      arrowColor: 'text-sky-500',
      action: () => onNavigate('request'),
    },
    {
      id: 'availability',
      title: 'Check Live Vault Stock',
      desc: 'View real-time verified blood inventory across all 8 phenotypes.',
      icon: Boxes,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100/90',
      cardBg: 'bg-[#f0fdf4] hover:bg-[#e5faec] border-[#bbf7d0]',
      arrowColor: 'text-emerald-500',
      action: () => onNavigate('availability'),
    },
    {
      id: 'track',
      title: 'Track Requisition Custody',
      desc: 'Track hospital request chain of custody from triage to courier dispatch.',
      icon: MapPin,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100/90',
      cardBg: 'bg-[#faf5ff] hover:bg-[#f3e8ff] border-[#e9d5ff]',
      arrowColor: 'text-purple-500',
      action: () => onNavigate('track'),
    },
  ];

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-[#F0003C] flex items-center justify-center text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111B31] tracking-tight flex items-center gap-1.5">
              Quick Actions
            </h2>
            <p className="text-[11px] text-slate-500">
              Help save lives. Choose an action below.
            </p>
          </div>
        </div>

        {/* 5-Card Grid matching reference design with Motion elevation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <motion.div
                key={act.id}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={act.action}
                className={`${act.cardBg} border rounded-2xl p-4 transition-colors cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm`}
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl ${act.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-4 h-4 ${act.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-[#111B31] text-xs tracking-tight mb-1">
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {act.desc}
                  </p>
                </div>
                <div className="pt-3 flex justify-end">
                  <ArrowRight className={`w-3.5 h-3.5 ${act.arrowColor} group-hover:translate-x-1 transition-transform`} />
                </div>
              </motion.div>
            );
          })}

          {/* 5th Media Banner: "Together We Save Lives" */}
          <motion.div 
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            aria-label="Open community impact documentary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setVideoModalOpen(true);
              }
            }}
            onClick={() => setVideoModalOpen(true)}
            className="relative rounded-2xl overflow-hidden border border-slate-200/80 group cursor-pointer min-h-[140px] shadow-xs hover:shadow-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F0003C]"
          >
            {/* Background Image */}
            <img
              src="/images/together-save-lives.jpg"
              alt="Together We Save Lives"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Subtle dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/30 to-transparent" />
            
            {/* Overlay Text */}
            <div className="absolute top-3 left-3 z-10 text-white">
              <span className="font-serif italic text-sm sm:text-base leading-tight font-medium drop-shadow-md block">
                Together <br /> We Save <br /> Lives ♡
              </span>
            </div>

            {/* Play Button */}
            <div className="absolute bottom-3 right-3 z-10">
              <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white group-hover:bg-[#F0003C] transition-colors shadow-md">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Video / Community Impact Modal with AnimatePresence */}
      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setVideoModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#F0003C] flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-[#F0003C]" />
                </div>
                <h3 className="font-bold text-[#111B31] text-base">LifeFlow Community Impact</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Behind every unit of blood is a human story. Voluntary donors are the silent guardian heroes of regional surgery suites, burn units, and neonatal intensive care nurseries.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Average Emergency Transit Time:</span>
                  <span className="font-bold text-slate-900">&lt; 38 minutes</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Zero Falsification Thermal Protocol:</span>
                  <span className="font-bold text-emerald-600">Active (+2°C to +6°C)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Total Community Transfusions:</span>
                  <span className="font-bold text-[#F0003C]">3,420+ units</span>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setVideoModalOpen(false);
                    onNavigate('donor');
                  }}
                  className="px-4 py-2 bg-[#F0003C] text-white rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-sm transition-colors cursor-pointer"
                >
                  Join Donor Registry
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
