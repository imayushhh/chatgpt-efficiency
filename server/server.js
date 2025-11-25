// =======================================================
// Combined Full Server (Frontend + Backend + WebSocket)
// =======================================================
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import OpenAI from "openai";
import { WebSocketServer } from "ws";
import validateEvaluationRequest from "./middleware/Validation.js";

// ---------------------- EXPRESS + STATIC FILES ----------------------

const app = express();
const http = app; 
const PORT = 3000;

app.set("view engine", "ejs");

// Resolve __dirname in ES modules:
const __filename = fileURLToPath(import.meta.url);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// ---------------------- DATABASE ----------------------

const MONGO_URI = "mongodb://localhost:27017/";
const DB_NAME = "ChatGPT_Evaluation";

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(DB_NAME);

console.log("Connected to MongoDB");

// ---------------------- OPENAI ----------------------

const openai = new OpenAI({
  apiKey: ""

});

// ---------------------- WEBSOCKET ----------------------

const wss = new WebSocketServer({
  noServer: true,
  path: "/ws"
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(msg);
    }
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/ws") {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});


// ---------------------- /api/evaluate ----------------------

function normalizeAnswer(ans) {
    if (!ans) return "";

    const cleaned = ans.trim().toUpperCase();

    if (["A","B","C","D"].includes(cleaned)) return cleaned;

    const letter = cleaned.match(/[ABCD]/);
    return letter ? letter[0] : "";
}

app.get("/api/evaluate", validateEvaluationRequest, async (req, res) => {
  try {
    const { domain, limit } = req.query;
    const collection = db.collection(domain);

    const questions = await collection
      .find({ chatgpt_response: "" })
      .limit(Number(limit) || 100)
      .toArray();

    const total = questions.length;
    const results = [];
    if (total === 0) {
   
    broadcast({
        done: true,
        message: " "
    });

    return res.json({
        success: false,
        total: 0,
        message: `All questions for "${domain}" are already evaluated.`
    })}



    for (let i = 0; i < total; i++) {
      const q = questions[i];

      const prompt = `Q: ${q.question}
            Options:
            A. ${q.options[0]}
            B. ${q.options[1]}
            C. ${q.options[2]}
            D. ${q.options[3]}
            Provide only the correct option letter from A,B,C,D.`;

      const start = Date.now();

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }]
      });

      const end = Date.now();
      let ChatGPT_answer_raw = response.choices[0].message.content;
      let ChatGPT_answer = normalizeAnswer(ChatGPT_answer_raw);
      const Actual_Answer = q.correct_answer;
      const responseTime = end - start;

      await collection.updateOne(
        { _id: new ObjectId(q._id) },
        { $set: { chatgpt_response: ChatGPT_answer, response_time: responseTime } }
      );

      const resultObj = {
        question: q.question,
        ChatGPT_answer,
        Actual_Answer,
        responseTime
      };

      results.push(resultObj);

      console.log("WS SENT:", {
        progress: `${i + 1} / ${total}`,
        ChatGPT_answer: ChatGPT_answer,
        Actual_Answer: Actual_Answer
        });

      broadcast({
        progress: `${i + 1} / ${total}`,
        current: resultObj
      });
    }
    

    res.json({ success: true, total, results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------- /api/result ----------------------

app.get("/api/results", async (req, res) => {
  try {
    const domains = ["History", "Social_Science", "Computer_Security"];
    const results = [];

    let totalQuestions = 0;
    let answeredQuestions = 0;
    let correctAnswers = 0;

    for (const domain of domains) {
      const collection = db.collection(domain);

      const total = await collection.countDocuments({ question: { $ne: "" } });
      const answered = await collection.countDocuments({ chatgpt_response: { $ne: "" } });
      const correct = await collection.countDocuments({
        $expr: { $eq: ["$chatgpt_response", "$correct_answer"] }
      });

      const avgResponse = await collection.aggregate([
        { $match: { response_time: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$response_time" } } }
      ]).toArray();

      // Push domain analytics
      results.push({
        domain,
        accuracy: answered ? (correct / answered) * 100 : 0,
        avgResponseTime: avgResponse.length ? avgResponse[0].avg / 1000 : 0 // convert ms → seconds
      });

      totalQuestions += total;
      answeredQuestions += answered;
      correctAnswers += correct;
    }

    const overallAccuracy =
      answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

    res.json({
      summary: {
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        overallAccuracy
      },
      domains: results
    });

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Analytics error" });
  }
});
