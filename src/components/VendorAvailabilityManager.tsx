import React, { useState } from 'react';
import { Calendar, Clock, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface VendorAvailabilityManagerProps {
  busyDates: string[];
  busySlots?: Record<string, string[]>;
  onUpdateAvailability: (busyDates: string[], busySlots: Record<string, string[]>) => Promise<void>;
}

export function VendorAvailabilityManager({
  busyDates,
  busySlots = {},
  onUpdateAvailability
}: VendorAvailabilityManagerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<'fullday' | 'morning' | 'evening'>('fullday');

  const handleToggleDateBlock = async () => {
    let updatedDates = [...busyDates];
    let updatedSlots = { ...busySlots };

    if (selectedSlot === 'fullday') {
      if (updatedDates.includes(selectedDate)) {
        updatedDates = updatedDates.filter(d => d !== selectedDate);
      } else {
        updatedDates.push(selectedDate);
      }
    } else {
      const current = updatedSlots[selectedDate] || [];
      if (current.includes(selectedSlot)) {
        updatedSlots[selectedDate] = current.filter(s => s !== selectedSlot);
      } else {
        updatedSlots[selectedDate] = [...current, selectedSlot];
      }
    }

    await onUpdateAvailability(updatedDates, updatedSlots);
  };

  const isDateFullyBlocked = busyDates.includes(selectedDate);
  const isSlotBlocked = busySlots[selectedDate]?.includes(selectedSlot);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-extrabold text-[#1a0812] font-display">Calendar & Slot Availability</h1>
        <p className="text-xs text-[#745b68] mt-0.5">Block personal dates, busy slots, and manage operating windows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (Date Selector) */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-[#f2e4ec] p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-[#1a0812]">Pick Date to Manage</h3>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-primary"
          />

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-gray-700 block">Choose Block Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {(['fullday', 'morning', 'evening'] as const).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition ${
                    selectedSlot === slot
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleDateBlock}
            className={`w-full py-3 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 ${
              (selectedSlot === 'fullday' && isDateFullyBlocked) || (selectedSlot !== 'fullday' && isSlotBlocked)
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {(selectedSlot === 'fullday' && isDateFullyBlocked) || (selectedSlot !== 'fullday' && isSlotBlocked) ? (
              <>
                <CheckCircle2 size={15} />
                <span>Unblock Selected Date/Slot</span>
              </>
            ) : (
              <>
                <Ban size={15} />
                <span>Block Selected Date/Slot</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column (Overview of Blocked Dates) */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-[#f2e4ec] p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-[#1a0812]">Currently Blocked Dates ({busyDates.length})</h3>
          {busyDates.length === 0 ? (
            <p className="text-xs text-gray-400">All dates are currently open for customer reservations.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {busyDates.map((date) => (
                <span
                  key={date}
                  className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5"
                >
                  <Ban size={11} />
                  <span>{date}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
