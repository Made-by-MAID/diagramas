import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const FORBIDDEN_PACKAGES = ["gifski", "@resvg/resvg-js", "playwright", "puppeteer", "chromium"];
const ARROW_IN_CONST =
  /\b(const|let|var)\s+\w+(\s*:[^=\n]+)?\s*=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:[^=\n]+)?=>/;
const FUNCTION_IN_CONST = /\b(const|let|var)\s+\w+(\s*:[^=\n]+)?\s*=\s*(async\s+)?function\b/;
const REQUIRED_FILES = [
  "bun.lock",
  "LICENSE",
  "NOTICE",
  "README.md",
  "docs/licenses.md",
  "docs/roadmap.md",
  "docs/prototype.md",
  "docs/adr/0001-stack-and-structure.md",
  "docs/adr/0002-browserless-renderer.md",
  "docs/adr/0003-svg-allowlist.md",
  "docs/adr/0004-text-measurement.md",
];

function sourceFiles(directory: string): readonly string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return path.endsWith(".ts") ? [path] : [];
  });
}

function checkVersions(problems: string[]): void {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  for (const [name, version] of Object.entries(dependencies)) {
    if (!EXACT_VERSION.test(version as string)) {
      problems.push(`package.json: ${name} has a version that is not exact: ${version}`);
    }
    if (FORBIDDEN_PACKAGES.includes(name)) {
      problems.push(`package.json: ${name} is forbidden`);
    }
  }
  const inventory = readFileSync("docs/licenses.md", "utf8");
  for (const name of Object.keys(dependencies)) {
    if (!inventory.includes(`\`${name}\``)) {
      problems.push(`docs/licenses.md: ${name} is missing from the license inventory`);
    }
  }
  if (!/^\s*exact\s*=\s*true\s*$/m.test(readFileSync("bunfig.toml", "utf8"))) {
    problems.push("bunfig.toml: [install] exact = true is missing");
  }
  const lock = readFileSync("bun.lock", "utf8");
  for (const name of FORBIDDEN_PACKAGES) {
    if (lock.includes(`"${name}@`)) {
      problems.push(`bun.lock: ${name} is forbidden`);
    }
  }
}

function checkFunctionStyle(problems: string[]): void {
  for (const path of ["src", "bin", "scripts", "test"].flatMap(sourceFiles)) {
    if (path === "scripts/check-structure.ts") {
      continue;
    }
    readFileSync(path, "utf8")
      .split("\n")
      .forEach((line, index) => {
        if (ARROW_IN_CONST.test(line) || FUNCTION_IN_CONST.test(line)) {
          problems.push(`${path}:${index + 1}: declare it with function, not inside a const`);
        }
      });
  }
}

const problems: string[] = REQUIRED_FILES.filter((path) => !existsSync(path)).map(
  (path) => `${path} is missing`,
);
if (problems.length === 0) {
  checkVersions(problems);
}
checkFunctionStyle(problems);

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("structure: ok\n");
