import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Upload, 
  MapPin, Phone, Building2, Layers 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { VendorProfile } from '../types';

export interface VendorOnboardingProps {
  ownerUid: string;
  onComplete: (profile: Partial<VendorProfile>) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'Catering', 'Decorators', 'Venues', 'DJ & Sound', 
  'Photography', 'Makeup Artists', 'Cake & Desserts', 'Event Planners'
];

const DEFAULT_CITIES = ['Kolhapur', 'Pune', 'Mumbai', 'Goa', 'Bangalore', 'Delhi NCR', 'Nagpur', 'Nashik'];

export function VendorOnboarding({ ownerUid, onComplete }: VendorOnboardingProps) {
  const [step, setStep] = useState(1);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [citiesList, setCitiesList] = useState<string[]>(DEFAULT_CITIES);

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
    name: '',
    founderName: '',
    category: 'Catering',
    description: '',
    experience: '5+ Years Experience',
    location: 'Kolhapur',
    serviceArea: 'Within 50 km',
    phone: '',
    whatsapp: '',
    email: '',
    basePrice: 500,
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const profilePayload: Partial<VendorProfile> = {
        ownerUid,
        name: formData.name || 'Premier Celebrations Partner',
        founderName: formData.founderName || 'Founder',
        category: formData.category,
        categories: [formData.category],
        description: formData.description || 'Verified celebration service provider offering premium event management.',
        experience: formData.experience,
        location: formData.location,
        serviceArea: formData.serviceArea,
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        email: formData.email,
        basePrice: Number(formData.basePrice) || 500,
        rating: 5.0,
        reviewCount: 0,
        status: 'ACTIVE',
        images: [formData.imageUrl],
        busyDates: [],
        services: [
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
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5f8] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-8 border border-[#f2e4ec] shadow-xl space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">Step {step} of 6</span>
            <h2 className="text-xl font-extrabold text-[#1a0812]">Partner Onboarding Setup</h2>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`w-6 h-1.5 rounded-full transition ${s <= step ? 'bg-brand-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Brand & Founder */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">What is your Brand Name?</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Registered Business / Brand Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Royal Caterers & Events"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Founder / Head Specialist Name</label>
              <input
                type="text"
                value={formData.founderName}
                onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                placeholder="e.g. Chef Rahul Patil"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Select Primary Business Category</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition ${
                    formData.category === cat
                      ? 'border-brand-primary bg-brand-primary-light text-brand-primary shadow-2xs'
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
            <h3 className="text-sm font-extrabold text-gray-900">About your Craft & Experience</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Business Bio / Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell customers about your signature dishes, theme decoration, audio setups..."
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Years of Industry Experience</label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 10+ Years Experience"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}

        {/* Step 4: Location & Coverage */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Operating City & Service Radius</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Primary City Hub</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
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
                placeholder="e.g. Within 50 km / Across Maharashtra"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}

        {/* Step 5: Pricing Base */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Starting Price / Base Package</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">
                {formData.category === 'Catering' ? 'Starting Rate Per Plate (₹)' : 'Starting Package Rate (₹)'}
              </label>
              <input
                type="number"
                min={100}
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}

        {/* Step 6: Contact & Finish */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Direct Business Contacts</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Direct Calling Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Official Business Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@brand.com"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary"
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
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : <div></div>}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{loading ? 'Completing Setup...' : 'Launch Partner Profile'}</span>
              <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
