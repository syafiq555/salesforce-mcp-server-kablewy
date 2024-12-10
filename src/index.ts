#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import * as jsforce from 'jsforce';
import dotenv from "dotenv";
import { tools } from "./tools.js";

dotenv.config();

const API_CONFIG = {
  LOGIN_URL: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
} as const;

if (!process.env.SF_USERNAME || !process.env.SF_PASSWORD || !process.env.SF_SECURITY_TOKEN) {
  throw new Error("SF_USERNAME, SF_PASSWORD, and SF_SECURITY_TOKEN environment variables are required");
}

class SalesforceServer {
  private server: Server;
  private conn: jsforce.Connection;

  constructor() {
    this.server = new Server({
      name: "salesforce-mcp-server",
      version: "0.2.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.conn = new jsforce.Connection({
      loginUrl: API_CONFIG.LOGIN_URL,
      version:'58.0'
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema
        }))
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const tool = tools.find(t => t.name === request.params.name);
        
        if (!tool) {
          return {
            content: [{
              type: "text",
              text: `Unknown tool: ${request.params.name}`
            }],
            isError: true
          };
        }

        try {
          await this.conn.login(
            process.env.SF_USERNAME!,
            process.env.SF_PASSWORD! + process.env.SF_SECURITY_TOKEN!
          );

          const result = await tool.handler(this.conn, request.params.arguments);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Salesforce API error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Salesforce MCP server running on stdio");
  }
}

const server = new SalesforceServer();
server.run().catch(console.error);