-- Migration: Add missing tables and columns safely
-- Date: 2024-12-14
-- Description: Safely adds work_days, user_settings tables and missing columns

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create work_days table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_worked DECIMAL(4, 2) DEFAULT 8.0,
    daily_rate DECIMAL(10, 2),
    notes TEXT,
    status TEXT DEFAULT 'worked' CHECK (status IN ('worked', 'vacation', 'sick', 'holiday', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, date)
);

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'SRD',
    daily_rate DECIMAL(10, 2) DEFAULT 89.95,
    default_hours DECIMAL(4, 2) DEFAULT 8.0,
    date_format TEXT DEFAULT 'dd MMM, HH:mm',
    dark_mode BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'nl',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add status column to work_days if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_days') THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'work_days'
            AND column_name = 'status'
        ) THEN
            ALTER TABLE work_days
            ADD COLUMN status TEXT DEFAULT 'worked' CHECK (status IN ('worked', 'vacation', 'sick', 'holiday', 'absent'));
            RAISE NOTICE 'Added status column to work_days';
        END IF;
    END IF;
END $$;

-- Add default_hours column to user_settings if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'user_settings'
            AND column_name = 'default_hours'
        ) THEN
            ALTER TABLE user_settings
            ADD COLUMN default_hours DECIMAL(4, 2) DEFAULT 8.0;
            RAISE NOTICE 'Added default_hours column to user_settings';
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_work_days_user_id ON work_days(user_id);
CREATE INDEX IF NOT EXISTS idx_work_days_date ON work_days(date);
CREATE INDEX IF NOT EXISTS idx_work_days_status ON work_days(status);

-- Enable Row Level Security on new tables
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_days if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can view their own work days') THEN
        CREATE POLICY "Users can view their own work days"
            ON work_days FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can insert their own work days') THEN
        CREATE POLICY "Users can insert their own work days"
            ON work_days FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can update their own work days') THEN
        CREATE POLICY "Users can update their own work days"
            ON work_days FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can delete their own work days') THEN
        CREATE POLICY "Users can delete their own work days"
            ON work_days FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for user_settings if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view their own settings') THEN
        CREATE POLICY "Users can view their own settings"
            ON user_settings FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert their own settings') THEN
        CREATE POLICY "Users can insert their own settings"
            ON user_settings FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update their own settings') THEN
        CREATE POLICY "Users can update their own settings"
            ON user_settings FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can delete their own settings') THEN
        CREATE POLICY "Users can delete their own settings"
            ON user_settings FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for work_days if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_days_updated_at') THEN
        CREATE TRIGGER update_work_days_updated_at
            BEFORE UPDATE ON work_days
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create triggers for user_settings if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
        CREATE TRIGGER update_user_settings_updated_at
            BEFORE UPDATE ON user_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to initialize user settings on signup if it doesn't exist
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize user settings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;
