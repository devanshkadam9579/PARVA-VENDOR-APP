import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Ban, CheckCircle2, 
  Clock, Sparkles, AlertCircle, Info, RefreshCw, Layers
} from 'lucide-react';
import { VendorBooking } from '../types';

export interface VendorAvailabilityManagerProps {
  busyDates: string[];
  busySlots?: Record<string, string[]>;
  bookings?: VendorBooking[];
  onUpdateAvailability: (busyDates: string[], busySlots: Record<string, string[]>) => Promise<void>;
}

export function VendorAvailabilityManager({
  busyDates,
  busySlots = {},
  bookings = [],
  onUpdateAvailability
}: VendorAvailabilityManagerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlotMode, setSelectedSlotMode] = useState<'fullday' | 'morning' | 'evening'>('fullday');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateStr = (dayNum: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // 1-Click date toggle
  const handleToggleDay = async (dateStr: string) => {
    setIsSaving(true);
    let updatedDates = [...busyDates];
    let updatedSlots = { ...busySlots };

    if (selectedSlotMode === 'fullday') {
      if (updatedDates.includes(dateStr)) {
        updatedDates = updatedDates.filter(d => d !== dateStr);
        delete updatedSlots[dateStr];
        triggerSaveNotice(`✓ Unblocked ${dateStr}`);
      } else {
        updatedDates.push(dateStr);
        updatedSlots[dateStr] = ['morning', 'evening', 'fullday'];
        triggerSaveNotice(`🔒 Blocked ${dateStr} (Full Day)`);
      }
    } else {
      const currentSlots = updatedSlots[dateStr] || [];
      if (currentSlots.includes(selectedSlotMode)) {
        updatedSlots[dateStr] = currentSlots.filter(s => s !== selectedSlotMode);
        if (updatedSlots[dateStr].length === 0) {
          updatedDates = updatedDates.filter(d => d !== dateStr);
        }
        triggerSaveNotice(`✓ Unblocked ${selectedSlotMode} on ${dateStr}`);
      } else {
        updatedSlots[dateStr] = [...currentSlots, selectedSlotMode];
        if (!updatedDates.includes(dateStr)) {
          updatedDates.push(dateStr);
        }
        triggerSaveNotice(`🔒 Blocked ${selectedSlotMode} on ${dateStr}`);
      }
    }

    try {
      await onUpdateAvailability(updatedDates, updatedSlots);
    } catch (err) {
      console.error('Error updating availability:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk actions
  const handleUnblockMonth = async () => {
    setIsSaving(true);
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const updatedDates = busyDates.filter(d => !d.startsWith(prefix));
    const updatedSlots = { ...busySlots };
    Object.keys(updatedSlots).forEach(k => {
      if (k.startsWith(prefix)) delete updatedSlots[k];
    });

    await onUpdateAvailability(updatedDates, updatedSlots);
    setIsSaving(false);
    triggerSaveNotice(`✓ Unblocked all dates for ${monthNames[month]} ${year}`);
  };

  const handleBlockWeekends = async () => {
    setIsSaving(true);
    const updatedDates = [...busyDates];
    const updatedSlots = { ...busySlots };

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sat or Sun
        const dStr = formatDateStr(day);
        if (!updatedDates.includes(dStr)) {
          updatedDates.push(dStr);
        }
        updatedSlots[dStr] = ['morning', 'evening', 'fullday'];
      }
    }

    await onUpdateAvailability(updatedDates, updatedSlots);
    setIsSaving(false);
    triggerSaveNotice(`🔒 Blocked all weekends in ${monthNames[month]} ${year}`);
  };

  const triggerSaveNotice = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 2500);
  };

  // Metrics for current month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthBlockedCount = busyDates.filter(d => d.startsWith(monthPrefix)).length;
  const monthBookings = bookings.filter(b => (b.eventDate || '').startsWith(monthPrefix));

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#f2e4ec]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a0812] tracking-tight">
            Calendar & Slot Availability
          </h1>
          <p className="text-xs sm:text-sm text-[#745b68] mt-1">
            Tap any date directly on the calendar grid to block or unblock client reservations.
          </p>
        </div>

        {/* Real-time sync feedback */}
        <div className="flex items-center gap-2">
          {saveMessage ? (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300 animate-fade-in flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={13} />
              <span>{saveMessage}</span>
            </span>
          ) : (
            <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full border border-rose-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Market Sync</span>
            </span>
          )}
        </div>
      </div>

      {/* Control Bar: Mode Selector & Bulk Actions */}
      <div className="bg-white rounded-3xl border border-[#f2e4ec] p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Block Scope Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
            <Clock size={13} className="text-rose-600" />
            <span>Click Action Mode:</span>
          </label>
          <div className="inline-flex bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec]">
            {(['fullday', 'morning', 'evening'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSelectedSlotMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  selectedSlotMode === mode
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[#745b68] hover:text-[#1a0812]'
                }`}
              >
                {mode === 'fullday' ? 'Full Day' : mode === 'morning' ? 'Morning (9AM-2PM)' : 'Evening (5PM-11PM)'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Month / Bulk Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
          <button
            type="button"
            onClick={handleBlockWeekends}
            disabled={isSaving}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Block All Weekends
          </button>
          <button
            type="button"
            onClick={handleUnblockMonth}
            disabled={isSaving}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Unblock Entire Month
          </button>
        </div>
      </div>

      {/* Month-Wise Visual Interactive Calendar */}
      <div className="bg-white rounded-3xl sm:rounded-[36px] border border-[#f2e4ec] p-4 sm:p-8 shadow-xs space-y-6">
        {/* Month Navigation & Metrics Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#1a0812] tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Month Metrics Chips */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
              {daysInMonth - monthBlockedCount} Available
            </span>
            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-xl">
              {monthBlockedCount} Blocked
            </span>
            {monthBookings.length > 0 && (
              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-xl">
                {monthBookings.length} Booked
              </span>
            )}
          </div>

          {/* Month Arrows */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center">
          {daysOfWeek.map((day, idx) => (
            <div
              key={day}
              className={`py-2 text-xs sm:text-sm font-black uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-rose-600' : 'text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Tiles Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {/* Empty cells before 1st of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 sm:h-24 rounded-2xl bg-gray-50/40 border border-transparent opacity-30" />
          ))}

          {/* Actual days of the month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDateStr(dayNum);
            const isBlocked = busyDates.includes(dateStr);
            const daySlots = busySlots[dateStr] || [];
            const isMorningBlocked = daySlots.includes('morning');
            const isEveningBlocked = daySlots.includes('evening');
            
            // Check if there are customer bookings on this date
            const dateBookings = bookings.filter(b => b.eventDate === dateStr && (b.status === 'Confirmed' || b.status === 'CONFIRMED' || b.status === 'Pending'));
            const hasBooking = dateBookings.length > 0;

            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => handleToggleDay(dateStr)}
                className={`group relative h-16 sm:h-24 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 border transition cursor-pointer flex flex-col justify-between select-none ${
                  hasBooking
                    ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : isBlocked
                    ? 'bg-rose-50 border-rose-300 hover:bg-rose-100/70 shadow-2xs'
                    : 'bg-white hover:bg-emerald-50/50 border-gray-200 hover:border-emerald-300 shadow-2xs'
                } ${isToday ? 'ring-2 ring-rose-500' : ''}`}
                title={
                  hasBooking
                    ? `Confirmed Booking: ${dateBookings[0].customerName || 'Customer'} (Click to toggle availability)`
                    : isBlocked
                    ? `Blocked: Click to unblock this date`
                    : `Available: Click to block this date`
                }
              >
                {/* Date Header: Day number + Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-black ${
                    isToday ? 'text-rose-600 font-extrabold' : 'text-gray-900'
                  }`}>
                    {dayNum}
                  </span>

                  {/* Visual Status Indicator Icon */}
                  {hasBooking ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-xs" title="Booking Confirmed" />
                  ) : isBlocked ? (
                    <Ban size={13} className="text-rose-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Open" />
                  )}
                </div>

                {/* Status Pill on Tile */}
                <div className="truncate">
                  {hasBooking ? (
                    <div className="space-y-0.5">
                      <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded-md truncate max-w-full">
                        {dateBookings[0].customerName?.split(' ')[0] || 'Booked'}
                      </span>
                    </div>
                  ) : isBlocked ? (
                    <div className="space-y-0.5">
                      <span className="hidden sm:inline-block text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded-md">
                        {isMorningBlocked && !isEveningBlocked
                          ? 'Morn Blocked'
                          : isEveningBlocked && !isMorningBlocked
                          ? 'Eve Blocked'
                          : 'Blocked'}
                      </span>
                      <span className="sm:hidden text-[9px] font-black text-rose-700">🔒</span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-700">
                      Open
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-gray-600">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-white border border-gray-300"></span>
              <span>Open for Bookings (Click to block)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-300"></span>
              <span className="text-rose-700 font-bold">Blocked Date (Click to open)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-100 border border-indigo-300"></span>
              <span className="text-indigo-800 font-bold">Customer Confirmed Booking</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Changes sync instantly to the Parva Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}

export default VendorAvailabilityManager;

