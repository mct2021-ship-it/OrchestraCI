import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  svgClassName?: string;
}

export function Logo({ className = "h-8", svgClassName = "h-full w-auto" }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-center bg-black rounded-lg p-2", className)}>
      <svg viewBox="0 0 240 60" className={svgClassName} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#007BFF" />
          </linearGradient>
        </defs>
        
        <g transform="translate(5, 0)">
          {/* Outer arc */}
          <path 
            d="M 49 19 A 22 22 0 1 0 41 49" 
            fill="none" 
            stroke="url(#logo-gradient)" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          
          {/* Inner arc */}
          <path 
            d="M 38.5 21.5 A 12 12 0 1 0 30 42" 
            fill="none" 
            stroke="url(#logo-gradient)" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          
          {/* Dot */}
          <circle cx="30" cy="42" r="3.5" fill="url(#logo-gradient)" />
          
          {/* Arrow head */}
          <path 
            d="M 32 15 L 40 21.5 L 32 28" 
            fill="none" 
            stroke="url(#logo-gradient)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </g>
        
        {/* Text */}
        <text x="65" y="32" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="#e4e4e7" letterSpacing="1.5">RCHESTRA</text>
        <text x="65" y="52" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill="#a1a1aa" letterSpacing="1.5">CI</text>
      </svg>
    </div>
  );
}
