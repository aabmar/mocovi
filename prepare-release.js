const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "package.json");
const distPkgPath = path.join(__dirname, "dist", "package.json");

// Read and parse package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// Adjust fields for release
pkg.main = "index.js"; // compiled js entry point
pkg.types && (pkg.types = "index.d.ts"); // if type declarations are needed
delete pkg.scripts;
delete pkg.devDependencies;

// Write updated package.json to dist/
fs.writeFileSync(distPkgPath, JSON.stringify(pkg, null, 2));
console.log("Prepared release package.json in dist/");
