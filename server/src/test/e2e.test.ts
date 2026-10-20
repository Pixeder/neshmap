// src/test/e2e.test.ts

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Force load environment variables immediately at file evaluation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import { QdrantClient } from '@qdrant/js-client-rest';
import app from '../app.js';

describe('End-to-End Adaptive Learning Engine Integration Test', () => {
  let createdStudentId: string;
  let processedDocumentId: string;
  let activeTopicId: string;
  let generatedQuiz: any;
  let qdrantClient: QdrantClient;

  beforeAll(async () => {
    // Resolve MongoDB URI with explicit fallbacks
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;

    if (!mongoUri) {
      throw new Error(
        '[E2E SETUP ERROR] Missing MongoDB URI in environment variables. ' +
        'Ensure MONGO_URI is defined in your server .env file.'
      );
    }

    // Connect to MongoDB if no active connection exists
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      checkCompatibility: false
    });
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  /**
   * Helper function to poll Qdrant until PDF processing and vector indexing finish
   */
  const pollQdrantUntilIndexed = async (documentId: string, maxRetries = 40): Promise<void> => {
    const collectionName = process.env.QDRANT_COLLECTION || 'study_materials';

    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await qdrantClient.scroll(collectionName, {
          filter: {
            must: [{ key: 'documentId', match: { value: documentId } }]
          },
          limit: 1
        });

        if (res.points && res.points.length > 0) {
          console.log(`\n[E2E VERIFIED] Vectors successfully indexed in Qdrant for doc: ${documentId}`);
          return;
        }
      } catch (err) {
        // Ignore initial connection/indexing lag
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`[E2E TIMEOUT] Qdrant failed to index vectors for documentId: ${documentId}`);
  };

  // ------------------------------------------------------------------
  // Step 1: Student Registration
  // ------------------------------------------------------------------
  it('1. Should register a new student profile', async () => {
    const testEmail = `test.student.${Date.now()}@example.com`;

    const res = await request(app)
      .post('/api/student')
      .send({
        name: 'E2E Test Student',
        email: testEmail,
        learningPreferences: {
          pace: 'MODERATE',
          preferredDifficulty: 'INTERMEDIATE'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();

    createdStudentId = res.body.data._id;
    console.log(`\n[E2E PASS] Step 1: Registered Student ID = ${createdStudentId}`);
  });

  // ------------------------------------------------------------------
  // Step 2: Document Ingestion & Pipeline Polling
  // ------------------------------------------------------------------
  it('2. Should upload PDF, split pages, execute OCR, and populate vector DB', async () => {
    const samplePdfPath = path.join(__dirname, 'sample_test.pdf');

    // Create a valid 1-page PDF buffer if the test file doesn't exist
    if (!fs.existsSync(samplePdfPath)) {
      const minimalPdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000118 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
      );
      fs.writeFileSync(samplePdfPath, minimalPdfBuffer);
    }

    const res = await request(app)
      .post('/api/document/upload')
      .attach('document', samplePdfPath);

    expect([200, 202]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentId).toBeDefined();

    processedDocumentId = res.body.data.documentId;
    console.log(`\n[E2E PASS] Step 2: Ingested Document ID = ${processedDocumentId}`);

    // Wait for the async processing queue to extract content and write to Qdrant
    await pollQdrantUntilIndexed(processedDocumentId);
  }, 90000);

  // ------------------------------------------------------------------
  // Step 3: Roadmap Agent Generation
  // ------------------------------------------------------------------
  it('3. Should synthesize structured curriculum roadmap from Qdrant content', async () => {
    const res = await request(app).get(`/api/roadmap/${processedDocumentId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.modules).toBeInstanceOf(Array);
    expect(res.body.data.modules.length).toBeGreaterThan(0);

    activeTopicId = res.body.data.modules[0].topics[0].topicId;
    expect(activeTopicId).toBeDefined();

    console.log(`\n[E2E PASS] Step 3: Generated Roadmap. First Topic = ${activeTopicId}`);
  }, 60000);

  // ------------------------------------------------------------------
  // Step 4: Pedagogical Teaching Session (RAG Explanation)
  // ------------------------------------------------------------------
  it('4. Should initialize pedagogical teaching session with context', async () => {
    const res = await request(app)
      .post('/api/teaching/session')
      .send({
        studentId: createdStudentId,
        documentId: processedDocumentId,
        query: 'Please explain the core concepts in this topic.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toBeDefined();
    expect(typeof res.body.data.response).toBe('string');

    console.log(`\n[E2E PASS] Step 4: Teaching Session Initialized Successfully.`);
  }, 60000);

  // ------------------------------------------------------------------
  // Step 5: Diagnostic Quiz Generation
  // ------------------------------------------------------------------
  it('5. Should generate diagnostic quiz for active topic', async () => {
    const res = await request(app)
      .get('/api/teaching/quiz')
      .query({
        studentId: createdStudentId,
        documentId: processedDocumentId
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questions).toBeInstanceOf(Array);
    expect(res.body.data.questions.length).toBeGreaterThan(0);

    generatedQuiz = res.body.data;
    console.log(`\n[E2E PASS] Step 5: Quiz Generated (${generatedQuiz.questions.length} questions).`);
  }, 60000);

  // ------------------------------------------------------------------
  // Step 6: Quiz Evaluation & Topic Progression
  // ------------------------------------------------------------------
  it('6. Should evaluate quiz submission and advance student state on pass', async () => {
    expect(generatedQuiz).toBeDefined();
    expect(generatedQuiz.questions).toBeDefined();

    const submission = generatedQuiz.questions.map((q: any) => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex,
      correctOptionIndex: q.correctOptionIndex
    }));

    const res = await request(app)
      .post('/api/teaching/quiz/submit')
      .send({
        studentId: createdStudentId,
        documentId: processedDocumentId,
        submission
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.scoreRatio).toBe(1);

    console.log(
      `\n[E2E PASS] Step 6: Assessment Passed. Student Advanced to Topic: ${res.body.data.nextTopicId}`
    );
  }, 30000);
});