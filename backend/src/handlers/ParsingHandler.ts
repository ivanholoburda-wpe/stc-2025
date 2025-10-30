import { injectable } from "inversify";
import RootFolderParsingService from "../services/parser/RootFolderParsingService";
import { inject } from "inversify";
import { TYPES } from "../types";
import { dialog } from "electron";

export interface ParsingResult {
    success: boolean,
    data: any,
    message: string,
  }

@injectable()
export class ParsingHandler {
    constructor(
        @inject(TYPES.RootFolderParsingService) private parsingService: RootFolderParsingService
    ) {
    }

    async startParsing(): Promise<ParsingResult> {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });

        // Treat cancel or empty selection as failure and do not start parsing
        const noSelection = !Array.isArray(filePaths) || filePaths.length === 0 || !filePaths[0];
        if (canceled || noSelection) {
            return {
                success: false,
                data: [],
                message: "Failed to select the root folder",
            };
        }

        const directory = filePaths[0];

        try {
            const result = await this.parsingService.run(directory);
            return {
                success: true,
                data: result,
                message: "Data parsed successfully",
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: (error as Error).message || "Failed to parse selected folder",
            };
        }
    }
}