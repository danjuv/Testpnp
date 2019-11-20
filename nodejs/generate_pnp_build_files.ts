import * as fs from "fs";
import * as path from "path";
import * as lockfile from "@yarnpkg/lockfile";

interface PackageInformation {
  packageLocation: string;
  packageDependencies: Map<string, string>;
}


const workspacePath = process.argv.slice(2)[0];

const packageJson = require(path.join(workspacePath, "package.json"));
const pnp = require( path.join(workspacePath, "./.pnp.js"));
const yarnLock = fs.readFileSync(path.join(workspacePath, "./yarn.lock"), "utf8");


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

function findVersion(dep: string) {
  dep = dep.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(?<="?${dep}.*"?:\\n\\s+version\\s)"\\d+.\\d+.\\d+"`);
  const result = yarnLock.match(regex);
  return result ? result[0].replace(/"/g, "") : null;
}

function addPackageToDefs(pkg: string, location: string, stream: fs.WriteStream) {
  stream.write(`  native.new_local_repository(
    name = "${pkg.replace(/-/g, "_")}",
    path = "${location}",
    build_file_content = """package(default_visibility = ["//visibility:public"])
filegroup(
name = "${pkg}_files",
srcs = glob(["*"])
)
""",
)\n`);
}

function createBuildFile(pkg: string, pkgInfo: PackageInformation) {
  const depsStr = [pkg].reduce((total, curr) => {
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
srcs = ["@${pkg.replace(/-/g, "_")}//:package.json"]
)  `;

  writeFileSync(`${pkg}/BUILD.bazel`, contents);
}

async function processDependencies(deps: string[], type: "dependencies" | "devDependencies", stream: fs.WriteStream)
{
  const flattenedDeps: Set<PackageInformation> = new Set();
  deps.forEach((key: string) => {
    const version = findVersion(`${key}@${packageJson[type][key]}`);
    const pkgInfo: PackageInformation = pnp.getPackageInformation({
      name: key,
      reference: version
    });

    addPackageToDefs(key, pkgInfo.packageLocation, stream);
    createBuildFile(key, pkgInfo);
  })
}

async function main() {
  const stream: fs.WriteStream = fs.createWriteStream("./defs.bzl");

  stream.write("def pinned_yarn_install():\n");
  const packageJson = require(path.join(workspacePath, "package.json"));
  const dependencies = Object.keys(packageJson.dependencies || {})
  const devDependencies = Object.keys(packageJson.dependencies || {})
  processDependencies(dependencies, "dependencies", stream)
  processDependencies(devDependencies, "devDependencies", stream)
  stream.close();

  const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
  ".pnp.js",
  "package.json",
])`;``
  writeFileSync(`BUILD.bazel`, contents);
  
}

main();
