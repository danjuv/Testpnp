"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let defsBzl = `def pinned_yarn_install():\n`;
function mkdirp(p) {
    if (!fs.existsSync(p)) {
        mkdirp(path.dirname(p));
        fs.mkdirSync(p);
    }
}
function writeFileSync(p, content) {
    mkdirp(path.dirname(p));
    fs.writeFileSync(p, content);
}
function generateBuildFile(pkg) {
    const result = path.dirname(pnp.resolveRequest(pkg, "."));
    const workspacePkg = pkg.replace("-", "_");
    const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")
node_module_library(
  name = "${pkg}",
  # direct sources listed for strict deps support
  srcs = [":${pkg}__files"],
  # flattened list of direct and transitive dependencies hoisted to root by the package manager
  deps = [
      "//${pkg}:${pkg}__files",
  ],
)
filegroup(
  name = "${pkg}__files",
  srcs = ["@${workspacePkg}//:index.js"]
)  
  `;
    writeFileSync(`${pkg}/BUILD.bazel`, contents);
    const bzlContents = `  native.new_local_repository(
    name = "${workspacePkg}",
    path = "${result}",
    build_file_content = """package(default_visibility = ["//visibility:public"])
filegroup(
  name = "${pkg}_files",
  srcs = glob(["*"]),
)
""",
)\n`;
    defsBzl += bzlContents;
}
async function main() {
    const pkgs = ["is-number", "is-buffer", "nock"];
    const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
  ".pnp.js",
  "package.json",
])
    `;
    writeFileSync(`BUILD.bazel`, contents);
    // const packageJson = require("package.json")
    pkgs.forEach(pkg => generateBuildFile(pkg));
    writeFileSync(`defs.bzl`, defsBzl);
}
const pnpFile = "./.pnp.js";
const pnp = require(pnpFile);
main();
