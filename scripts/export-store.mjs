import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// This tool belongs to the independent repository, never the Store extension.
// Export tracked product files only; no commits, pushes, or publication occur.
const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argument = process.argv[2];
if (!argument) throw new Error("Usage: npm run export:store -- /path/to/store-checkout/extensions/kero");
const destination = existsSync(argument) ? realpathSync(argument) : resolve(argument);
if (destination === source || destination.startsWith(source + sep)) {
  throw new Error("The Store destination must be outside the development repository.");
}
if (existsSync(destination) && readdirSync(destination).length > 0) {
  const manifest = join(destination, "package.json");
  if (!existsSync(manifest) || JSON.parse(readFileSync(manifest, "utf8")).name !== "kero") {
    throw new Error("Refusing to overwrite a non-Kero destination.");
  }
}
const rootFiles = new Set([
  ".gitignore",
  ".prettierrc.json",
  "CHANGELOG.md",
  "README.md",
  "THIRD_PARTY_NOTICES.md",
  "eslint.config.js",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
]);
const included = (file) => rootFiles.has(file) || /^(src|assets|metadata)\//.test(file);
if (existsSync(destination)) {
  const directoriesAndGenerated = new Set([
    "src",
    "assets",
    "metadata",
    "tests",
    "scripts",
    "LICENSE",
    "node_modules",
    "raycast-env.d.ts",
    ".git",
    ".DS_Store",
  ]);
  for (const name of readdirSync(destination)) {
    if (!rootFiles.has(name) && !directoriesAndGenerated.has(name)) {
      throw new Error(`Review unexpected destination entry before exporting: ${name}`);
    }
  }
}
const gitFiles = (args) =>
  execFileSync("git", ["ls-files", "-z", ...args], { cwd: source, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
if (gitFiles(["--others", "--exclude-standard"]).some(included)) {
  throw new Error("Track new product files before exporting them.");
}
const files = gitFiles([]).filter(included);
for (const file of files) {
  if (!lstatSync(join(source, file)).isFile()) throw new Error(`Expected a regular source file: ${file}`);
}
mkdirSync(destination, { recursive: true });
// These are the owned product directories or explicitly excluded development
// files. Other destination files are never recursively removed.
for (const name of ["src", "assets", "metadata", "tests", "scripts", "LICENSE"]) {
  rmSync(join(destination, name), { recursive: true, force: true });
}
for (const file of files) {
  const target = join(destination, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(source, file), target);
}
const manifestPath = join(destination, "package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
for (const name of Object.keys(manifest.scripts)) {
  if (name === "test" || name.startsWith("test:") || name === "export:store") delete manifest.scripts[name];
}
delete manifest.devDependencies.tsx;
manifest.scripts.publish = "npx @raycast/api@latest publish";
manifest.scripts.prepublishOnly =
  "node -e \"console.error('This is a Raycast extension, not an npm package. Use npm run publish for the Raycast Store.'); process.exit(1)\"";
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
const tsconfigPath = join(destination, "tsconfig.json");
const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
tsconfig.include = tsconfig.include.filter((pattern) => !pattern.startsWith("tests/"));
writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
execFileSync("npm", ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: destination,
  stdio: "inherit",
});
console.log(`Exported ${files.length} product files to ${destination}. Tests and root LICENSE remain in ${source}.`);
console.log("Review the destination diff, build/lint/audit it, then commit and push the Store branch separately.");
