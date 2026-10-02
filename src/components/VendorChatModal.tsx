import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Phone, MessageSquare, CheckCheck, Clock, User, 
  MapPin, Calendar, Sparkles, ExternalLink 
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VendorBooking, VendorProfile } from '../types';

export interface VendorChatModalProps {
  booking: VendorBooking | null;
  vendor: VendorProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id?: string;
  sender: 'user' | 'vendor';
  senderName?: string;
  text: string;
  timestamp?: any;
  time?: string;
}

export function VendorChatModal({
  booking,
  vendor,
  isOpen,
  onClose
}: VendorChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'Namaste! We have received your booking and look forward to serving you.',
    'Could you please share any specific themes or decor preferences?',
    'Our team will arrive 2 hours prior to your event start time for setup.',
    'All preparations are progressing smoothly for your special day!'
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Firestore Realtime Subscription
  useEffect(() => {
    if (!isOpen || !booking) return;

    if (!db) {
      // Fallback default mock conversation
      setMessages([
        {
          sender: 'vendor',
          senderName: vendor.name,
          text: `Namaste ${booking.customerName || 'Valued Client'}! We have confirmed your reservation for ${booking.serviceName} on ${booking.eventDate}. How can we tailor our services for you?`,
          time: 'Just now'
        }
      ]);
      return;
    }

    try {
      const chatRef = collection(db, 'chats');
      const q = query(
        chatRef,
        where('bookingId', '==', booking.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: (ChatMessage & { _millis?: number })[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            let millis = 0;
            if (data.createdAt?.toDate) {
              millis = data.createdAt.toDate().getTime();
            } else if (data.createdAt) {
              try { millis = new Date(data.createdAt).getTime(); } catch (e) {}
            }
            list.push({
              id: doc.id,
              sender: data.sender || 'vendor',
              senderName: data.senderName,
              text: data.text || '',
              time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
              _millis: millis
            });
          });
          list.sort((a, b) => (a._millis || 0) - (b._millis || 0));
          setMessages(list);
        } else {
          // Default initial greeting if no messages yet
          setMessages([
            {
              sender: 'vendor',
              senderName: vendor.name,
              text: `Namaste ${booking.customerName || 'Valued Client'}! Thank you for booking ${booking.serviceName}. Feel free to share any customization requests or questions here!`,
              time: 'Initial'
            }
          ]);
        }
      }, (err) => {
        console.warn('Chat Firestore listener warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Chat setup error:', e);
    }
  }, [isOpen, booking, vendor]);

  if (!isOpen || !booking) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setSending(true);
    const newMsg: ChatMessage = {
      sender: 'vendor',
      senderName: vendor.name,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic local update
    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');

    if (db) {
      try {
        await addDoc(collection(db, 'chats'), {
          bookingId: booking.id,
          vendorId: vendor.id,
          userId: booking.customerUid || (booking as any).userId || '',
          sender: 'vendor',
          senderName: vendor.name,
          text,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Failed to write message to Firestore:', err);
      }
    }
    setSending(false);
  };

  const rawPhone = booking.customerPhone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#f2e4ec]">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-base border border-white/30 shadow-xs">
              {(booking.customerName || 'C')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  {booking.customerName || 'Celebration Client'}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {booking.status}
                </span>
              </div>
              <p className="text-xs text-pink-100 flex items-center gap-2 mt-0.5 font-medium">
                <span>{booking.serviceName}</span>
                <span>•</span>
                <span>{booking.eventDate} ({booking.eventTimeSlot || 'Evening'})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cleanPhone && (
              <>
                <a
                  href={`tel:${cleanPhone}`}
                  title="Call Client"
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition border border-white/20"
                >
                  <Phone size={15} />
                </a>
                <a
                  href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp Client"
                  className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-xs"
                >
                  <MessageSquare size={15} />
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition border border-white/20"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Client Booking Brief Card */}
        <div className="bg-[#faf5f8] px-4 py-2.5 border-b border-[#f2e4ec] text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 text-[#745b68]">
          <div className="flex items-center gap-1.5 font-bold text-[#1a0812]">
            <Calendar size={13} className="text-brand-primary" />
            <span>Event: {booking.eventDate}</span>
          </div>
          {booking.eventLocation && (
            <div className="flex items-center gap-1.5 max-w-xs truncate">
              <MapPin size={13} className="text-brand-primary shrink-0" />
              <span className="truncate">{booking.eventLocation}</span>
            </div>
          )}
          <div className="text-[11px] font-black text-brand-primary">
            Value: ₹{(booking.totalPrice || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfcfd]">
          {messages.map((msg, index) => {
            const isVendor = msg.sender === 'vendor';
            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-xs ${
                    isVendor
                      ? 'bg-brand-primary text-white rounded-br-xs'
                      : 'bg-white text-gray-900 border border-[#f2e4ec] rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                      isVendor ? 'text-pink-200' : 'text-gray-400'
                    }`}
                  >
                    <span>{msg.time}</span>
                    {isVendor && <CheckCheck size={12} />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies Bar */}
        <div className="px-3 py-2 bg-[#faf5f8] border-t border-[#f2e4ec] overflow-x-auto flex gap-2 shrink-0 no-scrollbar">
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(qr)}
              className="text-[11px] font-medium bg-white hover:bg-brand-primary hover:text-white text-[#745b68] border border-[#f2e4ec] px-3 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 shadow-2xs"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-[#f2e4ec] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${booking.customerName || 'client'}...`}
            className="flex-1 bg-[#faf5f8] border border-[#f2e4ec] rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-40 text-white p-3 rounded-2xl shadow-xs transition active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
