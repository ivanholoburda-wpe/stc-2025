import fs from "fs/promises";
import path from "path";
import { AppDataSource } from "../database/data-source";
import type { DataSource as TypeOrmDataSource } from "typeorm";
import { Snapshot } from "../models/Snapshot";
import { Device } from "../models/Device";
import { ParsedDtoIngestor } from "./ingestion/ParsedDtoIngestor";

// CommonJS export from parser package
// eslint-disable-next-line @typescript-eslint/no-var-requires
// @ts-ignore
const ParserEntrypoint = require("../models/parser");
// eslint-disable-next-line @typescript-eslint/no-var-requires
// @ts-ignore
const LogsParserService = ParserEntrypoint?.LogsParserService || require("../models/parser/services/LogsParserService");

export class RootFolderParsingService {
  constructor(private readonly dataSource: TypeOrmDataSource = AppDataSource) {}

  async run(rootFolderPath: string): Promise<{ snapshotId: number; devices: Array<{ folder: string; deviceId: number }> }> {
    const snapshotRepo = this.dataSource.getRepository(Snapshot);
    const deviceRepo = this.dataSource.getRepository(Device);

    // 1) Create snapshot at the very beginning
    const snapshot = snapshotRepo.create({ root_folder_path: rootFolderPath });
    await snapshotRepo.save(snapshot);

    // 2) Enumerate device folders
    const entries = await fs.readdir(rootFolderPath, { withFileTypes: true } as any);
    const deviceFolders = (entries as Array<{ isDirectory: () => boolean; name: string }>)
      .filter((e) => e.isDirectory())
      .map((e) => path.join(rootFolderPath, e.name));

    // 3) For each device folder: create Device immediately (hostname = folder name), then parse in parallel
    const tasks = deviceFolders.map(async (deviceFolderAbsPath: string) => {
      const folderName = path.basename(deviceFolderAbsPath);

      // Upsert device by hostname (folder name)
      let device = await deviceRepo.findOne({ where: { hostname: folderName } });
      if (!device) {
        device = deviceRepo.create({ hostname: folderName, firstSeenSnapshot: snapshot });
        await deviceRepo.save(device);
      }

      const logFilePath = await this.resolveLogFile(deviceFolderAbsPath);
      const parser = new LogsParserService();
      const options = { maxErrors: 200, continueOnError: true, validateResults: true, logLevel: "info" };
      const results = await parser.parse(logFilePath, options);

      // 4) Ingest parsed DTO into DB
      const ingestor = new ParsedDtoIngestor(this.dataSource);
      await ingestor.ingest(results, snapshot, device);

      return { folder: folderName, deviceId: device.id };
    });

    const devices = await Promise.all(tasks);
    return { snapshotId: snapshot.id, devices };
  }

  private async resolveLogFile(deviceFolderAbsPath: string): Promise<string> {
    // Heuristic: prefer common filenames, else pick largest .txt/.log, else first file
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

    // Fallback: largest .txt/.log
    const stats = await Promise.all(
      files.map(async (f: string) => ({ name: f, full: path.join(deviceFolderAbsPath, f), st: await fs.stat(path.join(deviceFolderAbsPath, f)) }))
    );
    const textish = stats.filter((s: any) => s.st.isFile() && (s.name.endsWith(".txt") || s.name.endsWith(".log")));
    if (textish.length > 0) {
      textish.sort((a: any, b: any) => b.st.size - a.st.size);
      return textish[0].full;
    }

    // Last resort: any file
    const any = stats.find((s: any) => s.st.isFile());
    if (!any) throw new Error(`No log files found in ${deviceFolderAbsPath}`);
    return any.full;
  }
}

export default RootFolderParsingService;


