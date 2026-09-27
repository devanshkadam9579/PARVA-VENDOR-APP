import React, { useState } from 'react';
import { 
  MessageSquare, User, Calendar, MapPin, Phone, 
  Send, CheckCheck, Clock, Search, ChevronRight, Sparkles 
} from 'lucide-react';
import { VendorBooking, VendorProfile } from '../types';
import { VendorChatModal } from './VendorChatModal';

export interface VendorMessagesViewProps {
  bookings: VendorBooking[];
  vendor: VendorProfile;
}

export function VendorMessagesView({
  bookings,
  vendor
}: VendorMessagesViewProps) {
  const [selectedBooking, setSelectedBooking] = useState<VendorBooking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Only bookings that have client info
  const activeChatClients = bookings.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.customerName && b.customerName.toLowerCase().includes(term)) ||
      (b.serviceName && b.serviceName.toLowerCase().includes(term)) ||
      (b.customerPhone && b.customerPhone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a0812] font-display flex items-center gap-2">
            <MessageSquare size={24} className="text-brand-primary" />
            <span>Customer Direct Chat</span>
          </h1>
          <p className="text-xs text-[#745b68] mt-0.5">
            Real-time messaging, inquiries, and coordination with booked event clients
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients or services..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#f2e4ec] rounded-2xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
          />
        </div>
      </div>

      {activeChatClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#f2e4ec] text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#faf5f8] text-brand-primary flex items-center justify-center mx-auto border border-[#f2e4ec]">
            <MessageSquare size={24} />
          </div>
          <h4 className="font-extrabold text-sm text-[#1a0812]">No client conversations yet</h4>
          <p className="text-xs text-[#745b68] max-w-sm mx-auto">
            When clients book your celebration packages, direct chat channels will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChatClients.map((b) => {
            const rawPhone = b.customerPhone || '';
            const cleanPhone = rawPhone.replace(/\D/g, '');

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="bg-white hover:bg-[#fdf9fc] rounded-3xl border border-[#f2e4ec] p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-primary text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {(b.customerName || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1a0812] group-hover:text-brand-primary transition">
                          {b.customerName || 'Celebration Client'}
                        </h3>
                        <p className="text-[11px] text-[#745b68]">{b.customerPhone || 'Contact details shared'}</p>
                      </div>
                    </div>

                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#faf5f8] text-brand-primary border border-[#f2e4ec]">
                      {b.status}
                    </span>
                  </div>

                  <div className="bg-[#faf5f8] rounded-2xl p-3 border border-[#f2e4ec] space-y-1.5 text-xs">
                    <div className="font-bold text-gray-900 truncate">{b.serviceName}</div>
                    <div className="flex items-center gap-1.5 text-[#745b68]">
                      <Calendar size={12} className="text-brand-primary" />
                      <span>{b.eventDate} ({b.eventTimeSlot || 'Evening'})</span>
                    </div>
                    {b.eventLocation && (
                      <div className="flex items-center gap-1.5 text-[#745b68] truncate">
                        <MapPin size={12} className="text-brand-primary shrink-0" />
                        <span className="truncate">{b.eventLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-brand-primary flex items-center gap-1">
                    <span>Open Live Chat</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
                  </span>

                  {cleanPhone && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition"
                        title="WhatsApp"
                      >
                        <MessageSquare size={13} />
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition"
                        title="Call"
                      >
                        <Phone size={13} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Chat Modal */}
      {selectedBooking && (
        <VendorChatModal
          booking={selectedBooking}
          vendor={vendor}
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
