import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const countryCodes = [
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
];

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CountryCodeSelect = ({ value, onChange }: CountryCodeSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[100px] shrink-0">
        <SelectValue placeholder="+91" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] bg-popover">
        {countryCodes.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{country.code}</span>
              <span className="text-muted-foreground text-xs">{country.country}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountryCodeSelect;
