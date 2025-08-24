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
        const data = doc.data();
        problems.push({
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
          solvedDate: data['solvedDate']?.toDate() || null,
          lastAttemptDate: data['lastAttemptDate']?.toDate() || null,
          firstAttemptDate: data['firstAttemptDate']?.toDate() || null, // Add this line
        } as Problem);
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

  async addProblem(problem: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('Adding problem with data:', problem);

    // Clean the data to remove undefined values
    const cleanData: any = {
      leetcodeId: problem.leetcodeId,
      title: problem.title,
      difficulty: problem.difficulty,
      status: problem.status,
      url: problem.url,
      tags: problem.tags || [],
      attempts: problem.attempts || 0,
      timeSpent: problem.timeSpent || 0,
      notes: problem.notes || '',
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set firstAttemptDate if status is Attempted or Solved and it's not already set
    if ((problem.status === 'Attempted' || problem.status === 'Solved') && !problem.firstAttemptDate) {
      cleanData.firstAttemptDate = new Date();
    }

    // Only add optional dates if they exist
    if (problem.solvedDate) {
      cleanData.solvedDate = problem.solvedDate;
    }

    if (problem.lastAttemptDate) {
      cleanData.lastAttemptDate = problem.lastAttemptDate;
    }

    if (problem.firstAttemptDate) {
      cleanData.firstAttemptDate = problem.firstAttemptDate;
    }

    console.log('Final problem data:', cleanData);

    try {
      const problemsRef = collection(this.firestore, 'problems');
      const docRef = await addDoc(problemsRef, cleanData);
      console.log('Problem added successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding problem to Firestore:', error);
      throw error;
    }
  }

  async updateProblem(problemId: string, updates: Partial<Problem>): Promise<void> {
    // Get current problem to check previous status
    const currentProblems = this.problemsSubject.value;
    const currentProblem = currentProblems.find(p => p.id === problemId);

    // Clean updates to remove undefined values
    const cleanUpdates: any = {
      updatedAt: new Date()
    };

    Object.keys(updates).forEach(key => {
      if (updates[key as keyof Problem] !== undefined) {
        cleanUpdates[key] = updates[key as keyof Problem];
      }
    });

    // Track first attempt date
    if (currentProblem && updates.status) {
      const wasNotAttempted = currentProblem.status === 'Not Attempted';
      const nowAttempted = updates.status === 'Attempted' || updates.status === 'Solved';

      if (wasNotAttempted && nowAttempted && !currentProblem.firstAttemptDate) {
        cleanUpdates.firstAttemptDate = new Date();
      }
    }

    // Update lastAttemptDate when status changes to Attempted or Solved
    if (updates.status && (updates.status === 'Attempted' || updates.status === 'Solved')) {
      cleanUpdates.lastAttemptDate = new Date();
    }

    const problemRef = doc(this.firestore, 'problems', problemId);
    await updateDoc(problemRef, cleanUpdates);
  }

  async deleteProblem(problemId: string): Promise<void> {
    const problemRef = doc(this.firestore, 'problems', problemId);
    await deleteDoc(problemRef);
  }
}
