import {inject, injectable} from "inversify";
import {TYPES} from "../../types";
import {AIPromptBuilder} from "./AIPromptBuilder";
import {IAIClient} from "./client/IAIClient";

@injectable()
export class AIAgent {
    constructor(
        @inject(TYPES.AIPromptBuilder) private aiPromptBuilder: AIPromptBuilder,
        @inject(TYPES.AIClient) private aiClient: IAIClient,
    ) {
    }

    public async analyzeSnapshot(snapshotId: number): Promise<string> {
        const asyncBuilderChain = this.aiPromptBuilder
            .withSystemInstruction("Imagine you're a senior networking engineer. Here's the data about network state: ")
            .withSnapshotDetails(snapshotId);

        const builder = await asyncBuilderChain;

        const prompt = builder
            .withEnding("Please provide a summary, search for anomalies, etc.")
            .build();

        return await this.aiClient.sendPrompt(prompt);
    }
}