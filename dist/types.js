// Type guard for query arguments
export function isValidQueryArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof args.query === "string");
}
