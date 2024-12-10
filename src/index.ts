#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import * as jsforce from 'jsforce';
import dotenv from "dotenv";
import { isValidQueryArgs } from "./types.js";

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
      version: "0.1.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.conn = new jsforce.Connection({
      loginUrl: API_CONFIG.LOGIN_URL
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
        tools: [{
          name: "query",
          description: "Execute a SOQL query on Salesforce",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "SOQL query to execute"
              }
            },
            required: ["query"]
          }
        }]
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        if (request.params.name !== "query") {
          return {
            content: [{
              type: "text",
              text: `Unknown tool: ${request.params.name}`
            }],
            isError: true
          };
        }

        if (!isValidQueryArgs(request.params.arguments)) {
          return {
            content: [{
              type: "text",
              text: "Invalid query arguments"
            }],
            isError: true
          };
        }

        try {
          await this.conn.login(
            process.env.SF_USERNAME!,
            process.env.SF_PASSWORD! + process.env.SF_SECURITY_TOKEN!
          );

          const result = await this.conn.query(request.params.arguments.query);
          
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