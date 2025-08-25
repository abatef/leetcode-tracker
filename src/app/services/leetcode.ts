import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, onSnapshot } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Problem, UserStats, ProblemAction } from '../models/problem';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class LeetcodeService {
  private problemsSubject = new BehaviorSubject<Problem[]>([]);
  private statsSubject = new BehaviorSubject<UserStats>({
    totalProblems: 0,
    solvedProblems: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    streakDays: 0,
    lastActiveDate: new Date()
  });

  problems$ = this.problemsSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadUserProblems(user.uid);
      } else {
        this.problemsSubject.next([]);
        this.resetStats();
      }
    });
  }

  private loadUserProblems(userId: string): void {
    const problemsRef = collection(this.firestore, 'problems');
    const q = query(
      problemsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
      const problems: Problem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        problems.push({
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
          solvedDate: data['solvedDate']?.toDate() || null,
          lastAttemptDate: data['lastAttemptDate']?.toDate() || null,
          firstAttemptDate: data['firstAttemptDate']?.toDate() || null,
          firstSolvedDate: data['firstSolvedDate']?.toDate() || null,
          actionHistory: this.parseActionHistory(data['actionHistory'] || [])
        } as Problem);
      });
      this.problemsSubject.next(problems);
      this.updateStats(problems);
    });
  }

  private parseActionHistory(actionHistory: any[]): ProblemAction[] {
    return actionHistory.map(action => ({
      ...action,
      timestamp: action.timestamp?.toDate() || new Date()
    }));
  }

  private updateStats(problems: Problem[]): void {
    const stats: UserStats = {
      totalProblems: problems.length,
      solvedProblems: problems.filter(p => p.status === 'Solved').length,
      easyCount: problems.filter(p => p.difficulty === 'Easy' && p.status === 'Solved').length,
      mediumCount: problems.filter(p => p.difficulty === 'Medium' && p.status === 'Solved').length,
      hardCount: problems.filter(p => p.difficulty === 'Hard' && p.status === 'Solved').length,
      streakDays: this.calculateStreak(problems),
      lastActiveDate: this.getLastActiveDate(problems)
    };
    this.statsSubject.next(stats);
  }

  private calculateStreak(problems: Problem[]): number {
    const solvedDates = problems
      .filter(p => p.status === 'Solved' && p.solvedDate)
      .map(p => p.solvedDate!)
      .sort((a, b) => {
        const aTime = a ? a.getTime() : 0;
        const bTime = b ? b.getTime() : 0;
        return bTime - aTime;
      });

    if (solvedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < solvedDates.length; i++) {
      const date = new Date(solvedDates[i]);
      date.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff === streak + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private getLastActiveDate(problems: Problem[]): Date {
    const dates = problems
      .map(p => p.lastAttemptDate || p.createdAt)
      .sort((a, b) => {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        return b.getTime() - a.getTime();
      });

    return dates[0] || new Date();
  }

  private resetStats(): void {
    this.statsSubject.next({
      totalProblems: 0,
      solvedProblems: 0,
      easyCount: 0,
      mediumCount: 0,
      hardCount: 0,
      streakDays: 0,
      lastActiveDate: new Date()
    });
  }

  // ...existing code...

async addProblem(problem: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const user = this.authService.getCurrentUser();
  if (!user) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }

  console.log('Adding problem with data:', problem);

  // Clean the data and ensure no undefined values
  const cleanData: any = {
    leetcodeId: problem.leetcodeId || 0,
    title: problem.title || 'Unknown Problem',
    difficulty: problem.difficulty || 'Medium',
    status: problem.status || 'Not Attempted',
    url: problem.url || '',
    tags: Array.isArray(problem.tags) ? problem.tags.filter(tag => tag && typeof tag === 'string') : [],
    attempts: typeof problem.attempts === 'number' ? problem.attempts : 0,
    timeSpent: typeof problem.timeSpent === 'number' ? problem.timeSpent : 0,
    notes: problem.notes || '',
    companies: Array.isArray(problem.companies) ? problem.companies.filter(company => company && typeof company === 'string') : [],
    userId: user.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
    actionHistory: []
  };

  // Create initial action
  const initialAction = this.createAction(
    'created',
    undefined,
    undefined,
    undefined,
    `Problem "${cleanData.title}" was added`
  );
  cleanData.actionHistory.push(initialAction);

  // Set firstAttemptDate if status is Attempted or Solved and it's not already set
  if ((cleanData.status === 'Attempted' || cleanData.status === 'Solved') && !problem.firstAttemptDate) {
    cleanData.firstAttemptDate = new Date();
    const attemptAction = this.createAction(
      'status_changed',
      'status',
      'Not Attempted',
      cleanData.status,
      `Status changed to ${cleanData.status}`
    );
    cleanData.actionHistory.push(attemptAction);
  }

  // Set firstSolvedDate if status is Solved
  if (cleanData.status === 'Solved') {
    cleanData.firstSolvedDate = new Date();
    cleanData.solvedDate = new Date();
    const solvedAction = this.createAction(
      'status_changed',
      'status',
      undefined,
      'Solved',
      'Problem solved for the first time'
    );
    cleanData.actionHistory.push(solvedAction);
  }

  // Only add optional dates if they exist and are valid
  if (problem.solvedDate && problem.solvedDate instanceof Date) {
    cleanData.solvedDate = problem.solvedDate;
  }

  if (problem.lastAttemptDate && problem.lastAttemptDate instanceof Date) {
    cleanData.lastAttemptDate = problem.lastAttemptDate;
  }

  if (problem.firstAttemptDate && problem.firstAttemptDate instanceof Date) {
    cleanData.firstAttemptDate = problem.firstAttemptDate;
  }

  // Final cleaning to remove any undefined values
  const firebaseData = this.removeUndefinedFields(cleanData);

  console.log('Final problem data for Firestore:', firebaseData);

  try {
    const problemsRef = collection(this.firestore, 'problems');
    const docRef = await addDoc(problemsRef, firebaseData);
    console.log('Problem added successfully with ID:', docRef.id);
  } catch (error) {
    console.error('Error adding problem to Firestore:', error);
    throw error;
  }
}

/**
 * Recursively remove undefined fields from an object
 */
private removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(item => this.removeUndefinedFields(item))
      .filter(item => item !== undefined);
  }

  if (typeof obj === 'object' && obj instanceof Date) {
    return obj;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = this.removeUndefinedFields(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Create action with proper data cleaning
 */
private createAction(action: string, field?: string, oldValue?: any, newValue?: any, description?: string): ProblemAction {
  const user = this.authService.getCurrentUser();
  return {
    timestamp: new Date(),
    action: action as any,
    details: {
      field: field || undefined,
      oldValue: oldValue !== undefined ? oldValue : undefined,
      newValue: newValue !== undefined ? newValue : undefined,
      description: description || undefined
    },
    userId: user?.uid
  };
}

// ...existing code...

  async updateProblem(problemId: string, updates: Partial<Problem>): Promise<void> {
    // Get current problem to check previous status
    const currentProblems = this.problemsSubject.value;
    const currentProblem = currentProblems.find(p => p.id === problemId);

    if (!currentProblem) {
      throw new Error('Problem not found');
    }

    // Clean updates to remove undefined values
    const cleanUpdates: any = {
      updatedAt: new Date()
    };

    // Initialize action history if it doesn't exist
    const currentActionHistory = currentProblem.actionHistory || [];
    const newActions: ProblemAction[] = [];

    Object.keys(updates).forEach(key => {
      if (updates[key as keyof Problem] !== undefined && key !== 'actionHistory') {
        const oldValue = currentProblem[key as keyof Problem];
        const newValue = updates[key as keyof Problem];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          cleanUpdates[key] = newValue;

          // Create action for this change
          let actionType = 'status_changed';
          let description = '';

          switch (key) {
            case 'status':
              actionType = 'status_changed';
              description = `Status changed from ${oldValue} to ${newValue}`;
              break;
            case 'notes':
              actionType = 'notes_updated';
              description = 'Notes updated';
              break;
            case 'tags':
              actionType = 'tags_updated';
              description = 'Tags updated';
              break;
            case 'companies':
              actionType = 'companies_updated';
              description = 'Companies updated';
              break;
            case 'attempts':
              actionType = 'attempts_updated';
              description = `Attempts changed from ${oldValue} to ${newValue}`;
              break;
            case 'timeSpent':
              actionType = 'time_updated';
              description = `Time spent changed from ${oldValue} to ${newValue} minutes`;
              break;
            default:
              description = `${key} updated`;
          }

          newActions.push(this.createAction(actionType, key, oldValue, newValue, description));
        }
      }
    });

    // Handle status change logic
    if (updates.status) {
      const wasNotAttempted = currentProblem.status === 'Not Attempted';
      const nowAttempted = updates.status === 'Attempted' || updates.status === 'Solved';
      const wasSolved = currentProblem.status === 'Solved';
      const nowSolved = updates.status === 'Solved';

      // Track first attempt date
      if (wasNotAttempted && nowAttempted && !currentProblem.firstAttemptDate) {
        cleanUpdates.firstAttemptDate = new Date();
      }

      // Update lastAttemptDate when status changes to Attempted or Solved
      if (updates.status === 'Attempted' || updates.status === 'Solved') {
        cleanUpdates.lastAttemptDate = new Date();
      }

      // Handle first time solved
      if (!wasSolved && nowSolved) {
        // This is the first time the problem is being marked as solved
        if (!currentProblem.firstSolvedDate) {
          cleanUpdates.firstSolvedDate = new Date();
          cleanUpdates.solvedDate = new Date();

          // Update the action description for first solve
          const solveAction = newActions.find(action => action.details.field === 'status');
          if (solveAction) {
            solveAction.details.description = 'Problem solved for the first time';
          }
        } else {
          // Problem was solved before, just update solvedDate
          cleanUpdates.solvedDate = new Date();
        }
      } else if (wasSolved && !nowSolved) {
        // Problem was unsolved
        cleanUpdates.solvedDate = null;
      }
    }

    // Combine existing and new actions
    cleanUpdates.actionHistory = [...currentActionHistory, ...newActions];

    const problemRef = doc(this.firestore, 'problems', problemId);
    await updateDoc(problemRef, cleanUpdates);
  }

  async deleteProblem(problemId: string): Promise<void> {
    const problemRef = doc(this.firestore, 'problems', problemId);
    await deleteDoc(problemRef);
  }

  // Helper method to get problem action history
  getProblemActionHistory(problemId: string): ProblemAction[] {
    const problems = this.problemsSubject.value;
    const problem = problems.find(p => p.id === problemId);
    return problem?.actionHistory || [];
  }
}
