import React from 'react';
import { DeviceType } from '@/types/network';

interface DeviceIconProps {
  type: DeviceType;
  size?: number;
  className?: string;
  isUp?: boolean;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  type,
  size = 48,
  className = '',
  isUp = true,
}) => {
  switch (type) {
    case 'cisco-router':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* Router cylinder chassis */}
          <rect x="8" y="20" width="48" height="24" rx="12" fill="#0284c7" />
          <rect x="10" y="22" width="44" height="20" rx="10" fill="#0369a1" />
          {/* 4 Cisco routing arrows */}
          <path d="M22 28L28 32L22 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M42 28L36 32L42 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M28 32H36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M32 24V40" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
          {/* Status LEDs */}
          <circle cx="16" cy="32" r="2.5" fill={isUp ? '#22c55e' : '#ef4444'} />
          <circle cx="48" cy="32" r="2" fill="#facc15" />
        </svg>
      );

    case 'l3-switch':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* L3 Switch box */}
          <rect x="6" y="20" width="52" height="24" rx="4" fill="#0f766e" />
          <rect x="8" y="22" width="48" height="20" rx="3" fill="#115e59" />
          {/* Multilayer switch cross arrows */}
          <path d="M20 32H44M32 20V44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
          <path d="M24 28L20 32L24 36M40 28L44 32L40 36" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M28 24L32 20L36 24M28 40L32 44L36 40" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* L3 Label badge */}
          <rect x="26" y="28" width="12" height="8" rx="2" fill="#042f2e" />
          <text x="32" y="34.5" fill="#5eead4" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">L3</text>
        </svg>
      );

    case 'l2-switch':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* 2960 Switch chassis */}
          <rect x="6" y="22" width="52" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Dual rows of port LEDs */}
          <rect x="10" y="26" width="30" height="12" rx="2" fill="#0f172a" />
          {Array.from({ length: 6 }).map((_, i) => (
            <React.Fragment key={i}>
              <circle cx={14 + i * 4.5} cy="29" r="1.2" fill={isUp ? '#22c55e' : '#64748b'} />
              <circle cx={14 + i * 4.5} cy="34" r="1.2" fill={isUp ? '#22c55e' : '#64748b'} />
            </React.Fragment>
          ))}
          {/* Switch bidirectional arrows */}
          <path d="M44 28H52M52 28L49 25M52 36H44M44 36L47 39" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

    case 'wireless-ap':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* Dual Antennas */}
          <path d="M18 10V28M46 10V28" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="18" cy="10" r="2" fill="#38bdf8"/>
          <circle cx="46" cy="10" r="2" fill="#38bdf8"/>
          {/* Body */}
          <rect x="12" y="28" width="40" height="18" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>
          {/* Wi-Fi Waves */}
          <path d="M26 34C28 32 36 32 38 34" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M23 31C27 28 37 28 41 31" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="32" cy="38" r="2" fill="#22c55e"/>
        </svg>
      );

    case 'firewall':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* Shield / Firewall */}
          <path d="M32 8L50 14V32C50 44 32 54 32 54C32 54 14 44 14 32V14L32 8Z" fill="#b91c1c" stroke="#dc2626" strokeWidth="2"/>
          {/* Brick pattern lines */}
          <path d="M20 22H44M18 32H46M22 42H42" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M26 22V32M38 22V32M32 32V42M26 42V48M38 42V48" stroke="#fca5a5" strokeWidth="1.5"/>
          <circle cx="32" cy="16" r="2" fill="#fef08a"/>
        </svg>
      );

    case 'linux-server':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* 2U Rack chassis */}
          <rect x="8" y="14" width="48" height="36" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="2"/>
          {/* Server bay drive trays */}
          <rect x="12" y="20" width="28" height="6" rx="1.5" fill="#27272a"/>
          <rect x="12" y="29" width="28" height="6" rx="1.5" fill="#27272a"/>
          <rect x="12" y="38" width="28" height="6" rx="1.5" fill="#27272a"/>
          {/* Ubuntu Circle badge */}
          <circle cx="48" cy="24" r="5" fill="#ea580c"/>
          <circle cx="48" cy="24" r="2" fill="#ffffff"/>
          {/* LED activity lights */}
          <circle cx="45" cy="36" r="1.5" fill="#22c55e"/>
          <circle cx="50" cy="36" r="1.5" fill="#38bdf8"/>
          <circle cx="45" cy="41" r="1.5" fill="#facc15"/>
        </svg>
      );

    case 'dns-server':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="8" y="14" width="48" height="36" rx="4" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2"/>
          <circle cx="26" cy="32" r="10" stroke="#818cf8" strokeWidth="1.5"/>
          <path d="M16 32H36M26 22C28.5 25 30 28.5 30 32C30 35.5 28.5 39 26 42M26 22C23.5 25 22 28.5 22 32C22 35.5 23.5 39 26 42" stroke="#818cf8" strokeWidth="1.5"/>
          <rect x="38" y="22" width="14" height="6" rx="1.5" fill="#312e81"/>
          <text x="45" y="26.5" fill="#c7d2fe" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">DNS</text>
          <circle cx="45" cy="38" r="2" fill="#22c55e"/>
        </svg>
      );

    case 'dhcp-server':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="8" y="14" width="48" height="36" rx="4" fill="#3b0764" stroke="#7e22ce" strokeWidth="2"/>
          <rect x="14" y="20" width="36" height="12" rx="2" fill="#581c87"/>
          <text x="32" y="28.5" fill="#f3e8ff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">D H C P</text>
          <circle cx="20" cy="40" r="2" fill="#22c55e"/>
          <circle cx="32" cy="40" r="2" fill="#a855f7"/>
          <circle cx="44" cy="40" r="2" fill="#facc15"/>
        </svg>
      );

    case 'syslog-server':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="8" y="14" width="48" height="36" rx="4" fill="#042f2e" stroke="#0d9488" strokeWidth="2"/>
          {/* Terminal log lines */}
          <path d="M14 22H34M14 28H44M14 34H28M14 40H40" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="48" cy="24" r="2" fill="#22c55e"/>
        </svg>
      );

    case 'pc':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* Monitor Screen */}
          <rect x="10" y="12" width="34" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
          <rect x="13" y="15" width="28" height="18" fill="#0f172a"/>
          {/* Code / Desktop UI lines */}
          <rect x="16" y="18" width="12" height="2" fill="#38bdf8"/>
          <rect x="16" y="22" width="18" height="2" fill="#22c55e"/>
          {/* Monitor Stand */}
          <path d="M24 36V42M20 42H34" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
          {/* Desktop Tower */}
          <rect x="46" y="16" width="10" height="26" rx="2" fill="#334155" stroke="#475569" strokeWidth="1.5"/>
          <line x1="49" y1="20" x2="53" y2="20" stroke="#94a3b8" strokeWidth="1.5"/>
          <circle cx="51" cy="36" r="1.5" fill={isUp ? '#22c55e' : '#ef4444'}/>
        </svg>
      );

    case 'laptop':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* Laptop Screen */}
          <rect x="14" y="14" width="36" height="24" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.5"/>
          <rect x="17" y="17" width="30" height="18" fill="#0f172a"/>
          <circle cx="32" cy="24" r="3" fill="#38bdf8"/>
          <path d="M28 30C30 28 34 28 36 30" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Laptop Base */}
          <path d="M8 40L14 38H50L56 40C56 42 54 44 50 44H14C10 44 8 42 8 40Z" fill="#334155" stroke="#475569" strokeWidth="1.5"/>
          <rect x="28" y="40" width="8" height="2" rx="0.5" fill="#94a3b8"/>
        </svg>
      );

    case 'smartphone':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="20" y="8" width="24" height="48" rx="5" fill="#0f172a" stroke="#64748b" strokeWidth="2"/>
          <rect x="22" y="13" width="20" height="36" fill="#1e293b"/>
          <circle cx="32" cy="10.5" r="1" fill="#94a3b8"/>
          <rect x="28" y="51" width="8" height="2" rx="1" fill="#94a3b8"/>
          {/* Signal wave */}
          <path d="M28 26C30 24 34 24 36 26" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="32" cy="30" r="1.5" fill="#38bdf8"/>
        </svg>
      );

    case 'iot-gateway':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          {/* Industrial DIN Rail box */}
          <path d="M42 8V20" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="42" cy="8" r="2" fill="#f59e0b"/>
          <rect x="14" y="20" width="36" height="34" rx="4" fill="#78350f" stroke="#b45309" strokeWidth="2"/>
          <rect x="18" y="24" width="28" height="12" rx="2" fill="#451a03"/>
          <text x="32" y="32.5" fill="#fef3c7" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">26.4°C</text>
          <circle cx="22" cy="44" r="2" fill="#22c55e"/>
          <circle cx="32" cy="44" r="2" fill="#38bdf8"/>
          <circle cx="42" cy="44" r="2" fill="#f59e0b"/>
        </svg>
      );

    case 'hub':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="8" y="22" width="48" height="20" rx="3" fill="#374151" stroke="#4b5563" strokeWidth="2"/>
          {/* Ports */}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={12 + i * 7} y="26" width="5" height="6" rx="1" fill="#1f2937" stroke="#6b7280" strokeWidth="0.8"/>
          ))}
          <text x="32" y="38" fill="#e5e7eb" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HUB L1</text>
          <circle cx="50" cy="36" r="1.5" fill="#ef4444"/>
        </svg>
      );
  }
};
