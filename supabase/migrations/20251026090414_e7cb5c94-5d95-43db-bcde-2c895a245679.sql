-- Add owner_id column to providers table for ownership tracking
ALTER TABLE public.providers 
ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_providers_owner_id ON public.providers(owner_id);

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can update providers" ON public.providers;

-- Create ownership-based policies
CREATE POLICY "Users can insert their own providers"
ON public.providers
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own providers"
ON public.providers
FOR UPDATE
USING (auth.uid() = owner_id);

-- No DELETE policy - providers cannot be deleted by regular users
-- Deletion can only be done through database admin panel

-- Keep the existing SELECT policy (anyone can view providers)
-- This policy already exists: "Anyone can view providers"