// src/config/swagger.config.ts

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Adaptive Learning Engine API',
      version: '1.0.0',
      description:
        'Production REST and SSE API documentation for document ingestion, dynamic roadmap generation, student state management, and RAG-backed pedagogical teaching.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      schemas: {
        // --- STUDENT SCHEMAS ---
        StudentRegisterRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Alex Mercer' },
            email: { type: 'string', format: 'email', example: 'alex.mercer@example.com' },
            avatarUrl: { type: 'string', example: 'https://example.com/avatar.png' },
            learningPreferences: {
              type: 'object',
              properties: {
                pace: { type: 'string', enum: ['FAST', 'MODERATE', 'DETAILED'], default: 'MODERATE' },
                preferredDifficulty: {
                  type: 'string',
                  enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
                  default: 'BEGINNER'
                }
              }
            }
          }
        },
        StudentResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67b0a1f2c9e8a71234567890' },
            name: { type: 'string', example: 'Alex Mercer' },
            email: { type: 'string', example: 'alex.mercer@example.com' },
            learningPreferences: {
              type: 'object',
              properties: {
                pace: { type: 'string' },
                preferredDifficulty: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // --- ROADMAP SCHEMAS ---
        TopicNode: {
          type: 'object',
          properties: {
            topicId: { type: 'string', example: 'topic_1_1' },
            title: { type: 'string', example: 'Gaussian Smoothing and Edge Detection' },
            description: { type: 'string', example: 'Understanding noise reduction filters' },
            estimatedMinutes: { type: 'number', example: 30 },
            sourcePageNumbers: { type: 'array', items: { type: 'number' }, example: [12, 13, 14] }
          }
        },
        RoadmapModule: {
          type: 'object',
          properties: {
            moduleId: { type: 'string', example: 'mod_1' },
            moduleTitle: { type: 'string', example: 'Image Processing Foundations' },
            topics: {
              type: 'array',
              items: { $ref: '#/components/schemas/TopicNode' }
            }
          }
        },
        RoadmapResponse: {
          type: 'object',
          properties: {
            documentId: { type: 'string', example: 'doc_1792502070683' },
            title: { type: 'string', example: 'Computer Vision Fundamentals' },
            modules: {
              type: 'array',
              items: { $ref: '#/components/schemas/RoadmapModule' }
            }
          }
        },

        // --- TEACHING & QUIZ SCHEMAS ---
        TeachingSessionRequest: {
          type: 'object',
          required: ['studentId', 'documentId'],
          properties: {
            studentId: { type: 'string', example: '67b0a1f2c9e8a71234567890' },
            documentId: { type: 'string', example: 'doc_1792502070683' },
            query: { type: 'string', example: 'Explain Gaussian smoothing in detail.' }
          }
        },
        QuizQuestion: {
          type: 'object',
          properties: {
            questionId: { type: 'string', example: 'q1' },
            questionText: { type: 'string', example: 'What parameter controls Gaussian blur strength?' },
            options: { type: 'array', items: { type: 'string' }, example: ['Sigma', 'Alpha', 'Beta', 'Gamma'] },
            correctOptionIndex: { type: 'number', example: 0 },
            explanation: { type: 'string', example: 'Sigma dictates standard deviation width.' }
          }
        },
        QuizSubmissionRequest: {
          type: 'object',
          required: ['studentId', 'documentId', 'submission'],
          properties: {
            studentId: { type: 'string', example: '67b0a1f2c9e8a71234567890' },
            documentId: { type: 'string', example: 'doc_1792502070683' },
            submission: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string', example: 'q1' },
                  selectedOptionIndex: { type: 'number', example: 0 },
                  correctOptionIndex: { type: 'number', example: 0 }
                }
              }
            }
          }
        },
        DashboardAnalyticsResponse: {
          type: 'object',
          properties: {
            studentId: { type: 'string' },
            documentId: { type: 'string' },
            courseTitle: { type: 'string', example: 'Computer Vision & Edge Detection' },
            overallMasteryScore: { type: 'number', example: 0.82 },
            courseCompletionPercentage: { type: 'number', example: 65.5 },
            totalTopics: { type: 'number', example: 12 },
            completedTopicsCount: { type: 'number', example: 8 },
            inProgressTopicsCount: { type: 'number', example: 2 },
            needsReviewTopicsCount: { type: 'number', example: 2 },
            moduleProgress: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleId: { type: 'string' },
                  moduleTitle: { type: 'string' },
                  completionPercentage: { type: 'number' },
                  averageMastery: { type: 'number' }
                }
              }
            },
            weaknessRadar: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  weakness: { type: 'string', example: 'Gaussian Kernel Derivatives' },
                  occurrences: { type: 'number', example: 3 }
                }
              }
            },
            knowledgeHeatmap: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topicId: { type: 'string' },
                  topicTitle: { type: 'string' },
                  masteryScore: { type: 'number' },
                  status: { type: 'string' }
                }
              }
            }
          }
        },

        // --- STANDARD API RESPONSE SCHEMA wrapper ---
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'number', example: 200 },
            message: { type: 'string', example: 'Operation completed successfully.' },
            data: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);