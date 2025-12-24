import { useState, useRef } from "react";
import { X, Upload, Image, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestTitle: string;
}

interface FormData {
  title: string;
  description: string;
  photoFile: File | null;
  photoPreview: string | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  photo?: string;
}

const SubmissionModal = ({ isOpen, onClose, contestTitle }: SubmissionModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    photoFile: null,
    photoPreview: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    // Description is optional - only validate length if provided
    if (formData.description.trim() && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (!formData.photoFile) {
      newErrors.photo = "Photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, photo: "Please select an image file" }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: "Image must be less than 10MB" }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        photoFile: file,
        photoPreview: reader.result as string,
      }));
      setErrors(prev => ({ ...prev, photo: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photoFile: null,
      photoPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Entry Submitted! 🎉",
      description: "Your entry has been submitted successfully. Good luck!",
    });
    
    setIsSubmitting(false);
    onClose();
    
    // Reset form
    setFormData({
      title: "",
      description: "",
      photoFile: null,
      photoPreview: null,
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Submit Entry</h2>
            <p className="text-sm text-muted-foreground">{contestTitle}</p>
          </div>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Photo <span className="text-primary">*</span>
            </label>
            
            {formData.photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img 
                  src={formData.photoPreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute bottom-4 right-4 p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  errors.photo 
                    ? "border-destructive bg-destructive/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">Click to upload photo</p>
                <p className="text-sm text-muted-foreground">JPG, PNG, or GIF up to 10MB</p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {errors.photo && (
              <p className="text-sm text-destructive">{errors.photo}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Entry Title <span className="text-primary">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder="Give your entry a catchy title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
              }}
              placeholder="Tell us about your entry..."
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            <div className="flex justify-between">
              {errors.description ? (
                <p className="text-sm text-destructive">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {formData.description.length}/500
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Entry"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubmissionModal;
