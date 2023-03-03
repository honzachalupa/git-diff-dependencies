import minimist from "minimist";
import path from "path";
import { diffParser, initializeGit } from "./git.js";
import {
    consoleLog,
    getAffectedPaths,
    getExportedDependencies,
    summarizeAffectedPaths,
} from "./utils.js";

/* Inputs:
    repositoryPath: ../ocp-backoffice
    commitToCompare: 4aec456
    filterPattern: modules/(.+?/pages/.+?)/
 */

const { repositoryPath, commitToCompare, filterPattern } = minimist(
    process.argv.slice(2)
);

if (!repositoryPath) {
    throw new Error("Argument repositoryPath is missing.");
}

const sourceCodePath = path.join(repositoryPath, "src");

const git = initializeGit(repositoryPath);

git.diff(commitToCompare && [commitToCompare]).then(async (raw) => {
    const diff = diffParser.parse(raw);

    const exportedDependencies = getExportedDependencies(diff);

    const affectedPaths = await getAffectedPaths(
        sourceCodePath,
        exportedDependencies
    );

    const summarized = summarizeAffectedPaths(affectedPaths, filterPattern);

    consoleLog({
        diff,
        exportedDependencies,
        affectedPaths,
        summarized,
    });
});
