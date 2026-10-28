import React from 'react';
import { motion } from 'motion/react';
import { 
  Droplet, 
  ArrowRight, 
  TrendingUp,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BloodStockItem, BloodGroup } from '../types/index.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface LiveInventoryOverviewProps {
  inventory: BloodStockItem[];
  onViewAll: () => void;
  onRequestBlood: (group?: BloodGroup) => void;
  onBecomeDonor: (group?: BloodGroup) => void;
}

export const LiveInventoryOverview: React.FC<LiveInventoryOverviewProps> = ({
  inventory,
  onViewAll,
  onRequestBlood,
  onBecomeDonor
}) => {
  const groups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // 7-day usage line chart configuration matching reference visual
  const lineChartData = {
    labels: ['Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20'],
    datasets: [
      {
        data: [58, 80, 80, 72, 94, 90, 138],
        borderColor: '#F0003C',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, 'rgba(240, 0, 60, 0.35)');
          gradient.addColorStop(1, 'rgba(240, 0, 60, 0.0)');
          return gradient;
        },
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#F0003C',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 850,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111B31',
        padding: 8,
        titleFont: { size: 11, weight: 'bold' as const, family: 'Poppins' },
        bodyFont: { size: 11, family: 'Poppins' },
        callbacks: {
          label: (ctx: any) => ` ${ctx.raw} units transfused`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 150,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          stepSize: 50,
          color: '#94a3b8',
          font: { size: 10, family: 'Poppins' },
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, family: 'Poppins' },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <section className="py-8 bg-slate-50/60 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Blood Availability (8 Mini Cards in a row) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F0003C] flex items-center justify-center text-white">
                    <Droplet className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111B31] tracking-tight">
                      Blood Availability
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Real-time inventory across all blood groups.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ x: 2 }}
                  onClick={onViewAll}
                  className="text-xs font-semibold text-[#F0003C] hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* 8 Compact Phenotype Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
                {groups.map((group) => {
                  const item = inventory.find(i => i.bloodGroup === group);
                  const units = item ? item.unitsAvailable : 0;
                  const threshold = item ? item.minThreshold : 10;
                  
                  // Calculate percentage relative to optimal stock target (35 units)
                  const targetUnits = 35;
                  const pct = Math.min(100, Math.round((units / targetUnits) * 100));

                  const isCritical = units < 5;
                  const isLow = units >= 5 && units < 12;

                  const barColor = isCritical 
                    ? 'bg-[#F0003C]' 
                    : isLow 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500';

                  return (
                    <motion.div
                      key={group}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onBecomeDonor(group)}
                      className={`bg-white hover:bg-rose-50/40 border rounded-xl p-2.5 transition-colors cursor-pointer flex flex-col justify-between shadow-xs group ${
                        isCritical ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100'
                      }`}
                    >
                      {/* Top: Droplet icon + Group Name */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Droplet className={`w-3.5 h-3.5 ${isCritical ? 'text-[#F0003C] fill-[#F0003C] animate-pulse' : 'text-[#F0003C] fill-[#F0003C]'} shrink-0 group-hover:scale-110 transition-transform`} />
                        <span className="text-sm font-black text-[#111B31] tracking-tight">
                          {group}
                        </span>
                      </div>

                      {/* Middle: Units available */}
                      <div className="text-xs font-bold text-slate-800 flex items-baseline gap-0.5 mb-2">
                        <span>{units}</span>
                        <span className="text-[10px] font-normal text-slate-400">units</span>
                      </div>

                      {/* Bottom: Progress Bar + Percentage */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>
                        <div className="text-[9px] text-right text-slate-400 font-medium">
                          {pct}%
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Micro Quick Hint */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Click any blood group to initiate donor registration or request.</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Vault Cold-Chain Synchronized
              </span>
            </div>
          </div>

          {/* Right Column: Live Blood Usage - Last 7 days */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-[#F0003C] flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111B31] tracking-tight">
                    Live Blood Usage
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Last 7 days
                  </p>
                </div>
              </div>

              {/* Line Chart */}
              <div className="h-36 w-full pt-1">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Footer metric */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Peak demand: Apr 20</span>
              <span className="text-[#F0003C] font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18% Emergency surge
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
