import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { ProblemAnalysis } from '../models/ai-analysis';
import { AIAnalysisCacheService } from './ai-analysis-cache.service';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  private readonly apiKey = environment.geminiApiKey;

  constructor(
    private http: HttpClient,
    private cacheService: AIAnalysisCacheService
  ) {}

  async enhanceNotes(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.geminiApiUrl}?key=${this.apiKey}`, body, { headers })
      );

      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async getProblemAnalysis(problemData: any, forceRefresh: boolean = false): Promise<ProblemAnalysis> {
    const problemId = problemData.leetcodeId || problemData.id || problemData.problemId;
    const titleSlug = problemData.titleSlug || problemData.title?.toLowerCase().replace(/\s+/g, '-');

    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      try {
        const cachedAnalysis = await this.cacheService.getCachedAnalysis(problemId, titleSlug);
        if (cachedAnalysis) {
          console.log('Using cached AI analysis for problem:', problemId);
          return cachedAnalysis.analysisData;
        }
      } catch (error) {
        console.warn('Error retrieving cached analysis, proceeding with fresh generation:', error);
      }
    }

    // Generate new analysis
    console.log('Generating fresh AI analysis for problem:', problemId);
    const analysis = await this.generateFreshAnalysis(problemData);

    // Save to cache
    try {
      await this.cacheService.saveAnalysisToCache(
        problemId,
        analysis,
        titleSlug,
        problemData.title
      );
    } catch (error) {
      console.warn('Error saving analysis to cache:', error);
      // Don't fail the request if caching fails
    }

    return analysis;
  }

  private async generateFreshAnalysis(problemData: any): Promise<ProblemAnalysis> {
    const prompt = `Please provide a comprehensive analysis of this LeetCode problem. Return the response in a structured JSON format.

Problem Details:
- Title: ${problemData.title}
- Difficulty: ${problemData.difficulty}
- Tags: ${problemData.tags?.join(', ') || 'N/A'}
- Description: ${problemData.description || 'Not provided'}
- LeetCode ID: ${problemData.leetcodeId || problemData.id || problemData.problemId}

Please provide a detailed analysis in the following JSON structure:

{
  "multipleApproaches": [
    {
      "name": "Approach name",
      "description": "Detailed explanation of the approach",
      "timeComplexity": "O(n) format",
      "spaceComplexity": "O(n) format",
      "code": "Sample code implementation (optional)",
      "pros": ["Advantage 1", "Advantage 2"],
      "cons": ["Disadvantage 1", "Disadvantage 2"]
    }
  ],
  "detailedExplanation": "Comprehensive explanation of the problem and its nuances",
  "keyInsights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "commonMistakes": ["Common mistake 1", "Common mistake 2"],
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "relatedProblems": ["Related problem 1", "Related problem 2"],
  "topicTags": ["Data Structure/Algorithm topic 1", "Topic 2"],
  "frequentCompanies": ["Company 1", "Company 2", "Company 3"],
  "difficultyAnalysis": {
    "reasoning": "Why this problem has this difficulty rating",
    "skillsRequired": ["Skill 1", "Skill 2"]
  },
  "practiceRecommendations": ["Recommendation 1", "Recommendation 2"]
}

Ensure the response is valid JSON only, no additional text or formatting.`;

    try {
      const response = await this.enhanceNotes(prompt);

      // Try to parse the JSON response
      let cleanedResponse = response.trim();

      // Remove any markdown code block formatting if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const analysisData = JSON.parse(cleanedResponse);
      return analysisData as ProblemAnalysis;
    } catch (error) {
      console.error('Error parsing problem analysis:', error);
      // Return a default structure if parsing fails
      return {
        multipleApproaches: [],
        detailedExplanation: 'Failed to generate detailed explanation.',
        keyInsights: [],
        commonMistakes: [],
        edgeCases: [],
        relatedProblems: [],
        topicTags: problemData.tags || [],
        frequentCompanies: [],
        difficultyAnalysis: {
          reasoning: 'Analysis unavailable',
          skillsRequired: []
        },
        practiceRecommendations: []
      };
    }
  }

  /**
   * Check if analysis exists in cache
   */
  async hasAnalysisInCache(problemId: number, titleSlug?: string): Promise<boolean> {
    return this.cacheService.hasAnalysisInCache(problemId, titleSlug);
  }

  /**
   * Force refresh analysis (regenerate and update cache)
   */
  async refreshAnalysis(problemData: any): Promise<ProblemAnalysis> {
    return this.getProblemAnalysis(problemData, true);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.cacheService.clearMemoryCache();
  }
}
export type { ProblemAnalysis };
