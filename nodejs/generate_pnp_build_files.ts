import * as fs from "fs";
import * as path from "path";

interface PackageInformation {
  packageName: string;
  packageLocation: string;
  packageDependencies: Map<string, string>;
}

const workspacePath = process.argv.slice(2)[0];

const packageJson = require(path.join(workspacePath, "package.json"));
const pnp = require(path.join(workspacePath, "./.pnp.js"));
const yarnLock = fs.readFileSync(
  path.join(workspacePath, "./yarn.lock"),
  "utf8"
);

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

function createBuildFile(pkg: string) {
  const depsStr = [pkg].reduce((total, curr) => {
    total += `\"//${curr}:${curr}__files\",\n`;
    return total;
  }, "");

  const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")

filegroup(
name = "${pkg}",
srcs = []
)  `;

  writeFileSync(`${pkg}/BUILD.bazel`, contents);
}

async function processDependencies(
  deps: string[],
  type: "dependencies" | "devDependencies",
  stream: fs.WriteStream
): Promise<Set<string>> {
  const flattenedDeps: Set<string> = new Set();
  deps.forEach((key: string) => {
    // loop over transitive dependencies here
    flattenedDeps.add(key);
  });
  return flattenedDeps;
}

async function main() {
  const stream: fs.WriteStream = fs.createWriteStream("./defs.bzl");

  stream.write("def pinned_yarn_install():\n");
  const packageJson = require(path.join(workspacePath, "package.json"));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.dependencies || {});
  const flattenedDeps = await processDependencies(dependencies, "dependencies", stream);
  
  flattenedDeps.forEach(createBuildFile)

  processDependencies(devDependencies, "devDependencies", stream);
  stream.close();

  const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
  ".pnp.js",
  "package.json",
])`;
  ``;
  writeFileSync(`BUILD.bazel`, contents);
}

main();
