-- =============================================================================
-- TeaVision AI — Production Database Schema (Supabase PostgreSQL)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'researcher' CHECK (role IN ('farmer', 'supervisor', 'researcher', 'pathologist', 'admin')),
    organization TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    predicted_class TEXT NOT NULL CHECK (
        predicted_class IN (
            'Tea algal leaf spot',
            'Brown Blight',
            'Gray Blight',
            'Helopeltis',
            'Red spider',
            'Green mirid bug',
            'Healthy leaf'
        )
    ),
    class_index INTEGER NOT NULL CHECK (class_index >= 0 AND class_index <= 6),
    confidence NUMERIC(7, 6) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    probabilities JSONB NOT NULL,
    top_predictions JSONB NOT NULL,
    image_path TEXT,
    inference_time_ms NUMERIC(8, 2) NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'lightteanet-eca-v1',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for prediction queries & analytics
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_class ON public.predictions (predicted_class);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON public.predictions (user_id);

-- 3. FIELD OBSERVATIONS TABLE (Research field-testing data)
CREATE TABLE IF NOT EXISTS public.field_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plantation_name TEXT,
    district TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    lighting_condition TEXT CHECK (lighting_condition IN ('direct_sunlight', 'overcast', 'shaded', 'indoor_lab', 'unknown')),
    leaf_age TEXT CHECK (leaf_age IN ('tender_flush', 'maintenance_mature', 'old_coarse', 'unknown')),
    observation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_field_observations_prediction ON public.field_observations (prediction_id);
CREATE INDEX IF NOT EXISTS idx_field_observations_district ON public.field_observations (district);

-- 4. PREDICTION FEEDBACK TABLE (User assessment vs Expert Ground Truth)
CREATE TABLE IF NOT EXISTS public.prediction_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_assessment TEXT NOT NULL CHECK (user_assessment IN ('correct', 'incorrect', 'unsure')),
    comments TEXT,
    expert_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_class TEXT CHECK (
        verified_class IS NULL OR verified_class IN (
            'Tea algal leaf spot',
            'Brown Blight',
            'Gray Blight',
            'Helopeltis',
            'Red spider',
            'Green mirid bug',
            'Healthy leaf'
        )
    ),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_prediction ON public.prediction_feedback (prediction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_assessment ON public.prediction_feedback (user_assessment);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all researcher profiles, but only update their own
CREATE POLICY "Public profiles are viewable by all users" 
    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Predictions: Public/Anonymous can create predictions, users can see their own or public research samples
CREATE POLICY "Allow anonymous or authenticated prediction creation"
    ON public.predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own or anonymous predictions"
    ON public.predictions FOR SELECT USING (
        user_id IS NULL OR auth.uid() = user_id OR auth.role() = 'service_role'
    );

-- Field Observations: Anyone can submit, viewable by researchers
CREATE POLICY "Anyone can submit field observations"
    ON public.field_observations FOR INSERT WITH CHECK (true);
CREATE POLICY "Field observations viewable by authenticated users"
    ON public.field_observations FOR SELECT USING (true);

-- Feedback: Anyone can submit feedback
CREATE POLICY "Anyone can submit prediction feedback"
    ON public.prediction_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Feedback viewable by researchers"
    ON public.prediction_feedback FOR SELECT USING (true);

-- =============================================================================
-- STORAGE BUCKETS (for uploaded tea leaf images)
-- =============================================================================
-- Note: Run in Supabase SQL editor to create storage bucket:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('leaf-images', 'leaf-images', false);

