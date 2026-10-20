// src/controllers/student.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppResponse } from '../utils/appResponse.js';
import { AppError } from '../utils/appError.js';
import { StudentModel } from '../models/student.model.js';
import { StudentStateModel } from '../models/studentState.model.js';

/**
 * Create or Register a New Student
 */
export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, avatarUrl, learningPreferences } = req.body;

  if (!name || !email) {
    throw new AppError('Name and email are required fields.', 400);
  }

  // Check if student with email already exists
  const existingStudent = await StudentModel.findOne({ email });
  if (existingStudent) {
    throw new AppError('Student with this email already exists.', 400);
  }

  const newStudent = await StudentModel.create({
    name,
    email,
    avatarUrl,
    learningPreferences
  });

  res.status(201).json(
    AppResponse.success('Student created successfully.', newStudent)
  );
});

/**
 * Get Student Profile by ID
 */
export const getStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const student = await StudentModel.findById(id);
  if (!student) {
    throw new AppError('Student not found.', 404);
  }

  res.status(200).json(
    AppResponse.success('Student profile retrieved successfully.', student)
  );
});

/**
 * Update Student Preferences or Details
 */
export const updateStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, avatarUrl, learningPreferences } = req.body;

  const updatedStudent = await StudentModel.findByIdAndUpdate(
    id,
    { $set: { name, avatarUrl, learningPreferences } },
    { new: true, runValidators: true }
  );

  if (!updatedStudent) {
    throw new AppError('Student not found.', 404);
  }

  res.status(200).json(
    AppResponse.success('Student profile updated successfully.', updatedStudent)
  );
});

/**
 * Get All Learning Roadmaps/States Enrolled by Student
 */
export const getStudentEnrolledDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const states = await StudentStateModel.find({ studentId: id }).select('-recentMemory');

  res.status(200).json(
    AppResponse.success('Enrolled document states retrieved.', states)
  );
});