export interface SalesforceQueryResponse {
    totalSize: number;
    done: boolean;
    records: Record<string, any>[];
}
export interface SalesforceObject {
    name: string;
    label: string;
    custom: boolean;
    queryable: boolean;
}
export interface QueryArgs {
    query: string;
}
export declare function isValidQueryArgs(args: any): args is QueryArgs;
