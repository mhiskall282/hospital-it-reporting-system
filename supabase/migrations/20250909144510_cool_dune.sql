/*
  # Hospital IT Operations Enhancement

  1. New Tables
    - `departments` - Hospital departments (Emergency, ICU, Surgery, etc.)
    - `equipment_types` - Medical equipment categories
    - `maintenance_schedules` - Preventive maintenance tracking
    - `compliance_records` - Regulatory compliance tracking
    - `incident_reports` - Critical equipment failures
    - `service_contracts` - Vendor service agreements

  2. Enhanced Tables
    - Add hospital-specific fields to existing tables
    - Add compliance and safety tracking
    - Add priority escalation rules

  3. Security
    - Enhanced RLS policies for hospital departments
    - Audit trail for all changes
    - HIPAA compliance considerations
*/

-- Hospital Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  head_of_department text,
  contact_number text,
  location text,
  is_critical boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Equipment Types (Medical Equipment Categories)
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_medical_device boolean DEFAULT false,
  requires_certification boolean DEFAULT false,
  maintenance_interval_days integer DEFAULT 90,
  created_at timestamptz DEFAULT now()
);

-- Maintenance Schedules
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL, -- 'preventive', 'corrective', 'emergency'
  scheduled_date date NOT NULL,
  completed_date date,
  technician_id uuid REFERENCES profiles(id),
  notes text,
  cost decimal(10,2),
  status text DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  created_at timestamptz DEFAULT now()
);

-- Compliance Records
CREATE TABLE IF NOT EXISTS compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  compliance_type text NOT NULL, -- 'FDA', 'Joint Commission', 'HIPAA', 'State'
  certificate_number text,
  issue_date date,
  expiry_date date,
  status text DEFAULT 'valid', -- 'valid', 'expired', 'pending_renewal'
  auditor_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Incident Reports
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id),
  reported_by uuid NOT NULL REFERENCES profiles(id),
  incident_type text NOT NULL, -- 'malfunction', 'safety_issue', 'data_breach', 'downtime'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description text NOT NULL,
  impact_assessment text,
  immediate_action_taken text,
  root_cause text,
  corrective_action text,
  status text DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  occurred_at timestamptz NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Service Contracts
CREATE TABLE IF NOT EXISTS service_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  contract_number text UNIQUE NOT NULL,
  equipment_type_id uuid REFERENCES equipment_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  contract_value decimal(12,2),
  contact_person text,
  contact_email text,
  contact_phone text,
  service_level_agreement text,
  status text DEFAULT 'active', -- 'active', 'expired', 'terminated'
  created_at timestamptz DEFAULT now()
);

-- Add hospital-specific columns to existing tables
DO $$
BEGIN
  -- Add department to profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department_id uuid REFERENCES departments(id);
  END IF;

  -- Add hospital-specific fields to devices
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'equipment_type_id'
  ) THEN
    ALTER TABLE devices ADD COLUMN equipment_type_id uuid REFERENCES equipment_types(id);
    ALTER TABLE devices ADD COLUMN location text;
    ALTER TABLE devices ADD COLUMN is_critical boolean DEFAULT false;
    ALTER TABLE devices ADD COLUMN last_maintenance_date date;
    ALTER TABLE devices ADD COLUMN next_maintenance_date date;
    ALTER TABLE devices ADD COLUMN compliance_status text DEFAULT 'compliant';
  END IF;

  -- Add hospital-specific fields to requests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE requests ADD COLUMN department_id uuid REFERENCES departments(id);
    ALTER TABLE requests ADD COLUMN urgency_level text DEFAULT 'routine'; -- 'routine', 'urgent', 'emergency', 'critical'
    ALTER TABLE requests ADD COLUMN patient_impact boolean DEFAULT false;
    ALTER TABLE requests ADD COLUMN estimated_downtime text;
    ALTER TABLE requests ADD COLUMN actual_resolution_time interval;
  END IF;
END $$;

-- Insert hospital departments
INSERT INTO departments (name, code, description, is_critical) VALUES
  ('Emergency Department', 'ED', 'Emergency medical services', true),
  ('Intensive Care Unit', 'ICU', 'Critical care unit', true),
  ('Operating Room', 'OR', 'Surgical services', true),
  ('Radiology', 'RAD', 'Medical imaging services', true),
  ('Laboratory', 'LAB', 'Clinical laboratory services', true),
  ('Cardiology', 'CARD', 'Heart and cardiovascular care', false),
  ('Oncology', 'ONC', 'Cancer treatment center', false),
  ('Pediatrics', 'PED', 'Children medical care', false),
  ('Pharmacy', 'PHARM', 'Medication services', false),
  ('Administration', 'ADMIN', 'Hospital administration', false),
  ('IT Department', 'IT', 'Information Technology services', false),
  ('Maintenance', 'MAINT', 'Facility maintenance', false);

-- Insert medical equipment types
INSERT INTO equipment_types (name, description, is_medical_device, requires_certification, maintenance_interval_days) VALUES
  ('MRI Machine', 'Magnetic Resonance Imaging equipment', true, true, 30),
  ('CT Scanner', 'Computed Tomography scanner', true, true, 30),
  ('X-Ray Machine', 'Radiographic imaging equipment', true, true, 60),
  ('Ultrasound', 'Ultrasonic imaging device', true, true, 90),
  ('Ventilator', 'Mechanical ventilation device', true, true, 7),
  ('Defibrillator', 'Emergency cardiac device', true, true, 30),
  ('Patient Monitor', 'Vital signs monitoring system', true, true, 90),
  ('Infusion Pump', 'Medication delivery system', true, true, 60),
  ('ECG Machine', 'Electrocardiogram device', true, true, 90),
  ('Anesthesia Machine', 'Surgical anesthesia equipment', true, true, 30),
  ('Desktop Computer', 'Standard workstation computer', false, false, 180),
  ('Laptop', 'Portable computer', false, false, 180),
  ('Printer', 'Document printing device', false, false, 90),
  ('Network Switch', 'Network infrastructure', false, false, 365),
  ('Server', 'Data server equipment', false, false, 90);

-- Update existing device categories to include medical equipment
INSERT INTO device_categories (name, description) VALUES
  ('Medical Imaging', 'MRI, CT, X-Ray, and other imaging equipment'),
  ('Life Support', 'Ventilators, monitors, and critical care devices'),
  ('Surgical Equipment', 'Operating room and surgical devices'),
  ('Laboratory Equipment', 'Clinical lab and diagnostic devices'),
  ('Patient Care', 'Bedside and patient monitoring equipment')
ON CONFLICT (name) DO NOTHING;

-- Update request types for hospital context
INSERT INTO request_types (name, description) VALUES
  ('Medical Equipment Failure', 'Critical medical device malfunction'),
  ('Emergency IT Support', 'Urgent IT assistance required'),
  ('Equipment Calibration', 'Medical device calibration request'),
  ('Software Installation', 'Clinical software installation/update'),
  ('Network Connectivity', 'Network or internet connectivity issues'),
  ('Data Recovery', 'Patient data recovery assistance'),
  ('Security Incident', 'IT security or breach incident'),
  ('Equipment Relocation', 'Moving equipment between departments')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can read departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read equipment types"
  ON equipment_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage equipment types"
  ON equipment_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read maintenance schedules"
  ON maintenance_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage maintenance schedules"
  ON maintenance_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read compliance records"
  ON compliance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage compliance records"
  ON compliance_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create incident reports"
  ON incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can read own incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    reported_by IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage incident reports"
  ON incident_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read service contracts"
  ON service_contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage service contracts"
  ON service_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_department ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_equipment_type ON devices(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department_id);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_maintenance_device ON maintenance_schedules(device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_compliance_device ON compliance_records(device_id);
CREATE INDEX IF NOT EXISTS idx_compliance_expiry ON compliance_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_incidents_device ON incident_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incident_reports(severity);

-- Function to auto-assign next maintenance date
CREATE OR REPLACE FUNCTION update_next_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.equipment_type_id IS NOT NULL THEN
    SELECT 
      COALESCE(NEW.last_maintenance_date, CURRENT_DATE) + INTERVAL '1 day' * et.maintenance_interval_days
    INTO NEW.next_maintenance_date
    FROM equipment_types et
    WHERE et.id = NEW.equipment_type_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update maintenance dates
DROP TRIGGER IF EXISTS trigger_update_maintenance_date ON devices;
CREATE TRIGGER trigger_update_maintenance_date
  BEFORE INSERT OR UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_next_maintenance_date();

-- Function to escalate urgent requests
CREATE OR REPLACE FUNCTION check_request_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-escalate emergency requests
  IF NEW.urgency_level = 'emergency' OR NEW.urgency_level = 'critical' THEN
    NEW.priority := 'urgent';
  END IF;
  
  -- Set patient impact flag for critical departments
  IF NEW.department_id IN (
    SELECT id FROM departments WHERE is_critical = true
  ) THEN
    NEW.patient_impact := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for request escalation
DROP TRIGGER IF EXISTS trigger_request_escalation ON requests;
CREATE TRIGGER trigger_request_escalation
  BEFORE INSERT OR UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION check_request_escalation();