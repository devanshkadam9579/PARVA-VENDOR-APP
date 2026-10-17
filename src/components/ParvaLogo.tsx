import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ParvaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const STORAGE_KEY = 'parva_vendor_branding_logo';

export function ParvaLogo({
  size = 'md',
  className = '',
  onClick
}: ParvaLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return cached;
    } catch (_) {}
    return 'https://res.cloudinary.com/k03rmhkg/image/upload/v1792254596/parva_branding/myparva_official_logo.png';
  });
  const [logoAlt, setLogoAlt] = useState<string>('myparva.com Partner');

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.logoUrl) {
          setLogoUrl(d.logoUrl);
          if (d.logoAltText) setLogoAlt(d.logoAltText);
          try {
            localStorage.setItem(STORAGE_KEY, d.logoUrl);
            if (typeof document !== 'undefined') {
              const icons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
              icons.forEach((el) => {
                (el as HTMLLinkElement).href = d.logoUrl;
              });
            }
          } catch (_) {}
        }
      }
    }, (err) => {
      console.warn('[ParvaLogo] Realtime logo listener note:', err.message);
    });

    return unsub;
  }, []);

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer select-none group ${className}`}
      title={logoAlt || 'Parva Partner Portal'}
    >
      <img 
        src={logoUrl || '/parva-logo.png'} 
        alt={logoAlt || 'Parva Partner'} 
        className={`${sizeClasses} object-contain transition-transform duration-300 group-hover:scale-105`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/parva-logo.png';
        }}
      />
    </div>
  );
}
