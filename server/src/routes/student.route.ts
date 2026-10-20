// src/routes/student.route.ts

import { Router } from 'express';
import {
  registerStudent,
  getStudentProfile,
  updateStudentProfile,
  getStudentEnrolledDocuments
} from '../controllers/student.controller.js';

const router = Router();

/**
 * @openapi
 * /api/student:
 *   post:
 *     summary: Register a new student profile
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentRegisterRequest'
 *     responses:
 *       201:
 *         description: Student registered successfully.
 */
router.post('/', registerStudent);

/**
 * @openapi
 * /api/student/{id}:
 *   get:
 *     summary: Retrieve student profile by ID
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student profile retrieved.
 *   put:
 *     summary: Update student profile or preferences
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentRegisterRequest'
 *     responses:
 *       200:
 *         description: Student profile updated.
 */
router.get('/:id', getStudentProfile);
router.put('/:id', updateStudentProfile);

/**
 * @openapi
 * /api/student/{id}/documents:
 *   get:
 *     summary: Get all active document learning states for a student
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrolled documents and progress states returned.
 */
router.get('/:id/documents', getStudentEnrolledDocuments);

export default router;