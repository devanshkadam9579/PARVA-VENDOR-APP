import React from 'react';

export interface ParvaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function ParvaLogo({
  size = 'md',
  className = '',
  onClick
}: ParvaLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer select-none group ${className}`}
      title="Parva Partner Portal"
    >
      <img 
        src="/parva-logo.png" 
        alt="Parva Partner" 
        className={`${sizeClasses} object-contain transition-transform duration-300 group-hover:scale-105`} 
      />
    </div>
  );
}
