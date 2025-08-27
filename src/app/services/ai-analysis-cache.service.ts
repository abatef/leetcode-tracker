import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDocs, addDoc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CachedAIAnalysis, ProblemAnalysis } from '../models/ai-analysis';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AIAnalysisCacheService {
  private readonly CURRENT_VERSION = '1.0'; // Increment when AI prompts change significantly
  private readonly CACHE_COLLECTION = 'ai_analysis_cache';

  // In-memory cache for session
  private memoryCache = new Map<string, CachedAIAnalysis>();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  /**
   * Get cached analysis for a problem
   */
  async getCachedAnalysis(problemId: number, titleSlug?: string): Promise<CachedAIAnalysis | null> {
    const cacheKey = this.getCacheKey(problemId, titleSlug);

    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)!;
      console.log('Found AI analysis in memory cache for problem:', problemId);
      return cached;
    }

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        console.warn('No authenticated user; skipping Firestore cache lookup');
        return null;
      }
      // Check Firestore cache in user subcollection
      const cacheRef = collection(this.firestore, 'users', user.uid, this.CACHE_COLLECTION);

      // Query by problemId and current version
      const q = query(
        cacheRef,
        where('problemId', '==', problemId),
        where('version', '==', this.CURRENT_VERSION),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const cachedAnalysis: CachedAIAnalysis = {
          id: querySnapshot.docs[0].id,
          ...docData,
          createdAt: docData['createdAt']?.toDate() || new Date(),
          updatedAt: docData['updatedAt']?.toDate() || new Date(),
        } as CachedAIAnalysis;

        // Store in memory cache
        this.memoryCache.set(cacheKey, cachedAnalysis);

        console.log('Found AI analysis in Firestore cache for problem:', problemId);
        return cachedAnalysis;
      }

      console.log('No cached AI analysis found for problem:', problemId);
      return null;
    } catch (error) {
      console.error('Error retrieving cached AI analysis:', error);
      return null;
    }
  }

  /**
   * Save analysis to cache
   */
  async saveAnalysisToCache(
    problemId: number,
    analysisData: ProblemAnalysis,
    titleSlug?: string,
    problemTitle?: string
  ): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      const now = new Date();

      const cacheData: Omit<CachedAIAnalysis, 'id'> = {
        problemId,
        titleSlug,
        analysisData,
        createdAt: now,
        updatedAt: now,
        version: this.CURRENT_VERSION,
        userId: user.uid // user-specific caching
      };

      // Save to Firestore in user subcollection
      const cacheRef = collection(this.firestore, 'users', user.uid, this.CACHE_COLLECTION);
      const docRef = await addDoc(cacheRef, {
        ...cacheData,
        problemTitle: problemTitle || `Problem ${problemId}` // For easier identification
      });

      // Save to memory cache
      const cachedAnalysis: CachedAIAnalysis = {
        id: docRef.id,
        ...cacheData
      };

      const cacheKey = this.getCacheKey(problemId, titleSlug);
      this.memoryCache.set(cacheKey, cachedAnalysis);

      console.log('AI analysis saved to cache for problem:', problemId);
    } catch (error) {
      console.error('Error saving AI analysis to cache:', error);
      throw error;
    }
  }

  /**
   * Check if analysis exists in cache
   */
  async hasAnalysisInCache(problemId: number, titleSlug?: string): Promise<boolean> {
    const cached = await this.getCachedAnalysis(problemId, titleSlug);
    return cached !== null;
  }

  /**
   * Update existing cached analysis
   */
  async updateCachedAnalysis(
    cachedAnalysisId: string,
    analysisData: ProblemAnalysis
  ): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      const docRef = doc(this.firestore, 'users', user.uid, this.CACHE_COLLECTION, cachedAnalysisId);

      await updateDoc(docRef, {
        analysisData,
        updatedAt: new Date(),
        version: this.CURRENT_VERSION
      });

      // Update memory cache if it exists
      for (const [key, cached] of this.memoryCache.entries()) {
        if (cached.id === cachedAnalysisId) {
          cached.analysisData = analysisData;
          cached.updatedAt = new Date();
          break;
        }
      }

      console.log('AI analysis updated in cache:', cachedAnalysisId);
    } catch (error) {
      console.error('Error updating cached AI analysis:', error);
      throw error;
    }
  }

  /**
   * Clear old cache entries (for maintenance)
   */
  async clearOldCacheEntries(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const cacheRef = collection(this.firestore, this.CACHE_COLLECTION);
      const q = query(
        cacheRef,
        where('updatedAt', '<', cutoffDate)
      );

      const querySnapshot = await getDocs(q);

      // In a real implementation, you'd want to use batch delete
      console.log(`Found ${querySnapshot.size} old cache entries to potentially clean up`);

      // For now, just log - implement batch delete if needed
    } catch (error) {
      console.error('Error clearing old cache entries:', error);
    }
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    console.log('Memory cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { memoryCacheSize: number } {
    return {
      memoryCacheSize: this.memoryCache.size
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(problemId: number, titleSlug?: string): string {
    return titleSlug ? `${problemId}_${titleSlug}` : `${problemId}`;
  }

  /**
   * Check if cached analysis is still valid (not too old)
   */
  private isCacheValid(cachedAnalysis: CachedAIAnalysis, maxAgeHours: number = 24 * 7): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - cachedAnalysis.updatedAt.getTime();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    return cacheAge < maxAgeMs && cachedAnalysis.version === this.CURRENT_VERSION;
  }
}
