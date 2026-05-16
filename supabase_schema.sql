/*
  RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR
  This script is IDEMPOTENT (can be run multiple times).
  It hardens RLS policies and fixes deletion issues.
*/

-- 1. FUNCTIONS
-- Securely check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. POLICIES SETUP

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'warning', 'info', 'success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- APPEALS POLICIES
ALTER TABLE public.appeals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appeals." ON public.appeals;
CREATE POLICY "Users can view own appeals." ON public.appeals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create appeals." ON public.appeals;
CREATE POLICY "Users can create appeals." ON public.appeals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all appeals." ON public.appeals;
CREATE POLICY "Admins can manage all appeals." ON public.appeals FOR ALL USING (is_admin());

-- QUESTIONS POLICIES
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are viewable by everyone." ON public.questions;
CREATE POLICY "Questions are viewable by everyone." ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create questions." ON public.questions;
CREATE POLICY "Authenticated users can create questions." ON public.questions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT is_blocked FROM public.profiles WHERE id = auth.uid()) = FALSE
);

DROP POLICY IF EXISTS "Admin or Owner can delete questions." ON public.questions;
CREATE POLICY "Admin or Owner can delete questions." ON public.questions FOR DELETE USING (
  auth.uid() = user_id OR is_admin()
);

DROP POLICY IF EXISTS "Owner or Admin can update questions." ON public.questions;
CREATE POLICY "Owner or Admin can update questions." ON public.questions FOR UPDATE USING (
  auth.uid() = user_id OR is_admin()
);

-- ANSWERS POLICIES
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Answers are viewable by everyone." ON public.answers;
CREATE POLICY "Answers are viewable by everyone." ON public.answers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can answer." ON public.answers;
CREATE POLICY "Authenticated users can answer." ON public.answers FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT is_blocked FROM public.profiles WHERE id = auth.uid()) = FALSE
);

DROP POLICY IF EXISTS "Admin or Owner of question or Answerer can delete answers." ON public.answers;
CREATE POLICY "Admin or Owner of question or Answerer can delete answers." ON public.answers FOR DELETE USING (
  auth.uid() = user_id OR 
  is_admin() OR
  EXISTS (
    SELECT 1 FROM public.questions 
    WHERE id = answers.question_id AND user_id = auth.uid()
  )
);

-- REPORTS POLICIES
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report questions." ON public.reports;
CREATE POLICY "Users can report questions." ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view and update reports." ON public.reports;
CREATE POLICY "Admins can view and update reports." ON public.reports FOR ALL USING (is_admin());

-- Allow deletion of reports during question deletion cascade
DROP POLICY IF EXISTS "Allow deletion of reports on owned or admin questions." ON public.reports;
CREATE POLICY "Allow deletion of reports on owned or admin questions." ON public.reports FOR DELETE USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.questions 
    WHERE id = reports.question_id AND user_id = auth.uid()
  )
);

-- PROFILES POLICIES
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (is_admin());

-- NOTIFICATIONS POLICIES
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications." ON public.notifications;
CREATE POLICY "Users can view own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications." ON public.notifications;
CREATE POLICY "Users can update own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notifications." ON public.notifications;
CREATE POLICY "Admins can manage all notifications." ON public.notifications FOR ALL USING (is_admin());
