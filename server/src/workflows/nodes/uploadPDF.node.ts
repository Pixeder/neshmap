import { uploadBufferToCloudinary } from "../../services/uploadCloudinary.service.js";
import { StateGraph, StateSchema, GraphNode, ConditionalEdgeRouter } from "@langchain/langgraph";
import { z } from "zod/v4";

const inputState = new StateSchema({
  buffer: z.instanceof(Buffer),
})