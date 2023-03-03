import diffParser from "gitdiff-parser";
import path from "path";
import { simpleGit } from "simple-git";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeGit = (repositoryPath: string) => {
    const baseDir = path.join(__dirname, repositoryPath);

    return simpleGit({ baseDir });
};

export { diffParser };
