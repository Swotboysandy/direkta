// Small development/CLI loader using the repository's installed TypeScript.
// No package downloads or remote code are involved.
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (mod, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  });
  mod._compile(outputText, filename);
};
