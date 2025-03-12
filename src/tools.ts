import { Connection } from 'jsforce';
import {
  QueryArgs,
  ToolingQueryArgs,
  DescribeObjectArgs,
  MetadataRetrieveArgs,
  isValidToolingQueryArgs,
  isValidDescribeObjectArgs,
  isValidMetadataRetrieveArgs,
  isValidMetadataType
} from './types.js';

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (conn: Connection, args: any) => Promise<any>;
}

export const tools: ToolHandler[] = [
  {
    name: "query",
    description: "Execute a SOQL query on Salesforce",
    inputSchema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "SOQL query to execute"
        }
      },
      required: ["sql"]
    },
    handler: async (conn: Connection, args: QueryArgs) => {
      return await conn.query(args?.sql ?? args?.query ?? 'Error: No query provided');
    }
  },
  {
    name: "tooling_query",
    description: "Execute a query against the Salesforce Tooling API",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Tooling API query to execute"
        }
      },
      required: ["query"]
    },
    handler: async (conn: Connection, args: ToolingQueryArgs) => {
      if (!isValidToolingQueryArgs(args)) {
        throw new Error("Invalid tooling query arguments");
      }
      return await conn.tooling.query(args.query);
    }
  },
  {
    name: "describe_object",
    description: "Get detailed metadata about a Salesforce object",
    inputSchema: {
      type: "object",
      properties: {
        objectName: {
          type: "string",
          description: "API name of the object to describe"
        },
        detailed: {
          type: "boolean",
          description: "Whether to return full metadata (optional)",
          default: false
        }
      },
      required: ["objectName"]
    },
    handler: async (conn: Connection, args: DescribeObjectArgs) => {
      if (!isValidDescribeObjectArgs(args)) {
        throw new Error("Invalid describe object arguments");
      }
      const objType = conn.sobject(args.objectName);
      if (args.detailed) {
        // For custom objects, we can get additional metadata
        if (args.objectName.endsWith('__c')) {
          const [describe, metadata] = await Promise.all([
            objType.describe(),
            conn.metadata.read('CustomObject', args.objectName)
          ]);
          return { describe, metadata };
        }
        return await objType.describe();
      }
      return await objType.describe();
    }
  },
  {
    name: "metadata_retrieve",
    description: "Retrieve metadata components from Salesforce",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Metadata type (e.g., Flow, CustomObject)",
          enum: [
            'CustomObject',
            'Flow',
            'FlowDefinition',
            'CustomField',
            'ValidationRule',
            'ApexClass',
            'ApexTrigger',
            'WorkflowRule',
            'Layout'
          ]
        },
        fullNames: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of component names to retrieve"
        }
      },
      required: ["type", "fullNames"]
    },
    handler: async (conn: Connection, args: MetadataRetrieveArgs) => {
      if (!isValidMetadataRetrieveArgs(args)) {
        throw new Error("Invalid metadata retrieve arguments");
      }
      
      if (!isValidMetadataType(args.type)) {
        throw new Error(`Invalid metadata type: ${args.type}`);
      }

      return await conn.metadata.read(args.type, args.fullNames);
    }
  }
];
