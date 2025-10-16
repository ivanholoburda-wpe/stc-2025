import fs from "fs/promises";
import path from "path";
import type {DataSource, DataSource as TypeOrmDataSource} from "typeorm";
import {Snapshot} from "../../models/Snapshot";
import {Device} from "../../models/Device";
import {ParsedDtoIngestor} from "../ingestion/ParsedDtoIngestor";
import {inject} from "inversify";
import {TYPES} from "../../types";
import {LogsParserService} from "./LogsParserService";

export class RootFolderParsingService {
    constructor(
        @inject(TYPES.DataSource) private dataSource: DataSource,
        @inject(TYPES.LogsParserService) private parser: LogsParserService,
    ) {
    }

    async run(rootFolderPath: string): Promise<any> {
        const snapshotRepo = this.dataSource.getRepository(Snapshot);
        const deviceRepo = this.dataSource.getRepository(Device);

        const snapshot = snapshotRepo.create({root_folder_path: rootFolderPath});
        await snapshotRepo.save(snapshot);

        const entries = await fs.readdir(rootFolderPath, {withFileTypes: true});
        const deviceFolders = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(rootFolderPath, entry.name));

        const tasks = deviceFolders.map(async (deviceFolderAbsPath: string) => {
            const folderName = path.basename(deviceFolderAbsPath);

            let device = await deviceRepo.findOne({where: {hostname: folderName}});

            if (!device) {
                device = deviceRepo.create({
                    hostname: folderName,
                    firstSeenSnapshot: snapshot
                });
                await deviceRepo.save(device);
            } else {
                device.firstSeenSnapshot = snapshot;
                await deviceRepo.save(device);
            }

            const logFilePath = await this.resolveLogFile(deviceFolderAbsPath);
            const options = {maxErrors: 200, continueOnError: true, validateResults: true, logLevel: "info"};
            const results = await this.parser.parse(logFilePath, options);

            const ingestor = new ParsedDtoIngestor(this.dataSource);
            await ingestor.ingest(results, snapshot, device);

            return {folder: folderName, deviceId: device.id};
        });

        const devices = await Promise.all(tasks);
        return {snapshotId: snapshot.id, devices};
    }

    private async resolveLogFile(deviceFolderAbsPath: string): Promise<string> {
        const preferred = [
            "huawei_config.txt",
            "config.txt",
            "logs.txt",
            "output.txt",
            "device.log",
        ];
        const files = await fs.readdir(deviceFolderAbsPath);
        const preferredHit = preferred
            .map((n) => path.join(deviceFolderAbsPath, n))
            .find((full) => files.includes(path.basename(full)));
        if (preferredHit) return preferredHit;

        const stats = await Promise.all(
            files.map(async (f: string) => ({
                name: f,
                full: path.join(deviceFolderAbsPath, f),
                st: await fs.stat(path.join(deviceFolderAbsPath, f))
            }))
        );
        const textish = stats.filter((s: any) => s.st.isFile() && (s.name.endsWith(".txt") || s.name.endsWith(".log")));
        if (textish.length > 0) {
            textish.sort((a: any, b: any) => b.st.size - a.st.size);
            return textish[0].full;
        }

        const any = stats.find((s: any) => s.st.isFile());
        if (!any) throw new Error(`No log files found in ${deviceFolderAbsPath}`);
        return any.full;
    }
}

export default RootFolderParsingService;