import {inject, injectable} from "inversify";
import {TYPES} from "../../types";
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";
import {Snapshot} from "../../models/Snapshot";

@injectable()
export class AIPromptBuilder {
    private promptParts: string[] = [];

    constructor(
        @inject(TYPES.SnapshotRepository) private readonly snapshotRepository: ISnapshotRepository,
    ) {
    }

    public withSystemInstruction(instruction: string): this {
        this.promptParts = [];
        this.promptParts.push(`System Instruction: ${instruction}`);
        return this;
    }

    public async withSnapshotDetails(snapshotId: number): Promise<this>
    {
        let snapshot: Snapshot | null = await this.snapshotRepository.getSnapshotWithAllData(snapshotId);

        if (!snapshot) {
            throw new Error(`No snapshot with id ${snapshotId}`);
        }

        this.promptParts.push("Current state of the system in JSON: " + JSON.stringify(snapshot));

        return this;
    }

    public withEnding(ending: string): this {
        this.promptParts.push(ending);
        return this;
    }

    public build(): string {
        return this.promptParts.join("\n");
    }
}