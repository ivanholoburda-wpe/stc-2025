export interface ParsingService {
    run(inputPath: string): Promise<any>;
}