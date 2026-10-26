import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { BloodStockItem } from '../types/index.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface BloodChartsProps {
  inventory: BloodStockItem[];
}

export const BloodCharts: React.FC<BloodChartsProps> = ({ inventory }) => {
  const labels = inventory.map(item => item.bloodGroup);
  const unitsData = inventory.map(item => item.unitsAvailable);

  const colors = [
    '#F0003C', // LifeFlow primary red
    '#BE123C', // Deep crimson
    '#DC2626', // Red-600
    '#B91C1C', // Red-700
    '#991B1B', // Red-800
    '#F43F5E', // Rose-500
    '#FB7185', // Rose-400
    '#881337', // Rose-900
  ];

  const barData = {
    labels,
    datasets: [
      {
        label: 'Units Available in Storage',
        data: unitsData,
        backgroundColor: colors,
        borderColor: '#111B31',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111B31',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' as const, family: 'Poppins' },
        bodyFont: { size: 12, family: 'Poppins' },
        callbacks: {
          label: (context: any) => ` ${context.raw} units verified in vault`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: { family: 'Poppins', size: 11 },
          precision: 0,
          color: '#64748b',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { family: 'Poppins', weight: 'bold' as const, size: 12 },
          color: '#111B31',
        },
      },
    },
  };

  const doughnutData = {
    labels,
    datasets: [
      {
        data: unitsData,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { family: 'Poppins', size: 11 },
          color: '#334155',
        },
      },
      tooltip: {
        backgroundColor: '#111B31',
        padding: 10,
        titleFont: { size: 12, family: 'Poppins' },
        bodyFont: { size: 11, family: 'Poppins' },
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw} units`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#111B31] text-base">Blood Inventory Distribution (Units)</h3>
            <p className="text-xs text-slate-500">Live inventory across all 8 standard ABO and Rh phenotypes</p>
          </div>
          <span className="text-xs bg-rose-50 text-[#F0003C] font-semibold px-2.5 py-1 rounded-full border border-rose-100">
            Real-Time Vault Data
          </span>
        </div>
        <div className="h-64 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="font-bold text-[#111B31] text-base">Stock Share Breakdown</h3>
          <p className="text-xs text-slate-500">Proportional volume by blood group</p>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
};
