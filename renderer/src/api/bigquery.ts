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