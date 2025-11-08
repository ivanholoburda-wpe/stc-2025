import fs from "fs/promises";
import path from "path";
import type { DataSource } from "typeorm";
import { Snapshot } from "../../models/Snapshot";
import { Device } from "../../models/Device";
import { ParsedDtoIngestor } from "../ingestion/ParsedDtoIngestor";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { LogsParserService } from "./LogsParserService";
import { ParsingService } from "./ParsingService";
import {resolveLogFiles} from "./helpers";
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";
import {IDeviceRepository} from "../../repositories/DeviceRepository";

@injectable()
export class RootFolderParsingService implements ParsingService {
    constructor(
        @inject(TYPES.SnapshotRepository) private snapshotRepo: ISnapshotRepository,
        @inject(TYPES.DeviceRepository) private deviceRepo: IDeviceRepository,
        @inject(TYPES.LogsParserService) private parser: LogsParserService,
    ) {}

    async run(rootFolderPath: string): Promise<any> {
        if (!rootFolderPath || typeof rootFolderPath !== 'string') {
            throw new Error('Invalid root folder path');
        }
        const stat = await fs.stat(rootFolderPath).catch(() => null as any);
        if (!stat || !stat.isDirectory()) {
            throw new Error('Selected path is not a directory or does not exist');
        }

        const snapshot = await this.snapshotRepo.create({ root_folder_path: rootFolderPath });

        const entries = await fs.readdir(rootFolderPath, { withFileTypes: true });
        const deviceFolders = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(rootFolderPath, entry.name));

        const tasks = deviceFolders.map(async (deviceFolderAbsPath: string) => {
            const folderName = path.basename(deviceFolderAbsPath);
            let device = await this.deviceRepo.findByFolderName(folderName);

            if (!device) {
                device = await this.deviceRepo.create({
                    folder_name: folderName,
                    hostname: folderName,
                    firstSeenSnapshot: snapshot
                });
            }

            const logFilePaths = await resolveLogFiles(deviceFolderAbsPath);
            if (logFilePaths.length === 0) {
                console.warn(`No log files found in ${deviceFolderAbsPath}, skipping device.`);
                return { folder: folderName, status: 'skipped' };
            }

            const ingestor = new ParsedDtoIngestor();
            const options = { maxErrors: 200, continueOnError: true, validateResults: true, logLevel: "info" };

            for (const logFilePath of logFilePaths) {
                console.log(`Parsing file: ${logFilePath}`);
                const results = await this.parser.parse(logFilePath, options);

                if (results.success && results.data && results.data.length > 0) {
                    await ingestor.ingest(results, snapshot, device);
                }
            }

            return { folder: folderName, deviceId: device.id, status: 'processed' };
        });

        const devices = await Promise.all(tasks);
        return { snapshotId: snapshot.id, devices };
    }
}

export default RootFolderParsingService;

