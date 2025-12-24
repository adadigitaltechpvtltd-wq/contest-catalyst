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
      {/* Logo Icon - Flowing gradient circle with organic swirl */}
      <div className={cn('relative', icon)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gaalFlowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="35%" stopColor="#D946EF" />
              <stop offset="70%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
            <linearGradient id="gaalFlowGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#D946EF" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <mask id="gaalCenterMask">
              <rect width="48" height="48" fill="white"/>
              <circle cx="24" cy="24" r="8" fill="black"/>
            </mask>
          </defs>
          
          {/* Main circular shape with gradient */}
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="url(#gaalFlowGradient)"
            mask="url(#gaalCenterMask)"
          />
          
          {/* Flowing organic curves */}
          <path
            d="M24 3 C35 3 45 13 45 24 C45 28 43 32 40 35 C36 30 30 28 24 28 C20 28 16 26 14 22 C12 18 14 12 18 8 C20 5 22 3 24 3"
            fill="url(#gaalFlowGradient2)"
            opacity="0.85"
            mask="url(#gaalCenterMask)"
          />
          
          {/* Inner swirl accent */}
          <path
            d="M32 24 C32 28 28 32 24 32 C22 32 20 31 19 29 C21 30 23 30 25 29 C28 27 30 24 30 20 C30 18 29 16 27 15 C30 17 32 20 32 24"
            fill="white"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <span className={cn('font-display font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent tracking-tight', text)}>
          Gaal
        </span>
      )}
    </div>
  );
};

export default GaalLogo;
