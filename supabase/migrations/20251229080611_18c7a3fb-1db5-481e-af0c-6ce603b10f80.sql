-- Add phone column to brand_inquiries table
ALTER TABLE public.brand_inquiries
ADD COLUMN phone text NOT NULL DEFAULT '';