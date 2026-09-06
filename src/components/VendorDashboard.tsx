import React from 'react';
import { 
  Calendar, Clock, DollarSign, Star, CheckCircle, XCircle, 
  ArrowRight, ShieldCheck, TrendingUp, AlertCircle 
} from 'lucide-react';
import { VendorProfile, VendorBooking } from '../types';

export interface VendorDashboardProps {
  vendor: VendorProfile;
  bookings: VendorBooking[];
  onNavigate: (tab: string) => void;
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
}

export function VendorDashboard({
  vendor,
  bookings,
  onNavigate,
  onAcceptBooking,
  onRejectBooking
}: VendorDashboardProps) {
  const pendingBookings = bookings.filter(b => b.status === 'Pending' || b.status === 'VENDOR_PENDING');
  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'Confirmed');
  
  const totalRevenue = bookings
    .filter(b => b.status === 'Completed' || b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#f2e4ec] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">Verified Partner Workspace</span>
          <h1 className="text-2xl font-extrabold text-[#1a0812] font-display mt-0.5">
            Good day, {vendor.name}
          </h1>
          <p className="text-xs text-[#745b68] mt-1">
            {vendor.category} • {vendor.location} • {vendor.rating.toFixed(1)} ★ Rating
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('availability')}
          className="px-4 py-2 bg-brand-primary-light hover:bg-pink-100 text-brand-primary border border-brand-border text-xs font-extrabold rounded-xl transition"
        >
          Manage Calendar & Slots
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Action Needed</span>
          <h3 className="text-2xl font-black text-[#1a0812]">{pendingBookings.length}</h3>
          <p className="text-xs text-[#745b68]">Pending Booking Requests</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Confirmed</span>
          <h3 className="text-2xl font-black text-[#1a0812]">{upcomingBookings.length}</h3>
          <p className="text-xs text-[#745b68]">Upcoming Reserved Events</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-brand-primary tracking-wider">Gross Bookings</span>
          <h3 className="text-2xl font-black text-[#1a0812]">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-[#745b68]">Active Pipeline Value</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Reputation</span>
          <h3 className="text-2xl font-black text-[#1a0812]">{vendor.rating.toFixed(1)} ★</h3>
          <p className="text-xs text-[#745b68]">{vendor.reviewCount || 0} Verified Reviews</p>
        </div>
      </div>

      {/* Pending Requests Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#1a0812] font-display">
            Pending Booking Requests ({pendingBookings.length})
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('bookings')}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#f2e4ec] text-center space-y-2">
            <CheckCircle size={32} className="mx-auto text-emerald-500" />
            <h4 className="font-extrabold text-sm text-[#1a0812]">All caught up!</h4>
            <p className="text-xs text-[#745b68]">No pending booking requests requiring immediate response.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-amber-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                    Pending Acceptance
                  </span>
                  <span className="text-xs font-black text-[#1a0812]">
                    ₹{(b.totalPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-[#1a0812]">{b.serviceName}</h4>
                  <p className="text-xs text-[#745b68] mt-0.5">
                    Client: {b.customerName || 'Verified User'} • {b.guestCount ? `${b.guestCount} Guests` : ''}
                  </p>
                </div>

                <div className="bg-[#faf5f8] rounded-xl p-2.5 border border-[#f2e4ec] text-xs flex justify-between">
                  <span>📅 {b.eventDate}</span>
                  <span className="capitalize">⏰ {b.eventTimeSlot || 'Evening Slot'}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onAcceptBooking(b.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition"
                  >
                    Accept Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectBooking(b.id)}
                    className="px-4 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold text-xs py-2 rounded-xl transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
