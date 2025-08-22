// // vectorStore.js

// const vectorDB = []; // In-memory store

// // Add a document and its vector
// function addDocument(id, content, embedding) {
//   console.log("from add document")
//   vectorDB.push({ id, content, embedding });
//   console.log(`Document ${id} added with embedding:`, vectorDB);
// }

// // Cosine similarity between two vectors
// function cosineSimilarity(vecA, vecB) {
//   const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
//   const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
//   const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
//   return dot / (normA * normB);
// }

// // Retrieve top K similar documents
// function retrieveTopK(queryVector, k = 3) {
//   const scoredDocs = vectorDB.map(doc => {
//     const score = cosineSimilarity(queryVector, doc.embedding);
//     return { ...doc, score };
//   });

//   return scoredDocs
//     .sort((a, b) => b.score - a.score)
//     .slice(0, k);
// }

// export{
//   addDocument,
//   retrieveTopK,
// };
import Embedding from "../models/Embedding.js";
import getEmbedding from "./embed.js";
import { chunkText } from "./chunkText.js";

// Add Document + Chunking + Embedding
export async function addDocument(docId, text, meta = {}) {
  try {
    const chunks = chunkText(text);
    const embeddings = await getEmbedding(chunks);

    const docs = chunks.map((chunk, i) => ({
      docId,
      docType: meta.type || "unknown",
      chunkIndex: i,
      content: chunk,
      embedding: embeddings[i],
      metadata: meta,
    }));

    await Embedding.insertMany(docs, { ordered: false });
    console.log(`Stored ${docs.length} chunks for docId=${docId}`);
  } catch (err) {
    console.error("Error in addDocument:", err.message);
  }
}

// Retrieve Top-K Similar Documents using Atlas Vector Search
export async function retrieveTopK(queryEmbedding, k = 5, filters = {}) {
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index", // Atlas index name
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 200,
          limit: k,
        },
      },
      {
        $project: {
          content: 1,
          docId: 1,
          docType: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    if (filters && Object.keys(filters).length > 0) {
      pipeline.unshift({ $match: filters });
    }

    return await Embedding.aggregate(pipeline);
  } catch (err) {
    console.error("Error in retrieveTopK:", err.message);
    return [];
  }
}