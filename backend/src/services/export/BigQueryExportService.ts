import { inject, injectable } from 'inversify';
import { DataSource } from 'typeorm';
import { BigQuery, BigQueryOptions, Dataset, Table } from '@google-cloud/bigquery';
import { TYPES } from '../../types';

export interface BigQueryCredentialOptions {
    keyFilename?: string;
    keyJson?: string | Record<string, any>;
    projectId?: string;
    credentials?: {
        client_email: string;
        private_key: string;
        project_id?: string;
        [key: string]: any;
    };
}

export interface BigQueryExportOptions {
    credentials?: BigQueryCredentialOptions;
    datasetId: string;
    tablePrefix?: string;
    location?: string;
    truncateBeforeInsert?: boolean;
    chunkSize?: number;
}

export interface BigQueryExportTableResult {
    entity: string;
    tableId: string;
    rowsExported: number;
    status: 'success' | 'skipped' | 'error';
    error?: string;
}

export interface BigQueryExportResult {
    datasetId: string;
    tableResults: BigQueryExportTableResult[];
    totals: {
        tablesProcessed: number;
        rowsExported: number;
        errors: number;
        skipped: number;
    };
}

export interface IBigQueryExportService {
    exportDatabase(options: BigQueryExportOptions): Promise<BigQueryExportResult>;
}

type BigQueryField = {
    name: string;
    type: string;
    mode?: 'NULLABLE' | 'REQUIRED' | 'REPEATED';
};

type DatasetReference = {
    datasetId: string;
    projectId?: string;
    qualifiedName: string;
};

@injectable()
export class BigQueryExportService implements IBigQueryExportService {
    constructor(@inject(TYPES.DataSource) private readonly dataSource: DataSource) {}

    async exportDatabase(options: BigQueryExportOptions): Promise<BigQueryExportResult> {
        const bigQuery = this.createClient(options.credentials);
        const datasetReference = this.resolveDatasetReference(options.datasetId);
        const dataset = await this.ensureDataset(bigQuery, datasetReference, options.location);
        const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 500));
        const truncateBeforeInsert = options.truncateBeforeInsert ?? true;

        const tableResults: BigQueryExportTableResult[] = [];

        for (const metadata of this.dataSource.entityMetadatas) {
            const tableId = this.buildTableId(metadata.tableName, options.tablePrefix);
            const schema = metadata.columns.map<BigQueryField>((column) => ({
                name: column.databaseName,
                type: this.mapToBigQueryType(column.type as string | Function),
                mode: column.isNullable ? 'NULLABLE' : 'REQUIRED',
            }));

            let insertedCount = 0;
            try {
                const table = await this.ensureTable(dataset, tableId, schema);

                const rows = await this.dataSource.manager.query(`SELECT * FROM ${metadata.tableName}`);

                if (truncateBeforeInsert && rows.length > 0) {
                    await bigQuery.query({
                        query: `DELETE FROM \`${datasetReference.qualifiedName}.${tableId}\` WHERE TRUE`,
                        location: options.location,
                    });
                }

                if (rows.length === 0) {
                    tableResults.push({
                        entity: metadata.name,
                        tableId,
                        rowsExported: 0,
                        status: 'skipped',
                    });
                    continue;
                }

                const formattedRows = rows.map((row: Record<string, any>) => this.normalizeRow(row));
                for (let i = 0; i < formattedRows.length; i += chunkSize) {
                    const chunk = formattedRows.slice(i, i + chunkSize);
                    await table.insert(chunk);
                    insertedCount += chunk.length;
                }

                tableResults.push({
                    entity: metadata.name,
                    tableId,
                    rowsExported: insertedCount,
                    status: 'success',
                });
            } catch (error) {
                const message = this.extractErrorMessage(error);
                tableResults.push({
                    entity: metadata.name,
                    tableId,
                    rowsExported: insertedCount,
                    status: 'error',
                    error: message,
                });
            }
        }

        const totals = tableResults.reduce<{
            tablesProcessed: number;
            rowsExported: number;
            errors: number;
            skipped: number;
        }>(
            (acc, current) => {
                acc.tablesProcessed += 1;
                acc.rowsExported += current.rowsExported;
                if (current.status === 'error') {
                    acc.errors += 1;
                }
                if (current.status === 'skipped') {
                    acc.skipped += 1;
                }
                return acc;
            },
            { tablesProcessed: 0, rowsExported: 0, errors: 0, skipped: 0 },
        );

        return {
            datasetId: datasetReference.qualifiedName,
            tableResults,
            totals,
        };
    }

    private createClient(credentials?: BigQueryCredentialOptions): BigQuery {
        const options: BigQueryOptions = {};

        if (!credentials) {
            return new BigQuery();
        }

        if (credentials.keyFilename) {
            options.keyFilename = credentials.keyFilename;
        }

        if (credentials.keyJson) {
            const parsed = typeof credentials.keyJson === 'string'
                ? JSON.parse(credentials.keyJson)
                : credentials.keyJson;
            options.projectId = credentials.projectId ?? parsed.project_id ?? options.projectId;
            options.credentials = {
                client_email: parsed.client_email,
                private_key: parsed.private_key,
            };
        } else if (credentials.credentials) {
            options.projectId = credentials.projectId ?? credentials.credentials.project_id ?? options.projectId;
            options.credentials = {
                client_email: credentials.credentials.client_email,
                private_key: credentials.credentials.private_key,
            };
        }

        if (credentials.projectId && !options.projectId) {
            options.projectId = credentials.projectId;
        }

        return new BigQuery(options);
    }

    private async ensureDataset(bigQuery: BigQuery, reference: DatasetReference, location?: string): Promise<Dataset> {
        const dataset = bigQuery.dataset(reference.datasetId, reference.projectId ? { projectId: reference.projectId } : undefined);
        const [exists] = await dataset.exists();

        if (!exists) {
            const [created] = await dataset.create({
                location,
            });
            return created;
        }

        return dataset;
    }

    private resolveDatasetReference(datasetId: string): DatasetReference {
        const trimmed = datasetId.trim();

        if (!trimmed) {
            throw new Error('Dataset ID is required for BigQuery export.');
        }

        const normalized = trimmed.replace(':', '.');
        const segments = normalized.split('.');

        if (segments.length > 2 || segments.some((segment) => segment.length === 0)) {
            throw new Error(`Invalid dataset identifier "${datasetId}". Use the format "dataset" or "project.dataset".`);
        }

        const datasetName = segments[segments.length - 1];

        if (!/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/.test(datasetName)) {
            throw new Error('Dataset name must start with a letter or underscore and contain only letters, numbers, or underscores.');
        }

        const projectId = segments.length === 2 ? segments[0] : undefined;

        return {
            datasetId: datasetName,
            projectId,
            qualifiedName: projectId ? `${projectId}.${datasetName}` : datasetName,
        };
    }

    private async ensureTable(dataset: Dataset, tableId: string, schema: BigQueryField[]): Promise<Table> {
        const table = dataset.table(tableId);
        const [exists] = await table.exists();

        if (!exists) {
            await dataset.createTable(tableId, {
                schema: {
                    fields: schema,
                },
            });
            return dataset.table(tableId);
        }

        const [metadata] = await table.getMetadata();
        const existingFields: BigQueryField[] = metadata.schema?.fields ?? [];
        const fieldsToAdd = schema.filter(
            (field) => !existingFields.some((existing) => existing.name === field.name),
        );

        if (fieldsToAdd.length > 0) {
            await table.setMetadata({
                schema: {
                    fields: [...existingFields, ...fieldsToAdd],
                },
            });
        }

        return table;
    }

    private buildTableId(tableName: string, prefix?: string): string {
        const normalizedName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
        if (!prefix) {
            return normalizedName;
        }

        const normalizedPrefix = prefix.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+$/, '');
        return normalizedPrefix.length > 0
            ? `${normalizedPrefix}_${normalizedName}`
            : normalizedName;
    }

    private mapToBigQueryType(type: string | Function): string {
        const normalized = typeof type === 'string' ? type.toLowerCase() : '';

        switch (normalized) {
            case 'int':
            case 'integer':
            case 'int2':
            case 'int4':
            case 'int8':
            case 'smallint':
            case 'bigint':
            case 'number':
                return 'INT64';
            case 'float':
            case 'double':
            case 'real':
            case 'float4':
            case 'float8':
            case 'decimal':
                return 'FLOAT64';
            case 'bool':
            case 'boolean':
                return 'BOOL';
            case 'datetime':
            case 'timestamp':
                return 'TIMESTAMP';
            case 'json':
            case 'simple-json':
            case 'simple-array':
            case 'text':
            case 'varchar':
            case 'nvarchar':
            case 'character varying':
            default:
                return 'STRING';
        }
    }

    private normalizeRow(row: Record<string, any>): Record<string, any> {
        const normalized: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
            if (value instanceof Date) {
                normalized[key] = value.toISOString();
            } else if (typeof value === 'object' && value !== null) {
                normalized[key] = JSON.stringify(value);
            } else if (typeof value === 'bigint') {
                normalized[key] = value.toString();
            } else {
                normalized[key] = value;
            }
        }
        return normalized;
    }

    private extractErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'object' && error !== null) {
            try {
                return JSON.stringify(error);
            } catch (jsonError) {
                return String(error);
            }
        }
        return String(error);
    }
}