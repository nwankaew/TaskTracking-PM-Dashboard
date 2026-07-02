export type ProjectStatus = 'on-track' | 'at-risk' | 'delayed';

export interface Project {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  status: ProjectStatus;
  progress: number;
  durationText: string;
  startWeek: number; // 1 to 7
  endWeek: number; // 1 to 7
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  taskName: string;
  description?: string;
}

export interface Milestone {
  id: string;
  date: string; // e.g. "15 พ.ค."
  title: string;
  description: string;
  weekPosition?: number; // Approximate week (1-7) to show flag on timeline
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  team: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  teamId: string;
  startDate?: string; // YYYY-MM-DD
  projectId?: string; // ID of the Project it belongs to
}
