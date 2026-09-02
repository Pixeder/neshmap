import { ChatOpenAI } from "@langchain/openai";
import { MODELS } from  "./models.js";

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable.");
}

const defaultConfig = {
  apiKey: groqApiKey,
  configuration: { baseURL: "https://api.groq.com/openai/v1" },
};

// 1. Fast Agent: Used for query generation, search extraction, metadata mapping
export const fastAgent = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.FAST,
  temperature: 0,
  maxRetries: 3,
});

// 2. Vision Agent: Used for handwritten PDF page layout/OCR to Markdown/LaTeX
export const visionAgent = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.VISION,
  temperature: 0.1,
  maxRetries: 2,
});

// 3. Reasoning Agent: Used for structured Syllabus creation and final Lecture synthesis
export const reasoningAgent = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.REASONING,
  temperature: 0.2,
  maxRetries: 3,
});

// 4. Pedagogical Agent: Dedicated reasoning & distillation support
export const pedagogicalAgent = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.PEDAGOGICAL,
  temperature: 0.2,
  maxRetries: 3,
});