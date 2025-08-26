export interface CachedAIAnalysis {
  id?: string;
  problemId: number;
  titleSlug?: string;
  analysisData: ProblemAnalysis;
  createdAt: Date;
  updatedAt: Date;
  version: string; // To handle future AI model updates
  userId?: string; // Optional: if you want user-specific caching
}

export interface ProblemAnalysis {
  multipleApproaches: Array<{
    name: string;
    description: string;
    timeComplexity: string;
    spaceComplexity: string;
    code?: string;
    pros: string[];
    cons: string[];
  }>;
  detailedExplanation: string;
  keyInsights: string[];
  commonMistakes: string[];
  edgeCases: string[];
  relatedProblems: string[];
  topicTags: string[];
  frequentCompanies: string[];
  difficultyAnalysis: {
    reasoning: string;
    skillsRequired: string[];
  };
  practiceRecommendations: string[];
}
