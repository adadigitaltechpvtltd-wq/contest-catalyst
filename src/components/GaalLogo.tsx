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
            {/* Main background gradient - purple to pink to orange */}
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            
            {/* Wave gradient - deeper purple to magenta */}
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            
            {/* Second wave - magenta to coral */}
            <linearGradient id="waveGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#BE185D" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            
            <mask id="centerHole">
              <rect width="100" height="100" fill="white"/>
              <circle cx="50" cy="50" r="18" fill="black"/>
            </mask>
          </defs>
          
          {/* Base circle with gradient */}
          <circle cx="50" cy="50" r="46" fill="url(#bgGradient)" mask="url(#centerHole)" />
          
          {/* First organic wave - top right flowing down */}
          <path
            d="M50 4 C75 4 96 25 96 50 C96 60 92 70 85 77 C78 70 68 65 55 65 C42 65 32 58 28 48 C24 38 28 25 38 15 C42 10 46 6 50 4"
            fill="url(#waveGradient1)"
            mask="url(#centerHole)"
          />
          
          {/* Second wave - creates depth in lower section */}
          <path
            d="M70 20 C82 28 90 42 90 55 C90 62 87 68 82 73 C75 65 65 60 52 62 C42 64 35 58 33 50 C31 42 36 32 46 26 C54 21 62 18 70 20"
            fill="url(#waveGradient2)"
            opacity="0.7"
            mask="url(#centerHole)"
          />
          
          {/* Highlight on inner edge */}
          <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="1" fill="none" opacity="0.2" mask="url(#centerHole)" />
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
