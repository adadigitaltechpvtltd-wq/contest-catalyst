-- Create brand_inquiries table for lead capture
CREATE TABLE public.brand_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  budget_range TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_inquiries ENABLE ROW LEVEL SECURITY;

-- Public can insert inquiries (no auth required)
CREATE POLICY "Anyone can submit brand inquiries"
ON public.brand_inquiries
FOR INSERT
WITH CHECK (true);

-- Only admins can view inquiries
CREATE POLICY "Admins can view all brand inquiries"
ON public.brand_inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update inquiries
CREATE POLICY "Admins can update brand inquiries"
ON public.brand_inquiries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_brand_inquiries_updated_at
BEFORE UPDATE ON public.brand_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();