import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from 'url';
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = join(__dirname, "package.json");
const distPkgPath = join(__dirname, "dist", "package.json");

// Read and parse package.json
const pkg = JSON.parse(await readFile(pkgPath, "utf8"));

// Adjust fields for release
pkg.main = "index.js"; // compiled js entry point
pkg.types && (pkg.types = "index.d.ts"); // if type declarations are needed
delete pkg.scripts;
delete pkg.devDependencies;

// Write updated package.json to dist/
await writeFile(distPkgPath, JSON.stringify(pkg, null, 2));
console.log("Prepared release package.json in dist/");
