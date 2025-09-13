// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// --- Helper: Load people.json ---
function loadPeopleData() {
  try {
    const raw = fs.readFileSync("./people.json", "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading people.json:", err);
    return [];
  }
}

// --- Helper: Load context.json ---
function loadContextData() {
  try {
    const raw = fs.readFileSync("./context.json", "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading context.json:", err);
    return {};
  }
}

// --- API Route ---
app.post("/ask", async (req, res) => {
  try {
    const prompt = (req.body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Load local files
    const peopleData = loadPeopleData();
    const contextData = loadContextData();

    // Short snippet of people for context
    const peopleSnippet = peopleData
      .slice(0, 5)
      .map(p => `- ${p.name}, ${p.age}, ${p.city}, ${p.role}`)
      .join("\n");

    // Build instruction from context.json
    const domainInfo = Object.entries(contextData.domains || {})
      .map(([k, v]) => `• ${k}: ${v}`)
      .join("\n");

    const rules = (contextData.rules || []).map(r => `- ${r}`).join("\n");

    // System-style instruction (less restrictive)
    const systemInstruction = `
You are a helpful assistant for municipal topics.
Your main focus areas are:
${domainInfo}

You also have some citizen information:
${peopleSnippet}

Guidelines:
${rules}

When answering:
- If inside these domains, give detailed, practical, and friendly answers.
- If outside, politely mention your expertise is limited, then guide user back to city management, water cleanliness, or garbage collection.
`;

    const modelPrompt = `${systemInstruction}\nUser: ${prompt}\nAssistant:`;

    console.log("Prompt sent to Ollama:\n", modelPrompt);

    // Send request to Ollama
    const response = await fetch("http://localhost:11434/v1/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:latest",
        prompt: modelPrompt,
        max_tokens: 400,
        stream: false,
      }),
    });

    const data = await response.json();
    console.log("Ollama response:", data);

    // Extract model answer
    const answer = data.choices?.[0]?.text?.trim() || "No response from model.";

    res.json({ answer });
  } catch (error) {
    console.error("Error calling Ollama:", error);
    res.status(500).json({ error: "Something went wrong with Ollama API" });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
