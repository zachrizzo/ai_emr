import { Role } from './role'

export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: Role[];
  speciality?: string;
  assigned_location?: string;
  phone_number?: string;
  status: 'active' | 'inactive';
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

