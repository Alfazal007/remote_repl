import { promises as fs } from "fs";
import path from "path";

export async function overwriteFile(filePath: string, content: string) {
    let fullPath = path.join(__dirname + "/../data", filePath)
    await fs.writeFile(fullPath, content, { encoding: "utf8" });
}
