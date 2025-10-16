import { injectable, inject } from "inversify";
import { TYPES } from "../../../types";
import { IConfigurationService } from "../../config/ConfigurationService";

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

@injectable()
export class GeminiClient {
    private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    constructor(
        @inject(TYPES.ConfigurationService) private configurationService: IConfigurationService,
    ) {}

    public async sendPrompt(prompt: string): Promise<string> {
        const isOffline = await this.configurationService.isOfflineMode();
        if (isOffline) {
            console.log("AI Client: Offline mode is active. Returning mock response.");
            return "Application is in offline mode. AI analysis is unavailable.";
        }

        const apiKey = await this.configurationService.getAiModelKey();
        if (!apiKey) {
            console.error("AI Client: Gemini API key is not set.");
            throw new Error("Gemini API key is not configured. Please set it in the application settings.");
        }

        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': apiKey,
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("AI Client: Gemini API responded with an error.", errorBody);
                throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody?.error?.message || 'Unknown error'}`);
            }

            const data: GeminiResponse = await response.json();

            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                console.error("AI Client: Could not extract text from Gemini response.", data);
                throw new Error("Invalid response structure from Gemini API.");
            }

            return generatedText;

        } catch (error: any) {
            console.error("AI Client: Failed to send prompt to Gemini.", error);
            throw new Error(`Failed to communicate with Gemini API: ${error.message}`);
        }
    }
}

