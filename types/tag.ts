export type TagColor =
  | "slate"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "purple"
  | "pink";

export type TeamTag = {
  id: string;
  teamId: string;
  name: string;
  color: TagColor;
  createdByUserId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TeamTagRow = {
  id: string;
  team_id: string;
  name: string;
  color: string;
  created_by_user_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
