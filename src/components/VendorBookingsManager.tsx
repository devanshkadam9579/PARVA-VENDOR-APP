import React, { useState } from 'react';
import { 
  Calendar, Clock, DollarSign, CheckCircle, XCircle, MessageSquare, 
  AlertCircle, ShieldCheck, Download, MapPin, Phone, Mail, User,
  Sparkles, FileText, Info
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
          <p className="text-xs text-[#745b68] mt-0.5">Manage incoming bookings, contact customers, and verify payment schedules</p>
        </div>

        <div className="flex items-center gap-1 bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec] overflow-x-auto">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                filter === tab ? 'bg-white text-brand-primary shadow-xs' : 'text-[#745b68] hover:text-[#1a0812]'
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
          <h4 className="font-extrabold text-sm text-[#1a0812]">No bookings found</h4>
          <p className="text-xs text-[#745b68]">Bookings placed by clients on Parva will appear here in real time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBookings.map((b: any) => {
            const isPending = b.status === 'Pending' || b.status === 'VENDOR_PENDING';
            const isConfirmed = b.status === 'CONFIRMED' || b.status === 'Confirmed' || b.status === 'VENDOR_ACCEPTED';
            const isCancelled = b.status === 'Cancelled' || b.status === 'CANCELLED' || b.status === 'REJECTED' || b.status === 'REFUNDED';
            const isCompleted = b.status === 'Completed' || b.status === 'COMPLETED';

            const grossValue = b.totalPrice || b.amount || 0;
            // Advance paid online (5% + 18% GST on platform fee)
            const platformFee = Math.round(grossValue * 0.05);
            const gstFee = Math.round(platformFee * 0.18);
            const advancePaid = b.advancePaid || (platformFee + gstFee);
            const remainingAmount = b.remainingAmount !== undefined ? b.remainingAmount : (grossValue - platformFee);

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-[#f2e4ec] p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400">
                      ID: {b.bookingIdString || b.id.slice(0, 8)}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isConfirmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      isCancelled ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-[#1a0812] font-display">{b.serviceName || b.service?.name || 'Celebration Service'}</h3>

                  {/* Customer Information Card */}
                  <div className="mt-3 bg-gray-50/80 rounded-2xl p-3 border border-gray-100 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <User className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{b.customerName || b.userName || 'Client'}</span>
                      {b.guestCount ? <span className="text-gray-500 font-normal">({b.guestCount} Guests)</span> : null}
                    </div>

                    {(b.customerPhone || b.userPhone) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${b.customerPhone || b.userPhone}`} className="hover:underline text-brand-primary font-medium">
                          {b.customerPhone || b.userPhone}
                        </a>
                      </div>
                    )}

                    {(b.customerEmail || b.userEmail) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{b.customerEmail || b.userEmail}</span>
                      </div>
                    )}

                    {(b.eventAddress || b.location) && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>{b.eventAddress || b.location}</span>
                      </div>
                    )}

                    {b.notes && (
                      <div className="flex items-start gap-2 text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-100 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-[11px]"><strong>Style / Request:</strong> {b.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Payment Breakdown */}
                  <div className="bg-[#faf5f8] rounded-2xl p-3.5 border border-[#f2e4ec] mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Event Schedule:</span>
                      <span className="font-bold text-gray-900">{b.eventDate} ({b.eventTimeSlot || 'Standard Slot'})</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Total Agreed Price:</span>
                      <span className="font-bold text-gray-900">₹{grossValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      <span className="font-medium">Advance Paid via Parva:</span>
                      <span className="font-bold">₹{advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-brand-primary font-black pt-1 border-t border-[#f2e4ec]">
                      <span>Remaining Balance (Collect on Event):</span>
                      <span className="text-sm">₹{remainingAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-between gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onOpenChat(b.id)}
                    className="px-3.5 py-2 rounded-xl text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    <MessageSquare size={14} className="text-brand-primary" />
                    <span>Chat with Client</span>
                  </button>

                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectBooking(b.id)}
                        className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onAcceptBooking(b.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                      >
                        Accept Booking
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
