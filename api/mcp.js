import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

// Initialize the stateless handler optimized for Gemini Spark and Vercel
const handler = createMcpHandler(
  async (server) => {
    // Register the GitHub tool natively
    server.registerTool(
      "list-repos",
      "List all repositories",
      z.object({}), // Expects no input arguments
      async () => {
        try {
          const res = await fetch("https://github.com", {
            headers: { 
              Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
              "User-Agent": "Gemini-Spark-Agent"
            }
          });
          
          if (!res.ok) {
            return { content: [{ type: "text", text: `GitHub API error: ${res.statusText}` }] };
          }
          
          const data = await res.json();
          // Map down the array so it doesn't overload Gemini's token window
          const repoList = data.map(r => ({ name: r.name, url: r.html_url, updated: r.updated_at }));
          
          return { content: [{ type: "text", text: JSON.stringify(repoList) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Server error: ${error.message}` }] };
        }
      }
    );
  },
  {
    serverInfo: {
      name: "github-mcp-server",
      version: "2.0.0",
    }
  }
);

// Export the GET and POST handlers directly for Vercel to route automatically
export default async function (req, res) {
  return handler(req, res);
}
