import fs from "fs/promises";
import path from "path";
import { ParsedDtoIngestor } from "../ingestion/ParsedDtoIngestor";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { LogsParserService } from "./LogsParserService";
import { ParsingService } from "./ParsingService";
import {resolveLogFiles} from "./helpers";
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";
import {IDeviceRepository} from "../../repositories/DeviceRepository";

@injectable()
export class DeviceFolderParsingService implements ParsingService {
    constructor(
        @inject(TYPES.SnapshotRepository) private snapshotRepo: ISnapshotRepository,
        @inject(TYPES.DeviceRepository) private deviceRepo: IDeviceRepository,
        @inject(TYPES.LogsParserService) private parser: LogsParserService,
    ) {}

    async run(deviceFolderPath: string): Promise<any> {
        if (!deviceFolderPath || typeof deviceFolderPath !== 'string') {
            throw new Error('Invalid device folder path');
        }

        const stat = await fs.stat(deviceFolderPath).catch(() => null as any);
        if (!stat || !stat.isDirectory()) {
            throw new Error('Selected path is not a directory or does not exist');
        }

        const snapshot = await this.snapshotRepo.create({ root_folder_path: deviceFolderPath });

        const folderName = path.basename(deviceFolderPath);

        let device = await this.deviceRepo.findByFolderName(folderName);

        if (!device) {
            device = await this.deviceRepo.create({
                folder_name: folderName,
                hostname: folderName,
                firstSeenSnapshot: snapshot
            });
        }

        const logFilePaths = await resolveLogFiles(deviceFolderPath);

        if (logFilePaths.length === 0) {
            console.warn(`No log files found in ${deviceFolderPath}, skipping parsing.`);
            return { snapshotId: snapshot.id, device: { id: device.id, status: 'skipped' } };
        }

        const options = { maxErrors: 200, continueOnError: true, validateResults: true, logLevel: "info" };

        const tasks = logFilePaths.map(async (logFilePath) => {
            const ingestor = new ParsedDtoIngestor();

            console.log(`Parsing file: ${logFilePath}`);

            try {
                const results = await this.parser.parse(logFilePath, options);

                if (results.success && results.data && results.data.length > 0) {
                    await ingestor.ingest(results, snapshot, device);
                    return { file: path.basename(logFilePath), status: 'ingested' };
                }
                return { file: path.basename(logFilePath), status: 'parsed_no_data' };
            } catch (error) {
                console.error(`Error processing file ${logFilePath}:`, error);
                return { file: path.basename(logFilePath), status: 'failed', error: (error as Error).message };
            }
        });

        const results = await Promise.all(tasks);

        return {
            snapshotId: snapshot.id,
            device: { id: device.id, name: device.hostname, status: 'processed' },
            files: results
        };
    }
}