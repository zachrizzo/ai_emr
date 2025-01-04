export interface Organization {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

