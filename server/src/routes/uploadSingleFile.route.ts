import type  { Express, Request, Response, NextFunction } from 'express'
import { uploadFromBuffer } from '../services/uploadFromBuffer.service.js'
import { AppResponse } from '../utils/structures/appResponse.js'
import { asyncHandler } from '../utils/structures/asyncHandler.js'

export const uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction)=> {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded.' })
    return
  }
  const uploadResult = await uploadFromBuffer(req.file.buffer);
  return res.status(200).json(new AppResponse(
    200,
    "successfully uploaded file",
    uploadResult
  ))
})