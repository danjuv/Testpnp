import * as fs from "fs";
import * as path from "path";

let defsBzl  = `def pinned_yarn_install():\n`

function mkdirp(p: string) {
  if (!fs.existsSync(p)) {
    mkdirp(path.dirname(p));
    fs.mkdirSync(p);
  }
}
function writeFileSync(p: string, content: string) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, content);
}

function generatePackageBuildFile(pkg: string, workspacePkg: string) {
  return `package(default_visibility = ["//visibility:public"])
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
}

function generateLocalRepository(path: string, pkg: string, workspacePkg: string) {
  const bzlContents = `  native.new_local_repository(
    name = "${workspacePkg}",
    path = "${path}",
    build_file_content = """package(default_visibility = ["//visibility:public"])
filegroup(
  name = "${pkg}_files",
  srcs = glob(["*"]),
)
""",
)\n`

return bzlContents;
}

function generateBuildFile(pkg: string) {
  const result = path.dirname(pnp.resolveRequest(pkg, "."));
  const workspacePkg = pkg.replace("-", "_")
  const contents = generatePackageBuildFile(pkg, workspacePkg)
  writeFileSync(`${pkg}/BUILD.bazel`, contents);

  const bzlContents = generateLocalRepository(result, pkg, workspacePkg)

  defsBzl += bzlContents
}


async function main() {
  const pkgs = ["nock"];
  
  const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
  ".pnp.js",
  "package.json",
])
    `;
  writeFileSync(`BUILD.bazel`, contents);
  // const packageJson = require("package.json")
  pkgs.forEach(pkg => generateBuildFile(pkg))
  writeFileSync(`defs.bzl`, defsBzl)
}

const pnpFile = "./.pnp.js";
const pnp = require(pnpFile);
main();
