import { Connection } from 'jsforce';
export class SalesforceService {
    constructor() {
        this.isInitialized = false;
        this.conn = new Connection({
            loginUrl: process.env.SF_LOGIN_URL
        });
    }
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }
    async initialize() {
        try {
            await this.conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN);
            this.isInitialized = true;
            console.log('Connected to Salesforce');
        }
        catch (error) {
            console.error('Failed to connect to Salesforce:', error);
            throw error;
        }
    }
    async query(soql) {
        console.log('Querying Salesforce:', soql);
        await this.ensureInitialized();
        try {
            const result = await this.conn.query(soql);
            return result;
        }
        catch (error) {
            console.error('Query failed:', error);
            throw error;
        }
    }
    async describeObject(objectName) {
        await this.ensureInitialized();
        try {
            const metadata = await this.conn.describe(objectName);
            return metadata;
        }
        catch (error) {
            console.error(`Failed to describe object ${objectName}:`, error);
            throw error;
        }
    }
    async create(objectName, data) {
        await this.ensureInitialized();
        try {
            const result = await this.conn.sobject(objectName).create(data);
            return result;
        }
        catch (error) {
            console.error(`Failed to create ${objectName}:`, error);
            throw error;
        }
    }
    async update(objectName, data) {
        await this.ensureInitialized();
        try {
            const result = await this.conn.sobject(objectName).update(data);
            return result;
        }
        catch (error) {
            console.error(`Failed to update ${objectName}:`, error);
            throw error;
        }
    }
    async delete(objectName, id) {
        await this.ensureInitialized();
        try {
            const result = await this.conn.sobject(objectName).destroy(id);
            return result;
        }
        catch (error) {
            console.error(`Failed to delete ${objectName}:`, error);
            throw error;
        }
    }
}
