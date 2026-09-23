import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import { VISION_MODEL_NAME } from "../constant/llm.constant.js";
import { visionModelSystemPrompt } from "../prompts/visionModel.prompt.js";
import { visionPageSchema } from "../types/visionPage.type.js";
import { ChatGoogle } from "@langchain/google";

const visionModel = new ChatGroq({
    model: VISION_MODEL_NAME,
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})

export const visionModelWithStructuredOutput = visionModel.withStructuredOutput(visionPageSchema,{includeRaw: true});

export const visionAgent = createAgent({
  model: visionModel,
  tools: [],
  systemPrompt: visionModelSystemPrompt
})

const googleVisionModel =  new ChatGoogle({
  model: "gemini-2.5-flash-lite",
  temperature: 0,
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});