export interface Problem {
  id?: string;
  leetcodeId: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Not Attempted' | 'Attempted' | 'Solved' | 'Reviewed';
  tags: string[];
  url: string;
  notes: string;
  attempts: number;
  timeSpent: number; // in minutes
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  solvedDate?: Date | null;
  lastAttemptDate?: Date | null;
  firstAttemptDate?: Date | null;
  firstSolvedDate?: Date | null; // Add this for tracking first time solved
  companies: string[];
  actionHistory?: ProblemAction[]; // Add action history
}

export interface ProblemAction {
  id?: string;
  timestamp: Date;
  action: 'created' | 'status_changed' | 'notes_updated' | 'tags_updated' | 'companies_updated' | 'attempts_updated' | 'time_updated';
  details: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
  };
  userId?: string;
}

export interface UserStats {
  totalProblems: number;
  solvedProblems: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  streakDays: number;
  lastActiveDate: Date;
}
