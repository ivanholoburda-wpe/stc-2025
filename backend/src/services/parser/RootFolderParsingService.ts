import fs from "fs/promises";
import path from "path";
import type { DataSource } from "typeorm";
import { Snapshot } from "../../models/Snapshot";
import { Device } from "../../models/Device";
import { ParsedDtoIngestor } from "../ingestion/ParsedDtoIngestor";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { LogsParserService } from "./LogsParserService";

@injectable()
export class RootFolderParsingService {
    constructor(
        @inject(TYPES.DataSource) private dataSource: DataSource,
        @inject(TYPES.LogsParserService) private parser: LogsParserService,
    ) {}

    async run(rootFolderPath: string): Promise<any> {
        // Validate the provided path before creating a snapshot
        if (!rootFolderPath || typeof rootFolderPath !== 'string') {
            throw new Error('Invalid root folder path');
        }
        const stat = await fs.stat(rootFolderPath).catch(() => null as any);
        if (!stat || !stat.isDirectory()) {
            throw new Error('Selected path is not a directory or does not exist');
        }

        const snapshotRepo = this.dataSource.getRepository(Snapshot);
        const deviceRepo = this.dataSource.getRepository(Device);

        const snapshot = snapshotRepo.create({ root_folder_path: rootFolderPath });
        await snapshotRepo.save(snapshot);

        const entries = await fs.readdir(rootFolderPath, { withFileTypes: true });
        const deviceFolders = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(rootFolderPath, entry.name));

        const tasks = deviceFolders.map(async (deviceFolderAbsPath: string) => {
            const folderName = path.basename(deviceFolderAbsPath);
            let device = await deviceRepo.findOne({ where: { folder_name: folderName } });

            if (!device) {
                device = deviceRepo.create({
                    folder_name: folderName,
                    hostname: folderName,
                    firstSeenSnapshot: snapshot
                });
                await deviceRepo.save(device);
            }

            const logFilePaths = await this.resolveLogFiles(deviceFolderAbsPath);
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

    private async resolveLogFiles(deviceFolderAbsPath: string): Promise<string[]> {
        const files = await fs.readdir(deviceFolderAbsPath);

        const stats = await Promise.all(
            files.map(async (f: string) => ({
                name: f,
                full: path.join(deviceFolderAbsPath, f),
                st: await fs.stat(path.join(deviceFolderAbsPath, f))
            }))
        );

        const textishFiles = stats
            .filter((s: any) => s.st.isFile() && (s.name.endsWith(".txt") || s.name.endsWith(".log")))
            .sort((a: any, b: any) => b.st.size - a.st.size);

        return textishFiles.map(f => f.full);
    }
}

export default RootFolderParsingService;

