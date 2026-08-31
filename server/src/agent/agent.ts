import { ChatOpenAI } from "@langchain/openai"

const model_name = process.env.MODEL_NAME as string
const apiKey = process.env.MODEL_API_KEY 

if (!model_name && !apiKey) {
  throw new Error("Missing model_name or api Key configuration.");
}

const agent = new ChatOpenAI({
  model: model_name,
  temperature: 0,
  apiKey: apiKey,
})

export default agent;