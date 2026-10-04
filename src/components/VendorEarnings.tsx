import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, ShieldCheck } from 'lucide-react';
import { VendorBooking } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface VendorEarningsProps {
  bookings: VendorBooking[];
}

export function VendorEarnings({ bookings }: VendorEarningsProps) {
  const [commissionPct, setCommissionPct] = useState<number>(10);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.commissionPercentage !== undefined) {
          setCommissionPct(Number(d.commissionPercentage));
        }
      }
    }, (err) => {
      console.warn('[VendorEarnings] Global settings sync info:', err.message);
    });
    return unsub;
  }, []);

  const completedBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'COMPLETED');
  const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'CONFIRMED');

  const grossCompleted = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const grossUpcoming = upcomingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalGross = grossCompleted + grossUpcoming;

  // Compute platform commission dynamically
  const totalCommission = Math.round((totalGross * commissionPct) / 100);
  const netEarnings = Math.max(0, totalGross - totalCommission);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-extrabold text-[#1a0812] font-display">Earnings & Payouts Console</h1>
        <p className="text-xs text-[#745b68] mt-0.5">Authoritative revenue ledger, commission deductions and completed payouts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Settled & Completed</span>
          <h3 className="text-3xl font-black text-[#1a0812]">₹{grossCompleted.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-[#745b68]">{completedBookings.length} Completed Events</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-brand-primary tracking-wider">Upcoming Pipeline</span>
          <h3 className="text-3xl font-black text-[#1a0812]">₹{grossUpcoming.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-[#745b68]">{upcomingBookings.length} Confirmed Events</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
            Platform Commission ({commissionPct}%)
          </span>
          <h3 className="text-3xl font-black text-gray-700">-₹{totalCommission.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-[#745b68]">Admin configured {commissionPct}% platform matchmaking fee</p>
        </div>
      </div>

      <div className="bg-brand-primary-light/40 border border-brand-border p-6 rounded-3xl flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase text-brand-primary tracking-wider">Net Realized Earnings</span>
          <h2 className="text-3xl font-black text-brand-primary mt-0.5">₹{netEarnings.toLocaleString('en-IN')}</h2>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-brand-border text-xs font-extrabold text-brand-primary shadow-xs">
          Direct Payouts Active
        </div>
      </div>
    </div>
  );
}
