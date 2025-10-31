import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Initialize the MCP server
const server = new Server(
  {
    name: "slangroom-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Set up stdio transport
const transport = new StdioServerTransport();
server.connect(transport);

console.log("Slangroom MCP server initialized");