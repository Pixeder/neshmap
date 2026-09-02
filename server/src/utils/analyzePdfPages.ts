// import { convertPdfToImageBuffers } from "./pdfToImage.js";
// import { visionAgent } from "../agent/agent.js";
// import { HumanMessage } from "@langchain/core/messages";

// export async function processPdfPageWithVision(pdfUrl: string, pageIndex: number) {
//   // 1. Extract page 1 buffer
//   const [pageBuffer] = await convertPdfToImageBuffers(pdfUrl, {
//     pageNumbers: [pageIndex],
//     scale: 2.0,
//   });

//   // 2. Format to Base64 Data URL for Vision model payload
//   const base64Image = pageBuffer.toString("base64");
//   const dataUrl = `data:image/png;base64,${base64Image}`;

//   // 3. Send to Groq Qwen Vision model via LangChain
//   const response = await visionAgent.invoke([
//     new HumanMessage({
//       content: [
//         {
//           type: "text",
//           text: "Transcribe this handwritten lecture page into clean Markdown. Convert all mathematical equations to LaTeX notation. List any key topic headers explicitly.",
//         },
//         {
//           type: "image_url",
//           image_url: { url: dataUrl },
//         },
//       ],
//     }),
//   ]);

//   return response.content;
// }