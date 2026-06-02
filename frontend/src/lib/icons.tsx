// Minimal stroke icon set (Lucide-style), neumorphism-friendly.
import { CSSProperties, ReactElement, ReactNode } from 'react';
import { EventType } from '../types/incident';

export interface IconProps {
  size?: number;
  fill?: boolean;
  sw?: number;
  vb?: number;
  style?: CSSProperties;
  className?: string;
}

function Svg({
  size = 18,
  fill = false,
  sw = 2,
  vb = 24,
  style,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {children}
    </svg>
  );
}

export type IconComponent = (p: IconProps) => ReactElement;

export const Icons: Record<string, IconComponent> = {
  Activity: (p) => (
    <Svg {...p}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  ),
  Grid: (p) => (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  ),
  List: (p) => (
    <Svg {...p}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </Svg>
  ),
  Map: (p) => (
    <Svg {...p}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </Svg>
  ),
  Bell: (p) => (
    <Svg {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  ),
  Settings: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  ),
  Search: (p) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  ),
  X: (p) => (
    <Svg {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
  Check: (p) => (
    <Svg {...p}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
  ChevronRight: (p) => (
    <Svg {...p}>
      <polyline points="9 18 15 12 9 6" />
    </Svg>
  ),
  ChevronLeft: (p) => (
    <Svg {...p}>
      <polyline points="15 18 9 12 15 6" />
    </Svg>
  ),
  ChevronDown: (p) => (
    <Svg {...p}>
      <polyline points="6 9 12 15 18 9" />
    </Svg>
  ),
  Alert: (p) => (
    <Svg {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
  Car: (p) => (
    <Svg {...p}>
      <path d="M5 17H3v-5l2-5h12l2 5v5h-2" />
      <circle cx="7.5" cy="17" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="17" r="1.5" fill="currentColor" />
    </Svg>
  ),
  Cone: (p) => (
    <Svg {...p}>
      <path d="M9.3 6.5h5.4M7.5 13h9M4 20h16" />
      <path d="M12 3l6 17H6L12 3z" />
    </Svg>
  ),
  Clock: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </Svg>
  ),
  Pin: (p) => (
    <Svg {...p}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  ),
  Bolt: (p) => (
    <Svg {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Svg>
  ),
  Sliders: (p) => (
    <Svg {...p}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </Svg>
  ),
};

export const EVENT_ICONS: Record<EventType, IconComponent> = {
  ACCIDENT: Icons.Car,
  CONGESTION: Icons.Activity,
  ROAD_CLOSURE: Icons.Cone,
  HAZARD: Icons.Alert,
  BREAKDOWN: Icons.Bolt,
};
