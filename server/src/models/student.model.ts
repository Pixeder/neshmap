// src/models/student.model.ts

import { Schema, model, Document } from 'mongoose';

export interface IStudentDocument extends Document {
  name: string;
  email: string;
  avatarUrl?: string;
  learningPreferences?: {
    pace?: 'FAST' | 'MODERATE' | 'DETAILED';
    preferredDifficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudentDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    avatarUrl: { type: String, default: '' },
    learningPreferences: {
      pace: { type: String, enum: ['FAST', 'MODERATE', 'DETAILED'], default: 'MODERATE' },
      preferredDifficulty: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' }
    }
  },
  { timestamps: true }  
);

export const StudentModel = model<IStudentDocument>('Student', StudentSchema);