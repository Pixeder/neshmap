import mongoose, { Schema, Document } from 'mongoose';

// Track the specific pipeline stage of the document
export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  PARSING = 'PARSING',
  CHUNKING = 'CHUNKING',
  EMBEDDING = 'EMBEDDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IDocument extends Document {
  originalName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  status: DocumentStatus;
  errorMessage?: string;
  pageCount?: number;
  chunkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    originalName: { 
      type: String, 
      required: true 
    },
    cloudinaryUrl: { 
      type: String, 
      required: true 
    },
    cloudinaryPublicId: { 
      type: String, 
      required: true 
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDING,
    },
    errorMessage: { 
      type: String 
    },
    pageCount: { 
      type: Number,
      default: 0 
    },
    chunkCount: { 
      type: Number,
      default: 0 
    },
  },
  { 
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);