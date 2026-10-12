import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();
app.use(express.json());

// Initialize the official MCP Server architecture
const server = new Server({
  name: "github-mcp-server",
  version: "1.0.0"
}, {
  capabilities: { resources: {}, tools: {}, prompts: {} }
});

// Setup the GitHub API interaction endpoints
server.tool("list-repos", "List all repositories", async () => {
  const res = await fetch("https://github.com", {
    headers: { Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}` }
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
});

// Listen framework for Gemini Spark over SSE (Server-Sent Events)
let transport;
app.get("/api/mcp", async (req, res) => {
  transport = new SSEServerTransport("/api/mcp/messages", res);
  await server.connect(transport);
});

app.post("/api/mcp/messages", async (req, res) => {
  if (transport) await transport.handleMessage(req, res);
});

export default app;
