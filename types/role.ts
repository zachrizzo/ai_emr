export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  parent_role_id?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

