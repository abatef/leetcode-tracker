import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  limit,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Problem, UserStats, ProblemAction } from '../models/problem';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
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
    lastActiveDate: new Date(),
  });

  problems$ = this.problemsSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.authService.user$.subscribe((user) => {
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
    const q = query(problemsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

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
          actionHistory: this.parseActionHistory(data['actionHistory'] || []),
        } as Problem);
      });
      this.problemsSubject.next(problems);
      this.updateStats(problems);
    });
  }

  private parseActionHistory(actionHistory: any[]): ProblemAction[] {
    return actionHistory.map((action) => ({
      ...action,
      timestamp: action.timestamp?.toDate() || new Date(),
    }));
  }

  private updateStats(problems: Problem[]): void {
    const stats: UserStats = {
      totalProblems: problems.length,
      solvedProblems: problems.filter((p) => p.status === 'Solved').length,
      easyCount: problems.filter((p) => p.difficulty === 'Easy' && p.status === 'Solved').length,
      mediumCount: problems.filter((p) => p.difficulty === 'Medium' && p.status === 'Solved')
        .length,
      hardCount: problems.filter((p) => p.difficulty === 'Hard' && p.status === 'Solved').length,
      streakDays: this.calculateStreak(problems),
      lastActiveDate: this.getLastActiveDate(problems),
    };
    this.statsSubject.next(stats);
  }

  private calculateStreak(problems: Problem[]): number {
    const solvedDates = problems
      .filter((p) => p.status === 'Solved' && p.solvedDate)
      .map((p) => p.solvedDate!)
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
      .map((p) => p.lastAttemptDate || p.createdAt)
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
      lastActiveDate: new Date(),
    });
  }

  async seedDemoDataIfEmpty(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Cannot seed demo data without a signed-in user');
    }

    const problemsRef = collection(this.firestore, 'problems');
    const q = query(problemsRef, where('userId', '==', user.uid), limit(1));
    const existing = await getDocs(q);
    if (!existing.empty) {
      return;
    }

    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    const demoProblems: Array<Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = [
      {
        leetcodeId: 1,
        title: 'Two Sum',
        difficulty: 'Easy',
        status: 'Solved',
        url: 'https://leetcode.com/problems/two-sum/',
        tags: ['Array', 'Hash Table'],
        companies: ['Amazon', 'Google'],
        notes: 'Classic hash map approach.',
        attempts: 1,
        timeSpent: 10,
        firstAttemptDate: daysAgo(7),
        firstSolvedDate: daysAgo(7),
        solvedDate: daysAgo(1),
        lastAttemptDate: daysAgo(1),
      },
      {
        leetcodeId: 2,
        title: 'Add Two Numbers',
        difficulty: 'Medium',
        status: 'Attempted',
        url: 'https://leetcode.com/problems/add-two-numbers/',
        tags: ['Linked List', 'Math'],
        companies: ['Microsoft', 'Meta'],
        notes: 'Review edge cases for carry.',
        attempts: 2,
        timeSpent: 35,
        firstAttemptDate: daysAgo(3),
        lastAttemptDate: daysAgo(2),
      },
      {
        leetcodeId: 3,
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        status: 'Solved',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        tags: ['String', 'Sliding Window'],
        companies: ['Google', 'Adobe'],
        notes: 'Sliding window with map of last seen positions.',
        attempts: 1,
        timeSpent: 25,
        firstAttemptDate: daysAgo(5),
        firstSolvedDate: daysAgo(5),
        solvedDate: daysAgo(5),
        lastAttemptDate: daysAgo(5),
      },
      {
        leetcodeId: 4,
        title: 'Median of Two Sorted Arrays',
        difficulty: 'Hard',
        status: 'Not Attempted',
        url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
        tags: ['Array', 'Binary Search'],
        companies: ['Google', 'Apple'],
        notes: '',
        attempts: 0,
        timeSpent: 0,
      },
      {
        leetcodeId: 5,
        title: 'Best Time to Buy and Sell Stock',
        difficulty: 'Easy',
        status: 'Reviewed',
        url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
        tags: ['Array', 'Dynamic Programming'],
        companies: ['Bloomberg'],
        notes: 'One pass tracking min price.',
        attempts: 3,
        timeSpent: 15,
        firstAttemptDate: daysAgo(14),
        lastAttemptDate: daysAgo(1),
      },
    ];

    for (const p of demoProblems) {
      await this.addProblem(p);
    }

    const current = this.problemsSubject.value;
    if (current.length > 0) {
      this.updateStats(current);
    }
  }

  async addProblem(
    problem: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('Adding problem with data:', problem);

    const cleanData: any = {
      leetcodeId: problem.leetcodeId || 0,
      title: problem.title || 'Unknown Problem',
      difficulty: problem.difficulty || 'Medium',
      status: problem.status || 'Not Attempted',
      url: problem.url || '',
      tags: Array.isArray(problem.tags)
        ? problem.tags.filter((tag) => tag && typeof tag === 'string')
        : [],
      attempts: typeof problem.attempts === 'number' ? problem.attempts : 0,
      timeSpent: typeof problem.timeSpent === 'number' ? problem.timeSpent : 0,
      notes: problem.notes || '',
      companies: Array.isArray(problem.companies)
        ? problem.companies.filter((company) => company && typeof company === 'string')
        : [],
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      actionHistory: [],
    };

    const initialAction = this.createAction(
      'created',
      undefined,
      undefined,
      undefined,
      `Problem "${cleanData.title}" was added`
    );
    cleanData.actionHistory.push(initialAction);

    if (
      (cleanData.status === 'Attempted' || cleanData.status === 'Solved') &&
      !problem.firstAttemptDate
    ) {
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

    if (problem.solvedDate && problem.solvedDate instanceof Date) {
      cleanData.solvedDate = problem.solvedDate;
    }

    if (problem.lastAttemptDate && problem.lastAttemptDate instanceof Date) {
      cleanData.lastAttemptDate = problem.lastAttemptDate;
    }

    if (problem.firstAttemptDate && problem.firstAttemptDate instanceof Date) {
      cleanData.firstAttemptDate = problem.firstAttemptDate;
    }

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

  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.removeUndefinedFields(item))
        .filter((item) => item !== undefined);
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

  private createAction(
    action: string,
    field?: string,
    oldValue?: any,
    newValue?: any,
    description?: string
  ): ProblemAction {
    const user = this.authService.getCurrentUser();
    return {
      timestamp: new Date(),
      action: action as any,
      details: {
        field: field || undefined,
        oldValue: oldValue !== undefined ? oldValue : undefined,
        newValue: newValue !== undefined ? newValue : undefined,
        description: description || undefined,
      },
      userId: user?.uid,
    };
  }

  async updateProblem(problemId: string, updates: Partial<Problem>): Promise<void> {
    const currentProblems = this.problemsSubject.value;
    const currentProblem = currentProblems.find((p) => p.id === problemId);

    if (!currentProblem) {
      throw new Error('Problem not found');
    }

    const cleanUpdates: any = {
      updatedAt: new Date(),
    };

    const currentActionHistory = currentProblem.actionHistory || [];
    const newActions: ProblemAction[] = [];

    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof Problem] !== undefined && key !== 'actionHistory') {
        const oldValue = currentProblem[key as keyof Problem];
        const newValue = updates[key as keyof Problem];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          cleanUpdates[key] = newValue;

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

    if (updates.status) {
      const wasNotAttempted = currentProblem.status === 'Not Attempted';
      const nowAttempted = updates.status === 'Attempted' || updates.status === 'Solved';
      const wasSolved = currentProblem.status === 'Solved';
      const nowSolved = updates.status === 'Solved';

      if (wasNotAttempted && nowAttempted && !currentProblem.firstAttemptDate) {
        cleanUpdates.firstAttemptDate = new Date();
      }

      if (updates.status === 'Attempted' || updates.status === 'Solved') {
        cleanUpdates.lastAttemptDate = new Date();
      }

      if (!wasSolved && nowSolved) {
        if (!currentProblem.firstSolvedDate) {
          cleanUpdates.firstSolvedDate = new Date();
          cleanUpdates.solvedDate = new Date();

          const solveAction = newActions.find((action) => action.details.field === 'status');
          if (solveAction) {
            solveAction.details.description = 'Problem solved for the first time';
          }
        } else {
          cleanUpdates.solvedDate = new Date();
        }
      } else if (wasSolved && !nowSolved) {
        cleanUpdates.solvedDate = null;
      }
    }

    cleanUpdates.actionHistory = [...currentActionHistory, ...newActions];

    const problemRef = doc(this.firestore, 'problems', problemId);
    await updateDoc(problemRef, cleanUpdates);
  }

  async deleteProblem(problemId: string): Promise<void> {
    const problemRef = doc(this.firestore, 'problems', problemId);
    await deleteDoc(problemRef);
  }

  getProblemActionHistory(problemId: string): ProblemAction[] {
    const problems = this.problemsSubject.value;
    const problem = problems.find((p) => p.id === problemId);
    return problem?.actionHistory || [];
  }
}
