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
