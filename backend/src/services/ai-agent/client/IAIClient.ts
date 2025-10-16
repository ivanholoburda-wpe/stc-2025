export interface IAIClient {
    sendPrompt(prompt: string): Promise<string>;
}