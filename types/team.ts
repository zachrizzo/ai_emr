export interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  members: string[];
  last_update: {
    date: string;
    updater_id: string;
  };
  leader: string;
  status: "active" | "inactive";
  tags: string[];
  meeting_schedule?: string;
  organization_id: string;
}
