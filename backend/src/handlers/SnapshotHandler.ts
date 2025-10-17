import {injectable, inject} from "inversify";
import {ISnapshotService} from "../services/snapshot/SnapshotService";
import {TYPES} from "../types";
import {Snapshot} from "../models/Snapshot";
import {AIAgent} from "../services/ai-agent/AIAgent";

@injectable()
export class SnapshotHandler {
    constructor(
        @inject(TYPES.SnapshotService) private readonly snapshotService: ISnapshotService,
        @inject(TYPES.AIAgent) private readonly aiAgent: AIAgent,
    ) {
    }

    public async getAllSnapshots() {
        try {
            const snapshots: Snapshot[] = await this.snapshotService.getAllSnapshots();
            return {
                success: true,
                data: snapshots,
                count: snapshots.length,
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            }
        }
    }

    public async analyzeSnapshot(snapshotId: number, prompt: string)  {
        try {
            const result: string = await this.aiAgent.analyzeSnapshot(snapshotId, prompt);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                data: 'An error occurred, while trying to query the AI model',
                error: (error as Error).message
            }
        }
    }
}