// src/models/studentState.model.ts

import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentStateDocument extends Document {
  studentId: Types.ObjectId; // Updated to Mongoose ObjectId reference
  documentId: string;
  currentTopicId: string;
  overallMasteryScore: number;
  topicProgress: Map<string, any>;
  recentMemory: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentStateSchema = new Schema<IStudentStateDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    documentId: { type: String, required: true, index: true },
    currentTopicId: { type: String, required: true },
    overallMasteryScore: { type: Number, default: 0 },
    topicProgress: {
      type: Map,
      of: new Schema({
        topicId: { type: String, required: true },
        status: {
          type: String,
          enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVIEW'],
          default: 'NOT_STARTED'
        },
        masteryScore: { type: Number, default: 0 },
        weakPoints: [{ type: String }],
        assessmentAttempts: [
          {
            attemptId: { type: String, required: true },
            score: { type: Number, required: true },
            totalQuestions: { type: Number, required: true },
            feedback: { type: String, required: true },
            attemptedAt: { type: Date, default: Date.now }
          }
        ],
        completedAt: { type: Date }
      }),
      default: {}
    },
    recentMemory: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

StudentStateSchema.index({ studentId: 1, documentId: 1 }, { unique: true });

export const StudentStateModel = model<IStudentStateDocument>('StudentState', StudentStateSchema);