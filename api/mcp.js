import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();
app.use(express.json());

// FORCE CORS & ALLOW ALL OUTSIDE PINGS FROM GOOGLE
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-mcp-protocol-version');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const server = new Server({
  name: "github-mcp-server",
  version: "1.0.0"
}, {
  capabilities: { resources: {}, tools: {}, prompts: {} }
});

server.tool("list-repos", "List all repositories", async () => {
  const res = await fetch("https://github.com", {
    headers: { Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}` }
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
});

let transport;
app.get("/api/mcp", async (req, res) => {
  transport = new SSEServerTransport("/api/mcp/messages", res);
  await server.connect(transport);
});

app.post("/api/mcp/messages", async (req, res) => {
  if (transport) await transport.handleMessage(req, res);
});

export default app;
