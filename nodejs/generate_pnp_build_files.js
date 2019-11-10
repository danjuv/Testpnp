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
let stream;
const pnpFile = "./.pnp.js";
const pnp = require(pnpFile);
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
function generateBuildFiles(pkg) {
    const result = path.dirname(pnp.resolveRequest(pkg, "."));
    const deps = Object.keys(require(path.join(result, "package.json")).dependencies || {});
    const workspacePkg = pkg.replace("-", "_");
    function addPackageToDefs(pkg) {
        stream.write(`  native.new_local_repository(
      name = "${pkg.replace(/-/g, "_")}",
      path = "${result}",
      build_file_content = """package(default_visibility = ["//visibility:public"])
filegroup(
  name = "${pkg}_files",
  srcs = glob(["*"])
)
""",
  )\n`);
    }
    [pkg].concat(deps).forEach(dep => {
        addPackageToDefs(dep);
        createBuildFile(dep);
    });
    function createBuildFile(pkg) {
        const depsStr = deps.reduce((total, curr) => {
            total += `\"//${curr}:${curr}__files\",\n`;
            return total;
        }, "");
        const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")
node_module_library(
  name = "${pkg}",
  # direct sources listed for strict deps support
  srcs = [":${pkg}__files"],
  # flattened list of direct and transitive dependencies hoisted to root by the package manager
  deps = [
      ${depsStr}
  ],
)
filegroup(
  name = "${pkg}__files",
  srcs = ["@${pkg.replace(/-/g, "_")}//:index.js"]
)  `;
        writeFileSync(`${pkg}/BUILD.bazel`, contents);
    }
    createBuildFile(pkg);
}
async function main() {
    stream = fs.createWriteStream("./defs.bzl");
    stream.write("def pinned_yarn_install():\n");
    const deps = Object.keys(require("./package.json").dependencies);
    const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
  ".pnp.js",
  "package.json",
])
    `;
    writeFileSync(`BUILD.bazel`, contents);
    deps.forEach(dep => generateBuildFiles(dep));
    stream.close();
}
main();
