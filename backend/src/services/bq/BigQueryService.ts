import { BigQuery } from '@google-cloud/bigquery';
import { AppDataSource } from '../../database/data-source';
import type { EntityMetadata } from 'typeorm';

const bq = new BigQuery();
const BQ_DATASET = 'stc2025';
const BQ_LOCATION = 'EU';
const BATCH_SIZE = 500;
const FLATTEN_FORCE_RECREATE = process.env.FLATTEN_FORCE_RECREATE === 'true';
const ONLY_TABLES = (process.env.ONLY_TABLES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

type BqType = 'INT64' | 'FLOAT64' | 'BOOL' | 'STRING' | 'TIMESTAMP' | 'DATE';
type ColTypesMap = Record<string, BqType>;
type BqFieldMode = 'NULLABLE' | 'REQUIRED' | 'REPEATED';
type BqField = { name: string; type: BqType; mode?: BqFieldMode };

function mapTypeOrmToBq(type: unknown): BqType {
    const t = (typeof type === 'string' ? type : String(type)).toLowerCase();
    if (t === 'date') return 'DATE';
    if (t === 'datetime' || t === 'timestamp') return 'TIMESTAMP';
    if (['int', 'integer', 'bigint', 'smallint', 'number'].includes(t)) return 'INT64';
    if (['float', 'double', 'real', 'decimal', 'numeric'].includes(t)) return 'FLOAT64';
    if (t === 'bool' || t === 'boolean') return 'BOOL';
    return 'STRING';
}

function getKeyCols(meta: EntityMetadata): string[] {
    const pk = (meta.primaryColumns || []).map((c) => c.databaseName);
    if (pk.length) return pk;
    const idCol = meta.columns.find((c) => c.propertyName === 'id');
    return idCol ? [idCol.databaseName] : [];
}

function parseToJSDate(v: unknown, dateOnly: boolean): Date | null {
    if (v === '' || v === null || v === undefined) return null;
    let d: Date;
    if (v instanceof Date) d = v;
    else if (typeof v === 'number') d = new Date(v);
    else if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return null;
        if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(s)) d = new Date(`${s}T00:00:00Z`);
        else d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : new Date(s);
    } else {
        d = new Date(String(v));
    }
    return Number.isNaN(d.valueOf()) ? null : d;
}

function normalizeValueForBq(bqType: BqType, v: unknown): unknown {
    if (v === null || v === undefined) return null;
    switch (bqType) {
        case 'INT64': {
            if (v === '') return null;
            if (typeof v === 'bigint') return Number(v);
            const numInt = Number(v);
            return Number.isNaN(numInt) ? null : numInt;
        }
        case 'FLOAT64': {
            if (v === '') return null;
            const numFloat = Number(v);
            return Number.isNaN(numFloat) ? null : numFloat;
        }
        case 'BOOL': {
            if (v === '') return null;
            if (typeof v === 'string') {
                const s = v.toLowerCase();
                if (['true', '1', 't', 'y', 'yes'].includes(s)) return true;
                if (['false', '0', 'f', 'n', 'no'].includes(s)) return false;
            }
            return Boolean(v);
        }
        case 'DATE': {
            const d = parseToJSDate(v, true);
            return d ? d.toISOString().slice(0, 10) : null;
        }
        case 'TIMESTAMP': {
            const d = parseToJSDate(v, false);
            return d ?? null;
        }
        case 'STRING':
        default:
            return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
}

async function ensureDataset() {
    const dataset = bq.dataset(BQ_DATASET);
    const [exists] = await dataset.exists();
    if (!exists) {
        await bq.createDataset(BQ_DATASET, { location: BQ_LOCATION });
        console.log(`[bq] Dataset '${BQ_DATASET}' created at ${BQ_LOCATION}`);
    }
    return dataset;
}

async function dropTableIfExists(
    dataset: ReturnType<typeof bq.dataset>,
    tableId: string,
) {
    const table = dataset.table(tableId);
    const [exists] = await table.exists();
    if (exists) {
        await table.delete({ ignoreNotFound: true });
        console.warn(`[bq] Dropped table '${tableId}'`);
    }
}

function buildSchema(meta: EntityMetadata): BqField[] {
    const fields: BqField[] = meta.columns.map((c) => ({
        name: c.databaseName,
        type: mapTypeOrmToBq(c.type),
        mode: 'NULLABLE',
    }));
    fields.push({ name: '_exported_at', type: 'TIMESTAMP', mode: 'REQUIRED' });
    return fields;
}

async function ensureStructuredTable(
    dataset: ReturnType<typeof bq.dataset>,
    meta: EntityMetadata,
) {
    const table = dataset.table(meta.tableName);
    const [exists] = await table.exists();
    const desiredFields = buildSchema(meta);
    if (!exists) {
        await dataset.createTable(meta.tableName, {
            schema: { fields: desiredFields },
            timePartitioning: { type: 'DAY', field: '_exported_at' },
        });
        console.log(`[bq] Table '${meta.tableName}' created (partitioned by _exported_at).`);
        return table;
    }
    const [metaBq] = await table.getMetadata();
    const existingNames = (metaBq.schema?.fields || []).map((f: any) => f.name);
    const desiredNames = desiredFields.map((f) => f.name);
    const same =
        desiredNames.length === existingNames.length &&
        desiredNames.every((n) => existingNames.includes(n));
    if (!same) {
        if (!FLATTEN_FORCE_RECREATE) {
            console.warn(
                `[bq] Table '${meta.tableName}' exists with different schema. Set FLATTEN_FORCE_RECREATE=true or drop the table manually.`,
            );
            return table;
        }
        await dropTableIfExists(dataset, meta.tableName);
        await dataset.createTable(meta.tableName, {
            schema: { fields: desiredFields },
            timePartitioning: { type: 'DAY', field: '_exported_at' },
        });
        console.log(
            `[bq] Table '${meta.tableName}' recreated to match schema (partitioned by _exported_at).`,
        );
    }
    return dataset.table(meta.tableName);
}

function buildMergeSQL(
    tableId: string,
    allCols: string[],
    keyCols: string[],
    colTypes: ColTypesMap,
): string {
    const on =
        keyCols
            .map((c) => `SAFE_CAST(T.${c} AS STRING)=SAFE_CAST(S.${c} AS STRING)`)
            .join(' AND ') || 'FALSE';
    const castExpr = (c: string) => `SAFE_CAST(S.${c} AS ${colTypes[c]})`;
    const updatable = allCols.filter((c) => !keyCols.includes(c) && c !== '_exported_at');
    const setClause = updatable.length
        ? `UPDATE SET ${updatable.map((c) => `T.${c} = ${castExpr(c)}`).join(', ')}`
        : 'UPDATE SET T._exported_at = S._exported_at';
    const insertCols = allCols.join(', ');
    const insertVals = allCols.map((c) => castExpr(c)).join(', ');
    return `
MERGE \`${BQ_DATASET}.${tableId}\` AS T
USING UNNEST(@rows) AS S
ON ${on}
WHEN MATCHED THEN
  ${setClause}
WHEN NOT MATCHED THEN
  INSERT (${insertCols}) VALUES (${insertVals})
`.trim();
}

function buildRowsParamTypes(allCols: string[], colTypes: ColTypesMap) {
    const shape: Record<string, BqType> = {};
    for (const c of allCols) shape[c] = colTypes[c];
    return { rows: [shape] };
}

async function upsertChunkWithMerge(
    tableId: string,
    allCols: string[],
    keyCols: string[],
    colTypes: ColTypesMap,
    rows: Array<Record<string, unknown>>,
) {
    if (keyCols.length === 0) {
        throw new Error(`Cannot UPSERT into '${tableId}': no key columns (define PK or 'id').`);
    }
    const query = buildMergeSQL(tableId, allCols, keyCols, colTypes);
    const types = buildRowsParamTypes(allCols, colTypes);
    await bq.query({
        query,
        params: { rows },
        types,
        location: BQ_LOCATION,
    });
}

function shouldJoinRelation(r: any) {
    return r.isManyToOne || r.isOneToOne;
}

function safeJoinOn(rel: any) {
    const jc = rel.joinColumns?.[0];
    if (!jc || !jc.referencedColumn) return null;
    return {
        left: jc.databaseName,
        right: jc.referencedColumn.databaseName,
    };
}

async function createOrUpdateViews(metas: EntityMetadata[]) {
    const exported = new Set(metas.map((m) => m.tableName));
    console.log(`[bq] Checking/updating views for ${metas.length} exported tables...`);
    for (const meta of metas) {
        const relations = meta.relations.filter(shouldJoinRelation);
        if (relations.length === 0) continue;
        const viewId = `${meta.tableName}_view`;
        const baseTable = `\`${BQ_DATASET}.${meta.tableName}\``;
        const selectCols: string[] = ['T1.*'];
        const joins: string[] = [];
        let aliasCounter = 2;
        for (const rel of relations) {
            const targetTableName = rel.inverseEntityMetadata.tableName;
            if (!exported.has(targetTableName)) {
                console.warn(
                    `[bq] Skipping JOIN for ${meta.tableName} -> ${targetTableName} in VIEW: target table is not exported.`,
                );
                continue;
            }
            const joinOn = safeJoinOn(rel);
            if (!joinOn) continue;
            const relAlias = `T${aliasCounter++}`;
            const relTable = `\`${BQ_DATASET}.${targetTableName}\``;
            joins.push(`LEFT JOIN ${relTable} AS ${relAlias} ON T1.${joinOn.left} = ${relAlias}.${joinOn.right}`);
            for (const c of rel.inverseEntityMetadata.columns) {
                if (c.databaseName === joinOn.right) continue;
                const alias = `${rel.propertyName}_${c.propertyName}`;
                selectCols.push(`${relAlias}.${c.databaseName} AS ${alias}`);
            }
        }
        if (joins.length === 0) {
            console.log(`[bq] Skipping VIEW for ${meta.tableName}: no valid JOINs found.`);
            continue;
        }
        const sql = `
CREATE OR REPLACE VIEW \`${BQ_DATASET}.${viewId}\` AS
SELECT
  ${selectCols.join(',\n  ')}
FROM
  ${baseTable} AS T1
${joins.join('\n')}
`.trim();
        try {
            await bq.query({ query: sql, location: BQ_LOCATION });
            console.log(`[bq] View '${viewId}' created/updated successfully.`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[bq] Failed to create view '${viewId}': ${msg}`);
        }
    }
}

export async function exportAllToBigQuery() {
    const ds = AppDataSource;
    if (!ds.isInitialized) {
        await ds.initialize();
    }
    const dataset = await ensureDataset();
    const metas = ds.entityMetadatas
        .filter((m) => !m.tableName.startsWith('sqlite_'))
        .filter((m) => (ONLY_TABLES.length === 0 ? true : ONLY_TABLES.includes(m.tableName)));
    const now = new Date();
    const summary: Record<string, number> = {};
    const issues: Record<string, Array<{ message: string; reason?: string; location?: string }>> = {};
    console.log(`[bq] Starting export for ${metas.length} tables...`);
    for (const meta of metas) {
        await ensureStructuredTable(dataset, meta);
        const colTypes: ColTypesMap = Object.fromEntries(
            meta.columns.map((c) => [c.databaseName, mapTypeOrmToBq(c.type)]),
        );
        colTypes['_exported_at'] = 'TIMESTAMP';
        const allCols = meta.columns.map((c) => c.databaseName).concat('_exported_at');
        const keyCols = getKeyCols(meta);
        const repo = ds.getRepository(meta.target as any);
        const rowsAll = (await repo.find({ loadRelationIds: true })) as Array<Record<string, unknown>>;
        summary[meta.tableName] = rowsAll.length;
        if (rowsAll.length === 0) {
            console.log(`[bq] Skipping '${meta.tableName}': 0 rows.`);
            continue;
        }
        console.log(`[bq] Exporting ${rowsAll.length} rows for '${meta.tableName}'...`);
        for (let i = 0; i < rowsAll.length; i += BATCH_SIZE) {
            const chunk = rowsAll.slice(i, i + BATCH_SIZE);
            const rows = chunk.map((entity) => {
                const out: Record<string, unknown> = {};
                for (const c of meta.columns) {
                    const raw = (entity as any)[c.propertyName];
                    const bqType = colTypes[c.databaseName];
                    out[c.databaseName] = normalizeValueForBq(bqType, raw);
                }
                out._exported_at = now;
                return out;
            });
            try {
                await upsertChunkWithMerge(meta.tableName, allCols, keyCols, colTypes, rows);
            } catch (err: any) {
                if (err?.name === 'PartialFailureError' && Array.isArray(err.errors)) {
                    issues[meta.tableName] ??= [];
                    for (const r of err.errors) {
                        for (const ee of r.errors || []) {
                            issues[meta.tableName].push({
                                message: ee.message,
                                reason: ee.reason,
                                location: ee.location,
                            });
                        }
                    }
                    continue;
                }
                throw err;
            }
        }
    }
    console.log('[bq] Table export complete. Updating views...');
    await createOrUpdateViews(metas);
    return { summary, issues, mode: 'NORMALIZED_WITH_VIEWS' as const };
}
