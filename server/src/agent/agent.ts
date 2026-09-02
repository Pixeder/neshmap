import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MODELS } from "./models.js";
import { VISION_AGENT_SYSTEM_PROMPT } from "../utils/prompts/visionPrompt.js";
import { CURRICULUM_ARCHITECT_SYSTEM_PROMPT } from "../utils/prompts/roadmapPrompt.js";

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable.");
}

const defaultConfig = {
  apiKey: groqApiKey,
  configuration: { baseURL: "https://api.groq.com/openai/v1" },
};

// Base Model Instances
const fastModel = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.FAST,
  temperature: 0,
  maxRetries: 3,
});

const visionModel = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.VISION,
  temperature: 0.1,
  maxRetries: 2,
});

const reasoningModel = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.REASONING,
  temperature: 0.2,
  maxRetries: 3,
});

const pedagogicalModel = new ChatOpenAI({
  ...defaultConfig,
  modelName: MODELS.PEDAGOGICAL,
  temperature: 0.2,
  maxRetries: 3,
});

// 1. Fast Agent: Query generation, search extraction, metadata mapping
export const fastAgent = createAgent({
  model: fastModel,
  tools: [],
  systemPrompt: "You are an ultra-fast data extraction and metadata mapping agent.",
});

// 2. Vision Agent: Handwritten PDF layout/OCR to Markdown/LaTeX
export const visionAgent = createAgent({
  model: visionModel,
  tools: [],
  systemPrompt: VISION_AGENT_SYSTEM_PROMPT,
});

// 3. Reasoning Agent: Structured Syllabus creation and Lecture synthesis
export const reasoningAgent = createAgent({
  model: reasoningModel,
  tools: [],
  systemPrompt: CURRICULUM_ARCHITECT_SYSTEM_PROMPT,
});

// 4. Pedagogical Agent: Dedicated reasoning & distillation support
export const pedagogicalAgent = createAgent({
  model: pedagogicalModel,
  tools: [],
  systemPrompt: "You are an expert pedagogical reasoning agent focused on deep conceptual distillation.",
});