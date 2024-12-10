export interface QueryArgs {
  query: string;
}

export function isValidQueryArgs(args: any): args is QueryArgs {
  return (
    typeof args === "object" && 
    args !== null && 
    "query" in args &&
    typeof args.query === "string"
  );
}