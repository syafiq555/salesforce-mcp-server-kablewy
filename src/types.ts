import type { MetadataType } from 'jsforce/api/metadata';

// Existing query interface
export interface QueryArgs {
  query: string;
}

export interface ToolingQueryArgs {
  query: string;
}

export interface DescribeObjectArgs {
  objectName: string;
  detailed?: boolean;
}

export interface MetadataRetrieveArgs {
  type: MetadataType;  // Using jsforce's MetadataType
  fullNames: string[];
}

// Type guards
export function isValidQueryArgs(args: any): args is QueryArgs {
  return (
    typeof args === "object" && 
    args !== null && 
    "query" in args &&
    typeof args.query === "string"
  );
}

export function isValidToolingQueryArgs(args: any): args is ToolingQueryArgs {
  return (
    typeof args === "object" && 
    args !== null && 
    "query" in args &&
    typeof args.query === "string"
  );
}

export function isValidDescribeObjectArgs(args: any): args is DescribeObjectArgs {
  return (
    typeof args === "object" && 
    args !== null && 
    "objectName" in args &&
    typeof args.objectName === "string" &&
    (args.detailed === undefined || typeof args.detailed === "boolean")
  );
}

export function isValidMetadataRetrieveArgs(args: any): args is MetadataRetrieveArgs {
  return (
    typeof args === "object" && 
    args !== null && 
    "type" in args &&
    typeof args.type === "string" && // We'll validate against MetadataType in the handler
    "fullNames" in args &&
    Array.isArray(args.fullNames) &&
    args.fullNames.every((name: any) => typeof name === "string")
  );
}

// Helper function to validate MetadataType
export function isValidMetadataType(type: string): type is MetadataType {
  return [
    'CustomObject',
    'Flow',
    'FlowDefinition',
    'CustomField',
    'ValidationRule',
    'ApexClass',
    'ApexTrigger',
    'WorkflowRule',
    'Layout'
    // Add more as needed
  ].includes(type);
}
