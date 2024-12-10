#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema, ListToolsRequestSchema, CallToolRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import jsforce from 'jsforce';
import dotenv from "dotenv";
import { isValidQueryArgs } from "./types.js";
dotenv.config();
const SF_CONFIG = {
    LOGIN_URL: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    DEFAULT_OBJECT: 'Account',
    ENDPOINTS: {
        QUERY: 'query',
        DESCRIBE: 'describe'
    }
};
const SF_CREDENTIALS = {
    username: process.env.SF_USERNAME,
    password: process.env.SF_PASSWORD,
    securityToken: process.env.SF_SECURITY_TOKEN
};
if (!SF_CREDENTIALS.username || !SF_CREDENTIALS.password || !SF_CREDENTIALS.securityToken) {
    throw new Error("Salesforce credentials are required in environment variables");
}
class SalesforceServer {
    constructor() {
        this.server = new Server({
            name: "example-salesforce-server",
            version: "0.1.0"
        }, {
            capabilities: {
                resources: {},
                tools: {}
            }
        });
        this.conn = new jsforce.Connection({
            loginUrl: SF_CONFIG.LOGIN_URL
        });
        this.setupHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error("[MCP Error]", error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        this.setupResourceHandlers();
        this.setupToolHandlers();
    }
    setupResourceHandlers() {
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
            resources: [{
                    uri: `salesforce://${SF_CONFIG.DEFAULT_OBJECT}/objects`,
                    name: `Available Salesforce Objects`,
                    mimeType: "application/json",
                    description: "List of queryable Salesforce objects in your organization"
                }]
        }));
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            if (request.params.uri !== `salesforce://${SF_CONFIG.DEFAULT_OBJECT}/objects`) {
                throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${request.params.uri}`);
            }
            try {
                await this.conn.login(SF_CREDENTIALS.username, SF_CREDENTIALS.password + SF_CREDENTIALS.securityToken);
                const describeGlobal = await this.conn.describeGlobal();
                const objects = describeGlobal.sobjects
                    .filter(obj => obj.queryable)
                    .map(obj => ({
                    name: obj.name,
                    label: obj.label,
                    custom: obj.custom,
                    queryable: obj.queryable
                }));
                return {
                    contents: [{
                            uri: request.params.uri,
                            mimeType: "application/json",
                            text: JSON.stringify(objects, null, 2)
                        }]
                };
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `Salesforce API error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
                await this.conn.login(SF_CREDENTIALS.username, SF_CREDENTIALS.password + SF_CREDENTIALS.securityToken);
                const result = await this.conn.query(request.params.arguments.query);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: "text",
                            text: `Salesforce API error: ${error instanceof Error ? error.message : String(error)}`
                        }],
                    isError: true
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Salesforce MCP server running on stdio");
    }
}
const server = new SalesforceServer();
server.run().catch(console.error);
