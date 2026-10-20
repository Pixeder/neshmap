// src/models/roadmap.model.ts

import { Schema, model, Document } from 'mongoose';
import { GeneratedRoadmap } from '../interfaces/roadmap.interface.js';

export interface IRoadmapDocument extends GeneratedRoadmap, Document {
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapTopicSchema = new Schema({
  topicId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  estimatedMinutes: { type: Number, default: 15 },
  prerequisiteTopicIds: [{ type: String }],
  sourcePageNumbers: [{ type: Number }],
  orderIndex: { type: Number, required: true }
});

const RoadmapModuleSchema = new Schema({
  moduleId: { type: String, required: true },
  moduleTitle: { type: String, required: true },
  description: { type: String, required: true },
  orderIndex: { type: Number, required: true },
  topics: [RoadmapTopicSchema]
});

const RoadmapSchema = new Schema<IRoadmapDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    overview: { type: String, required: true },
    totalEstimatedMinutes: { type: Number, required: true },
    modules: [RoadmapModuleSchema]
  },
  { timestamps: true }
);

export const RoadmapModel = model<IRoadmapDocument>('Roadmap', RoadmapSchema);