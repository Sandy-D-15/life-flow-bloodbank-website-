import React, { useState } from 'react';
import { 
  Droplet, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Heart, 
  ChevronDown, 
  ExternalLink,
  Lock,
  FileText
} from 'lucide-react';

interface ContactAndFooterProps {
  onNavigate: (tab: string) => void;
  onOpenAdminLogin?: () => void;
}

export const ContactAndFooter: React.FC<ContactAndFooterProps> = ({ onNavigate, onOpenAdminLogin }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeModal, setActiveModal] = useState<'guidelines' | 'privacy' | 'terms' | null>(null);

  const faqs = [
    {
      q: 'Who is eligible to donate blood?',
      a: 'Healthy individuals aged 18 to 65 weighing at least 50 kg (110 lbs). Donors must not have had acute viral infections, antibiotics within 48 hours, or recent major invasive surgery. A minimum 56-day rest period is legally required between whole blood donations.'
    },
    {
      q: 'How long does a blood donation session take?',
      a: 'The physical collection of 450ml of whole blood takes only 8 to 12 minutes. The entire appointment—including registration, confidential vital signs screening, and 15-minute refreshments rest—takes approximately 45 minutes.'
    },
    {
      q: 'How should I prepare before arriving for donation?',
      a: 'Hydrate well with 16-24 oz of water or natural fruit juice. Eat a nutritious meal rich in iron within 2-3 hours prior. Avoid fatty foods immediately before donation, and carry official photo identification.'
    },
    {
      q: 'How is donated blood tested for recipient safety?',
      a: 'Every single collected unit undergoes mandatory nucleic acid testing (NAT) and serological screening for HIV 1/2, Hepatitis B, Hepatitis C, Syphilis, and HTLV, alongside ABO and Rh blood grouping. Non-reactive units are preserved at +2°C to +6°C.'
    }
  ];

  return (
    <>
      {/* Contact & FAQ Section */}
      <section data-animate="reveal" id="contact" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left: Contact Information */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-semibold uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" />
                  Direct Logistics Liaison
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Connect with LifeFlow Command
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Our regional blood dispatch operations team operates continuously 24/7/365 to support emergency trauma networks, scheduled operations, and mobile voluntary drives.
                </p>
              </div>

              {/* Verified Contact Details Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">24/7 Emergency Dispatch Line</div>
                    <a href="tel:+18005553569" className="text-rose-600 font-bold hover:underline">
                      +1 (800) 555-FLOW (3569)
                    </a>
                    <div className="text-slate-400 text-[11px]">Direct line for hospital OR coordinators & trauma surgeons</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Official Clinical Inquiries</div>
                    <a href="mailto:operations@lifeflow-blood.org" className="text-slate-700 hover:text-rose-600 font-medium">
                      operations@lifeflow-blood.org
                    </a>
                    <div className="text-slate-400 text-[11px]">Requisition verifications & mobile drive coordination</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Regional Blood Vault & Lab Center</div>
                    <div className="text-slate-700 font-medium">
                      742 Healthcare Parkway, Suite 100, Metropolitan Medical District
                    </div>
                    <div className="text-slate-400 text-[11px]">Certified thermal blood vault and apheresis clinic</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Donor Intake Center Hours</div>
                    <div className="text-slate-700">Mon – Sat: 07:30 AM – 07:00 PM</div>
                    <div className="text-slate-700">Sun & Holidays: 08:00 AM – 02:00 PM</div>
                    <div className="text-slate-400 text-[11px]">Emergency hospital courier dispatches operate 24 hours daily</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-600 shrink-0" />
                <p className="text-xs text-rose-900">
                  Every 56 days, your body completely regenerates whole blood red cells. A 45-minute appointment renews hope for a surgical patient or child fighting cancer.
                </p>
              </div>
            </div>

            {/* Right: Donation Guidelines FAQ Accordion */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Clinical Guidelines & FAQs</h4>
                    <p className="text-xs text-slate-500">Essential facts on donation safety, eligibility, and blood processing</p>
                  </div>
                  <button
                    onClick={() => setActiveModal('guidelines')}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                  >
                    View Full Protocol
                  </button>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-900 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="p-4 text-xs text-slate-600 bg-white leading-relaxed border-t border-slate-100">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Privacy & Health Data Policy
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Terms of Requisition Service
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Website Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
            
            {/* Col 1: Brand */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <Droplet className="w-4 h-4 fill-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">LifeFlow Blood Bank</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Saving Lives, One Drop at a Time. Verified blood management, emergency trauma dispatch, and compassionate community donor connections.
              </p>
              <div className="text-[11px] text-slate-500">
                Regulated Under State Healthcare Cold-Chain Standards.
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-200 text-xs tracking-wider uppercase">Portal Navigation</h5>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                    Home Command
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('availability')} className="hover:text-white transition-colors cursor-pointer">
                    Live Blood Group Inventory
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('donor')} className="hover:text-white transition-colors cursor-pointer">
                    Register as Voluntary Donor
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('request')} className="hover:text-white transition-colors cursor-pointer">
                    Hospital Blood Requisition
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('track')} className="hover:text-white transition-colors cursor-pointer">
                    Track Existing Requisition
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Clinical Protocols */}
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-200 text-xs tracking-wider uppercase">Clinical Information</h5>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => setActiveModal('guidelines')} className="hover:text-white transition-colors cursor-pointer">
                    Donor Eligibility Criteria
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer">
                    Donor Confidentiality & HIPAA
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer">
                    Hospital Requisition Governance
                  </button>
                </li>
                <li>
                  <a href="#availability" className="hover:text-white transition-colors">
                    Transfusion Compatibility Matrix
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Encouragement & Hotline */}
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-200 text-xs tracking-wider uppercase">Emergency Hotline</h5>
              <div className="text-white font-mono text-sm font-bold bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                +1 (800) 555-FLOW
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                "The blood you donate gives someone another chance at life. One day that someone may be a close friend, a family member — or even you."
              </p>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span>© 2026 LifeFlow Blood Bank & Community Drives. All rights reserved.</span>
              {onOpenAdminLogin && (
                <button
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-2.5 py-1 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-900/80"
                  title="Medical Director and Administrative Staff Sign In"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Staff & Director Portal</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>Pathogen Tested</span>
              <span>·</span>
              <span>24/7 Cold-Chain</span>
              <span>·</span>
              <span>Voluntary Donors</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Modal for Guidelines / Privacy / Terms */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {activeModal === 'guidelines' && 'Official Blood Donation Guidelines'}
                {activeModal === 'privacy' && 'Patient & Donor Data Privacy Policy'}
                {activeModal === 'terms' && 'LifeFlow Terms of Requisition Service'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-800 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-3 leading-relaxed">
              {activeModal === 'guidelines' && (
                <>
                  <p>
                    <strong>1. Core Demographics:</strong> Donors must be 18 to 65 years old and weigh at least 50 kg (110 lbs).
                  </p>
                  <p>
                    <strong>2. Interval Rules:</strong> At least 56 days (8 weeks) must have elapsed since whole blood donation, or 112 days for double red blood cell apheresis.
                  </p>
                  <p>
                    <strong>3. Vital Signs & Hemoglobin:</strong> Prior to collection, every voluntary donor is screened on-site for pulse (50–100 bpm), blood pressure, and hemoglobin levels (&ge; 12.5 g/dL for females, &ge; 13.0 g/dL for males).
                  </p>
                  <p>
                    <strong>4. Temporary Deferrals:</strong> Acute flu or fever symptoms, dental surgery within 72 hours, recent body piercings or tattoos (&lt; 3 months), pregnancy, or travel to high-risk endemic areas require temporary postponement.
                  </p>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>
                    LifeFlow adheres strictly to medical privacy guidelines and HIPAA/GDPR health data principles.
                  </p>
                  <p>
                    <strong>Confidentiality:</strong> Donor contact information, blood phenotype data, and medical deferral history are encrypted at rest and accessible exclusively by certified medical personnel.
                  </p>
                  <p>
                    <strong>Hospital Requisition Integrity:</strong> Patient references submitted by healthcare providers are processed solely to verify clinical indication and chain-of-custody tracking.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>
                    <strong>1. Clinical Verification:</strong> Only authorized medical officers, hospital transfusion laboratories, or licensed EMS units may submit urgent hospital requisitions.
                  </p>
                  <p>
                    <strong>2. Inventory Allocation:</strong> Requisitions are prioritized based on clinical urgency (Critical trauma vs. Elective surgical). LifeFlow guarantees verified physical cold-chain inventory before fulfillment is authorized.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
