import { promises as fs } from "fs";
import path from "path";

export async function readFileText(filePath: string): Promise<string> {
    let fullPath = path.join(__dirname + "/../data", filePath)
    return fs.readFile(fullPath, { encoding: "utf8" });
}
