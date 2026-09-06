import React, { useState } from 'react';
import { 
  Calendar, Clock, DollarSign, CheckCircle, XCircle, MessageSquare, 
  AlertCircle, ShieldCheck, Download 
} from 'lucide-react';
import { VendorBooking } from '../types';

export interface VendorBookingsManagerProps {
  bookings: VendorBooking[];
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onOpenChat: (bookingId: string) => void;
}

export function VendorBookingsManager({
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onOpenChat
}: VendorBookingsManagerProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'pending') return b.status === 'Pending' || b.status === 'VENDOR_PENDING';
    if (filter === 'confirmed') return b.status === 'CONFIRMED' || b.status === 'Confirmed' || b.status === 'VENDOR_ACCEPTED';
    if (filter === 'completed') return b.status === 'Completed' || b.status === 'COMPLETED';
    if (filter === 'cancelled') return b.status === 'Cancelled' || b.status === 'CANCELLED' || b.status === 'REJECTED' || b.status === 'REFUNDED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a0812] font-display">Client Bookings Queue</h1>
          <p className="text-xs text-[#745b68] mt-0.5">Manage reservations, acceptance responses, and client schedules</p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec]">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                filter === tab ? 'bg-white text-[#1a0812] shadow-xs' : 'text-[#745b68] hover:text-[#1a0812]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#f2e4ec] text-center space-y-2">
          <Calendar size={36} className="mx-auto text-gray-400" />
          <h4 className="font-extrabold text-sm text-[#1a0812]">No bookings in this tab</h4>
          <p className="text-xs text-[#745b68]">Client bookings matching this filter will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const isPending = b.status === 'Pending' || b.status === 'VENDOR_PENDING';
            const isConfirmed = b.status === 'CONFIRMED' || b.status === 'Confirmed' || b.status === 'VENDOR_ACCEPTED';
            const isCancelled = b.status === 'Cancelled' || b.status === 'CANCELLED' || b.status === 'REJECTED' || b.status === 'REFUNDED';
            const isCompleted = b.status === 'Completed' || b.status === 'COMPLETED';

            const grossValue = b.totalPrice || 0;
            const platformCommission = Math.round(grossValue * 0.05);
            const netVendorPayout = grossValue - platformCommission;

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-[#f2e4ec] p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400">ID: {b.bookingIdString || b.id.slice(0, 8)}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isConfirmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      isCancelled ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-[#1a0812]">{b.serviceName}</h3>
                  <p className="text-xs text-[#745b68] mt-0.5">
                    Client: {b.customerName || 'Valued Client'} {b.guestCount ? `• ${b.guestCount} Guests` : ''}
                  </p>

                  <div className="bg-[#faf5f8] rounded-xl p-3 border border-[#f2e4ec] mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Event Schedule:</span>
                      <span className="font-bold text-gray-900">{b.eventDate} ({b.eventTimeSlot || 'Evening'})</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Gross Booking Value:</span>
                      <span className="font-bold text-gray-900">₹{grossValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Platform Commission (5%):</span>
                      <span className="text-gray-500">-₹{platformCommission.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-black text-brand-primary pt-1 border-t border-gray-200">
                      <span>Net Vendor Payout:</span>
                      <span>₹{netVendorPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onOpenChat(b.id)}
                    className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 border border-gray-200 transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    <MessageSquare size={14} className="text-brand-primary" />
                    <span>Client Chat</span>
                  </button>

                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectBooking(b.id)}
                        className="px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onAcceptBooking(b.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
