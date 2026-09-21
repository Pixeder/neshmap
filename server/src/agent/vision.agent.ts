import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import { VISION_MODEL_NAME } from "../constant/llm.constant.js";
import { visionModelSystemPrompt } from "../prompts/visionModel.prompt.js";

const visionModel = new ChatGroq({
    model: VISION_MODEL_NAME,
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})

export const visionAgent = createAgent({
  model: visionModel,
  tools: [],
  systemPrompt: visionModelSystemPrompt
})