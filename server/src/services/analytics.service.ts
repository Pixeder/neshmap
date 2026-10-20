// src/services/analytics.service.ts

import { StudentStateModel } from '../models/studentState.model.js';
import { RoadmapModel } from '../models/roadmap.model.js';
import { AppError } from '../utils/appError.js';

export interface DashboardAnalytics {
  studentId: string;
  documentId: string;
  courseTitle: string;
  overallMasteryScore: number;
  courseCompletionPercentage: number;
  totalTopics: number;
  completedTopicsCount: number;
  inProgressTopicsCount: number;
  needsReviewTopicsCount: number;
  currentActiveTopicId: string;
  moduleProgress: {
    moduleId: string;
    moduleTitle: string;
    completionPercentage: number;
    averageMastery: number;
    topicsCount: number;
  }[];
  weaknessRadar: {
    weakness: string;
    occurrences: number;
  }[];
  assessmentHistoryTrends: {
    attemptId: string;
    topicId: string;
    scoreRatio: number;
    attemptedAt: Date;
  }[];
  knowledgeHeatmap: {
    topicId: string;
    topicTitle: string;
    masteryScore: number;
    status: string;
  }[];
}

export class AnalyticsService {
  /**
   * Aggregates full learning progress metrics for a specific student and document
   */
  public async getStudentDashboardAnalytics(
    studentId: string,
    documentId: string
  ): Promise<DashboardAnalytics> {
    const studentState = await StudentStateModel.findOne({ studentId, documentId });
    const roadmap = await RoadmapModel.findOne({ documentId });

    if (!roadmap) {
      throw new AppError(`Roadmap not found for document ID: ${documentId}`, 404);
    }

    if (!studentState) {
      throw new AppError(`No learning state record found for student ${studentId}`, 404);
    }

    let totalTopics = 0;
    let completedTopicsCount = 0;
    let inProgressTopicsCount = 0;
    let needsReviewTopicsCount = 0;

    const moduleProgress: DashboardAnalytics['moduleProgress'] = [];
    const knowledgeHeatmap: DashboardAnalytics['knowledgeHeatmap'] = [];
    const weaknessFrequencyMap: Record<string, number> = {};
    const assessmentHistoryTrends: DashboardAnalytics['assessmentHistoryTrends'] = [];

    // Process roadmap modules and topic states
    for (const mod of roadmap.modules) {
      let moduleMasterySum = 0;
      let moduleCompletedCount = 0;

      for (const topic of mod.topics) {
        totalTopics++;
        const stateInfo = studentState.topicProgress.get(topic.topicId);

        const masteryScore = stateInfo?.masteryScore || 0;
        const status = stateInfo?.status || 'NOT_STARTED';

        moduleMasterySum += masteryScore;

        if (status === 'COMPLETED') {
          completedTopicsCount++;
          moduleCompletedCount++;
        } else if (status === 'IN_PROGRESS') {
          inProgressTopicsCount++;
        } else if (status === 'NEEDS_REVIEW') {
          needsReviewTopicsCount++;
        }

        // Knowledge Heatmap Data
        knowledgeHeatmap.push({
          topicId: topic.topicId,
          topicTitle: topic.title,
          masteryScore,
          status
        });

        // Collect Weakness Frequencies for Radar Charts
        if (stateInfo?.weakPoints && Array.isArray(stateInfo.weakPoints)) {
          stateInfo.weakPoints.forEach((wp: string) => {
            weaknessFrequencyMap[wp] = (weaknessFrequencyMap[wp] || 0) + 1;
          });
        }

        // Collect Assessment History Trends
        if (stateInfo?.assessmentAttempts && Array.isArray(stateInfo.assessmentAttempts)) {
          stateInfo.assessmentAttempts.forEach((attempt: any) => {
            assessmentHistoryTrends.push({
              attemptId: attempt.attemptId,
              topicId: topic.topicId,
              scoreRatio: attempt.totalQuestions > 0 ? attempt.score / attempt.totalQuestions : 0,
              attemptedAt: attempt.attemptedAt || new Date()
            });
          });
        }
      }

      const topicsInMod = mod.topics.length;
      moduleProgress.push({
        moduleId: mod.moduleId,
        moduleTitle: mod.moduleTitle,
        completionPercentage: topicsInMod > 0 ? (moduleCompletedCount / topicsInMod) * 100 : 0,
        averageMastery: topicsInMod > 0 ? moduleMasterySum / topicsInMod : 0,
        topicsCount: topicsInMod
      });
    }

    // Sort assessment attempts by date ascending for trendline rendering
    assessmentHistoryTrends.sort(
      (a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()
    );

    // Format Weakness Radar Data
    const weaknessRadar = Object.keys(weaknessFrequencyMap).map((key) => ({
      weakness: key,
      occurrences: weaknessFrequencyMap[key]
    }));

    const courseCompletionPercentage = totalTopics > 0 ? (completedTopicsCount / totalTopics) * 100 : 0;

    return {
      studentId,
      documentId,
      courseTitle: roadmap.title || 'Untitled Course',
      overallMasteryScore: studentState.overallMasteryScore,
      courseCompletionPercentage,
      totalTopics,
      completedTopicsCount,
      inProgressTopicsCount,
      needsReviewTopicsCount,
      currentActiveTopicId: studentState.currentTopicId,
      moduleProgress,
      weaknessRadar,
      assessmentHistoryTrends,
      knowledgeHeatmap
    };
  }
}