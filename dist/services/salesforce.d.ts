import * as jsforce from 'jsforce';
export declare class SalesforceService {
    private conn;
    private isInitialized;
    constructor();
    private ensureInitialized;
    private initialize;
    query(soql: string): Promise<jsforce.QueryResult<jsforce.Record>>;
    describeObject(objectName: string): Promise<jsforce.DescribeSObjectResult>;
    create(objectName: string, data: any): Promise<jsforce.SaveResult[]>;
    update(objectName: string, data: any): Promise<jsforce.SaveResult[]>;
    delete(objectName: string, id: string): Promise<jsforce.SaveResult>;
}
