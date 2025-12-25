import * as React from "react";
import { Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const value = `${h}:${m}`;
      
      // Format label as 12-hour time with AM/PM
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${m.padStart(2, '0')} ${ampm}`;
      
      options.push({ value, label });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Find the closest matching time option or default to exact value
  const normalizedValue = React.useMemo(() => {
    if (!value) return "09:00";
    const [hours, minutes] = value.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const adjustedHours = roundedMinutes === 60 ? hours + 1 : hours;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    return `${(adjustedHours % 24).toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  }, [value]);

  const displayLabel = React.useMemo(() => {
    const option = timeOptions.find(opt => opt.value === normalizedValue);
    return option?.label || value;
  }, [normalizedValue, value]);

  return (
    <Select value={normalizedValue} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select time">{displayLabel}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-60 bg-popover z-50">
        {timeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
