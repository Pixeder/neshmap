import { ChatOpenAI } from "@langchain/openai";

const modelName = process.env.MODEL_NAME;
const apiKey = process.env.MODEL_API_KEY;

if (!modelName || !apiKey) {
  throw new Error("Missing MODEL_NAME or MODEL_API_KEY environment variables.");
}

const agent = new ChatOpenAI({
  modelName: modelName,
  apiKey: apiKey,
  temperature: 0,
  maxRetries: 3,
});

export default agent;