import fs from "fs/promises";
import { File } from "gitdiff-parser";
import path from "path";
import util from "util";

interface Affected {
    dependencies: string[];
    path: string;
}

const getContentMatch = (content: string) => {
    const matches = content.match(
        /export\s(?:const|interface|type|default)\s([^\s]*)/i
    );

    if (matches && matches.length > 1) {
        return matches[1];
    }
};

export const getExportedDependencies = (diff: File[]) => {
    const exportedDependencies: string[] = [];

    diff.forEach(({ hunks }) => {
        hunks.forEach(({ changes, content }) => {
            const match = getContentMatch(content);

            if (match) {
                exportedDependencies.push(match);
            }

            changes.forEach(({ type, content }) => {
                if (type !== "normal") {
                    const match = getContentMatch(content);

                    if (match) {
                        exportedDependencies.push(match);
                    }
                }
            });
        });
    });

    return [...new Set(exportedDependencies)];
};

export const getAffectedPaths = async (
    sourceCodePath: string,
    searchStrings: string[]
) => {
    let paths: Affected[] = [];

    const files = (await fs.readdir(sourceCodePath).catch((err) => {
        if (err) {
            console.error(`Error reading directory ${sourceCodePath}: ${err}`);
        }
    })) as string[];

    await Promise.all(
        files.map(async (fileName) => {
            const filePath = path.join(sourceCodePath, fileName);

            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                const dirPaths = await getAffectedPaths(
                    filePath,
                    searchStrings
                );

                paths = [...paths, ...dirPaths];
            } else {
                const fileContent = (await fs
                    .readFile(filePath, "utf8")
                    .catch((err) => {
                        console.error(`Error reading file ${filePath}: ${err}`);
                    })) as string;

                const includedStrings = searchStrings.filter((str) =>
                    fileContent.includes(str)
                );

                if (includedStrings.length > 0) {
                    paths.push({
                        dependencies: includedStrings,
                        path: filePath,
                    });
                }
            }
        })
    );

    return paths;
};

export const summarizeAffectedPaths = (
    affectedPaths: Affected[],
    filterPattern: string
) => [
    ...new Set(
        affectedPaths
            .map(({ path }) => {
                if (filterPattern) {
                    const matches = path.match(new RegExp(filterPattern));

                    if (matches && matches.length > 0 && matches[1]) {
                        return matches[1];
                    }

                    return null;
                }

                return path;
            })
            .filter(Boolean)
    ),
];

export const consoleLog = (value: any, isEnabled = true) => {
    if (isEnabled) {
        console.log(
            util.inspect(value, {
                showHidden: false,
                depth: null,
                colors: true,
            })
        );
    }
};
