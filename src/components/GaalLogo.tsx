import { cn } from '@/lib/utils';

interface GaalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-6 h-6', text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 'w-8 h-8', text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 'w-10 h-10', text: 'text-2xl', gap: 'gap-2.5' },
  xl: { icon: 'w-14 h-14', text: 'text-4xl', gap: 'gap-3' },
};

const GaalLogo = ({ size = 'md', showText = true, className }: GaalLogoProps) => {
  const { icon, text, gap } = sizeMap[size];

  return (
    <div className={cn('flex items-center', gap, className)}>
      {/* Logo Icon - Abstract "G" with camera aperture inspiration */}
      <div className={cn('relative', icon)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gaalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--primary-glow))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <linearGradient id="gaalGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          
          {/* Outer ring with gradient */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="url(#gaalGradient)"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Inner aperture blades - creating abstract G shape */}
          <path
            d="M24 8 L32 14 L32 24 L24 18 Z"
            fill="url(#gaalGradient)"
            opacity="0.9"
          />
          <path
            d="M32 24 L38 28 L32 38 L28 30 Z"
            fill="url(#gaalGradient2)"
            opacity="0.8"
          />
          <path
            d="M24 40 L28 30 L18 30 L16 38 Z"
            fill="url(#gaalGradient)"
            opacity="0.7"
          />
          <path
            d="M10 28 L16 24 L18 30 L10 34 Z"
            fill="url(#gaalGradient2)"
            opacity="0.9"
          />
          <path
            d="M10 20 L16 24 L24 18 L18 10 Z"
            fill="url(#gaalGradient)"
            opacity="0.8"
          />
          
          {/* Center dot - camera lens center */}
          <circle
            cx="24"
            cy="24"
            r="5"
            fill="url(#gaalGradient)"
          />
          
          {/* Subtle glow effect */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#gaalGradient)"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <span className={cn('font-display font-bold text-gradient tracking-tight', text)}>
          Gaal
        </span>
      )}
    </div>
  );
};

export default GaalLogo;
