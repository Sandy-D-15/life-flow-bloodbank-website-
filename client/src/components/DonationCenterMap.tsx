import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ExternalLink, 
  Building2, 
  ShieldCheck,
  Compass,
  Sparkles,
  Calendar,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DonationCenter {
  id: string;
  name: string;
  category: 'Hospital Hub' | 'Regional Center' | 'Community Clinic' | 'Mobile Camp';
  address: string;
  city: string;
  lat: number;
  lng: number;
  operatingHours: string;
  phone: string;
  dailyCapacity: number;
  availableSlotsToday: number;
  nextAvailableSlotDate: string;
  nextAvailableSlotTime: string;
  features: string[];
  isRecommended?: boolean;
}

// Generate relative dates helper
const getRelativeDateStr = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const DONATION_CENTERS: DonationCenter[] = [
  {
    id: 'center-central',
    name: 'LifeFlow Central Transfusion Center',
    category: 'Regional Center',
    address: '104 Health Boulevard, Medical District',
    city: 'Metro City Center',
    lat: 19.0760,
    lng: 72.8777,
    operatingHours: '08:00 AM – 08:00 PM (Daily)',
    phone: '+91 (22) 2450-1000',
    dailyCapacity: 80,
    availableSlotsToday: 24,
    nextAvailableSlotDate: getRelativeDateStr(1),
    nextAvailableSlotTime: 'Morning (09:00 AM – 12:00 PM)',
    features: ['Platelet Apheresis', 'Whole Blood', 'Walk-in Screening', 'Air Conditioned Recovery Lounge'],
    isRecommended: true
  },
  {
    id: 'center-stjude',
    name: 'St. Jude Regional Blood Bank & Trauma Wing',
    category: 'Hospital Hub',
    address: '42 Red Cross Avenue, North Pavilion',
    city: 'North River',
    lat: 19.1200,
    lng: 72.8464,
    operatingHours: '24/7 Clinical Intake (Appt: 09:00 AM – 07:00 PM)',
    phone: '+91 (22) 2450-1001',
    dailyCapacity: 60,
    availableSlotsToday: 18,
    nextAvailableSlotDate: getRelativeDateStr(1),
    nextAvailableSlotTime: 'Afternoon (01:00 PM – 04:00 PM)',
    features: ['Emergency Trauma Intake', 'Whole Blood', 'Rapid Hemoglobin Lab'],
  },
  {
    id: 'center-metro',
    name: 'Metro Coast Community Donation Clinic',
    category: 'Community Clinic',
    address: '77 Sunrise Plaza, West Coast Promenade',
    city: 'West Coast District',
    lat: 19.0550,
    lng: 72.8300,
    operatingHours: '10:00 AM – 06:00 PM (Tue – Sun)',
    phone: '+91 (22) 2450-1002',
    dailyCapacity: 45,
    availableSlotsToday: 12,
    nextAvailableSlotDate: getRelativeDateStr(2),
    nextAvailableSlotTime: 'Morning (09:00 AM – 12:00 PM)',
    features: ['Weekend Drives', 'First-Time Donor Care', 'Refreshment Bar'],
  },
  {
    id: 'center-civic',
    name: 'East Ward Mobile Drive Camp #4',
    category: 'Mobile Camp',
    address: 'Community Civic Pavilion, Parkview Gate 2',
    city: 'East Ward',
    lat: 19.0880,
    lng: 72.9050,
    operatingHours: '09:00 AM – 05:00 PM (Special Camp)',
    phone: '+91 (22) 2450-1003',
    dailyCapacity: 50,
    availableSlotsToday: 30,
    nextAvailableSlotDate: getRelativeDateStr(3),
    nextAvailableSlotTime: 'Morning (09:00 AM – 12:00 PM)',
    features: ['Mobile Air-Van', 'Rapid Check-in', 'Certificate On-the-spot'],
  }
];

interface DonationCenterMapProps {
  selectedCenterId: string;
  onSelectCenter: (center: DonationCenter) => void;
  onSelectSlotDate?: (date: string, slot: string) => void;
}

export const DonationCenterMap: React.FC<DonationCenterMapProps> = ({
  selectedCenterId,
  onSelectCenter,
  onSelectSlotDate
}) => {
  const [activeCenter, setActiveCenter] = useState<DonationCenter>(
    DONATION_CENTERS.find(c => c.id === selectedCenterId) || DONATION_CENTERS[0]
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});

  useEffect(() => {
    const center = DONATION_CENTERS.find(c => c.id === selectedCenterId);
    if (center) {
      setActiveCenter(center);
    }
  }, [selectedCenterId]);

  // Haversine formula to compute km distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        const distMap: Record<string, number> = {};
        let closestCenter = DONATION_CENTERS[0];
        let minDistance = Infinity;

        DONATION_CENTERS.forEach((c) => {
          const d = calculateDistance(latitude, longitude, c.lat, c.lng);
          distMap[c.id] = d;
          if (d < minDistance) {
            minDistance = d;
            closestCenter = c;
          }
        });

        setDistances(distMap);
        setActiveCenter(closestCenter);
        onSelectCenter(closestCenter);
      },
      (err) => {
        setIsLocating(false);
        setLocateError('Unable to retrieve location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelect = (center: DonationCenter) => {
    setActiveCenter(center);
    onSelectCenter(center);
  };

  const handleBookNextSlot = (center: DonationCenter, e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect(center);
    if (onSelectSlotDate) {
      onSelectSlotDate(center.nextAvailableSlotDate, center.nextAvailableSlotTime);
    }
  };

  // Google Maps directions URL
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${activeCenter.lat},${activeCenter.lng}&destination_place_id=${encodeURIComponent(activeCenter.name)}`;
  
  // Google Maps embed URL
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeCenter.name + ', ' + activeCenter.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5">
      {/* Header and Geolocation Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-[#F0003C] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Select Donation Center & Location
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose your blood bank branch on Google Maps. Check next available slot dates and book directly.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-60"
        >
          <Compass className={`w-3.5 h-3.5 text-[#F0003C] ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating Nearest Center...' : 'Find Closest Center'}</span>
        </button>
      </div>

      {locateError && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          {locateError}
        </div>
      )}

      {/* Grid: Center Cards (Left) + Interactive Google Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Centers List Cards */}
        <div className="lg:col-span-6 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {DONATION_CENTERS.map((center) => {
            const isSelected = activeCenter.id === center.id;
            const distance = distances[center.id];

            return (
              <div
                key={center.id}
                onClick={() => handleSelect(center)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {center.name}
                      </span>
                      {center.isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-[#F0003C]">
                          <Sparkles className="w-2.5 h-2.5" /> Main Hub
                        </span>
                      )}
                      {distance !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          {distance} km away
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{center.address}, {center.city}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {center.operatingHours}
                      </span>
                    </div>

                    {/* Next Available Slot Date Chip & Quick Book Button */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Next Open Slot: <strong>{center.nextAvailableSlotDate}</strong> ({center.nextAvailableSlotTime.split(' ')[0]})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleBookNextSlot(center, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-[#F0003C] text-white text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Pick this center and set appointment date to next open slot"
                      >
                        <span>Select Next Slot</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#F0003C] border-[#F0003C] text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium mt-2">
                      {center.availableSlotsToday} slots free
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Google Map Frame & Navigation Box */}
        <div className="lg:col-span-6 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          
          {/* Active Center Banner */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider">
                Selected Donation Destination
              </div>
              <div className="text-xs sm:text-sm font-bold truncate max-w-xs">
                {activeCenter.name}
              </div>
            </div>

            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0003C] hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              title="Open directions in Google Maps app"
            >
              <Navigation className="w-3 h-3" />
              <span>Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Interactive Google Map Embed */}
          <div className="relative w-full h-[280px] bg-slate-100">
            <iframe
              title={`Map of ${activeCenter.name}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={googleMapsEmbedUrl}
              className="w-full h-full"
            />

            {/* Overlay Pin Badge */}
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] shadow-sm flex items-center gap-1.5 text-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#F0003C] animate-pulse" />
              <span className="font-semibold">{activeCenter.name}</span>
            </div>
          </div>

          {/* Location & Next Slot Details Footer */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Next Slot Date: <strong className="text-slate-900">{activeCenter.nextAvailableSlotDate}</strong> ({activeCenter.nextAvailableSlotTime})</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{activeCenter.phone}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
