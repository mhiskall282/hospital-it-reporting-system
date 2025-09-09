import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'user';
          department: string | null;
          department_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name: string;
          role?: 'admin' | 'user';
          department?: string | null;
          department_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'user';
          department?: string | null;
          department_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          equipment_type_id: string | null;
          model: string | null;
          serial_number: string | null;
          status: 'active' | 'faulty' | 'maintenance' | 'retired';
          assigned_to: string | null;
          location: string | null;
          is_critical: boolean;
          last_maintenance_date: string | null;
          next_maintenance_date: string | null;
          compliance_status: string;
          purchase_date: string | null;
          warranty_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      requests: {
        Row: {
          id: string;
          user_id: string;
          request_type_id: string;
          department_id: string | null;
          title: string;
          description: string;
          priority: string;
          urgency_level: string;
          patient_impact: boolean;
          estimated_downtime: string | null;
          actual_resolution_time: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'rejected';
          assigned_admin_id: string | null;
          device_id: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          head_of_department: string | null;
          contact_number: string | null;
          location: string | null;
          is_critical: boolean;
          created_at: string;
        };
      };
      equipment_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_medical_device: boolean;
          requires_certification: boolean;
          maintenance_interval_days: number;
          created_at: string;
        };
      };
      maintenance_schedules: {
        Row: {
          id: string;
          device_id: string;
          maintenance_type: string;
          scheduled_date: string;
          completed_date: string | null;
          technician_id: string | null;
          notes: string | null;
          cost: number | null;
          status: string;
          created_at: string;
        };
      };
      compliance_records: {
        Row: {
          id: string;
          device_id: string;
          compliance_type: string;
          certificate_number: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          status: string;
          auditor_name: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      incident_reports: {
        Row: {
          id: string;
          device_id: string | null;
          reported_by: string;
          incident_type: string;
          severity: string;
          description: string;
          impact_assessment: string | null;
          immediate_action_taken: string | null;
          root_cause: string | null;
          corrective_action: string | null;
          status: string;
          occurred_at: string;
          resolved_at: string | null;
          created_at: string;
        };
      };
      service_contracts: {
        Row: {
          id: string;
          vendor_name: string;
          contract_number: string;
          equipment_type_id: string | null;
          start_date: string;
          end_date: string;
          contract_value: number | null;
          contact_person: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          service_level_agreement: string | null;
          status: string;
          created_at: string;
        };
      };
      device_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
      };
      request_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
      };
    };
  };
};