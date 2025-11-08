import fs from "fs/promises";
import path from "path";

export async function resolveLogFiles(folderAbsPath: string): Promise<string[]> {
    const files = await fs.readdir(folderAbsPath);

    const stats = await Promise.all(
        files.map(async (f: string) => ({
            name: f,
            full: path.join(folderAbsPath, f),
            st: await fs.stat(path.join(folderAbsPath, f))
        }))
    );

    const textishFiles = stats
        .filter((s: any) => s.st.isFile() && (s.name.endsWith(".txt") || s.name.endsWith(".log")))
        .sort((a: any, b: any) => b.st.size - a.st.size);

    return textishFiles.map(f => f.full);
}