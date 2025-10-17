import {inject, injectable} from "inversify";
import {TYPES} from "../../types";
import {AIPromptBuilder} from "./AIPromptBuilder";
import {IAIClient} from "./client/IAIClient";
import {IConfigurationService} from "../config/ConfigurationService";

@injectable()
export class AIAgent {
    constructor(
        @inject(TYPES.AIPromptBuilder) private aiPromptBuilder: AIPromptBuilder,
        @inject(TYPES.AIClient) private aiClient: IAIClient,
        @inject(TYPES.ConfigurationService) private configurationService: IConfigurationService,
    ) {
    }

    public async analyzeSnapshot(snapshotId: number, additionalInformation: string): Promise<string> {
        const systemInstruction = await this.configurationService.getAiPromptStart();

        const asyncBuilderChain = this.aiPromptBuilder
            .withSystemInstruction(systemInstruction)
            .withSnapshotDetails(snapshotId);

        const builder = await asyncBuilderChain;

        const prompt = builder
            .withEnding(additionalInformation)
            .build();

        return await this.aiClient.sendPrompt(prompt);
    }
}