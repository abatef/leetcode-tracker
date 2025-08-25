import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

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
  // Use local proxy in development, direct API in production
  private readonly graphqlUrl = this.isProduction()
    ? 'https://leetcode.com/graphql'
    : '/api/leetcode/graphql';

  constructor(private http: HttpClient) {}

  private isProduction(): boolean {
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1';
  }

  /**
   * Get problem by ID or title slug using GraphQL with improved error handling
   */
  getProblem(identifier: string | number): Observable<LeetCodeProblem> {
    console.log('Getting problem for identifier:', identifier);

    // Determine if identifier is a number (questionId) or string (titleSlug)
    const isNumeric = !isNaN(Number(identifier));

    if (isNumeric) {
      // Try multiple approaches for numeric identifiers
      return this.getProblemByQuestionId(Number(identifier)).pipe(
        switchMap(response => {
          if (response.data?.question) {
            return of(this.validateProblemResponse(response));
          } else {
            console.log('Question not found by questionId, trying to search in problem list...');
            // Fallback: search in the problem list
            return this.searchProblemInList(Number(identifier));
          }
        }),
        catchError(error => {
          console.log('Primary search failed, trying fallback search...', error);
          return this.searchProblemInList(Number(identifier));
        })
      );
    } else {
      // For string identifiers, try titleSlug first, then search if not found
      return this.getProblemByTitleSlug(String(identifier)).pipe(
        switchMap(response => {
          if (response.data?.question) {
            return of(this.validateProblemResponse(response));
          } else {
            console.log('Question not found by titleSlug, trying to search in problem list...');
            return this.searchProblemByTitleInList(String(identifier));
          }
        }),
        catchError(error => {
          console.log('Primary search failed, trying fallback search...', error);
          return this.searchProblemByTitleInList(String(identifier));
        })
      );
    }
  }

  /**
   * Search for problem in the problem list by frontend ID
   */
  private searchProblemInList(frontendId: number): Observable<LeetCodeProblem> {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            stats
          }
        }
      }
    `;

    const variables = {
      categorySlug: "",
      limit: 1,
      skip: 0,
      filters: {
        searchKeywords: frontendId.toString()
      }
    };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const questions = response.data?.problemsetQuestionList?.questions || [];

        // Find exact match by frontend ID
        const exactMatch = questions.find((q: any) =>
          parseInt(q.questionFrontendId) === frontendId
        );

        if (exactMatch) {
          return this.validateProblemResponse({ data: { question: exactMatch } });
        }

        // If no exact match, throw error
        throw new Error(`Problem with ID ${frontendId} not found`);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Search for problem in the problem list by title
   */
  private searchProblemByTitleInList(titleOrSlug: string): Observable<LeetCodeProblem> {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            stats
          }
        }
      }
    `;

    const variables = {
      categorySlug: "",
      limit: 10,
      skip: 0,
      filters: {
        searchKeywords: titleOrSlug
      }
    };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const questions = response.data?.problemsetQuestionList?.questions || [];

        if (questions.length === 0) {
          throw new Error(`Problem "${titleOrSlug}" not found`);
        }

        // Find best match
        let bestMatch = questions.find((q: any) =>
          q.titleSlug === titleOrSlug ||
          q.title.toLowerCase() === titleOrSlug.toLowerCase()
        );

        // If no exact match, use first result
        if (!bestMatch) {
          bestMatch = questions[0];
        }

        return this.validateProblemResponse({ data: { question: bestMatch } });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get problem by question ID
   */
  private getProblemByQuestionId(questionId: number): Observable<any> {
    const query = `
      query getQuestionDetail($questionId: String!) {
        question(questionId: $questionId) {
          questionId
          questionFrontendId
          title
          titleSlug
          difficulty
          content
          isPaidOnly
          topicTags {
            name
            slug
          }
          companyTagStats
          hints
          similarQuestions
          exampleTestcases
          stats
        }
      }
    `;

    const variables = {
      questionId: questionId.toString()
    };

    return this.executeGraphQLQuery(query, variables);
  }

  /**
   * Get problem by title slug
   */
  private getProblemByTitleSlug(titleSlug: string): Observable<any> {
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          difficulty
          content
          isPaidOnly
          topicTags {
            name
            slug
          }
          companyTagStats
          hints
          similarQuestions
          exampleTestcases
          stats
        }
      }
    `;

    const variables = {
      titleSlug: titleSlug
    };

    return this.executeGraphQLQuery(query, variables);
  }

  /**
   * Get daily challenge using GraphQL
   */
  getDailyChallenge(): Observable<LeetCodeDailyChallenge> {
    const query = `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          userStatus
          link
          question {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            categoryTitle
          }
        }
      }
    `;

    return this.executeGraphQLQuery(query, {}).pipe(
      map(response => {
        const challenge = response.data?.activeDailyCodingChallengeQuestion;
        if (!challenge) {
          throw new Error('Daily challenge not found');
        }
        return challenge;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get random problem by difficulty using GraphQL
   */
  getRandomProblem(difficulty?: 'Easy' | 'Medium' | 'Hard'): Observable<LeetCodeProblem> {
    // First get all problems, then filter and pick random
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            stats
          }
        }
      }
    `;

    const filters: any = {};
    if (difficulty) {
      filters.difficulty = difficulty.toUpperCase();
    }

    const variables = {
      categorySlug: "",
      limit: 50, // Get 50 problems to choose from
      skip: Math.floor(Math.random() * 1000), // Random starting point
      filters: filters
    };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const questions = response.data?.problemsetQuestionList?.questions;
        if (!questions || questions.length === 0) {
          throw new Error('No problems found');
        }

        // Pick random problem from the list
        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];

        return this.validateProblemResponse({ data: { question: randomQuestion } });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Search problems by keyword
   */
  searchProblems(keyword: string, limit: number = 20): Observable<LeetCodeProblem[]> {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            stats
          }
        }
      }
    `;

    const variables = {
      categorySlug: "",
      limit: limit,
      skip: 0,
      filters: {
        searchKeywords: keyword
      }
    };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const questions = response.data?.problemsetQuestionList?.questions || [];
        return questions.map((q: any) => this.validateProblemResponse({ data: { question: q } }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get problems by tag
   */
  getProblemsByTag(tag: string, limit: number = 50): Observable<LeetCodeProblem[]> {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            stats
          }
        }
      }
    `;

    const variables = {
      categorySlug: "",
      limit: limit,
      skip: 0,
      filters: {
        tags: [tag]
      }
    };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const questions = response.data?.problemsetQuestionList?.questions || [];
        return questions.map((q: any) => this.validateProblemResponse({ data: { question: q } }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get all problems with pagination
   */
  getAllProblems(limit: number = 50, skip: number = 0): Observable<{problems: LeetCodeProblem[], total: number}> {
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            stats
          }
        }
      }
    `;

    const variables = {
      categorySlug: "",
      limit: limit,
      skip: skip,
      filters: {}
    };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const questionList = response.data?.problemsetQuestionList;
        const questions = questionList?.questions || [];
        const total = questionList?.total || 0;

        return {
          problems: questions.map((q: any) => this.validateProblemResponse({ data: { question: q } })),
          total: total
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Execute GraphQL query
   */
  private executeGraphQLQuery(query: string, variables: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://leetcode.com/'
    });

    const body = {
      query: query,
      variables: variables
    };

    return this.http.post(this.graphqlUrl, body, { headers });
  }

  /**
   * Validate and normalize problem response with better error handling
   */
  private validateProblemResponse(response: any): LeetCodeProblem {
    console.log('Validating GraphQL response:', response);

    if (!response || !response.data) {
      throw new Error('Invalid GraphQL response format');
    }

    const question = response.data.question;
    if (!question) {
      throw new Error('Question not found in response');
    }

    // Parse company tags safely
    let companies: string[] = [];
    if (question.companyTagStats) {
      try {
        const companyStats = JSON.parse(question.companyTagStats);
        companies = Object.keys(companyStats)
          .slice(0, 10)
          .filter(company => company && typeof company === 'string');
      } catch (e) {
        console.warn('Failed to parse company stats:', e);
        companies = [];
      }
    }

    // Parse similar questions safely
    let similar: Array<{title: string; titleSlug: string; difficulty: string}> = [];
    if (question.similarQuestions) {
      try {
        similar = JSON.parse(question.similarQuestions);
        if (!Array.isArray(similar)) {
          similar = [];
        }
      } catch (e) {
        console.warn('Failed to parse similar questions:', e);
        similar = [];
      }
    }

    // Parse stats safely
    let stats: any = null;
    if (question.stats) {
      try {
        stats = JSON.parse(question.stats);
      } catch (e) {
        console.warn('Failed to parse stats:', e);
        stats = null;
      }
    }

    // Parse tags safely
    const tags = Array.isArray(question.topicTags)
      ? question.topicTags
          .map((tag: any) => tag?.name)
          .filter((name: string) => name && typeof name === 'string')
      : [];

    // Parse hints safely
    const hints = Array.isArray(question.hints)
      ? question.hints.filter((hint: string) => hint && typeof hint === 'string')
      : [];

    // Normalize the response with proper fallbacks and no undefined values
    const normalizedProblem: LeetCodeProblem = {
      id: parseInt(question.questionFrontendId) || parseInt(question.questionId) || 0,
      questionId: question.questionId || '',
      questionFrontendId: question.questionFrontendId || question.questionId || '',
      title: question.title || 'Unknown Problem',
      titleSlug: question.titleSlug ||
                 (question.title ? question.title.toLowerCase().replace(/\s+/g, '-') : 'unknown'),
      difficulty: question.difficulty || 'Medium',
      content: question.content || '',
      isPaidOnly: Boolean(question.isPaidOnly),
      tags: tags,
      companies: companies,
      hints: hints,
      similar: similar,
      exampleTestcases: question.exampleTestcases || '',
      stats: stats
    };

    console.log('Normalized problem:', normalizedProblem);
    return normalizedProblem;
  }

  /**
   * Get user profile by username (requires authentication)
   */
  getUserProfile(username: string): Observable<LeetCodeUserProfile> {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            aboutMe
            userAvatar
            location
            skillTags
            postViewCount
            postViewCountDiff
            reputation
            reputationDiff
            solutionCount
            solutionCountDiff
            categoryDiscussCount
            categoryDiscussCountDiff
          }
          submissionCalendar
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
            totalSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          badges {
            id
            displayName
            icon
            creationDate
          }
          activeBadge {
            id
            displayName
            icon
            creationDate
          }
        }
      }
    `;

    const variables = { username };

    return this.executeGraphQLQuery(query, variables).pipe(
      map(response => {
        const user = response.data?.matchedUser;
        if (!user) {
          throw new Error('User not found');
        }
        return {
          username: user.username,
          name: user.profile?.realName || user.username,
          avatar: user.profile?.userAvatar || '',
          ranking: 0, // Not available in basic query
          reputation: user.profile?.reputation || 0,
          gitHubUrl: '',
          twitterUrl: '',
          linkedInUrl: '',
          profile: user.profile,
          submissionCalendar: user.submissionCalendar ? JSON.parse(user.submissionCalendar) : {},
          submitStats: user.submitStats,
          badges: user.badges || [],
          activeBadge: user.activeBadge
        };
      }),
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
    // Ensure we have valid data and provide proper defaults
    const problemId = apiProblem.id ||
                     (apiProblem.questionId ? parseInt(apiProblem.questionId) : null) ||
                     (apiProblem.questionFrontendId ? parseInt(apiProblem.questionFrontendId) : null);

    return {
      leetcodeId: problemId || Math.floor(Math.random() * 10000),
      title: apiProblem.title || 'Unknown Problem',
      difficulty: this.normalizeDifficulty(apiProblem.difficulty),
      status: 'Not Attempted',
      tags: Array.isArray(apiProblem.tags) ? apiProblem.tags.filter(tag => tag) : [],
      companies: Array.isArray(apiProblem.companies) ? apiProblem.companies.filter(company => company) : [],
      url: this.getLeetCodeUrl(apiProblem.titleSlug || 'unknown'),
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
    console.error('LeetCode GraphQL API Error:', error);

    let errorMessage = 'An error occurred while fetching data from LeetCode API';

    if (error.error?.errors?.length > 0) {
      // GraphQL specific error
      const graphqlError = error.error.errors[0];
      errorMessage = graphqlError.message || 'GraphQL query failed';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to LeetCode API. Please check your internet connection.';
    } else if (error.status === 404) {
      errorMessage = 'Problem not found';
    } else if (error.status === 400) {
      errorMessage = 'Invalid search query. Please try a different search term.';
    } else if (error.status === 429) {
      errorMessage = 'Rate limited. Please try again later.';
    } else if (error.status >= 500) {
      errorMessage = 'LeetCode API server error. Please try again later.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
