import { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const countryCodes = [
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+1', country: 'US', name: 'United States' },
  { code: '+44', country: 'GB', name: 'United Kingdom' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+81', country: 'JP', name: 'Japan' },
  { code: '+86', country: 'CN', name: 'China' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+65', country: 'SG', name: 'Singapore' },
  { code: '+60', country: 'MY', name: 'Malaysia' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia' },
  { code: '+974', country: 'QA', name: 'Qatar' },
  { code: '+968', country: 'OM', name: 'Oman' },
  { code: '+973', country: 'BH', name: 'Bahrain' },
  { code: '+965', country: 'KW', name: 'Kuwait' },
  { code: '+92', country: 'PK', name: 'Pakistan' },
  { code: '+880', country: 'BD', name: 'Bangladesh' },
  { code: '+94', country: 'LK', name: 'Sri Lanka' },
  { code: '+977', country: 'NP', name: 'Nepal' },
  { code: '+27', country: 'ZA', name: 'South Africa' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+254', country: 'KE', name: 'Kenya' },
  { code: '+55', country: 'BR', name: 'Brazil' },
  { code: '+52', country: 'MX', name: 'Mexico' },
  { code: '+7', country: 'RU', name: 'Russia' },
  { code: '+82', country: 'KR', name: 'South Korea' },
  { code: '+39', country: 'IT', name: 'Italy' },
  { code: '+34', country: 'ES', name: 'Spain' },
  { code: '+31', country: 'NL', name: 'Netherlands' },
  { code: '+46', country: 'SE', name: 'Sweden' },
  { code: '+47', country: 'NO', name: 'Norway' },
  { code: '+45', country: 'DK', name: 'Denmark' },
  { code: '+358', country: 'FI', name: 'Finland' },
  { code: '+48', country: 'PL', name: 'Poland' },
  { code: '+41', country: 'CH', name: 'Switzerland' },
  { code: '+43', country: 'AT', name: 'Austria' },
  { code: '+32', country: 'BE', name: 'Belgium' },
  { code: '+353', country: 'IE', name: 'Ireland' },
  { code: '+64', country: 'NZ', name: 'New Zealand' },
  { code: '+63', country: 'PH', name: 'Philippines' },
  { code: '+66', country: 'TH', name: 'Thailand' },
  { code: '+84', country: 'VN', name: 'Vietnam' },
  { code: '+62', country: 'ID', name: 'Indonesia' },
  { code: '+20', country: 'EG', name: 'Egypt' },
  { code: '+90', country: 'TR', name: 'Turkey' },
  { code: '+380', country: 'UA', name: 'Ukraine' },
  { code: '+351', country: 'PT', name: 'Portugal' },
  { code: '+30', country: 'GR', name: 'Greece' },
  { code: '+972', country: 'IL', name: 'Israel' },
  { code: '+98', country: 'IR', name: 'Iran' },
  { code: '+962', country: 'JO', name: 'Jordan' },
  { code: '+961', country: 'LB', name: 'Lebanon' },
  { code: '+212', country: 'MA', name: 'Morocco' },
  { code: '+216', country: 'TN', name: 'Tunisia' },
  { code: '+233', country: 'GH', name: 'Ghana' },
  { code: '+256', country: 'UG', name: 'Uganda' },
  { code: '+255', country: 'TZ', name: 'Tanzania' },
  { code: '+57', country: 'CO', name: 'Colombia' },
  { code: '+56', country: 'CL', name: 'Chile' },
  { code: '+54', country: 'AR', name: 'Argentina' },
  { code: '+51', country: 'PE', name: 'Peru' },
  { code: '+58', country: 'VE', name: 'Venezuela' },
];

// Map locale country codes to phone country codes
const localeToCountryCode: Record<string, string> = {
  'IN': '+91', 'US': '+1', 'GB': '+44', 'AU': '+61', 'DE': '+49',
  'FR': '+33', 'JP': '+81', 'CN': '+86', 'AE': '+971', 'SG': '+65',
  'MY': '+60', 'SA': '+966', 'QA': '+974', 'OM': '+968', 'BH': '+973',
  'KW': '+965', 'PK': '+92', 'BD': '+880', 'LK': '+94', 'NP': '+977',
  'ZA': '+27', 'NG': '+234', 'KE': '+254', 'BR': '+55', 'MX': '+52',
  'RU': '+7', 'KR': '+82', 'IT': '+39', 'ES': '+34', 'NL': '+31',
  'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358', 'PL': '+48',
  'CH': '+41', 'AT': '+43', 'BE': '+32', 'IE': '+353', 'NZ': '+64',
  'PH': '+63', 'TH': '+66', 'VN': '+84', 'ID': '+62', 'EG': '+20',
  'TR': '+90', 'UA': '+380', 'PT': '+351', 'GR': '+30', 'IL': '+972',
  'IR': '+98', 'JO': '+962', 'LB': '+961', 'MA': '+212', 'TN': '+216',
  'GH': '+233', 'UG': '+256', 'TZ': '+255', 'CO': '+57', 'CL': '+56',
  'AR': '+54', 'PE': '+51', 'VE': '+58',
};

export const detectCountryCode = (): string => {
  try {
    // Try to get country from browser language/locale
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    const countryFromLocale = locale.split('-')[1]?.toUpperCase();
    
    if (countryFromLocale && localeToCountryCode[countryFromLocale]) {
      return localeToCountryCode[countryFromLocale];
    }

    // Try timezone-based detection as fallback
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneCountryMap: Record<string, string> = {
      'Asia/Kolkata': '+91',
      'Asia/Calcutta': '+91',
      'America/New_York': '+1',
      'America/Los_Angeles': '+1',
      'America/Chicago': '+1',
      'Europe/London': '+44',
      'Australia/Sydney': '+61',
      'Europe/Berlin': '+49',
      'Europe/Paris': '+33',
      'Asia/Tokyo': '+81',
      'Asia/Shanghai': '+86',
      'Asia/Dubai': '+971',
      'Asia/Singapore': '+65',
      'Asia/Kuala_Lumpur': '+60',
    };

    if (timezone && timezoneCountryMap[timezone]) {
      return timezoneCountryMap[timezone];
    }
  } catch {
    // Fallback silently
  }
  
  return '+91'; // Default to India
};

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CountryCodeSelect = ({ value, onChange }: CountryCodeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countryCodes;
    
    const searchLower = search.toLowerCase().trim();
    return countryCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.country.toLowerCase().includes(searchLower) ||
        c.code.includes(searchLower)
    );
  }, [search]);

  const selectedCountry = countryCodes.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[110px] justify-between shrink-0 px-3"
        >
          <span className="truncate">
            {selectedCountry ? (
              <span className="flex items-center gap-1">
                <span className="font-medium">{selectedCountry.code}</span>
                <span className="text-muted-foreground text-xs">{selectedCountry.country}</span>
              </span>
            ) : (
              '+91'
            )}
          </span>
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-popover" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea className="h-[250px]">
          {filteredCountries.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No country found
            </div>
          ) : (
            <div className="p-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onChange(country.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    value === country.code && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      value === country.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="font-medium w-12">{country.code}</span>
                  <span className="text-muted-foreground text-xs">{country.country}</span>
                  <span className="text-muted-foreground text-xs truncate flex-1 text-left">
                    {country.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CountryCodeSelect;
