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
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Main background gradient - vivid purple to magenta to orange */}
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="40%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
            
            {/* Wave gradient - deep violet to hot pink */}
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            
            {/* Second wave - rose to orange */}
            <linearGradient id="waveGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            
            <mask id="centerHole">
              <rect width="100" height="100" fill="white"/>
              <circle cx="50" cy="50" r="18" fill="black"/>
            </mask>
          </defs>
          
          {/* Base circle with gradient */}
          <circle cx="50" cy="50" r="46" fill="url(#bgGradient)" mask="url(#centerHole)" />
          
          {/* First organic wave - flowing curve */}
          <path
            d="M50 4 C78 4 96 22 96 50 C96 62 90 73 80 80 C72 70 60 64 48 66 C36 68 28 60 26 48 C24 36 30 22 42 12 C45 9 48 6 50 4"
            fill="url(#waveGradient1)"
            mask="url(#centerHole)"
          />
          
          {/* Second wave - adds depth */}
          <path
            d="M75 15 C88 25 96 40 96 55 C96 65 90 74 82 80 C74 70 62 66 50 68 C40 70 34 64 32 54 C30 44 36 32 48 24 C58 17 68 14 75 15"
            fill="url(#waveGradient2)"
            mask="url(#centerHole)"
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
