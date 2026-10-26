import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  PhoneCall, 
  ShieldCheck, 
  Menu, 
  X, 
  LogOut, 
  UserCircle2, 
  Activity, 
  Clock,
  HeartPulse,
  Home,
  User,
  FileText,
  MapPin,
  Info,
  Users
} from 'lucide-react';
import { AdminUser } from '../types/index.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  adminUser: AdminUser | null;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  criticalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  adminUser,
  onOpenAdminLogin,
  onAdminLogout,
  criticalCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'availability', label: 'Blood Availability', icon: Droplet },
    { id: 'donor', label: 'Become a Donor', icon: User },
    { id: 'request', label: 'Request Blood', icon: FileText },
    { id: 'track', label: 'Track Request', icon: MapPin },
    { id: 'contact', label: 'Contact & Guidelines', icon: Info },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      {/* Emergency Top Banner */}
      <div className="bg-[#111625] text-slate-200 text-xs py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-rose-500 font-medium">
              <Activity className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              Rapid Emergency Dispatch:
            </span>
            <span className="hidden md:inline text-slate-300">Cold-chain-certified medical courier logistics</span>
            <span className="bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-rose-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              {criticalCount > 0 ? criticalCount : 4} Critical Emergency Request Active
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-[11px]">
            <a 
              href="tel:18005553569" 
              className="flex items-center gap-1 hover:text-white transition-colors font-medium text-slate-200"
            >
              <PhoneCall className="w-3 h-3 text-slate-400" />
              24/7 Hotline: +1 (800) 555-FLOW
            </a>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="flex items-center gap-1 text-slate-400 hidden sm:flex">
              <Clock className="w-3 h-3" />
              Avg Transit: &lt; 45 mins
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            {adminUser ? (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${adminUser.role === 'staff' ? 'bg-rose-400' : 'bg-emerald-400'} animate-pulse`} />
                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="text-slate-200 hover:text-white font-medium text-[11px] cursor-pointer flex items-center gap-1"
                >
                  {adminUser.role === 'staff' ? '👥 Camp Staff Station' : '🛡️ Director Command'}
                  <span className="text-slate-400">({adminUser.name.split(' ')[0]})</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                title="Authorized Medical Director & Administrative Staff Sign In"
              >
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span>Staff Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <button 
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F0003C] to-red-600 flex items-center justify-center shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform duration-200">
              <Droplet className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#111B31] group-hover:text-[#F0003C] transition-colors">
                  LifeFlow
                </span>
                <span className="text-[10px] uppercase font-bold text-[#F0003C] tracking-wider">
                  BLOOD BANK
                </span>
                {currentTab === 'admin' && (
                  <span className="ml-1 text-[9px] font-mono font-bold bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700 uppercase tracking-widest">
                    Portal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Saving Lives, One Drop at a Time
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-[13px] font-medium text-slate-600">
            {currentTab === 'admin' ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Exit operations command and return to public website"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>← Exit to Public Website</span>
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 px-3 py-1 bg-slate-100/90 rounded-lg border border-slate-200">
                  {adminUser?.role === 'staff' ? (
                    <>
                      <Users className="w-3.5 h-3.5 text-rose-600" />
                      <span>Camp Phlebotomy & Intake Station</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Medical Director Operations Command</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              navItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`relative px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'text-[#F0003C] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavPill"
                        className="absolute inset-0 bg-rose-50/90 border border-rose-200/90 rounded-full shadow-xs"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F0003C] fill-rose-100' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </span>
                  </button>
                );
              })
            )}
          </nav>

          {/* Right Action: Admin / Urgent Requisition */}
          <div className="hidden sm:flex items-center gap-3">
            {adminUser ? (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {adminUser.role === 'staff' ? (
                    <>
                      <Users className="w-4 h-4 text-rose-500" />
                      <span>Camp Staff</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Director Command</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAdminLogout}
                  title="Sign out of admin portal"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : null}

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavClick('request')}
              className="flex items-center gap-2 text-xs font-semibold bg-[#F0003C] hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/25 active:scale-95 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-white" />
              <span>Urgent Requisition</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            {adminUser && (
              <button
                onClick={() => handleNavClick('admin')}
                className="p-2 text-emerald-700 bg-emerald-50 rounded-lg text-xs font-medium cursor-pointer"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="xl:hidden border-t border-slate-200 bg-white px-4 py-5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1.5">
              {currentTab === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-2 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-rose-600" />
                  <span>← Exit to Public Website</span>
                </button>
              )}
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-rose-50 text-[#F0003C] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F0003C]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">

                <button
                  onClick={() => handleNavClick('request')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-[#F0003C] rounded-lg shadow-sm cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4" />
                  Request Emergency Blood
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
