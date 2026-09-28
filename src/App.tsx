import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, or 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { VendorProfile, VendorBooking, VendorServiceItem, VendorKycData } from './types';
import { VendorAuth } from './components/VendorAuth';
import { VendorOnboarding } from './components/VendorOnboarding';
import { VendorDashboard } from './components/VendorDashboard';
import { VendorBookingsManager } from './components/VendorBookingsManager';
import { VendorServicesManager } from './components/VendorServicesManager';
import { VendorAvailabilityManager } from './components/VendorAvailabilityManager';
import { VendorEarnings } from './components/VendorEarnings';
import { VendorChatModal } from './components/VendorChatModal';
import { VendorMessagesView } from './components/VendorMessagesView';
import { VendorKycManager } from './components/VendorKycManager';
import { ParvaLogo } from './components/ParvaLogo';
import { 
  LayoutDashboard, Calendar, Layers, DollarSign, Clock, 
  MessageSquare, User, LogOut, Sparkles, Bell, ShieldCheck,
  CheckCircle2, AlertCircle
} from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'messages' | 'services' | 'availability' | 'earnings' | 'kyc'>('dashboard');
  const [chatBooking, setChatBooking] = useState<VendorBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'alert' } | null>(null);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && db) {
        // Fetch vendor profile by ownerUid
        const q = query(collection(db, 'vendors'), where('ownerUid', '==', user.uid));
        const snap = onSnapshot(q, (snapshot) => {
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

  // 2. Fetch Vendor Bookings Listener (Broadened to ensure 100% sync)
  useEffect(() => {
    if (!vendorProfile || !db) return;
    
    // Listen to all bookings collection to ensure matching whether vendorId or vendor.name or vendorOwnerUid is saved
    const bookingsColl = collection(db, 'bookings');
    const unsubscribe = onSnapshot(bookingsColl, (snapshot) => {
      const bList: VendorBooking[] = [];
      const currentVendorId = vendorProfile.id;
      const currentVendorName = vendorProfile.name?.toLowerCase().trim();
      const currentOwnerUid = currentUser?.uid;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const bVendorId = data.vendorId || data.vendor?.id;
        const bVendorName = (data.vendor?.name || data.vendorName || '')?.toLowerCase().trim();
        const bVendorOwner = data.vendorOwnerUid || data.vendor?.ownerUid;

        if (
          bVendorId === currentVendorId || 
          (currentOwnerUid && bVendorOwner === currentOwnerUid) ||
          (currentVendorName && bVendorName && (bVendorName === currentVendorName || bVendorName.includes(currentVendorName) || currentVendorName.includes(bVendorName)))
        ) {
          bList.push({ id: docSnap.id, ...data });
        }
      });

      // Sort newest first
      bList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // Trigger notification if new bookings arrive
      if (bookings.length > 0 && bList.length > bookings.length) {
        setNotification({
          message: '🎉 New client booking received! Check your Bookings tab.',
          type: 'success'
        });
      }

      setBookings(bList);
    });

    return () => unsubscribe();
  }, [vendorProfile, currentUser]);

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
    // Extract service images if any to update root images array for instant marketplace display
    const allImages = [...(vendorProfile.images || [])];
    services.forEach(s => {
      if (s.images && Array.isArray(s.images)) {
        s.images.forEach(img => {
          if (img && !allImages.includes(img)) allImages.push(img);
        });
      }
    });

    await updateDoc(doc(db, 'vendors', vendorProfile.id), { 
      services,
      images: allImages,
      updatedAt: new Date().toISOString()
    });

    setNotification({
      message: '✨ Services & Catalog updated and synchronized to main marketplace!',
      type: 'success'
    });
  };

  const handleUpdateAvailability = async (busyDates: string[], busySlots: Record<string, string[]>) => {
    if (!vendorProfile || !db) return;
    await updateDoc(doc(db, 'vendors', vendorProfile.id), { 
      busyDates, 
      busySlots,
      updatedAt: new Date().toISOString()
    });
    setNotification({
      message: '📅 Availability calendar updated successfully!',
      type: 'success'
    });
  };

  const handleUpdateKyc = async (kycData: VendorKycData) => {
    if (!vendorProfile || !db) return;
    const now = new Date().toISOString();

    // 1. Save full KYC payload to dedicated vendor_kyc collection (isolated doc)
    await setDoc(doc(db, 'vendor_kyc', vendorProfile.id), {
      ...kycData,
      vendorId: vendorProfile.id,
      vendorName: vendorProfile.name,
      vendorCategory: vendorProfile.category,
      updatedAt: now
    }, { merge: true });

    // 2. Save KYC summary & status to vendors collection
    await updateDoc(doc(db, 'vendors', vendorProfile.id), {
      kyc: kycData,
      'kyc.status': kycData.status || 'PENDING_VERIFICATION',
      updatedAt: now
    });
    setVendorProfile(prev => prev ? { ...prev, kyc: kycData } : null);
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

  const kycStatus = vendorProfile.kyc?.status || 'NOT_SUBMITTED';

  return (
    <div className="min-h-screen bg-[#faf5f8] text-[#1a0812] flex flex-col font-sans">
      {/* Top Notification Toast */}
      {notification && (
        <div className="bg-brand-primary text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md relative z-50">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{notification.message}</span>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="ml-3 text-white/80 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-[#f2e4ec] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ParvaLogo size="sm" />
            <div className="border-l border-gray-200 pl-3">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#1a0812] tracking-tight font-display block leading-tight">
                  {vendorProfile.name}
                </span>
                {vendorProfile.isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Partner" />
                )}
              </div>
              <span className="text-[10px] text-[#745b68] font-bold block">
                {vendorProfile.category} • Partner Portal
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec]">
            {(['dashboard', 'bookings', 'messages', 'services', 'availability', 'earnings', 'kyc'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-white text-brand-primary shadow-xs'
                    : 'text-[#745b68] hover:text-[#1a0812]'
                }`}
              >
                {tab === 'messages' && <MessageSquare size={13} />}
                {tab === 'kyc' && (
                  <ShieldCheck size={13} className={kycStatus === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'} />
                )}
                <span>{tab === 'kyc' ? 'KYC Verification' : tab}</span>
                {tab === 'kyc' && kycStatus !== 'VERIFIED' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('kyc')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                kycStatus === 'VERIFIED' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{kycStatus === 'VERIFIED' ? 'Verified Partner' : 'KYC Verification'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition flex items-center gap-1"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Log Out</span>
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
            onOpenChat={(bId) => {
              const found = bookings.find((b) => b.id === bId);
              if (found) setChatBooking(found);
            }}
          />
        )}

        {activeTab === 'messages' && (
          <VendorMessagesView
            bookings={bookings}
            vendor={vendorProfile}
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
            bookings={bookings}
            onUpdateAvailability={handleUpdateAvailability}
          />
        )}

        {activeTab === 'earnings' && (
          <VendorEarnings bookings={bookings} />
        )}

        {activeTab === 'kyc' && (
          <VendorKycManager
            vendor={vendorProfile}
            onUpdateKyc={handleUpdateKyc}
          />
        )}
      </main>

      {/* Direct Customer Chat Modal */}
      {chatBooking && (
        <VendorChatModal
          booking={chatBooking}
          vendor={vendorProfile}
          isOpen={Boolean(chatBooking)}
          onClose={() => setChatBooking(null)}
        />
      )}

      {/* Mobile Bottom Dock */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#f2e4ec] py-2 px-1 flex justify-around z-50 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'dashboard' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard size={17} />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'bookings' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <Calendar size={17} />
          <span>Bookings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'messages' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <MessageSquare size={17} />
          <span>Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'services' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <Layers size={17} />
          <span>Services</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('availability')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'availability' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <Clock size={17} />
          <span>Calendar</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
            activeTab === 'kyc' ? 'text-brand-primary' : 'text-gray-400'
          }`}
        >
          <ShieldCheck size={17} className={kycStatus === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'} />
          <span>KYC</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
