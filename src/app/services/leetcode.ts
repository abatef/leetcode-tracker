import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, onSnapshot } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Problem, UserStats } from '../models/problem';
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
        problems.push({ id: doc.id, ...doc.data() } as Problem);
      });
      this.problemsSubject.next(problems);
      this.updateStats(problems);
    });
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
      .sort((a, b) => b.getTime() - a.getTime());

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
      .sort((a, b) => b.getTime() - a.getTime());

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

  async addProblem(problem: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const problemData: Omit<Problem, 'id'> = {
      ...problem,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const problemsRef = collection(this.firestore, 'problems');
    await addDoc(problemsRef, problemData);
  }

  async updateProblem(problemId: string, updates: Partial<Problem>): Promise<void> {
    const problemRef = doc(this.firestore, 'problems', problemId);
    await updateDoc(problemRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteProblem(problemId: string): Promise<void> {
    const problemRef = doc(this.firestore, 'problems', problemId);
    await deleteDoc(problemRef);
  }

  // LeetCode API integration (optional - requires CORS proxy)
  async fetchProblemDetails(problemSlug: string): Promise<any> {
    try {
      // Note: This requires a CORS proxy or backend service
      // const response = await fetch(`https://leetcode.com/api/problems/algorithms/`);
      // const data = await response.json();
      // return data.stat_status_pairs.find((problem: any) =>
      //   problem.stat.question__title_slug === problemSlug
      // );

      // For now, return mock data
      return {
        stat: {
          question_id: Math.floor(Math.random() * 3000),
          question__title: 'Sample Problem',
          question__title_slug: problemSlug,
          difficulty: { level: Math.floor(Math.random() * 3) + 1 }
        }
      };
    } catch (error) {
      console.error('Failed to fetch problem details:', error);
      throw error;
    }
  }
}
