import getEmbedding from "./embed.js";
import { retrieveTopK } from "./vectorStore.js";

const handler = async (req, res) => {
  try {
    const query = req.body.messages?.[0]?.content;
    if (!query) return res.status(400).json({ error: "Missing query." });
    console.log("RAG query:", query);
    const queryEmbedding = (await getEmbedding(query))[0];
    const topDocs = await retrieveTopK(queryEmbedding, 100);

    const context = topDocs.map((d, i) => `Document ${i + 1}: ${d.content}`).join("\n\n");
    const prompt = `You are a helpful assistant.\nContext:\n${context}\nQuestion: ${query}\nAnswer:`;
    console.log("hi from rag")
    const axios = await import("axios").then((m) => m.default);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = response.data.choices[0].message.content.trim();
    res.json({ answer, sources: topDocs.map((d) => d.docId) });
  } catch (err) {
    console.error("RAG error:", err.response?.data || err.message);
    res.status(500).json({ error: "RAG failed." });
  }
};

export default handler;
