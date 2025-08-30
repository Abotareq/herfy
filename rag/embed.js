// // embed.js
// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// async function getEmbedding(text) {
//   console.log("from get emmeding")
//   if (!text) {
//     throw new Error("Text input is required for embedding.");
//   }
//   const response = await axios.post(
//     "https://api.openai.com/v1/embeddings",
//     {
//       model: "text-embedding-ada-002",
//       input: text , // Handle both string and object input
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       },
//     }
//   );
// //cat  x=0.55555   y=0.66666
//   console.log("after embedding");
//   return response.data.data[0].embedding;
// }

// export default getEmbedding;
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function getEmbedding(texts) {
  if (!texts) throw new Error("Text input is required for embedding.");
  const inputArray = Array.isArray(texts) ? texts : [texts];
  console.log("Input array for embedding:", process.env.OPENAI_API_KEY);
  const response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      model: "text-embedding-ada-002",
      input: inputArray,
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );
  console.log("Received embeddings:", response.data);
  return response.data.data.map((d) => d.embedding);
}

export default getEmbedding;