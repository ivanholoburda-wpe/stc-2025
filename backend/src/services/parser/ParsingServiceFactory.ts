import { ParsingService } from "./ParsingService";
import {inject, injectable} from "inversify";
import {TYPES} from "../../types";
import RootFolderParsingService from "./RootFolderParsingService";
import {DeviceFolderParsingService} from "./DeviceFolderParsingService";
import fs from "fs/promises";

export interface IParsingServiceFactory {
    getService(inputPath: string): Promise<ParsingService>;
}

@injectable()
export class ParsingServiceFactory implements IParsingServiceFactory {
    constructor(
        @inject(TYPES.RootFolderParsingService) private rootParser: RootFolderParsingService,
        @inject(TYPES.DeviceFolderParsingService) private deviceParser: DeviceFolderParsingService,
    ) {}

    async getService(inputPath: string): Promise<ParsingService> {
        if (!inputPath || typeof inputPath !== 'string') {
            throw new Error('Invalid input path provided.');
        }

        const stat = await fs.stat(inputPath).catch(() => null as any);
        if (!stat || !stat.isDirectory()) {
            throw new Error('Selected path is not a directory or does not exist.');
        }

        const entries = await fs.readdir(inputPath, { withFileTypes: true });

        const hasSubdirectories = entries.some(entry => entry.isDirectory());

        const hasLogFiles = entries.some(entry =>
            entry.isFile() && (entry.name.endsWith(".txt") || entry.name.endsWith(".log"))
        );

        if (hasSubdirectories) {
            return this.rootParser;
        }

        if (hasLogFiles) {
            return this.deviceParser;
        }

        throw new Error('The selected folder does not contain device folders nor log files.');
    }
}