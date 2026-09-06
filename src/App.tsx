import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { VendorProfile, VendorBooking, VendorServiceItem } from './types';
import { VendorAuth } from './components/VendorAuth';
import { VendorOnboarding } from './components/VendorOnboarding';
import { VendorDashboard } from './components/VendorDashboard';
import { VendorBookingsManager } from './components/VendorBookingsManager';
import { VendorServicesManager } from './components/VendorServicesManager';
import { VendorAvailabilityManager } from './components/VendorAvailabilityManager';
import { VendorEarnings } from './components/VendorEarnings';
import { 
  LayoutDashboard, Calendar, Layers, DollarSign, Clock, 
  MessageSquare, User, LogOut, Sparkles, Bell 
} from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'services' | 'availability' | 'earnings' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(true);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && db) {
        // Fetch vendor profile by ownerUid
        const q = query(collection(db, 'vendors'), where('ownerUid', '==', user.uid));
        const snap = await onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const docData = snapshot.docs[0].data() as VendorProfile;
            docData.id = snapshot.docs[0].id;
            setVendorProfile(docData);
          } else {
            setVendorProfile(null);
          }
          setLoading(false);
        });
        return () => snap();
      } else {
        setVendorProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Vendor Bookings Listener
  useEffect(() => {
    if (!vendorProfile || !db) return;
    const q = query(collection(db, 'bookings'), where('vendorId', '==', vendorProfile.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bList: VendorBooking[] = [];
      snapshot.forEach((doc) => {
        bList.push({ id: doc.id, ...(doc.data() as any) });
      });
      setBookings(bList);
    });
    return () => unsubscribe();
  }, [vendorProfile]);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setVendorProfile(null);
  };

  const handleCompleteOnboarding = async (profileData: Partial<VendorProfile>) => {
    if (!currentUser || !db) return;
    const newVendorRef = doc(collection(db, 'vendors'));
    const fullProfile = {
      ...profileData,
      id: newVendorRef.id,
      ownerUid: currentUser.uid,
      createdAt: new Date().toISOString()
    };
    await setDoc(newVendorRef, fullProfile);
    setVendorProfile(fullProfile as VendorProfile);
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (!vendorProfile) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/vendor/bookings/${bookingId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          vendorId: vendorProfile.id
        })
      });
      if (!res.ok && db) {
        // Fallback to direct Firestore update
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'Confirmed',
          vendorAcceptedAt: new Date().toISOString()
        });
      }
    } catch {
      if (db) {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'Confirmed',
          vendorAcceptedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!vendorProfile) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/vendor/bookings/${bookingId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          vendorId: vendorProfile.id,
          reason: 'Vendor unavailable on requested schedule'
        })
      });
      if (!res.ok && db) {
        // Fallback to direct Firestore update
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'Rejected',
          rejectedAt: new Date().toISOString()
        });
      }
    } catch {
      if (db) {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'Rejected',
          rejectedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleSaveServices = async (services: VendorServiceItem[]) => {
    if (!vendorProfile || !db) return;
    await updateDoc(doc(db, 'vendors', vendorProfile.id), { services });
  };

  const handleUpdateAvailability = async (busyDates: string[], busySlots: Record<string, string[]>) => {
    if (!vendorProfile || !db) return;
    await updateDoc(doc(db, 'vendors', vendorProfile.id), { busyDates, busySlots });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf5f8] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <VendorAuth onAuthSuccess={(u) => setCurrentUser(u)} />;
  }

  // Needs Onboarding
  if (!vendorProfile) {
    return (
      <VendorOnboarding
        ownerUid={currentUser.uid}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf5f8] text-[#1a0812] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#f2e4ec] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-primary text-white font-black text-lg flex items-center justify-center shadow-xs">
              P
            </div>
            <div>
              <span className="font-extrabold text-lg text-brand-primary tracking-tight font-display block leading-tight">
                parva partner
              </span>
              <span className="text-[10px] text-[#745b68] font-bold">
                {vendorProfile.name}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec]">
            {(['dashboard', 'bookings', 'services', 'availability', 'earnings'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  activeTab === tab
                    ? 'bg-white text-brand-primary shadow-xs'
                    : 'text-[#745b68] hover:text-[#1a0812]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition flex items-center gap-1"
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <VendorDashboard
            vendor={vendorProfile}
            bookings={bookings}
            onNavigate={(t) => setActiveTab(t as any)}
            onAcceptBooking={handleAcceptBooking}
            onRejectBooking={handleRejectBooking}
          />
        )}

        {activeTab === 'bookings' && (
          <VendorBookingsManager
            bookings={bookings}
            onAcceptBooking={handleAcceptBooking}
            onRejectBooking={handleRejectBooking}
            onOpenChat={(bId) => {}}
          />
        )}

        {activeTab === 'services' && (
          <VendorServicesManager
            services={vendorProfile.services || []}
            onSaveServices={handleSaveServices}
            category={vendorProfile.category}
          />
        )}

        {activeTab === 'availability' && (
          <VendorAvailabilityManager
            busyDates={vendorProfile.busyDates || []}
            busySlots={vendorProfile.busySlots || {}}
            onUpdateAvailability={handleUpdateAvailability}
          />
        )}

        {activeTab === 'earnings' && (
          <VendorEarnings bookings={bookings} />
        )}
      </main>

      {/* Mobile Bottom Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#f2e4ec] py-2 px-4 flex justify-around z-50">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'dashboard' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'bookings' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <Calendar size={18} />
          <span>Bookings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'services' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <Layers size={18} />
          <span>Services</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('availability')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'availability' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <Clock size={18} />
          <span>Calendar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'earnings' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <DollarSign size={18} />
          <span>Earnings</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
