import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { calculateRisk } from "./src/lib/riskService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/predict-risk", (req, res) => {
    try {
      const data = req.body;
      const result = calculateRisk(data);
      res.json(result);
    } catch (error) {
      console.error("Risk prediction error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/suggest-improvements", (req, res) => {
    try {
      const data = req.body;
      const suggestions = [];

      if (data.creditScore < 700) {
        suggestions.push({
          title: "Improve Credit Score",
          description: "Pay down existing credit card balances and ensure all payments are made on time.",
          priority: "High"
        });
      }

      if (data.monthlyExpenses / (data.income / 12) > 0.4) {
        suggestions.push({
          title: "Reduce Monthly Expenses",
          description: "Lowering your non-essential spending can improve your debt-to-income ratio.",
          priority: "Medium"
        });
      }

      if (data.loanAmount > data.income * 0.5) {
        suggestions.push({
          title: "Adjust Loan Amount",
          description: "Consider requesting a smaller loan amount to increase your approval probability.",
          priority: "High"
        });
      }

      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
