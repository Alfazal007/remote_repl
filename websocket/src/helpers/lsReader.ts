import { promises as fs } from "fs";
import path from "path";

export type DirEntry = {
    name: string;
    type: "file" | "dir";
};

export async function listFilesAndDirs(
    dirPath: string
): Promise<DirEntry[]> {
    let fullPath = path.join(__dirname + "/../data", dirPath)
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    return entries
        .filter((e) => e.isFile() || e.isDirectory())
        .map((e) => ({
            name: e.name,
            type: e.isDirectory() ? "dir" : "file",
        }));
}
