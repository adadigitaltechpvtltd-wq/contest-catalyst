-- Create admin activity logs table for audit trail
CREATE TABLE public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert logs
CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_admin_activity_logs_entity ON public.admin_activity_logs(entity_type, entity_id);
CREATE INDEX idx_admin_activity_logs_admin ON public.admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created ON public.admin_activity_logs(created_at DESC);