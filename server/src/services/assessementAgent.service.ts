// src/services/assessmentAgent.service.ts

import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { StudentStateModel } from '../models/studentState.model.js';
import { RoadmapModel } from '../models/roadmap.model.js';
import { AppError } from '../utils/appError.js';
import crypto from 'crypto';

const QuizQuestionSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  options: z.array(z.string()),
  correctOptionIndex: z.number(),
  explanation: z.string()
});

export const QuizSchema = z.object({
  topicId: z.string(),
  questions: z.array(QuizQuestionSchema)
});

export type GeneratedQuiz = z.infer<typeof QuizSchema>;

export class AssessmentAgentService {
  private llm: ChatGroq;

  constructor() {
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'qwen/qwen3.8-27b',
      temperature: 0.2
    });
  }

  /**
   * Generates a 3-question diagnostic quiz for the current topic
   */
  public async generateQuizForTopic(
    studentId: string,
    documentId: string
  ): Promise<GeneratedQuiz> {
    try {
      const studentState = await StudentStateModel.findOne({ studentId , documentId });
      const roadmap = await RoadmapModel.findOne({ documentId });
      if (!studentState || !roadmap) {
        throw new AppError('Student state or roadmap not found.', 404);
      }

      const activeTopicId = studentState.currentTopicId;

      const systemPrompt = `
You are an expert Educational Assessment Specialist.
Generate a 3-question multiple-choice quiz for topic ID: "${activeTopicId}".

Return RAW JSON matching this structure:
{
  "topicId": "${activeTopicId}",
  "questions": [
    {
      "questionId": "q1",
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Explanation of correct answer."
    }
  ]
}
`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage('Generate quiz questions.')
      ], {
        response_format: { type: 'json_object' }
      });

      const rawText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      return QuizSchema.parse(JSON.parse(cleaned));
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Quiz Generation Failed: ${error.message}`, 500);
    }
  }

  /**
   * Evaluates student answers, updates state mastery score, and advances current topic if score >= 70%
   */
  public async evaluateQuizSubmission(
    studentId: string,
    documentId: string,
    submission: { questionId: string; selectedOptionIndex: number; correctOptionIndex: number }[]
  ) {
    try {
      const studentState = await StudentStateModel.findOne({ studentId, documentId });
      const roadmap = await RoadmapModel.findOne({ documentId });

      if (!studentState || !roadmap) {
        throw new AppError('Student state or roadmap not found.', 404);
      }

      const currentTopicId = studentState.currentTopicId;
      let correctCount = 0;

      submission.forEach((sub) => {
        if (sub.selectedOptionIndex === sub.correctOptionIndex) {
          correctCount++;
        }
      });

      const scoreRatio = correctCount / submission.length;
      const passed = scoreRatio >= 0.7;

      // Update topic progress in Map
      const existingProgress = studentState.topicProgress.get(currentTopicId) || {
        topicId: currentTopicId,
        status: 'IN_PROGRESS',
        masteryScore: 0,
        weakPoints: [],
        assessmentAttempts: []
      };

      existingProgress.masteryScore = scoreRatio;
      existingProgress.status = passed ? 'COMPLETED' : 'NEEDS_REVIEW';
      if (passed) existingProgress.completedAt = new Date();

      existingProgress.assessmentAttempts.push({
        attemptId: crypto.randomUUID(),
        score: correctCount,
        totalQuestions: submission.length,
        feedback: passed ? 'Passed topic assessment!' : 'Needs review before advancing.',
        attemptedAt: new Date()
      });

      studentState.topicProgress.set(currentTopicId, existingProgress);

      // If passed, auto-advance student to the next topic in roadmap
      let nextTopicId: string | null = null;
      if (passed) {
        const allTopics = roadmap.modules.flatMap((m) => m.topics);
        const currentIndex = allTopics.findIndex((t) => t.topicId === currentTopicId);
        if (currentIndex !== -1 && currentIndex + 1 < allTopics.length) {
          nextTopicId = allTopics[currentIndex + 1].topicId;
          studentState.currentTopicId = nextTopicId;
          
          if (!studentState.topicProgress.has(nextTopicId)) {
            studentState.topicProgress.set(nextTopicId, {
              topicId: nextTopicId,
              status: 'IN_PROGRESS',
              masteryScore: 0,
              weakPoints: [],
              assessmentAttempts: []
            });
          }
        }
      }

      await studentState.save();

      return {
        passed,
        scoreRatio,
        correctCount,
        totalQuestions: submission.length,
        nextTopicId: studentState.currentTopicId
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Quiz Evaluation Failed: ${error.message}`, 500);
    }
  }
}