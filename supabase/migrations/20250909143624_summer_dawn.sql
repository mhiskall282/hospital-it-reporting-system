/*
  # IT Operations System Database Schema

  1. New Tables
    - `profiles` - User profiles with roles
    - `devices` - IT device inventory
    - `requests` - User requests for assistance/gadgets
    - `request_types` - Types of requests available
    - `device_categories` - Categories for devices

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');
CREATE TYPE device_status AS ENUM ('active', 'faulty', 'maintenance', 'retired');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'user',
  department text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Device categories table
CREATE TABLE IF NOT EXISTS device_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES device_categories(id),
  model text,
  serial_number text UNIQUE,
  status device_status DEFAULT 'active',
  assigned_to uuid REFERENCES profiles(id),
  purchase_date date,
  warranty_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Request types table
CREATE TABLE IF NOT EXISTS request_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  request_type_id uuid NOT NULL REFERENCES request_types(id),
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium',
  status request_status DEFAULT 'pending',
  assigned_admin_id uuid REFERENCES profiles(id),
  device_id uuid REFERENCES devices(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Insert default data
INSERT INTO device_categories (name, description) VALUES
  ('Laptops', 'Desktop and portable computers'),
  ('Peripherals', 'Keyboards, mice, monitors, etc.'),
  ('Network Equipment', 'Routers, switches, access points'),
  ('Mobile Devices', 'Phones, tablets'),
  ('Printers', 'All printing devices'),
  ('Storage', 'External drives, NAS systems');

INSERT INTO request_types (name, description) VALUES
  ('Hardware Issue', 'Report faulty or malfunctioning hardware'),
  ('Software Issue', 'Report software problems or installation requests'),
  ('New Equipment', 'Request new IT equipment'),
  ('Replacement', 'Request replacement for faulty equipment'),
  ('Access Request', 'Request access to systems or applications'),
  ('General Support', 'Other IT support requests');

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_types ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Devices policies
CREATE POLICY "Users can read devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage devices"
  ON devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Requests policies
CREATE POLICY "Users can read own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Public read policies for reference tables
CREATE POLICY "Users can read device categories"
  ON device_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read request types"
  ON request_types FOR SELECT
  TO authenticated
  USING (true);

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email = 'mhiskall123@gmail.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();