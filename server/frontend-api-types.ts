/* tslint:disable */
/**
 * Auto-generated OpenAPI TypeScript Definitions
 */

export interface ApiSchemas {
  StudentRegisterRequest?: {
    name: string;
    email: string;
    avatarUrl?: string;
    learningPreferences?: {
      pace?: "FAST" | "MODERATE" | "DETAILED";
      preferredDifficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  StudentResponse?: {
    _id?: string;
    name?: string;
    email?: string;
    learningPreferences?: {
      pace?: string;
      preferredDifficulty?: string;
      [k: string]: unknown;
    };
    createdAt?: string;
    updatedAt?: string;
    [k: string]: unknown;
  };
  TopicNode?: TopicNode;
  RoadmapModule?: RoadmapModule;
  RoadmapResponse?: {
    documentId?: string;
    title?: string;
    modules?: RoadmapModule[];
    [k: string]: unknown;
  };
  TeachingSessionRequest?: {
    studentId: string;
    documentId: string;
    query?: string;
    [k: string]: unknown;
  };
  QuizQuestion?: {
    questionId?: string;
    questionText?: string;
    options?: string[];
    correctOptionIndex?: number;
    explanation?: string;
    [k: string]: unknown;
  };
  QuizSubmissionRequest?: {
    studentId: string;
    documentId: string;
    submission: {
      questionId?: string;
      selectedOptionIndex?: number;
      correctOptionIndex?: number;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  };
  DashboardAnalyticsResponse?: {
    studentId?: string;
    documentId?: string;
    courseTitle?: string;
    overallMasteryScore?: number;
    courseCompletionPercentage?: number;
    totalTopics?: number;
    completedTopicsCount?: number;
    inProgressTopicsCount?: number;
    needsReviewTopicsCount?: number;
    moduleProgress?: {
      moduleId?: string;
      moduleTitle?: string;
      completionPercentage?: number;
      averageMastery?: number;
      [k: string]: unknown;
    }[];
    weaknessRadar?: {
      weakness?: string;
      occurrences?: number;
      [k: string]: unknown;
    }[];
    knowledgeHeatmap?: {
      topicId?: string;
      topicTitle?: string;
      masteryScore?: number;
      status?: string;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  };
  ApiResponse?: {
    success?: boolean;
    statusCode?: number;
    message?: string;
    data?: {
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export interface TopicNode {
  topicId?: string;
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  sourcePageNumbers?: number[];
  [k: string]: unknown;
}
export interface RoadmapModule {
  moduleId?: string;
  moduleTitle?: string;
  topics?: TopicNode[];
  [k: string]: unknown;
}
