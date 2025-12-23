import { LucideIcon } from "lucide-react";

interface UserFlowStepProps {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isActive?: boolean;
}

const UserFlowStep = ({ step, icon: Icon, title, description, isActive }: UserFlowStepProps) => {
  return (
    <div 
      className={`relative flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-500 ${
        isActive 
          ? 'bg-primary/10 shadow-soft scale-105' 
          : 'bg-card hover:bg-muted/50'
      }`}
    >
      {/* Step number */}
      <div 
        className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-display ${
          isActive 
            ? 'gradient-primary text-primary-foreground shadow-glow' 
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {step}
      </div>

      {/* Icon */}
      <div 
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
          isActive 
            ? 'gradient-primary shadow-glow animate-float' 
            : 'bg-muted'
        }`}
      >
        <Icon className={`w-8 h-8 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
      </div>

      {/* Content */}
      <h3 className="font-display font-bold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default UserFlowStep;
