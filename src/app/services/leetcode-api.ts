import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';

export interface LeetCodeProblem {
  id?: number;
  questionId?: string;
  questionFrontendId?: string;
  frontendQuestionId?: string;
  title: string;
  questionTitle?: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  content?: string;
  isPaidOnly?: boolean;
  tags?: string[];
  companies?: string[];
  hints?: string[];
  similar?: Array<{
    title: string;
    titleSlug: string;
    difficulty: string;
  }>;
  exampleTestcases?: string;
  constraints?: string;
  stats?: {
    totalAccepted: string;
    totalSubmission: string;
    totalAcceptedRaw: number;
    totalSubmissionRaw: number;
    acRate: string;
  };
}

export interface LeetCodeDailyChallenge {
  date: string;
  userStatus: string;
  link: string;
  question: {
    questionId: string;
    questionFrontendId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    isPaidOnly: boolean;
    categoryTitle: string;
  };
}

export interface LeetCodeUserProfile {
  username: string;
  name: string;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHubUrl: string;
  twitterUrl: string;
  linkedInUrl: string;
  profile: {
    realName: string;
    aboutMe: string;
    userAvatar: string;
    location: string;
    skillTags: string[];
    postViewCount: number;
    postViewCountDiff: number;
    reputation: number;
    reputationDiff: number;
    solutionCount: number;
    solutionCountDiff: number;
    categoryDiscussCount: number;
    categoryDiscussCountDiff: number;
  };
  submissionCalendar: { [date: string]: number };
  submitStats: {
    acSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
    totalSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
  };
  badges: Array<{
    id: string;
    displayName: string;
    icon: string;
    creationDate: string;
  }>;
  activeBadge: {
    id: string;
    displayName: string;
    icon: string;
    creationDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LeetCodeApiService {
  private readonly baseUrl = 'https://alfa-leetcode-api.onrender.com';

  constructor(private http: HttpClient) {}

  /**
   * Get problem by ID or title slug
   */
  getProblem(identifier: string | number): Observable<LeetCodeProblem> {
    return this.http.get<LeetCodeProblem>(`${this.baseUrl}/select?titleSlug=${identifier}`)
      .pipe(
        map(response => this.validateProblemResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Get daily challenge
   */
  getDailyChallenge(): Observable<LeetCodeDailyChallenge> {
    return this.http.get<LeetCodeDailyChallenge>(`${this.baseUrl}/daily`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get random problem by difficulty
   */
  getRandomProblem(difficulty?: 'Easy' | 'Medium' | 'Hard'): Observable<LeetCodeProblem> {
    const url = difficulty
      ? `${this.baseUrl}/randomq?difficulty=${difficulty}`
      : `${this.baseUrl}/randomq`;

    return this.http.get<LeetCodeProblem>(url)
      .pipe(
        map(response => this.validateProblemResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Validate and normalize problem response
   */
  private validateProblemResponse(response: any): LeetCodeProblem {
    console.log('Validating API response:', response);

    if (!response || typeof response !== 'object') {
      throw new Error('Invalid API response format');
    }

    // Handle case where response might be wrapped
    const problem = response.data || response;

    // Normalize the response
    const normalizedProblem: LeetCodeProblem = {
      id: problem.id || problem.questionId || problem.frontendQuestionId || problem.questionFrontendId,
      questionId: problem.questionId || problem.id,
      questionFrontendId: problem.questionFrontendId || problem.frontendQuestionId || problem.id,
      title: problem.title || problem.questionTitle || 'Unknown Problem',
      titleSlug: problem.titleSlug || problem.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      difficulty: problem.difficulty || 'Medium',
      content: problem.content,
      isPaidOnly: problem.isPaidOnly || false,
      tags: Array.isArray(problem.tags) ? problem.tags : (problem.topicTags?.map((tag: any) => tag.name) || []),
      companies: Array.isArray(problem.companies) ? problem.companies : [],
      hints: Array.isArray(problem.hints) ? problem.hints : [],
      similar: Array.isArray(problem.similar) ? problem.similar : [],
      exampleTestcases: problem.exampleTestcases,
      constraints: problem.constraints,
      stats: problem.stats
    };

    console.log('Normalized problem:', normalizedProblem);

    return normalizedProblem;
  }

  /**
   * Get user profile by username
   */
  getUserProfile(username: string): Observable<LeetCodeUserProfile> {
    return this.http.get<LeetCodeUserProfile>(`${this.baseUrl}/${username}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get user solved problems
   */
  getUserSolvedProblems(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${username}/solved`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get user contest info
   */
  getUserContestInfo(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${username}/contest`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get user submission stats
   */
  getUserSubmissionStats(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${username}/submission`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get problems by tag
   */
  getProblemsByTag(tag: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/problems?tags=${tag}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get all problems list
   */
  getAllProblems(limit: number = 50, skip: number = 0): Observable<any> {
    return this.http.get(`${this.baseUrl}/problems?limit=${limit}&skip=${skip}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Search problems by keyword
   */
  searchProblems(keyword: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/problems?search=${keyword}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get LeetCode problem URL from title slug
   */
  getLeetCodeUrl(titleSlug: string): string {
    return `https://leetcode.com/problems/${titleSlug}/`;
  }

  /**
   * Convert API problem to our Problem model
   */
  convertApiProblemToLocal(apiProblem: LeetCodeProblem): Partial<import('../models/problem').Problem> {
    const problemId = apiProblem.id ||
                     apiProblem.questionId ||
                     apiProblem.questionFrontendId;

    return {
      leetcodeId: problemId ? Number(problemId) : Math.floor(Math.random() * 10000),
      title: apiProblem.title || 'Unknown Problem',
      difficulty: this.normalizeDifficulty(apiProblem.difficulty),
      status: 'Not Attempted',
      tags: apiProblem.tags || [],
      companies: apiProblem.companies || [],
      url: this.getLeetCodeUrl(apiProblem.titleSlug),
      notes: '',
      attempts: 0,
      timeSpent: 0
    };
  }

  /**
   * Normalize difficulty string
   */
  private normalizeDifficulty(difficulty: any): 'Easy' | 'Medium' | 'Hard' {
    if (!difficulty) return 'Medium';

    const difficultyStr = String(difficulty).toLowerCase();

    if (difficultyStr.includes('easy')) return 'Easy';
    if (difficultyStr.includes('medium')) return 'Medium';
    if (difficultyStr.includes('hard')) return 'Hard';

    // Default fallback
    return 'Medium';
  }

  private handleError(error: any): Observable<never> {
    console.error('LeetCode API Error:', error);

    let errorMessage = 'An error occurred while fetching data from LeetCode API';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to LeetCode API. Please check your internet connection.';
    } else if (error.status === 404) {
      errorMessage = 'Problem not found';
    } else if (error.status >= 500) {
      errorMessage = 'LeetCode API server error. Please try again later.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
