import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LeetCodeApiService, LeetCodeProblem } from '../../services/leetcode-api';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';
import { Observable } from 'rxjs';

interface SearchFilters {
  keyword: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | '';
  tag: string;
  searchScope: 'leetcode' | 'user';
}

interface RandomFilters {
  difficulty: 'Easy' | 'Medium' | 'Hard' | '';
  topic: string;
}

interface SearchResult {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  tags: string[];
  isPaidOnly: boolean;
}

// Common LeetCode topics/tags
const POPULAR_TOPICS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting',
  'Greedy', 'Depth-First Search', 'Binary Search', 'Breadth-First Search',
  'Tree', 'Matrix', 'Two Pointers', 'Bit Manipulation', 'Heap (Priority Queue)',
  'Stack', 'Graph', 'Design', 'Prefix Sum', 'Simulation', 'Counting',
  'Backtracking', 'Sliding Window', 'Union Find', 'Linked List', 'Trie',
  'Binary Search Tree', 'Recursion', 'Divide and Conquer', 'Memoization'
];

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatCheckboxModule
  ],
  templateUrl: './search-dialog.html',
  styleUrls: ['./search-dialog.scss']
})
export class SearchDialogComponent implements OnInit {
  searchType: 'search' | 'random' = 'search';

  searchFilters: SearchFilters = {
    keyword: '',
    difficulty: '',
    tag: '',
    searchScope: 'leetcode'
  };

  randomFilters: RandomFilters = {
    difficulty: '',
    topic: ''
  };

  searchInUserProblems = false;
  availableTopics = POPULAR_TOPICS;
  userProblemsCount = 0;

  searchResults: SearchResult[] = [];
  randomProblem: SearchResult | null = null;
  selectedProblem: SearchResult | null = null;

  searchLoading = false;
  randomLoading = false;
  importLoading = false;
  importError: string | null = null;
  searchError: string | null = null;
  randomError: string | null = null;
  hasSearched = false;

  userProblems: Problem[] = [];

  constructor(
    public dialogRef: MatDialogRef<SearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private leetcodeApi: LeetCodeApiService,
    private leetcodeService: LeetcodeService
  ) {}

  ngOnInit(): void {
    // If initial keyword is provided
    if (this.data?.keyword) {
      this.searchFilters.keyword = this.data.keyword;
    }

    // Load user problems for local search
    this.leetcodeService.problems$.subscribe(problems => {
      this.userProblems = problems;
      this.userProblemsCount = problems.length;
    });
  }

  onSearchTypeChange(): void {
    // Clear previous results and errors
    this.searchResults = [];
    this.randomProblem = null;
    this.selectedProblem = null;
    this.searchError = null;
    this.randomError = null;
    this.hasSearched = false;
  }

  onSearchScopeChange(): void {
    this.searchFilters.searchScope = this.searchInUserProblems ? 'user' : 'leetcode';
    // Clear previous results when scope changes
    this.searchResults = [];
    this.selectedProblem = null;
    this.searchError = null;
    this.hasSearched = false;
  }

  async searchProblems(): Promise<void> {
    // Allow search if either keyword or tag is provided
    if (!this.searchFilters.keyword.trim() && !this.searchFilters.tag) {
      return;
    }

    this.searchLoading = true;
    this.searchError = null;
    this.searchResults = [];
    this.selectedProblem = null;
    this.hasSearched = false;

    try {
      if (this.searchInUserProblems) {
        // Search in user's problems
        this.searchInUserList();
      } else {
        // Search in LeetCode API
        await this.searchInLeetCode();
      }
      this.hasSearched = true;
    } catch (error: any) {
      console.error('Search error:', error);
      this.searchError = error.message || 'Failed to search problems. Please try again.';
      this.hasSearched = true;
    } finally {
      this.searchLoading = false;
    }
  }

  private searchInUserList(): void {
    const keyword = this.searchFilters.keyword.toLowerCase().trim();
    const difficulty = this.searchFilters.difficulty;
    const tag = this.searchFilters.tag.toLowerCase().trim();

    let filteredProblems = this.userProblems.filter(problem => {
      // Search in title, tags, and companies
      const matchesKeyword = !keyword ||
        problem.title.toLowerCase().includes(keyword) ||
        problem.tags.some(t => t.toLowerCase().includes(keyword)) ||
        problem.companies.some(company => company.toLowerCase().includes(keyword));

      // Filter by difficulty if specified
      const matchesDifficulty = !difficulty || problem.difficulty === difficulty;

      // Filter by tag if specified
      const matchesTag = !tag || problem.tags.some(t => t.toLowerCase().includes(tag));

      return matchesKeyword && matchesDifficulty && matchesTag;
    });

    // Convert to SearchResult format
    this.searchResults = filteredProblems.map(problem => ({
      id: problem.leetcodeId,
      title: problem.title,
      titleSlug: this.generateTitleSlug(problem.title),
      difficulty: problem.difficulty,
      tags: problem.tags,
      isPaidOnly: false // User problems are already accessible
    }));
  }

  private generateTitleSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async searchInLeetCode(): Promise<void> {
    let problems: LeetCodeProblem[] | undefined;

    if (this.searchFilters.tag && !this.searchFilters.keyword.trim()) {
      // Search by tag only
      problems = await this.leetcodeApi.getProblemsByTag(
        this.searchFilters.tag,
        50
      ).toPromise();
    } else if (this.searchFilters.keyword.trim()) {
      // Search by keyword
      problems = await this.leetcodeApi.searchProblems(
        this.searchFilters.keyword.trim(),
        50
      ).toPromise();
    }

    if (problems) {
      // Filter by difficulty if specified
      let filteredProblems = problems;
      if (this.searchFilters.difficulty) {
        filteredProblems = problems.filter(p =>
          p.difficulty === this.searchFilters.difficulty
        );
      }

      // Filter by tag if specified and we searched by keyword
      if (this.searchFilters.tag && this.searchFilters.keyword.trim()) {
        filteredProblems = filteredProblems.filter(p =>
          p.tags?.some(tag => tag.toLowerCase().includes(this.searchFilters.tag.toLowerCase()))
        );
      }

      // Transform to search results format
      this.searchResults = filteredProblems.map(problem => ({
        id: problem.questionFrontendId ?
            parseInt(problem.questionFrontendId) :
            (problem.id || 0),
        title: problem.title,
        titleSlug: problem.titleSlug,
        difficulty: problem.difficulty,
        tags: problem.tags || [],
        isPaidOnly: problem.isPaidOnly || false
      }));
    }
  }

  async getRandomProblem(): Promise<void> {
    this.randomLoading = true;
    this.randomError = null;
    this.randomProblem = null;
    this.selectedProblem = null;

    try {
      let randomProblemData: LeetCodeProblem;

      if (this.randomFilters.topic) {
        // Get problems by tag first, then filter
        const problems = await this.leetcodeApi.getProblemsByTag(
          this.randomFilters.topic,
          100
        ).toPromise();

        if (!problems || problems.length === 0) {
          throw new Error(`No problems found for topic: ${this.randomFilters.topic}`);
        }

        // Filter by difficulty if specified
        let filteredProblems = problems;
        if (this.randomFilters.difficulty) {
          filteredProblems = problems.filter(p => p.difficulty === this.randomFilters.difficulty);
        }

        if (filteredProblems.length === 0) {
          throw new Error(`No ${this.randomFilters.difficulty || ''} problems found for topic: ${this.randomFilters.topic}`);
        }

        // Pick random problem
        const randomIndex = Math.floor(Math.random() * filteredProblems.length);
        randomProblemData = filteredProblems[randomIndex];
      } else {
        // Get random problem by difficulty only
        const result = await this.leetcodeApi.getRandomProblem(
          this.randomFilters.difficulty as any
        ).toPromise();

        if (!result) {
          throw new Error('No random problem found with the specified criteria');
        }

        randomProblemData = result;
      }

      if (randomProblemData) {
        this.randomProblem = {
          id: randomProblemData.questionFrontendId ?
              parseInt(randomProblemData.questionFrontendId) :
              (randomProblemData.id || 0),
          title: randomProblemData.title,
          titleSlug: randomProblemData.titleSlug,
          difficulty: randomProblemData.difficulty,
          tags: randomProblemData.tags || [],
          isPaidOnly: randomProblemData.isPaidOnly || false
        };
      } else {
        throw new Error('No random problem found with the specified criteria');
      }
    } catch (error: any) {
      console.error('Random problem error:', error);
      this.randomError = error.message || 'Failed to get random problem. Please try again.';
    } finally {
      this.randomLoading = false;
    }
  }

  importSelectedProblem(): Promise<void> {
    if (!this.selectedProblem) {
      return Promise.resolve();
    }

    this.importLoading = true;
    this.importError = null; // Clear previous errors

    try {
      // Check if problem already exists
      const existingProblems = this.userProblems;
      const existingProblem = existingProblems.find(p => p.leetcodeId === this.selectedProblem!.id);

      if (existingProblem) {
        this.importError = `Problem "${this.selectedProblem.title}" is already in your list.`;
        this.importLoading = false;
        return Promise.resolve();
      }

      // Convert SearchResult to the format expected by LeetcodeService.addProblem
      const problemToAdd: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        leetcodeId: this.selectedProblem.id,
        title: this.selectedProblem.title,
        difficulty: this.selectedProblem.difficulty as 'Easy' | 'Medium' | 'Hard',
        status: 'Not Attempted',
        url: `https://leetcode.com/problems/${this.selectedProblem.titleSlug}/`,
        tags: this.selectedProblem.tags || [],
        attempts: 0,
        timeSpent: 0,
        notes: '',
        companies: [],
        solvedDate: null,
        lastAttemptDate: null,
        firstAttemptDate: null,
        firstSolvedDate: null
      };

      console.log('Importing problem:', problemToAdd);

      return this.leetcodeService.addProblem(problemToAdd).then(() => {
        // Close dialog with success indication
        this.dialogRef.close({
          success: true,
          problem: problemToAdd,
          message: `"${problemToAdd.title}" has been added to your problem list!`
        });
      }).catch((error: any) => {
        console.error('Error importing problem:', error);
        this.importError = error.message || 'Failed to import problem. Please try again.';
      }).finally(() => {
        this.importLoading = false;
      });

    } catch (error: any) {
      console.error('Error importing problem:', error);
      this.importError = error.message || 'Failed to import problem. Please try again.';
      this.importLoading = false;
      return Promise.resolve();
    }
  }

  selectProblem(problem: SearchResult): void {
    this.selectedProblem = problem;
    this.importError = null; // Clear any previous import errors
  }

  selectRandomProblem(): void {
    if (this.randomProblem) {
      this.selectedProblem = this.randomProblem;
      this.importError = null; // Clear any previous import errors
    }
  }

  trackByProblem(index: number, problem: SearchResult): any {
    return problem.id;
  }
}
