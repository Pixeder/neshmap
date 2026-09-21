import { ChatGroq } from "@langchain/groq"
import { MODEL_NAME } from "../constant/llm.constant.js"

export const llm = new ChatGroq({
    model: MODEL_NAME,
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})