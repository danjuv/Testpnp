import { promises as fsp } from "fs";
import * as path from "path";

async function writeFile(p: string, content: string) {
  await fsp.mkdir(path.dirname(p), {recursive: true})
  return fsp.writeFile(p, content);
}

function createBuildFile(packagePath: string) {
  const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")

filegroup(
    name = "${packagePath}",
    srcs = [] # we dont care about the actual content, we want a list of dependencies to modify the pnp file around
)
`;

  return writeFile(`${packagePath}/BUILD.bazel`, contents);
}

async function main(workspacePath: string) {
  const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
    ".pnp.js",
    "package.json",
])`;
  const packageJson = require(path.join(workspacePath, "package.json"));
  await Promise.all(
    [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies"
    ].map(d => {
      return Promise.all(
        Object.keys(packageJson[d] || {})
          .map(createBuildFile)
          .concat([writeFile("BUILD.bazel", contents)])
      );
    })
  );
}

main(process.argv[2]);
