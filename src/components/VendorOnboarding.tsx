import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Upload, 
  MapPin, Phone, Building2, Layers, AlertCircle, LogOut, ShieldAlert
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { VendorProfile } from '../types';

export interface VendorOnboardingProps {
  ownerUid: string;
  existingProfile?: VendorProfile | null;
  initialEmail?: string;
  initialPhone?: string;
  initialName?: string;
  onComplete: (profile: Partial<VendorProfile>) => Promise<void>;
  onLogout?: () => void;
}

const DEFAULT_CATEGORIES = [
  'Catering', 'Decorators', 'Venues', 'DJ & Sound', 
  'Photography', 'Makeup Artists', 'Cake & Desserts', 'Event Planners'
];

const DEFAULT_CITIES = ['Kolhapur', 'Pune', 'Mumbai', 'Goa', 'Bangalore', 'Delhi NCR', 'Nagpur', 'Nashik'];

export function VendorOnboarding({ 
  ownerUid, 
  existingProfile, 
  initialEmail, 
  initialPhone, 
  initialName, 
  onComplete,
  onLogout
}: VendorOnboardingProps) {
  const [step, setStep] = useState(1);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [citiesList, setCitiesList] = useState<string[]>(DEFAULT_CITIES);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      const items = snap.docs
        .map(d => d.data())
        .filter((d: any) => d.status !== 'inactive')
        .sort((a: any, b: any) => (Number(a.displayOrder) || 100) - (Number(b.displayOrder) || 100))
        .map((d: any) => d.name || d.id);
      if (items.length > 0) {
        setCategoriesList(items);
      }
    });

    const unsubCities = onSnapshot(doc(db, 'settings', 'cities'), (snap) => {
      const data = snap.data();
      const operational = Array.isArray(data?.operationalCities) && data.operationalCities.length > 0
        ? data.operationalCities
        : DEFAULT_CITIES;
      const blocked = Array.isArray(data?.blockedCities) ? data.blockedCities : [];
      const active = operational.filter((c: string) => !blocked.includes(c));
      if (active.length > 0) {
        setCitiesList(active);
      }
    });

    return () => {
      unsubCats();
      unsubCities();
    };
  }, []);

  const [formData, setFormData] = useState({
    name: existingProfile?.name || initialName || '',
    founderName: existingProfile?.founderName || '',
    category: existingProfile?.category || 'Catering',
    description: existingProfile?.description || '',
    experience: existingProfile?.experience || '5+ Years Experience',
    location: existingProfile?.location || 'Kolhapur',
    serviceArea: existingProfile?.serviceArea || 'Within 50 km',
    phone: existingProfile?.phone || initialPhone || '',
    whatsapp: existingProfile?.whatsapp || existingProfile?.phone || initialPhone || '',
    email: existingProfile?.email || initialEmail || '',
    basePrice: existingProfile?.basePrice || 500,
    imageUrl: existingProfile?.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
  });
  const [loading, setLoading] = useState(false);

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        setErrorMsg('Registered Business / Brand Name is required (minimum 2 characters).');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.category) {
        setErrorMsg('Please select your primary business category.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.description.trim() || formData.description.trim().length < 10) {
        setErrorMsg('Business Bio / Info is required (minimum 10 characters describing your services).');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.location) {
        setErrorMsg('Please select your primary operating city.');
        return false;
      }
    } else if (currentStep === 5) {
      if (Number(formData.basePrice) <= 0) {
        setErrorMsg('Please specify a valid base starting price greater than 0.');
        return false;
      }
    } else if (currentStep === 6) {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg('Valid 10-digit calling phone number is required.');
        return false;
      }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setErrorMsg('Valid official business email address is required.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    // Validate all required steps
    for (let s = 1; s <= 6; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    setLoading(true);
    try {
      const profilePayload: Partial<VendorProfile> = {
        ownerUid,
        name: formData.name.trim(),
        founderName: formData.founderName.trim() || 'Founder',
        category: formData.category,
        categories: [formData.category],
        description: formData.description.trim(),
        experience: formData.experience.trim() || '5+ Years Experience',
        location: formData.location,
        serviceArea: formData.serviceArea.trim() || 'Within 50 km',
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        email: formData.email.trim(),
        basePrice: Number(formData.basePrice) || 500,
        rating: existingProfile?.rating || 5.0,
        reviewCount: existingProfile?.reviewCount || 0,
        status: 'ACTIVE',
        images: existingProfile?.images?.length ? existingProfile.images : [formData.imageUrl],
        busyDates: existingProfile?.busyDates || [],
        kyc: existingProfile?.kyc || {
          status: 'NOT_SUBMITTED'
        },
        services: existingProfile?.services?.length ? existingProfile.services : [
          {
            id: `svc_${Date.now()}`,
            name: `${formData.category} Standard Package`,
            price: Number(formData.basePrice) || 500,
            description: 'Comprehensive setup and professional execution',
            status: 'ACTIVE'
          }
        ]
      };
      await onComplete(profilePayload);
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      setErrorMsg(err.message || 'Failed to complete profile onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5f8] flex flex-col items-center justify-center p-4">
      {/* Top Warning Banner */}
      <div className="w-full max-w-xl mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-rose-700 uppercase tracking-wider">Mandatory Details Required</span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md uppercase">KYC INCOMPLETE</span>
          </div>
          <p className="mt-1 text-rose-700 leading-relaxed">
            Vendors cannot access the workspace portal until <strong>Phone Number, Business Email, Business Name, and Info</strong> are provided.
          </p>
        </div>
      </div>

      <div className="bg-white w-full max-w-xl rounded-3xl p-8 border border-[#f2e4ec] shadow-xl space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">Step {step} of 6</span>
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">KYC Incomplete</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#1a0812]">Partner Profile Onboarding</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`w-5 h-1.5 rounded-full transition ${s <= step ? 'bg-brand-primary' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-gray-400 hover:text-red-600 transition p-1"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Validation Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Brand & Founder */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">What is your Business / Brand Name? *</h3>
              <p className="text-xs text-gray-500 mt-0.5">Required for marketplace identity and vendor registration</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Registered Business / Brand Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. Royal Caterers & Events"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Founder / Head Specialist Name</label>
              <input
                type="text"
                value={formData.founderName}
                onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                placeholder="e.g. Rahul Patil"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Select Primary Business Category *</h3>
              <p className="text-xs text-gray-500 mt-0.5">Determine which celebration service catalog you manage</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, category: cat });
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition cursor-pointer ${
                    formData.category === cat
                      ? 'border-brand-primary bg-brand-primary-light text-brand-primary shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Description & Experience */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Business Bio & Description Info *</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tell clients about your setup, specialty, and services offered</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Business Info / Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Tell customers about your signature dishes, theme decoration, audio setups..."
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white resize-none"
              />
              <span className="text-[10px] text-gray-400 block text-right">{formData.description.length} / 10 min chars</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Years of Industry Experience</label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 5+ Years Experience"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Step 4: Location & Coverage */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Operating City & Service Radius *</h3>
              <p className="text-xs text-gray-500 mt-0.5">Where your operations and celebration events are delivered</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Primary City Hub *</label>
              <select
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              >
                {citiesList.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Service Area Radius</label>
              <input
                type="text"
                value={formData.serviceArea}
                onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                placeholder="e.g. Within 50 km / Across City"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Step 5: Pricing Base */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Starting Price / Base Package *</h3>
              <p className="text-xs text-gray-500 mt-0.5">Standard entry price for clients exploring your service</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">
                {formData.category === 'Catering' ? 'Starting Rate Per Plate (₹) *' : 'Starting Package Rate (₹) *'}
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.basePrice}
                onChange={(e) => {
                  setFormData({ ...formData, basePrice: Number(e.target.value) });
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Step 6: Contact & Finish */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Direct Business Contacts *</h3>
              <p className="text-xs text-gray-500 mt-0.5">Mandatory for booking inquiry notifications, client communication & KYC</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Calling Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="+91 98765 43210"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Official Business Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="partner@yourbrand.com"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Saving Profile...' : 'Complete & Enter Portal'}</span>
              <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
