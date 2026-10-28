import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar.js';
import { Hero } from './components/Hero.js';
import { QuickActions } from './components/QuickActions.js';
import { LiveInventoryOverview } from './components/LiveInventoryOverview.js';
import { BloodAvailability } from './components/BloodAvailability.js';
import { DonorRegistration } from './components/DonorRegistration.js';
import { BloodRequestForm } from './components/BloodRequestForm.js';
import { RequestTracker } from './components/RequestTracker.js';
import { AdminPortal } from './components/AdminPortal.js';
import { ContactAndFooter } from './components/ContactAndFooter.js';
import { 
  BloodStockItem, 
  DashboardStats, 
  AdminUser, 
  BloodGroup, 
  Donor, 
  BloodRequest 
} from './types/index.js';
import { 
  Heart, 
  Droplet, 
  ShieldCheck, 
  Activity, 
  AlertCircle, 
  Truck,
  CheckCircle2
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const getInitialTab = (): string => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
    }
  }
  return 'home';
};

export default function App() {
  const mainRef = useRef<HTMLElement | null>(null);
  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [inventory, setInventory] = useState<BloodStockItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  
  // Auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Workflow bridge states
  const [preselectedBloodGroup, setPreselectedBloodGroup] = useState<BloodGroup | undefined>(undefined);
  const [prefilledTrackingId, setPrefilledTrackingId] = useState<string | undefined>(undefined);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // A restrained motion system: animate real content, never hide it if JS is unavailable.
  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const revealItems = gsap.utils.toArray<HTMLElement>('[data-animate="reveal"]', mainRef.current);
    revealItems.forEach((item) => {
      gsap.fromTo(item,
        { y: 18, opacity: 0.01 },
        { y: 0, opacity: 1, duration: 0.65, ease: 'power2.out',
          scrollTrigger: { trigger: item, start: 'top 88%', once: true } }
      );
    });

    const heroItems = gsap.utils.toArray<HTMLElement>('[data-animate="hero"]', mainRef.current);
    if (heroItems.length) {
      gsap.fromTo(heroItems,
        { y: 16, opacity: 0.01 },
        { y: 0, opacity: 1, duration: 0.72, stagger: 0.11, ease: 'power2.out', delay: 0.08 }
      );
    }
  }, { scope: mainRef, dependencies: [currentTab], revertOnUpdate: true });

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 5000);
  };

  // Fetch Inventory
  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      console.error('Failed to load blood inventory:', err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Check saved session
  useEffect(() => {
    const savedToken = localStorage.getItem('lifeflow_admin_token');
    const savedUser = localStorage.getItem('lifeflow_admin_user');
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('lifeflow_admin_token');
        localStorage.removeItem('lifeflow_admin_user');
      }
    }

    fetchInventory();
    fetchStats();

    // Keyboard shortcut (Ctrl + Shift + A) to quickly toggle Admin Portal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentTab((prev) => (prev === 'admin' ? 'home' : 'admin'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Listen for browser back/forward or hash change
    const handlePopState = () => {
      const tab = getInitialTab();
      setCurrentTab(tab);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleAdminLogin = (token: string, user: AdminUser) => {
    setAuthToken(token);
    setAdminUser(user);
    localStorage.setItem('lifeflow_admin_token', token);
    localStorage.setItem('lifeflow_admin_user', JSON.stringify(user));
    showToast(`Welcome, ${user.name}. Administrator access granted.`);
  };

  const handleAdminLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {}
    }
    setAuthToken(null);
    setAdminUser(null);
    localStorage.removeItem('lifeflow_admin_token');
    localStorage.removeItem('lifeflow_admin_user');
    showToast('Administrator session ended.');
    if (currentTab === 'admin') {
      handleNavigate('home');
    }
  };

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const newUrl = tab === 'home' ? window.location.pathname : `?tab=${tab}`;
      window.history.replaceState(null, '', newUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBecomeDonorWithGroup = (group?: BloodGroup) => {
    setPreselectedBloodGroup(group);
    handleNavigate('donor');
  };

  const handleRequestBloodWithGroup = (group?: BloodGroup) => {
    setPreselectedBloodGroup(group);
    handleNavigate('request');
  };

  const handleTrackRequestWithId = (id: string) => {
    setPrefilledTrackingId(id);
    handleNavigate('track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-rose-500 selection:text-white">
      {/* Toast Notification Alert with smooth Motion entrance */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700/80 flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-medium pr-2">{toastNotification}</span>
            <button 
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        adminUser={adminUser}
        onOpenAdminLogin={() => handleNavigate('admin')}
        onAdminLogout={handleAdminLogout}
        criticalCount={stats?.criticalRequests || 0}
      />

      {/* Main App Content Router */}
      <main ref={mainRef} className="flex-1">
        {currentTab === 'home' && (
          <>
            <Hero stats={stats} onNavigate={handleNavigate} />
            
            {/* Quick Actions Bar with Together We Save Lives card */}
            <QuickActions onNavigate={handleNavigate} />

            {/* Live Inventory 8-Group Overview & 7-Day Usage Line Chart */}
            <LiveInventoryOverview
              inventory={inventory}
              onViewAll={() => handleNavigate('availability')}
              onRequestBlood={handleRequestBloodWithGroup}
              onBecomeDonor={handleBecomeDonorWithGroup}
            />

            {/* Mission & Impact Highlights Section */}
            <section data-animate="reveal" className="py-16 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs font-semibold uppercase text-rose-600 tracking-wider">
                    Our Clinical Mission
                  </span>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                    Why the LifeFlow Protocol Matters
                  </h2>
                  <p className="text-sm text-slate-600 mt-2">
                    Blood cannot be manufactured. It is an irreproducible gift that only one human being can provide to another.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div data-animate="reveal" className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                      <Droplet className="w-6 h-6 fill-rose-600 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">1 Donation = 3 Lives Saved</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Every standard 450ml whole blood unit is separated into packed red cells, fresh platelets, and plasma—providing targeted therapy for multiple critically ill patients.
                    </p>
                  </div>

                  <div data-animate="reveal" className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                      <Truck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Cold-Chain Transparency</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Units are tracked under uninterrupted thermal surveillance (+2°C to +6°C for whole blood and red cells). Certified dispatch to emergency triage rooms within minutes.
                    </p>
                  </div>

                  <div data-animate="reveal" className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Zero Data Falsification</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      LifeFlow enforces strict backend validation: we never promise or mark a requisition as fulfilled unless verified stock actually exists and is allocated in our cold bank.
                    </p>
                  </div>
                </div>

                {/* Callout Strip */}
                <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div>
                    <h3 className="text-2xl font-bold">Ready to make a life-saving impact?</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Join hundreds of voluntary donors in our regional network or coordinate urgent blood logistics for your healthcare facility.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleNavigate('donor')}
                      className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Join Donor Network
                    </button>
                    <button
                      onClick={() => handleNavigate('request')}
                      className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Hospital Order
                    </button>
                  </div>
                </div>

              </div>
            </section>
          </>
        )}

        {currentTab === 'availability' && (
          <BloodAvailability
            inventory={inventory}
            isLoading={isLoadingInventory}
            onRefresh={fetchInventory}
            onRequestBlood={handleRequestBloodWithGroup}
            onBecomeDonor={handleBecomeDonorWithGroup}
          />
        )}

        {currentTab === 'donor' && (
          <DonorRegistration
            initialBloodGroup={preselectedBloodGroup}
            onSuccess={(donor) => {
              fetchStats();
              showToast(`Donor registered: ${donor.fullName} (${donor.bloodGroup})`);
            }}
          />
        )}

        {currentTab === 'request' && (
          <BloodRequestForm
            initialBloodGroup={preselectedBloodGroup}
            inventory={inventory}
            onSuccess={(request) => {
              fetchStats();
              showToast(`Request ${request.id} submitted for ${request.hospitalName}`);
            }}
            onTrackRequest={handleTrackRequestWithId}
          />
        )}

        {currentTab === 'track' && (
          <RequestTracker initialTrackingId={prefilledTrackingId} />
        )}

        {currentTab === 'admin' && (
          <AdminPortal
            adminUser={adminUser}
            authToken={authToken}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            inventory={inventory}
            onRefreshInventory={() => {
              fetchInventory();
              fetchStats();
            }}
            onBackToPublic={() => handleNavigate('home')}
          />
        )}

        {currentTab === 'contact' && (
          <div className="py-8 bg-slate-50">
            {/* Shows Contact Section directly */}
          </div>
        )}

        {/* Global Footer & Clinical Guidelines across all views */}
        <ContactAndFooter 
          onNavigate={handleNavigate} 
          onOpenAdminLogin={() => handleNavigate('admin')} 
        />
      </main>
    </div>
  );
}
