-- Run this query in your Supabase SQL Editor to add the 'source' column to the 'leads' table.

ALTER TABLE public.leads
ADD COLUMN source TEXT;
