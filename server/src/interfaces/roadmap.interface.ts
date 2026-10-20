// src/interfaces/roadmap.interface.ts

export interface RoadmapTopicNode {
  topicId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  prerequisiteTopicIds: string[]; // Topic IDs that must be completed first
  sourcePageNumbers: number[]; // Page numbers backing this topic
  orderIndex: number;
}

export interface RoadmapModule {
  moduleId: string;
  moduleTitle: string;
  description: string;
  orderIndex: number;
  topics: RoadmapTopicNode[];
}

export interface GeneratedRoadmap {
  documentId: string;
  title: string;
  overview: string;
  totalEstimatedMinutes: number;
  modules: RoadmapModule[];
}